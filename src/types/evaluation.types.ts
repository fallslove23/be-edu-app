/**
 * 종합 평가 시스템 타입 정의
 * - 실기평가, 이론평가, 태도점수, BS 활동일지 등
 */

// ========================================
// 기본 타입
// ========================================

export type EvaluationType =
  | 'instructor_manual'  // 강사가 수동으로 입력 (실기, 태도)
  | 'exam_auto'          // 시험 자동 채점 (이론)
  | 'activity_auto'      // 활동 자동 집계 (활동일지)
  | 'peer_review'        // 동료 평가
  | 'self_assessment';   // 자가 평가

export type CalculationMethod = 'auto' | 'manual_override';

// ========================================
// 1. 평가 템플릿
// ========================================

export interface EvaluationTemplate {
  id: string;
  course_template_id: string;
  name: string;
  description?: string;

  // 수료 조건
  passing_total_score: number; // 80.0

  // 메타데이터
  is_active: boolean;
  version: number;

  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationTemplateCreate {
  course_template_id: string;
  name: string;
  description?: string;
  passing_total_score?: number;
  created_by?: string;
}

export interface EvaluationTemplateUpdate {
  name?: string;
  description?: string;
  passing_total_score?: number;
  is_active?: boolean;
}

// ========================================
// 2. 평가 구성 요소
// ========================================

/**
 * 강사 평가 설정
 */
export interface InstructorConfig {
  instructors: Array<{
    instructor_id: string;
    name: string;
    weight: number; // 20 (%)
  }>;
}

/**
 * 자동 평가 설정
 */
export interface AutoCalcConfig {
  source: 'exam_attempts' | 'activity_journals';
  calculation: 'average' | 'sum' | 'latest' | 'best';
  filters?: Record<string, any>;
}

export interface EvaluationComponent {
  id: string;
  template_id: string;

  name: string; // "실기평가", "이론평가", "태도점수"
  code: string; // "practical", "theory", "attitude"
  description?: string;

  // 가중치
  weight_percentage: number; // 50, 30, 20
  max_score: number; // 100.0

  // 평가 방식
  evaluation_type: EvaluationType;
  instructor_config?: InstructorConfig;
  auto_calc_config?: AutoCalcConfig;

  // 순서
  order_index?: number;
  is_required: boolean;

  created_at: string;
  updated_at: string;
}

export interface EvaluationComponentCreate {
  template_id: string;
  name: string;
  code: string;
  description?: string;
  weight_percentage: number;
  max_score?: number;
  evaluation_type: EvaluationType;
  instructor_config?: InstructorConfig;
  auto_calc_config?: AutoCalcConfig;
  order_index?: number;
  is_required?: boolean;
}

export interface EvaluationComponentUpdate {
  name?: string;
  description?: string;
  weight_percentage?: number;
  max_score?: number;
  evaluation_type?: EvaluationType;
  instructor_config?: InstructorConfig;
  auto_calc_config?: AutoCalcConfig;
  order_index?: number;
  is_required?: boolean;
}

// ========================================
// 3. 세부 평가 항목
// ========================================

export interface EvaluationSubItem {
  id: string;
  component_id: string;

  name: string; // "기본지식", "표현법", "논리력"
  code: string; // "basic_knowledge", "expression"
  description?: string;
  max_score: number; // 5.0

  order_index?: number;
  is_required: boolean;

  created_at: string;
  updated_at: string;
}

export interface EvaluationSubItemCreate {
  component_id: string;
  name: string;
  code: string;
  description?: string;
  max_score?: number;
  order_index?: number;
  is_required?: boolean;
}

export interface EvaluationSubItemUpdate {
  name?: string;
  description?: string;
  max_score?: number;
  order_index?: number;
  is_required?: boolean;
}

// ========================================
// 4. 강사 평가
// ========================================

/**
 * 세부 항목별 점수
 */
export interface SubItemScore {
  sub_item_id: string;
  name: string;
  score: number; // 3
  max_score: number; // 5
}

export interface InstructorEvaluation {
  id: string;

  // 과정 및 학생
  course_round_id: string;
  trainee_id: string;

  // 평가 항목
  component_id: string;

  // 평가자
  instructor_id: string;
  instructor_name: string;

  // 가중치
  weight_percentage: number; // 20

  // 점수
  sub_item_scores: SubItemScore[];
  total_score: number; // 18
  max_possible_score: number; // 25

  // 피드백
  feedback?: string;
  notes?: string;

  // 일시
  evaluated_at: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorEvaluationCreate {
  course_round_id: string;
  trainee_id: string;
  component_id: string;
  instructor_id: string;
  instructor_name: string;
  weight_percentage: number;
  sub_item_scores: SubItemScore[];
  total_score: number;
  max_possible_score: number;
  feedback?: string;
  notes?: string;
}

export interface InstructorEvaluationUpdate {
  sub_item_scores?: SubItemScore[];
  total_score?: number;
  max_possible_score?: number;
  feedback?: string;
  notes?: string;
}

// ========================================
// 5. 최종 종합 성적
// ========================================

/**
 * 구성 요소별 점수 (실기, 이론, 태도, 활동일지)
 */
export interface ComponentScore {
  component_id: string;
  name: string; // "실기평가"
  code: string; // "practical"
  weight: number; // 50 (%)
  raw_score: number; // 87.6 (100점 만점)
  weighted_score: number; // 43.8 (가중치 적용)
  breakdown: Record<string, any>; // 강사별 또는 세부 항목별 상세
}

export interface ComprehensiveGrade {
  id: string;

  course_round_id: string;
  trainee_id: string;
  template_id?: string;

  // 구성 요소별 점수
  component_scores: ComponentScore[];

  // 최종 점수
  total_score: number; // 87.6
  total_weighted_score: number; // 87.6

  // 수료 여부
  passing_score?: number; // 80.0
  is_passed?: boolean;

  // 등수
  rank?: number;
  total_trainees?: number;

  // 메타데이터
  calculated_at: string;
  calculation_method?: CalculationMethod;
  override_reason?: string;

  created_at: string;
  updated_at: string;
}

export interface ComprehensiveGradeCreate {
  course_round_id: string;
  trainee_id: string;
  template_id?: string;
  component_scores: ComponentScore[];
  total_score: number;
  total_weighted_score: number;
  passing_score?: number;
  is_passed?: boolean;
  rank?: number;
  total_trainees?: number;
  calculation_method?: CalculationMethod;
  override_reason?: string;
}

export interface ComprehensiveGradeUpdate {
  component_scores?: ComponentScore[];
  total_score?: number;
  total_weighted_score?: number;
  passing_score?: number;
  is_passed?: boolean;
  rank?: number;
  total_trainees?: number;
  calculation_method?: CalculationMethod;
  override_reason?: string;
}

// ========================================
// 6. 평가 히스토리
// ========================================

export interface EvaluationHistory {
  id: string;
  grade_id: string;

  // 변경 전/후
  old_score?: number;
  new_score?: number;
  old_passed?: boolean;
  new_passed?: boolean;

  // 변경 사유
  change_reason?: string;
  changed_by?: string;
  changed_at: string;

  created_at: string;
}

export interface EvaluationHistoryCreate {
  grade_id: string;
  old_score?: number;
  new_score?: number;
  old_passed?: boolean;
  new_passed?: boolean;
  change_reason?: string;
  changed_by?: string;
}

// ========================================
// 편의 타입 (조인된 데이터)
// ========================================

/**
 * 템플릿 + 구성 요소 + 세부 항목 (전체 트리)
 */
export interface EvaluationTemplateWithComponents extends EvaluationTemplate {
  components: (EvaluationComponent & {
    sub_items: EvaluationSubItem[];
  })[];
}

/**
 * 강사 평가 + 구성 요소 정보
 */
export interface InstructorEvaluationWithComponent extends InstructorEvaluation {
  component: EvaluationComponent;
}

/**
 * 종합 성적 + 학생 정보
 */
export interface ComprehensiveGradeWithTrainee extends ComprehensiveGrade {
  trainee: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * 평가 입력 폼 데이터
 */
export interface EvaluationFormData {
  course_round_id: string;
  trainee_id: string;
  component_id: string;
  sub_item_scores: SubItemScore[];
  feedback?: string;
}

/**
 * 평가 통계
 */
export interface EvaluationStatistics {
  course_round_id: string;
  total_trainees: number;
  evaluated_count: number;
  pending_count: number;
  passed_count: number;
  failed_count: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}
