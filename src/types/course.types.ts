// Course types from course.services.ts
export type CourseStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Course {
  id: string;
  name: string;
  description?: string;
  instructor_id?: string;
  instructor_name?: string;
  manager_id?: string;
  manager_name?: string;
  start_date: string;
  end_date: string;
  max_trainees: number;
  current_trainees: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseData {
  name: string;
  description?: string;
  instructor_id?: string;
  manager_id?: string;
  start_date: string;
  end_date: string;
  max_trainees: number;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  course_name: string;
  course_description?: string;
  course_start_date?: string;
  course_end_date?: string;
  course_status?: CourseStatus;
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  trainee_department?: string;
  enrolled_at: string;
  status: EnrollmentStatus;
  completion_date?: string;
  final_score?: number;
  instructor_name?: string;
  manager_name?: string;
}

export interface CourseCurriculum {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  duration_hours: number;
  order_index: number;
  is_mandatory: boolean;
  created_at: string;
}

export interface CourseSchedule {
  id: string;
  course_id: string;
  course_name: string;
  curriculum_id?: string;
  curriculum_title?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  instructor_id?: string;
  instructor_name?: string;
  status: ScheduleStatus;
  created_at: string;
}

export interface CourseAttendance {
  id: string;
  schedule_id: string;
  trainee_id: string;
  trainee_name: string;
  status: AttendanceStatus;
  notes?: string;
  recorded_at: string;
  recorded_by?: string;
}

export interface CourseStats {
  total_courses: number;
  active_courses: number;
  total_enrollments: number;
  total_schedules: number;
  upcoming_schedules: number;
  by_status: Record<CourseStatus, number>;
}

export const courseStatusLabels: { [key in CourseStatus]: string } = {
  draft: '준비중',
  active: '진행중',
  completed: '완료',
  cancelled: '취소'
};

export const enrollmentStatusLabels: { [key in EnrollmentStatus]: string } = {
  active: '수강중',
  completed: '수료',
  dropped: '중도포기'
};

export const attendanceStatusLabels: { [key in AttendanceStatus]: string } = {
  present: '출석',
  absent: '결석',
  late: '지각',
  excused: '정당한 사유'
};

// 과정 필터링을 위한 인터페이스
export interface CourseFilters {
  status?: CourseStatus[];
  category?: string[];
  courseType?: string[];
  instructorId?: string;
}