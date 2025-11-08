// ========================================
// 시험 관리 시스템 타입 정의
// ========================================

// ========================================
// 1. 과정 계층 구조
// ========================================

export interface CourseTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  duration_weeks?: number;
  category?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  prerequisites?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseRound {
  id: string;
  template_id: string;
  round_number: number;
  title: string;
  instructor_id?: string;
  instructor_name: string;
  manager_id?: string;
  manager_name?: string;
  start_date: string;
  end_date: string;
  max_trainees: number;
  current_trainees: number;
  location: string;
  status: 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  created_at: string;
  updated_at: string;

  // Relations
  template?: CourseTemplate;
}

// ========================================
// 2. 문제 및 문제은행
// ========================================

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'ordering';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  category?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Relations
  template?: CourseTemplate;
  questions?: Question[];
  question_count?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  bank_id: string;
  type: QuestionType;
  question_text: string;
  question_html?: string;

  // 선택지 및 정답 (JSONB에서 파싱된 형태)
  options?: QuestionOption[];
  correct_answer?: string[] | boolean | string;

  points: number;
  explanation?: string;
  explanation_html?: string;

  difficulty: QuestionDifficulty;
  tags?: string[];
  estimated_time_seconds?: number;

  usage_count: number;
  avg_score?: number;

  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Relations
  bank?: QuestionBank;
}

// ========================================
// 3. 시험
// ========================================

export type ExamType = 'final' | 'midterm' | 'quiz' | 'daily_test' | 'practice' | 'assignment';
export type ExamStatus = 'draft' | 'published' | 'active' | 'completed' | 'archived';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  exam_type: ExamType;

  // 연결 구조 (course_rounds 기반)
  template_id?: string;
  round_id?: string;
  bank_id?: string;

  // 일정
  scheduled_at?: string;
  available_from?: string;
  available_until?: string;

  // 시험 설정
  duration_minutes: number;
  passing_score: number;
  total_points: number;

  // 응시 설정
  max_attempts: number;
  allow_review: boolean;
  show_correct_answers: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;

  status: ExamStatus;
  instructions?: string;
  proctoring_required: boolean;

  created_by?: string;
  created_at: string;
  updated_at: string;

  // Relations
  template?: CourseTemplate;
  round?: CourseRound;
  bank?: QuestionBank;
  questions?: ExamQuestion[];
  question_count?: number;

  // Stats
  total_takers?: number;
  avg_score?: number;
  pass_rate?: number;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_id: string;
  order_index: number;
  points: number;
  is_required: boolean;

  // Relations
  question?: Question;
}

// ========================================
// 4. 시험 응시
// ========================================

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'needs_grading';

export interface ExamAttempt {
  id: string;
  exam_id: string;
  trainee_id: string;
  attempt_number: number;

  started_at?: string;
  submitted_at?: string;
  time_spent_seconds?: number;

  score?: number;
  score_percentage?: number;
  passed?: boolean;
  grade?: string;

  answers?: Record<string, any>;

  status: AttemptStatus;

  graded_by?: string;
  graded_at?: string;
  feedback?: string;

  created_at: string;
  updated_at: string;

  // Relations
  exam?: Exam;
  trainee?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  responses?: QuestionResponse[];
}

export interface QuestionResponse {
  id: string;
  attempt_id: string;
  question_id: string;

  answer?: any;
  is_correct?: boolean;
  points_earned?: number;

  needs_manual_grading: boolean;
  grader_feedback?: string;

  answered_at?: string;

  // Relations
  question?: Question;
}

// ========================================
// 5. 조회용 타입 및 필터
// ========================================

export interface ExamEligibleTrainee {
  exam_id: string;
  exam_title: string;
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  department?: string;
  session_id: string;
  session_name: string;
  division_id?: string;
  division_name?: string;
  enrolled_at: string;
}

export interface ExamStatistics {
  exam_id: string;
  title: string;
  exam_type: ExamType;
  session_name?: string;
  division_name?: string;
  total_takers: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  pass_count: number;
  pass_rate: number;
}

export interface TraineeExamHistory {
  exam_id: string;
  title: string;
  exam_type: ExamType;
  session_name?: string;
  division_name?: string;
  attempt_number: number;
  score?: number;
  score_percentage?: number;
  passed?: boolean;
  submitted_at?: string;
  time_spent_minutes?: number;
}

// ========================================
// 6. 생성/수정용 DTO
// ========================================

export interface CreateCourseSessionData {
  template_id: string;
  session_code: string;
  session_name: string;
  session_number: number;
  session_year: number;
  start_date: string;
  end_date: string;
  enrollment_start?: string;
  enrollment_end?: string;
  total_capacity?: number;
  has_divisions?: boolean;
  manager_id?: string;
}

export interface CreateClassDivisionData {
  session_id: string;
  division_code: string;
  division_name: string;
  division_number?: number;
  instructor_id?: string;
  teaching_assistant_id?: string;
  max_trainees?: number;
  schedule_info?: Record<string, string>;
  classroom?: string;
  notes?: string;
}

export interface CreateQuestionData {
  bank_id: string;
  type: QuestionType;
  question_text: string;
  question_html?: string;
  options?: QuestionOption[];
  correct_answer?: string[] | boolean | string;
  points?: number;
  explanation?: string;
  explanation_html?: string;
  difficulty: QuestionDifficulty;
  tags?: string[];
  estimated_time_seconds?: number;
}

export interface CreateExamData {
  title: string;
  description?: string;
  exam_type: ExamType;

  // 대상 지정 (course_rounds 기반)
  template_id?: string;
  round_id?: string;
  status?: ExamStatus;

  bank_id?: string;

  scheduled_at?: string;
  available_from?: string;
  available_until?: string;

  duration_minutes: number;
  passing_score?: number;
  total_points?: number;

  max_attempts?: number;
  allow_review?: boolean;
  show_correct_answers?: boolean;
  randomize_questions?: boolean;
  randomize_options?: boolean;

  instructions?: string;
  proctoring_required?: boolean;
}

export interface StartExamAttemptData {
  exam_id: string;
  trainee_id: string;
}

export interface SubmitExamAnswersData {
  attempt_id: string;
  answers: Record<string, any>;
}

export interface GradeExamAttemptData {
  attempt_id: string;
  graded_by: string;
  manual_scores?: Record<string, number>; // question_id -> points_earned
  feedback?: string;
}

// ========================================
// 7. 필터 및 검색
// ========================================

export interface ExamFilters {
  exam_type?: ExamType[];
  status?: ExamStatus[];
  round_id?: string;
  template_id?: string;
  scheduled_from?: string;
  scheduled_until?: string;
}

export interface QuestionFilters {
  bank_id?: string;
  type?: QuestionType[];
  difficulty?: QuestionDifficulty[];
  tags?: string[];
}

// ========================================
// 8. 유틸리티 타입
// ========================================

export const examTypeLabels: Record<ExamType, string> = {
  final: '최종평가',
  midterm: '중간평가',
  quiz: '퀴즈',
  daily_test: '일일테스트',
  practice: '실습평가',
  assignment: '과제'
};

export const examStatusLabels: Record<ExamStatus, string> = {
  draft: '준비중',
  published: '발행됨',
  active: '진행중',
  completed: '완료',
  archived: '보관됨'
};

export const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: '객관식',
  true_false: 'O/X',
  short_answer: '단답형',
  essay: '서술형',
  matching: '짝맞추기',
  ordering: '순서배열'
};

export const difficultyLabels: Record<QuestionDifficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움'
};
