// BS 활동 관리 타입 정의

export type ActivityCategory =
  | 'new_visit'       // 신규 방문
  | 'follow_up'       // 재방문
  | 'contract'        // 계약
  | 'presentation'    // 제안/프레젠테이션
  | 'feedback'        // 고객 피드백
  | 'networking'      // 네트워킹
  | 'other';          // 기타

export type SubmissionStatus = 'draft' | 'submitted';

export type PresentationStatus = 'pending' | 'presenting' | 'completed';

// 활동 카테고리 라벨
export const activityCategoryLabels: Record<ActivityCategory, string> = {
  new_visit: '신규 방문',
  follow_up: '재방문',
  contract: '계약',
  presentation: '제안/프레젠테이션',
  feedback: '고객 피드백',
  networking: '네트워킹',
  other: '기타'
};

// 활동 카테고리 아이콘
export const activityCategoryIcons: Record<ActivityCategory, string> = {
  new_visit: '🆕',
  follow_up: '🔄',
  contract: '📝',
  presentation: '📊',
  feedback: '💬',
  networking: '🤝',
  other: '📌'
};

// 활동 이미지 정보
export interface ActivityImage {
  url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
}

// 활동 위치 정보
export interface ActivityLocation {
  latitude: number;
  longitude: number;
  address: string;
}

// 활동 피드백 정보
export interface ActivityFeedback {
  comment: string;
  score: number;  // 1-5점
  reviewer_id: string;
  reviewer_name: string;
  reviewed_at: string;
}

// BS 활동 일지
export interface BSActivity {
  id: string;
  trainee_id: string;
  trainee_name?: string;        // JOIN으로 가져올 데이터
  trainee_email?: string;       // JOIN으로 가져올 데이터
  course_id: string;
  course_name?: string;         // JOIN으로 가져올 데이터

  // 활동 기본 정보
  activity_date: string;
  category: ActivityCategory;
  title: string;
  content: string;

  // 이미지 및 위치
  images: ActivityImage[];
  location?: ActivityLocation;

  // 제출 상태
  submission_status: SubmissionStatus;
  submitted_at?: string;

  // 피드백
  feedback?: ActivityFeedback;

  // 우수 사례
  is_best_practice: boolean;

  // 발표 관련
  presentation_order?: number;
  presentation_score?: number;

  // 메타데이터
  created_at: string;
  updated_at: string;
}

// BS 활동 생성 데이터
export interface CreateBSActivityData {
  trainee_id: string;
  course_id: string;
  activity_date: string;
  category: ActivityCategory;
  title: string;
  content: string;
  images?: ActivityImage[];
  location?: ActivityLocation;
  submission_status?: SubmissionStatus;
}

// BS 활동 수정 데이터
export interface UpdateBSActivityData {
  activity_date?: string;
  category?: ActivityCategory;
  title?: string;
  content?: string;
  images?: ActivityImage[];
  location?: ActivityLocation;
  submission_status?: SubmissionStatus;
  feedback?: ActivityFeedback;
  is_best_practice?: boolean;
  presentation_score?: number;
}

// BS 활동 제출 기한
export interface BSActivityDeadline {
  id: string;
  course_id: string;
  week_number: number;
  deadline_date: string;
  title?: string;
  description?: string;
  required_count?: number;
  created_at: string;
}

// BS 발표 순서
export interface BSPresentationOrder {
  id: string;
  course_id: string;
  presentation_date: string;
  trainee_id: string;
  trainee_name?: string;
  order_index: number;
  status: PresentationStatus;
  created_at: string;
}

// BS 활동 통계
export interface BSActivityStats {
  total_activities: number;
  submitted_activities: number;
  draft_activities: number;
  on_time_submissions: number;
  late_submissions: number;
  average_score: number;
  best_practices_count: number;
  activities_by_category: Record<ActivityCategory, number>;
}

// BS 활동 대시보드 데이터
export interface BSActivityDashboard {
  stats: BSActivityStats;
  upcoming_deadlines: BSActivityDeadline[];
  recent_activities: BSActivity[];
  best_practices: BSActivity[];
}

// BS 활동 필터
export interface BSActivityFilter {
  trainee_id?: string;
  course_id?: string;
  category?: ActivityCategory;
  submission_status?: SubmissionStatus;
  is_best_practice?: boolean;
  date_from?: string;
  date_to?: string;
  search_keyword?: string;
}

// 이미지 업로드 옵션
export interface ImageUploadOptions {
  max_size_mb: number;      // 최대 파일 크기 (MB)
  max_count: number;        // 최대 이미지 개수
  allowed_types: string[];  // 허용된 MIME 타입
  compress_quality: number; // 압축 품질 (0-1)
}

// 기본 이미지 업로드 옵션
export const DEFAULT_IMAGE_UPLOAD_OPTIONS: ImageUploadOptions = {
  max_size_mb: 5,
  max_count: 5,
  allowed_types: ['image/jpeg', 'image/png', 'image/webp'],
  compress_quality: 0.8
};
