// 출석 관리 타입 정의

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'early_leave';

export interface AttendanceRecord {
  id: string;
  curriculum_item_id: string;
  trainee_id: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  location?: string;
  device_info?: string;
  checked_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStatistics {
  session_id: string;
  curriculum_item_id: string;
  date: string;
  day: number;
  order_index: number;
  session_title: string;
  total_checked: number;
  total_enrolled: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  early_leave_count: number;
  not_checked_count: number;
  attendance_rate: number;
}

export interface TraineeAttendanceSummary {
  trainee_id: string;
  trainee_name: string;
  email: string;
  session_id: string;
  session_name: string;
  session_code: string;
  total_sessions: number;
  attended_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  early_leave_count: number;
  not_attended_count: number;
  attendance_rate: number;
  can_complete: boolean;
}

export interface DailyAttendanceOverview {
  date: string;
  session_id: string;
  session_name: string;
  session_code: string;
  day: number;
  total_sessions: number;
  total_attendances: number;
  total_enrolled: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  daily_attendance_rate: number;
}

export interface AttendanceCheckRequest {
  curriculum_item_id: string;
  trainee_id: string;
  status: AttendanceStatus;
  notes?: string;
  location?: string;
}

export interface BulkAttendanceCheckRequest {
  curriculum_item_id: string;
  records: Array<{
    trainee_id: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}
