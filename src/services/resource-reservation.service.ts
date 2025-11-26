/**
 * =================================================
 * 자원 예약 서비스
 * =================================================
 * 설명: 강의실 예약 및 충돌 검증
 * 작성일: 2025-01-24
 * =================================================
 */

import { supabase } from './supabase';
import { ClassroomService } from './resource.services';

export interface ResourceReservation {
  curriculum_item_id: string;
  classroom_id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  instructor_name?: string;
  round_name?: string;
}

export interface ConflictInfo {
  has_conflict: boolean;
  conflicting_reservations: ResourceReservation[];
  message?: string;
}

export interface AvailableClassroom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  facilities: string[];
  equipment: string[];
  is_available: boolean;
}

export class ResourceReservationService {
  /**
   * 강의실 예약 충돌 검증
   * @param classroom_id 강의실 ID
   * @param date 날짜 (YYYY-MM-DD)
   * @param start_time 시작 시간 (HH:MM:SS)
   * @param end_time 종료 시간 (HH:MM:SS)
   * @param exclude_curriculum_item_id 제외할 커리큘럼 항목 (수정 시 자기 자신 제외)
   * @returns 충돌 정보
   */
  static async checkClassroomConflict(
    classroom_id: string,
    date: string,
    start_time: string,
    end_time: string,
    exclude_curriculum_item_id?: string
  ): Promise<ConflictInfo> {
    try {
      console.log('[ResourceReservation] Checking classroom conflict:', {
        classroom_id,
        date,
        start_time,
        end_time,
        exclude_curriculum_item_id
      });

      // 1. 해당 날짜, 강의실의 모든 예약 조회
      let query = supabase
        .from('curriculum_items_full')
        .select('*')
        .eq('classroom_id', classroom_id)
        .eq('date', date)
        .neq('status', 'cancelled'); // 취소된 항목 제외

      if (exclude_curriculum_item_id) {
        query = query.neq('id', exclude_curriculum_item_id);
      }

      const { data: existingReservations, error } = await query;

      if (error) {
        console.error('[ResourceReservation] Error checking conflict:', error);
        throw error;
      }

      if (!existingReservations || existingReservations.length === 0) {
        return {
          has_conflict: false,
          conflicting_reservations: [],
          message: '사용 가능합니다.'
        };
      }

      // 2. 시간 충돌 검사
      const conflictingReservations: ResourceReservation[] = [];

      for (const reservation of existingReservations) {
        // 시간 겹침 확인: (start1 < end2) AND (start2 < end1)
        const overlap = (
          start_time < reservation.end_time &&
          reservation.start_time < end_time
        );

        if (overlap) {
          conflictingReservations.push({
            curriculum_item_id: reservation.id,
            classroom_id: reservation.classroom_id,
            date: reservation.date,
            start_time: reservation.start_time,
            end_time: reservation.end_time,
            subject: reservation.subject,
            instructor_name: reservation.instructor_name || undefined,
            round_name: reservation.round_name || undefined
          });
        }
      }

      if (conflictingReservations.length > 0) {
        const conflictMessages = conflictingReservations.map(c =>
          `${c.start_time}-${c.end_time}: ${c.subject} (${c.round_name || '과정 정보 없음'})`
        );

        return {
          has_conflict: true,
          conflicting_reservations: conflictingReservations,
          message: `예약 충돌:\n${conflictMessages.join('\n')}`
        };
      }

      return {
        has_conflict: false,
        conflicting_reservations: [],
        message: '사용 가능합니다.'
      };
    } catch (error: any) {
      console.error('[ResourceReservation] Error:', error);
      throw error;
    }
  }

  /**
   * 특정 시간대에 사용 가능한 강의실 목록 조회
   * @param date 날짜
   * @param start_time 시작 시간
   * @param end_time 종료 시간
   * @param min_capacity 최소 수용 인원 (선택)
   * @returns 사용 가능한 강의실 목록
   */
  static async getAvailableClassrooms(
    date: string,
    start_time: string,
    end_time: string,
    min_capacity?: number
  ): Promise<AvailableClassroom[]> {
    try {
      console.log('[ResourceReservation] Getting available classrooms:', {
        date,
        start_time,
        end_time,
        min_capacity
      });

      // 1. 모든 강의실 조회
      const allClassrooms = await ClassroomService.getClassrooms({
        is_available: true,
        min_capacity: min_capacity
      });

      // 2. 각 강의실의 충돌 여부 확인
      const availableClassrooms: AvailableClassroom[] = [];

      for (const classroom of allClassrooms) {
        const conflictInfo = await this.checkClassroomConflict(
          classroom.id,
          date,
          start_time,
          end_time
        );

        if (!conflictInfo.has_conflict) {
          availableClassrooms.push({
            id: classroom.id,
            name: classroom.name,
            location: classroom.location,
            capacity: classroom.capacity,
            facilities: classroom.facilities,
            equipment: classroom.equipment,
            is_available: true
          });
        }
      }

      console.log(`[ResourceReservation] Found ${availableClassrooms.length} available classrooms`);
      return availableClassrooms;
    } catch (error: any) {
      console.error('[ResourceReservation] Error:', error);
      throw error;
    }
  }

  /**
   * 커리큘럼 항목에 강의실 할당
   * @param curriculum_item_id 커리큘럼 항목 ID
   * @param classroom_id 강의실 ID
   * @returns 성공 여부
   */
  static async assignClassroom(
    curriculum_item_id: string,
    classroom_id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[ResourceReservation] Assigning classroom:', {
        curriculum_item_id,
        classroom_id
      });

      // 1. 커리큘럼 항목 정보 조회
      const { data: curriculumItem, error: fetchError } = await supabase
        .from('curriculum_items')
        .select('date, start_time, end_time, subject')
        .eq('id', curriculum_item_id)
        .single();

      if (fetchError || !curriculumItem) {
        throw new Error('커리큘럼 항목을 찾을 수 없습니다.');
      }

      // 2. 충돌 검사
      const conflictInfo = await this.checkClassroomConflict(
        classroom_id,
        curriculumItem.date,
        curriculumItem.start_time,
        curriculumItem.end_time,
        curriculum_item_id // 자기 자신은 제외
      );

      if (conflictInfo.has_conflict) {
        return {
          success: false,
          message: conflictInfo.message || '강의실 예약 충돌이 있습니다.'
        };
      }

      // 3. 강의실 할당
      const { error: updateError } = await supabase
        .from('curriculum_items')
        .update({
          classroom_id: classroom_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', curriculum_item_id);

      if (updateError) {
        console.error('[ResourceReservation] Error assigning classroom:', updateError);
        throw updateError;
      }

      console.log('[ResourceReservation] ✅ Classroom assigned successfully');
      return {
        success: true,
        message: '강의실이 할당되었습니다.'
      };
    } catch (error: any) {
      console.error('[ResourceReservation] Error:', error);
      return {
        success: false,
        message: error.message || '강의실 할당 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 강의실 할당 해제
   * @param curriculum_item_id 커리큘럼 항목 ID
   */
  static async unassignClassroom(curriculum_item_id: string): Promise<void> {
    try {
      console.log('[ResourceReservation] Unassigning classroom:', curriculum_item_id);

      const { error } = await supabase
        .from('curriculum_items')
        .update({
          classroom_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', curriculum_item_id);

      if (error) {
        console.error('[ResourceReservation] Error unassigning classroom:', error);
        throw error;
      }

      console.log('[ResourceReservation] ✅ Classroom unassigned successfully');
    } catch (error: any) {
      console.error('[ResourceReservation] Error:', error);
      throw error;
    }
  }

  /**
   * 강의실 사용 현황 조회
   * @param classroom_id 강의실 ID
   * @param start_date 시작 날짜
   * @param end_date 종료 날짜
   * @returns 예약 목록
   */
  static async getClassroomSchedule(
    classroom_id: string,
    start_date: string,
    end_date: string
  ): Promise<ResourceReservation[]> {
    try {
      console.log('[ResourceReservation] Getting classroom schedule:', {
        classroom_id,
        start_date,
        end_date
      });

      const { data, error } = await supabase
        .from('curriculum_items_full')
        .select('*')
        .eq('classroom_id', classroom_id)
        .gte('date', start_date)
        .lte('date', end_date)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[ResourceReservation] Error fetching schedule:', error);
        throw error;
      }

      const reservations: ResourceReservation[] = (data || []).map(item => ({
        curriculum_item_id: item.id,
        classroom_id: item.classroom_id,
        date: item.date,
        start_time: item.start_time,
        end_time: item.end_time,
        subject: item.subject,
        instructor_name: item.instructor_name || undefined,
        round_name: item.round_name || undefined
      }));

      console.log(`[ResourceReservation] Found ${reservations.length} reservations`);
      return reservations;
    } catch (error: any) {
      console.error('[ResourceReservation] Error:', error);
      throw error;
    }
  }

  /**
   * 차수의 모든 커리큘럼 항목에 강의실 일괄 할당
   * @param round_id 차수 ID
   * @param default_classroom_id 기본 강의실 ID
   * @returns 할당 결과
   */
  static async bulkAssignClassroom(
    round_id: string,
    default_classroom_id: string
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }> {
    try {
      console.log('[ResourceReservation] Bulk assigning classroom:', {
        round_id,
        default_classroom_id
      });

      // 1. 차수의 모든 커리큘럼 항목 조회
      const { data: items, error: fetchError } = await supabase
        .from('curriculum_items')
        .select('id, date, start_time, end_time, subject')
        .eq('round_id', round_id)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      const total = items?.length || 0;
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // 2. 각 항목에 강의실 할당 시도
      for (const item of items || []) {
        const result = await this.assignClassroom(item.id, default_classroom_id);

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`${item.date} ${item.start_time}-${item.end_time} ${item.subject}: ${result.message}`);
        }
      }

      console.log(`[ResourceReservation] Bulk assignment complete: ${success}/${total} successful`);
      return { total, success, failed, errors };
    } catch (error: any) {
      console.error('[ResourceReservation] Error in bulk assignment:', error);
      throw error;
    }
  }
}
