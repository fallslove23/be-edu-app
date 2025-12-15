/**
 * 과정 관리와 일정 캘린더 간 동기화 서비스
 *
 * 과정의 일정 정보가 변경되면 schedules 테이블을 자동으로 업데이트
 */

import { supabase } from './supabase';
import { scheduleService } from './schedule.service';
import type { CourseRound } from './course-rounds.service';

export interface SyncScheduleParams {
  courseRoundId: string;
  title: string;
  instructorId: string | null;
  instructorName: string;
  startDate: string;
  endDate: string;
  location: string;
}

export class CourseScheduleSyncService {
  /**
   * 과정 차수의 일정 정보를 schedules 테이블과 동기화
   */
  static async syncCourseSchedule(params: SyncScheduleParams): Promise<void> {
    try {
      // 1. 해당 과정 차수의 기존 schedule 조회
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('course_round_id', params.courseRoundId);

      if (fetchError) {
        console.error('기존 일정 조회 실패:', fetchError);
        throw fetchError;
      }

      // 2. 기존 schedule이 있으면 업데이트, 없으면 생성
      if (existingSchedules && existingSchedules.length > 0) {
        // 첫 번째 schedule만 업데이트 (대표 일정)
        const mainSchedule = existingSchedules[0];

        await scheduleService.update(mainSchedule.id, {
          title: params.title,
          instructor_id: params.instructorId,
          start_time: `${params.startDate}T09:00:00`,
          end_time: `${params.endDate}T18:00:00`,
          classroom_id: null, // classroom은 별도 관리
        });

        console.log(`✅ 일정 업데이트 완료: ${mainSchedule.id}`);
      } else {
        // 새로운 schedule 생성
        const newSchedule = await scheduleService.create({
          course_round_id: params.courseRoundId,
          title: params.title,
          subject: '',
          description: `${params.title} 과정`,
          start_time: `${params.startDate}T09:00:00`,
          end_time: `${params.endDate}T18:00:00`,
          instructor_id: params.instructorId,
          classroom_id: null,
          status: 'scheduled',
        });

        console.log(`✅ 새 일정 생성 완료: ${newSchedule.id}`);
      }
    } catch (error) {
      console.error('일정 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 과정 차수 삭제 시 관련 schedules도 삭제
   */
  static async deleteCourseSchedules(courseRoundId: string): Promise<void> {
    try {
      const { data: schedules, error: fetchError } = await supabase
        .from('schedules')
        .select('id')
        .eq('course_round_id', courseRoundId);

      if (fetchError) {
        console.error('일정 조회 실패:', fetchError);
        throw fetchError;
      }

      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          await scheduleService.delete(schedule.id);
        }
        console.log(`✅ ${schedules.length}개의 관련 일정 삭제 완료`);
      }
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 과정 차수 정보로부터 schedule 파라미터 생성
   */
  static createSyncParams(courseRound: CourseRound): SyncScheduleParams {
    return {
      courseRoundId: courseRound.id,
      title: courseRound.title,
      instructorId: courseRound.instructor_id,
      instructorName: courseRound.instructor_name,
      startDate: courseRound.start_date,
      endDate: courseRound.end_date,
      location: courseRound.location,
    };
  }

  /**
   * 특정 기간의 모든 과정 차수를 schedules와 동기화
   */
  static async syncAllCoursesInPeriod(startDate: string, endDate: string): Promise<void> {
    try {
      const { data: courseRounds, error } = await supabase
        .from('course_rounds')
        .select('*')
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (error) {
        console.error('과정 차수 조회 실패:', error);
        throw error;
      }

      if (!courseRounds || courseRounds.length === 0) {
        console.log('동기화할 과정이 없습니다.');
        return;
      }

      console.log(`${courseRounds.length}개의 과정 동기화 시작...`);

      for (const courseRound of courseRounds) {
        const params = this.createSyncParams(courseRound);
        await this.syncCourseSchedule(params);
      }

      console.log(`✅ 모든 과정 동기화 완료`);
    } catch (error) {
      console.error('전체 동기화 실패:', error);
      throw error;
    }
  }
}
