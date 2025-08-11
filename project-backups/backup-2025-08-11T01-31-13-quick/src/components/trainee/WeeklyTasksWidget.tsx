import React, { useState } from 'react';
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon, 
  CameraIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { WeeklyTasks, BSActivityTask, DashboardNotification } from '../../types/trainee-dashboard.types';
import { format, parseISO, isToday, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface WeeklyTasksWidgetProps {
  weeklyTasks: WeeklyTasks;
  notifications: DashboardNotification[];
  onTaskClick?: (taskId: string, taskType: 'class' | 'bs_activity' | 'assignment' | 'exam') => void;
  onNotificationClick?: (notificationId: string) => void;
}

const WeeklyTasksWidget: React.FC<WeeklyTasksWidgetProps> = ({
  weeklyTasks,
  notifications,
  onTaskClick,
  onNotificationClick
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notifications'>('tasks');

  // 우선순위별 정렬
  const sortedNotifications = notifications
    .filter(n => !n.isRead)
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  // 마감일까지 남은 일수 계산
  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(parseISO(dueDate), new Date());
    return days;
  };

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // 총 할 일 개수 계산
  const totalTasks = weeklyTasks.classesAttendanceRequired.length + 
                    weeklyTasks.bsActivitiesDue.length + 
                    weeklyTasks.assignmentsDue.length + 
                    weeklyTasks.examsDue.length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 헤더 및 탭 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ClockIcon className="h-6 w-6 mr-2 text-green-600" />
          이번 주 할 일
        </h2>
        
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'tasks' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            할 일 ({totalTasks})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1 text-sm rounded-md transition-colors relative ${
              activeTab === 'notifications' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            알림 ({sortedNotifications.length})
            {sortedNotifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="space-y-6">
          {totalTasks === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-green-400" />
              <p className="font-medium">이번 주 할 일을 모두 완료했습니다! 🎉</p>
              <p className="text-sm mt-1">휴식을 취하거나 다음 주를 준비해보세요.</p>
            </div>
          ) : (
            <>
              {/* 수업 참석 */}
              {weeklyTasks.classesAttendanceRequired.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600" />
                    수업 참석 ({weeklyTasks.classesAttendanceRequired.length})
                  </h3>
                  <div className="space-y-2">
                    {weeklyTasks.classesAttendanceRequired.map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => onTaskClick?.(schedule.id, 'class')}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          schedule.isToday 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {schedule.title}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                              {schedule.courseName}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {format(parseISO(schedule.scheduledDate), 'MM/dd (E)', { locale: ko })} 
                              {' '}{schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {schedule.isToday && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium mr-2">
                                오늘
                              </span>
                            )}
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BS 활동 제출 */}
              {weeklyTasks.bsActivitiesDue.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <CameraIcon className="h-5 w-5 mr-2 text-purple-600" />
                    BS 활동 제출 ({weeklyTasks.bsActivitiesDue.length})
                  </h3>
                  <div className="space-y-2">
                    {weeklyTasks.bsActivitiesDue.map((activity) => {
                      const daysUntil = getDaysUntilDue(activity.dueDate);
                      const isUrgent = daysUntil <= 1;
                      
                      return (
                        <div
                          key={activity.id}
                          onClick={() => onTaskClick?.(activity.id, 'bs_activity')}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            isUrgent 
                              ? 'bg-yellow-50 border-yellow-200' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {activity.title}
                              </div>
                              <div className="text-sm text-purple-600 mt-1">
                                {activity.courseName}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {activity.description}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center mt-2">
                                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                                마감: {format(parseISO(activity.dueDate), 'MM/dd (E)', { locale: ko })}
                                {daysUntil === 0 && <span className="ml-2 text-red-600 font-medium">(오늘 마감)</span>}
                                {daysUntil === 1 && <span className="ml-2 text-yellow-600 font-medium">(내일 마감)</span>}
                                {daysUntil > 1 && <span className="ml-2">({daysUntil}일 남음)</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {isUrgent && (
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                              )}
                              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 과제 제출 */}
              {weeklyTasks.assignmentsDue.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-orange-600" />
                    과제 제출 ({weeklyTasks.assignmentsDue.length})
                  </h3>
                  <div className="space-y-2">
                    {weeklyTasks.assignmentsDue.map((assignment) => (
                      <div
                        key={assignment.id}
                        onClick={() => onTaskClick?.(assignment.id, 'assignment')}
                        className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-gray-50 border-gray-200 hover:bg-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {assignment.title}
                            </div>
                            <div className="text-sm text-orange-600 mt-1">
                              {assignment.courseName}
                            </div>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 시험 일정 */}
              {weeklyTasks.examsDue.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-red-600" />
                    시험 일정 ({weeklyTasks.examsDue.length})
                  </h3>
                  <div className="space-y-2">
                    {weeklyTasks.examsDue.map((exam) => (
                      <div
                        key={exam.id}
                        onClick={() => onTaskClick?.(exam.id, 'exam')}
                        className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-red-50 border-red-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {exam.title}
                            </div>
                            <div className="text-sm text-red-600 mt-1">
                              {exam.courseName}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <CalendarDaysIcon className="h-4 w-4 mr-1" />
                              {format(parseISO(exam.examDate), 'MM/dd (E) HH:mm', { locale: ko })}
                            </div>
                          </div>
                          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* 알림 탭 */
        <div className="space-y-4">
          {sortedNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>새로운 알림이 없습니다.</p>
            </div>
          ) : (
            sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => onNotificationClick?.(notification.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md border-l-4 ${
                  notification.priority === 'high' ? 'border-l-red-500 bg-red-50' :
                  notification.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <h4 className="font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                          {notification.priority === 'high' ? '긴급' : 
                           notification.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {notification.message}
                      </p>
                      <div className="text-xs text-gray-500">
                        {format(parseISO(notification.createdAt), 'MM/dd HH:mm', { locale: ko })}
                      </div>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 mt-1" />
                </div>
                
                {notification.actionUrl && notification.actionText && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                      {notification.actionText} →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyTasksWidget;