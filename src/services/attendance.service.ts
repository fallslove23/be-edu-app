import { supabase } from './supabase';

// =====================================================
// 타입 정의
// =====================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  trainee_id: string;
  session_id: string;
  schedule_id?: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStatistics {
  session_id: string;
  curriculum_item_id: string | null;
  date: string;
  day: number;
  order_index: number;
  session_title: string;
  total_checked: number;
  total_enrolled: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  early_leave_count: number;
  not_checked_count: number;
  attendance_rate: number;
}

export interface TraineeAttendanceSummary {
  trainee_id: string;
  trainee_name: string;
  email?: string;
  session_id: string;
  session_name: string;
  session_code: string;
  total_sessions: number;
  attended_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  early_leave_count: number;
  not_attended_count: number;
  attendance_rate: number;
  can_complete: boolean;
}

export interface DailyAttendanceOverview {
  date: string;
  session_id: string;
  session_name: string;
  session_code: string;
  day: number;
  total_sessions: number;
  total_attendances: number;
  total_enrolled: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  daily_attendance_rate: number;
}

export interface AttendanceCheckData {
  session_id: string;
  trainee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
}

export interface AttendanceTarget {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  attendance_status: AttendanceStatus | null;
}

// =====================================================
// 출석 관리 서비스
// =====================================================

export class AttendanceService {
  /**
   * 특정 날짜와 세션의 출석 대상 교육생 목록 조회
   */
  static async getAttendanceTargets(
    sessionId: string,
    attendanceDate: string
  ): Promise<AttendanceTarget[]> {
    try {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('round_enrollments')
        .select(`
          trainee:users!trainee_id(
            id,
            name,
            email,
            phone,
            department
          )
        `)
        .eq('round_id', sessionId)
        .eq('status', 'active');

      if (enrollmentError) throw enrollmentError;

      const { data: existingRecords, error: recordError } = await supabase
        .from('attendance_records')
        .select('trainee_id, status')
        .eq('session_id', sessionId)
        .eq('attendance_date', attendanceDate);

      if (recordError) throw recordError;

      const recordMap = new Map(
        existingRecords?.map(r => [r.trainee_id, r.status]) || []
      );

      return (enrollments || []).map(e => ({
        ...e.trainee,
        attendance_status: recordMap.get(e.trainee.id) || null,
      }));
    } catch (error: any) {
      console.error('[AttendanceService] Error getting attendance targets:', error);
      throw error;
    }
  }

  /**
   * 특정 날짜와 세션의 출석 기록 조회
   */
  static async getAttendanceRecords(
    sessionId: string,
    attendanceDate: string
  ): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .eq('attendance_date', attendanceDate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * 출석 체크 (단일)
   */
  static async checkAttendance(data: AttendanceCheckData): Promise<AttendanceRecord> {
    const recordData = {
      ...data,
      check_in_time: data.check_in_time || new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('attendance_records')
      .upsert(recordData, {
        onConflict: 'trainee_id,attendance_date,session_id',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * 출석 체크 (일괄)
   */
  static async checkAttendanceBulk(records: AttendanceCheckData[]): Promise<AttendanceRecord[]> {
    const recordsWithTime = records.map(record => ({
      ...record,
      check_in_time: record.check_in_time || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(recordsWithTime, {
        onConflict: 'trainee_id,attendance_date,session_id',
      })
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * 출석 기록 수정
   */
  static async updateAttendance(
    id: string,
    updates: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 출석 기록 삭제
   */
  static async deleteAttendance(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * 세션별 출석 통계 조회
   */
  static async getAttendanceStatistics(sessionId: string): Promise<AttendanceStatistics[]> {
    const { data, error } = await supabase
      .from('attendance_statistics')
      .select('*')
      .eq('session_id', sessionId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * 교육생별 출석 현황 조회
   */
  static async getTraineeAttendanceSummary(
    sessionId?: string,
    traineeId?: string
  ): Promise<TraineeAttendanceSummary[]> {
    let query = supabase.from('trainee_attendance_summary').select('*');

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (traineeId) {
      query = query.eq('trainee_id', traineeId);
    }

    const { data, error } = await query.order('trainee_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * 일별 출석 현황 조회
   */
  static async getDailyAttendanceOverview(
    startDate?: string,
    endDate?: string,
    sessionId?: string
  ): Promise<DailyAttendanceOverview[]> {
    let query = supabase.from('daily_attendance_overview').select('*');

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error} = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
