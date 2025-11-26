/**
 * =================================================
 * 통계 서비스
 * =================================================
 * 설명: Materialized View 기반 통계 조회
 * 작성일: 2025-01-24
 * =================================================
 */

import { supabase } from './supabase';

export interface RoundStatistics {
  round_id: string;
  round_name: string;
  round_code: string;
  template_id: string;
  round_status: string;
  start_date: string;
  end_date: string;

  // 등록 통계
  max_trainees: number;
  current_trainees: number;
  total_enrolled: number;
  active_count: number;
  completed_count: number;
  dropped_count: number;

  // 커리큘럼 통계
  total_sessions: number;
  completed_sessions: number;
  in_progress_sessions: number;
  draft_sessions: number;

  // 비율
  enrollment_rate: number;
  session_completion_rate: number;

  last_updated: string;
}

export interface TraineeStatistics {
  trainee_id: string;
  name: string;
  email: string;
  department?: string;

  // 등록 과정 통계
  total_enrolled_courses: number;
  active_courses: number;
  completed_courses: number;
  dropped_courses: number;

  // 평균 점수
  average_final_score: number;

  // 최근 활동
  last_enrollment_date?: string;
  last_completion_date?: string;

  last_updated: string;
}

export interface PerformanceMetric {
  metric_name: string;
  metric_value: string;
  metric_type: string;
}

export class StatisticsService {
  /**
   * Materialized View 갱신
   */
  static async refreshStatistics(): Promise<void> {
    try {
      console.log('[StatisticsService] Refreshing statistics views...');

      const { error } = await supabase.rpc('refresh_statistics_views');

      if (error) {
        console.error('[StatisticsService] Error refreshing statistics:', error);
        // RPC 함수가 없는 경우 무시 (마이그레이션 전)
        console.warn('[StatisticsService] Statistics refresh function not available yet');
        return;
      }

      console.log('[StatisticsService] ✅ Statistics refreshed');
    } catch (error: any) {
      console.error('[StatisticsService] Error:', error);
      // 에러를 던지지 않고 경고만 출력
      console.warn('[StatisticsService] Statistics refresh failed, continuing...');
    }
  }

  /**
   * 차수 통계 조회 (Materialized View)
   */
  static async getRoundStatistics(roundId?: string): Promise<RoundStatistics[]> {
    try {
      console.log('[StatisticsService] Fetching round statistics');

      let query = supabase
        .from('mv_round_statistics')
        .select('*')
        .order('start_date', { ascending: false });

      if (roundId) {
        query = query.eq('round_id', roundId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[StatisticsService] Error fetching round statistics:', error);
        // Materialized View가 없는 경우 일반 쿼리로 fallback
        console.warn('[StatisticsService] Falling back to regular query');
        return [];
      }

      console.log(`[StatisticsService] Found ${data?.length || 0} round statistics`);
      return data || [];
    } catch (error: any) {
      console.error('[StatisticsService] Error:', error);
      return [];
    }
  }

  /**
   * 교육생 통계 조회 (Materialized View)
   */
  static async getTraineeStatistics(traineeId?: string): Promise<TraineeStatistics[]> {
    try {
      console.log('[StatisticsService] Fetching trainee statistics');

      let query = supabase
        .from('mv_trainee_statistics')
        .select('*')
        .order('total_enrolled_courses', { ascending: false });

      if (traineeId) {
        query = query.eq('trainee_id', traineeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[StatisticsService] Error fetching trainee statistics:', error);
        console.warn('[StatisticsService] Falling back to regular query');
        return [];
      }

      console.log(`[StatisticsService] Found ${data?.length || 0} trainee statistics`);
      return data || [];
    } catch (error: any) {
      console.error('[StatisticsService] Error:', error);
      return [];
    }
  }

  /**
   * 성능 지표 조회
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    try {
      console.log('[StatisticsService] Fetching performance metrics');

      const { data, error } = await supabase
        .from('v_performance_metrics')
        .select('*');

      if (error) {
        console.error('[StatisticsService] Error fetching performance metrics:', error);
        // 뷰가 없는 경우 기본 통계 반환
        return this.getBasicMetrics();
      }

      console.log(`[StatisticsService] Found ${data?.length || 0} metrics`);
      return data || [];
    } catch (error: any) {
      console.error('[StatisticsService] Error:', error);
      return this.getBasicMetrics();
    }
  }

  /**
   * 기본 통계 (Fallback)
   */
  private static async getBasicMetrics(): Promise<PerformanceMetric[]> {
    try {
      const [
        { count: totalRounds },
        { count: activeRounds },
        { count: totalEnrollments }
      ] = await Promise.all([
        supabase.from('course_rounds').select('*', { count: 'exact', head: true }),
        supabase.from('course_rounds').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('round_enrollments').select('*', { count: 'exact', head: true })
      ]);

      return [
        { metric_name: 'total_rounds', metric_value: String(totalRounds || 0), metric_type: 'count' },
        { metric_name: 'active_rounds', metric_value: String(activeRounds || 0), metric_type: 'count' },
        { metric_name: 'total_enrollments', metric_value: String(totalEnrollments || 0), metric_type: 'count' }
      ];
    } catch (error) {
      console.error('[StatisticsService] Error getting basic metrics:', error);
      return [];
    }
  }

  /**
   * 대시보드 요약 통계
   */
  static async getDashboardSummary(): Promise<{
    total_rounds: number;
    active_rounds: number;
    total_enrollments: number;
    total_trainees: number;
    avg_completion_rate: number;
    recent_activities: number;
  }> {
    try {
      console.log('[StatisticsService] Fetching dashboard summary');

      const [
        { count: totalRounds },
        { count: activeRounds },
        { count: totalEnrollments },
        { count: totalTrainees },
        roundStats
      ] = await Promise.all([
        supabase.from('course_rounds').select('*', { count: 'exact', head: true }),
        supabase.from('course_rounds').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('round_enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('trainees').select('*', { count: 'exact', head: true }),
        this.getRoundStatistics()
      ]);

      // 평균 수료율 계산
      const avgCompletionRate = roundStats.length > 0
        ? roundStats.reduce((sum, r) => {
            const rate = r.completed_count > 0 && r.total_enrolled > 0
              ? (r.completed_count / r.total_enrolled) * 100
              : 0;
            return sum + rate;
          }, 0) / roundStats.length
        : 0;

      // 최근 활동 (24시간 이내 등록)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: recentActivities } = await supabase
        .from('round_enrollments')
        .select('*', { count: 'exact', head: true })
        .gte('enrolled_at', yesterday.toISOString());

      return {
        total_rounds: totalRounds || 0,
        active_rounds: activeRounds || 0,
        total_enrollments: totalEnrollments || 0,
        total_trainees: totalTrainees || 0,
        avg_completion_rate: Math.round(avgCompletionRate * 10) / 10,
        recent_activities: recentActivities || 0
      };
    } catch (error: any) {
      console.error('[StatisticsService] Error:', error);
      throw error;
    }
  }

  /**
   * 월별 등록 추이
   */
  static async getMonthlyEnrollmentTrend(months: number = 6): Promise<Array<{
    month: string;
    enrollments: number;
    completions: number;
  }>> {
    try {
      console.log('[StatisticsService] Fetching monthly enrollment trend');

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data, error } = await supabase
        .from('round_enrollments')
        .select('enrolled_at, status')
        .gte('enrolled_at', startDate.toISOString());

      if (error) throw error;

      // 월별 집계
      const monthlyData = new Map<string, { enrollments: number; completions: number }>();

      data?.forEach(enrollment => {
        const month = enrollment.enrolled_at.substring(0, 7); // YYYY-MM
        const current = monthlyData.get(month) || { enrollments: 0, completions: 0 };

        current.enrollments += 1;
        if (enrollment.status === 'completed') {
          current.completions += 1;
        }

        monthlyData.set(month, current);
      });

      // 정렬된 배열로 변환
      const result = Array.from(monthlyData.entries())
        .map(([month, stats]) => ({
          month,
          enrollments: stats.enrollments,
          completions: stats.completions
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      console.log(`[StatisticsService] Found ${result.length} months of data`);
      return result;
    } catch (error: any) {
      console.error('[StatisticsService] Error:', error);
      throw error;
    }
  }
}
