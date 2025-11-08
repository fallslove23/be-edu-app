/**
 * 통합 일정 관리 시스템 타입 정의
 */

// 강사 가용 시간대
export interface InstructorAvailability {
  id: string;
  instructor_id: string;
  day_of_week: number; // 0-6 (일요일-토요일)
  start_time: string; // "09:00:00"
  end_time: string;
  is_available: boolean;
  recurring: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorAvailabilityCreate {
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  recurring?: boolean;
  notes?: string;
}

// 과목
export interface Subject {
  id: string;
  name: string;
  description?: string;
  category?: string; // 이론, 실습, 세미나 등
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectCreate {
  name: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface SubjectUpdate {
  name?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

// 강사-과목 매핑
export interface InstructorSubject {
  id: string;
  instructor_id: string;
  subject_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'expert';
  created_at: string;
}

export interface InstructorSubjectCreate {
  instructor_id: string;
  subject_id: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'expert';
}

// 강사 프로필 (간소화)
export interface InstructorProfile {
  id: string;
  user_id: string;
  max_hours_per_week: number; // 사용 안함 (자동 집계)
  bio?: string; // 자기소개
  profile_photo_url?: string;
  rating: number; // 0.00 ~ 5.00
  total_sessions: number; // 총 강의 횟수 (자동 집계)
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstructorProfileCreate {
  user_id: string;
  bio?: string;
  profile_photo_url?: string;
}

export interface InstructorProfileUpdate {
  bio?: string;
  profile_photo_url?: string;
  rating?: number;
  is_active?: boolean;
}

// 강사 주간 강의 시간 통계 (뷰)
export interface InstructorWeeklyHours {
  instructor_id: string;
  instructor_name: string;
  week_start: string;
  session_count: number;
  total_hours: number;
  avg_hours_per_session: number;
}

// 강사 총 강의 통계 (뷰)
export interface InstructorTeachingStats {
  instructor_id: string;
  instructor_name: string;
  email: string;
  total_sessions: number;
  total_hours: number;
  avg_session_duration: number;
  first_session: string;
  last_session: string;
  weeks_taught: number;
  avg_hours_per_week: number;
}

// 강사-과목별 통계 (뷰)
export interface InstructorSubjectStats {
  instructor_id: string;
  instructor_name: string;
  subject: string;
  session_count: number;
  total_hours: number;
  first_taught: string;
  last_taught: string;
}

// 교실 (확장)
export interface Classroom {
  id: string;
  name: string;
  code?: string; // 강의실 코드
  capacity: number;
  location?: string;
  building?: string; // 건물명
  floor?: number; // 층수
  equipment?: string[]; // JSONB 배열
  facilities?: string[]; // JSONB 배열
  is_active?: boolean; // is_active 또는 is_available
  is_available?: boolean;
  notes?: string;
  photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassroomCreate {
  name: string;
  code?: string;
  capacity: number;
  location?: string;
  building?: string;
  floor?: number;
  equipment?: string[];
  facilities?: string[];
  notes?: string;
  photo_url?: string;
}

// 일정/스케줄
export interface Schedule {
  id: string;
  course_round_id?: string;
  title: string;
  subject?: string;
  description?: string;
  start_time: string; // ISO timestamp
  end_time: string;
  instructor_id?: string;
  classroom_id?: string;
  status: ScheduleStatus;
  materials?: any; // JSONB
  homework?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface ScheduleCreate {
  course_round_id?: string;
  title: string;
  subject?: string;
  description?: string;
  start_time: string;
  end_time: string;
  instructor_id?: string;
  classroom_id?: string;
  status?: ScheduleStatus;
  materials?: any;
  homework?: any;
  notes?: string;
}

export interface ScheduleUpdate {
  title?: string;
  subject?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  instructor_id?: string;
  classroom_id?: string;
  status?: ScheduleStatus;
  materials?: any;
  homework?: any;
  notes?: string;
}

// 개인 이벤트
export interface PersonalEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: PersonalEventType;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export type PersonalEventType = 'personal' | 'holiday' | 'vacation' | 'meeting' | 'other';

export interface PersonalEventCreate {
  user_id: string;
  title: string;
  description?: string;
  event_type: PersonalEventType;
  start_time: string;
  end_time?: string;
  all_day?: boolean;
  color?: string;
  location?: string;
}

// 일정 충돌
export interface ScheduleConflict {
  id: string;
  conflict_type: ConflictType;
  resource_id: string;
  resource_name: string;
  schedule1_id: string;
  schedule2_id: string;
  conflict_date: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export type ConflictType = 'instructor' | 'classroom' | 'trainee';

// 캘린더 이벤트 (통합 뷰용)
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'schedule' | 'personal' | 'holiday';
  color?: string;
  instructor?: string;
  classroom?: string;
  course_round_id?: string;
  status?: string;
  editable: boolean;
  allDay?: boolean;
}

// 일정과 함께 조회되는 확장 정보
export interface ScheduleWithDetails extends Schedule {
  instructor_name?: string;
  classroom_name?: string;
  course_name?: string;
  round_number?: number;
}

// 필터링
export interface ScheduleFilter {
  course_round_id?: string;
  instructor_id?: string;
  classroom_id?: string;
  status?: ScheduleStatus[];
  date_range?: {
    start: string;
    end: string;
  };
}

// 통계
export interface ScheduleStatistics {
  total_schedules: number;
  upcoming_schedules: number;
  completed_schedules: number;
  instructor_workload: {
    instructor_id: string;
    instructor_name: string;
    total_hours: number;
    schedule_count: number;
  }[];
  classroom_utilization: {
    classroom_id: string;
    classroom_name: string;
    usage_hours: number;
    usage_percentage: number;
  }[];
}

// 라벨
export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  scheduled: '예정',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
};

export const personalEventTypeLabels: Record<PersonalEventType, string> = {
  personal: '개인 일정',
  holiday: '공휴일',
  vacation: '휴가',
  meeting: '회의',
  other: '기타',
};

export const dayOfWeekLabels: string[] = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
];

export const proficiencyLevelLabels: Record<string, string> = {
  'beginner': '초급',
  'intermediate': '중급',
  'expert': '전문가',
};
