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
import { PageContainer } from '../common/PageContainer';

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
        return 'bg-green-500/10 text-green-700';
    }
  };

  // 상태 배지 컬러
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700';
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
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">대시보드를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
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
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 rounded-[2rem] shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
              <UserCircleIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                안녕하세요, {student.name}님!
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  Basic 레벨
                </span>
                <span className="text-white/80 text-sm">오늘도 화이팅!</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center px-4 py-2.5 text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 학습 개요 카드 - 모바일 가로 스크롤 */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-x-visible md:pb-0 snap-x snap-mandatory mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
              <BookOpenIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">수강 과정</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {learningOverview.activeCourses}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                총 {learningOverview.totalCoursesEnrolled}개 등록
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">완료 과정</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {learningOverview.completedCourses}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                수료율 {Math.round((learningOverview.completedCourses / learningOverview.totalCoursesEnrolled) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 점수</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {learningOverview.averageScore}점
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                총 {learningOverview.totalLearningHours}시간 학습
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <ClockIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">출석률</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {learningOverview.attendanceRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                BS 활동 {learningOverview.bsActivitiesSubmitted}/{learningOverview.bsActivitiesRequired}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 현재 수강 과정 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                현재 수강 과정
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {currentCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  현재 수강 중인 과정이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentCourses.map((courseProgress) => (
                    <div key={courseProgress.course.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {courseProgress.course.name}
                          </h3>
                          <div className="flex items-center mt-2 flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadgeClass(courseProgress.enrollment.status)}`}>
                              {courseProgress.enrollment.status === 'active' ? '수강중' : '완료'}
                            </span>
                            {courseProgress.isBasicCourse && (
                              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                Basic
                              </span>
                            )}
                            {courseProgress.isAdvancedCourse && (
                              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                Advanced
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {courseProgress.progressPercentage}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {courseProgress.attendedSessions}/{courseProgress.totalSessions} 완료
                          </div>
                        </div>
                      </div>

                      {/* 진도 바 */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${courseProgress.progressPercentage}%` }}
                        ></div>
                      </div>

                      {/* 다음 일정 */}
                      {courseProgress.nextSchedule && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                          <CalendarDaysIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span>다음 수업: {formatDate(courseProgress.nextSchedule.scheduledDate, true)}</span>
                          {courseProgress.nextSchedule.isToday && (
                            <span className="ml-2 px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold">
                              오늘
                            </span>
                          )}
                        </div>
                      )}

                      {courseProgress.currentScore && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          현재 점수: <span className="font-semibold text-gray-900 dark:text-white">{courseProgress.currentScore}점</span>
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
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                이번 주 할 일
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {/* 수업 일정 */}
              {weeklyTasks.classesAttendanceRequired.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                    수업 참석
                  </h4>
                  <div className="space-y-3">
                    {weeklyTasks.classesAttendanceRequired.slice(0, 3).map((schedule) => (
                      <div key={schedule.id} className="flex items-start bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                        <div className={`w-2 h-2 rounded-full mr-3 mt-1.5 flex-shrink-0 ${schedule.isToday ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{schedule.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(schedule.scheduledDate, true)}</div>
                        </div>
                        {schedule.isToday && (
                          <span className="ml-2 px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex-shrink-0">
                            오늘
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BS 활동 */}
              {weeklyTasks.bsActivitiesDue.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                    BS 활동 제출
                  </h4>
                  <div className="space-y-3">
                    {weeklyTasks.bsActivitiesDue.slice(0, 2).map((activity) => (
                      <div key={activity.id} className="flex items-start bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border-l-2 border-amber-500">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">마감: {formatDate(activity.dueDate)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {weeklyTasks.classesAttendanceRequired.length === 0 && weeklyTasks.bsActivitiesDue.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <div className="text-sm">이번 주 예정된 일정이 없습니다.</div>
                </div>
              )}
            </div>
          </div>

          {/* 알림 */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <BellIcon className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                알림
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {notifications.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <div className="text-sm">새로운 알림이 없습니다.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="border-l-4 border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-lg pl-4 pr-3 py-3 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
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
    </PageContainer>
  );
};

export default TraineeDashboard;