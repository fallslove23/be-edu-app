// 과정 스케줄 관련 타입 정의

export interface Course {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration_hours: number;
  max_capacity: number;
  current_enrollment: number;
  start_date: string;
  end_date: string;
  status: CourseStatus;
  instructor_ids: string[];
  trainee_ids: string[];
  classroom?: string;
  materials?: string[];
  created_at: string;
  updated_at: string;
}

export type CourseStatus = 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';

export interface Schedule {
  id: string;
  course_id: string;
  title: string;
  subject?: string;
  instructor_id?: string;
  start_time: string;
  end_time: string;
  date: string;
  classroom?: string;
  notes?: string;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
}

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Instructor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  specializations: string[];
  bio?: string;
  education_background?: string;
  years_of_experience: number;
  is_active: boolean;
  availability?: TimeSlot[];
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  instructor_id: string;
  start_time: string;
  end_time: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  is_available: boolean;
  recurring: boolean;
  notes?: string;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  location?: string;
  is_active: boolean;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  trainee_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  completion_rate: number;
  final_grade?: string;
  notes?: string;
}

export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'failed';

export interface ScheduleConflict {
  id: string;
  type: ConflictType;
  resource_id: string; // instructor_id, classroom_id, trainee_id
  resource_name: string;
  conflicting_schedules: {
    schedule_id: string;
    course_name: string;
    time_range: string;
  }[];
  date: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolution_notes?: string;
}

export type ConflictType = 'instructor' | 'classroom' | 'trainee' | 'holiday';

// Firebase 플래너 연동을 위한 타입
export interface FirebasePlannerCourse {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  instructors: string[];
  schedules: FirebaseScheduleItem[];
}

export interface FirebaseScheduleItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  instructor: string;
  room?: string;
}

// 통합 관리를 위한 뷰 타입
export interface CourseOverview {
  course: Course;
  schedules: Schedule[];
  instructors: Instructor[];
  enrolled_trainees: {
    id: string;
    name: string;
    department: string;
    enrollment_status: EnrollmentStatus;
  }[];
  conflicts: ScheduleConflict[];
  progress_summary: {
    total_hours: number;
    completed_hours: number;
    upcoming_sessions: number;
    completion_rate: number;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'course' | 'schedule' | 'personal' | 'holiday';
  course_id?: string;
  instructor_id?: string;
  classroom?: string;
  status: string;
  color?: string;
  editable: boolean;
}

// 검색 및 필터링
export interface CourseFilters {
  status?: CourseStatus[];
  instructor_id?: string;
  category?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search_term?: string;
}

export interface ScheduleFilters {
  course_id?: string;
  instructor_id?: string;
  classroom?: string;
  date_range?: {
    start: string;
    end: string;
  };
  status?: ScheduleStatus[];
}

// 통계 및 리포트
export interface CourseStatistics {
  total_courses: number;
  active_courses: number;
  completed_courses: number;
  total_trainees: number;
  average_completion_rate: number;
  instructor_utilization: {
    instructor_id: string;
    instructor_name: string;
    total_hours: number;
    courses_count: number;
  }[];
  monthly_trends: {
    month: string;
    courses_started: number;
    courses_completed: number;
    total_trainees: number;
  }[];
}

// 라벨 및 상수
export const courseStatusLabels: Record<CourseStatus, string> = {
  planning: '계획중',
  confirmed: '확정',
  ongoing: '진행중',
  completed: '완료',
  cancelled: '취소'
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소'
};

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  enrolled: '등록',
  in_progress: '수강중',
  completed: '수료',
  dropped: '중도포기',
  failed: '미수료'
};