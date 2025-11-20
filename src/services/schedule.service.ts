/**
 * 통합 일정 관리 서비스
 */

import { supabase } from './supabase';
import type {
  Schedule,
  ScheduleCreate,
  ScheduleUpdate,
  ScheduleWithDetails,
  ScheduleFilter,
  Classroom,
  ClassroomCreate,
  PersonalEvent,
  PersonalEventCreate,
  CalendarEvent,
  ScheduleConflict,
} from '../types/integrated-schedule.types';

// 스케줄 서비스
export const scheduleService = {
  /**
   * 모든 일정 조회
   */
  async getAll(filter?: ScheduleFilter): Promise<ScheduleWithDetails[]> {
    let query = supabase
      .from('schedules')
      .select(`
        *,
        users:instructor_id(name),
        classrooms:classroom_id(name),
        course_rounds:course_round_id(
          round_number,
          course_templates(name)
        )
      `)
      .order('start_time', { ascending: true });

    if (filter?.course_round_id) {
      query = query.eq('course_round_id', filter.course_round_id);
    }

    if (filter?.instructor_id) {
      query = query.eq('instructor_id', filter.instructor_id);
    }

    if (filter?.classroom_id) {
      query = query.eq('classroom_id', filter.classroom_id);
    }

    if (filter?.status && filter.status.length > 0) {
      query = query.in('status', filter.status);
    }

    if (filter?.date_range) {
      query = query
        .gte('start_time', filter.date_range.start)
        .lte('start_time', filter.date_range.end);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((schedule: any) => ({
      ...schedule,
      instructor_name: schedule.users?.name,
      classroom_name: schedule.classrooms?.name,
      course_name: schedule.course_rounds?.course_templates?.name,
      round_number: schedule.course_rounds?.round_number,
    }));
  },

  /**
   * ID로 일정 조회
   */
  async getById(id: string): Promise<ScheduleWithDetails | null> {
    const { data, error} = await supabase
      .from('schedules')
      .select(`
        *,
        users:instructor_id(name),
        classrooms:classroom_id(name),
        course_rounds:course_round_id(
          round_number,
          course_templates(name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      instructor_name: data.users?.name,
      classroom_name: data.classrooms?.name,
      course_name: data.course_rounds?.course_templates?.name,
      round_number: data.course_rounds?.round_number,
    };
  },

  /**
   * 일정 생성
   */
  async create(schedule: ScheduleCreate): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 일정 수정
   */
  async update(id: string, schedule: ScheduleUpdate): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update({ ...schedule, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 일정 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('schedules').delete().eq('id', id);

    if (error) throw error;
  },

  /**
   * 충돌 감지
   */
  async checkConflicts(
    start_time: string,
    end_time: string,
    instructor_id?: string,
    classroom_id?: string,
    exclude_schedule_id?: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    // 강사 충돌 체크
    if (instructor_id) {
      let query = supabase
        .from('schedules')
        .select('*, users!inner(name)')
        .eq('instructor_id', instructor_id)
        .or(
          `and(start_time.lte.${end_time},end_time.gte.${start_time})`
        );

      if (exclude_schedule_id) {
        query = query.neq('id', exclude_schedule_id);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        data.forEach((schedule: any) => {
          conflicts.push({
            id: '',
            conflict_type: 'instructor',
            resource_id: instructor_id,
            resource_name: schedule.users.name,
            schedule1_id: exclude_schedule_id || '',
            schedule2_id: schedule.id,
            conflict_date: new Date(start_time).toISOString().split('T')[0],
            severity: 'high',
            resolved: false,
            created_at: new Date().toISOString(),
          });
        });
      }
    }

    // 교실 충돌 체크
    if (classroom_id) {
      let query = supabase
        .from('schedules')
        .select('*, classrooms!inner(name)')
        .eq('classroom_id', classroom_id)
        .or(
          `and(start_time.lte.${end_time},end_time.gte.${start_time})`
        );

      if (exclude_schedule_id) {
        query = query.neq('id', exclude_schedule_id);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        data.forEach((schedule: any) => {
          conflicts.push({
            id: '',
            conflict_type: 'classroom',
            resource_id: classroom_id,
            resource_name: schedule.classrooms.name,
            schedule1_id: exclude_schedule_id || '',
            schedule2_id: schedule.id,
            conflict_date: new Date(start_time).toISOString().split('T')[0],
            severity: 'high',
            resolved: false,
            created_at: new Date().toISOString(),
          });
        });
      }
    }

    return conflicts;
  },
};

// 교실 서비스
export const classroomService = {
  /**
   * 모든 교실 조회 (통합 테이블)
   */
  async getAll(): Promise<Classroom[]> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('capacity', { ascending: false })
      .order('name');

    if (error) throw error;

    // is_active 또는 is_available이 true인 것만 반환
    return (data || []).filter(classroom =>
      classroom.is_active !== false && classroom.is_available !== false
    );
  },

  /**
   * 교실 생성
   */
  async create(classroom: ClassroomCreate): Promise<Classroom> {
    const { data, error } = await supabase
      .from('classrooms')
      .insert(classroom)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 교실 수정
   */
  async update(id: string, classroom: Partial<ClassroomCreate>): Promise<Classroom> {
    const { data, error } = await supabase
      .from('classrooms')
      .update({ ...classroom, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 교실 삭제 (비활성화)
   */
  async delete(id: string): Promise<void> {
    // 두 필드 모두 업데이트 (호환성)
    const { error } = await supabase
      .from('classrooms')
      .update({
        is_active: false,
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * ID로 교실 조회
   */
  async getById(id: string): Promise<Classroom | null> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * 가용한 교실 조회 (특정 시간대)
   */
  async getAvailable(start_time: string, end_time: string): Promise<Classroom[]> {
    // 해당 시간대에 예약되지 않은 교실 조회
    const { data: bookedClassrooms, error: bookedError } = await supabase
      .from('schedules')
      .select('classroom_id')
      .or(`start_time.lte.${end_time},end_time.gte.${start_time}`)
      .not('classroom_id', 'is', null);

    if (bookedError) throw bookedError;

    const bookedIds = (bookedClassrooms || []).map(s => s.classroom_id);

    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('capacity', { ascending: false });

    if (error) throw error;

    return (data || [])
      .filter(classroom =>
        classroom.is_active !== false &&
        classroom.is_available !== false &&
        !bookedIds.includes(classroom.id)
      );
  },
};

// 개인 이벤트 서비스
export const personalEventService = {
  /**
   * 사용자의 모든 이벤트 조회
   */
  async getByUserId(userId: string, date_range?: { start: string; end: string }): Promise<PersonalEvent[]> {
    let query = supabase
      .from('personal_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time');

    if (date_range) {
      query = query
        .gte('start_time', date_range.start)
        .lte('start_time', date_range.end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * 이벤트 생성
   */
  async create(event: PersonalEventCreate): Promise<PersonalEvent> {
    const { data, error } = await supabase
      .from('personal_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 이벤트 수정
   */
  async update(id: string, event: Partial<PersonalEventCreate>): Promise<PersonalEvent> {
    const { data, error } = await supabase
      .from('personal_events')
      .update({ ...event, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 이벤트 삭제
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('personal_events').delete().eq('id', id);

    if (error) throw error;
  },
};

// 통합 캘린더 서비스
export const integratedCalendarService = {
  /**
   * 모든 이벤트를 캘린더 형식으로 조회
   */
  async getAllEvents(
    userId: string,
    date_range: { start: string; end: string }
  ): Promise<CalendarEvent[]> {
    const events: CalendarEvent[] = [];

    try {
      // 1. course_sessions 테이블에서 세션 조회
      try {
        console.log('📅 Loading course sessions for date range:', date_range);

        const { data: sessions, error } = await supabase
          .from('course_sessions')
          .select(`
            *,
            course_rounds(id, course_name, status),
            subjects(id, name),
            users!course_sessions_actual_instructor_id_fkey(id, name),
            classrooms(id, name)
          `)
          .gte('session_date', date_range.start)
          .lte('session_date', date_range.end)
          .order('session_date')
          .order('start_time');

        if (error) {
          console.error('Failed to load course sessions:', error);
        } else {
          console.log(`✅ Loaded ${sessions?.length || 0} course sessions`);

          sessions?.forEach((session: any) => {
            const startDateTime = `${session.session_date}T${session.start_time}`;
            const endDateTime = `${session.session_date}T${session.end_time}`;

            events.push({
              id: `session-${session.id}`,
              title: session.title || session.subjects?.name || '세션',
              start: startDateTime,
              end: endDateTime,
              type: 'course',
              course_id: session.course_round_id,
              instructor_id: session.actual_instructor_id,
              classroom: session.classrooms?.name || session.classroom || '',
              status: session.status,
              color: session.status === 'completed' ? '#10B981' :
                     session.status === 'in_progress' ? '#F59E0B' :
                     session.status === 'cancelled' ? '#EF4444' : '#6366F1',
              editable: true,
            });
          });
        }
      } catch (sessionError) {
        console.warn('Failed to load course sessions:', sessionError);
      }

      // 2. 일정(schedules) 조회 - 레거시 지원
      try {
        const schedules = await scheduleService.getAll({ date_range });
        schedules.forEach((schedule) => {
          events.push({
            id: `schedule-${schedule.id}`,
            title: schedule.title,
            start: schedule.start_time,
            end: schedule.end_time,
            type: 'schedule',
            color: '#6366F1', // indigo
            instructor: schedule.instructor_name,
            classroom: schedule.classroom_name,
            course_round_id: schedule.course_round_id,
            status: schedule.status,
            editable: true,
          });
        });
      } catch (scheduleError) {
        console.warn('Failed to load schedules:', scheduleError);
      }

      // 3. 개인 이벤트 조회
      try {
        const personalEvents = await personalEventService.getByUserId(userId, date_range);
        personalEvents.forEach((event) => {
          events.push({
            id: `personal-${event.id}`,
            title: event.title,
            start: event.start_time,
            end: event.end_time || event.start_time,
            type: event.event_type === 'holiday' ? 'holiday' : 'personal',
            color: event.color || '#10B981', // green
            allDay: event.all_day,
            editable: event.event_type !== 'holiday',
          });
        });
      } catch (eventError) {
        console.warn('Failed to load personal events:', eventError);
      }
    } catch (error) {
      console.error('Unexpected error in getAllEvents:', error);
    }

    return events;
  },
};
