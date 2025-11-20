import { supabase } from './supabase';

// =====================================================
// 타입 정의
// =====================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'early_leave';

export interface AttendanceRecord {
  id: string;
  curriculum_item_id: string;
  trainee_id: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  location?: string;
  device_info?: string;
  checked_by?: string;
  created_at: string;
  updated_at: string;

  // 조인 데이터
  trainee?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  curriculum_item?: {
    id: string;
    title: string;
    date: string;
    day: number;
    start_time: string;
    end_time: string;
  };
}

export interface AttendanceStatistics {
  session_id: string;
  curriculum_item_id: string;
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
  curriculum_item_id: string;
  trainee_id: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  location?: string;
  device_info?: string;
}

// =====================================================
// 출석 관리 서비스
// =====================================================

export class AttendanceService {
  /**
   * 특정 커리큘럼 항목의 출석 기록 조회
   */
  static async getAttendanceRecords(curriculumItemId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        trainee:trainees!trainee_id(id, name, email, phone),
        curriculum_item:curriculum_items!curriculum_item_id(id, title, date, day, start_time, end_time)
      `)
      .eq('curriculum_item_id', curriculumItemId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * 교육생별 출석 기록 조회
   */
  static async getTraineeAttendance(traineeId: string, sessionId?: string): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        trainee:trainees!trainee_id(id, name, email, phone),
        curriculum_item:curriculum_items!curriculum_item_id(
          id, title, date, day, start_time, end_time, session_id
        )
      `)
      .eq('trainee_id', traineeId);

    if (sessionId) {
      query = query.eq('curriculum_item.session_id', sessionId);
    }

    const { data, error } = await query.order('curriculum_item.date', { ascending: false });

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
        onConflict: 'curriculum_item_id,trainee_id',
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
        onConflict: 'curriculum_item_id,trainee_id',
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
    updates: Partial<AttendanceCheckData>
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
      .order('date', { ascending: true })
      .order('order_index', { ascending: true });

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

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 커리큘럼 항목별 출석 대상 교육생 목록 조회
   */
  static async getAttendanceTargets(curriculumItemId: string) {
    // 커리큘럼 항목 정보 조회
    const { data: curriculumItem, error: curriculumError } = await supabase
      .from('curriculum_items')
      .select('session_id')
      .eq('id', curriculumItemId)
      .single();

    if (curriculumError) throw curriculumError;

    // 해당 세션에 등록된 교육생 목록 조회
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('round_enrollments')
      .select(`
        trainee:trainees!trainee_id(
          id,
          name,
          email,
          phone,
          department
        )
      `)
      .eq('round_id', curriculumItem.session_id)
      .eq('status', 'active');

    if (enrollmentError) throw enrollmentError;

    // 이미 출석 체크된 교육생 확인
    const { data: existingRecords, error: recordError } = await supabase
      .from('attendance_records')
      .select('trainee_id, status')
      .eq('curriculum_item_id', curriculumItemId);

    if (recordError) throw recordError;

    const recordMap = new Map(
      existingRecords?.map(r => [r.trainee_id, r.status]) || []
    );

    return (enrollments || []).map(e => ({
      ...e.trainee,
      attendance_status: recordMap.get(e.trainee.id) || null,
    }));
  }

  /**
   * QR 코드 기반 출석 체크
   */
  static async checkInWithQR(
    qrCode: string,
    traineeId: string,
    location?: string
  ): Promise<AttendanceRecord> {
    // QR 코드에서 curriculum_item_id 추출 (QR 코드 형식: CURRICULUM_ITEM_ID:TIMESTAMP)
    const [curriculumItemId] = qrCode.split(':');

    // 커리큘럼 항목이 유효한지 확인
    const { data: curriculumItem, error: curriculumError } = await supabase
      .from('curriculum_items')
      .select('id, date, start_time, end_time')
      .eq('id', curriculumItemId)
      .single();

    if (curriculumError || !curriculumItem) {
      throw new Error('유효하지 않은 QR 코드입니다.');
    }

    // 출석 체크
    const now = new Date();
    const sessionStart = new Date(`${curriculumItem.date}T${curriculumItem.start_time}`);
    const lateThreshold = new Date(sessionStart.getTime() + 10 * 60000); // 10분 후

    let status: AttendanceStatus = 'present';
    if (now > lateThreshold) {
      status = 'late';
    }

    return this.checkAttendance({
      curriculum_item_id: curriculumItemId,
      trainee_id: traineeId,
      status,
      check_in_time: now.toISOString(),
      location,
      device_info: navigator.userAgent,
    });
  }

  /**
   * 자동 결석 처리 실행
   */
  static async runAutoAbsentMarking(): Promise<void> {
    const { error } = await supabase.rpc('auto_mark_absent_after_session');

    if (error) throw error;
  }

  /**
   * 출석 엑셀 내보내기 데이터 생성
   */
  static async getAttendanceExportData(sessionId: string) {
    const summary = await this.getTraineeAttendanceSummary(sessionId);
    const statistics = await this.getAttendanceStatistics(sessionId);

    return {
      summary,
      statistics,
      exportDate: new Date().toISOString(),
    };
  }
}
