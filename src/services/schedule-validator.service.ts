/**
 * 일정 검증 및 충돌 감지 서비스
 *
 * 기능:
 * - 강사/교실/교육생 일정 충돌 감지
 * - 업무 시간 검증
 * - 주말/공휴일 검증
 * - 최대 연속 강의 시간 검증
 */

import { supabase } from './supabase';

export interface ScheduleConflict {
  type: 'instructor' | 'classroom' | 'trainee' | 'time' | 'resource';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  affectedResources: {
    id: string;
    name: string;
    type: string;
  }[];
  suggestedFix?: string;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  conflicts: ScheduleConflict[];
  warnings: string[];
}

export interface ScheduleToValidate {
  start_time: string;
  end_time: string;
  instructor_id?: string;
  classroom_id?: string;
  course_round_id?: string;
  exclude_schedule_id?: string;
}

// 업무 시간 상수
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 18;
const MAX_CONTINUOUS_HOURS = 4; // 최대 연속 강의 시간
const MIN_BREAK_MINUTES = 10; // 최소 휴식 시간

// 한국 공휴일 (2025년)
const KOREAN_HOLIDAYS_2025 = new Set([
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
  '2025-03-01', '2025-05-05', '2025-05-06', '2025-06-06',
  '2025-08-15', '2025-09-06', '2025-09-07', '2025-09-08',
  '2025-10-03', '2025-10-09', '2025-12-25',
]);

export class ScheduleValidatorService {
  /**
   * 종합 일정 검증
   */
  static async validateSchedule(schedule: ScheduleToValidate): Promise<ScheduleValidationResult> {
    const conflicts: ScheduleConflict[] = [];
    const warnings: string[] = [];

    // 1. 기본 시간 검증
    const timeValidation = this.validateTime(schedule.start_time, schedule.end_time);
    if (!timeValidation.isValid) {
      conflicts.push(...timeValidation.conflicts);
    }
    warnings.push(...timeValidation.warnings);

    // 2. 강사 충돌 검증
    if (schedule.instructor_id) {
      const instructorConflicts = await this.checkInstructorConflicts(
        schedule.instructor_id,
        schedule.start_time,
        schedule.end_time,
        schedule.exclude_schedule_id
      );
      conflicts.push(...instructorConflicts);

      // 3. 강사 연속 강의 시간 검증
      const continuousCheck = await this.checkContinuousTeachingHours(
        schedule.instructor_id,
        schedule.start_time,
        schedule.end_time,
        schedule.exclude_schedule_id
      );
      if (!continuousCheck.isValid) {
        conflicts.push(...continuousCheck.conflicts);
      }
    }

    // 4. 교실 충돌 검증
    if (schedule.classroom_id) {
      const classroomConflicts = await this.checkClassroomConflicts(
        schedule.classroom_id,
        schedule.start_time,
        schedule.end_time,
        schedule.exclude_schedule_id
      );
      conflicts.push(...classroomConflicts);
    }

    // 5. 교육생 그룹 충돌 검증
    if (schedule.course_round_id) {
      const traineeConflicts = await this.checkTraineeConflicts(
        schedule.course_round_id,
        schedule.start_time,
        schedule.end_time,
        schedule.exclude_schedule_id
      );
      conflicts.push(...traineeConflicts);
    }

    return {
      isValid: conflicts.filter(c => c.severity === 'critical' || c.severity === 'high').length === 0,
      conflicts,
      warnings,
    };
  }

  /**
   * 기본 시간 검증
   */
  private static validateTime(start_time: string, end_time: string): {
    isValid: boolean;
    conflicts: ScheduleConflict[];
    warnings: string[];
  } {
    const conflicts: ScheduleConflict[] = [];
    const warnings: string[] = [];

    const start = new Date(start_time);
    const end = new Date(end_time);

    // 시작 시간이 종료 시간보다 이후인지 체크
    if (start >= end) {
      conflicts.push({
        type: 'time',
        severity: 'critical',
        message: '시작 시간이 종료 시간보다 늦습니다.',
        affectedResources: [],
      });
      return { isValid: false, conflicts, warnings };
    }

    // 주말 체크
    const dayOfWeek = start.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('주말에 일정이 예약됩니다.');
    }

    // 공휴일 체크
    const dateStr = start.toISOString().split('T')[0];
    if (KOREAN_HOLIDAYS_2025.has(dateStr)) {
      warnings.push('공휴일에 일정이 예약됩니다.');
    }

    // 업무 시간 체크
    const startHour = start.getHours();
    const endHour = end.getHours();

    if (startHour < WORK_START_HOUR || endHour > WORK_END_HOUR) {
      warnings.push(`업무 시간(${WORK_START_HOUR}:00-${WORK_END_HOUR}:00) 외 일정입니다.`);
    }

    // 일정 길이 체크
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > MAX_CONTINUOUS_HOURS) {
      conflicts.push({
        type: 'time',
        severity: 'medium',
        message: `일정이 ${MAX_CONTINUOUS_HOURS}시간을 초과합니다 (${durationHours.toFixed(1)}시간). 휴식 시간을 고려해주세요.`,
        affectedResources: [],
        suggestedFix: `일정을 ${MAX_CONTINUOUS_HOURS}시간 이내로 분할하거나 휴식 시간을 추가하세요.`,
      });
    }

    return { isValid: conflicts.length === 0, conflicts, warnings };
  }

  /**
   * 강사 일정 충돌 검증
   */
  private static async checkInstructorConflicts(
    instructor_id: string,
    start_time: string,
    end_time: string,
    exclude_schedule_id?: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    try {
      // course_sessions 테이블에서 충돌 검색
      let sessionsQuery = supabase
        .from('course_sessions')
        .select('*, users!course_sessions_actual_instructor_id_fkey(name)')
        .eq('actual_instructor_id', instructor_id)
        .gte('session_date', start_time.split('T')[0])
        .lte('session_date', end_time.split('T')[0]);

      const { data: sessions } = await sessionsQuery;

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const sessionStart = `${session.session_date}T${session.start_time}`;
          const sessionEnd = `${session.session_date}T${session.end_time}`;

          if (this.hasTimeOverlap(start_time, end_time, sessionStart, sessionEnd)) {
            conflicts.push({
              type: 'instructor',
              severity: 'critical',
              message: `강사 "${(session as any).users?.name}"님이 이미 ${session.session_date} ${session.start_time}-${session.end_time}에 배정되어 있습니다.`,
              affectedResources: [{
                id: instructor_id,
                name: (session as any).users?.name || '강사',
                type: 'instructor',
              }],
              suggestedFix: '다른 시간대를 선택하거나 다른 강사를 배정하세요.',
            });
          }
        }
      }

      // schedules 테이블에서도 확인 (레거시 지원)
      let schedulesQuery = supabase
        .from('schedules')
        .select('*, users!schedules_instructor_id_fkey(name)')
        .eq('instructor_id', instructor_id);

      if (exclude_schedule_id) {
        schedulesQuery = schedulesQuery.neq('id', exclude_schedule_id);
      }

      const { data: schedules } = await schedulesQuery;

      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          if (this.hasTimeOverlap(start_time, end_time, schedule.start_time, schedule.end_time)) {
            conflicts.push({
              type: 'instructor',
              severity: 'critical',
              message: `강사가 이미 "${schedule.title}" 일정에 배정되어 있습니다.`,
              affectedResources: [{
                id: instructor_id,
                name: (schedule as any).users?.name || '강사',
                type: 'instructor',
              }],
              suggestedFix: '다른 시간대를 선택하거나 다른 강사를 배정하세요.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking instructor conflicts:', error);
    }

    return conflicts;
  }

  /**
   * 교실 일정 충돌 검증
   */
  private static async checkClassroomConflicts(
    classroom_id: string,
    start_time: string,
    end_time: string,
    exclude_schedule_id?: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    try {
      // course_sessions에서 충돌 검색
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select('*, classrooms(name)')
        .eq('classroom_id', classroom_id)
        .gte('session_date', start_time.split('T')[0])
        .lte('session_date', end_time.split('T')[0]);

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const sessionStart = `${session.session_date}T${session.start_time}`;
          const sessionEnd = `${session.session_date}T${session.end_time}`;

          if (this.hasTimeOverlap(start_time, end_time, sessionStart, sessionEnd)) {
            conflicts.push({
              type: 'classroom',
              severity: 'high',
              message: `교실 "${(session as any).classrooms?.name}"이(가) 이미 예약되어 있습니다.`,
              affectedResources: [{
                id: classroom_id,
                name: (session as any).classrooms?.name || '교실',
                type: 'classroom',
              }],
              suggestedFix: '다른 시간대를 선택하거나 다른 교실을 배정하세요.',
            });
          }
        }
      }

      // schedules에서도 확인
      let schedulesQuery = supabase
        .from('schedules')
        .select('*, classrooms(name)')
        .eq('classroom_id', classroom_id);

      if (exclude_schedule_id) {
        schedulesQuery = schedulesQuery.neq('id', exclude_schedule_id);
      }

      const { data: schedules } = await schedulesQuery;

      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          if (this.hasTimeOverlap(start_time, end_time, schedule.start_time, schedule.end_time)) {
            conflicts.push({
              type: 'classroom',
              severity: 'high',
              message: `교실이 이미 "${schedule.title}" 일정에 배정되어 있습니다.`,
              affectedResources: [{
                id: classroom_id,
                name: (schedule as any).classrooms?.name || '교실',
                type: 'classroom',
              }],
              suggestedFix: '다른 시간대를 선택하거나 다른 교실을 배정하세요.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking classroom conflicts:', error);
    }

    return conflicts;
  }

  /**
   * 교육생 그룹 일정 충돌 검증
   */
  private static async checkTraineeConflicts(
    course_round_id: string,
    start_time: string,
    end_time: string,
    exclude_schedule_id?: string
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    try {
      // 같은 차수의 다른 세션과 충돌 검사
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select('*, course_rounds(course_name)')
        .eq('course_round_id', course_round_id)
        .gte('session_date', start_time.split('T')[0])
        .lte('session_date', end_time.split('T')[0]);

      if (sessions && sessions.length > 0) {
        for (const session of sessions) {
          const sessionStart = `${session.session_date}T${session.start_time}`;
          const sessionEnd = `${session.session_date}T${session.end_time}`;

          if (this.hasTimeOverlap(start_time, end_time, sessionStart, sessionEnd)) {
            conflicts.push({
              type: 'trainee',
              severity: 'high',
              message: `교육생들이 이미 "${session.title}" 세션에 배정되어 있습니다.`,
              affectedResources: [{
                id: course_round_id,
                name: (session as any).course_rounds?.course_name || '과정',
                type: 'course',
              }],
              suggestedFix: '다른 시간대를 선택하세요.',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking trainee conflicts:', error);
    }

    return conflicts;
  }

  /**
   * 강사 연속 강의 시간 검증
   */
  private static async checkContinuousTeachingHours(
    instructor_id: string,
    start_time: string,
    end_time: string,
    exclude_schedule_id?: string
  ): Promise<{ isValid: boolean; conflicts: ScheduleConflict[] }> {
    const conflicts: ScheduleConflict[] = [];

    try {
      const date = start_time.split('T')[0];

      // 해당 날짜의 강사 일정 조회
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('actual_instructor_id', instructor_id)
        .eq('session_date', date)
        .order('start_time');

      if (!sessions || sessions.length === 0) {
        return { isValid: true, conflicts: [] };
      }

      // 새 일정을 포함하여 시간순 정렬
      const allSessions = [
        ...sessions.map(s => ({
          start: `${s.session_date}T${s.start_time}`,
          end: `${s.session_date}T${s.end_time}`,
        })),
        { start: start_time, end: end_time },
      ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      // 연속 강의 시간 계산
      let continuousHours = 0;
      let lastEnd: Date | null = null;

      for (const session of allSessions) {
        const sessionStart = new Date(session.start);
        const sessionEnd = new Date(session.end);
        const sessionDuration = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);

        if (lastEnd === null) {
          // 첫 세션
          continuousHours = sessionDuration;
        } else {
          const breakMinutes = (sessionStart.getTime() - lastEnd.getTime()) / (1000 * 60);

          if (breakMinutes < MIN_BREAK_MINUTES) {
            // 충분한 휴식 없음 - 연속으로 간주
            continuousHours += sessionDuration;
          } else {
            // 충분한 휴식 - 리셋
            continuousHours = sessionDuration;
          }
        }

        if (continuousHours > MAX_CONTINUOUS_HOURS) {
          conflicts.push({
            type: 'instructor',
            severity: 'medium',
            message: `강사의 연속 강의 시간이 ${MAX_CONTINUOUS_HOURS}시간을 초과합니다 (${continuousHours.toFixed(1)}시간). 휴식 시간이 필요합니다.`,
            affectedResources: [{
              id: instructor_id,
              name: '강사',
              type: 'instructor',
            }],
            suggestedFix: `최소 ${MIN_BREAK_MINUTES}분의 휴식 시간을 추가하세요.`,
          });
          break;
        }

        lastEnd = sessionEnd;
      }
    } catch (error) {
      console.error('Error checking continuous teaching hours:', error);
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * 시간 겹침 확인 헬퍼 함수
   */
  private static hasTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();

    return s1 < e2 && e1 > s2;
  }

  /**
   * 가용한 시간대 추천
   */
  static async suggestAvailableTimeSlots(
    date: string,
    duration_hours: number,
    instructor_id?: string,
    classroom_id?: string,
    course_round_id?: string
  ): Promise<{ start_time: string; end_time: string }[]> {
    const suggestions: { start_time: string; end_time: string }[] = [];

    // 업무 시간 내 1시간 단위로 체크
    for (let hour = WORK_START_HOUR; hour <= WORK_END_HOUR - duration_hours; hour++) {
      const start_time = `${date}T${hour.toString().padStart(2, '0')}:00:00`;
      const end_time = `${date}T${(hour + duration_hours).toString().padStart(2, '0')}:00:00`;

      const validation = await this.validateSchedule({
        start_time,
        end_time,
        instructor_id,
        classroom_id,
        course_round_id,
      });

      if (validation.isValid) {
        suggestions.push({ start_time, end_time });
      }
    }

    return suggestions;
  }
}
