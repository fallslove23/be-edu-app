/**
 * =================================================
 * 차수 등록 서비스
 * =================================================
 * 설명: 교육생의 과정 차수 등록 관리
 * 작성일: 2025-01-20
 * =================================================
 */

import { supabase } from './supabase';
import type {
  RoundEnrollment,
  RoundEnrollmentWithTrainee,
  CreateRoundEnrollmentRequest,
  EnrollmentStatus
} from '../types/unified-course.types';

export class RoundEnrollmentService {
  /**
   * 차수의 전체 등록 목록 조회
   */
  static async getByRound(roundId: string): Promise<RoundEnrollmentWithTrainee[]> {
    try {
      console.log('[RoundEnrollmentService] Fetching enrollments for round:', roundId);

      const { data, error } = await supabase
        .from('round_enrollments')
        .select(`
          *,
          trainee:trainees (
            id,
            name,
            email,
            department,
            employee_id
          )
        `)
        .eq('round_id', roundId)
        .order('enrolled_at', { ascending: true });

      if (error) {
        console.error('[RoundEnrollmentService] Error fetching enrollments:', error);
        throw error;
      }

      // Transform data to match interface
      const enrollments = (data || []).map(item => ({
        ...item,
        trainee_name: item.trainee?.name || '',
        trainee_email: item.trainee?.email,
        trainee_department: item.trainee?.department,
        trainee_employee_id: item.trainee?.employee_id
      })) as RoundEnrollmentWithTrainee[];

      console.log(`[RoundEnrollmentService] Found ${enrollments.length} enrollments`);
      return enrollments;
    } catch (error: any) {
      console.error('[RoundEnrollmentService] Error:', error);
      throw error;
    }
  }

  /**
   * 교육생의 전체 등록 이력 조회
   */
  static async getByTrainee(traineeId: string): Promise<RoundEnrollment[]> {
    try {
      console.log('[RoundEnrollmentService] Fetching enrollments for trainee:', traineeId);

      const { data, error } = await supabase
        .from('round_enrollments')
        .select('*')
        .eq('trainee_id', traineeId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('[RoundEnrollmentService] Error fetching enrollments:', error);
        throw error;
      }

      console.log(`[RoundEnrollmentService] Found ${data?.length || 0} enrollments`);
      return data || [];
    } catch (error: any) {
      console.error('[RoundEnrollmentService] Error:', error);
      throw error;
    }
  }

  /**
   * 교육생 등록 (단일 또는 일괄)
   */
  static async enroll(request: CreateRoundEnrollmentRequest): Promise<RoundEnrollment[]> {
    try {
      console.log(`[RoundEnrollmentService] Enrolling ${request.trainee_ids.length} trainees to round:`, request.round_id);

      // 1. 중복 등록 확인
      const { data: existing } = await supabase
        .from('round_enrollments')
        .select('trainee_id')
        .eq('round_id', request.round_id)
        .in('trainee_id', request.trainee_ids);

      const existingIds = new Set(existing?.map(e => e.trainee_id) || []);
      const newTraineeIds = request.trainee_ids.filter(id => !existingIds.has(id));

      if (newTraineeIds.length === 0) {
        console.warn('[RoundEnrollmentService] All trainees already enrolled');
        return [];
      }

      // 2. 새 등록 생성
      const enrollmentsToInsert = newTraineeIds.map(traineeId => ({
        round_id: request.round_id,
        trainee_id: traineeId,
        status: 'active' as EnrollmentStatus,
        enrollment_source: request.enrollment_source || 'web',
        notes: request.notes,
        enrolled_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('round_enrollments')
        .insert(enrollmentsToInsert)
        .select();

      if (error) {
        console.error('[RoundEnrollmentService] Error enrolling trainees:', error);
        throw error;
      }

      // 3. course_rounds의 current_trainees 업데이트
      await this.updateRoundTraineeCount(request.round_id);

      console.log(`[RoundEnrollmentService] Enrolled ${data?.length || 0} trainees`);
      return data || [];
    } catch (error: any) {
      console.error('[RoundEnrollmentService] Error:', error);
      throw error;
    }
  }

  /**
   * 등록 상태 변경
   */
  static async updateStatus(
    enrollmentId: string,
    status: EnrollmentStatus,
    updates?: Partial<RoundEnrollment>
  ): Promise<RoundEnrollment> {
    try {
      console.log('[RoundEnrollmentService] Updating enrollment status:', enrollmentId, status);

      const { data, error } = await supabase
        .from('round_enrollments')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) {
        console.error('[RoundEnrollmentService] Error updating status:', error);
        throw error;
      }

      // course_rounds의 current_trainees 업데이트
      if (data) {
        await this.updateRoundTraineeCount(data.round_id);
      }

      console.log('[RoundEnrollmentService] Status updated:', data);
      return data;
    } catch (error: any) {
      console.error('[RoundEnrollmentService] Error:', error);
      throw error;
    }
  }

  /**
   * 등록 취소 (dropped 상태로 변경)
   */
  static async cancel(enrollmentId: string, reason?: string): Promise<RoundEnrollment> {
    return this.updateStatus(enrollmentId, 'dropped', {
      notes: reason
    });
  }

  /**
   * 수료 처리
   */
  static async complete(
    enrollmentId: string,
    finalScore?: number,
    certificateNumber?: string
  ): Promise<RoundEnrollment> {
    return this.updateStatus(enrollmentId, 'completed', {
      completion_date: new Date().toISOString().split('T')[0],
      final_score: finalScore,
      certificate_issued: !!certificateNumber,
      certificate_number: certificateNumber
    });
  }

  /**
   * 차수의 등록 인원 통계
   */
  static async getEnrollmentStats(roundId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    dropped: number;
    pending: number;
  }> {
    try {
      const enrollments = await this.getByRound(roundId);

      const stats = {
        total: enrollments.length,
        active: 0,
        completed: 0,
        dropped: 0,
        pending: 0
      };

      enrollments.forEach(e => {
        if (e.status === 'active') stats.active++;
        else if (e.status === 'completed') stats.completed++;
        else if (e.status === 'dropped') stats.dropped++;
        else if (e.status === 'pending') stats.pending++;
      });

      return stats;
    } catch (error: any) {
      console.error('[RoundEnrollmentService] Error getting stats:', error);
      throw error;
    }
  }

  /**
   * course_rounds의 current_trainees 업데이트 (내부 헬퍼)
   */
  private static async updateRoundTraineeCount(roundId: string): Promise<void> {
    try {
      const { data: enrollments } = await supabase
        .from('round_enrollments')
        .select('id')
        .eq('round_id', roundId)
        .eq('status', 'active');

      const count = enrollments?.length || 0;

      await supabase
        .from('course_rounds')
        .update({ current_trainees: count })
        .eq('id', roundId);

      console.log(`[RoundEnrollmentService] Updated round trainee count to ${count}`);
    } catch (error: any) {
      console.error('[RoundEnrollmentService] Error updating trainee count:', error);
      // Non-critical error, don't throw
    }
  }
}
