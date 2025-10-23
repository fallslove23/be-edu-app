import React, { useState, useEffect } from 'react';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import ExcelScheduleImporter from './ExcelScheduleImporter';

// 오프라인 집체교육 과정 개설 마법사
interface OfflineCourseWizardProps {
  onSave: (courseData: any) => Promise<void>;
  onCancel: () => void;
  availableSeries?: any[];
  existingCourses?: any[];
}

// 일차별 세션 정보
interface DailySession {
  id: string;
  day: number; // 1일차, 2일차...
  date: string; // 실제 날짜
  sessions: {
    id: string;
    startTime: string;
    endTime: string;
    subject: string; // 교육 주제
    instructorId: string;
    instructorName: string;
    room: string;
    materials: string[];
  }[];
}

// 강사 정보
interface Instructor {
  id: string;
  name: string;
  specialization: string; // 전문 분야
  phone?: string;
  email?: string;
}

// 과정 정보
interface CourseInfo {
  // 기본 정보
  seriesId: string;
  levelId: string;
  year: number;
  sessionNumber: number;
  courseName: string;
  
  // 운영 정보
  manager: {
    id: string;
    name: string;
  };
  
  // 일정 정보  
  totalDays: number; // 총 교육일수 (예: 10일)
  startDate: string;
  endDate: string;
  location: string;
  
  // 일차별 세션 계획
  dailySessions: DailySession[];
  
  // 강사진 정보
  instructors: Instructor[];
  
  // 수강 정보
  maxStudents: number;
  registrationStartDate: string;
  registrationEndDate: string;
  
  // 추가 정보
  notes: string;
  materials: string[]; // 공통 교재
}

const OfflineCourseWizard: React.FC<OfflineCourseWizardProps> = ({
  onSave,
  onCancel,
  availableSeries = [],
  existingCourses = []
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showExcelImporter, setShowExcelImporter] = useState(false);
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    seriesId: '',
    levelId: '',
    year: new Date().getFullYear(),
    sessionNumber: 1,
    courseName: '',
    manager: { id: '', name: '' },
    totalDays: 10,
    startDate: '',
    endDate: '',
    location: '',
    dailySessions: [],
    instructors: [],
    maxStudents: 30,
    registrationStartDate: '',
    registrationEndDate: '',
    notes: '',
    materials: []
  });

  const totalSteps = 5; // 기본정보 → 일정계획 → 강사배정 → 세션구성 → 최종확인

  // 선택된 시리즈와 레벨 정보
  const getSelectedSeries = () => {
    return availableSeries.find(s => s.id === courseInfo.seriesId);
  };

  const getSelectedLevel = () => {
    const series = getSelectedSeries();
    return series?.levels.find(l => l.id === courseInfo.levelId);
  };

  // 과정 코드 생성
  const generateCourseCode = () => {
    const series = getSelectedSeries();
    const level = getSelectedLevel();
    
    if (!series || !level) return '';
    
    const year = courseInfo.year;
    const sessionNumber = courseInfo.sessionNumber.toString().padStart(2, '0');
    
    return `${year}-${series.code}${level.code}-${sessionNumber}`;
  };

  // 교육일 자동 계산 및 설정
  const calculateTrainingDays = () => {
    if (!courseInfo.startDate || !courseInfo.totalDays) return [];
    
    const startDate = new Date(courseInfo.startDate);
    const days = [];
    let currentDate = new Date(startDate);
    let dayCount = 0;
    
    while (dayCount < courseInfo.totalDays) {
      // 주말 제외 (월-금요일만)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        days.push({
          id: `day-${dayCount + 1}`,
          day: dayCount + 1,
          date: currentDate.toISOString().split('T')[0],
          sessions: [
            {
              id: `session-${dayCount + 1}-1`,
              startTime: '09:00',
              endTime: '12:00',
              subject: `${dayCount + 1}일차 오전 교육`,
              instructorId: '',
              instructorName: '강사 미배정',
              room: courseInfo.location,
              materials: []
            },
            {
              id: `session-${dayCount + 1}-2`,
              startTime: '13:00',
              endTime: '17:00',
              subject: `${dayCount + 1}일차 오후 교육`,
              instructorId: '',
              instructorName: '강사 미배정',
              room: courseInfo.location,
              materials: []
            }
          ]
        });
        dayCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // 시작일 또는 총일수 변경시 일차 재계산
  const [autoCalculateEndDate, setAutoCalculateEndDate] = useState(true);
  
  useEffect(() => {
    if (courseInfo.startDate && courseInfo.totalDays > 0) {
      const newDailySessions = calculateTrainingDays();
      setCourseInfo(prev => ({
        ...prev,
        dailySessions: newDailySessions,
        // 자동 계산 모드일 때만 종료일 업데이트
        ...(autoCalculateEndDate && {
          endDate: newDailySessions[newDailySessions.length - 1]?.date || ''
        })
      }));
    }
  }, [courseInfo.startDate, courseInfo.totalDays, autoCalculateEndDate]);

  // 강사 추가
  const addInstructor = () => {
    const newInstructor: Instructor = {
      id: `instructor-${Date.now()}`,
      name: '',
      specialization: '',
      phone: '',
      email: ''
    };
    
    setCourseInfo(prev => ({
      ...prev,
      instructors: [...prev.instructors, newInstructor]
    }));
  };

  // 강사 정보 수정
  const updateInstructor = (instructorId: string, field: string, value: string) => {
    setCourseInfo(prev => ({
      ...prev,
      instructors: prev.instructors.map(inst => 
        inst.id === instructorId ? { ...inst, [field]: value } : inst
      )
    }));
  };

  // 강사 삭제
  const removeInstructor = (instructorId: string) => {
    setCourseInfo(prev => ({
      ...prev,
      instructors: prev.instructors.filter(inst => inst.id !== instructorId),
      dailySessions: prev.dailySessions.map(day => ({
        ...day,
        sessions: day.sessions.map(session => 
          session.instructorId === instructorId 
            ? { ...session, instructorId: '', instructorName: '강사 미배정' }
            : session
        )
      }))
    }));
  };

  // 세션에 강사 배정
  const assignInstructorToSession = (dayId: string, sessionId: string, instructorId: string) => {
    const instructor = courseInfo.instructors.find(inst => inst.id === instructorId);
    if (!instructor) return;

    setCourseInfo(prev => ({
      ...prev,
      dailySessions: prev.dailySessions.map(day => 
        day.id === dayId ? {
          ...day,
          sessions: day.sessions.map(session => 
            session.id === sessionId ? {
              ...session,
              instructorId: instructorId,
              instructorName: instructor.name
            } : session
          )
        } : day
      )
    }));
  };

  // 엑셀 데이터 가져오기 처리
  const handleExcelImport = async (scheduleData: any[]) => {
    try {
      // 엑셀 데이터를 DailySession 형식으로 변환
      const dailySessionsMap = new Map<number, DailySession>();
      const instructorNames = new Set<string>();

      scheduleData.forEach(row => {
        const day = row.일차;
        instructorNames.add(row.강사명);

        if (!dailySessionsMap.has(day)) {
          dailySessionsMap.set(day, {
            id: `day-${day}`,
            day: day,
            date: row.날짜,
            sessions: []
          });
        }

        const dailySession = dailySessionsMap.get(day)!;
        dailySession.sessions.push({
          id: `session-${day}-${dailySession.sessions.length + 1}`,
          startTime: row.시작시간,
          endTime: row.종료시간,
          subject: row.교육주제,
          instructorId: '',
          instructorName: row.강사명,
          room: row.강의실 || courseInfo.location,
          materials: row.비고 ? [row.비고] : []
        });
      });

      // 강사진 자동 생성
      const newInstructors: Instructor[] = Array.from(instructorNames).map(name => ({
        id: `instructor-${Date.now()}-${Math.random()}`,
        name: name,
        specialization: '전문 분야 미설정',
        phone: '',
        email: ''
      }));

      // 강사 ID 매핑
      const updatedDailySessions = Array.from(dailySessionsMap.values()).map(day => ({
        ...day,
        sessions: day.sessions.map(session => {
          const instructor = newInstructors.find(inst => inst.name === session.instructorName);
          return {
            ...session,
            instructorId: instructor?.id || ''
          };
        })
      }));

      // 날짜 범위 계산
      const dates = scheduleData.map(row => new Date(row.날짜)).sort((a, b) => a.getTime() - b.getTime());
      const startDate = dates[0].toISOString().split('T')[0];
      const endDate = dates[dates.length - 1].toISOString().split('T')[0];

      setCourseInfo(prev => ({
        ...prev,
        dailySessions: updatedDailySessions,
        instructors: [...prev.instructors, ...newInstructors],
        totalDays: dailySessionsMap.size,
        startDate: prev.startDate || startDate,
        endDate: prev.endDate || endDate
      }));

      setAutoCalculateEndDate(false); // 엑셀에서 가져온 경우 수동 모드로 변경
      setShowExcelImporter(false);
    } catch (error) {
      console.error('엑셀 데이터 처리 오류:', error);
      throw error;
    }
  };

  // 과정/레벨 변경 시 차수 자동 업데이트
  const handleCourseSelection = (field: string, value: string) => {
    let updates: any = { [field]: value };

    if (field === 'seriesId') {
      const selectedSeries = availableSeries.find(s => s.id === value);
      if (selectedSeries && selectedSeries.levels.length > 0) {
        updates.levelId = selectedSeries.levels[0].id;
      }
    }

    setCourseInfo(prev => {
      const newInfo = { ...prev, ...updates };
      
      // 과정명 자동 생성
      if (field === 'seriesId' || field === 'levelId' || field === 'year') {
        const series = availableSeries.find(s => s.id === newInfo.seriesId);
        const level = series?.levels.find(l => l.id === newInfo.levelId);
        if (series && level) {
          newInfo.courseName = `${series.name} ${level.name} 과정 ${newInfo.sessionNumber}차`;
          newInfo.totalDays = level.defaultSessions || 10;
          newInfo.maxStudents = level.defaultMaxStudents || 30;
        }
      }
      
      return newInfo;
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!courseInfo.seriesId || !courseInfo.levelId) {
        alert('과정을 선택해주세요.');
        return;
      }

      if (!courseInfo.startDate || !courseInfo.endDate) {
        alert('교육 일정을 입력해주세요.');
        return;
      }

      if (courseInfo.instructors.length === 0) {
        alert('최소 1명의 강사를 추가해주세요.');
        return;
      }

      const series = getSelectedSeries();
      const level = getSelectedLevel();

      const courseData = {
        ...courseInfo,
        code: generateCourseCode(),
        templateId: level?.id,
        seriesCode: series?.code,
        levelCode: level?.code,
        status: 'planning',
        createdAt: new Date().toISOString(),
        type: 'offline-intensive' // 오프라인 집체교육 구분
      };

      await onSave(courseData);
    } catch (error) {
      console.error('과정 개설 실패:', error);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="contents">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep
                ? 'bg-blue-600 text-white'
                : step < currentStep
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step < currentStep ? <CheckCircleIcon className="h-5 w-5" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={`w-12 h-1 mx-2 ${
                step < currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // 1단계: 기본 정보
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">기본 과정 정보</h3>
        <p className="text-gray-600">개설할 오프라인 집체교육과정의 기본 정보를 입력해주세요</p>
      </div>

      {/* 과정 시리즈 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          교육 시리즈 <span className="text-red-500">*</span>
        </label>
        <select
          value={courseInfo.seriesId}
          onChange={(e) => handleCourseSelection('seriesId', e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
        >
          <option value="">시리즈를 선택하세요</option>
          {availableSeries.filter(s => s.isActive).map(series => (
            <option key={series.id} value={series.id}>
              {series.name} ({series.code}) - {series.description}
            </option>
          ))}
        </select>
      </div>

      {/* 과정 레벨 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          과정 레벨 <span className="text-red-500">*</span>
        </label>
        <select
          value={courseInfo.levelId}
          onChange={(e) => handleCourseSelection('levelId', e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!courseInfo.seriesId}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
        >
          <option value="">레벨을 선택하세요</option>
          {(() => {
            const series = getSelectedSeries();
            return series?.levels.sort((a, b) => a.order - b.order).map(level => (
              <option key={level.id} value={level.id}>
                {level.name} ({level.code}) - {level.description}
              </option>
            )) || [];
          })()}
        </select>
      </div>

      {/* 연도, 차수, 총 교육일수 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연도 <span className="text-red-500">*</span>
          </label>
          <select
            value={courseInfo.year}
            onChange={(e) => handleCourseSelection('year', e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            차수 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={courseInfo.sessionNumber}
            onChange={(e) => setCourseInfo(prev => ({ ...prev, sessionNumber: parseInt(e.target.value) || 1 }))}
            min="1"
            max="99"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            총 교육일수 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={courseInfo.totalDays}
            onChange={(e) => setCourseInfo(prev => ({ ...prev, totalDays: parseInt(e.target.value) || 10 }))}
            min="1"
            max="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 과정명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          과정명
        </label>
        <input
          type="text"
          value={courseInfo.courseName}
          onChange={(e) => setCourseInfo(prev => ({ ...prev, courseName: e.target.value }))}
          placeholder="자동 생성됩니다"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 과정 코드 미리보기 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm font-medium text-blue-900">생성될 과정 코드</div>
        <div className="text-lg font-bold mt-1 font-mono text-blue-800">
          {generateCourseCode() || '과정을 선택해주세요'}
        </div>
        <div className="text-xs mt-1 text-blue-700">
          형식: 연도-과정코드-차수 (예: 2025-BSBASIC-01)
        </div>
      </div>
    </div>
  );

  // 2단계: 일정 계획
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">교육 일정 계획</h3>
        <p className="text-gray-600">집체교육 일정과 장소를 설정해주세요</p>
      </div>

      {/* 교육 기간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            교육 시작일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={courseInfo.startDate}
            onChange={(e) => setCourseInfo(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            교육 종료일 
            <span className="text-xs text-gray-500 ml-1">
              {autoCalculateEndDate ? '(자동 계산됨, 수정 가능)' : '(수동 설정됨)'}
            </span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={courseInfo.endDate}
              onChange={(e) => {
                setCourseInfo(prev => ({ ...prev, endDate: e.target.value }));
                setAutoCalculateEndDate(false); // 수동 수정 시 자동 계산 비활성화
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!autoCalculateEndDate && (
              <button
                type="button"
                onClick={() => setAutoCalculateEndDate(true)}
                className="absolute right-1 top-1 bottom-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                title="자동 계산으로 되돌리기"
              >
                자동
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 교육 장소 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교육 장소 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={courseInfo.location}
          onChange={(e) => setCourseInfo(prev => ({ ...prev, location: e.target.value }))}
          placeholder="예: 본사 교육원, 대회의실 A"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 정원 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교육 정원
        </label>
        <input
          type="number"
          value={courseInfo.maxStudents}
          onChange={(e) => setCourseInfo(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
          min="1"
          max="100"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 운영 담당자 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          운영 담당자 <span className="text-red-500">*</span>
        </label>
        <select
          value={courseInfo.manager.id}
          onChange={(e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            setCourseInfo(prev => ({
              ...prev,
              manager: {
                id: e.target.value,
                name: selectedOption.text.split(' - ')[0] || ''
              }
            }));
          }}
          className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
        >
          <option value="">담당자를 선택하세요</option>
          <option value="manager-1">박매니저 - 교육운영팀</option>
          <option value="manager-2">정매니저 - HR팀</option>
          <option value="manager-3">김매니저 - 교육기획팀</option>
        </select>
      </div>

      {/* 일차별 교육 일정 미리보기 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">교육 일정 미리보기</h4>
        <div className="text-sm text-gray-600">
          총 {courseInfo.totalDays}일 과정 ({courseInfo.startDate} ~ {courseInfo.endDate})
        </div>
        {courseInfo.dailySessions.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {courseInfo.dailySessions.slice(0, 3).map(day => (
              <div key={day.id}>
                {day.day}일차 ({day.date}) - {day.sessions.length}개 세션
              </div>
            ))}
            {courseInfo.dailySessions.length > 3 && (
              <div>... 외 {courseInfo.dailySessions.length - 3}일</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // 3단계: 강사진 관리
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">강사진 관리</h3>
        <p className="text-gray-600">교육에 참여할 강사진을 등록해주세요</p>
      </div>

      {/* 강사 추가 버튼 */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">등록된 강사진 ({courseInfo.instructors.length}명)</h4>
        <button
          type="button"
          onClick={addInstructor}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>강사 추가</span>
        </button>
      </div>

      {/* 강사 목록 */}
      <div className="space-y-4">
        {courseInfo.instructors.map((instructor, index) => (
          <div key={instructor.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900">강사 #{index + 1}</h5>
              <button
                type="button"
                onClick={() => removeInstructor(instructor.id)}
                className="text-red-600 hover:text-red-800"
                title="강사 삭제"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  강사명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={instructor.name}
                  onChange={(e) => updateInstructor(instructor.id, 'name', e.target.value)}
                  placeholder="강사 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전문 분야
                </label>
                <input
                  type="text"
                  value={instructor.specialization}
                  onChange={(e) => updateInstructor(instructor.id, 'specialization', e.target.value)}
                  placeholder="예: 영업 스킬, 리더십, 협상 기법"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={instructor.phone}
                  onChange={(e) => updateInstructor(instructor.id, 'phone', e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={instructor.email}
                  onChange={(e) => updateInstructor(instructor.id, 'email', e.target.value)}
                  placeholder="instructor@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}

        {courseInfo.instructors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>등록된 강사가 없습니다.</p>
            <p className="text-sm">위의 "강사 추가" 버튼을 클릭해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );

  // 4단계: 세션 구성
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">세션 구성 및 강사 배정</h3>
        <p className="text-gray-600">일차별 세션에 강사를 배정하고 교육 내용을 설정해주세요</p>
      </div>

      {/* 엑셀 가져오기 옵션 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentArrowUpIcon className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">엑셀로 일정 가져오기</h4>
              <p className="text-sm text-green-700">미리 작성된 엑셀 파일로 전체 일정을 한번에 등록하세요</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowExcelImporter(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            <span>엑셀 가져오기</span>
          </button>
        </div>
      </div>

      {/* 일차별 세션 목록 */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {courseInfo.dailySessions.map((day) => (
          <div key={day.id} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {day.day}일차 ({new Date(day.date).toLocaleDateString('ko-KR')})
            </h4>
            
            <div className="space-y-3">
              {day.sessions.map((session) => (
                <div key={session.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-gray-700">
                        {session.startTime} - {session.endTime}
                      </div>
                    </div>
                    
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={session.subject}
                        onChange={(e) => {
                          setCourseInfo(prev => ({
                            ...prev,
                            dailySessions: prev.dailySessions.map(d => 
                              d.id === day.id ? {
                                ...d,
                                sessions: d.sessions.map(s => 
                                  s.id === session.id ? { ...s, subject: e.target.value } : s
                                )
                              } : d
                            )
                          }));
                        }}
                        placeholder="교육 주제"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="col-span-4">
                      <select
                        value={session.instructorId}
                        onChange={(e) => assignInstructorToSession(day.id, session.id, e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.25em 1.25em',
                          paddingRight: '2rem'
                        }}
                      >
                        <option value="">강사 선택</option>
                        {courseInfo.instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name} {instructor.specialization && `(${instructor.specialization})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={session.room}
                        onChange={(e) => {
                          setCourseInfo(prev => ({
                            ...prev,
                            dailySessions: prev.dailySessions.map(d => 
                              d.id === day.id ? {
                                ...d,
                                sessions: d.sessions.map(s => 
                                  s.id === session.id ? { ...s, room: e.target.value } : s
                                )
                              } : d
                            )
                          }));
                        }}
                        placeholder="강의실"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 강사 배정 현황 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">강사 배정 현황</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">총 세션 수:</span>
            <span className="font-medium ml-2">
              {courseInfo.dailySessions.reduce((total, day) => total + day.sessions.length, 0)}개
            </span>
          </div>
          <div>
            <span className="text-blue-700">배정 완료:</span>
            <span className="font-medium ml-2">
              {courseInfo.dailySessions.reduce((total, day) => 
                total + day.sessions.filter(s => s.instructorId).length, 0
              )}개
            </span>
          </div>
          <div>
            <span className="text-blue-700">등록 강사 수:</span>
            <span className="font-medium ml-2">{courseInfo.instructors.length}명</span>
          </div>
          <div>
            <span className="text-blue-700">미배정 세션:</span>
            <span className="font-medium ml-2">
              {courseInfo.dailySessions.reduce((total, day) => 
                total + day.sessions.filter(s => !s.instructorId).length, 0
              )}개
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // 5단계: 최종 확인
  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">최종 확인</h3>
        <p className="text-gray-600">입력한 과정 정보를 확인하고 개설하세요</p>
      </div>

      {/* 과정 정보 요약 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">과정 정보 요약</h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">과정명:</span>
              <div className="font-medium">{courseInfo.courseName}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">과정 코드:</span>
              <div className="font-medium font-mono">{generateCourseCode()}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 기간:</span>
              <div className="font-medium">
                {courseInfo.startDate} ~ {courseInfo.endDate} (총 {courseInfo.totalDays}일)
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 장소:</span>
              <div className="font-medium">{courseInfo.location || '미설정'}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">운영 담당자:</span>
              <div className="font-medium">{courseInfo.manager.name || '미배정'}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 정원:</span>
              <div className="font-medium">{courseInfo.maxStudents}명</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">등록 강사진:</span>
              <div className="font-medium">{courseInfo.instructors.length}명</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">총 세션 수:</span>
              <div className="font-medium">
                {courseInfo.dailySessions.reduce((total, day) => total + day.sessions.length, 0)}개
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 강사진 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">참여 강사진</h4>
        <div className="grid grid-cols-2 gap-4">
          {courseInfo.instructors.map((instructor, index) => (
            <div key={instructor.id} className="text-sm">
              <span className="font-medium">{instructor.name}</span>
              {instructor.specialization && (
                <span className="text-gray-600 ml-1">({instructor.specialization})</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 특이사항 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          특이사항
        </label>
        <textarea
          value={courseInfo.notes}
          onChange={(e) => setCourseInfo(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="과정 운영에 대한 특이사항을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 주의사항 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <div className="font-medium text-orange-900">확인 사항</div>
            <div className="text-sm text-orange-800 mt-1">
              과정을 개설한 후에는 일부 정보의 수정이 제한될 수 있습니다.
              특히 강사 배정과 일정은 신중하게 확인해주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">오프라인 집체교육 개설</h2>
              <p className="text-sm text-gray-600">다중 강사 체계의 집체교육과정을 개설합니다</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 단계 표시 */}
        <div className="p-6 border-b border-gray-200">
          {renderStepIndicator()}
        </div>

        {/* 단계별 컨텐츠 */}
        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* 버튼 */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>이전</span>
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 1 && (!courseInfo.seriesId || !courseInfo.levelId)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>다음</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>과정 개설</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 엑셀 스케줄 가져오기 모달 */}
      {showExcelImporter && (
        <ExcelScheduleImporter
          onImport={handleExcelImport}
          onClose={() => setShowExcelImporter(false)}
        />
      )}
    </div>
  );
};

export default OfflineCourseWizard;