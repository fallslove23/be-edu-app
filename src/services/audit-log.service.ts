/**
 * =================================================
 * 감사 로그 서비스
 * =================================================
 * 설명: 시스템 변경 이력 추적 및 조회
 * 작성일: 2025-01-24
 * =================================================
 */

import { supabase } from './supabase';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  changed_fields?: string[];
  user_id?: string;
  user_email?: string;
  user_role?: string;
  ip_address?: string;
  user_agent?: string;
  logged_at: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLogFilter {
  table_name?: string;
  record_id?: string;
  operation?: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id?: string;
  start_date?: string;
  end_date?: string;
  severity?: string;
  limit?: number;
}

export class AuditLogService {
  /**
   * 감사 로그 조회
   */
  static async getAuditLogs(filters?: AuditLogFilter): Promise<AuditLog[]> {
    try {
      console.log('[AuditLogService] Fetching audit logs with filters:', filters);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('logged_at', { ascending: false });

      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters?.record_id) {
        query = query.eq('record_id', filters.record_id);
      }

      if (filters?.operation) {
        query = query.eq('operation', filters.operation);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.start_date) {
        query = query.gte('logged_at', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('logged_at', filters.end_date);
      }

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100); // 기본 100개
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AuditLogService] Error fetching audit logs:', error);
        throw error;
      }

      console.log(`[AuditLogService] Found ${data?.length || 0} audit logs`);
      return data || [];
    } catch (error: any) {
      console.error('[AuditLogService] Error:', error);
      throw error;
    }
  }

  /**
   * 특정 레코드의 변경 이력 조회
   */
  static async getRecordHistory(
    tableName: string,
    recordId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    try {
      console.log('[AuditLogService] Fetching history for:', tableName, recordId);

      const { data, error } = await supabase.rpc('get_audit_history', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_limit: limit
      });

      if (error) {
        console.error('[AuditLogService] Error fetching record history:', error);
        // RPC 함수가 없는 경우 fallback
        return this.getAuditLogs({
          table_name: tableName,
          record_id: recordId,
          limit
        });
      }

      console.log(`[AuditLogService] Found ${data?.length || 0} history records`);
      return data || [];
    } catch (error: any) {
      console.error('[AuditLogService] Error:', error);
      throw error;
    }
  }

  /**
   * 최근 감사 로그 조회
   */
  static async getRecentLogs(hours: number = 24, limit: number = 100): Promise<AuditLog[]> {
    try {
      console.log('[AuditLogService] Fetching recent logs:', hours, 'hours');

      const { data, error } = await supabase.rpc('get_recent_audit_logs', {
        p_hours: hours,
        p_limit: limit
      });

      if (error) {
        console.error('[AuditLogService] Error fetching recent logs:', error);
        // RPC 함수가 없는 경우 fallback
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - hours);

        return this.getAuditLogs({
          start_date: startDate.toISOString(),
          limit
        });
      }

      console.log(`[AuditLogService] Found ${data?.length || 0} recent logs`);
      return data || [];
    } catch (error: any) {
      console.error('[AuditLogService] Error:', error);
      throw error;
    }
  }

  /**
   * 수동 감사 로그 생성 (트리거 외 추가 로깅)
   */
  static async createLog(logData: {
    table_name: string;
    record_id: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data?: any;
    new_data?: any;
    user_id?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<AuditLog> {
    try {
      console.log('[AuditLogService] Creating manual audit log');

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          table_name: logData.table_name,
          record_id: logData.record_id,
          operation: logData.operation,
          old_data: logData.old_data,
          new_data: logData.new_data,
          user_id: logData.user_id,
          description: logData.description,
          severity: logData.severity || 'medium',
          logged_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[AuditLogService] Error creating audit log:', error);
        throw error;
      }

      console.log('[AuditLogService] ✅ Audit log created');
      return data;
    } catch (error: any) {
      console.error('[AuditLogService] Error:', error);
      throw error;
    }
  }

  /**
   * 감사 로그 통계
   */
  static async getLogStatistics(days: number = 7): Promise<{
    total_logs: number;
    by_operation: Record<string, number>;
    by_table: Record<string, number>;
    by_severity: Record<string, number>;
  }> {
    try {
      console.log('[AuditLogService] Calculating log statistics for', days, 'days');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('operation, table_name, severity')
        .gte('logged_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total_logs: data?.length || 0,
        by_operation: {} as Record<string, number>,
        by_table: {} as Record<string, number>,
        by_severity: {} as Record<string, number>
      };

      data?.forEach(log => {
        // Operation별 집계
        stats.by_operation[log.operation] = (stats.by_operation[log.operation] || 0) + 1;

        // Table별 집계
        stats.by_table[log.table_name] = (stats.by_table[log.table_name] || 0) + 1;

        // Severity별 집계
        if (log.severity) {
          stats.by_severity[log.severity] = (stats.by_severity[log.severity] || 0) + 1;
        }
      });

      console.log('[AuditLogService] Statistics calculated:', stats.total_logs, 'logs');
      return stats;
    } catch (error: any) {
      console.error('[AuditLogService] Error:', error);
      throw error;
    }
  }

  /**
   * 오래된 감사 로그 아카이빙/삭제
   */
  static async archiveLogs(olderThanDays: number = 90): Promise<number> {
    try {
      console.log('[AuditLogService] Archiving logs older than', olderThanDays, 'days');

      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('logged_at', archiveDate.toISOString())
        .select('id');

      if (error) {
        console.error('[AuditLogService] Error archiving logs:', error);
        throw error;
      }

      const deletedCount = data?.length || 0;
      console.log(`[AuditLogService] ✅ Archived ${deletedCount} old logs`);
      return deletedCount;
    } catch (error: any) {
      console.error('[AuditLogService] Error:', error);
      throw error;
    }
  }
}
