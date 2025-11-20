/**
 * =================================================
 * 통합 과정 관리 시스템 타입 정의
 * =================================================
 * 설명: 과정 템플릿, 차수, 커리큘럼 통합 타입
 * 작성일: 2025-01-19
 * =================================================
 */

// =================================================
// 공통 타입 정의
// =================================================

export type SubjectType = 'lecture' | 'practice' | 'evaluation' | 'discussion' | 'presentation';
export type CourseCategory = 'basic' | 'advanced' | 'specialized';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type RoundStatus = 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
export type CurriculumStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'pending';

// =================================================
// 1. 과정 템플릿 (Course Template)
// =================================================

/**
 * 과정 템플릿 - 과정의 기본 정보 및 메타데이터
 */
export interface CourseTemplate {
  id: string;
  code: string;                          // 'BS-BASIC', 'BS-ADVANCED'
  name: string;                          // 'BS Basic', 'BS Advanced'
  description: string;

  // 카테고리 및 난이도
  category: CourseCategory;
  category_id?: string;                  // FK to categories table (optional)
  difficulty_level: DifficultyLevel;

  // 기간 및 시간
  duration_days: number;                 // 전체 일수 (예: 3, 5)
  duration_weeks?: number;               // 주 단위 (호환성)
  total_hours: number;                   // 총 교육 시간 (예: 24, 40)

  // 교육 요구사항 및 목표
  requirements: string[];                // 수강 요건
  objectives: string[];                  // 학습 목표
  prerequisites?: string[];              // 선수 과정 (legacy)
  tags?: string[];                       // 태그 (legacy)

  // 상태
  is_active: boolean;

  // 메타데이터
  created_at: string;
  updated_at: string;
}

/**
 * 템플릿 커리큘럼 - 과정 템플릿의 표준 커리큘럼
 */
export interface TemplateCurriculum {
  id: string;
  template_id: string;                   // FK to course_templates

  // 일차 및 순서
  day: number;                           // 1일차, 2일차, 3일차...
  order_index: number;                   // 같은 날 과목 순서 (1교시, 2교시...)

  // 과목 정보
  subject: string;                       // 과목명
  subject_code?: string;                 // 과목 코드 (선택)
  subject_type: SubjectType;
  description?: string;

  // 시간 정보
  duration_hours: number;                // 교육 시간 (예: 3.0, 1.5)
  recommended_start_time?: string;       // 권장 시작 시간 (TIME)
  recommended_end_time?: string;         // 권장 종료 시간 (TIME)

  // 교육 내용
  learning_objectives: string[];         // 학습 목표
  topics?: string[];                     // 주요 주제
  materials_needed?: string[];           // 필요 자료

  // 강사 요구사항
  instructor_requirements?: string;
  preparation_notes?: string;

  // 메타데이터
  created_at: string;
  updated_at: string;
}

// =================================================
// 2. 과정 차수 (Course Round)
// =================================================

/**
 * 과정 차수 - 실제 운영되는 과정 인스턴스
 */
export interface CourseRound {
  id: string;
  template_id: string;                   // FK to course_templates

  // 차수 정보
  round_number: number;                  // 1차, 2차, 3차...
  round_name: string;                    // 'BS Basic 1차'
  round_code: string;                    // 'ROUND-xxx' 또는 'BS-2025-01'
  course_name: string;                   // 'BS Basic' (중복 저장)
  title?: string;                        // round_name 별칭 (호환성)

  // 인력 배정
  instructor_id?: string;                // FK to users (강사)
  instructor_name: string;
  manager_id?: string;                   // FK to users (운영 담당자)
  manager_name?: string;

  // 기간 및 장소
  start_date: string;                    // DATE
  end_date: string;                      // DATE
  location: string;                      // 교육 장소

  // 인원 관리
  max_trainees: number;                  // 정원
  current_trainees: number;              // 현재 등록 인원

  // 상태
  status: RoundStatus;
  description?: string;

  // 메타데이터
  created_at: string;
  updated_at: string;
}

/**
 * 과정 차수 전체 정보 (View)
 */
export interface CourseRoundFull extends CourseRound {
  template_name: string;
  category: CourseCategory;
  template_duration_days: number;
  template_total_hours: number;

  // 통계
  enrolled_count: number;                // 등록 인원
  completed_count: number;               // 수료 인원
  curriculum_items_count: number;        // 커리큘럼 항목 수
  completed_sessions_count: number;      // 완료된 세션 수
  session_completion_rate: number;       // 세션 완료율 (%)
}

// =================================================
// 3. 커리큘럼 항목 (Curriculum Item)
// =================================================

/**
 * 커리큘럼 항목 - 실제 수업 일정
 */
export interface CurriculumItem {
  id: string;

  // 과정 연결
  round_id: string;                      // FK to course_rounds
  template_curriculum_id?: string;       // FK to template_curriculum
  session_id?: string;                   // Legacy FK (nullable)
  division_id?: string;                  // FK to class_divisions (nullable)

  // 일차 및 순서
  day: number;                           // 1일차, 2일차, 3일차...
  order_index: number;                   // 같은 날 과목 순서

  // 일정 정보
  date: string;                          // DATE
  start_time: string;                    // TIME
  end_time: string;                      // TIME
  duration_hours?: number;               // Generated (자동 계산)

  // 과목 정보
  subject: string;                       // 과목명
  title?: string;                        // subject 별칭
  subject_type: SubjectType;
  description?: string;

  // 강사 및 강의실
  instructor_id?: string;                // FK to users
  classroom_id?: string;                 // FK to classrooms

  // 상태 관리
  status: CurriculumStatus;
  needs_approval: boolean;
  approved_at?: string;
  approved_by?: string;                  // FK to users

  // 교육 자료
  materials?: any[];                     // JSONB

  // 메타데이터
  created_at: string;
  updated_at: string;
  created_by?: string;                   // FK to users
}

/**
 * 커리큘럼 항목 전체 정보 (View)
 */
export interface CurriculumItemFull extends CurriculumItem {
  round_name: string;
  round_number: number;
  round_status: RoundStatus;

  template_subject?: string;
  template_subject_type?: SubjectType;
  template_learning_objectives?: string[];

  instructor_name?: string;
  instructor_email?: string;

  classroom_name?: string;
  classroom_capacity?: number;

  // 출석 통계
  attendance_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
}

// =================================================
// 4. 등록 및 수강생 (Round Enrollment)
// =================================================

/**
 * 차수 등록 - 교육생과 차수 연결
 */
export interface RoundEnrollment {
  id: string;
  round_id: string;                      // FK to course_rounds
  trainee_id: string;                    // FK to trainees

  // 등록 정보
  enrolled_at: string;                   // TIMESTAMPTZ
  status: EnrollmentStatus;

  // 수료 정보
  completion_date?: string;              // DATE
  final_score?: number;                  // DECIMAL(5,2)
  certificate_issued: boolean;
  certificate_number?: string;

  // 추가 정보
  notes?: string;
  enrollment_source?: string;            // 'web', 'admin', 'import'

  // 메타데이터
  created_at: string;
  updated_at: string;
}

/**
 * 등록 정보 with 교육생 정보
 */
export interface RoundEnrollmentWithTrainee extends RoundEnrollment {
  trainee_name: string;
  trainee_email?: string;
  trainee_department?: string;
  trainee_employee_id?: string;
}

// =================================================
// 5. 요청/응답 DTO (Data Transfer Objects)
// =================================================

/**
 * 과정 템플릿 생성 요청
 */
export interface CreateCourseTemplateRequest {
  code: string;
  name: string;
  description: string;
  category: CourseCategory;
  difficulty_level: DifficultyLevel;
  duration_days: number;
  total_hours: number;
  requirements: string[];
  objectives: string[];
  curriculum: CreateTemplateCurriculumRequest[];
}

/**
 * 템플릿 커리큘럼 생성 요청
 */
export interface CreateTemplateCurriculumRequest {
  day: number;
  order_index: number;
  subject: string;
  subject_type: SubjectType;
  description?: string;
  duration_hours: number;
  recommended_start_time?: string;
  learning_objectives: string[];
  topics?: string[];
}

/**
 * 과정 차수 생성 요청
 */
export interface CreateCourseRoundRequest {
  template_id: string;
  round_number?: number;                 // Auto-increment if not provided
  instructor_id: string;
  manager_id?: string;
  start_date: string;
  end_date?: string;                     // Auto-calculate if not provided
  location: string;
  max_trainees: number;
  description?: string;
}

/**
 * 커리큘럼 항목 업데이트 요청
 */
export interface UpdateCurriculumItemRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  subject?: string;
  description?: string;
  instructor_id?: string;
  classroom_id?: string;
  status?: CurriculumStatus;
  materials?: any[];
}

/**
 * 차수 등록 요청
 */
export interface CreateRoundEnrollmentRequest {
  round_id: string;
  trainee_ids: string[];                 // 여러 명 동시 등록 가능
  enrollment_source?: string;
  notes?: string;
}

// =================================================
// 6. 통합 일정 관리 타입
// =================================================

/**
 * 통합 일정 항목 (캘린더 뷰용)
 */
export interface IntegratedScheduleItem {
  id: string;
  type: 'curriculum' | 'event' | 'absence';

  // 기본 정보
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;

  // 과정 정보 (type === 'curriculum')
  round_id?: string;
  round_name?: string;
  subject?: string;
  subject_type?: SubjectType;

  // 강사 및 장소
  instructor_id?: string;
  instructor_name?: string;
  classroom_id?: string;
  classroom_name?: string;

  // 상태
  status: CurriculumStatus;

  // 추가 정보
  color?: string;                        // 캘린더 색상
  is_approved: boolean;
}

/**
 * 일정 필터 옵션
 */
export interface ScheduleFilter {
  start_date?: string;
  end_date?: string;
  instructor_id?: string;
  round_id?: string;
  status?: CurriculumStatus;
  subject_type?: SubjectType;
}

/**
 * 일정 뷰 모드
 */
export type ScheduleViewMode = 'month' | 'week' | 'day' | 'round' | 'instructor';

// =================================================
// 7. 통계 및 리포트 타입
// =================================================

/**
 * 차수 통계
 */
export interface RoundStatistics {
  round_id: string;
  round_name: string;

  // 인원 통계
  total_enrolled: number;
  total_completed: number;
  total_dropped: number;
  completion_rate: number;               // %

  // 진행 통계
  total_sessions: number;
  completed_sessions: number;
  session_completion_rate: number;       // %

  // 출석 통계
  average_attendance_rate: number;       // %
  total_absences: number;

  // 평가 통계
  average_final_score?: number;
  pass_rate?: number;                    // %
}

/**
 * 과정 템플릿 통계
 */
export interface TemplateStatistics {
  template_id: string;
  template_name: string;

  // 운영 통계
  total_rounds: number;
  active_rounds: number;
  completed_rounds: number;

  // 교육생 통계
  total_graduates: number;
  average_satisfaction?: number;

  // 최근 운영
  last_round_date?: string;
  next_round_date?: string;
}

// =================================================
// 8. 레거시 호환성 타입 (선택적 사용)
// =================================================

/**
 * 레거시 CourseSession (호환성 유지)
 * @deprecated Use CurriculumItem instead
 */
export interface LegacyCourseSession {
  id: string;
  round_id: string;
  day_number: number;
  session_date: string;
  start_time: string;
  end_time: string;
  classroom: string;
  status: string;
  title?: string;
  template_curriculum_id?: string;
}
