import React, { useState, useEffect, useMemo } from 'react';
import {
  PresentationChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
  PlayIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { BSActivityEntry, PresentationWindow, PresentationSchedule } from '../../types/activity-journal.types';

interface PresentationWindowManagerProps {
  courseCode: string;
  courseName: string;
  courseStartDate: string; // 과정 시작일
  round: number;
  onPresentationSelect?: (activityIds: string[]) => void;
}

const PresentationWindowManager: React.FC<PresentationWindowManagerProps> = ({
  courseCode,
  courseName,
  courseStartDate,
  round,
  onPresentationSelect
}) => {
  const { user } = useAuth();
  const isOperator = ['admin', 'manager', 'operator'].includes(user?.role || '');
  const isInstructor = user?.role === 'instructor';
  const canManage = isOperator || isInstructor;

  const [activities, setActivities] = useState<BSActivityEntry[]>([]);
  const [presentations, setPresentations] = useState<PresentationSchedule[]>([]);
  const [currentView, setCurrentView] = useState<'windows' | 'presentation'>('windows');
  const [selectedWindow, setSelectedWindow] = useState<PresentationWindow | null>(null);
  const [loading, setLoading] = useState(true);

  // SS교육연구소 발표 윈도우 규칙: 1, 3, 5, 7, 9, 11일차
  const PRESENTATION_DAYS = [1, 3, 5, 7, 9, 11];

  // 발표 윈도우 계산
  const presentationWindows: PresentationWindow[] = useMemo(() => {
    const startDate = new Date(courseStartDate);
    return PRESENTATION_DAYS.map(day => {
      const windowDate = new Date(startDate);
      windowDate.setDate(startDate.getDate() + day - 1);
      
      // 발표 전날 23:59가 마감시간
      const deadlineDate = new Date(windowDate);
      deadlineDate.setDate(windowDate.getDate() - 1);
      deadlineDate.setHours(23, 59, 59, 999);

      return {
        id: `window-${courseCode}-${day}`,
        courseCode,
        round,
        day,
        windowDate: windowDate.toISOString(),
        deadline: deadlineDate.toISOString(),
        isActive: isWindowActive(deadlineDate, windowDate),
        submittedActivities: activities.filter(activity => 
          isActivityEligibleForWindow(activity, deadlineDate, day)
        ),
        presentationSchedule: presentations.find(p => 
          p.presentationDate === windowDate.toISOString().split('T')[0]
        )
      };
    });
  }, [courseStartDate, courseCode, round, activities, presentations]);

  // 윈도우 활성 상태 확인
  const isWindowActive = (deadline: Date, windowDate: Date): boolean => {
    const now = new Date();
    return now >= deadline && now <= windowDate;
  };

  // 활동이 해당 윈도우에 포함될 수 있는지 확인 (전날 23:59 이전 제출)
  const isActivityEligibleForWindow = (activity: BSActivityEntry, deadline: Date, day: number): boolean => {
    if (!activity.submittedAt) return false;
    const submittedDate = new Date(activity.submittedAt);
    return submittedDate <= deadline;
  };

  // 현재 시점 기준 다음 발표 윈도우 계산
  const getNextPresentationWindow = (): PresentationWindow | null => {
    const now = new Date();
    return presentationWindows.find(window => 
      new Date(window.windowDate) > now
    ) || null;
  };

  // 마감까지 남은 시간 계산
  const getTimeUntilDeadline = (deadline: string): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return '마감됨';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  // 윈도우 상태별 색상
  const getWindowStatusColor = (window: PresentationWindow): string => {
    const now = new Date();
    const deadline = new Date(window.deadline);
    const windowDate = new Date(window.windowDate);
    
    if (now > windowDate) return 'bg-gray-100 text-gray-700'; // 완료
    if (now >= deadline) return 'bg-green-500/10 text-green-700'; // 발표일
    
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDeadline <= 24) return 'bg-destructive/10 text-destructive'; // 마감 임박
    if (hoursUntilDeadline <= 72) return 'bg-yellow-100 text-orange-700'; // 주의
    
    return 'bg-blue-100 text-blue-700'; // 정상
  };

  // 윈도우 상태 라벨
  const getWindowStatusLabel = (window: PresentationWindow): string => {
    const now = new Date();
    const deadline = new Date(window.deadline);
    const windowDate = new Date(window.windowDate);
    
    if (now > windowDate) return '발표완료';
    if (now >= deadline && now <= windowDate) return '발표일';
    if (now < deadline) return '활동수집중';
    return '종료';
  };

  // 샘플 데이터 로드
  useEffect(() => {
    const loadData = () => {
      // 실제 환경에서는 API 호출
      const sampleActivities: BSActivityEntry[] = [
        {
          id: 'activity-1',
          courseCode,
          courseName,
          round,
          studentId: 'student-1',
          studentName: '김교육',
          title: '고객 상담 및 제품 소개 실습',
          workSite: '서울 강남지점',
          workDate: '2025-01-20',
          workContent: '고객 상담 및 제품 소개를 진행했습니다.',
          learningPoints: '고객별 다른 접근이 필요함을 배웠습니다.',
          submittedAt: '2025-01-20T18:30:00Z',
          status: 'submitted',
          challenges: '',
          solutions: '',
          insights: '',
          improvementAreas: '',
          nextActions: '',
          createdAt: '2025-01-20T18:30:00Z',
          updatedAt: '2025-01-20T18:30:00Z',
          attachments: [],
          isSelected: false,
          scoreReflected: false,
          submissionDeadline: '2025-01-20T23:59:59Z',
          isLateSubmission: false
        }
      ];

      setActivities(sampleActivities);
      setLoading(false);
    };

    setLoading(true);
    setTimeout(loadData, 500);
  }, [courseCode, courseName, round]);

  // PC 프리젠테이션 모드
  const openPresentationMode = (window: PresentationWindow) => {
    if (window.submittedActivities.length === 0) {
      alert('발표할 활동이 없습니다.');
      return;
    }

    // 새 창에서 프리젠테이션 모드 열기
    const presentationWindow = window.open(
      `/presentation/${window.id}`,
      'presentation',
      'width=1920,height=1080,fullscreen=yes,toolbar=no,menubar=no'
    );

    if (presentationWindow) {
      presentationWindow.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">발표 윈도우를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📊 발표 윈도우 관리
            </h1>
            <p className="text-gray-600">
              {courseName} {round}차 - BS 활동 발표 일정 관리 (1, 3, 5, 7, 9, 11일차)
            </p>
            <p className="text-sm text-gray-500 mt-1">
              📌 <strong>마감 규칙:</strong> 발표 전날 23:59까지 제출된 활동만 집계
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-full">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                과정 시작: {new Date(courseStartDate).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 다음 발표 알림 */}
      {(() => {
        const nextWindow = getNextPresentationWindow();
        if (nextWindow) {
          const isUrgent = new Date(nextWindow.deadline).getTime() - new Date().getTime() <= 24 * 60 * 60 * 1000;
          return (
            <div className={`p-4 rounded-full border-l-4 ${isUrgent ? 'bg-destructive/10 border-destructive/50' : 'bg-blue-50 border-blue-400'}`}>
              <div className="flex items-center">
                {isUrgent ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                ) : (
                  <ClockIcon className="h-5 w-5 text-blue-400 mr-3" />
                )}
                <div>
                  <p className={`font-medium ${isUrgent ? 'text-destructive' : 'text-blue-900'}`}>
                    다음 발표: {nextWindow.day}일차 ({new Date(nextWindow.windowDate).toLocaleDateString('ko-KR')})
                  </p>
                  <p className={`text-sm ${isUrgent ? 'text-destructive' : 'text-blue-700'}`}>
                    제출 마감까지: {getTimeUntilDeadline(nextWindow.deadline)}
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* 발표 윈도우 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presentationWindows.map((window) => (
          <div
            key={window.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PresentationChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{window.day}일차 발표</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(window.windowDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWindowStatusColor(window)}`}>
                {getWindowStatusLabel(window)}
              </span>
            </div>

            <div className="space-y-3">
              {/* 제출 마감 정보 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">제출 마감:</span>
                <span className="font-medium text-gray-900">
                  {new Date(window.deadline).toLocaleDateString('ko-KR')} 23:59
                </span>
              </div>

              {/* 활동 제출 현황 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">제출된 활동:</span>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {window.submittedActivities.length}개
                  </span>
                </div>
              </div>

              {/* 남은 시간 */}
              {new Date() < new Date(window.deadline) && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">남은 시간:</span>
                  <span className="font-medium text-orange-600">
                    {getTimeUntilDeadline(window.deadline)}
                  </span>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setSelectedWindow(window)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>상세보기</span>
                </button>
                
                {canManage && window.submittedActivities.length > 0 && (
                  <button
                    onClick={() => openPresentationMode(window)}
                    className="btn-success"
                  >
                    <ComputerDesktopIcon className="h-4 w-4" />
                    <span>발표모드</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 윈도우 상세 모달 */}
      {selectedWindow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedWindow.day}일차 발표 윈도우
                  </h3>
                  <p className="text-gray-600">
                    {new Date(selectedWindow.windowDate).toLocaleDateString('ko-KR')} 발표
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWindow(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* 윈도우 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">제출 마감</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {new Date(selectedWindow.deadline).toLocaleString('ko-KR')}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">제출 활동</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedWindow.submittedActivities.length}개 활동
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <UsersIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">참여 학생</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {new Set(selectedWindow.submittedActivities.map(a => a.studentId)).size}명
                  </p>
                </div>
              </div>

              {/* 제출된 활동 목록 */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">제출된 활동 목록</h4>
                
                {selectedWindow.submittedActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">아직 제출된 활동이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedWindow.submittedActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{activity.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.studentName} | {activity.workSite}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              제출: {new Date(activity.submittedAt!).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          
                          {canManage && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                onChange={(e) => {
                                  // 발표 선택 로직
                                  if (onPresentationSelect) {
                                    const selectedIds = e.target.checked 
                                      ? [activity.id] 
                                      : [];
                                    onPresentationSelect(selectedIds);
                                  }
                                }}
                              />
                              <label className="text-sm text-gray-600">발표 선정</label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationWindowManager;