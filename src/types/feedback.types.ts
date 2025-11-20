/**
 * 만족도 평가 시스템 타입 정의
 * 외부 평가 앱(sseducationfeedback.info)과 연동
 */

// ========================================
// 기본 타입
// ========================================

export type FeedbackCategory = 'course' | 'instructor' | 'operation' | 'overall';

// ========================================
// 1. 과정 만족도 평가
// ========================================

export interface CourseSatisfaction {
  id: string;
  course_round_id: string;
  trainee_id: string;

  // 과정 정보
  course_name: string;
  course_period: string;

  // 평가 항목 (1-5점)
  content_quality: number;           // 교육 내용의 질
  difficulty_level: number;          // 난이도 적절성
  practical_applicability: number;   // 실무 적용 가능성
  materials_quality: number;         // 교재/자료의 질
  facility_satisfaction: number;     // 시설 만족도

  // 종합 만족도
  overall_satisfaction: number;      // 전체 만족도 (1-5점)

  // 주관식 피드백
  strengths?: string;                // 장점
  improvements?: string;             // 개선사항
  suggestions?: string;              // 건의사항

  // 메타데이터
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface CourseSatisfactionCreate {
  course_round_id: string;
  trainee_id: string;
  course_name: string;
  course_period: string;
  content_quality: number;
  difficulty_level: number;
  practical_applicability: number;
  materials_quality: number;
  facility_satisfaction: number;
  overall_satisfaction: number;
  strengths?: string;
  improvements?: string;
  suggestions?: string;
}

// ========================================
// 2. 강사 만족도 평가
// ========================================

export interface InstructorSatisfaction {
  id: string;
  course_round_id: string;
  trainee_id: string;
  instructor_id: string;

  // 강사 정보
  instructor_name: string;
  subject_name: string;

  // 평가 항목 (1-5점)
  teaching_skill: number;            // 강의 능력
  communication: number;             // 의사소통
  preparation: number;               // 수업 준비도
  response_to_questions: number;     // 질문 대응력
  enthusiasm: number;                // 열정

  // 종합 만족도
  overall_satisfaction: number;      // 전체 만족도 (1-5점)

  // 주관식 피드백
  strengths?: string;                // 장점
  improvements?: string;             // 개선사항

  // 메타데이터
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorSatisfactionCreate {
  course_round_id: string;
  trainee_id: string;
  instructor_id: string;
  instructor_name: string;
  subject_name: string;
  teaching_skill: number;
  communication: number;
  preparation: number;
  response_to_questions: number;
  enthusiasm: number;
  overall_satisfaction: number;
  strengths?: string;
  improvements?: string;
}

// ========================================
// 3. 운영 만족도 평가
// ========================================

export interface OperationSatisfaction {
  id: string;
  course_round_id: string;
  trainee_id: string;

  // 평가 항목 (1-5점)
  registration_process: number;      // 등록 절차
  schedule_management: number;       // 일정 관리
  communication: number;             // 소통 및 공지
  administrative_support: number;    // 행정 지원
  facility_management: number;       // 시설 관리

  // 종합 만족도
  overall_satisfaction: number;      // 전체 만족도 (1-5점)

  // 주관식 피드백
  strengths?: string;                // 장점
  improvements?: string;             // 개선사항

  // 메타데이터
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface OperationSatisfactionCreate {
  course_round_id: string;
  trainee_id: string;
  registration_process: number;
  schedule_management: number;
  communication: number;
  administrative_support: number;
  facility_management: number;
  overall_satisfaction: number;
  strengths?: string;
  improvements?: string;
}

// ========================================
// 4. 종합 만족도 통계
// ========================================

export interface FeedbackStatistics {
  course_round_id: string;

  // 응답 통계
  total_trainees: number;
  response_count: number;
  response_rate: number;             // 응답률 (%)

  // 과정 만족도 평균
  course_satisfaction: {
    content_quality: number;
    difficulty_level: number;
    practical_applicability: number;
    materials_quality: number;
    facility_satisfaction: number;
    overall_satisfaction: number;
  };

  // 강사 만족도 평균
  instructor_satisfaction: {
    teaching_skill: number;
    communication: number;
    preparation: number;
    response_to_questions: number;
    enthusiasm: number;
    overall_satisfaction: number;
  };

  // 운영 만족도 평균
  operation_satisfaction: {
    registration_process: number;
    schedule_management: number;
    communication: number;
    administrative_support: number;
    facility_management: number;
    overall_satisfaction: number;
  };

  // 전체 종합 만족도
  overall_average: number;           // 전체 평균 (1-5점)

  // 분포도
  distribution: {
    very_satisfied: number;          // 5점 비율 (%)
    satisfied: number;               // 4점 비율 (%)
    neutral: number;                 // 3점 비율 (%)
    dissatisfied: number;            // 2점 비율 (%)
    very_dissatisfied: number;       // 1점 비율 (%)
  };

  calculated_at: string;
}

// ========================================
// 5. 편의 타입 (조인된 데이터)
// ========================================

/**
 * 과정 만족도 + 교육생 정보
 */
export interface CourseSatisfactionWithTrainee extends CourseSatisfaction {
  trainee: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * 강사 만족도 + 교육생/강사 정보
 */
export interface InstructorSatisfactionWithDetails extends InstructorSatisfaction {
  trainee: {
    id: string;
    name: string;
    email: string;
  };
  instructor: {
    id: string;
    name: string;
    department?: string;
  };
}

/**
 * 과정별 만족도 요약
 */
export interface CourseRoundFeedbackSummary {
  course_round_id: string;
  course_name: string;
  course_period: string;

  // 응답률
  total_trainees: number;
  response_count: number;
  response_rate: number;

  // 평균 점수
  course_avg: number;
  instructor_avg: number;
  operation_avg: number;
  overall_avg: number;

  // 완료 여부
  is_completed: boolean;
  completed_at?: string;
}

/**
 * 강사별 만족도 요약
 */
export interface InstructorFeedbackSummary {
  instructor_id: string;
  instructor_name: string;

  // 총 평가 수
  total_evaluations: number;

  // 평균 점수
  teaching_skill_avg: number;
  communication_avg: number;
  preparation_avg: number;
  response_to_questions_avg: number;
  enthusiasm_avg: number;
  overall_avg: number;

  // 최근 평가
  last_evaluation_date?: string;
}

/**
 * 만족도 트렌드 데이터
 */
export interface FeedbackTrend {
  period: string;                    // 기간 (YYYY-MM)
  course_avg: number;
  instructor_avg: number;
  operation_avg: number;
  overall_avg: number;
  response_count: number;
}
