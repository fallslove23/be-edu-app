import type { User } from '../services/user.services';

export interface Notice {
  id: string
  title: string
  content: string
  category?: string
  author_id: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  author?: User
  files?: NoticeFile[]
  images?: NoticeImage[]
}

export interface NoticeFile {
  id: string
  notice_id: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  created_at: string
}

export interface NoticeImage {
  id: string
  notice_id: string
  image_url: string
  caption?: string
  created_at: string
}