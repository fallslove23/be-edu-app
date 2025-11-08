import React, { useState, useEffect } from 'react';
import { 
  HomeIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { TraineeDashboardService } from '../../services/trainee-dashboard.service';
import { TraineeDashboardData, LearningOverview, CourseProgress } from '../../types/trainee-dashboard.types';
import { User } from '../../services/user.services';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface TraineeDashboardProps {
  traineeId: string;
}

const TraineeDashboard: React.FC<TraineeDashboardProps> = ({ traineeId }) => {
  const [dashboardData, setDashboardData] = useState<TraineeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 대시보드 데이터 로드
  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await TraineeDashboardService.getTraineeDashboard(traineeId);
      setDashboardData(data);
      
      if (isRefresh) {
        toast.success('대시보드가 새로고침되었습니다.');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError('대시보드를 불러오는데 실패했습니다.');
      toast.error('대시보드 로딩에 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [traineeId]);

  // 새로고침
  const handleRefresh = () => {
    loadDashboard(true);
  };

  // 레벨 배지 컬러
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'advanced':
        return 'bg-purple-100 text-purple-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // 상태 배지 컬러
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string, includeTime = false) => {
    try {
      const date = parseISO(dateString);
      return format(date, includeTime ? 'MM/dd (E) HH:mm' : 'MM/dd (E)', { locale: ko });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">대시보드를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-gray-600 mb-4">{error || '대시보드 데이터를 불러올 수 없습니다.'}</div>
        <button
          onClick={() => loadDashboard()}
          className="btn-primary"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          다시 시도
        </button>
      </div>
    );
  }

  const { student, learningOverview, currentCourses, upcomingSchedules, weeklyTasks, notifications } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                안녕하세요, {student.name}님!
              </h1>
              <div className="flex items-center mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass('basic')}`}>
                  Basic 레벨
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {/* 학습 개요 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수강 과정</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {learningOverview.activeCourses}
                </p>
                <p className="text-xs text-gray-500">
                  총 {learningOverview.totalCoursesEnrolled}개 등록
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">완료 과정</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {learningOverview.completedCourses}
                </p>
                <p className="text-xs text-gray-500">
                  수료율 {Math.round((learningOverview.completedCourses / learningOverview.totalCoursesEnrolled) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 점수</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {learningOverview.averageScore}점
                </p>
                <p className="text-xs text-gray-500">
                  총 {learningOverview.totalLearningHours}시간 학습
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">출석률</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {learningOverview.attendanceRate}%
                </p>
                <p className="text-xs text-gray-500">
                  BS 활동 {learningOverview.bsActivitiesSubmitted}/{learningOverview.bsActivitiesRequired}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 현재 수강 과정 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
                  현재 수강 과정
                </h2>
              </div>
              <div className="p-6">
                {currentCourses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    현재 수강 중인 과정이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentCourses.map((courseProgress) => (
                      <div key={courseProgress.course.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {courseProgress.course.name}
                            </h3>
                            <div className="flex items-center mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${getStatusBadgeClass(courseProgress.enrollment.status)}`}>
                                {courseProgress.enrollment.status === 'active' ? '수강중' : '완료'}
                              </span>
                              {courseProgress.isBasicCourse && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                  Basic
                                </span>
                              )}
                              {courseProgress.isAdvancedCourse && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                  Advanced
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {courseProgress.progressPercentage}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {courseProgress.attendedSessions}/{courseProgress.totalSessions} 완료
                            </div>
                          </div>
                        </div>

                        {/* 진도 바 */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${courseProgress.progressPercentage}%` }}
                          ></div>
                        </div>

                        {/* 다음 일정 */}
                        {courseProgress.nextSchedule && (
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            다음 수업: {formatDate(courseProgress.nextSchedule.scheduledDate, true)}
                            {courseProgress.nextSchedule.isToday && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                오늘
                              </span>
                            )}
                          </div>
                        )}

                        {courseProgress.currentScore && (
                          <div className="text-sm text-gray-600 mt-2">
                            현재 점수: {courseProgress.currentScore}점
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 - 이번 주 할 일 & 알림 */}
          <div className="space-y-6">
            {/* 이번 주 할 일 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-green-600" />
                  이번 주 할 일
                </h3>
              </div>
              <div className="p-6">
                {/* 수업 일정 */}
                {weeklyTasks.classesAttendanceRequired.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">수업 참석</h4>
                    <div className="space-y-2">
                      {weeklyTasks.classesAttendanceRequired.slice(0, 3).map((schedule) => (
                        <div key={schedule.id} className="flex items-center text-sm">
                          <div className={`w-2 h-2 rounded-full mr-2 ${schedule.isToday ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                          <div>
                            <div className="text-gray-900">{schedule.title}</div>
                            <div className="text-gray-500">{formatDate(schedule.scheduledDate, true)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BS 활동 */}
                {weeklyTasks.bsActivitiesDue.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">BS 활동 제출</h4>
                    <div className="space-y-2">
                      {weeklyTasks.bsActivitiesDue.slice(0, 2).map((activity) => (
                        <div key={activity.id} className="flex items-center text-sm">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                          <div>
                            <div className="text-gray-900">{activity.title}</div>
                            <div className="text-gray-500">마감: {formatDate(activity.dueDate)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {weeklyTasks.classesAttendanceRequired.length === 0 && weeklyTasks.bsActivitiesDue.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    이번 주 예정된 일정이 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 알림 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BellIcon className="h-5 w-5 mr-2 text-orange-600" />
                  알림
                </h3>
              </div>
              <div className="p-6">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    새로운 알림이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
      </div>
    </div>
  );
};

export default TraineeDashboard;