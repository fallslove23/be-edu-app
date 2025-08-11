// 활동일지 관련 타입 정의

export type ActivityLogStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';

export interface ActivityLog {
  id: string;
  student_id: string; // users 테이블의 id (trainee)
  title: string;
  content: string;
  activity_date: string;
  hours_spent: number; // 활동 시간 (시간 단위)
  status: ActivityLogStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_id?: string; // 검토한 강사/관리자 ID
  review_comment?: string;
  attachments?: ActivityLogAttachment[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLogAttachment {
  id: string;
  activity_log_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface CreateActivityLogData {
  student_id: string;
  title: string;
  content: string;
  activity_date: string;
  hours_spent: number;
}

export interface UpdateActivityLogData {
  title?: string;
  content?: string;
  activity_date?: string;
  hours_spent?: number;
  status?: ActivityLogStatus;
  reviewer_id?: string;
  reviewed_at?: string;
  review_comment?: string;
}

export interface ActivityLogSummary {
  total_logs: number;
  total_hours: number;
  status_distribution: { [key in ActivityLogStatus]: number };
  recent_activity: string; // 최근 활동일
  monthly_hours: { [month: string]: number };
}

// 상태별 라벨
export const activityLogStatusLabels: { [key in ActivityLogStatus]: string } = {
  draft: '임시저장',
  submitted: '제출됨',
  reviewed: '검토중',
  approved: '승인됨',
  rejected: '반려됨'
};

// 상태별 색상
export const activityLogStatusColors: { [key in ActivityLogStatus]: { bg: string; text: string } } = {
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  submitted: { bg: '#dbeafe', text: '#1d4ed8' },
  reviewed: { bg: '#fef3c7', text: '#d97706' },
  approved: { bg: '#dcfce7', text: '#16a34a' },
  rejected: { bg: '#fee2e2', text: '#dc2626' }
};