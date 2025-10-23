import React, { useState } from 'react';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

// 교육 과정 생성 마법사
interface CourseWizardProps {
  onSave: (courseData: any) => Promise<void>;
  onCancel: () => void;
  availableSeries?: CourseSeries[]; // 동적 과정 시리즈
  existingCourses?: any[]; // 기존 과정 목록 (자동 차수 제안용)
}

interface CourseSeries {
  id: string;
  name: string;
  code: string;
  description: string;
  targetDepartments: string[];
  levels: CourseLevel[];
  isActive: boolean;
}

interface CourseLevel {
  id: string;
  name: string;
  code: string;
  description: string;
  order: number;
  defaultSessions: number;
  defaultDuration: number;
  defaultMaxStudents: number;
  defaultObjectives: string[];
  defaultPrerequisites: string[];
  scheduleType: 'regular' | 'biennial' | 'irregular';
}

interface CourseTemplate {
  seriesId: string;
  levelId: string;
  scheduleType: 'regular' | 'biennial' | 'irregular';
}

const CourseWizard: React.FC<CourseWizardProps> = ({ onSave, onCancel, availableSeries = [], existingCourses = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [courseTemplate, setCourseTemplate] = useState<CourseTemplate>({
    seriesId: availableSeries[0]?.id || '',
    levelId: availableSeries[0]?.levels[0]?.id || '',
    scheduleType: 'regular'
  });

  const [courseDetails, setCourseDetails] = useState({
    customName: '',
    description: '',
    totalSessions: 20,
    sessionDuration: 180,
    maxStudents: 30,
    objectives: [''],
    prerequisites: [''],
    materials: [''],
    specialNotes: '',
    // 과정 코드 생성을 위한 필드들
    year: new Date().getFullYear(),
    sessionNumber: 1
  });

  const [scheduleInfo, setScheduleInfo] = useState({
    startDate: '',
    endDate: '',
    frequency: 'monthly', // monthly, quarterly, biennial
    location: '',
    instructorRequirements: ''
  });

  const totalSteps = 4;

  // 선택된 시리즈와 레벨 정보 가져오기
  const getSelectedSeries = () => {
    return availableSeries.find(s => s.id === courseTemplate.seriesId);
  };

  const getSelectedLevel = () => {
    const series = getSelectedSeries();
    return series?.levels.find(l => l.id === courseTemplate.levelId);
  };

  const getCourseName = () => {
    const series = getSelectedSeries();
    const level = getSelectedLevel();
    
    if (!series || !level) return '과정명 없음';
    
    return `${series.name} ${level.name} 과정`;
  };

  // 다음 차수 번호 제안
  const getNextSessionNumber = () => {
    const series = getSelectedSeries();
    const level = getSelectedLevel();
    
    if (!series || !level) return 1;
    
    const year = courseDetails.year;
    const baseCode = `${year}-${series.code}${level.code}`;
    
    // 같은 연도, 같은 과정 코드의 기존 차수들 찾기
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

  // 과정 코드 자동 생성: YYYY-코드-차수
  const generateCourseCode = () => {
    const series = getSelectedSeries();
    const level = getSelectedLevel();
    
    if (!series || !level) return '';
    
    const year = courseDetails.year;
    const sessionNumber = courseDetails.sessionNumber.toString().padStart(2, '0');
    
    return `${year}-${series.code}${level.code}-${sessionNumber}`;
  };

  // 중복 과정 코드 체크
  const isDuplicateCode = () => {
    const generatedCode = generateCourseCode();
    return existingCourses.some(course => course.code === generatedCode);
  };

  const getDefaultValues = () => {
    const level = getSelectedLevel();
    
    if (!level) {
      return {
        totalSessions: 20,
        sessionDuration: 180,
        maxStudents: 30,
        objectives: ['학습 목표를 설정해주세요'],
        prerequisites: ['수강 요건을 설정해주세요'],
        description: '과정 설명을 입력해주세요'
      };
    }

    return {
      totalSessions: level.defaultSessions,
      sessionDuration: level.defaultDuration,
      maxStudents: level.defaultMaxStudents,
      objectives: [...level.defaultObjectives],
      prerequisites: [...level.defaultPrerequisites],
      description: level.description
    };
  };

  const handleTemplateChange = (field: keyof CourseTemplate, value: any) => {
    let newTemplate = { ...courseTemplate, [field]: value };
    
    // 시리즈 변경 시 첫 번째 레벨로 자동 설정
    if (field === 'seriesId') {
      const selectedSeries = availableSeries.find(s => s.id === value);
      if (selectedSeries && selectedSeries.levels.length > 0) {
        newTemplate.levelId = selectedSeries.levels[0].id;
      }
    }
    
    // 레벨 변경 시 스케줄 타입 자동 설정
    if (field === 'levelId') {
      const selectedSeries = availableSeries.find(s => s.id === newTemplate.seriesId);
      const selectedLevel = selectedSeries?.levels.find(l => l.id === value);
      if (selectedLevel) {
        newTemplate.scheduleType = selectedLevel.scheduleType;
      }
    }

    setCourseTemplate(newTemplate);
    
    // 기본값으로 courseDetails 업데이트 (시리즈나 레벨 변경 시만)
    if (field === 'seriesId' || field === 'levelId') {
      setTimeout(() => {
        const defaults = getDefaultValues();
        const nextSession = getNextSessionNumber();
        setCourseDetails(prev => ({
          ...prev,
          ...defaults,
          sessionNumber: nextSession
        }));
      }, 0);
    }
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
        alert('과정 시리즈와 레벨을 선택해주세요.');
        return;
      }

      if (isDuplicateCode()) {
        alert('중복된 과정 코드입니다. 연도나 차수를 변경해주세요.');
        return;
      }

      const fullCourseData = {
        // 템플릿 정보
        seriesId: courseTemplate.seriesId,
        levelId: courseTemplate.levelId,
        series: series.code,
        level: level.code,
        scheduleType: courseTemplate.scheduleType,
        
        // 기본 정보
        name: courseDetails.customName || getCourseName(),
        code: generateCourseCode(),
        description: courseDetails.description,
        year: courseDetails.year,
        sessionNumber: courseDetails.sessionNumber,
        
        // 교육 상세
        totalSessions: courseDetails.totalSessions,
        sessionDuration: courseDetails.sessionDuration,
        maxStudents: courseDetails.maxStudents,
        objectives: courseDetails.objectives.filter(obj => obj.trim()),
        prerequisites: courseDetails.prerequisites.filter(pre => pre.trim()),
        materials: courseDetails.materials.filter(mat => mat.trim()),
        
        // 일정 정보
        startDate: scheduleInfo.startDate,
        endDate: scheduleInfo.endDate,
        frequency: scheduleInfo.frequency,
        location: scheduleInfo.location,
        instructorRequirements: scheduleInfo.instructorRequirements,
        
        // 메타 정보
        specialNotes: courseDetails.specialNotes,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      await onSave(fullCourseData);
    } catch (error) {
      console.error('과정 저장 실패:', error);
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
        <h3 className="text-xl font-bold text-gray-900 mb-2">과정 유형 선택</h3>
        <p className="text-gray-600">교육 과정의 기본 유형을 선택해주세요</p>
      </div>

      {/* 시리즈 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          교육 시리즈 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {availableSeries.filter(s => s.isActive).map(series => (
            <button
              key={series.id}
              type="button"
              onClick={() => handleTemplateChange('seriesId', series.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                courseTemplate.seriesId === series.id
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-lg mb-1">{series.name} ({series.code})</div>
              <div className="text-sm text-gray-600">{series.description}</div>
              <div className="text-xs text-gray-500 mt-1">{series.levels.length}개 레벨</div>
            </button>
          ))}
        </div>
        {availableSeries.filter(s => s.isActive).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            등록된 과정 시리즈가 없습니다. 관리자에게 문의하세요.
          </div>
        )}
      </div>

      {/* 레벨 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          과정 레벨 <span className="text-red-500">*</span>
        </label>
        {(() => {
          const selectedSeries = getSelectedSeries();
          if (!selectedSeries) {
            return (
              <div className="text-center py-8 text-gray-500">
                먼저 교육 시리즈를 선택해주세요.
              </div>
            );
          }

          return (
            <div className="grid grid-cols-2 gap-4">
              {selectedSeries.levels
                .sort((a, b) => a.order - b.order)
                .map(level => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleTemplateChange('levelId', level.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      courseTemplate.levelId === level.id
                        ? level.scheduleType === 'biennial' 
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-green-500 bg-green-50 text-green-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{level.name} ({level.code})</div>
                    <div className="text-sm text-gray-600 mt-1">{level.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {level.defaultSessions}회차 · {Math.floor(level.defaultDuration / 60)}시간
                      {level.scheduleType === 'biennial' && ' · 2년 주기'}
                    </div>
                  </button>
                ))}
            </div>
          );
        })()}
      </div>

      {/* 대상 그룹 (자동 설정) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          교육 대상 그룹
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {(() => {
            const selectedSeries = getSelectedSeries();
            if (!selectedSeries) {
              return (
                <div className="text-gray-500">
                  교육 시리즈를 선택하면 대상 그룹이 표시됩니다.
                </div>
              );
            }

            return (
              <>
                <div className="font-medium text-gray-900">
                  {selectedSeries.name} 대상 그룹
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedSeries.description}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  대상 부서: {selectedSeries.targetDepartments.length}개 부서
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* 미리보기 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AcademicCapIcon className="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900">생성될 과정명</div>
            <div className="text-lg font-bold text-blue-800 mt-1">{getCourseName()}</div>
            <div className="text-sm text-blue-700 mt-2">
              {(() => {
                const level = getSelectedLevel();
                if (!level) return '레벨을 선택해주세요';
                
                return level.scheduleType === 'biennial' 
                  ? '2년 주기 비정기 과정' 
                  : level.scheduleType === 'irregular'
                  ? '비정기 과정'
                  : '정기 과정 (월/분기별 진행)';
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">과정 상세 정보</h3>
        <p className="text-gray-600">교육 과정의 상세 내용을 설정해주세요</p>
      </div>

      {/* 과정 코드 설정 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          과정 코드 설정 <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">연도</label>
            <select
              value={courseDetails.year}
              onChange={(e) => setCourseDetails(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
              <option value={new Date().getFullYear() + 2}>{new Date().getFullYear() + 2}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">과정 코드</label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {(() => {
                const series = getSelectedSeries();
                const level = getSelectedLevel();
                return series && level ? `${series.code}${level.code}` : '선택 필요';
              })()}
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">차수</label>
            <div className="relative">
              <input
                type="number"
                value={courseDetails.sessionNumber}
                onChange={(e) => setCourseDetails(prev => ({ ...prev, sessionNumber: parseInt(e.target.value) || 1 }))}
                min="1"
                max="99"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDuplicateCode() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {(() => {
                const suggested = getNextSessionNumber();
                return suggested !== courseDetails.sessionNumber && (
                  <button
                    type="button"
                    onClick={() => setCourseDetails(prev => ({ ...prev, sessionNumber: suggested }))}
                    className="absolute right-1 top-1 bottom-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title={`다음 차수 ${suggested}로 설정`}
                  >
                    {suggested}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
        
        <div className={`border rounded-lg p-3 ${
          isDuplicateCode() 
            ? 'bg-red-50 border-red-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`text-sm font-medium ${
            isDuplicateCode() ? 'text-red-900' : 'text-blue-900'
          }`}>
            {isDuplicateCode() ? '⚠️ 중복된 과정 코드' : '생성될 과정 코드'}
          </div>
          <div className={`text-lg font-bold mt-1 font-mono ${
            isDuplicateCode() ? 'text-red-800' : 'text-blue-800'
          }`}>
            {generateCourseCode() || '과정을 선택해주세요'}
          </div>
          <div className={`text-xs mt-1 ${
            isDuplicateCode() ? 'text-red-700' : 'text-blue-700'
          }`}>
            {isDuplicateCode() 
              ? '이미 존재하는 과정 코드입니다. 차수를 변경해주세요.'
              : '형식: 연도-과정코드-차수 (예: 2025-BSBASIC-01)'
            }
          </div>
        </div>
      </div>

      {/* 과정명 커스터마이징 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          과정명 (선택사항)
        </label>
        <input
          type="text"
          value={courseDetails.customName}
          onChange={(e) => setCourseDetails(prev => ({ ...prev, customName: e.target.value }))}
          placeholder={getCourseName()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          비워두면 기본 과정명이 사용됩니다: {getCourseName()}
        </p>
      </div>

      {/* 과정 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          과정 설명 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={courseDetails.description}
          onChange={(e) => setCourseDetails(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          placeholder="교육 과정의 목적과 내용을 설명해주세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 교육 구성 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            총 회차 수 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={courseDetails.totalSessions}
            onChange={(e) => setCourseDetails(prev => ({ ...prev, totalSessions: parseInt(e.target.value) || 0 }))}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            회차당 시간 (분) <span className="text-red-500">*</span>
          </label>
          <select
            value={courseDetails.sessionDuration}
            onChange={(e) => setCourseDetails(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={90}>1.5시간 (90분)</option>
            <option value={120}>2시간 (120분)</option>
            <option value={180}>3시간 (180분)</option>
            <option value={240}>4시간 (240분)</option>
            <option value={300}>5시간 (300분)</option>
            <option value={480}>8시간 (480분)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최대 수강생 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={courseDetails.maxStudents}
            onChange={(e) => setCourseDetails(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 0 }))}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 학습 목표 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          학습 목표 <span className="text-red-500">*</span>
        </label>
        {courseDetails.objectives.map((objective, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <input
              type="text"
              value={objective}
              onChange={(e) => {
                const newObjectives = [...courseDetails.objectives];
                newObjectives[index] = e.target.value;
                setCourseDetails(prev => ({ ...prev, objectives: newObjectives }));
              }}
              placeholder={`학습 목표 ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {courseDetails.objectives.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const newObjectives = courseDetails.objectives.filter((_, i) => i !== index);
                  setCourseDetails(prev => ({ ...prev, objectives: newObjectives }));
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg"
              >
                삭제
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCourseDetails(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          + 학습 목표 추가
        </button>
      </div>

      {/* 수강 요건 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          수강 요건
        </label>
        {courseDetails.prerequisites.map((prerequisite, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <input
              type="text"
              value={prerequisite}
              onChange={(e) => {
                const newPrerequisites = [...courseDetails.prerequisites];
                newPrerequisites[index] = e.target.value;
                setCourseDetails(prev => ({ ...prev, prerequisites: newPrerequisites }));
              }}
              placeholder={`수강 요건 ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {courseDetails.prerequisites.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const newPrerequisites = courseDetails.prerequisites.filter((_, i) => i !== index);
                  setCourseDetails(prev => ({ ...prev, prerequisites: newPrerequisites }));
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg"
              >
                삭제
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setCourseDetails(prev => ({ ...prev, prerequisites: [...prev.prerequisites, ''] }))}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          + 수강 요건 추가
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">일정 및 운영 정보</h3>
        <p className="text-gray-600">교육 일정과 운영 방식을 설정해주세요</p>
      </div>

      {/* 교육 기간 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            교육 시작일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={scheduleInfo.startDate}
            onChange={(e) => setScheduleInfo(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            교육 종료일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={scheduleInfo.endDate}
            onChange={(e) => setScheduleInfo(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 진행 빈도 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          진행 빈도 <span className="text-red-500">*</span>
        </label>
        <select
          value={scheduleInfo.frequency}
          onChange={(e) => setScheduleInfo(prev => ({ ...prev, frequency: e.target.value }))}
          disabled={courseTemplate.scheduleType === 'biennial'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          <option value="monthly">월별 진행</option>
          <option value="quarterly">분기별 진행</option>
          <option value="biennial">2년 주기</option>
          <option value="irregular">비정기</option>
        </select>
        {courseTemplate.scheduleType === 'biennial' && (
          <p className="text-xs text-gray-500 mt-1">
            집체교육은 자동으로 2년 주기로 설정됩니다.
          </p>
        )}
      </div>

      {/* 교육 장소 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교육 장소
        </label>
        <input
          type="text"
          value={scheduleInfo.location}
          onChange={(e) => setScheduleInfo(prev => ({ ...prev, location: e.target.value }))}
          placeholder="예: 본사 교육장, 외부 연수원, 온라인"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 강사 요구사항 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          강사 요구사항
        </label>
        <textarea
          value={scheduleInfo.instructorRequirements}
          onChange={(e) => setScheduleInfo(prev => ({ ...prev, instructorRequirements: e.target.value }))}
          rows={3}
          placeholder="강사의 자격 요건이나 특별 요구사항을 입력해주세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 특별 참고사항 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          특별 참고사항
        </label>
        <textarea
          value={courseDetails.specialNotes}
          onChange={(e) => setCourseDetails(prev => ({ ...prev, specialNotes: e.target.value }))}
          rows={3}
          placeholder="기타 특별한 운영 방침이나 주의사항을 입력해주세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">최종 확인</h3>
        <p className="text-gray-600">입력한 내용을 확인하고 과정을 생성하세요</p>
      </div>

      {/* 요약 정보 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">과정 요약</h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">과정명:</span>
              <div className="font-medium">{courseDetails.customName || getCourseName()}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">과정 코드:</span>
              <div className="font-medium font-mono">
                {generateCourseCode() || '코드 생성 중...'}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 대상:</span>
              <div className="font-medium">
                {(() => {
                  const series = getSelectedSeries();
                  return series ? series.description : '대상 미정';
                })()}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 구성:</span>
              <div className="font-medium">
                {courseDetails.totalSessions}회차 × {Math.floor(courseDetails.sessionDuration / 60)}시간
                {courseDetails.sessionDuration % 60 > 0 && ` ${courseDetails.sessionDuration % 60}분`}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">최대 수강생:</span>
              <div className="font-medium">{courseDetails.maxStudents}명</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">교육 기간:</span>
              <div className="font-medium">
                {scheduleInfo.startDate} ~ {scheduleInfo.endDate}
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">진행 빈도:</span>
              <div className="font-medium">
                {scheduleInfo.frequency === 'monthly' && '월별 진행'}
                {scheduleInfo.frequency === 'quarterly' && '분기별 진행'}
                {scheduleInfo.frequency === 'biennial' && '2년 주기'}
                {scheduleInfo.frequency === 'irregular' && '비정기'}
              </div>
            </div>
            
            {scheduleInfo.location && (
              <div>
                <span className="text-sm text-gray-600">교육 장소:</span>
                <div className="font-medium">{scheduleInfo.location}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 학습 목표 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2">학습 목표</h5>
        <ul className="space-y-1">
          {courseDetails.objectives.filter(obj => obj.trim()).map((objective, index) => (
            <li key={index} className="text-sm text-blue-800">• {objective}</li>
          ))}
        </ul>
      </div>

      {/* 수강 요건 */}
      {courseDetails.prerequisites.some(pre => pre.trim()) && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h5 className="font-medium text-yellow-900 mb-2">수강 요건</h5>
          <ul className="space-y-1">
            {courseDetails.prerequisites.filter(pre => pre.trim()).map((prerequisite, index) => (
              <li key={index} className="text-sm text-yellow-800">• {prerequisite}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 경고 메시지 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <div className="font-medium text-orange-900">확인 사항</div>
            <div className="text-sm text-orange-800 mt-1">
              과정을 생성한 후에는 일부 정보의 수정이 제한될 수 있습니다.
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
            <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">교육과정 생성 마법사</h2>
              <p className="text-sm text-gray-600">단계별로 교육과정을 생성합니다</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRightIcon className="h-6 w-6 rotate-45" />
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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
                <span>과정 생성</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseWizard;