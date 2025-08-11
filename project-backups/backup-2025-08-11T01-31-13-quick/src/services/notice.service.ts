import { supabase } from './supabase';
import type { Notice, NoticeFile, NoticeImage } from '../types/notice.types';

export interface CreateNoticeData {
  title: string;
  content: string;
  category?: string;
  is_pinned?: boolean;
  author_id: string;
}

export interface UpdateNoticeData {
  title?: string;
  content?: string;
  category?: string;
  is_pinned?: boolean;
}

export interface NoticeFilters {
  category?: string;
  author_id?: string;
  is_pinned?: boolean;
  search?: string;
}

export class NoticeService {
  // 공지사항 목록 조회
  static async getNotices(filters?: NoticeFilters): Promise<Notice[]> {
    let query = supabase
      .from('notices')
      .select(`
        *,
        author:users!notices_author_id_fkey(name, email)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    // 필터 적용
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.author_id) {
      query = query.eq('author_id', filters.author_id);
    }
    if (filters?.is_pinned !== undefined) {
      query = query.eq('is_pinned', filters.is_pinned);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // 공지사항 상세 조회
  static async getNoticeById(id: string): Promise<Notice | null> {
    const { data, error } = await supabase
      .from('notices')
      .select(`
        *,
        author:users!notices_author_id_fkey(name, email),
        files:notice_files(*),
        images:notice_images(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  // 공지사항 생성
  static async createNotice(noticeData: CreateNoticeData): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .insert({
        ...noticeData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        author:users!notices_author_id_fkey(name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // 공지사항 수정
  static async updateNotice(id: string, updateData: UpdateNoticeData): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        author:users!notices_author_id_fkey(name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // 공지사항 삭제
  static async deleteNotice(id: string): Promise<void> {
    // 관련 파일들 먼저 삭제
    await this.deleteNoticeFiles(id);
    await this.deleteNoticeImages(id);

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 공지사항 고정/해제
  static async togglePin(id: string): Promise<Notice> {
    // 현재 상태 조회
    const current = await this.getNoticeById(id);
    if (!current) throw new Error('공지사항을 찾을 수 없습니다');

    return this.updateNotice(id, { is_pinned: !current.is_pinned });
  }

  // 파일 업로드
  static async uploadFile(noticeId: string, file: File): Promise<NoticeFile> {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `notices/${fileName}`;

    // Supabase Storage에 파일 업로드
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 파일 정보를 데이터베이스에 저장
    const { data: fileUrl } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('notice_files')
      .insert({
        notice_id: noticeId,
        file_name: file.name,
        file_url: fileUrl.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 이미지 업로드
  static async uploadImage(noticeId: string, image: File, caption?: string): Promise<NoticeImage> {
    const fileName = `${Date.now()}_${image.name}`;
    const filePath = `notices/images/${fileName}`;

    // Supabase Storage에 이미지 업로드
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, image);

    if (uploadError) throw uploadError;

    // 이미지 정보를 데이터베이스에 저장
    const { data: imageUrl } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('notice_images')
      .insert({
        notice_id: noticeId,
        image_url: imageUrl.publicUrl,
        caption,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 공지사항 파일 삭제
  static async deleteNoticeFiles(noticeId: string): Promise<void> {
    const { error } = await supabase
      .from('notice_files')
      .delete()
      .eq('notice_id', noticeId);

    if (error) throw error;
  }

  // 공지사항 이미지 삭제
  static async deleteNoticeImages(noticeId: string): Promise<void> {
    const { error } = await supabase
      .from('notice_images')
      .delete()
      .eq('notice_id', noticeId);

    if (error) throw error;
  }

  // 특정 파일 삭제
  static async deleteFile(fileId: string): Promise<void> {
    const { error } = await supabase
      .from('notice_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
  }

  // 특정 이미지 삭제
  static async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('notice_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
  }

  // 공지사항 카테고리 목록 조회
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    // 중복 제거하고 정렬
    const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
    return categories.sort();
  }

  // 공지사항 통계
  static async getNoticeStats(): Promise<{
    total: number;
    pinned: number;
    categories: { [key: string]: number };
  }> {
    const notices = await this.getNotices();
    
    const stats = {
      total: notices.length,
      pinned: notices.filter(n => n.is_pinned).length,
      categories: {} as { [key: string]: number }
    };

    // 카테고리별 통계
    notices.forEach(notice => {
      if (notice.category) {
        stats.categories[notice.category] = (stats.categories[notice.category] || 0) + 1;
      }
    });

    return stats;
  }
}