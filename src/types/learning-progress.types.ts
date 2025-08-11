// 학습 진도 추적 관련 타입 정의

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';
export type AssessmentType = 'quiz' | 'assignment' | 'exam' | 'project' | 'participation';

// 학습 진도 메인 인터페이스
export interface LearningProgress {
  id: string;
  user_id: string;
  course_id: string;
  activity_id?: string;
  progress_percentage: number; // 0-100
  status: ProgressStatus;
  start_date: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  last_activity_date: string;
  total_time_spent: number; // minutes
  created_at: string;
  updated_at: string;
}

// 세부 학습 활동 기록
export interface LearningActivity {
  id: string;
  progress_id: string;
  activity_type: string; // 'video_watch', 'quiz_attempt', 'assignment_submit' 등
  activity_data: Record<string, any>; // 활동별 세부 데이터
  duration_minutes: number;
  completed: boolean;
  score?: number;
  max_score?: number;
  notes?: string;
  created_at: string;
}

// 평가 및 점수 관리
export interface Assessment {
  id: string;
  progress_id: string;
  assessment_type: AssessmentType;
  title: string;
  description?: string;
  max_score: number;
  passing_score: number;
  attempts_allowed: number;
  time_limit_minutes?: number;
  due_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 평가 응답/결과
export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  user_id: string;
  attempt_number: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_spent_minutes: number;
  answers: Record<string, any>; // 답안 데이터
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  graded_by?: string;
}

// 학습 목표 및 마일스톤
export interface LearningGoal {
  id: string;
  progress_id: string;
  title: string;
  description?: string;
  target_date: string;
  completion_criteria: Record<string, any>;
  is_completed: boolean;
  completed_date?: string;
  weight: number; // 전체 진도에서 차지하는 비중 (0-1)
  created_at: string;
  updated_at: string;
}

// 학습 통계 및 분석
export interface LearningStats {
  user_id: string;
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_time_spent: number; // minutes
  average_completion_rate: number; // percentage
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string;
  strengths: string[];
  improvement_areas: string[];
  updated_at: string;
}

// 진도 요약 정보
export interface ProgressSummary {
  progress_id: string;
  user_name: string;
  user_email: string;
  course_title: string;
  progress_percentage: number;
  status: ProgressStatus;
  time_spent: number;
  last_activity: string;
  assessments_completed: number;
  assessments_total: number;
  average_score: number;
  is_on_track: boolean;
  days_behind?: number;
  next_milestone?: string;
}

// Create/Update 인터페이스들
export interface CreateLearningProgressData {
  user_id: string;
  course_id: string;
  activity_id?: string;
  target_completion_date?: string;
}

export interface UpdateLearningProgressData {
  progress_percentage?: number;
  status?: ProgressStatus;
  target_completion_date?: string;
  actual_completion_date?: string;
  total_time_spent?: number;
}

export interface CreateLearningActivityData {
  progress_id: string;
  activity_type: string;
  activity_data: Record<string, any>;
  duration_minutes: number;
  completed: boolean;
  score?: number;
  max_score?: number;
  notes?: string;
}

export interface CreateAssessmentData {
  progress_id: string;
  assessment_type: AssessmentType;
  title: string;
  description?: string;
  max_score: number;
  passing_score: number;
  attempts_allowed: number;
  time_limit_minutes?: number;
  due_date?: string;
}

// 상태별 라벨 및 색상
export const progressStatusLabels: { [key in ProgressStatus]: string } = {
  not_started: '시작 전',
  in_progress: '진행 중',
  completed: '완료',
  overdue: '지연'
};

export const progressStatusColors: { [key in ProgressStatus]: string } = {
  not_started: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#10b981',
  overdue: '#ef4444'
};

export const assessmentTypeLabels: { [key in AssessmentType]: string } = {
  quiz: '퀴즈',
  assignment: '과제',
  exam: '시험',
  project: '프로젝트',
  participation: '참여도'
};

export const assessmentTypeColors: { [key in AssessmentType]: string } = {
  quiz: '#8b5cf6',
  assignment: '#f59e0b',
  exam: '#ef4444',
  project: '#10b981',
  participation: '#06b6d4'
};