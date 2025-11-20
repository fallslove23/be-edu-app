/**
 * 통합 일정 관리 컴포넌트
 * - 과정 일정, 개인 일정, 공휴일을 통합 표시
 * - 월간/주간/일간 뷰
 * - 일정 CRUD 기능
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { scheduleService, personalEventService, classroomService, integratedCalendarService } from '../../services/schedule.service';
import { instructorProfileService } from '../../services/instructor-profile.service';
import { subjectService, instructorSubjectService } from '../../services/subject.service';
import type { CalendarEvent, Schedule, PersonalEvent, Classroom, InstructorProfile, Subject, InstructorSubject } from '../../types/integrated-schedule.types';
import GoogleCalendarSync from './GoogleCalendarSync';

type ViewMode = 'month' | 'week' | 'day';

export default function IntegratedScheduleManager() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [instructorProfiles, setInstructorProfiles] = useState<InstructorProfile[]>([]);
  const [selectedInstructorProfile, setSelectedInstructorProfile] = useState<InstructorProfile | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [courseRounds, setCourseRounds] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [instructorSubjects, setInstructorSubjects] = useState<(InstructorSubject & { subject: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPersonalEventModal, setShowPersonalEventModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingScheduleAction, setPendingScheduleAction] = useState<'create' | 'update' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    course_round_id: '',
    title: '',
    subject: '',
    description: '',
    start_time: '',
    end_time: '',
    classroom_id: '',
    instructor_id: '',
  });
  const [personalEventForm, setPersonalEventForm] = useState({
    title: '',
    description: '',
    event_type: 'personal' as 'personal' | 'holiday' | 'vacation' | 'meeting' | 'other',
    start_time: '',
    end_time: '',
    all_day: false,
    color: '#10B981',
    location: '',
  });
  const [editingScheduleId, setEditingScheduleId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange(currentDate, viewMode);

      // 교실 데이터 로드 (선택사항)
      let classroomsData: Classroom[] = [];
      try {
        classroomsData = await classroomService.getAll();
      } catch (err) {
        console.warn('Failed to load classrooms:', err);
      }

      // 강사 목록 로드
      let instructorsData: any[] = [];
      let profilesData: InstructorProfile[] = [];
      try {
        const { data } = await import('../../services/supabase').then(m => m.supabase
          .from('users')
          .select('id, name, email')
          .eq('role', 'instructor'));
        instructorsData = data || [];

        // 강사 프로필 로드
        profilesData = await instructorProfileService.getAll();
      } catch (err) {
        console.warn('Failed to load instructors:', err);
      }

      // 과정 회차 목록 로드
      let courseRoundsData: any[] = [];
      try {
        const { data, error } = await import('../../services/supabase').then(m => m.supabase
          .from('course_rounds')
          .select('*')
          .order('created_at', { ascending: false }));

        if (error) {
          console.error('❌ Course rounds query error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
        } else {
          console.log('✅ Loaded course rounds successfully!');
          console.log('Number of course rounds:', data?.length || 0);
          if (data && data.length > 0) {
            console.log('First course round:', data[0]);
            console.log('Available fields:', Object.keys(data[0]));
          }
        }

        courseRoundsData = data || [];
      } catch (err) {
        console.error('Failed to load course rounds - exception:', err);
      }

      // 과목 목록 로드
      let subjectsData: Subject[] = [];
      try {
        subjectsData = await subjectService.getAll();
      } catch (err) {
        console.warn('Failed to load subjects:', err);
      }

      // 이벤트 데이터 로드
      const eventsData = await integratedCalendarService.getAllEvents(user?.id || '', dateRange);

      setEvents(eventsData);
      setClassrooms(classroomsData);
      setInstructors(instructorsData);
      setInstructorProfiles(profilesData);
      setCourseRounds(courseRoundsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setError('캘린더 데이터를 불러오는데 실패했습니다. 데이터베이스 마이그레이션이 필요할 수 있습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (date: Date, mode: ViewMode) => {
    const start = new Date(date);
    const end = new Date(date);

    if (mode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (mode === 'week') {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(start.getDate() + 6);
    } else {
      // day
      end.setDate(end.getDate());
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const handleInstructorChange = async (instructorId: string) => {
    try {
      setScheduleForm({ ...scheduleForm, instructor_id: instructorId, subject: '' });

      // 선택된 강사의 프로필 찾기
      if (instructorId) {
        const profile = instructorProfiles.find(p => p.user_id === instructorId);
        setSelectedInstructorProfile(profile || null);

        // 강사의 과목 로드
        try {
          const subjects = await instructorSubjectService.getByInstructor(instructorId);
          console.log('Loaded instructor subjects:', subjects);
          setInstructorSubjects(subjects);
        } catch (error) {
          console.error('Failed to load instructor subjects:', error);
          setInstructorSubjects([]);
          setError('강사의 담당 과목을 불러오는데 실패했습니다.');
        }
      } else {
        setSelectedInstructorProfile(null);
        setInstructorSubjects([]);
      }
    } catch (error) {
      console.error('Error in handleInstructorChange:', error);
      setError('강사 변경 처리 중 오류가 발생했습니다.');
    }
  };

  const handleClassroomChange = (classroomId: string) => {
    setScheduleForm({ ...scheduleForm, classroom_id: classroomId });

    // 선택된 교실 정보 찾기
    if (classroomId) {
      const classroom = classrooms.find(c => c.id === classroomId);
      setSelectedClassroom(classroom || null);
    } else {
      setSelectedClassroom(null);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      // 필수 항목 검증 (과정은 선택사항으로 변경)
      if (!scheduleForm.title.trim()) {
        alert('일정 제목을 입력해주세요');
        return;
      }
      if (!scheduleForm.start_time || !scheduleForm.end_time) {
        alert('시작 시간과 종료 시간을 입력해주세요');
        return;
      }

      // 독립 세션 생성 시 안내 메시지
      if (!scheduleForm.course_round_id) {
        const confirmed = window.confirm(
          '독립 세션으로 생성됩니다.\n' +
          '나중에 과정으로 그룹화할 수 있습니다.\n\n' +
          '계속하시겠습니까?'
        );
        if (!confirmed) return;
      }

      // 충돌 검사
      const foundConflicts = await scheduleService.checkConflicts(
        scheduleForm.start_time,
        scheduleForm.end_time,
        scheduleForm.instructor_id || undefined,
        scheduleForm.classroom_id || undefined
      );

      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setPendingScheduleAction('create');
        setShowConflictModal(true);
        return;
      }

      await executeCreateSchedule();
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('일정 생성에 실패했습니다');
    }
  };

  const executeCreateSchedule = async () => {
    try {
      const newSchedule = await scheduleService.create({
        course_round_id: scheduleForm.course_round_id || null,
        title: scheduleForm.title,
        subject: scheduleForm.subject,
        description: scheduleForm.description,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        classroom_id: scheduleForm.classroom_id || null,
        instructor_id: scheduleForm.instructor_id || null,
        status: 'scheduled',
      });

      setShowCreateModal(false);
      setScheduleForm({
        course_round_id: '',
        title: '',
        subject: '',
        description: '',
        start_time: '',
        end_time: '',
        classroom_id: '',
        instructor_id: '',
      });

      await loadData();
      alert('일정이 생성되었습니다');
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('일정 생성에 실패했습니다');
    }
  };

  const handleEditSchedule = async () => {
    try {
      if (!editingScheduleId) return;

      if (!scheduleForm.title.trim()) {
        alert('일정 제목을 입력해주세요');
        return;
      }
      if (!scheduleForm.start_time || !scheduleForm.end_time) {
        alert('시작 시간과 종료 시간을 입력해주세요');
        return;
      }

      // 충돌 검사 (자기 자신 제외)
      const foundConflicts = await scheduleService.checkConflicts(
        scheduleForm.start_time,
        scheduleForm.end_time,
        scheduleForm.instructor_id || undefined,
        scheduleForm.classroom_id || undefined,
        editingScheduleId
      );

      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setPendingScheduleAction('update');
        setShowConflictModal(true);
        return;
      }

      await executeUpdateSchedule();
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('일정 수정에 실패했습니다');
    }
  };

  const executeUpdateSchedule = async () => {
    try {
      await scheduleService.update(editingScheduleId, {
        title: scheduleForm.title,
        subject: scheduleForm.subject,
        description: scheduleForm.description,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        classroom_id: scheduleForm.classroom_id || null,
        instructor_id: scheduleForm.instructor_id || null,
      });

      setShowEditModal(false);
      setEditingScheduleId('');
      setScheduleForm({
        title: '',
        subject: '',
        description: '',
        start_time: '',
        end_time: '',
        classroom_id: '',
        instructor_id: '',
      });

      await loadData();
      alert('일정이 수정되었습니다');
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('일정 수정에 실패했습니다');
    }
  };

  const handleConflictProceed = async () => {
    setShowConflictModal(false);

    try {
      if (pendingScheduleAction === 'create') {
        await executeCreateSchedule();
      } else if (pendingScheduleAction === 'update') {
        await executeUpdateSchedule();
      }
    } catch (error) {
      console.error('Failed to proceed with conflicting schedule:', error);
      alert('일정 처리에 실패했습니다');
    } finally {
      setConflicts([]);
      setPendingScheduleAction(null);
    }
  };

  const handleConflictCancel = () => {
    setShowConflictModal(false);
    setConflicts([]);
    setPendingScheduleAction(null);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const proceed = confirm('정말로 이 일정을 삭제하시겠습니까?');
      if (!proceed) return;

      await scheduleService.delete(scheduleId);
      setShowEventModal(false);
      await loadData();
      alert('일정이 삭제되었습니다');
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('일정 삭제에 실패했습니다');
    }
  };

  const handleCheckAllConflicts = async () => {
    try {
      setLoading(true);
      const allConflicts: any[] = [];

      // 모든 일정에 대해 충돌 검사
      for (const event of events) {
        if (event.type !== 'schedule' || !event.scheduleId || !event.start || !event.end) continue;

        const eventConflicts = await scheduleService.checkConflicts(
          new Date(event.start).toISOString(),
          new Date(event.end).toISOString(),
          event.instructorId || undefined,
          event.classroomId || undefined,
          event.scheduleId
        );

        if (eventConflicts.length > 0) {
          allConflicts.push({
            event,
            conflicts: eventConflicts
          });
        }
      }

      setLoading(false);

      if (allConflicts.length === 0) {
        alert('충돌하는 일정이 없습니다.');
      } else {
        // 충돌 정보를 평탄화하여 표시
        const flatConflicts = allConflicts.flatMap(item => item.conflicts);
        setConflicts(flatConflicts);
        setShowConflictModal(true);
      }
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      setLoading(false);
      alert('충돌 검사 중 오류가 발생했습니다');
    }
  };

  // Drag & Drop 핸들러
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    // 개인 일정이나 공휴일은 드래그 불가
    if (event.type !== 'schedule' || !event.scheduleId) {
      e.preventDefault();
      return;
    }

    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.scheduleId);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
    if (hour !== undefined) {
      setDragOverHour(hour);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
    setDragOverHour(null);
  };

  const handleDrop = async (e: React.DragEvent, dropDate: Date, dropHour?: number) => {
    e.preventDefault();
    setDragOverDate(null);
    setDragOverHour(null);

    if (!draggedEvent || !draggedEvent.scheduleId || !draggedEvent.start || !draggedEvent.end) {
      setDraggedEvent(null);
      return;
    }

    try {
      const originalStart = new Date(draggedEvent.start);
      const originalEnd = new Date(draggedEvent.end);
      const duration = originalEnd.getTime() - originalStart.getTime();

      // 새로운 시작 시간 계산
      const newStart = new Date(dropDate);
      if (dropHour !== undefined) {
        newStart.setHours(dropHour, 0, 0, 0);
      } else {
        newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
      }

      // 새로운 종료 시간 계산 (기존 duration 유지)
      const newEnd = new Date(newStart.getTime() + duration);

      // 충돌 검사
      const foundConflicts = await scheduleService.checkConflicts(
        newStart.toISOString(),
        newEnd.toISOString(),
        draggedEvent.instructorId || undefined,
        draggedEvent.classroomId || undefined,
        draggedEvent.scheduleId
      );

      if (foundConflicts.length > 0) {
        const proceed = confirm(
          `일정 충돌이 감지되었습니다.\n${foundConflicts.length}개의 충돌이 있습니다.\n그래도 이동하시겠습니까?`
        );
        if (!proceed) {
          setDraggedEvent(null);
          return;
        }
      }

      // 일정 업데이트
      await scheduleService.update(draggedEvent.scheduleId, {
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      });

      await loadData();
      setDraggedEvent(null);
    } catch (error) {
      console.error('Failed to move event:', error);
      alert('일정 이동에 실패했습니다');
      setDraggedEvent(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDragOverDate(null);
    setDragOverHour(null);
  };

  const handleCreatePersonalEvent = async () => {
    try {
      if (!personalEventForm.title.trim()) {
        alert('일정 제목을 입력해주세요');
        return;
      }
      if (!personalEventForm.start_time) {
        alert('시작 시간을 입력해주세요');
        return;
      }

      await personalEventService.create({
        user_id: user?.id || '',
        title: personalEventForm.title,
        description: personalEventForm.description,
        event_type: personalEventForm.event_type,
        start_time: personalEventForm.start_time,
        end_time: personalEventForm.all_day ? null : (personalEventForm.end_time || null),
        all_day: personalEventForm.all_day,
        color: personalEventForm.color,
        location: personalEventForm.location,
      });

      setShowPersonalEventModal(false);
      setPersonalEventForm({
        title: '',
        description: '',
        event_type: 'personal',
        start_time: '',
        end_time: '',
        all_day: false,
        color: '#10B981',
        location: '',
      });

      await loadData();
      alert('개인 일정이 생성되었습니다');
    } catch (error) {
      console.error('Failed to create personal event:', error);
      alert('개인 일정 생성에 실패했습니다');
    }
  };

  const openEditModal = async (event: CalendarEvent) => {
    if (event.type !== 'schedule') {
      alert('과정 일정만 수정할 수 있습니다');
      return;
    }

    const scheduleId = event.id.replace('schedule-', '');

    try {
      const schedule = await scheduleService.getById(scheduleId);

      // datetime-local 형식으로 변환
      const formatForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setEditingScheduleId(scheduleId);
      setScheduleForm({
        course_round_id: '',
        title: schedule.title || '',
        subject: schedule.subject || '',
        description: schedule.description || '',
        start_time: formatForInput(schedule.start_time),
        end_time: formatForInput(schedule.end_time),
        classroom_id: schedule.classroom_id || '',
        instructor_id: schedule.instructor_id || '',
      });

      // 선택된 강사의 프로필 찾기
      if (schedule.instructor_id) {
        const profile = instructorProfiles.find(p => p.user_id === schedule.instructor_id);
        setSelectedInstructorProfile(profile || null);
      } else {
        setSelectedInstructorProfile(null);
      }

      // 선택된 교실 정보 찾기
      if (schedule.classroom_id) {
        const classroom = classrooms.find(c => c.id === schedule.classroom_id);
        setSelectedClassroom(classroom || null);
      } else {
        setSelectedClassroom(null);
      }

      setShowEventModal(false);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      alert('일정 정보를 불러오는데 실패했습니다');
    }
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventStart = event.start.split('T')[0];
      const eventEnd = event.end ? event.end.split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // 날짜/셀 클릭으로 일정 추가 핸들러
  const handleDateCellClick = (date: Date, hour?: number) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // 시간 설정 (hour가 주어지면 해당 시간, 아니면 09:00 기본값)
    const startHour = hour !== undefined ? String(hour).padStart(2, '0') : '09';
    const endHour = hour !== undefined ? String(hour + 1).padStart(2, '0') : '10';

    const startTimeStr = `${dateStr}T${startHour}:00`;
    const endTimeStr = `${dateStr}T${endHour}:00`;

    // 폼 초기화 및 날짜/시간 설정
    setScheduleForm({
      course_round_id: '',
      title: '',
      subject: '',
      description: '',
      start_time: startTimeStr,
      end_time: endTimeStr,
      classroom_id: '',
      instructor_id: '',
    });

    // 모달 열기
    setShowCreateModal(true);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 월의 첫날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 달력에 표시할 주의 시작과 끝
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const weeks = [];
    let currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(day.getDate() + i);
        week.push(day);
      }
      weeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={`p-3 text-center font-medium text-sm ${
                index === 0
                  ? 'text-destructive dark:text-red-400'
                  : index === 6
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            {week.map((day, dayIndex) => {
              const isCurrentMonth = day.getMonth() === month;
              const isToday = day.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDate(day);

              const isDragOver = dragOverDate?.toDateString() === day.toDateString();

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[120px] p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                    !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : ''
                  } ${isDragOver ? 'bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-500' : ''}`}
                  onClick={(e) => {
                    // 이벤트 버튼 클릭이 아닌 경우에만 날짜 클릭으로 처리
                    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.day-number')) {
                      handleDateCellClick(day);
                    }
                  }}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div
                    className={`text-sm font-medium mb-1 day-number ${
                      isToday
                        ? 'inline-flex items-center justify-center w-7 h-7 bg-teal-600 text-white rounded-full'
                        : dayIndex === 0
                        ? 'text-destructive dark:text-red-400'
                        : dayIndex === 6
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCurrentMonth
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {day.getDate()}
                  </div>

                  {/* 이벤트 목록 */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        draggable={event.type === 'schedule'}
                        onDragStart={(e) => handleDragStart(e, event)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-all ${
                          event.type === 'schedule' ? 'cursor-move hover:opacity-80 hover:shadow-md' : 'hover:opacity-80'
                        } ${draggedEvent?.id === event.id ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: event.color || '#6366F1', color: 'white' }}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayEvents.length - 3}개 더보기
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* 요일 헤더 */}
        <div
          className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
          style={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(7, 1fr)'
          }}
        >
          <div className="p-4 text-center font-semibold text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
            시간
          </div>
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            return (
              <div key={index} className="p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                <div className={`text-xs font-medium mb-1 ${
                  index === 0 ? 'text-destructive dark:text-red-400' :
                  index === 6 ? 'text-blue-600 dark:text-blue-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {dayNames[day.getDay()]}
                </div>
                <div className={`text-lg font-bold ${
                  isToday
                    ? 'inline-flex items-center justify-center w-8 h-8 bg-teal-600 text-white rounded-full'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* 시간 그리드 */}
        <div className="max-h-[700px] overflow-y-auto">
          {[...Array(10)].map((_, index) => {
            const hour = index + 9; // 09:00부터 18:00까지
            return (
              <div
                key={hour}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px repeat(7, 1fr)'
                }}
              >
                <div className="p-3 text-xs font-medium text-gray-500 dark:text-gray-400 text-right pr-4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {days.map((day, dayIndex) => {
                  const dayEvents = getEventsForDate(day).filter((event) => {
                    if (!event.start) return false;
                    const eventHour = new Date(event.start).getHours();
                    return eventHour === hour;
                  });

                  const isDragOver = dragOverDate?.toDateString() === day.toDateString() && dragOverHour === hour;

                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[70px] relative transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                        isDragOver ? 'bg-teal-50 dark:bg-teal-900/20 ring-2 ring-inset ring-teal-500' : ''
                      }`}
                      onClick={(e) => {
                        // 이벤트 버튼 클릭이 아닌 경우에만 시간 셀 클릭으로 처리
                        if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button')) {
                          handleDateCellClick(day, hour);
                        }
                      }}
                      onDragOver={(e) => handleDragOver(e, day, hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day, hour)}
                    >
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          draggable={event.type === 'schedule'}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-xs mb-1 truncate transition-all shadow-sm ${
                            event.type === 'schedule' ? 'cursor-move hover:opacity-80 hover:shadow-md' : 'hover:opacity-80'
                          } ${draggedEvent?.id === event.id ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: event.color || '#6366F1', color: 'white' }}
                        >
                          <div className="font-medium">{event.title}</div>
                          {event.classroom && (
                            <div className="text-[10px] opacity-90 mt-0.5">{event.classroom}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* 날짜 헤더 */}
        <div className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {currentDate.toLocaleDateString('ko-KR', { weekday: 'long' })}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* 시간대별 일정 */}
        <div className="max-h-[700px] overflow-y-auto">
          {[...Array(14)].map((_, index) => {
            const hour = index + 8; // 08:00부터 21:00까지
            const hourEvents = dayEvents.filter((event) => {
              if (!event.start) return false;
              const eventHour = new Date(event.start).getHours();
              return eventHour === hour;
            });

            const isDragOver = dragOverHour === hour;

            return (
              <div
                key={hour}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors flex"
              >
                <div className="w-24 p-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  className={`flex-1 p-4 min-h-[80px] transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                    isDragOver ? 'bg-teal-50 dark:bg-teal-900/20 ring-2 ring-inset ring-teal-500' : ''
                  }`}
                  onClick={(e) => {
                    // 이벤트 버튼 클릭이 아닌 경우에만 시간 셀 클릭으로 처리
                    if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button')) {
                      handleDateCellClick(currentDate, hour);
                    }
                  }}
                  onDragOver={(e) => handleDragOver(e, currentDate, hour)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, currentDate, hour)}
                >
                  {hourEvents.length > 0 ? (
                    <div className="space-y-2">
                      {hourEvents.map((event) => (
                        <button
                          key={event.id}
                          draggable={event.type === 'schedule'}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                          className={`w-full text-left p-3 rounded-full transition-all shadow-sm ${
                            event.type === 'schedule' ? 'cursor-move hover:opacity-90 hover:shadow-md' : 'hover:opacity-90'
                          } ${draggedEvent?.id === event.id ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: event.color || '#6366F1', color: 'white' }}
                        >
                          <div className="font-semibold text-sm mb-1">{event.title}</div>
                          <div className="flex items-center gap-3 text-xs opacity-90">
                            {event.start && event.end && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {new Date(event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(event.end).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            {event.classroom && (
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3" />
                                {event.classroom}
                              </div>
                            )}
                            {event.instructor && (
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {event.instructor}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-600 text-sm text-center py-4">
                      예정된 일정이 없습니다
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          일정 관리
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleCheckAllConflicts}
            className="px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white text-sm font-medium rounded-full hover:bg-yellow-700 dark:hover:bg-yellow-600 flex items-center gap-2"
            disabled={loading}
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            충돌 점검
          </button>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            과정 일정 추가
          </button>
          <button onClick={() => setShowPersonalEventModal(true)} className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white text-sm font-medium rounded-full hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            개인 일정 추가
          </button>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center gap-3">
          <button onClick={navigateToday} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-full">
            오늘
          </button>
          <button onClick={navigatePrevious} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={navigateNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] text-center">
            {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </span>
        </div>

        {/* 뷰 모드 선택 */}
        <div className="flex gap-2">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-sm font-medium rounded-full ${
                viewMode === mode
                  ? 'bg-teal-600 text-white'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              {mode === 'month' ? '월간' : mode === 'week' ? '주간' : '일간'}
            </button>
          ))}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                데이터 로드 실패
              </h3>
              <p className="text-foreground dark:text-yellow-300 mb-3">
                {error}
              </p>
              <div className="text-sm text-foreground dark:text-yellow-400">
                <p className="font-medium mb-2">해결 방법:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Supabase SQL Editor에서 마이그레이션 파일 실행</li>
                  <li>파일: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">database/migrations/create-integrated-schedule-management.sql</code></li>
                  <li>페이지 새로고침</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구글 캘린더 연동 - 향후 기능 */}
      {/* <GoogleCalendarSync onSync={loadData} /> */}

      {/* 캘린더 */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
        </div>
      ) : !error ? (
        <>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </>
      ) : null}

      {/* 개인 일정 생성 모달 */}
      {showPersonalEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPersonalEventModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">개인 일정 추가</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  value={personalEventForm.title}
                  onChange={(e) => setPersonalEventForm({ ...personalEventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: 휴가, 회의"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  일정 유형
                </label>
                <select
                  value={personalEventForm.event_type}
                  onChange={(e) => setPersonalEventForm({ ...personalEventForm, event_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="personal">개인 일정</option>
                  <option value="vacation">휴가</option>
                  <option value="meeting">회의</option>
                  <option value="holiday">공휴일</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={personalEventForm.all_day}
                  onChange={(e) => setPersonalEventForm({ ...personalEventForm, all_day: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="all-day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  종일 일정
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 {personalEventForm.all_day ? '날짜' : '시간'} *
                  </label>
                  <input
                    type={personalEventForm.all_day ? 'date' : 'datetime-local'}
                    value={personalEventForm.start_time}
                    onChange={(e) => setPersonalEventForm({ ...personalEventForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {!personalEventForm.all_day && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      종료 시간
                    </label>
                    <input
                      type="datetime-local"
                      value={personalEventForm.end_time}
                      onChange={(e) => setPersonalEventForm({ ...personalEventForm, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  장소
                </label>
                <input
                  type="text"
                  value={personalEventForm.location}
                  onChange={(e) => setPersonalEventForm({ ...personalEventForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: 본사 회의실"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  색상
                </label>
                <div className="flex gap-2">
                  {['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setPersonalEventForm({ ...personalEventForm, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        personalEventForm.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                <textarea
                  value={personalEventForm.description}
                  onChange={(e) => setPersonalEventForm({ ...personalEventForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="일정 상세 내용"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowPersonalEventModal(false)} className="btn-secondary rounded-full">
                취소
              </button>
              <button onClick={handleCreatePersonalEvent} className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-full hover:bg-gray-700 dark:hover:bg-gray-600">
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">일정 추가</h3>

            {/* 워크플로우 선택 안내 */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                💡 <strong>일정 입력 방법을 선택하세요:</strong>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setScheduleForm({ ...scheduleForm, course_round_id: '' })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    scheduleForm.course_round_id === ''
                      ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    📝 빠른 세션 입력
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    개별 세션만 먼저 입력<br/>
                    (나중에 과정으로 그룹화)
                  </div>
                </button>
                <button
                  onClick={() => {
                    if (courseRounds.length > 0) {
                      setScheduleForm({ ...scheduleForm, course_round_id: courseRounds[0].id });
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    scheduleForm.course_round_id !== ''
                      ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                    🎯 과정 기반 입력
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    기존 과정에 세션 추가<br/>
                    (체계적인 관리)
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* 과정 선택 (선택적) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  과정 회차 {scheduleForm.course_round_id === '' && <span className="text-xs text-gray-500">(선택사항)</span>}
                </label>
                <select
                  value={scheduleForm.course_round_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, course_round_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">선택 안함 (독립 세션으로 생성)</option>
                  {courseRounds.map((round: any) => (
                    <option key={round.id} value={round.id}>
                      {round.round_code} - {round.course_name || '제목 없음'}
                    </option>
                  ))}
                </select>
                {scheduleForm.course_round_id === '' && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    ℹ️ 독립 세션으로 생성됩니다. 나중에 과정으로 그룹화할 수 있습니다.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: BS 기본과정 1일차"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  과목
                </label>
                {scheduleForm.instructor_id && instructorSubjects.length > 0 ? (
                  <>
                    <select
                      value={scheduleForm.subject}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">과목 선택</option>
                      {instructorSubjects.map((is) => (
                        <option key={is.subject_id} value={is.subject.name}>
                          {is.subject.name} ({is.subject.category || '기타'})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ 선택한 강사가 담당 가능한 과목 목록
                    </p>
                  </>
                ) : subjects.length > 0 ? (
                  <>
                    <select
                      value={scheduleForm.subject}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">과목 선택 (선택사항)</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.name}>
                          {subject.name} ({subject.category || '기타'})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      💡 강사를 선택하면 해당 강사의 담당 과목만 표시됩니다
                    </p>
                  </>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    과목 정보가 없습니다
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 시간 *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료 시간 *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  강사
                </label>
                <select
                  value={scheduleForm.instructor_id}
                  onChange={(e) => handleInstructorChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">선택 안함</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>

                {/* 선택된 강사 프로필 정보 표시 */}
                {selectedInstructorProfile && (
                  <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm font-medium text-teal-900 dark:text-teal-100">강사 프로필</span>
                      </div>
                      {selectedInstructorProfile.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground">⭐</span>
                          <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                            {selectedInstructorProfile.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedInstructorProfile.bio && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {selectedInstructorProfile.bio}
                      </div>
                    )}

                    {selectedInstructorProfile.total_sessions > 0 && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        총 {selectedInstructorProfile.total_sessions}회 강의
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  교실
                </label>
                <select
                  value={scheduleForm.classroom_id}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">선택 안함</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                      {classroom.code && ` [${classroom.code}]`}
                      {classroom.building && ` - ${classroom.building}`}
                      {classroom.floor && ` ${classroom.floor}층`}
                      {` (${classroom.capacity}명)`}
                    </option>
                  ))}
                </select>

                {/* 선택된 교실 상세 정보 표시 */}
                {selectedClassroom && (
                  <div className="mt-3 p-3 bg-green-500/10 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">교실 정보</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-green-500/10 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                        수용인원 {selectedClassroom.capacity}명
                      </span>
                    </div>

                    {(selectedClassroom.building || selectedClassroom.floor) && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">위치</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClassroom.building && selectedClassroom.building}
                          {selectedClassroom.floor && ` ${selectedClassroom.floor}층`}
                          {selectedClassroom.location && ` - ${selectedClassroom.location}`}
                        </div>
                      </div>
                    )}

                    {selectedClassroom.facilities && selectedClassroom.facilities.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">시설</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedClassroom.facilities.map((facility, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-green-500/10 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedClassroom.equipment && selectedClassroom.equipment.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">장비</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedClassroom.equipment.map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="일정 상세 내용"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary rounded-full">
                취소
              </button>
              <button onClick={handleCreateSchedule} className="btn-primary rounded-full">
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">일정 수정</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  과목 *
                </label>
                {scheduleForm.instructor_id && instructorSubjects.length > 0 ? (
                  <select
                    value={scheduleForm.subject}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">과목 선택</option>
                    {instructorSubjects.map((is) => (
                      <option key={is.subject_id} value={is.subject.name}>
                        {is.subject.name} ({is.subject.category || '기타'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {scheduleForm.instructor_id ? '해당 강사의 담당 과목이 없습니다' : '먼저 강사를 선택해주세요'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    시작 시간 *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    종료 시간 *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.end_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  강사
                </label>
                <select
                  value={scheduleForm.instructor_id}
                  onChange={(e) => handleInstructorChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">선택 안함</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>

                {/* 선택된 강사 프로필 정보 표시 */}
                {selectedInstructorProfile && (
                  <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm font-medium text-teal-900 dark:text-teal-100">강사 프로필</span>
                      </div>
                      {selectedInstructorProfile.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-foreground">⭐</span>
                          <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                            {selectedInstructorProfile.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedInstructorProfile.bio && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {selectedInstructorProfile.bio}
                      </div>
                    )}

                    {selectedInstructorProfile.total_sessions > 0 && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        총 {selectedInstructorProfile.total_sessions}회 강의
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  교실
                </label>
                <select
                  value={scheduleForm.classroom_id}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">선택 안함</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                      {classroom.code && ` [${classroom.code}]`}
                      {classroom.building && ` - ${classroom.building}`}
                      {classroom.floor && ` ${classroom.floor}층`}
                      {` (${classroom.capacity}명)`}
                    </option>
                  ))}
                </select>

                {/* 선택된 교실 상세 정보 표시 */}
                {selectedClassroom && (
                  <div className="mt-3 p-3 bg-green-500/10 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">교실 정보</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-green-500/10 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                        수용인원 {selectedClassroom.capacity}명
                      </span>
                    </div>

                    {(selectedClassroom.building || selectedClassroom.floor) && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">위치</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedClassroom.building && selectedClassroom.building}
                          {selectedClassroom.floor && ` ${selectedClassroom.floor}층`}
                          {selectedClassroom.location && ` - ${selectedClassroom.location}`}
                        </div>
                      </div>
                    )}

                    {selectedClassroom.facilities && selectedClassroom.facilities.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">시설</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedClassroom.facilities.map((facility, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-green-500/10 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedClassroom.equipment && selectedClassroom.equipment.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">장비</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedClassroom.equipment.map((item, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary rounded-full">
                취소
              </button>
              <button onClick={handleEditSchedule} className="btn-primary rounded-full">
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이벤트 상세 모달 */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{selectedEvent.title}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="w-5 h-5" />
                {new Date(selectedEvent.start).toLocaleString('ko-KR')}
                {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleString('ko-KR')}`}
              </div>
              {selectedEvent.classroom && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="w-5 h-5" />
                  {selectedEvent.classroom}
                </div>
              )}
              {selectedEvent.instructor && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <UserIcon className="w-5 h-5" />
                  {selectedEvent.instructor}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-between">
              {selectedEvent.type === 'schedule' && selectedEvent.editable && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(selectedEvent)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(selectedEvent.id.replace('schedule-', ''))}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    삭제
                  </button>
                </div>
              )}
              <button onClick={() => setShowEventModal(false)} className="btn-secondary ml-auto rounded-full">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 충돌 알림 모달 */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleConflictCancel}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">일정 충돌 감지</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">다음 자원에서 충돌이 발견되었습니다</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {conflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-full border-2 ${
                    conflict.severity === 'high'
                      ? 'bg-destructive/10 dark:bg-red-900/20 border-destructive/50 dark:border-red-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {conflict.conflict_type === 'instructor' ? (
                        <UserIcon className={`w-5 h-5 ${conflict.severity === 'high' ? 'text-destructive dark:text-red-400' : 'text-foreground dark:text-yellow-400'}`} />
                      ) : (
                        <MapPinIcon className={`w-5 h-5 ${conflict.severity === 'high' ? 'text-destructive dark:text-red-400' : 'text-foreground dark:text-yellow-400'}`} />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {conflict.conflict_type === 'instructor' ? '강사' : '교실'}: {conflict.resource_name}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      conflict.severity === 'high'
                        ? 'bg-destructive/10 dark:bg-red-800 text-destructive dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {conflict.severity === 'high' ? '높음' : '보통'}
                    </span>
                  </div>

                  {conflict.existing_schedule && (
                    <div className="mt-2 pl-7">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">기존 일정:</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{conflict.existing_schedule.title || '제목 없음'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {new Date(conflict.existing_schedule.start_time).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {' ~ '}
                              {new Date(conflict.existing_schedule.end_time).toLocaleString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>안내:</strong> 충돌이 있어도 일정을 생성할 수 있습니다. 단, 해당 자원이 이중으로 배정될 수 있으니 주의하세요.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleConflictCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleConflictProceed}
                className="px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-full hover:bg-yellow-700 dark:hover:bg-yellow-600"
              >
                충돌 무시하고 진행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
