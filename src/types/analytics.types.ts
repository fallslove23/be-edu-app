/**
 * 통합 분석 및 보고서 타입 정의
 */

// 기간 선택 타입
export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface CustomDateRange {
  start_date: string;
  end_date: string;
}

// 비교 분석 타입
export interface ComparisonPeriod {
  current: CustomDateRange;
  previous: CustomDateRange;
}

// 전체 통계 요약
export interface AnalyticsSummary {
  total_students: number;
  active_students: number;
  total_courses: number;
  active_courses: number;
  completion_rate: number;
  average_score: number;
  average_attendance: number;
  total_certificates: number;

  // 변화율 (전 기간 대비)
  student_growth: number;
  course_growth: number;
  completion_growth: number;
  score_growth: number;
}

// 과정별 성과 분석
export interface CoursePerformance {
  course_id: string;
  course_name: string;
  category: string;

  // 등록 및 완료
  total_enrolled: number;
  total_completed: number;
  completion_rate: number;
  dropout_rate: number;

  // 성적 분석
  average_score: number;
  median_score: number;
  score_distribution: ScoreDistribution;

  // 출석 분석
  average_attendance: number;
  perfect_attendance_count: number;

  // 평가 분석
  assignment_submission_rate: number;
  exam_pass_rate: number;

  // 시간 분석
  average_completion_time: number; // 일 단위
  fastest_completion: number;
  slowest_completion: number;
}

export interface ScoreDistribution {
  'A+': number;
  'A': number;
  'B+': number;
  'B': number;
  'C+': number;
  'C': number;
  'D': number;
  'F': number;
}

// 교육생별 성과 분석
export interface StudentPerformance {
  student_id: string;
  student_name: string;
  department: string;

  // 과정 이수
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;

  // 성적
  overall_average: number;
  highest_score: number;
  lowest_score: number;

  // 출석
  attendance_rate: number;
  total_absences: number;

  // 활동
  last_activity_date: string;
  total_study_hours: number;

  // 순위
  rank: number;
  percentile: number;
}

// 부서별 통계
export interface DepartmentStats {
  department: string;
  total_students: number;
  active_students: number;
  average_score: number;
  average_attendance: number;
  completion_rate: number;
  total_courses_enrolled: number;
  total_certificates: number;
}

// 시계열 데이터
export interface TimeSeriesData {
  date: string;

  // 등록 및 완료
  new_enrollments: number;
  completions: number;
  dropouts: number;

  // 활동
  active_users: number;
  total_study_hours: number;

  // 성적
  average_score: number;

  // 출석
  attendance_rate: number;
}

// 강사별 통계
export interface InstructorStats {
  instructor_id: string;
  instructor_name: string;

  // 담당 과정
  total_courses: number;
  active_courses: number;

  // 교육생
  total_students: number;
  average_students_per_course: number;

  // 성과
  average_student_score: number;
  average_completion_rate: number;
  student_satisfaction: number;

  // 업무량
  total_teaching_hours: number;
  upcoming_sessions: number;
}

// 학습 활동 히트맵
export interface ActivityHeatmap {
  day_of_week: string; // 'Mon', 'Tue', ...
  hour: number; // 0-23
  activity_count: number;
  avg_session_duration: number; // 분 단위
}

// 성취도 트렌드
export interface AchievementTrend {
  period: string;
  total_achievements: number;
  completion_badges: number;
  attendance_badges: number;
  score_badges: number;
  improvement_badges: number;
}

// 리포트 필터
export interface AnalyticsFilter {
  date_range?: DateRange;
  custom_range?: CustomDateRange;
  course_ids?: string[];
  department?: string;
  instructor_id?: string;
  student_status?: 'all' | 'active' | 'inactive' | 'graduated';
  min_score?: number;
  max_score?: number;
}

// 리포트 익스포트 옵션
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  include_charts: boolean;
  include_detailed_breakdown: boolean;
  language: 'ko' | 'en';
}

// 대시보드 위젯 설정
export interface DashboardWidget {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'heatmap' | 'ranking';
  title: string;
  data_type: string;
  enabled: boolean;
  position: { x: number; y: number; w: number; h: number };
  refresh_interval?: number; // 초 단위
}

// 알림 설정
export interface AnalyticsAlert {
  id: string;
  name: string;
  metric: string; // 'completion_rate', 'attendance_rate', etc.
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  recipients: string[];
  enabled: boolean;
}

// 비교 분석 결과
export interface ComparisonAnalysis {
  metric: string;
  current_value: number;
  previous_value: number;
  change: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// 예측 분석
export interface PredictiveAnalytics {
  metric: string;
  current_value: number;
  predicted_value: number;
  confidence: number; // 0-100
  prediction_date: string;
  factors: string[];
}
