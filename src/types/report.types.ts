/**
 * 교육생 리포트 관련 타입 정의
 */

// 수료 상태
export type CompletionStatus = 'in_progress' | 'completed' | 'dropped' | 'pending';

// 성적 등급
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

// 출석 상태
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

// 교육생 기본 정보
export interface TraineeBasicInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
  joined_at: string;
}

// 과정 이수 정보
export interface CourseCompletionInfo {
  id: string;
  course_name: string;
  session_code: string;
  division_name?: string;
  start_date: string;
  end_date: string;
  completion_status: CompletionStatus;
  completion_date?: string;
  certificate_issued: boolean;
  certificate_number?: string;
}

// 성적 정보
export interface GradeInfo {
  subject: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: Grade;
  evaluation_date: string;
}

// 출석 요약 정보
export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  excused_days: number;
  attendance_rate: number;
}

// 시험 결과
export interface ExamResult {
  exam_id: string;
  exam_title: string;
  exam_type: string;
  score: number;
  max_score: number;
  percentage: number;
  grade: Grade;
  taken_at: string;
  time_spent_minutes?: number;
}

// 인증서 정보
export interface CertificateInfo {
  id: string;
  certificate_number: string;
  course_name: string;
  issued_date: string;
  issuer: string;
  valid_until?: string;
  pdf_url?: string;
}

// 교육생 종합 리포트
export interface StudentReport {
  trainee: TraineeBasicInfo;
  course_completions: CourseCompletionInfo[];
  current_courses: CourseCompletionInfo[];
  grades: GradeInfo[];
  attendance_summary: AttendanceSummary;
  exam_results: ExamResult[];
  certificates: CertificateInfo[];
  overall_statistics: {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    average_score: number;
    average_attendance_rate: number;
    total_certificates: number;
  };
}

// 리포트 필터
export interface ReportFilter {
  trainee_id?: string;
  course_id?: string;
  session_id?: string;
  completion_status?: CompletionStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  course_name?: string;
  session_code?: string;
}

// 리포트 정렬
export interface ReportSort {
  field: 'name' | 'completion_date' | 'score' | 'attendance_rate';
  direction: 'asc' | 'desc';
}

// 리포트 통계
export interface ReportStatistics {
  total_trainees: number;
  total_completions: number;
  average_completion_rate: number;
  average_score: number;
  average_attendance_rate: number;
  certificates_issued: number;
}

// 리포트 export 옵션
export interface ReportExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  include_grades: boolean;
  include_attendance: boolean;
  include_certificates: boolean;
  date_range?: {
    from: string;
    to: string;
  };
}
