import { supabase } from './supabase';
import type { 
  Exam, 
  ExamQuestion, 
  ExamAttempt, 
  ExamResult, 
  ExamStatistics,
  ExamFilter,
  ExamStatus,
  ExamType,
  AttemptStatus
} from '../types/exam.types';

export class ExamService {
  // 시험 목록 조회
  static async getExams(filter: ExamFilter = {}): Promise<Exam[]> {
    try {
      console.log('[ExamService] getExams called with filter:', filter);

      let query = supabase
        .from('exams')
        .select(`
          *,
          course:course_id(name)
        `)
        .order('created_at', { ascending: false });

      if (filter.course_id) {
        query = query.eq('course_id', filter.course_id);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.exam_type) {
        query = query.eq('exam_type', filter.exam_type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[ExamService] Supabase error:', error);
        return this.getMockExams(filter);
      }

      if (!data || data.length === 0) {
        console.warn('[ExamService] No exams found, using mock data');
        return this.getMockExams(filter);
      }

      return data.map(exam => ({
        id: exam.id,
        course_id: exam.course_id,
        course_name: exam.course?.name || '과정명 없음',
        title: exam.title,
        description: exam.description,
        exam_type: exam.exam_type,
        duration_minutes: exam.duration_minutes,
        total_questions: exam.total_questions,
        passing_score: exam.passing_score,
        max_attempts: exam.max_attempts,
        is_randomized: exam.is_randomized,
        show_results_immediately: exam.show_results_immediately,
        scheduled_start: exam.scheduled_start,
        scheduled_end: exam.scheduled_end,
        status: exam.status,
        created_by: exam.created_by,
        created_at: exam.created_at,
        updated_at: exam.updated_at
      }));
    } catch (error) {
      console.error('[ExamService] Failed to fetch exams:', error);
      return this.getMockExams(filter);
    }
  }

  // 시험 상세 조회
  static async getExam(examId: string): Promise<Exam | null> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          course:course_id(name)
        `)
        .eq('id', examId)
        .single();

      if (error || !data) {
        console.error('Failed to fetch exam:', error);
        return null;
      }

      return {
        id: data.id,
        course_id: data.course_id,
        course_name: data.course?.name || '과정명 없음',
        title: data.title,
        description: data.description,
        exam_type: data.exam_type,
        duration_minutes: data.duration_minutes,
        total_questions: data.total_questions,
        passing_score: data.passing_score,
        max_attempts: data.max_attempts,
        is_randomized: data.is_randomized,
        show_results_immediately: data.show_results_immediately,
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end,
        status: data.status,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Failed to fetch exam:', error);
      return null;
    }
  }

  // 시험 문제 조회
  static async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('exam_questions')
        .select(`
          *,
          options:exam_question_options(*)
        `)
        .eq('exam_id', examId)
        .order('order_index');

      if (error) {
        console.error('Failed to fetch exam questions:', error);
        return [];
      }

      return data.map(question => ({
        id: question.id,
        exam_id: question.exam_id,
        question_type: question.question_type,
        question_text: question.question_text,
        points: question.points,
        order_index: question.order_index,
        options: question.options || [],
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        created_at: question.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch exam questions:', error);
      return [];
    }
  }

  // 시험 통계 조회
  static async getExamStatistics(examId?: string): Promise<ExamStatistics> {
    try {
      // 임시 목업 데이터
      const mockStats: ExamStatistics = {
        totalExams: 8,
        activeExams: 3,
        completedExams: 5,
        averageScore: 78.5,
        passRate: 82.3,
        totalAttempts: 156,
        averageAttempts: 1.8,
        scoreDistribution: [
          { range: '90-100', count: 25, percentage: 16.0 },
          { range: '80-89', count: 42, percentage: 26.9 },
          { range: '70-79', count: 38, percentage: 24.4 },
          { range: '60-69', count: 28, percentage: 17.9 },
          { range: '0-59', count: 23, percentage: 14.7 }
        ]
      };

      return mockStats;
    } catch (error) {
      console.error('Failed to fetch exam statistics:', error);
      throw error;
    }
  }

  // 목업 데이터 제공
  private static getMockExams(filter: ExamFilter = {}): Exam[] {
    console.log('[ExamService] getMockExams called with filter:', filter);

    const mockExams: Exam[] = [
      {
        id: '1',
        course_id: '1',
        course_name: 'BS 영업 기초과정',
        title: '영업 기초 이론 평가',
        description: '영업의 기본 개념과 프로세스에 대한 이해도를 평가하는 시험입니다.',
        exam_type: 'multiple_choice',
        duration_minutes: 60,
        total_questions: 30,
        passing_score: 70,
        max_attempts: 3,
        is_randomized: true,
        show_results_immediately: false,
        scheduled_start: '2024-08-20T09:00:00Z',
        scheduled_end: '2024-08-20T18:00:00Z',
        status: 'active',
        created_by: 'instructor1',
        created_at: '2024-08-15T10:00:00Z',
        updated_at: '2024-08-15T10:00:00Z'
      },
      {
        id: '2',
        course_id: '2',
        course_name: 'BS 고급 영업 전략',
        title: '고급 영업 전략 종합 평가',
        description: '고급 영업 전략과 실무 적용에 대한 종합적인 평가입니다.',
        exam_type: 'mixed',
        duration_minutes: 90,
        total_questions: 25,
        passing_score: 75,
        max_attempts: 2,
        is_randomized: true,
        show_results_immediately: true,
        scheduled_start: '2024-09-05T10:00:00Z',
        scheduled_end: '2024-09-05T17:00:00Z',
        status: 'scheduled',
        created_by: 'instructor2',
        created_at: '2024-08-20T14:30:00Z',
        updated_at: '2024-08-20T14:30:00Z'
      },
      {
        id: '3',
        course_id: '3',
        course_name: 'BS 고객 관리 시스템',
        title: 'CRM 활용 능력 평가',
        description: 'CRM 시스템 활용법과 고객 관리 전략에 대한 실무 평가입니다.',
        exam_type: 'multiple_choice',
        duration_minutes: 45,
        total_questions: 20,
        passing_score: 80,
        max_attempts: 3,
        is_randomized: false,
        show_results_immediately: true,
        scheduled_start: '2024-08-25T13:00:00Z',
        scheduled_end: '2024-08-25T16:00:00Z',
        status: 'completed',
        created_by: 'instructor3',
        created_at: '2024-08-18T11:15:00Z',
        updated_at: '2024-08-25T16:30:00Z'
      }
    ];

    // 필터 적용
    let filteredExams = mockExams;
    if (filter.course_id) {
      filteredExams = filteredExams.filter(exam => exam.course_id === filter.course_id);
    }
    if (filter.status) {
      filteredExams = filteredExams.filter(exam => exam.status === filter.status);
    }
    if (filter.exam_type) {
      filteredExams = filteredExams.filter(exam => exam.exam_type === filter.exam_type);
    }

    return filteredExams;
  }
}

// 시험 상태 레이블
export const examStatusLabels: Record<ExamStatus, string> = {
  draft: '초안',
  scheduled: '예정',
  active: '진행중',
  completed: '완료',
  cancelled: '취소'
};

// 시험 유형 레이블
export const examTypeLabels: Record<ExamType, string> = {
  multiple_choice: '객관식',
  essay: '주관식',
  mixed: '혼합형'
};