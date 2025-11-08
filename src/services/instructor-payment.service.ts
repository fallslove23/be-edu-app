/**
 * 강사 강의 시간 집계 및 강사료 계산 서비스
 *
 * 기능:
 * - 강사별 강의 시간 집계 (이론/실기 구분)
 * - 강사료 자동 계산 (주강사 10,000원/시간, 보조강사 5,000원/시간)
 * - 강사료 확정 및 지급 이력 관리
 */

import { supabase } from './supabase';

// 타입 정의
export interface InstructorTeachingSummary {
  id: string;
  instructor_id: string;
  course_round_id: string;
  instructor_type: 'primary' | 'assistant';

  total_lecture_hours: number;
  total_practice_hours: number;
  total_hours: number;
  session_count: number;

  hourly_rate: number;
  total_payment: number;

  is_finalized: boolean;
  finalized_at?: string;
  finalized_by?: string;

  created_at: string;
  updated_at: string;
}

export interface InstructorPaymentHistory {
  id: string;
  instructor_id: string;
  course_round_id: string;
  summary_id?: string;

  payment_amount: number;
  payment_date: string;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'cancelled';

  lecture_hours?: number;
  practice_hours?: number;
  total_hours?: number;
  hourly_rate?: number;

  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorHoursCalculation {
  lecture_hours: number;
  practice_hours: number;
  total_hours: number;
  session_count: number;
}

export interface CreatePaymentRecordInput {
  instructor_id: string;
  course_round_id: string;
  summary_id?: string;
  payment_amount: number;
  payment_date: string;
  payment_method?: string;
  payment_status?: 'pending' | 'completed' | 'cancelled';
  lecture_hours?: number;
  practice_hours?: number;
  total_hours?: number;
  hourly_rate?: number;
  notes?: string;
  created_by?: string;
}

class InstructorPaymentService {
  /**
   * 강사의 강의 시간 계산
   * @param courseRoundId 과정 ID
   * @param instructorId 강사 ID
   * @param instructorType 강사 유형 ('primary' 또는 'assistant')
   */
  async calculateInstructorHours(
    courseRoundId: string,
    instructorId: string,
    instructorType: 'primary' | 'assistant'
  ): Promise<InstructorHoursCalculation> {
    try {
      const { data, error } = await supabase.rpc('calculate_instructor_hours', {
        p_course_round_id: courseRoundId,
        p_instructor_id: instructorId,
        p_instructor_type: instructorType
      });

      if (error) throw error;

      return {
        lecture_hours: parseFloat(data[0]?.lecture_hours || '0'),
        practice_hours: parseFloat(data[0]?.practice_hours || '0'),
        total_hours: parseFloat(data[0]?.total_hours || '0'),
        session_count: parseInt(data[0]?.session_count || '0', 10)
      };
    } catch (error) {
      console.error('강의 시간 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 강사료 계산
   * @param totalHours 총 강의 시간
   * @param instructorType 강사 유형
   */
  async calculatePayment(
    totalHours: number,
    instructorType: 'primary' | 'assistant'
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_instructor_payment', {
        p_total_hours: totalHours,
        p_instructor_type: instructorType
      });

      if (error) throw error;

      return parseFloat(data || '0');
    } catch (error) {
      console.error('강사료 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 과정의 모든 강사 집계 업데이트
   * @param courseRoundId 과정 ID
   */
  async updateInstructorSummaries(courseRoundId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('update_instructor_summaries', {
        p_course_round_id: courseRoundId
      });

      if (error) throw error;

      return parseInt(data || '0', 10);
    } catch (error) {
      console.error('강사 집계 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 강사 집계 조회 (특정 강사)
   * @param courseRoundId 과정 ID
   * @param instructorId 강사 ID (선택)
   */
  async getInstructorSummaries(
    courseRoundId: string,
    instructorId?: string
  ): Promise<InstructorTeachingSummary[]> {
    try {
      let query = supabase
        .from('instructor_teaching_summary')
        .select('*')
        .eq('course_round_id', courseRoundId);

      if (instructorId) {
        query = query.eq('instructor_id', instructorId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data as InstructorTeachingSummary[];
    } catch (error) {
      console.error('강사 집계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 강사 집계 단건 조회
   * @param summaryId 집계 ID
   */
  async getInstructorSummary(summaryId: string): Promise<InstructorTeachingSummary | null> {
    try {
      const { data, error } = await supabase
        .from('instructor_teaching_summary')
        .select('*')
        .eq('id', summaryId)
        .single();

      if (error) throw error;

      return data as InstructorTeachingSummary;
    } catch (error) {
      console.error('강사 집계 조회 실패:', error);
      return null;
    }
  }

  /**
   * 강사료 확정
   * @param summaryId 집계 ID
   * @param userId 확정한 관리자 ID
   */
  async finalizeSummary(summaryId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('instructor_teaching_summary')
        .update({
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          finalized_by: userId
        })
        .eq('id', summaryId);

      if (error) throw error;
    } catch (error) {
      console.error('강사료 확정 실패:', error);
      throw error;
    }
  }

  /**
   * 강사료 확정 취소
   * @param summaryId 집계 ID
   */
  async unfinalizeSummary(summaryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('instructor_teaching_summary')
        .update({
          is_finalized: false,
          finalized_at: null,
          finalized_by: null
        })
        .eq('id', summaryId);

      if (error) throw error;
    } catch (error) {
      console.error('강사료 확정 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 강사료 지급 이력 생성
   * @param input 지급 이력 데이터
   */
  async createPaymentRecord(input: CreatePaymentRecordInput): Promise<InstructorPaymentHistory> {
    try {
      const { data, error } = await supabase
        .from('instructor_payment_history')
        .insert([{
          instructor_id: input.instructor_id,
          course_round_id: input.course_round_id,
          summary_id: input.summary_id,
          payment_amount: input.payment_amount,
          payment_date: input.payment_date,
          payment_method: input.payment_method,
          payment_status: input.payment_status || 'pending',
          lecture_hours: input.lecture_hours,
          practice_hours: input.practice_hours,
          total_hours: input.total_hours,
          hourly_rate: input.hourly_rate,
          notes: input.notes,
          created_by: input.created_by
        }])
        .select()
        .single();

      if (error) throw error;

      return data as InstructorPaymentHistory;
    } catch (error) {
      console.error('지급 이력 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 강사료 지급 이력 조회
   * @param instructorId 강사 ID (선택)
   * @param courseRoundId 과정 ID (선택)
   */
  async getPaymentHistory(
    instructorId?: string,
    courseRoundId?: string
  ): Promise<InstructorPaymentHistory[]> {
    try {
      let query = supabase
        .from('instructor_payment_history')
        .select('*');

      if (instructorId) {
        query = query.eq('instructor_id', instructorId);
      }

      if (courseRoundId) {
        query = query.eq('course_round_id', courseRoundId);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) throw error;

      return data as InstructorPaymentHistory[];
    } catch (error) {
      console.error('지급 이력 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 지급 이력 상태 업데이트
   * @param paymentId 지급 이력 ID
   * @param status 새로운 상태
   */
  async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('instructor_payment_history')
        .update({ payment_status: status })
        .eq('id', paymentId);

      if (error) throw error;
    } catch (error) {
      console.error('지급 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 강사별 총 지급액 조회
   * @param instructorId 강사 ID
   * @param startDate 시작일 (선택)
   * @param endDate 종료일 (선택)
   */
  async getInstructorTotalPayment(
    instructorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('instructor_payment_history')
        .select('payment_amount')
        .eq('instructor_id', instructorId)
        .eq('payment_status', 'completed');

      if (startDate) {
        query = query.gte('payment_date', startDate);
      }

      if (endDate) {
        query = query.lte('payment_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.reduce((sum, record) => sum + parseFloat(record.payment_amount || '0'), 0);
    } catch (error) {
      console.error('총 지급액 조회 실패:', error);
      return 0;
    }
  }

  /**
   * 과정별 미확정 강사 집계 조회
   * @param courseRoundId 과정 ID
   */
  async getUnfinalizedSummaries(courseRoundId: string): Promise<InstructorTeachingSummary[]> {
    try {
      const { data, error } = await supabase
        .from('instructor_teaching_summary')
        .select('*')
        .eq('course_round_id', courseRoundId)
        .eq('is_finalized', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as InstructorTeachingSummary[];
    } catch (error) {
      console.error('미확정 집계 조회 실패:', error);
      throw error;
    }
  }
}

export const instructorPaymentService = new InstructorPaymentService();
