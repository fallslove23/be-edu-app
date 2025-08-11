import React, { useState } from 'react';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { UpcomingSchedule } from '../../types/trainee-dashboard.types';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScheduleTrackerProps {
  upcomingSchedules: UpcomingSchedule[];
  onScheduleClick?: (schedule: UpcomingSchedule) => void;
}

const ScheduleTracker: React.FC<ScheduleTrackerProps> = ({
  upcomingSchedules,
  onScheduleClick
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');

  // 현재 주의 시작일과 종료일
  const weekStart = startOfWeek(currentWeek, { locale: ko });
  const weekEnd = endOfWeek(currentWeek, { locale: ko });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 주별 네비게이션
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const goToThisWeek = () => {
    setCurrentWeek(new Date());
  };

  // 특정 날짜의 일정 조회
  const getSchedulesForDate = (date: Date) => {
    return upcomingSchedules.filter(schedule => 
      isSameDay(parseISO(schedule.scheduledDate), date)
    );
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
    }
  };

  // 상태별 배경색
  const getStatusBgClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // 타입별 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam':
        return 'text-red-600 bg-red-100';
      case 'bs_activity':
        return 'text-purple-600 bg-purple-100';
      case 'assignment':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-600" />
          강의 일정
        </h2>
        
        {/* 보기 모드 토글 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            주별
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            목록
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <>
          {/* 주별 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {format(weekStart, 'MM월 dd일', { locale: ko })} ~ {format(weekEnd, 'dd일', { locale: ko })}
              </h3>
              <button
                onClick={goToThisWeek}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                이번 주로
              </button>
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* 주간 캘린더 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {/* 요일 헤더 */}
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center font-medium text-gray-700 py-2">
                {day}
              </div>
            ))}
            
            {/* 날짜 및 일정 */}
            {weekDays.map((day) => {
              const daySchedules = getSchedulesForDate(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    isCurrentDay 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentDay ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => onScheduleClick?.(schedule)}
                        className={`p-1 rounded text-xs cursor-pointer transition-colors ${getStatusBgClass(schedule.status)} hover:opacity-80`}
                      >
                        <div className="flex items-center mb-1">
                          {getStatusIcon(schedule.status)}
                          <span className="ml-1 font-medium truncate">
                            {schedule.title}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    ))}
                    
                    {daySchedules.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{daySchedules.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* 리스트 뷰 */
        <div className="space-y-4">
          {upcomingSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>예정된 강의가 없습니다.</p>
            </div>
          ) : (
            upcomingSchedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => onScheduleClick?.(schedule)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getStatusBgClass(schedule.status)}`}
              >
                {/* 일정 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {getStatusIcon(schedule.status)}
                    <h3 className="ml-2 font-medium text-gray-900">
                      {schedule.title}
                    </h3>
                    {schedule.isToday && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        오늘
                      </span>
                    )}
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(schedule.type)}`}>
                    {schedule.type === 'class' ? '수업' : 
                     schedule.type === 'exam' ? '시험' : 
                     schedule.type === 'bs_activity' ? 'BS활동' : '과제'}
                  </span>
                </div>

                {/* 과정명 */}
                <div className="text-sm font-medium text-blue-900 mb-2">
                  {schedule.courseName}
                </div>

                {/* 일정 세부 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    {format(parseISO(schedule.scheduledDate), 'MM/dd (E)', { locale: ko })}
                  </div>
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  
                  {schedule.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {schedule.location}
                    </div>
                  )}
                </div>

                {/* 강사 정보 */}
                {schedule.instructorName && (
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-1" />
                    강사: {schedule.instructorName}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
            완료
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 text-blue-500 mr-1" />
            예정
          </div>
          <div className="flex items-center">
            <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
            취소
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTracker;