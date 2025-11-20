/**
 * 학습 이력 추적 시스템 타입 정의
 */

export interface CourseProgress {
  course_id: string;
  course_name: string;
  category: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'dropped';

  // 진도율
  total_sessions: number;
  attended_sessions: number;
  progress_percentage: number;

  // 출석 정보
  attendance_rate: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;

  // 평가 정보
  assignments_completed: number;
  assignments_total: number;
  assignment_completion_rate: number;

  exams_taken: number;
  exams_total: number;
  exam_completion_rate: number;

  average_score: number;

  // 수료 조건
  completion_requirements: CompletionRequirements;
  meets_requirements: boolean;
  completion_date?: string;
}

export interface CompletionRequirements {
  min_attendance_rate: number; // 최소 출석률 (예: 80%)
  min_assignment_rate: number; // 최소 과제 제출률 (예: 70%)
  min_exam_rate: number; // 최소 시험 응시율 (예: 100%)
  min_average_score: number; // 최소 평균 점수 (예: 60점)
}

export interface LearningHistorySummary {
  trainee_id: string;
  trainee_name: string;
  employee_id: string;
  department: string;

  // 전체 통계
  total_courses_enrolled: number;
  total_courses_completed: number;
  total_courses_active: number;
  total_courses_dropped: number;

  overall_completion_rate: number;
  overall_attendance_rate: number;
  overall_average_score: number;

  // 과정별 상세
  course_progress: CourseProgress[];

  // 최근 활동
  last_activity_date: string;
  recent_achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'completion' | 'perfect_attendance' | 'high_score' | 'improvement';
  earned_date: string;
  course_name?: string;
  icon: string;
}

export interface LearningHistoryFilter {
  trainee_id?: string;
  course_id?: string;
  status?: 'active' | 'completed' | 'dropped';
  date_from?: string;
  date_to?: string;
  min_attendance_rate?: number;
  min_average_score?: number;
}

export interface CompletionEligibility {
  is_eligible: boolean;
  reasons: string[];
  requirements_met: {
    attendance: boolean;
    assignments: boolean;
    exams: boolean;
    average_score: boolean;
  };
  missing_requirements: string[];
}

export interface LearningReport {
  trainee_id: string;
  trainee_name: string;
  employee_id: string;
  department: string;
  position: string;

  report_period: {
    start_date: string;
    end_date: string;
  };

  summary: {
    total_courses: number;
    completed_courses: number;
    active_courses: number;
    total_hours: number;
    attendance_rate: number;
    average_score: number;
  };

  course_details: CourseProgress[];

  achievements: Achievement[];

  recommendations: string[];

  generated_at: string;
}

export interface ProgressTimeline {
  date: string;
  event_type: 'enrollment' | 'attendance' | 'assignment' | 'exam' | 'completion';
  course_name: string;
  description: string;
  score?: number;
}
