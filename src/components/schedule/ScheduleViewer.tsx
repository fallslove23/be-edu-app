import React, { useState, useEffect, memo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  XMarkIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import type { Schedule, CalendarEvent } from '../../types/schedule.types';
import type { CourseRound } from '../../types/course-template.types';
import { FirebasePlannerService } from '../../services/firebase-planner.service';
import { supabase } from '../../services/supabase';
import { ResourceSelector } from './ResourceSelector';
import { BreadcrumbNav } from '../navigation/BreadcrumbNav';
import { QuickActionsMenu } from '../common/QuickActionsMenu';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [courseRounds, setCourseRounds] = useState<CourseRound[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // 일정 추가 폼 데이터
  const [scheduleForm, setScheduleForm] = useState({
    round_id: '',
    subject_id: '',
    session_date: '',
    start_time: '09:00',
    end_time: '10:00',
    title: '',
    actual_instructor_id: '',
    classroom_id: '',
    notes: ''
  });

  // 세션 상세 모달 상태
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
    loadCourseRounds();
    loadSubjects();
  }, [currentDate, courseId, instructorId]);

  const loadScheduleData = async () => {
    try {
      setIsLoading(true);
      setIsOffline(false);

      const { start, end } = getWeekRange(currentDate);
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];

      // Supabase에서 course_sessions 데이터 가져오기
      let query = supabase
        .from('course_sessions')
        .select(`
          *,
          course_rounds!inner(
            id,
            course_name,
            course_id,
            courses!inner(
              id,
              title
            )
          ),
          subjects(
            id,
            name
          )
        `)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      // courseId 필터링
      if (courseId) {
        query = query.eq('course_rounds.course_id', courseId);
      }

      // instructorId 필터링
      if (instructorId) {
        query = query.eq('actual_instructor_id', instructorId);
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      // course_sessions → Schedule 형식으로 변환
      const convertedSchedules: Schedule[] = (sessions || []).map(session => ({
        id: session.id,
        course_id: session.course_rounds?.course_id || '',
        title: session.title || session.course_rounds?.course_name || '제목 없음',
        subject: session.subjects?.name || session.title || '',
        instructor_id: session.actual_instructor_id || '',
        start_time: session.start_time,
        end_time: session.end_time,
        date: session.session_date,
        classroom: session.classroom || '',
        notes: '',
        status: session.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        created_at: session.created_at,
        updated_at: session.updated_at
      }));

      setSchedules(convertedSchedules);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));

    } catch (error) {
      console.error('스케줄 데이터 로드 중 오류:', error);
      setIsOffline(true);
      toast.error('일정 데이터를 불러오는 중 오류가 발생했습니다.');
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 과정 차수 목록 로드
  const loadCourseRounds = async () => {
    try {
      const { data, error } = await supabase
        .from('course_rounds')
        .select('*')
        .in('status', ['recruiting', 'in_progress'])
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCourseRounds(data || []);
    } catch (error) {
      console.error('과정 차수 로드 중 오류:', error);
    }
  };

  // 과목 목록 로드
  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('과목 로드 중 오류:', error);
    }
  };

  // 일정 추가 모달 열기
  const openAddModal = (date?: string, time?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetTime = time || '09:00';

    setScheduleForm({
      round_id: '',
      subject_id: '',
      session_date: targetDate,
      start_time: targetTime,
      end_time: calculateEndTime(targetTime, 1), // 기본 1시간
      title: '',
      actual_instructor_id: '',
      classroom_id: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  // 종료 시간 자동 계산
  const calculateEndTime = (startTime: string, durationHours: number = 1): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + durationHours;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // 세션 상세 정보 로드
  const loadSessionDetails = async (sessionId: string) => {
    try {
      setIsLoadingDetails(true);

      // 세션 기본 정보 + 차수 + 과목 + 강사 + 커리큘럼 + 교육생
      const { data: session, error: sessionError } = await supabase
        .from('course_sessions')
        .select(`
          *,
          course_rounds!inner(
            id,
            course_name,
            round_number,
            start_date,
            end_date,
            status,
            template_id,
            course_templates(
              id,
              name,
              curriculum
            )
          ),
          subjects(
            id,
            name,
            description
          ),
          users!course_sessions_actual_instructor_id_fkey(
            id,
            name,
            email
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // 해당 차수의 교육생 목록 조회
      const { data: trainees, error: traineesError } = await supabase
        .from('round_trainees')
        .select(`
          id,
          trainee_id,
          trainees(
            id,
            name,
            email,
            department,
            employee_id
          )
        `)
        .eq('round_id', session.course_rounds.id);

      if (traineesError) console.error('교육생 조회 오류:', traineesError);

      // 출석 정보 조회
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', sessionId);

      if (attendanceError) console.error('출석 정보 조회 오류:', attendanceError);

      setSessionDetails({
        ...session,
        trainees: trainees?.map(rt => rt.trainees) || [],
        attendance: attendance || []
      });

    } catch (error) {
      console.error('세션 상세 정보 로드 중 오류:', error);
      toast.error('세션 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // 세션 카드 클릭 시 상세 모달 열기
  const handleSessionClick = async (schedule: Schedule) => {
    setSelectedSession(schedule);
    setShowDetailModal(true);
    await loadSessionDetails(schedule.id);
  };

  // 일정 추가 처리
  const handleAddSchedule = async () => {
    try {
      if (!scheduleForm.round_id || !scheduleForm.session_date || !scheduleForm.start_time ||
        !scheduleForm.end_time || !scheduleForm.actual_instructor_id || !scheduleForm.classroom_id) {
        toast.error('필수 항목을 모두 입력해주세요.');
        return;
      }

      const { data, error } = await supabase
        .from('course_sessions')
        .insert([{
          round_id: scheduleForm.round_id,
          subject_id: scheduleForm.subject_id || null,
          session_date: scheduleForm.session_date,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          title: scheduleForm.title || '강의',
          actual_instructor_id: scheduleForm.actual_instructor_id,
          classroom: scheduleForm.classroom_id,
          status: 'scheduled',
          notes: scheduleForm.notes
        }])
        .select();

      if (error) throw error;

      toast.success('일정이 추가되었습니다.');
      setShowAddModal(false);
      loadScheduleData(); // 목록 새로고침
    } catch (error) {
      console.error('일정 추가 중 오류:', error);
      toast.error('일정 추가에 실패했습니다.');
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
      <div
        className={`rounded-full border-2 p-3 mb-2 transition-all hover:shadow-md cursor-pointer ${getStatusColor(schedule.status)}`}
        onClick={() => handleSessionClick(schedule)}
      >
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm leading-tight flex-1">{schedule.title}</h4>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {schedule.status === 'in_progress' && (
                <span className="inline-block w-2 h-2 bg-primary rounded-lg animate-pulse"></span>
              )}
              <QuickActionsMenu
                sessionId={schedule.id}
                roundId={schedule.course_id}
                className="ml-1"
              />
            </div>
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
  const EmptyDayCard: React.FC<{ date: Date }> = ({ date }) => (
    <button
      onClick={() => openAddModal(date.toISOString().split('T')[0])}
      className="w-full bg-secondary border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-accent/10 hover:border-accent transition-colors cursor-pointer"
    >
      <div className="text-muted-foreground text-sm flex items-center justify-center gap-2">
        <PlusIcon className="w-4 h-4" />
        일정 추가
      </div>
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-lg animate-spin"></div>
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
    <div className="space-y-4 w-full">
      {/* 오프라인 상태 표시 */}
      {isOffline && (
        <div className="bg-muted border-2 border-destructive rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-destructive rounded-lg animate-pulse"></div>
            <p className="text-sm text-muted-foreground">
              🔌 Firebase 연결 실패 - 목업 데이터를 표시합니다
            </p>
          </div>
        </div>
      )}

      {/* 동기화 상태 표시 */}
      {!isOffline && lastSyncTime && (
        <div className="bg-accent/10 border border-accent rounded-lg p-3">
          <p className="text-xs text-accent-foreground">
            ✓ Firebase 동기화 완료 - 마지막 업데이트: {lastSyncTime}
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav
          items={[
            { label: '일정 관리', href: '/schedule' },
            { label: '시간표 뷰어' }
          ]}
          className="mb-4"
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-card-foreground">시간표 뷰어</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAddModal()}
              className="btn-primary flex items-center text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              일정 추가
            </button>
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
            className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-full hover:bg-accent/80 transition-colors"
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
            <div key={index} className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {/* 날짜 헤더 */}
              <div className={`p-3 border-b border-border ${isToday(day)
                  ? 'bg-accent border-accent'
                  : 'bg-secondary'
                }`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-medium ${isToday(day) ? 'text-accent-foreground' : 'text-muted-foreground'
                    }`}>
                    {dayNames[day.getDay()]}요일
                  </div>
                  <div className={`text-lg font-bold ${isToday(day)
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
                  <EmptyDayCard date={day} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">상태 범례</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent border border-border rounded"></div>
            <span className="text-xs text-muted-foreground">예정됨</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary border border-border rounded flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary-foreground rounded-lg"></div>
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
        <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">이번 주 전체</p>
              <p className="text-2xl font-bold">{schedules.length}개</p>
            </div>
            <CalendarIcon className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="bg-accent text-accent-foreground rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-foreground/80 text-sm">진행 중</p>
              <p className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'in_progress').length}개
              </p>
            </div>
            <div className="w-8 h-8 bg-accent-foreground/20 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-accent-foreground rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-secondary text-secondary-foreground rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-foreground/80 text-sm">완료됨</p>
              <p className="text-2xl font-bold">
                {schedules.filter(s => s.status === 'completed').length}개
              </p>
            </div>
            <div className="w-8 h-8 bg-secondary-foreground/20 rounded-lg flex items-center justify-center text-xs">✓</div>
          </div>
        </div>

        <div className="bg-muted text-muted-foreground rounded-lg p-4 shadow-sm">
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

      {/* 세션 상세 모달 */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2 text-primary" />
                  세션 상세 정보
                </h2>
                {selectedSession && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedSession.date} {selectedSession.start_time} - {selectedSession.end_time}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSession(null);
                  setSessionDetails(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-lg animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400">세션 정보 로딩 중...</p>
                  </div>
                </div>
              ) : sessionDetails ? (
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                      기본 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">제목</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {sessionDetails.title || '제목 없음'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">과정명</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {sessionDetails.course_rounds?.course_name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">과목</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {sessionDetails.subjects?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">강사</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {sessionDetails.users?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">강의실</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {sessionDetails.classroom || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">상태</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {sessionDetails.status === 'scheduled' && '예정'}
                          {sessionDetails.status === 'in_progress' && '진행중'}
                          {sessionDetails.status === 'completed' && '완료'}
                          {sessionDetails.status === 'cancelled' && '취소'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 커리큘럼 정보 */}
                  {sessionDetails.course_rounds?.course_templates?.curriculum && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
                        커리큘럼 정보
                      </h3>
                      <div className="space-y-3">
                        {Array.isArray(sessionDetails.course_rounds.course_templates.curriculum) ? (
                          sessionDetails.course_rounds.course_templates.curriculum.map((item: any, index: number) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-100 dark:border-gray-700">
                              <div className="flex items-start space-x-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {item.topic || item.title || item.name}
                                  </p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {item.description}
                                    </p>
                                  )}
                                  {item.duration && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      ⏱️ {item.duration}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            커리큘럼 정보가 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 교육생 목록 */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-green-600" />
                      교육생 목록 ({sessionDetails.trainees?.length || 0}명)
                    </h3>
                    {sessionDetails.trainees && sessionDetails.trainees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sessionDetails.trainees.map((trainee: any) => (
                          <div key={trainee.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-100 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-medium">
                                {trainee.name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {trainee.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {trainee.department || '-'} · {trainee.employee_id || '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        등록된 교육생이 없습니다.
                      </p>
                    )}
                  </div>

                  {/* 메모 */}
                  {sessionDetails.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5 border border-yellow-200 dark:border-yellow-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        📝 메모
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {sessionDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">세션 정보를 불러올 수 없습니다.</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSession(null);
                  setSessionDetails(null);
                }}
                className="btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <CalendarIcon className="w-6 h-6 mr-2 text-primary" />
                일정 추가
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 과정 차수 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  과정 차수 *
                </label>
                <select
                  value={scheduleForm.round_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, round_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">선택하세요</option>
                  {courseRounds.map(round => (
                    <option key={round.id} value={round.id}>
                      {round.course_name || round.title} - {round.round_number}차
                    </option>
                  ))}
                </select>
              </div>

              {/* 과목 선택 (선택사항) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  과목 (선택사항)
                </label>
                <select
                  value={scheduleForm.subject_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">선택하세요</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  placeholder="예: 1일차 강의"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  날짜 *
                </label>
                <input
                  type="date"
                  value={scheduleForm.session_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, session_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* 시간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 시간 *
                  </label>
                  <select
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="09:00">오전 09:00</option>
                    <option value="09:30">오전 09:30</option>
                    <option value="10:00">오전 10:00</option>
                    <option value="10:30">오전 10:30</option>
                    <option value="11:00">오전 11:00</option>
                    <option value="11:30">오전 11:30</option>
                    <option value="12:00">오후 12:00</option>
                    <option value="12:30">오후 12:30</option>
                    <option value="13:00">오후 01:00</option>
                    <option value="13:30">오후 01:30</option>
                    <option value="14:00">오후 02:00</option>
                    <option value="14:30">오후 02:30</option>
                    <option value="15:00">오후 03:00</option>
                    <option value="15:30">오후 03:30</option>
                    <option value="16:00">오후 04:00</option>
                    <option value="16:30">오후 04:30</option>
                    <option value="17:00">오후 05:00</option>
                    <option value="17:30">오후 05:30</option>
                    <option value="18:00">오후 06:00</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료 시간 *
                  </label>
                  <select
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="09:00">오전 09:00</option>
                    <option value="09:30">오전 09:30</option>
                    <option value="10:00">오전 10:00</option>
                    <option value="10:30">오전 10:30</option>
                    <option value="11:00">오전 11:00</option>
                    <option value="11:30">오전 11:30</option>
                    <option value="12:00">오후 12:00</option>
                    <option value="12:30">오후 12:30</option>
                    <option value="13:00">오후 01:00</option>
                    <option value="13:30">오후 01:30</option>
                    <option value="14:00">오후 02:00</option>
                    <option value="14:30">오후 02:30</option>
                    <option value="15:00">오후 03:00</option>
                    <option value="15:30">오후 03:30</option>
                    <option value="16:00">오후 04:00</option>
                    <option value="16:30">오후 04:30</option>
                    <option value="17:00">오후 05:00</option>
                    <option value="17:30">오후 05:30</option>
                    <option value="18:00">오후 06:00</option>
                  </select>
                </div>
              </div>

              {/* ResourceSelector - 강사 및 강의실 선택 */}
              {scheduleForm.session_date && scheduleForm.start_time && scheduleForm.end_time && (
                <ResourceSelector
                  sessionDate={scheduleForm.session_date}
                  startTime={scheduleForm.start_time}
                  endTime={scheduleForm.end_time}
                  subjectId={scheduleForm.subject_id}
                  selectedInstructorId={scheduleForm.actual_instructor_id}
                  selectedClassroomId={scheduleForm.classroom_id}
                  onInstructorChange={(instructorId) =>
                    setScheduleForm({ ...scheduleForm, actual_instructor_id: instructorId })
                  }
                  onClassroomChange={(classroomId) =>
                    setScheduleForm({ ...scheduleForm, classroom_id: classroomId })
                  }
                  showRecommendations={true}
                />
              )}

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  메모
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="추가 메모를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleAddSchedule}
                disabled={
                  !scheduleForm.round_id ||
                  !scheduleForm.session_date ||
                  !scheduleForm.start_time ||
                  !scheduleForm.end_time ||
                  !scheduleForm.actual_instructor_id ||
                  !scheduleForm.classroom_id
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ScheduleViewer);