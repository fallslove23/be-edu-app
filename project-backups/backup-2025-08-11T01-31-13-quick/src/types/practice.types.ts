export interface PracticeEvaluation {
  id: string;
  course_id: string;
  title: string;
  description: string;
  evaluation_type: PracticeType;
  scenario: PracticeScenario;
  duration_minutes: number;
  max_score: number;
  evaluation_criteria: EvaluationCriteria[];
  instructions: string;
  materials: string[]; // URLs or file paths
  status: PracticeStatus;
  created_by: string;
  created_at: string;
  scheduled_start?: string;
  scheduled_end?: string;
}

export type PracticeType = 'role_play' | 'simulation' | 'presentation' | 'case_study' | 'group_project';

export type PracticeStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'archived';

export interface PracticeScenario {
  title: string;
  background: string;
  customer_profile: {
    name: string;
    age: number;
    occupation: string;
    personality_traits: string[];
    needs: string[];
    concerns: string[];
    budget_range: string;
  };
  sales_context: {
    product: string;
    competition: string[];
    market_situation: string;
    sales_goals: string[];
  };
  success_criteria: string[];
}

export interface EvaluationCriteria {
  id: string;
  category: CriteriaCategory;
  name: string;
  description: string;
  max_points: number;
  weight: number; // 0-1
  rubric: RubricLevel[];
}

export type CriteriaCategory = 
  | 'communication' 
  | 'product_knowledge' 
  | 'needs_analysis' 
  | 'presentation_skills' 
  | 'objection_handling' 
  | 'closing_techniques' 
  | 'professionalism';

export interface RubricLevel {
  level: number; // 1-5
  label: string; // '우수', '양호', '보통', '미흡', '부족'
  description: string;
  points: number;
}

export interface PracticeSession {
  id: string;
  practice_evaluation_id: string;
  trainee_id: string;
  evaluator_id: string;
  session_date: string;
  duration_minutes: number;
  scores: PracticeScore[];
  overall_score: number;
  overall_grade: string;
  feedback: {
    strengths: string[];
    improvements: string[];
    specific_notes: string;
    recommendations: string[];
  };
  video_url?: string; // 녹화 영상 URL
  status: SessionStatus;
  created_at: string;
}

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

export interface PracticeScore {
  criteria_id: string;
  points: number;
  max_points: number;
  evaluator_notes: string;
  rubric_level: number;
}

export const practiceTypeLabels: Record<PracticeType, string> = {
  role_play: '역할극',
  simulation: '시뮬레이션',
  presentation: '프레젠테이션',
  case_study: '사례 연구',
  group_project: '그룹 프로젝트'
};

export const practiceStatusLabels: Record<PracticeStatus, string> = {
  draft: '초안',
  published: '게시됨',
  in_progress: '진행중',
  completed: '완료',
  archived: '보관됨'
};

export const criteriaCategoryLabels: Record<CriteriaCategory, string> = {
  communication: '의사소통',
  product_knowledge: '제품 지식',
  needs_analysis: '니즈 분석',
  presentation_skills: '프레젠테이션',
  objection_handling: '이의제기 처리',
  closing_techniques: '클로징 기법',
  professionalism: '전문성'
};

export const sessionStatusLabels: Record<SessionStatus, string> = {
  scheduled: '예정됨',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소됨',
  rescheduled: '일정 변경'
};