/**
 * =================================================
 * 수료 조건 검증 서비스
 * =================================================
 * 설명: 출석률, 평가 점수 등을 기반으로 수료 가능 여부 판정
 * 작성일: 2025-01-24
 * =================================================
 */

import { supabase } from './supabase';
import { AttendanceService } from './attendance.service';

export interface CompletionRequirements {
  min_attendance_rate: number;     // 최소 출석률 (%)
  min_final_score?: number;         // 최소 최종 점수
  required_assignments?: number;    // 필수 과제 수
  allow_late_as_present?: boolean;  // 지각을 출석으로 인정할지
}

export interface CompletionStatus {
  can_complete: boolean;
  attendance_rate: number;
  attended_sessions: number;
  total_sessions: number;
  final_score?: number;
  reasons: string[]; // 수료 불가 사유
}

export class CompletionCriteriaService {
  // 기본 수료 조건
  static DEFAULT_REQUIREMENTS: CompletionRequirements = {
    min_attendance_rate: 80, // 80% 이상 출석
    allow_late_as_present: true // 지각을 출석으로 인정
  };

  /**
   * 교육생의 수료 가능 여부 확인
   */
  static async checkCompletionEligibility(
    traineeId: string,
    roundId: string,
    requirements: CompletionRequirements = this.DEFAULT_REQUIREMENTS
  ): Promise<CompletionStatus> {
    try {
      console.log(`[CompletionCriteria] Checking eligibility for trainee ${traineeId} in round ${roundId}`);

      // 1. 출석 현황 조회
      const attendanceSummary = await AttendanceService.getTraineeAttendanceSummary(roundId, traineeId);

      if (!attendanceSummary || attendanceSummary.length === 0) {
        return {
          can_complete: false,
          attendance_rate: 0,
          attended_sessions: 0,
          total_sessions: 0,
          reasons: ['출석 데이터가 없습니다.']
        };
      }

      const summary = attendanceSummary[0];
      const reasons: string[] = [];

      // 2. 출석률 확인
      const attendanceRate = summary.attendance_rate;
      if (attendanceRate < requirements.min_attendance_rate) {
        reasons.push(
          `출석률 ${attendanceRate}% (최소 ${requirements.min_attendance_rate}% 필요)`
        );
      }

      // 3. 최종 점수 확인 (있는 경우)
      let finalScore: number | undefined;
      if (requirements.min_final_score !== undefined) {
        const { data: enrollment } = await supabase
          .from('round_enrollments')
          .select('final_score')
          .eq('trainee_id', traineeId)
          .eq('round_id', roundId)
          .single();

        finalScore = enrollment?.final_score;

        if (finalScore !== undefined && finalScore < requirements.min_final_score) {
          reasons.push(
            `최종 점수 ${finalScore}점 (최소 ${requirements.min_final_score}점 필요)`
          );
        } else if (finalScore === undefined && requirements.min_final_score) {
          reasons.push('최종 점수가 입력되지 않았습니다.');
        }
      }

      // 4. 필수 과제 확인 (구현 예정)
      // TODO: 과제 제출 테이블이 생기면 구현

      const canComplete = reasons.length === 0;

      return {
        can_complete: canComplete,
        attendance_rate: attendanceRate,
        attended_sessions: summary.present_count + (requirements.allow_late_as_present ? summary.late_count : 0),
        total_sessions: summary.total_sessions,
        final_score: finalScore,
        reasons
      };
    } catch (error: any) {
      console.error('[CompletionCriteria] Error:', error);
      throw error;
    }
  }

  /**
   * 차수 전체 교육생의 수료 가능 여부 일괄 확인
   */
  static async checkBatchCompletionEligibility(
    roundId: string,
    requirements: CompletionRequirements = this.DEFAULT_REQUIREMENTS
  ): Promise<Map<string, CompletionStatus>> {
    try {
      console.log(`[CompletionCriteria] Checking batch eligibility for round ${roundId}`);

      // 1. 차수의 모든 등록자 조회
      const { data: enrollments, error } = await supabase
        .from('round_enrollments')
        .select('trainee_id, final_score')
        .eq('round_id', roundId)
        .eq('status', 'active');

      if (error) throw error;

      // 2. 각 교육생의 수료 가능 여부 확인
      const results = new Map<string, CompletionStatus>();

      for (const enrollment of enrollments || []) {
        const status = await this.checkCompletionEligibility(
          enrollment.trainee_id,
          roundId,
          requirements
        );
        results.set(enrollment.trainee_id, status);
      }

      console.log(`[CompletionCriteria] Checked ${results.size} trainees`);
      return results;
    } catch (error: any) {
      console.error('[CompletionCriteria] Error:', error);
      throw error;
    }
  }

  /**
   * 차수 수료 조건 설정/조회
   * (추후 course_rounds 테이블에 completion_requirements 컬럼 추가 시 사용)
   */
  static async setRoundRequirements(
    roundId: string,
    requirements: CompletionRequirements
  ): Promise<void> {
    // TODO: course_rounds 테이블에 completion_requirements JSONB 컬럼 추가 후 구현
    console.log(`[CompletionCriteria] Setting requirements for round ${roundId}:`, requirements);
    // 현재는 메타데이터나 별도 테이블에 저장 필요
  }

  /**
   * 출석률 계산 (course_rounds 통계용)
   */
  static async calculateRoundAttendanceRate(roundId: string): Promise<number> {
    try {
      // 1. 차수의 출석 요약 조회
      const summary = await AttendanceService.getTraineeAttendanceSummary(roundId);

      if (!summary || summary.length === 0) {
        return 0;
      }

      // 2. 전체 교육생의 평균 출석률 계산
      const totalRate = summary.reduce((sum, s) => sum + s.attendance_rate, 0);
      const avgRate = Math.round(totalRate / summary.length);

      return avgRate;
    } catch (error: any) {
      console.error('[CompletionCriteria] Error calculating attendance rate:', error);
      return 0;
    }
  }

  /**
   * 수료 처리 (출석률 및 조건 검증 후)
   */
  static async completeTrainee(
    traineeId: string,
    roundId: string,
    finalScore?: number,
    certificateNumber?: string,
    requirements: CompletionRequirements = this.DEFAULT_REQUIREMENTS
  ): Promise<{ success: boolean; status: CompletionStatus }> {
    try {
      // 1. 수료 가능 여부 확인
      const status = await this.checkCompletionEligibility(traineeId, roundId, requirements);

      if (!status.can_complete) {
        return {
          success: false,
          status
        };
      }

      // 2. 수료 처리
      const { error } = await supabase
        .from('round_enrollments')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString().split('T')[0],
          final_score: finalScore,
          certificate_issued: !!certificateNumber,
          certificate_number: certificateNumber,
          updated_at: new Date().toISOString()
        })
        .eq('trainee_id', traineeId)
        .eq('round_id', roundId);

      if (error) throw error;

      console.log(`[CompletionCriteria] Trainee ${traineeId} completed successfully`);

      return {
        success: true,
        status
      };
    } catch (error: any) {
      console.error('[CompletionCriteria] Error completing trainee:', error);
      throw error;
    }
  }

  /**
   * 일괄 수료 처리 (조건 충족자만)
   */
  static async batchCompleteTrainees(
    roundId: string,
    requirements: CompletionRequirements = this.DEFAULT_REQUIREMENTS
  ): Promise<{
    completed: string[];
    failed: { traineeId: string; reasons: string[] }[];
  }> {
    try {
      console.log(`[CompletionCriteria] Batch completing trainees for round ${roundId}`);

      const eligibilityMap = await this.checkBatchCompletionEligibility(roundId, requirements);

      const completed: string[] = [];
      const failed: { traineeId: string; reasons: string[] }[] = [];

      for (const [traineeId, status] of eligibilityMap.entries()) {
        if (status.can_complete) {
          await this.completeTrainee(traineeId, roundId, status.final_score);
          completed.push(traineeId);
        } else {
          failed.push({ traineeId, reasons: status.reasons });
        }
      }

      console.log(`[CompletionCriteria] Completed: ${completed.length}, Failed: ${failed.length}`);

      return { completed, failed };
    } catch (error: any) {
      console.error('[CompletionCriteria] Error in batch completion:', error);
      throw error;
    }
  }
}
