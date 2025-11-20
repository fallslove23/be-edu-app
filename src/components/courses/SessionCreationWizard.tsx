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
  AcademicCapIcon
} from '@heroicons/react/24/outline';

// 차수 개설 전용 마법사
interface SessionCreationWizardProps {
  onSave: (sessionData: any) => Promise<void>;
  onCancel: () => void;
  availableSeries?: any[];
  existingCourses?: any[];
}

interface SessionInfo {
  // 과정 선택
  seriesId: string;
  levelId: string;
  year: number;
  sessionNumber: number;
  
  // 운영 정보
  sessionName: string;
  instructor: {
    id: string;
    name: string;
  };
  manager: {
    id: string;
    name: string;
  };
  
  // 일정 정보
  startDate: string;
  endDate: string;
  schedule: {
    days: string[];
    startTime: string;
    endTime: string;
    location: string;
  };
  
  // 수강 정보
  maxStudents: number;
  registrationStartDate: string;
  registrationEndDate: string;
  
  // 추가 정보
  notes: string;
}

const SessionCreationWizard: React.FC<SessionCreationWizardProps> = ({
  onSave,
  onCancel,
  availableSeries = [],
  existingCourses = []
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    seriesId: '',
    levelId: '',
    year: new Date().getFullYear(),
    sessionNumber: 1,
    sessionName: '',
    instructor: { id: '', name: '' },
    manager: { id: '', name: '' },
    startDate: '',
    endDate: '',
    schedule: {
      days: [],
      startTime: '09:00',
      endTime: '17:00',
      location: ''
    },
    maxStudents: 30,
    registrationStartDate: '',
    registrationEndDate: '',
    notes: ''
  });

  const totalSteps = 4;

  // 선택된 시리즈와 레벨 정보
  const getSelectedSeries = () => {
    return availableSeries.find(s => s.id === sessionInfo.seriesId);
  };

  const getSelectedLevel = () => {
    const series = getSelectedSeries();
    return series?.levels.find(l => l.id === sessionInfo.levelId);
  };

  // 과정 코드 생성
  const generateCourseCode = () => {
    const series = getSelectedSeries();
    const level = getSelectedLevel();
    
    if (!series || !level) return '';
    
    const year = sessionInfo.year;
    const sessionNumber = sessionInfo.sessionNumber.toString().padStart(2, '0');
    
    return `${year}-${series.code}${level.code}-${sessionNumber}`;
  };

  // 다음 차수 번호 제안
  const getNextSessionNumber = () => {
    const series = getSelectedSeries();
    const level = getSelectedLevel();
    
    if (!series || !level) return 1;
    
    const year = sessionInfo.year;
    const baseCode = `${year}-${series.code}${level.code}`;
    
    const existingSessions = existingCourses
      .filter(course => course.code?.startsWith(baseCode))
      .map(course => {
        const match = course.code?.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    if (existingSessions.length === 0) return 1;
    
    return Math.max(...existingSessions) + 1;
  };

  // 중복 검사
  const isDuplicateCode = () => {
    const generatedCode = generateCourseCode();
    return existingCourses.some(course => course.code === generatedCode);
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

    setSessionInfo(prev => {
      const newInfo = { ...prev, ...updates };
      
      // 차수 자동 계산
      if (field === 'seriesId' || field === 'levelId' || field === 'year') {
        const nextSession = getNextSessionNumber();
        newInfo.sessionNumber = nextSession;
        
        // 과정명 자동 생성
        const series = availableSeries.find(s => s.id === newInfo.seriesId);
        const level = series?.levels.find(l => l.id === newInfo.levelId);
        if (series && level) {
          newInfo.sessionName = `${series.name} ${level.name} 과정 ${newInfo.sessionNumber}차`;
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
      const series = getSelectedSeries();
      const level = getSelectedLevel();
      
      if (!series || !level) {
        alert('과정을 선택해주세요.');
        return;
      }

      if (isDuplicateCode()) {
        alert('중복된 과정 코드입니다. 연도나 차수를 변경해주세요.');
        return;
      }

      if (!sessionInfo.startDate || !sessionInfo.endDate) {
        alert('교육 일정을 입력해주세요.');
        return;
      }

      const sessionData = {
        ...sessionInfo,
        code: generateCourseCode(),
        templateId: level.id,
        seriesCode: series.code,
        levelCode: level.code,
        totalSessions: level.defaultSessions,
        sessionDuration: level.defaultDuration,
        objectives: level.defaultObjectives,
        prerequisites: level.defaultPrerequisites,
        status: 'planning',
        createdAt: new Date().toISOString()
      };

      await onSave(sessionData);
    } catch (error) {
      console.error('차수 개설 실패:', error);
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">과정 및 차수 선택</h3>
        <p className="text-gray-600">개설할 교육과정과 차수를 선택해주세요</p>
      </div>

      {/* 과정 시리즈 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          교육 시리즈 <span className="text-destructive">*</span>
        </label>
        <select
          value={sessionInfo.seriesId}
          onChange={(e) => handleCourseSelection('seriesId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          과정 레벨 <span className="text-destructive">*</span>
        </label>
        <select
          value={sessionInfo.levelId}
          onChange={(e) => handleCourseSelection('levelId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!sessionInfo.seriesId}
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

      {/* 연도 및 차수 설정 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연도 <span className="text-destructive">*</span>
          </label>
          <select
            value={sessionInfo.year}
            onChange={(e) => handleCourseSelection('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
            <option value={new Date().getFullYear() + 2}>{new Date().getFullYear() + 2}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            차수 <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={sessionInfo.sessionNumber}
              onChange={(e) => setSessionInfo(prev => ({ ...prev, sessionNumber: parseInt(e.target.value) || 1 }))}
              min="1"
              max="99"
              className={`w-full px-3 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDuplicateCode() ? 'border-destructive/50 bg-destructive/10' : 'border-gray-300'
              }`}
            />
            {(() => {
              const suggested = getNextSessionNumber();
              return suggested !== sessionInfo.sessionNumber && (
                <button
                  type="button"
                  onClick={() => setSessionInfo(prev => ({ ...prev, sessionNumber: suggested }))}
                  className="absolute right-1 top-1 bottom-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  title={`추천 차수 ${suggested}`}
                >
                  {suggested}
                </button>
              );
            })()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            정원
          </label>
          <input
            type="number"
            value={sessionInfo.maxStudents}
            onChange={(e) => setSessionInfo(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 과정 코드 미리보기 */}
      <div className={`border rounded-full p-4 ${
        isDuplicateCode() 
          ? 'bg-destructive/10 border-destructive/50' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className={`text-sm font-medium ${
          isDuplicateCode() ? 'text-destructive' : 'text-blue-900'
        }`}>
          {isDuplicateCode() ? '⚠️ 중복된 과정 코드' : '생성될 과정 코드'}
        </div>
        <div className={`text-lg font-bold mt-1 font-mono ${
          isDuplicateCode() ? 'text-destructive' : 'text-blue-800'
        }`}>
          {generateCourseCode() || '과정을 선택해주세요'}
        </div>
        <div className={`text-xs mt-1 ${
          isDuplicateCode() ? 'text-destructive' : 'text-blue-700'
        }`}>
          {isDuplicateCode() 
            ? '이미 존재하는 과정입니다. 차수를 변경해주세요.'
            : '형식: 연도-과정코드-차수'
          }
        </div>
      </div>

      {/* 차수명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          차수명
        </label>
        <input
          type="text"
          value={sessionInfo.sessionName}
          onChange={(e) => setSessionInfo(prev => ({ ...prev, sessionName: e.target.value }))}
          placeholder="자동 생성됩니다"
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">담당자 배정</h3>
        <p className="text-gray-600">강사와 운영 담당자를 배정해주세요</p>
      </div>

      {/* 강사 배정 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          담당 강사 <span className="text-destructive">*</span>
        </label>
        <select
          value={sessionInfo.instructor.id}
          onChange={(e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            setSessionInfo(prev => ({
              ...prev,
              instructor: {
                id: e.target.value,
                name: selectedOption.text.split(' - ')[0] || ''
              }
            }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">강사를 선택하세요</option>
          <option value="instructor-1">김강사 - 영업 전문</option>
          <option value="instructor-2">이강사 - 기술 전문</option>
          <option value="instructor-3">박강사 - 리더십 전문</option>
          <option value="instructor-4">최강사 - 마케팅 전문</option>
        </select>
      </div>

      {/* 운영 담당자 배정 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          운영 담당자 <span className="text-destructive">*</span>
        </label>
        <select
          value={sessionInfo.manager.id}
          onChange={(e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            setSessionInfo(prev => ({
              ...prev,
              manager: {
                id: e.target.value,
                name: selectedOption.text.split(' - ')[0] || ''
              }
            }));
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">담당자를 선택하세요</option>
          <option value="manager-1">박매니저 - 교육운영팀</option>
          <option value="manager-2">정매니저 - HR팀</option>
          <option value="manager-3">김매니저 - 교육기획팀</option>
        </select>
      </div>

      {/* 과정 정보 요약 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">선택된 과정 정보</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">과정:</span>
            <span className="font-medium">{sessionInfo.sessionName || '미설정'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">과정 코드:</span>
            <span className="font-medium font-mono">{generateCourseCode()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">정원:</span>
            <span className="font-medium">{sessionInfo.maxStudents}명</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">교육 일정</h3>
        <p className="text-gray-600">교육 일정과 장소를 설정해주세요</p>
      </div>

      {/* 교육 기간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            교육 시작일 <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={sessionInfo.startDate}
            onChange={(e) => setSessionInfo(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            교육 종료일 <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={sessionInfo.endDate}
            onChange={(e) => setSessionInfo(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 수업 시간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시작 시간
          </label>
          <input
            type="time"
            value={sessionInfo.schedule.startTime}
            onChange={(e) => setSessionInfo(prev => ({
              ...prev,
              schedule: { ...prev.schedule, startTime: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            종료 시간
          </label>
          <input
            type="time"
            value={sessionInfo.schedule.endTime}
            onChange={(e) => setSessionInfo(prev => ({
              ...prev,
              schedule: { ...prev.schedule, endTime: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 수업 요일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          수업 요일
        </label>
        <div className="grid grid-cols-7 gap-2">
          {['월', '화', '수', '목', '금', '토', '일'].map(day => (
            <label key={day} className="flex items-center justify-center p-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sessionInfo.schedule.days.includes(day)}
                onChange={(e) => {
                  const days = e.target.checked
                    ? [...sessionInfo.schedule.days, day]
                    : sessionInfo.schedule.days.filter(d => d !== day);
                  setSessionInfo(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, days }
                  }));
                }}
                className="sr-only"
              />
              <span className={`text-sm font-medium ${
                sessionInfo.schedule.days.includes(day)
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}>
                {day}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 교육 장소 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교육 장소
        </label>
        <input
          type="text"
          value={sessionInfo.schedule.location}
          onChange={(e) => setSessionInfo(prev => ({
            ...prev,
            schedule: { ...prev.schedule, location: e.target.value }
          }))}
          placeholder="예: 본사 교육실 A, 온라인"
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 수강 신청 기간 */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">수강 신청 기간</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신청 시작일
            </label>
            <input
              type="date"
              value={sessionInfo.registrationStartDate}
              onChange={(e) => setSessionInfo(prev => ({ ...prev, registrationStartDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신청 마감일
            </label>
            <input
              type="date"
              value={sessionInfo.registrationEndDate}
              onChange={(e) => setSessionInfo(prev => ({ ...prev, registrationEndDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">최종 확인</h3>
        <p className="text-gray-600">입력한 내용을 확인하고 차수를 개설하세요</p>
      </div>

      {/* 과정 정보 요약 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">차수 정보 요약</h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">과정명:</span>
              <div className="font-medium">{sessionInfo.sessionName}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">과정 코드:</span>
              <div className="font-medium font-mono">{generateCourseCode()}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 기간:</span>
              <div className="font-medium">
                {sessionInfo.startDate} ~ {sessionInfo.endDate}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">수업 시간:</span>
              <div className="font-medium">
                {sessionInfo.schedule.startTime} ~ {sessionInfo.schedule.endTime}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">수업 요일:</span>
              <div className="font-medium">
                {sessionInfo.schedule.days.length > 0 
                  ? sessionInfo.schedule.days.join(', ') 
                  : '미설정'
                }
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 장소:</span>
              <div className="font-medium">{sessionInfo.schedule.location || '미설정'}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">담당 강사:</span>
              <div className="font-medium">{sessionInfo.instructor.name || '미배정'}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">운영 담당자:</span>
              <div className="font-medium">{sessionInfo.manager.name || '미배정'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          특이사항
        </label>
        <textarea
          value={sessionInfo.notes}
          onChange={(e) => setSessionInfo(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          placeholder="차수 운영에 대한 특이사항을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 주의사항 */}
      <div className="bg-orange-500/10 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <div className="font-medium text-orange-900">확인 사항</div>
            <div className="text-sm text-orange-800 mt-1">
              차수를 개설한 후에는 일부 정보의 수정이 제한될 수 있습니다.
              입력한 내용을 다시 한번 확인해주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">새 차수 개설</h2>
              <p className="text-sm text-gray-600">기존 과정의 새로운 차수를 개설합니다</p>
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
        </div>

        {/* 버튼 */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>이전</span>
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
            >
              취소
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 1 && (!sessionInfo.seriesId || !sessionInfo.levelId)}
                className="btn-primary"
              >
                <span>다음</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDuplicateCode()}
                className="btn-success"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>차수 개설</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionCreationWizard;