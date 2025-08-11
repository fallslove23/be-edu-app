import type { User } from '../services/user.services';
import type { Course, CourseEnrollment, EnrollmentStatus } from './course.types';

// 교육생 배정 관련 타입들

// 배정 가능한 교육생 정보
export interface AvailableTrainee extends User {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  department?: string;
  join_date?: string;
  phone?: string;
  current_enrollments: number;
  active_courses: string[];
  completed_courses: number;
  average_score?: number;
  last_enrollment_date?: string;
  is_eligible: boolean;
  eligibility_reason?: string;
}

// 배정 요청 데이터
export interface EnrollmentRequest {
  course_id: string;
  trainee_ids: string[];
  enrollment_date?: string;
  notes?: string;
  priority: 'normal' | 'high' | 'urgent';
  auto_approve: boolean;
}

// 배정 결과
export interface EnrollmentResult {
  successful_enrollments: CourseEnrollment[];
  failed_enrollments: FailedEnrollment[];
  waiting_list: WaitingListEntry[];
  course_full: boolean;
  total_requested: number;
  total_enrolled: number;
  total_failed: number;
  total_waitlisted: number;
}

// 실패한 배정
export interface FailedEnrollment {
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  reason: 'course_full' | 'already_enrolled' | 'schedule_conflict' | 'prerequisite_missing' | 'other';
  reason_detail: string;
}

// 대기자 목록
export interface WaitingListEntry {
  id: string;
  course_id: string;
  course_name: string;
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  requested_at: string;
  priority: 'normal' | 'high' | 'urgent';
  position: number;
  estimated_enrollment_date?: string;
  notes?: string;
  status: 'waiting' | 'notified' | 'expired';
}

// 배정 이력
export interface EnrollmentHistory {
  id: string;
  course_id: string;
  course_name: string;
  trainee_id: string;
  trainee_name: string;
  action: 'enrolled' | 'unenrolled' | 'transferred' | 'completed' | 'dropped';
  action_date: string;
  action_by: string;
  action_by_name: string;
  reason?: string;
  notes?: string;
  previous_status?: EnrollmentStatus;
  new_status?: EnrollmentStatus;
}

// 과정별 수강생 현황
export interface CourseEnrollmentSummary {
  course: Course;
  enrollment_stats: {
    total_enrolled: number;
    active_enrollments: number;
    completed_enrollments: number;
    dropped_enrollments: number;
    waiting_list_count: number;
    available_spots: number;
    enrollment_rate: number;
    completion_rate: number;
    drop_rate: number;
  };
  recent_enrollments: CourseEnrollment[];
  waiting_list: WaitingListEntry[];
  enrollment_history: EnrollmentHistory[];
}

// 교육생 검색 필터
export interface TraineeSearchFilter {
  search_term?: string;
  department?: string;
  join_date_from?: string;
  join_date_to?: string;
  has_active_courses?: boolean;
  has_completed_courses?: boolean;
  min_average_score?: number;
  max_current_enrollments?: number;
  exclude_enrolled_in_course?: string;
  sort_by?: 'name' | 'department' | 'join_date' | 'average_score' | 'current_enrollments';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 교육생 검색 결과
export interface TraineeSearchResult {
  trainees: AvailableTrainee[];
  total_count: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

// 배정 규칙
export interface EnrollmentRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'prerequisite' | 'capacity' | 'schedule' | 'department' | 'custom';
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  priority: number;
}

// 배정 충돌 검사 결과
export interface EnrollmentConflict {
  type: 'schedule' | 'capacity' | 'prerequisite' | 'department';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affected_trainee_ids: string[];
  suggested_action?: string;
  can_override: boolean;
}

// 배정 승인 요청
export interface EnrollmentApproval {
  id: string;
  course_id: string;
  course_name: string;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  trainee_ids: string[];
  trainee_count: number;
  priority: 'normal' | 'high' | 'urgent';
  reason?: string;
  notes?: string;
  conflicts: EnrollmentConflict[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
}

// 배정 통계
export interface EnrollmentStatistics {
  period: {
    start_date: string;
    end_date: string;
  };
  total_enrollments: number;
  successful_enrollments: number;
  failed_enrollments: number;
  cancellation_rate: number;
  average_enrollment_time: number; // days
  popular_courses: Array<{
    course_id: string;
    course_name: string;
    enrollment_count: number;
  }>;
  department_stats: Array<{
    department: string;
    enrollment_count: number;
    completion_rate: number;
  }>;
  monthly_trends: Array<{
    month: string;
    enrollments: number;
    completions: number;
  }>;
}

// Quick Actions
export interface EnrollmentQuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action_type: 'bulk_enroll' | 'transfer' | 'notify_waitlist' | 'generate_report';
  requires_selection: boolean;
  confirmation_required: boolean;
}

// 상태 라벨
export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  active: '수강중',
  completed: '수료',
  dropped: '중도포기'
};

export const waitingListStatusLabels = {
  waiting: '대기중',
  notified: '알림발송',
  expired: '만료'
} as const;

export const enrollmentActionLabels = {
  enrolled: '등록',
  unenrolled: '등록해제',
  transferred: '이전',
  completed: '수료',
  dropped: '중도포기'
} as const;