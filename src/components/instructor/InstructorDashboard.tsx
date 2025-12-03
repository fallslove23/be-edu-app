import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BellIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { InstructorDashboardService } from '../../services/instructor-dashboard.service';
import { InstructorDashboardData } from '../../types/instructor-dashboard.types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { PageContainer } from '../common/PageContainer';

interface InstructorDashboardProps {
  instructorId: string;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ instructorId }) => {
  const [dashboardData, setDashboardData] = useState<InstructorDashboardData | null>(null);
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

      const data = await InstructorDashboardService.getInstructorDashboard(instructorId);
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
  }, [instructorId]);

  // 새로고침
  const handleRefresh = () => {
    loadDashboard(true);
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

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-emerald-600"></div>
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

  const { instructor, teachingOverview, assignedCourses, upcomingClasses, recentActivities, paymentSummary, notifications } = dashboardData;

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
              <AcademicCapIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                안녕하세요, {instructor.name} 강사님!
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30">
                  강사
                </span>
                <span className="text-white/80 text-sm">오늘도 좋은 강의 부탁드립니다!</span>
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

      {/* 강의 개요 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <BookOpenIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">담당 과정</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {teachingOverview.activeCourses}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                총 {teachingOverview.totalCourses}개
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">수강생</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {teachingOverview.activeStudents}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                총 {teachingOverview.totalStudents}명
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 출석률</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {teachingOverview.averageAttendanceRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {teachingOverview.totalTeachingHours}시간 강의
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30">
              <CurrencyDollarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">이번 달 급여</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(paymentSummary.currentMonth.totalAmount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {paymentSummary.currentMonth.completedClasses}/{paymentSummary.currentMonth.totalClasses} 완료
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 담당 과정 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                담당 과정
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              {assignedCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  담당하는 과정이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedCourses.map((course) => (
                    <div key={course.courseId} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {course.courseName}
                          </h3>
                          <div className="flex items-center mt-2 flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              course.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : course.status === 'completed'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {course.status === 'active' ? '진행중' : course.status === 'completed' ? '완료' : '예정'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {course.courseCode}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.totalStudents}명
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            출석률 {course.averageAttendance}%
                          </div>
                        </div>
                      </div>

                      {/* 진도 바 */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(course.completedSessions / course.totalSessions) * 100}%` }}
                        ></div>
                      </div>

                      {/* 다음 수업 */}
                      {course.nextClass && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                          <CalendarDaysIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span>다음 수업: {formatDate(course.nextClass.date, true)} | {course.nextClass.location}</span>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        진행: {course.completedSessions}/{course.totalSessions} 회차
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 다가오는 수업 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                다가오는 수업
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {upcomingClasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <div className="text-sm">예정된 수업이 없습니다.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingClasses.slice(0, 5).map((classItem) => (
                    <div key={classItem.id} className="flex items-start bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                      <div className={`w-2 h-2 rounded-full mr-3 mt-1.5 flex-shrink-0 ${classItem.isToday ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{classItem.courseName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(classItem.scheduledDate, true)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{classItem.location}</div>
                      </div>
                      {classItem.isToday && (
                        <span className="ml-2 px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex-shrink-0">
                          오늘
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 알림 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
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
                    <div key={notification.id} className={`border-l-4 rounded-r-lg pl-4 pr-3 py-3 ${
                      notification.priority === 'high'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    } hover:brightness-95 dark:hover:brightness-110 transition`}>
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
                          <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
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

export default InstructorDashboard;
