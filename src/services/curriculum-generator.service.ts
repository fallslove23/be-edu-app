/**
 * 커리큘럼 자동 생성 서비스
 *
 * 기능:
 * - 템플릿 기반 커리큘럼 자동 생성
 * - 강사 가용성 고려
 * - 교실 예약 상황 반영
 * - 최적화된 일정 배치
 */

import { supabase } from './supabase';
import { ScheduleValidatorService } from './schedule-validator.service';

interface CurriculumTemplate {
  id: string;
  name: string;
  sessions: TemplateSession[];
}

interface TemplateSession {
  day_number: number;
  session_number: number;
  subject_id: string;
  subject_name?: string;
  duration_hours: number;
  required_instructor_id?: string;
  preferred_classroom_id?: string;
}

interface GenerationOptions {
  start_date: string;
  course_round_id: string;
  template_id: string;
  skip_weekends: boolean;
  skip_holidays: boolean;
  preferred_start_hour: number; // 9
  preferred_end_hour: number; // 18
  max_sessions_per_day: number; // 4
  min_break_minutes: number; // 10
}

interface GeneratedSession {
  session_date: string;
  start_time: string;
  end_time: string;
  subject_id: string;
  subject_name: string;
  day_number: number;
  session_number: number;
  suggested_instructor_id?: string;
  suggested_classroom_id?: string;
  conflicts: any[];
  quality_score: number; // 0-100
}

interface GenerationResult {
  success: boolean;
  sessions: GeneratedSession[];
  total_sessions: number;
  successful_sessions: number;
  failed_sessions: number;
  conflicts: any[];
  warnings: string[];
  estimated_end_date: string;
}

// 한국 공휴일 (2025년)
const KOREAN_HOLIDAYS_2025 = new Set([
  '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30',
  '2025-03-01', '2025-05-05', '2025-05-06', '2025-06-06',
  '2025-08-15', '2025-09-06', '2025-09-07', '2025-09-08',
  '2025-10-03', '2025-10-09', '2025-12-25',
]);

export class CurriculumGeneratorService {
  /**
   * 템플릿 기반 커리큘럼 자동 생성
   */
  static async generateCurriculum(options: GenerationOptions): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: false,
      sessions: [],
      total_sessions: 0,
      successful_sessions: 0,
      failed_sessions: 0,
      conflicts: [],
      warnings: [],
      estimated_end_date: '',
    };

    try {
      // 1. 템플릿 세션 로드
      const templateSessions = await this.loadTemplateSessions(options.template_id);
      result.total_sessions = templateSessions.length;

      if (templateSessions.length === 0) {
        result.warnings.push('템플릿에 세션이 없습니다.');
        return result;
      }

      // 2. 강사 가용성 정보 로드
      const instructorAvailability = await this.loadInstructorAvailability(
        options.start_date,
        templateSessions.length
      );

      // 3. 교실 정보 로드
      const availableClassrooms = await this.loadClassrooms();

      // 4. 날짜별로 세션 배치
      let currentDate = new Date(options.start_date);
      const sessionsByDay = this.groupSessionsByDay(templateSessions);

      for (const [dayNumber, daySessions] of sessionsByDay.entries()) {
        // 영업일만 선택
        currentDate = this.getNextWorkingDay(
          currentDate,
          options.skip_weekends,
          options.skip_holidays
        );

        // 하루 최대 세션 수 체크
        if (daySessions.length > options.max_sessions_per_day) {
          result.warnings.push(
            `${dayNumber}일차에 ${daySessions.length}개 세션이 있습니다 (최대: ${options.max_sessions_per_day})`
          );
        }

        // 세션별 시간 배치
        let sessionStartHour = options.preferred_start_hour;

        for (const session of daySessions) {
          const dateStr = currentDate.toISOString().split('T')[0];

          // 종료 시간 계산
          const sessionEndHour = sessionStartHour + session.duration_hours;

          // 업무 시간 초과 체크
          if (sessionEndHour > options.preferred_end_hour) {
            result.warnings.push(
              `${dateStr} ${dayNumber}일차 ${session.session_number}교시: 업무 시간 초과`
            );
            // 다음 날로 이동
            currentDate = this.getNextWorkingDay(
              new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
              options.skip_weekends,
              options.skip_holidays
            );
            sessionStartHour = options.preferred_start_hour;
            continue;
          }

          const start_time = `${dateStr}T${sessionStartHour.toString().padStart(2, '0')}:00:00`;
          const end_time = `${dateStr}T${sessionEndHour.toString().padStart(2, '0')}:00:00`;

          // 강사 배정
          const suggestedInstructor = await this.findBestInstructor(
            session.subject_id,
            start_time,
            end_time,
            instructorAvailability,
            session.required_instructor_id
          );

          // 교실 배정
          const suggestedClassroom = await this.findBestClassroom(
            start_time,
            end_time,
            availableClassrooms,
            session.preferred_classroom_id
          );

          // 충돌 검증
          const validation = await ScheduleValidatorService.validateSchedule({
            start_time,
            end_time,
            instructor_id: suggestedInstructor?.id,
            classroom_id: suggestedClassroom?.id,
            course_round_id: options.course_round_id,
          });

          // 품질 점수 계산
          const qualityScore = this.calculateQualityScore({
            hasInstructor: !!suggestedInstructor,
            hasClassroom: !!suggestedClassroom,
            isPreferredInstructor: suggestedInstructor?.id === session.required_instructor_id,
            isPreferredClassroom: suggestedClassroom?.id === session.preferred_classroom_id,
            conflictCount: validation.conflicts.length,
            warningCount: validation.warnings.length,
          });

          result.sessions.push({
            session_date: dateStr,
            start_time,
            end_time,
            subject_id: session.subject_id,
            subject_name: session.subject_name || '',
            day_number: session.day_number,
            session_number: session.session_number,
            suggested_instructor_id: suggestedInstructor?.id,
            suggested_classroom_id: suggestedClassroom?.id,
            conflicts: validation.conflicts,
            quality_score: qualityScore,
          });

          if (validation.isValid) {
            result.successful_sessions++;
          } else {
            result.failed_sessions++;
            result.conflicts.push(...validation.conflicts);
          }

          // 다음 세션 시작 시간 (휴식 시간 포함)
          sessionStartHour = sessionEndHour + options.min_break_minutes / 60;
        }

        // 다음 날로 이동
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }

      result.estimated_end_date = currentDate.toISOString().split('T')[0];
      result.success = result.failed_sessions === 0;

    } catch (error) {
      console.error('커리큘럼 생성 오류:', error);
      result.warnings.push(`생성 중 오류 발생: ${error}`);
    }

    return result;
  }

  /**
   * 템플릿 세션 로드
   */
  private static async loadTemplateSessions(template_id: string): Promise<TemplateSession[]> {
    const { data, error } = await supabase
      .from('curriculum_template_sessions')
      .select(`
        *,
        subjects(id, name)
      `)
      .eq('template_id', template_id)
      .order('day_number')
      .order('session_number');

    if (error) throw error;

    return (data || []).map((session: any) => ({
      day_number: session.day_number,
      session_number: session.session_number,
      subject_id: session.subject_id,
      subject_name: session.subjects?.name,
      duration_hours: session.duration_hours || 2,
      required_instructor_id: session.instructor_id,
      preferred_classroom_id: session.classroom_id,
    }));
  }

  /**
   * 강사 가용성 정보 로드
   */
  private static async loadInstructorAvailability(
    start_date: string,
    duration_days: number
  ): Promise<Map<string, any>> {
    const availability = new Map();

    const end_date = new Date(start_date);
    end_date.setDate(end_date.getDate() + duration_days + 30); // 여유있게

    // 강사 목록 조회
    const { data: instructors } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'instructor')
      .eq('is_active', true);

    if (instructors) {
      for (const instructor of instructors) {
        availability.set(instructor.id, {
          ...instructor,
          bookedSlots: [],
        });
      }
    }

    // 기존 예약 조회
    const { data: sessions } = await supabase
      .from('course_sessions')
      .select('actual_instructor_id, session_date, start_time, end_time')
      .gte('session_date', start_date)
      .lte('session_date', end_date.toISOString().split('T')[0]);

    if (sessions) {
      for (const session of sessions) {
        if (session.actual_instructor_id && availability.has(session.actual_instructor_id)) {
          const instructor = availability.get(session.actual_instructor_id);
          instructor.bookedSlots.push({
            date: session.session_date,
            start: session.start_time,
            end: session.end_time,
          });
        }
      }
    }

    return availability;
  }

  /**
   * 교실 정보 로드
   */
  private static async loadClassrooms(): Promise<any[]> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .order('capacity', { ascending: false });

    if (error) throw error;

    return (data || []).filter(
      classroom => classroom.is_active !== false && classroom.is_available !== false
    );
  }

  /**
   * 세션을 일자별로 그룹화
   */
  private static groupSessionsByDay(sessions: TemplateSession[]): Map<number, TemplateSession[]> {
    const grouped = new Map<number, TemplateSession[]>();

    for (const session of sessions) {
      if (!grouped.has(session.day_number)) {
        grouped.set(session.day_number, []);
      }
      grouped.get(session.day_number)!.push(session);
    }

    return grouped;
  }

  /**
   * 다음 영업일 찾기
   */
  private static getNextWorkingDay(
    date: Date,
    skip_weekends: boolean,
    skip_holidays: boolean
  ): Date {
    let nextDay = new Date(date);

    while (true) {
      const isWeekend = skip_weekends && (nextDay.getDay() === 0 || nextDay.getDay() === 6);
      const isHoliday = skip_holidays && KOREAN_HOLIDAYS_2025.has(
        nextDay.toISOString().split('T')[0]
      );

      if (!isWeekend && !isHoliday) {
        break;
      }

      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  /**
   * 최적의 강사 찾기
   */
  private static async findBestInstructor(
    subject_id: string,
    start_time: string,
    end_time: string,
    availability: Map<string, any>,
    preferred_instructor_id?: string
  ): Promise<{ id: string; name: string; score: number } | null> {
    // 해당 과목을 가르칠 수 있는 강사 조회
    const { data: instructorSubjects } = await supabase
      .from('instructor_subjects')
      .select('instructor_id, subjects(id, name)')
      .eq('subject_id', subject_id)
      .eq('is_active', true);

    if (!instructorSubjects || instructorSubjects.length === 0) {
      return null;
    }

    const candidates: Array<{ id: string; name: string; score: number }> = [];

    for (const is of instructorSubjects) {
      const instructorId = is.instructor_id;
      const instructorInfo = availability.get(instructorId);

      if (!instructorInfo) continue;

      // 시간 충돌 체크
      const dateStr = start_time.split('T')[0];
      const hasConflict = instructorInfo.bookedSlots.some((slot: any) => {
        if (slot.date !== dateStr) return false;
        const slotStart = `${slot.date}T${slot.start}`;
        const slotEnd = `${slot.date}T${slot.end}`;
        return this.hasTimeOverlap(start_time, end_time, slotStart, slotEnd);
      });

      if (hasConflict) continue;

      // 점수 계산
      let score = 50;
      if (instructorId === preferred_instructor_id) score += 50;
      // 해당 날짜 다른 세션 수가 적을수록 가점
      const sessionsOnDay = instructorInfo.bookedSlots.filter(
        (slot: any) => slot.date === dateStr
      ).length;
      score -= sessionsOnDay * 5;

      candidates.push({
        id: instructorId,
        name: instructorInfo.name,
        score,
      });
    }

    if (candidates.length === 0) return null;

    // 점수가 가장 높은 강사 선택
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  /**
   * 최적의 교실 찾기
   */
  private static async findBestClassroom(
    start_time: string,
    end_time: string,
    classrooms: any[],
    preferred_classroom_id?: string
  ): Promise<{ id: string; name: string; score: number } | null> {
    const dateStr = start_time.split('T')[0];

    // 해당 시간대 예약된 교실 조회
    const { data: bookedSessions } = await supabase
      .from('course_sessions')
      .select('classroom_id')
      .eq('session_date', dateStr)
      .not('classroom_id', 'is', null);

    const bookedClassroomIds = new Set(
      (bookedSessions || []).map(s => s.classroom_id)
    );

    const candidates: Array<{ id: string; name: string; score: number }> = [];

    for (const classroom of classrooms) {
      // 이미 예약된 교실은 제외
      if (bookedClassroomIds.has(classroom.id)) continue;

      let score = 50;
      if (classroom.id === preferred_classroom_id) score += 50;
      // 큰 교실일수록 가점 (여유 공간)
      score += (classroom.capacity || 0) / 10;

      candidates.push({
        id: classroom.id,
        name: classroom.name,
        score,
      });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  /**
   * 품질 점수 계산
   */
  private static calculateQualityScore(factors: {
    hasInstructor: boolean;
    hasClassroom: boolean;
    isPreferredInstructor: boolean;
    isPreferredClassroom: boolean;
    conflictCount: number;
    warningCount: number;
  }): number {
    let score = 0;

    if (factors.hasInstructor) score += 30;
    if (factors.hasClassroom) score += 30;
    if (factors.isPreferredInstructor) score += 20;
    if (factors.isPreferredClassroom) score += 10;

    score -= factors.conflictCount * 10;
    score -= factors.warningCount * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 시간 겹침 확인
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
   * 생성된 커리큘럼을 데이터베이스에 저장
   */
  static async saveCurriculum(
    course_round_id: string,
    sessions: GeneratedSession[]
  ): Promise<{ success: boolean; saved_count: number; errors: string[] }> {
    const result = {
      success: false,
      saved_count: 0,
      errors: [] as string[],
    };

    try {
      for (const session of sessions) {
        try {
          const { error } = await supabase.from('course_sessions').insert({
            course_round_id,
            session_date: session.session_date,
            start_time: session.start_time,
            end_time: session.end_time,
            subject_id: session.subject_id,
            title: session.subject_name,
            day_number: session.day_number,
            session_number: session.session_number,
            actual_instructor_id: session.suggested_instructor_id,
            classroom_id: session.suggested_classroom_id,
            status: 'scheduled',
          });

          if (error) {
            result.errors.push(`세션 저장 실패 (${session.day_number}일차 ${session.session_number}교시): ${error.message}`);
          } else {
            result.saved_count++;
          }
        } catch (err) {
          result.errors.push(`세션 저장 오류: ${err}`);
        }
      }

      result.success = result.saved_count === sessions.length;
    } catch (error) {
      result.errors.push(`저장 중 오류: ${error}`);
    }

    return result;
  }
}
