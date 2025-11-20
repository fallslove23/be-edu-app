import { supabase } from '@/services/supabase';
import type { Database } from '@/types/supabase';

type Instructor = Database['public']['Tables']['instructors']['Row'];
type Classroom = Database['public']['Tables']['classrooms']['Row'];
type CourseSession = Database['public']['Tables']['course_sessions']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

export interface ResourceAvailability {
  id: string;
  name: string;
  isAvailable: boolean;
  conflicts?: {
    session_id: string;
    course_name: string;
    start_time: string;
    end_time: string;
  }[];
}

export interface ResourceConflict {
  resource_type: 'instructor' | 'classroom';
  resource_id: string;
  resource_name: string;
  session_id: string;
  course_name: string;
  conflict_date: string;
  conflict_start: string;
  conflict_end: string;
}

export interface ResourceRecommendation {
  instructors: Array<{
    id: string;
    name: string;
    score: number;
    reason: string;
  }>;
  classrooms: Array<{
    id: string;
    name: string;
    score: number;
    reason: string;
  }>;
}

export class IntegratedResourceService {
  /**
   * 특정 날짜/시간대에 자원(강사 또는 강의실)의 가용성 체크
   */
  async checkResourceAvailability(
    date: string,
    startTime: string,
    endTime: string,
    resourceType: 'instructor' | 'classroom',
    excludeSessionId?: string
  ): Promise<ResourceAvailability[]> {
    try {
      // 1. 모든 자원 목록 가져오기
      const resourceTable = resourceType === 'instructor' ? 'instructors' : 'classrooms';
      const { data: resources, error: resourceError } = await supabase
        .from(resourceTable)
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (resourceError) throw resourceError;
      if (!resources) return [];

      // 2. 해당 날짜의 모든 세션 가져오기
      let query = supabase
        .from('course_sessions')
        .select(`
          id,
          start_time,
          end_time,
          instructor_id,
          classroom_id,
          courses (
            name
          )
        `)
        .eq('session_date', date);

      if (excludeSessionId) {
        query = query.neq('id', excludeSessionId);
      }

      const { data: sessions, error: sessionError } = await query;
      if (sessionError) throw sessionError;

      // 3. 각 자원의 가용성 체크
      const availabilityResults: ResourceAvailability[] = resources.map((resource) => {
        const conflictingSessions = (sessions || []).filter((session) => {
          const resourceId = resourceType === 'instructor'
            ? session.instructor_id
            : session.classroom_id;

          if (resourceId !== resource.id) return false;

          // 시간 충돌 체크
          const sessionStart = session.start_time;
          const sessionEnd = session.end_time;

          return (
            (startTime >= sessionStart && startTime < sessionEnd) ||
            (endTime > sessionStart && endTime <= sessionEnd) ||
            (startTime <= sessionStart && endTime >= sessionEnd)
          );
        });

        return {
          id: resource.id,
          name: resource.name,
          isAvailable: conflictingSessions.length === 0,
          conflicts: conflictingSessions.length > 0
            ? conflictingSessions.map((s) => ({
                session_id: s.id,
                course_name: (s.courses as any)?.name || '알 수 없는 과정',
                start_time: s.start_time,
                end_time: s.end_time,
              }))
            : undefined,
        };
      });

      return availabilityResults;
    } catch (error) {
      console.error('자원 가용성 체크 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 세션의 자원 충돌 감지
   */
  async detectConflicts(
    sessionId: string,
    sessionDate: string,
    startTime: string,
    endTime: string,
    instructorId?: string,
    classroomId?: string
  ): Promise<ResourceConflict[]> {
    try {
      const conflicts: ResourceConflict[] = [];

      // 강사 충돌 체크
      if (instructorId) {
        const instructorAvailability = await this.checkResourceAvailability(
          sessionDate,
          startTime,
          endTime,
          'instructor',
          sessionId
        );

        const instructor = instructorAvailability.find((r) => r.id === instructorId);
        if (instructor && !instructor.isAvailable && instructor.conflicts) {
          conflicts.push(
            ...instructor.conflicts.map((c) => ({
              resource_type: 'instructor' as const,
              resource_id: instructor.id,
              resource_name: instructor.name,
              session_id: c.session_id,
              course_name: c.course_name,
              conflict_date: sessionDate,
              conflict_start: c.start_time,
              conflict_end: c.end_time,
            }))
          );
        }
      }

      // 강의실 충돌 체크
      if (classroomId) {
        const classroomAvailability = await this.checkResourceAvailability(
          sessionDate,
          startTime,
          endTime,
          'classroom',
          sessionId
        );

        const classroom = classroomAvailability.find((r) => r.id === classroomId);
        if (classroom && !classroom.isAvailable && classroom.conflicts) {
          conflicts.push(
            ...classroom.conflicts.map((c) => ({
              resource_type: 'classroom' as const,
              resource_id: classroom.id,
              resource_name: classroom.name,
              session_id: c.session_id,
              course_name: c.course_name,
              conflict_date: sessionDate,
              conflict_start: c.start_time,
              conflict_end: c.end_time,
            }))
          );
        }
      }

      return conflicts;
    } catch (error) {
      console.error('충돌 감지 오류:', error);
      throw error;
    }
  }

  /**
   * 과목과 시간대에 기반한 자원 추천
   */
  async recommendResources(
    subjectId: string,
    sessionDate: string,
    startTime: string,
    endTime: string
  ): Promise<ResourceRecommendation> {
    try {
      // 1. 과목 정보 가져오기
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      if (subjectError) throw subjectError;

      // 2. 가용한 강사 목록
      const instructorAvailability = await this.checkResourceAvailability(
        sessionDate,
        startTime,
        endTime,
        'instructor'
      );

      // 3. 가용한 강의실 목록
      const classroomAvailability = await this.checkResourceAvailability(
        sessionDate,
        startTime,
        endTime,
        'classroom'
      );

      // 4. 해당 과목을 담당했던 강사 이력 조회
      const { data: instructorHistory } = await supabase
        .from('course_sessions')
        .select(`
          instructor_id,
          instructors (
            id,
            name
          )
        `)
        .eq('subject_id', subjectId)
        .not('instructor_id', 'is', null);

      const instructorExperience = new Map<string, number>();
      instructorHistory?.forEach((record) => {
        const id = record.instructor_id;
        if (id) {
          instructorExperience.set(id, (instructorExperience.get(id) || 0) + 1);
        }
      });

      // 5. 강사 추천 (가용성 + 경험 기반 점수)
      const recommendedInstructors = instructorAvailability
        .filter((i) => i.isAvailable)
        .map((instructor) => {
          const experience = instructorExperience.get(instructor.id) || 0;
          const score = experience > 0 ? 100 : 50; // 경험 있으면 100점, 없으면 50점
          const reason = experience > 0
            ? `${subject.name} 과목 ${experience}회 강의 경험`
            : '가능한 강사';

          return {
            id: instructor.id,
            name: instructor.name,
            score,
            reason,
          };
        })
        .sort((a, b) => b.score - a.score);

      // 6. 과목 유형에 따른 강의실 정보 조회
      const { data: classroomDetails } = await supabase
        .from('classrooms')
        .select('id, name, type, capacity, equipment')
        .in('id', classroomAvailability.map(c => c.id));

      // 7. 해당 과목에서 자주 사용된 강의실 조회
      const { data: classroomHistory } = await supabase
        .from('course_sessions')
        .select('classroom_id')
        .eq('subject_id', subjectId)
        .not('classroom_id', 'is', null);

      const classroomUsage = new Map<string, number>();
      classroomHistory?.forEach((record) => {
        const id = record.classroom_id;
        if (id) {
          classroomUsage.set(id, (classroomUsage.get(id) || 0) + 1);
        }
      });

      // 8. 강의실 추천 (가용성 + 과목 적합도 + 사용 이력)
      const recommendedClassrooms = classroomAvailability
        .filter((c) => c.isAvailable)
        .map((classroom) => {
          const details = classroomDetails?.find(d => d.id === classroom.id);
          const usage = classroomUsage.get(classroom.id) || 0;

          let score = 50; // 기본 점수
          let reasons: string[] = [];

          // 사용 이력 점수
          if (usage > 0) {
            score += Math.min(usage * 10, 30); // 최대 30점 추가
            reasons.push(`${subject.name} 과목에서 ${usage}회 사용`);
          }

          // 강의실 타입 점수 (subject의 type과 매칭)
          if (details?.type) {
            // 과목 이름이나 설명에서 실습/이론 키워드 확인
            const subjectDesc = `${subject.name} ${subject.description || ''}`.toLowerCase();
            const isLabSubject = subjectDesc.includes('실습') || subjectDesc.includes('실기') || subjectDesc.includes('lab');
            const isTheorySubject = subjectDesc.includes('이론') || subjectDesc.includes('강의');

            if (isLabSubject && details.type === 'lab') {
              score += 20;
              reasons.push('실습실 (실습 과목에 적합)');
            } else if (isTheorySubject && details.type === 'lecture') {
              score += 20;
              reasons.push('강의실 (이론 과목에 적합)');
            } else if (details.type === 'general') {
              score += 10;
              reasons.push('범용 강의실');
            }
          }

          // 장비 보유 여부
          if (details?.equipment && Array.isArray(details.equipment) && details.equipment.length > 0) {
            score += 5;
            reasons.push(`장비: ${details.equipment.slice(0, 2).join(', ')}`);
          }

          const reason = reasons.length > 0 ? reasons.join(' · ') : '사용 가능한 강의실';

          return {
            id: classroom.id,
            name: classroom.name,
            score,
            reason,
          };
        })
        .sort((a, b) => b.score - a.score); // 점수 높은 순으로 정렬

      return {
        instructors: recommendedInstructors,
        classrooms: recommendedClassrooms,
      };
    } catch (error) {
      console.error('자원 추천 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 자원의 주간 스케줄 조회
   */
  async getResourceWeeklySchedule(
    resourceType: 'instructor' | 'classroom',
    resourceId: string,
    startDate: string,
    endDate: string
  ): Promise<CourseSession[]> {
    try {
      const column = resourceType === 'instructor' ? 'instructor_id' : 'classroom_id';

      const { data: sessions, error } = await supabase
        .from('course_sessions')
        .select(`
          *,
          courses (
            id,
            name
          ),
          subjects (
            id,
            name
          )
        `)
        .eq(column, resourceId)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .order('session_date')
        .order('start_time');

      if (error) throw error;
      return sessions || [];
    } catch (error) {
      console.error('자원 스케줄 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 자원 활용도 통계
   */
  async getResourceUtilization(
    resourceType: 'instructor' | 'classroom',
    startDate: string,
    endDate: string
  ): Promise<Array<{ id: string; name: string; sessionCount: number; totalHours: number }>> {
    try {
      const resourceTable = resourceType === 'instructor' ? 'instructors' : 'classrooms';
      const column = resourceType === 'instructor' ? 'instructor_id' : 'classroom_id';

      // 1. 모든 활성 자원
      const { data: resources, error: resourceError } = await supabase
        .from(resourceTable)
        .select('id, name')
        .eq('is_active', true);

      if (resourceError) throw resourceError;
      if (!resources) return [];

      // 2. 기간 내 세션 통계
      const { data: sessions, error: sessionError } = await supabase
        .from('course_sessions')
        .select(`
          ${column},
          start_time,
          end_time
        `)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .not(column, 'is', null);

      if (sessionError) throw sessionError;

      // 3. 통계 계산
      const utilizationMap = new Map<string, { sessionCount: number; totalHours: number }>();

      sessions?.forEach((session) => {
        const resourceId = session[column];
        if (!resourceId) return;

        const start = new Date(`2000-01-01T${session.start_time}`);
        const end = new Date(`2000-01-01T${session.end_time}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        const current = utilizationMap.get(resourceId) || { sessionCount: 0, totalHours: 0 };
        utilizationMap.set(resourceId, {
          sessionCount: current.sessionCount + 1,
          totalHours: current.totalHours + hours,
        });
      });

      // 4. 결과 생성
      return resources.map((resource) => {
        const stats = utilizationMap.get(resource.id) || { sessionCount: 0, totalHours: 0 };
        return {
          id: resource.id,
          name: resource.name,
          sessionCount: stats.sessionCount,
          totalHours: Math.round(stats.totalHours * 10) / 10,
        };
      });
    } catch (error) {
      console.error('자원 활용도 조회 오류:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const integratedResourceService = new IntegratedResourceService();
