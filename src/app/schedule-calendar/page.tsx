'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { CalendarEvent, ScheduleConflict } from '@/types/schedule.types';
import toast from 'react-hot-toast';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

type ViewMode = 'week' | 'month';
type FilterType = 'all' | 'instructor' | 'classroom' | 'course';

export default function ScheduleCalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(false);

  // 드래그 앤 드롭 상태
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // 필터 상태
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  // 필터 옵션 (TODO: 실제 데이터로 교체)
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([]);
  const [classrooms, setClassrooms] = useState<Array<{ id: string; name: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);

  // 드래그 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, [currentDate, viewMode, filterType, selectedInstructor, selectedClassroom, selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);

      // TODO: 실제 API 호출로 교체
      // const { start, end } = getDateRange();
      // const eventsData = await scheduleService.getCalendarEvents(start, end, filters);
      // const conflictsData = await scheduleService.getConflicts(start, end);

      // 샘플 데이터
      setEvents([]);
      setConflicts([]);
    } catch (error) {
      console.error('일정 조회 실패:', error);
      toast.error('일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // TODO: 실제 데이터 로드
      setInstructors([
        { id: '1', name: '김경훈' },
        { id: '2', name: '이웅진' },
      ]);
      setClassrooms([
        { id: '1', name: '강의실 A' },
        { id: '2', name: '강의실 B' },
      ]);
      setCourses([
        { id: '1', name: 'BS Basic 1기' },
        { id: '2', name: 'BS Advanced 2기' },
      ]);
    } catch (error) {
      console.error('필터 옵션 로드 실패:', error);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'week') {
      // 주간 뷰: 해당 주의 월요일 ~ 일요일
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    } else {
      // 월간 뷰: 해당 월의 1일 ~ 마지막 날
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }

    return { start, end };
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRangeLabel = () => {
    const { start, end } = getDateRange();
    if (viewMode === 'week') {
      return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
    } else {
      return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    }
  };

  const filteredEvents = events.filter((event) => {
    if (showConflictsOnly) {
      const hasConflict = conflicts.some((c) => c.conflicting_schedules.some((s) => s.schedule_id === event.id));
      if (!hasConflict) return false;
    }

    if (filterType === 'instructor' && selectedInstructor) {
      return event.instructor_id === selectedInstructor;
    }
    if (filterType === 'classroom' && selectedClassroom) {
      return event.classroom === selectedClassroom;
    }
    if (filterType === 'course' && selectedCourse) {
      return event.course_id === selectedCourse;
    }

    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = events.find((e) => e.id === event.active.id);
    if (draggedEvent) {
      setActiveEvent(draggedEvent);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over || active.id === over.id) {
      return;
    }

    // over.id 형식: "slot-{date}-{hour}" 또는 "day-{date}"
    const overId = over.id.toString();
    const draggedEvent = events.find((e) => e.id === active.id);

    if (!draggedEvent) return;

    try {
      let newStart: Date;
      let newEnd: Date;

      if (overId.startsWith('slot-')) {
        // 주간 뷰 타임슬롯
        const [, dateStr, hourStr] = overId.split('-');
        newStart = new Date(dateStr);
        newStart.setHours(parseInt(hourStr), 0, 0, 0);

        const duration = new Date(draggedEvent.end).getTime() - new Date(draggedEvent.start).getTime();
        newEnd = new Date(newStart.getTime() + duration);
      } else if (overId.startsWith('day-')) {
        // 월간 뷰 날짜
        const [, dateStr] = overId.split('-');
        newStart = new Date(dateStr);
        newStart.setHours(new Date(draggedEvent.start).getHours());
        newStart.setMinutes(new Date(draggedEvent.start).getMinutes());

        const duration = new Date(draggedEvent.end).getTime() - new Date(draggedEvent.start).getTime();
        newEnd = new Date(newStart.getTime() + duration);
      } else {
        return;
      }

      // TODO: 실제 API 호출로 교체
      // await scheduleService.update(draggedEvent.id, {
      //   start_time: newStart.toISOString(),
      //   end_time: newEnd.toISOString(),
      // });

      // 로컬 상태 업데이트
      setEvents((prev) =>
        prev.map((e) =>
          e.id === draggedEvent.id
            ? { ...e, start: newStart.toISOString(), end: newEnd.toISOString() }
            : e
        )
      );

      toast.success('일정이 이동되었습니다.');

      // 충돌 재검사
      await loadData();
    } catch (error) {
      console.error('일정 이동 실패:', error);
      toast.error('일정 이동 중 오류가 발생했습니다.');
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <PageContainer>
      <PageHeader title="📅 통합 일정 캘린더" description="전체 강사, 강의실, 과정 일정을 한눈에 확인합니다.">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-primary text-white'
                : 'bg-card text-foreground border border-border hover:bg-muted/50'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-primary text-white'
                : 'bg-card text-foreground border border-border hover:bg-muted/50'
            }`}
          >
            월간
          </button>
        </div>
      </PageHeader>

      {/* 필터 및 네비게이션 */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* 날짜 네비게이션 */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-all"
            >
              <ChevronLeftIcon className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">{getDateRangeLabel()}</p>
            </div>
            <button onClick={navigateNext} className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-all">
              <ChevronRightIcon className="h-5 w-5 text-foreground" />
            </button>
            <button onClick={navigateToday} className="px-4 py-2 rounded-lg bg-primary text-white font-medium">
              오늘
            </button>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">전체</option>
              <option value="instructor">강사별</option>
              <option value="classroom">강의실별</option>
              <option value="course">과정별</option>
            </select>

            {filterType === 'instructor' && (
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">강사 선택</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            )}

            {filterType === 'classroom' && (
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">강의실 선택</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            )}

            {filterType === 'course' && (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">과정 선택</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-all">
              <input
                type="checkbox"
                checked={showConflictsOnly}
                onChange={(e) => setShowConflictsOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">충돌만 보기</span>
            </label>
          </div>
        </div>

        {/* 충돌 알림 */}
        {conflicts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
              <h3 className="font-bold text-destructive">일정 충돌 감지</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {conflicts.length}건의 일정 충돌이 발견되었습니다. 해결이 필요합니다.
            </p>
          </div>
        )}
      </div>

      {/* 캘린더 뷰 */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">일정을 불러오는 중...</p>
        </div>
      ) : viewMode === 'week' ? (
        <WeekView events={filteredEvents} conflicts={conflicts} currentDate={currentDate} />
      ) : (
        <MonthView events={filteredEvents} conflicts={conflicts} currentDate={currentDate} />
      )}

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeEvent ? (
          <div className="p-2 rounded-lg bg-primary text-white shadow-lg opacity-90">
            <div className="font-medium text-sm">{activeEvent.title}</div>
            {activeEvent.classroom && <div className="text-xs opacity-80">{activeEvent.classroom}</div>}
          </div>
        ) : null}
      </DragOverlay>
    </PageContainer>
    </DndContext>
  );
}

// 드래그 가능한 이벤트 컴포넌트
function DraggableEvent({ event, hasConflict }: { event: CalendarEvent; hasConflict: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-lg text-xs cursor-move transition-all hover:shadow-md ${
        hasConflict
          ? 'bg-destructive/20 border border-destructive/40 text-destructive'
          : event.type === 'course'
          ? 'bg-primary/10 border border-primary/20 text-primary'
          : event.type === 'personal'
          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600'
          : 'bg-muted/50 border border-border text-foreground'
      }`}
    >
      <div className="font-medium truncate">{event.title}</div>
      {event.classroom && <div className="text-xs opacity-70">{event.classroom}</div>}
    </div>
  );
}

// 드롭 가능한 타임슬롯 컴포넌트
function DroppableTimeSlot({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}
    >
      {children}
    </div>
  );
}

// 주간 뷰 컴포넌트
function WeekView({
  events,
  conflicts,
  currentDate,
}: {
  events: CalendarEvent[];
  conflicts: ScheduleConflict[];
  currentDate: Date;
}) {
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 9); // 9시 ~ 21시

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const weekDates = getWeekDates();

  const getEventsForSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      const eventHour = new Date(event.start).getHours();
      return eventDate === dateStr && eventHour === hour;
    });
  };

  const hasConflict = (eventId: string) => {
    return conflicts.some((c) => c.conflicting_schedules.some((s) => s.schedule_id === eventId));
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground sticky left-0 bg-muted/30">시간</th>
              {weekDates.map((date, index) => (
                <th key={index} className="px-4 py-3 text-center text-sm font-medium text-foreground min-w-[150px]">
                  <div>{weekDays[index]}</div>
                  <div className="text-xs text-muted-foreground">
                    {date.getMonth() + 1}/{date.getDate()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {timeSlots.map((hour) => (
              <tr key={hour}>
                <td className="px-4 py-3 text-sm font-medium text-muted-foreground sticky left-0 bg-card">
                  {hour}:00
                </td>
                {weekDates.map((date, dayIndex) => {
                  const slotEvents = getEventsForSlot(date, hour);
                  const slotId = `slot-${date.toISOString().split('T')[0]}-${hour}`;
                  return (
                    <DroppableTimeSlot
                      key={dayIndex}
                      id={slotId}
                      className="px-2 py-2 align-top border-l border-border"
                    >
                      {slotEvents.length > 0 ? (
                        <div className="space-y-1">
                          {slotEvents.map((event) => (
                            <DraggableEvent
                              key={event.id}
                              event={event}
                              hasConflict={hasConflict(event.id)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-16"></div>
                      )}
                    </DroppableTimeSlot>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 월간 뷰 컴포넌트
function MonthView({
  events,
  conflicts,
  currentDate,
}: {
  events: CalendarEvent[];
  conflicts: ScheduleConflict[];
  currentDate: Date;
}) {
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const dates = [];
    const startDay = firstDay.getDay();

    // 이전 달 날짜
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({ date, isCurrentMonth: false });
    }

    // 현재 달 날짜
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      dates.push({ date, isCurrentMonth: true });
    }

    // 다음 달 날짜 (6주 채우기)
    const remainingDays = 42 - dates.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      dates.push({ date, isCurrentMonth: false });
    }

    return dates;
  };

  const monthDates = getMonthDates();

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const hasConflict = (eventId: string) => {
    return conflicts.some((c) => c.conflicting_schedules.some((s) => s.schedule_id === eventId));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`px-4 py-3 text-center text-sm font-medium ${
                index === 0 ? 'text-destructive' : index === 6 ? 'text-primary' : 'text-foreground'
              } bg-muted/30`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDates.map(({ date, isCurrentMonth }, index) => {
            const dayEvents = getEventsForDate(date);
            const dayId = `day-${date.toISOString().split('T')[0]}`;
            return (
              <DroppableTimeSlot
                key={index}
                id={dayId}
                className={`min-h-[120px] border-r border-b border-border p-2 ${
                  !isCurrentMonth ? 'bg-muted/20' : isToday(date) ? 'bg-primary/5' : 'bg-card'
                }`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday(date)
                      ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white'
                      : !isCurrentMonth
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <DraggableEvent
                      key={event.id}
                      event={event}
                      hasConflict={hasConflict(event.id)}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-2">+{dayEvents.length - 3} 더보기</div>
                  )}
                </div>
              </DroppableTimeSlot>
            );
          })}
        </div>
      </div>
    </div>
  );
}
