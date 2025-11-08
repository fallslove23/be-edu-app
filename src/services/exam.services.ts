import { supabase } from './supabase';
import type {
  Exam,
  ExamAttempt,
  Question,
  QuestionResponse,
  ExamEligibleTrainee,
  ExamStatistics,
  CreateExamData,
  GradeExamAttemptData,
  TraineeExamHistory
} from '../types/exam.types';

/**
 * 시험 관리 서비스
 *
 * 계층 구조:
 * - Course Template → Course Rounds (차수)
 * - 유연한 시험 대상 설정 (템플릿/차수)
 */
export class ExamService {
  // ========================================
  // 시험 관리 (CRUD)
  // ========================================

  /**
   * 시험 목록 조회
   */
  static async getExams(filters?: {
    round_id?: string;
    exam_type?: string;
    status?: string;
  }): Promise<Exam[]> {
    console.log('[ExamService] getExams called with filters:', filters);

    // 임시: PostgREST 캐시 문제로 인해 조인 제거
    // round와 bank 정보는 필요 시 별도 쿼리로 가져오기
    let query = supabase
      .from('exams')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (filters?.round_id) {
      query = query.eq('round_id', filters.round_id);
    }
    if (filters?.exam_type) {
      query = query.eq('exam_type', filters.exam_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ExamService] ❌ 시험 목록 조회 실패:', error);
      console.error('[ExamService] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`시험 목록 조회 실패: ${error.message}`);
    }

    console.log('[ExamService] ✅ 시험 목록 조회 성공:', data?.length, '개');
    return data || [];
  }

  /**
   * 시험 상세 조회 (문제 포함)
   */
  static async getExamById(examId: string): Promise<Exam | null> {
    // 임시: PostgREST 캐시 문제로 인해 조인 제거
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single();

    if (error) {
      console.error('시험 상세 조회 실패:', error);
      return null;
    }

    return data;
  }

  /**
   * 시험 생성
   */
  static async createExam(data: CreateExamData): Promise<Exam> {
    const { data: exam, error } = await supabase
      .from('exams')
      .insert({
        title: data.title,
        description: data.description,
        exam_type: data.exam_type,

        // 대상 설정 (round_id 사용)
        template_id: data.template_id,
        round_id: data.round_id,

        // 시험 설정
        bank_id: data.bank_id,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        passing_score: data.passing_score || 70.0,
        total_points: data.total_points || 100.0,
        max_attempts: data.max_attempts || 1,

        // 옵션
        randomize_questions: data.randomize_questions || false,
        randomize_options: data.randomize_options || false,
        show_correct_answers: data.show_correct_answers || false,
        allow_review: data.allow_review || true,

        status: data.status || 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('시험 생성 실패:', error);
      throw new Error(`시험 생성 실패: ${error.message}`);
    }

    return exam;
  }

  /**
   * 시험 수정
   */
  static async updateExam(examId: string, data: Partial<CreateExamData>): Promise<Exam> {
    const { data: exam, error } = await supabase
      .from('exams')
      .update(data)
      .eq('id', examId)
      .select()
      .single();

    if (error) {
      console.error('시험 수정 실패:', error);
      throw new Error(`시험 수정 실패: ${error.message}`);
    }

    return exam;
  }

  /**
   * 시험 삭제
   */
  static async deleteExam(examId: string): Promise<void> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (error) {
      console.error('시험 삭제 실패:', error);
      throw new Error(`시험 삭제 실패: ${error.message}`);
    }
  }

  // ========================================
  // 응시 대상자 관리
  // ========================================

  /**
   * 시험 응시 대상자 조회 (View 사용)
   */
  static async getEligibleTrainees(examId: string): Promise<ExamEligibleTrainee[]> {
    const { data, error } = await supabase
      .from('v_exam_eligible_trainees')
      .select('*')
      .eq('exam_id', examId)
      .order('division_name')
      .order('trainee_name');

    if (error) {
      console.error('응시 대상자 조회 실패:', error);
      throw new Error(`응시 대상자 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  // ========================================
  // 시험 응시
  // ========================================

  /**
   * 시험 응시 시작
   */
  static async startExamAttempt(examId: string, traineeId: string): Promise<ExamAttempt> {
    // 1. 기존 응시 횟수 확인
    const { data: existingAttempts, error: countError } = await supabase
      .from('exam_attempts')
      .select('attempt_number')
      .eq('exam_id', examId)
      .eq('trainee_id', traineeId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (countError) {
      throw new Error(`응시 횟수 조회 실패: ${countError.message}`);
    }

    const attemptNumber = existingAttempts && existingAttempts.length > 0
      ? existingAttempts[0].attempt_number + 1
      : 1;

    // 2. 시험 정보 조회 (최대 응시 횟수 확인)
    const { data: exam } = await supabase
      .from('exams')
      .select('max_attempts')
      .eq('id', examId)
      .single();

    if (exam && attemptNumber > exam.max_attempts) {
      throw new Error(`최대 응시 횟수(${exam.max_attempts}회)를 초과했습니다.`);
    }

    // 3. 응시 기록 생성
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        trainee_id: traineeId,
        attempt_number: attemptNumber,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) {
      console.error('시험 응시 시작 실패:', error);
      throw new Error(`시험 응시 시작 실패: ${error.message}`);
    }

    return attempt;
  }

  /**
   * 답안 제출
   */
  static async submitExamAttempt(
    attemptId: string,
    answers: Record<string, any>
  ): Promise<ExamAttempt> {
    const { data: attempt, error } = await supabase
      .from('exam_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        answers: answers,
        status: 'submitted'
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      console.error('답안 제출 실패:', error);
      throw new Error(`답안 제출 실패: ${error.message}`);
    }

    return attempt;
  }

  /**
   * 개별 문제 응답 저장
   */
  static async saveQuestionResponse(
    attemptId: string,
    questionId: string,
    answer: any
  ): Promise<QuestionResponse> {
    const { data: response, error } = await supabase
      .from('question_responses')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        answer: answer,
        answered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('문제 응답 저장 실패:', error);
      throw new Error(`문제 응답 저장 실패: ${error.message}`);
    }

    return response;
  }

  // ========================================
  // 채점
  // ========================================

  /**
   * 자동 채점 (객관식/O/X)
   */
  static async autoGradeAttempt(attemptId: string): Promise<void> {
    // 1. 응시 기록 및 문제 응답 조회
    const { data: responses, error: fetchError } = await supabase
      .from('question_responses')
      .select(`
        id,
        answer,
        question:questions(
          id,
          type,
          correct_answer,
          points
        )
      `)
      .eq('attempt_id', attemptId);

    if (fetchError) {
      throw new Error(`응답 조회 실패: ${fetchError.message}`);
    }

    if (!responses || responses.length === 0) {
      throw new Error('채점할 응답이 없습니다.');
    }

    // 2. 각 문제별 채점
    for (const response of responses) {
      const question = response.question as any;

      let isCorrect: boolean | null = null;
      let pointsEarned = 0;

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        // 객관식/O/X는 자동 채점
        isCorrect = JSON.stringify(response.answer) === JSON.stringify(question.correct_answer);
        pointsEarned = isCorrect ? question.points : 0;

        await supabase
          .from('question_responses')
          .update({
            is_correct: isCorrect,
            points_earned: pointsEarned,
            needs_manual_grading: false
          })
          .eq('id', response.id);
      } else {
        // 주관식은 수동 채점 필요
        await supabase
          .from('question_responses')
          .update({
            needs_manual_grading: true
          })
          .eq('id', response.id);
      }
    }

    // 3. 총점 계산 및 합격 여부 판정
    await this.calculateAttemptScore(attemptId);
  }

  /**
   * 수동 채점
   */
  static async manualGrade(data: GradeExamAttemptData): Promise<void> {
    const { attempt_id, response_id, is_correct, points_earned, feedback } = data;

    await supabase
      .from('question_responses')
      .update({
        is_correct,
        points_earned,
        feedback,
        needs_manual_grading: false
      })
      .eq('id', response_id);

    // 총점 재계산
    await this.calculateAttemptScore(attempt_id);
  }

  /**
   * 총점 계산 및 합격 여부 판정
   */
  private static async calculateAttemptScore(attemptId: string): Promise<void> {
    // 1. 총점 계산
    const { data: responses } = await supabase
      .from('question_responses')
      .select('points_earned')
      .eq('attempt_id', attemptId);

    const totalScore = responses?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0;

    // 2. 시험 정보 조회
    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('exam:exams(passing_score, total_points)')
      .eq('id', attemptId)
      .single();

    if (!attempt) return;

    const exam = (attempt as any).exam;
    const scorePercentage = (totalScore / exam.total_points) * 100;
    const passed = scorePercentage >= exam.passing_score;

    // 3. 결과 업데이트
    await supabase
      .from('exam_attempts')
      .update({
        score: totalScore,
        score_percentage: scorePercentage,
        passed,
        status: 'graded'
      })
      .eq('id', attemptId);
  }

  // ========================================
  // 통계 및 분석
  // ========================================

  /**
   * 시험별 통계 조회 (View 사용)
   */
  static async getExamStatistics(examId: string): Promise<ExamStatistics[]> {
    const { data, error } = await supabase
      .from('v_exam_statistics')
      .select('*')
      .eq('exam_id', examId)
      .order('division_name');

    if (error) {
      console.error('통계 조회 실패:', error);
      throw new Error(`통계 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 교육생별 시험 이력 조회
   */
  static async getTraineeExamHistory(traineeId: string): Promise<TraineeExamHistory[]> {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select(`
        id,
        attempt_number,
        score,
        score_percentage,
        passed,
        started_at,
        submitted_at,
        status,
        exam:exams(
          id,
          title,
          exam_type,
          round:course_rounds(title, round_number)
        )
      `)
      .eq('trainee_id', traineeId)
      .eq('status', 'graded')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('시험 이력 조회 실패:', error);
      throw new Error(`시험 이력 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 교육생의 특정 시험 응시 가능 여부 확인
   */
  static async canTakeExam(examId: string, traineeId: string): Promise<{
    canTake: boolean;
    reason?: string;
  }> {
    // 1. 시험 정보 조회
    const { data: exam } = await supabase
      .from('exams')
      .select('status, max_attempts, scheduled_at')
      .eq('id', examId)
      .single();

    if (!exam) {
      return { canTake: false, reason: '시험을 찾을 수 없습니다.' };
    }

    if (exam.status !== 'published') {
      return { canTake: false, reason: '시험이 공개되지 않았습니다.' };
    }

    // 2. 응시 대상자 확인
    const eligibleTrainees = await this.getEligibleTrainees(examId);
    const isEligible = eligibleTrainees.some(t => t.trainee_id === traineeId);

    if (!isEligible) {
      return { canTake: false, reason: '응시 대상자가 아닙니다.' };
    }

    // 3. 응시 횟수 확인
    const { data: attempts } = await supabase
      .from('exam_attempts')
      .select('id')
      .eq('exam_id', examId)
      .eq('trainee_id', traineeId);

    if (attempts && attempts.length >= exam.max_attempts) {
      return { canTake: false, reason: `최대 응시 횟수(${exam.max_attempts}회)를 초과했습니다.` };
    }

    return { canTake: true };
  }
}

// 시험 상태 레이블
export const examStatusLabels = {
  draft: '초안',
  published: '공개',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소'
} as const;

// 시험 유형 레이블
export const examTypeLabels = {
  final: '최종평가',
  midterm: '중간평가',
  quiz: '퀴즈',
  daily_test: '일일평가',
  practice: '연습문제',
  assignment: '과제'
} as const;

export default ExamService;
