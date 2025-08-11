import { supabase } from './supabase';
import type {
  ActivityLog,
  ActivityLogAttachment,
  CreateActivityLogData,
  UpdateActivityLogData,
  ActivityLogSummary,
  ActivityLogStatus
} from '../types/activity-log.types';

export class ActivityLogService {
  // 특정 교육생의 활동일지 목록 조회
  static async getActivityLogsByStudent(studentId: string): Promise<ActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          student:users!activity_logs_student_id_fkey(name, email),
          reviewer:users!activity_logs_reviewer_id_fkey(name, email),
          attachments:activity_log_attachments(*)
        `)
        .eq('student_id', studentId)
        .order('activity_date', { ascending: false });

      if (error) {
        console.error('활동일지 조회 오류:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('활동일지 조회 중 예외 발생:', error);
      throw error;
    }
  }

  // 모든 활동일지 조회 (관리자/강사용)
  static async getAllActivityLogs(status?: ActivityLogStatus): Promise<ActivityLog[]> {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          student:users!activity_logs_student_id_fkey(name, email, department),
          reviewer:users!activity_logs_reviewer_id_fkey(name, email),
          attachments:activity_log_attachments(*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('전체 활동일지 조회 오류:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('전체 활동일지 조회 중 예외 발생:', error);
      throw error;
    }
  }

  // 특정 활동일지 조회
  static async getActivityLogById(id: string): Promise<ActivityLog | null> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          student:users!activity_logs_student_id_fkey(name, email, department),
          reviewer:users!activity_logs_reviewer_id_fkey(name, email),
          attachments:activity_log_attachments(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('활동일지 상세 조회 중 예외 발생:', error);
      throw error;
    }
  }

  // 활동일지 생성
  static async createActivityLog(logData: CreateActivityLogData): Promise<ActivityLog> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          ...logData,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          student:users!activity_logs_student_id_fkey(name, email),
          attachments:activity_log_attachments(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('활동일지 생성 중 예외 발생:', error);
      throw error;
    }
  }

  // 활동일지 수정
  static async updateActivityLog(id: string, updateData: UpdateActivityLogData): Promise<ActivityLog> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          student:users!activity_logs_student_id_fkey(name, email),
          reviewer:users!activity_logs_reviewer_id_fkey(name, email),
          attachments:activity_log_attachments(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('활동일지 수정 중 예외 발생:', error);
      throw error;
    }
  }

  // 활동일지 제출
  static async submitActivityLog(id: string): Promise<ActivityLog> {
    try {
      return await this.updateActivityLog(id, {
        status: 'submitted',
      });
    } catch (error) {
      console.error('활동일지 제출 중 예외 발생:', error);
      throw error;
    }
  }

  // 활동일지 검토 (승인/반려)
  static async reviewActivityLog(
    id: string, 
    reviewerId: string, 
    status: 'approved' | 'rejected', 
    comment?: string
  ): Promise<ActivityLog> {
    try {
      return await this.updateActivityLog(id, {
        status,
        reviewer_id: reviewerId,
        review_comment: comment,
        reviewed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('활동일지 검토 중 예외 발생:', error);
      throw error;
    }
  }

  // 활동일지 삭제
  static async deleteActivityLog(id: string): Promise<void> {
    try {
      // 첨부파일도 함께 삭제
      await this.deleteActivityLogAttachments(id);

      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('활동일지 삭제 중 예외 발생:', error);
      throw error;
    }
  }

  // 첨부파일 업로드
  static async uploadAttachment(logId: string, file: File): Promise<ActivityLogAttachment> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `activity-logs/${fileName}`;

      // Supabase Storage에 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 파일 URL 가져오기
      const { data: fileUrl } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // 첨부파일 정보를 데이터베이스에 저장
      const { data, error } = await supabase
        .from('activity_log_attachments')
        .insert({
          activity_log_id: logId,
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
    } catch (error) {
      console.error('첨부파일 업로드 중 예외 발생:', error);
      throw error;
    }
  }

  // 첨부파일 삭제
  static async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_log_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
    } catch (error) {
      console.error('첨부파일 삭제 중 예외 발생:', error);
      throw error;
    }
  }

  // 활동일지의 모든 첨부파일 삭제
  static async deleteActivityLogAttachments(logId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_log_attachments')
        .delete()
        .eq('activity_log_id', logId);

      if (error) throw error;
    } catch (error) {
      console.error('활동일지 첨부파일 삭제 중 예외 발생:', error);
      throw error;
    }
  }

  // 교육생 활동일지 요약 통계
  static async getActivityLogSummary(studentId: string): Promise<ActivityLogSummary> {
    try {
      const logs = await this.getActivityLogsByStudent(studentId);
      
      const summary: ActivityLogSummary = {
        total_logs: logs.length,
        total_hours: logs.reduce((sum, log) => sum + log.hours_spent, 0),
        status_distribution: {
          draft: 0,
          submitted: 0,
          reviewed: 0,
          approved: 0,
          rejected: 0
        },
        recent_activity: '',
        monthly_hours: {}
      };

      // 상태별 분포 계산
      logs.forEach(log => {
        summary.status_distribution[log.status]++;
      });

      // 최근 활동일 계산
      if (logs.length > 0) {
        summary.recent_activity = logs[0].activity_date;
      }

      // 월별 시간 계산
      logs.forEach(log => {
        const month = log.activity_date.substring(0, 7); // YYYY-MM
        summary.monthly_hours[month] = (summary.monthly_hours[month] || 0) + log.hours_spent;
      });

      return summary;
    } catch (error) {
      console.error('활동일지 요약 통계 계산 중 예외 발생:', error);
      throw error;
    }
  }
}