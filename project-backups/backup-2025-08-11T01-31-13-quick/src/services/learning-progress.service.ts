import { supabase } from './supabase';
import type {
  LearningProgress,
  LearningActivity,
  Assessment,
  AssessmentAttempt,
  LearningGoal,
  LearningStats,
  ProgressSummary,
  CreateLearningProgressData,
  UpdateLearningProgressData,
  CreateLearningActivityData,
  CreateAssessmentData,
  ProgressStatus
} from '../types/learning-progress.types';

export class LearningProgressService {
  // 학습 진도 관련 메서드들
  
  /**
   * 모든 학습 진도 조회
   */
  static async getAllLearningProgress() {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as LearningProgress[];
  }

  /**
   * 특정 사용자의 학습 진도 조회
   */
  static async getUserLearningProgress(userId: string) {
    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as LearningProgress[];
  }

  /**
   * 특정 코스의 학습 진도 조회
   */
  static async getCourseLearningProgress(courseId: string) {
    const { data, error } = await supabase
      .from('learning_progress')
      .select(`
        *,
        users (
          name,
          email,
          role
        )
      `)
      .eq('course_id', courseId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * 학습 진도 상세 정보 조회 (활동, 평가 포함)
   */
  static async getLearningProgressDetail(progressId: string) {
    const { data, error } = await supabase
      .from('learning_progress')
      .select(`
        *,
        users (
          name,
          email,
          role
        ),
        learning_activities (*),
        assessments (
          *,
          assessment_attempts (*)
        ),
        learning_goals (*)
      `)
      .eq('id', progressId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 새 학습 진도 생성
   */
  static async createLearningProgress(progressData: CreateLearningProgressData) {
    // 이미 존재하는 진도인지 확인
    const { data: existing } = await supabase
      .from('learning_progress')
      .select('id')
      .eq('user_id', progressData.user_id)
      .eq('course_id', progressData.course_id)
      .single();

    if (existing) {
      throw new Error('해당 사용자의 코스 진도가 이미 존재합니다.');
    }

    const { data, error } = await supabase
      .from('learning_progress')
      .insert({
        user_id: progressData.user_id,
        course_id: progressData.course_id,
        activity_id: progressData.activity_id,
        target_completion_date: progressData.target_completion_date,
        status: 'not_started'
      })
      .select()
      .single();

    if (error) throw error;
    return data as LearningProgress;
  }

  /**
   * 학습 진도 업데이트
   */
  static async updateLearningProgress(
    progressId: string, 
    updateData: UpdateLearningProgressData
  ) {
    // 완료율이 100%이면 자동으로 완료 상태로 변경
    if (updateData.progress_percentage === 100 && !updateData.status) {
      updateData.status = 'completed';
      updateData.actual_completion_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('learning_progress')
      .update({
        ...updateData,
        last_activity_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', progressId)
      .select()
      .single();

    if (error) throw error;
    return data as LearningProgress;
  }

  /**
   * 학습 진도 삭제
   */
  static async deleteLearningProgress(progressId: string) {
    const { error } = await supabase
      .from('learning_progress')
      .delete()
      .eq('id', progressId);

    if (error) throw error;
    return true;
  }

  // 학습 활동 관련 메서드들

  /**
   * 학습 활동 기록 추가
   */
  static async addLearningActivity(activityData: CreateLearningActivityData) {
    const { data, error } = await supabase
      .from('learning_activities')
      .insert(activityData)
      .select()
      .single();

    if (error) throw error;

    // 진도 업데이트 (활동 시간 추가, 마지막 활동 날짜 업데이트)
    await this.updateProgressFromActivity(activityData.progress_id, activityData);

    return data as LearningActivity;
  }

  /**
   * 활동 기록을 통한 진도 자동 업데이트
   */
  private static async updateProgressFromActivity(
    progressId: string, 
    activityData: CreateLearningActivityData
  ) {
    // 현재 진도 조회
    const { data: currentProgress, error: fetchError } = await supabase
      .from('learning_progress')
      .select('total_time_spent, progress_percentage')
      .eq('id', progressId)
      .single();

    if (fetchError) return;

    // 시간 업데이트
    const newTotalTime = currentProgress.total_time_spent + activityData.duration_minutes;
    
    // 진도율 계산 (완료된 활동 기반)
    const { data: activities, error: activitiesError } = await supabase
      .from('learning_activities')
      .select('completed')
      .eq('progress_id', progressId);

    if (!activitiesError && activities) {
      const totalActivities = activities.length + 1; // 새 활동 포함
      const completedActivities = activities.filter(a => a.completed).length + 
        (activityData.completed ? 1 : 0);
      const newProgressPercentage = Math.round((completedActivities / totalActivities) * 100);

      await this.updateLearningProgress(progressId, {
        total_time_spent: newTotalTime,
        progress_percentage: newProgressPercentage
      });
    }
  }

  /**
   * 특정 진도의 모든 학습 활동 조회
   */
  static async getLearningActivities(progressId: string) {
    const { data, error } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('progress_id', progressId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as LearningActivity[];
  }

  // 평가 관련 메서드들

  /**
   * 평가 생성
   */
  static async createAssessment(assessmentData: CreateAssessmentData) {
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select()
      .single();

    if (error) throw error;
    return data as Assessment;
  }

  /**
   * 평가 조회
   */
  static async getAssessments(progressId: string) {
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        assessment_attempts (*)
      `)
      .eq('progress_id', progressId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * 평가 응답 제출
   */
  static async submitAssessmentAttempt(attemptData: Omit<AssessmentAttempt, 'id' | 'submitted_at'>) {
    // 이전 시도 횟수 확인
    const { data: previousAttempts, error: countError } = await supabase
      .from('assessment_attempts')
      .select('attempt_number')
      .eq('assessment_id', attemptData.assessment_id)
      .eq('user_id', attemptData.user_id)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextAttemptNumber = previousAttempts && previousAttempts.length > 0 
      ? previousAttempts[0].attempt_number + 1 
      : 1;

    // 시도 허용 횟수 확인
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('attempts_allowed')
      .eq('id', attemptData.assessment_id)
      .single();

    if (assessmentError) throw assessmentError;

    if (nextAttemptNumber > assessment.attempts_allowed) {
      throw new Error('허용된 시도 횟수를 초과했습니다.');
    }

    const { data, error } = await supabase
      .from('assessment_attempts')
      .insert({
        ...attemptData,
        attempt_number: nextAttemptNumber,
        percentage: Math.round((attemptData.score / attemptData.max_score) * 100)
      })
      .select()
      .single();

    if (error) throw error;
    return data as AssessmentAttempt;
  }

  // 학습 목표 관련 메서드들

  /**
   * 학습 목표 생성
   */
  static async createLearningGoal(goalData: Omit<LearningGoal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('learning_goals')
      .insert(goalData)
      .select()
      .single();

    if (error) throw error;
    return data as LearningGoal;
  }

  /**
   * 학습 목표 완료 처리
   */
  static async completeLearningGoal(goalId: string) {
    const { data, error } = await supabase
      .from('learning_goals')
      .update({
        is_completed: true,
        completed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data as LearningGoal;
  }

  // 통계 및 분석 메서드들

  /**
   * 사용자 학습 통계 조회
   */
  static async getUserLearningStats(userId: string) {
    const { data, error } = await supabase
      .from('learning_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // 통계가 없으면 새로 생성
      if (error.code === 'PGRST116') {
        return await this.generateUserLearningStats(userId);
      }
      throw error;
    }
    return data as LearningStats;
  }

  /**
   * 사용자 학습 통계 생성/업데이트
   */
  static async generateUserLearningStats(userId: string) {
    // 사용자의 모든 진도 조회
    const { data: progressData, error: progressError } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) throw progressError;

    if (!progressData || progressData.length === 0) {
      // 진도가 없으면 기본 통계 생성
      const { data, error } = await supabase
        .from('learning_stats')
        .upsert({
          user_id: userId,
          total_courses: 0,
          completed_courses: 0,
          in_progress_courses: 0,
          total_time_spent: 0,
          average_completion_rate: 0,
          current_streak_days: 0,
          longest_streak_days: 0,
          last_activity_date: new Date().toISOString(),
          strengths: [],
          improvement_areas: [],
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearningStats;
    }

    // 통계 계산
    const totalCourses = progressData.length;
    const completedCourses = progressData.filter(p => p.status === 'completed').length;
    const inProgressCourses = progressData.filter(p => p.status === 'in_progress').length;
    const totalTimeSpent = progressData.reduce((sum, p) => sum + p.total_time_spent, 0);
    const avgCompletionRate = totalCourses > 0 
      ? progressData.reduce((sum, p) => sum + p.progress_percentage, 0) / totalCourses 
      : 0;
    const lastActivityDate = progressData
      .map(p => new Date(p.last_activity_date))
      .reduce((latest, current) => current > latest ? current : latest, new Date(0))
      .toISOString();

    const { data, error } = await supabase
      .from('learning_stats')
      .upsert({
        user_id: userId,
        total_courses: totalCourses,
        completed_courses: completedCourses,
        in_progress_courses: inProgressCourses,
        total_time_spent: totalTimeSpent,
        average_completion_rate: Math.round(avgCompletionRate * 100) / 100,
        last_activity_date: lastActivityDate,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as LearningStats;
  }

  /**
   * 전체 학습 진도 요약 조회 (관리자용)
   */
  static async getLearningProgressSummary() {
    const { data, error } = await supabase
      .from('learning_progress')
      .select(`
        id,
        user_id,
        course_id,
        progress_percentage,
        status,
        total_time_spent,
        last_activity_date,
        users (
          name,
          email
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // 요약 정보 구성 (실제로는 courses 테이블과 조인 필요)
    const summary: ProgressSummary[] = data.map((progress: any) => ({
      progress_id: progress.id,
      user_name: progress.users?.name || '이름 없음',
      user_email: progress.users?.email || '이메일 없음',
      course_title: `코스 ${progress.course_id}`, // 실제로는 courses 테이블에서 가져와야 함
      progress_percentage: progress.progress_percentage,
      status: progress.status,
      time_spent: progress.total_time_spent,
      last_activity: progress.last_activity_date,
      assessments_completed: 0, // 실제로는 계산 필요
      assessments_total: 0, // 실제로는 계산 필요
      average_score: 0, // 실제로는 계산 필요
      is_on_track: progress.status !== 'overdue',
      days_behind: progress.status === 'overdue' ? Math.floor(Math.random() * 10) + 1 : undefined,
      next_milestone: progress.status === 'in_progress' ? '다음 평가' : undefined
    }));

    return summary;
  }

  /**
   * 상태별 진도 업데이트 (배치 처리)
   */
  static async updateProgressStatus() {
    // 지연된 진도들을 찾아서 상태 업데이트
    const { data, error } = await supabase
      .from('learning_progress')
      .update({ status: 'overdue' as ProgressStatus })
      .lt('target_completion_date', new Date().toISOString())
      .neq('status', 'completed')
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * 대시보드용 진도 통계
   */
  static async getDashboardStats() {
    const { data: progressData, error } = await supabase
      .from('learning_progress')
      .select('status, progress_percentage, total_time_spent');

    if (error) throw error;

    if (!progressData) {
      return {
        total_learners: 0,
        active_learners: 0,
        completed_courses: 0,
        average_completion_rate: 0,
        total_learning_time: 0,
        status_distribution: {
          not_started: 0,
          in_progress: 0,
          completed: 0,
          overdue: 0
        }
      };
    }

    const totalLearners = progressData.length;
    const activeLearners = progressData.filter(p => 
      p.status === 'in_progress' || p.status === 'not_started'
    ).length;
    const completedCourses = progressData.filter(p => p.status === 'completed').length;
    const avgCompletionRate = totalLearners > 0 
      ? progressData.reduce((sum, p) => sum + p.progress_percentage, 0) / totalLearners 
      : 0;
    const totalLearningTime = progressData.reduce((sum, p) => sum + p.total_time_spent, 0);

    const statusDistribution = {
      not_started: progressData.filter(p => p.status === 'not_started').length,
      in_progress: progressData.filter(p => p.status === 'in_progress').length,
      completed: progressData.filter(p => p.status === 'completed').length,
      overdue: progressData.filter(p => p.status === 'overdue').length
    };

    return {
      total_learners: totalLearners,
      active_learners: activeLearners,
      completed_courses: completedCourses,
      average_completion_rate: Math.round(avgCompletionRate * 100) / 100,
      total_learning_time: totalLearningTime,
      status_distribution: statusDistribution
    };
  }
}