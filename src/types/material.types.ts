/**
 * 자료 관리 시스템 타입 정의
 */

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string;
  category_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  is_public: boolean;
  download_count: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface MaterialDistribution {
  id: string;
  material_id: string;
  title: string;
  description?: string;
  target_type: 'all' | 'course' | 'round' | 'group' | 'individual';
  target_ids?: string[];
  distributed_by: string;
  distributed_at: string;
  scheduled_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  metadata?: Record<string, any>;
}

export interface MaterialDownload {
  id: string;
  material_id: string;
  user_id: string;
  downloaded_at: string;
  ip_address?: string;
}

export interface MaterialUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface MaterialFilter {
  category_id?: string;
  search?: string;
  file_type?: string;
  uploaded_by?: string;
  from_date?: string;
  to_date?: string;
  is_public?: boolean;
  tags?: string[];
}
