import React, { useState, useEffect, memo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import type { Schedule, CalendarEvent } from '../../types/schedule.types';
import { FirebasePlannerService } from '../../services/firebase-planner.service';
import toast from 'react-hot-toast';

interface ScheduleViewerProps {
  courseId?: string;
  instructorId?: string;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  courseId,
  instructorId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 현재 주의 시작일과 종료일 계산
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return { start, end };
  };

  // 주간의 날짜들 생성
  const getWeekDays = () => {
    const { start } = getWeekRange(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // CalendarEvent를 Schedule로 변환
  const convertEventToSchedule = (event: CalendarEvent): Schedule => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    return {
      id: event.id,
      course_id: event.course_id || '',
      title: event.title,
      subject: event.title,
      instructor_id: event.instructor_id,
      start_time: startDate.toTimeString().slice(0, 5), // HH:MM 형식
      end_time: endDate.toTimeString().slice(0, 5),
      date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
      classroom: event.classroom,
      notes: '',
      status: event.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  // 데이터 로드
  useEffect(() => {
    loadScheduleData();
  }, [currentDate, courseId, instructorId]);

  const loadScheduleData = async () => {
    try {
      setIsLoading(true);
      setIsOffline(false);

      // Firebase Planner에서 데이터 가져오기
      const { start, end } = getWeekRange(currentDate);
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      const calendarEvents = await FirebasePlannerService.getCalendarEvents(startDate, endDate);

      // CalendarEvent → Schedule 변환
      let convertedSchedules = calendarEvents.map(convertEventToSchedule);

      // courseId 필터링 (선택 사항)
      if (courseId) {
        convertedSchedules = convertedSchedules.filter(s => s.course_id === courseId);
      }

      // instructorId 필터링 (선택 사항)
      if (instructorId) {
        convertedSchedules = convertedSchedules.filter(s => s.instructor_id === instructorId);
      }

      setSchedules(convertedSchedules);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));

    } catch (error) {
      console.error('스케줄 데이터 로드 중 오류:', error);
      setIsOffline(true);
      toast.error('Firebase 연동 중 오류가 발생했습니다. 목업 데이터를 표시합니다.');

      // Fallback: 목업 데이터
      const mockSchedules: Schedule[] = [
        {
          id: 'schedule-001',
          course_id: 'course-001',
          title: 'BS 기초과정 (목업)',
          subject: 'BS 기본기',
          instructor_id: '김강사',
          start_time: '09:00',
          end_time: '12:00',
          date: '2025-01-06',
          classroom: '1강의실',
          notes: '기초 이론 및 실습',
          status: 'scheduled',
          created_at: '2025-01-01T09:00:00Z',
          updated_at: '2025-01-01T09:00:00Z'
        }
      ];
      setSchedules(mockSchedules);
    } finally {
      setIsLoading(false);
    }
  };

  // 날짜 네비게이션
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 해당 날짜의 스케줄 가져오기
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  // 스케줄 카드 컴포넌트
  const ScheduleCard: React.FC<{ schedule: Schedule }> = ({ schedule }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'in_progress':
          return 'bg-primary text-primary-foreground border-border';
        case 'completed':
          return 'bg-secondary text-secondary-foreground border-border';
        case 'cancelled':
          return 'bg-destructive text-destructive-foreground border-border';
        default:
          return 'bg-accent text-accent-foreground border-border';
      }
    };

    return (
      <div className={`rounded-lg border-2 p-3 mb-2 transition-all hover:shadow-md cursor-pointer ${getStatusColor(schedule.status)}`}>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm leading-tight">{schedule.title}</h4>
            {schedule.status === 'in_progress' && (
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            )}
          </div>
          
          <div className="flex items-center text-xs opacity-75">
            <ClockIcon className="w-3 h-3 mr-1" />
            {schedule.start_time} - {schedule.end_time}
          </div>
          
          <div className="flex items-center text-xs opacity-75">
            <UserIcon className="w-3 h-3 mr-1" />
            {schedule.instructor_id}
          </div>
          
          <div className="flex items-center text-xs opacity-75">
            <MapPinIcon className="w-3 h-3 mr-1" />
            {schedule.classroom}
          </div>
        </div>
      </div>
    );
  };

  // 빈 날짜 카드
  const EmptyDayCard = () => (
    <div className="bg-secondary border-2 border-dashed border-border rounded-lg p-4 text-center">
      <div className="text-muted-foreground text-sm">예정된 수업이 없습니다</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">스케줄 로딩 중...</p>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();
  const { start, end } = getWeekRange(currentDate);
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 오프라인 상태 표시 */}
      {isOffline && (
        <div className="bg-muted border-2 border-destructive rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
            <p className="text-sm text-muted-foreground">
              🔌 Firebase 연결 실패 - 목업 데이터를 표시합니다
            </p>
          </div>
        </div>
      )}

      {/* 동기화 상태 표시 */}
      {!isOffline && lastSyncTime && (
        <div className="bg-accent/10 border border-accent rounded-xl p-3">
          <p className="text-xs text-accent-foreground">
            ✓ Firebase 동기화 완료 - 마지막 업데이트: {lastSyncTime}
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-card-foreground">시간표 뷰어</h1>
          </div>

          <button
            onClick={loadScheduleData}
            className="btn-secondary flex items-center text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>

        {/* 날짜 네비게이션 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-card-foreground">
                {start.getFullYear()}년 {start.getMonth() + 1}월
              </h2>
              <p className="text-sm text-muted-foreground">
                {start.getDate()}일 - {end.getDate()}일
              </p>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 주간 뷰 - 모바일 친화적 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {weekDays.map((day, index) => {
          const daySchedules = getSchedulesForDate(day);
          const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
          
          return (
            <div key={index} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              {/* 날짜 헤더 */}
              <div className={`p-3 border-b border-border ${
                isToday(day)
                  ? 'bg-accent border-accent'
                  : 'bg-secondary'
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${
                    isToday(day) ? 'text-accent-foreground' : 'text-muted-foreground'
                  }`}>
                    {dayNames[day.getDay()]}요일
                  </div>
                  <div className={`text-lg font-bold ${
                    isToday(day)
                      ? 'text-accent-foreground'
                      : day.getDay() === 0
                        ? 'text-destructive'
                        : day.getDay() === 6
                          ? 'text-primary'
                          : 'text-card-foreground'
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              </div>
              
              {/* 스케줄 목록 */}
              <div className="p-3 min-h-[200px] space-y-2">
                {daySchedules.length > 0 ? (
                  daySchedules.map(schedule => (
                    <ScheduleCard key={schedule.id} schedule={schedule} />
                  ))
                ) : (
                  <EmptyDayCard />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">상태 범례</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent border border-border rounded"></div>
            <span className="text-xs text-muted-foreground">예정됨</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary border border-border rounded flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
            </div>
            <span className="text-xs text-muted-foreground">진행 중</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-secondary border border-border rounded"></div>
            <span className="text-xs text-muted-foreground">완료됨</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive border border-border rounded"></div>
            <span className="text-xs text-muted-foreground">취소됨</span>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">이번 주 전체</p>
              <p className="text-2xl font-bold">{schedules.length}개</p>
            </div>
            <CalendarIcon className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-accent text-accent-foreground rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-foreground/80 text-sm">진행 중</p>
              <p className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'in_progress').length}개
              </p>
            </div>
            <div className="w-8 h-8 bg-accent-foreground/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-accent-foreground rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-secondary text-secondary-foreground rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-foreground/80 text-sm">완료됨</p>
              <p className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'completed').length}개
              </p>
            </div>
            <div className="w-8 h-8 bg-secondary-foreground/20 rounded-full flex items-center justify-center text-xs">✓</div>
          </div>
        </div>

        <div className="bg-muted text-muted-foreground rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground/80 text-sm">강의실</p>
              <p className="text-2xl font-bold">
                {new Set(schedules.map(s => s.classroom)).size}개
              </p>
            </div>
            <MapPinIcon className="h-8 w-8 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ScheduleViewer);