// 시험 관련 타입 정의

export interface Exam {
  id: string;
  course_id: string;
  course_name: string;
  title: string;
  description?: string;
  exam_type: ExamType;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  max_attempts: number;
  is_randomized: boolean;
  show_results_immediately: boolean;
  scheduled_start: string;
  scheduled_end: string;
  status: ExamStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ExamType = 'multiple_choice' | 'essay' | 'mixed';
export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_type: QuestionType;
  question_text: string;
  points: number;
  order_index: number;
  options?: ExamQuestionOption[];
  correct_answer?: string;
  explanation?: string;
  created_at: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface ExamQuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  exam_title: string;
  trainee_id: string;
  trainee_name: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  time_taken_minutes?: number;
  score?: number;
  max_score: number;
  passing_score: number;
  status: AttemptStatus;
  answers: ExamAnswer[];
  feedback?: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';

export interface ExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_text: string;
  selected_options?: string[];
  points_awarded?: number;
  feedback?: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  trainee_id: string;
  trainee_name: string;
  best_score: number;
  best_attempt_id: string;
  attempts_count: number;
  last_attempt_date: string;
  passed: boolean;
  certificate_issued: boolean;
  created_at: string;
}

// 시험 통계
export interface ExamStatistics {
  totalExams: number;
  activeExams: number;
  completedExams: number;
  averageScore: number;
  passRate: number;
  totalAttempts: number;
  averageAttempts: number;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

// 시험 필터
export interface ExamFilter {
  course_id?: string;
  status?: ExamStatus;
  exam_type?: ExamType;
  date_range?: {
    start: string;
    end: string;
  };
}