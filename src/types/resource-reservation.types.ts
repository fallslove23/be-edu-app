/**
 * =================================================
 * 자원 예약 타입 정의
 * =================================================
 * 설명: 강의실 예약 및 충돌 검증 관련 타입
 * 작성일: 2025-01-24
 * =================================================
 */

export interface ResourceReservation {
  curriculum_item_id: string;
  classroom_id: string;
  date: string;                    // YYYY-MM-DD
  start_time: string;              // HH:MM:SS
  end_time: string;                // HH:MM:SS
  subject: string;                 // 과목명
  instructor_name?: string;
  round_name?: string;
}

export interface ConflictInfo {
  has_conflict: boolean;
  conflicting_reservations: ResourceReservation[];
  message?: string;
}

export interface AvailableClassroom {
  id: string;
  name: string;
  location: string;
  capacity: number;
  facilities: string[];
  equipment: string[];
  is_available: boolean;
}

export interface ClassroomAssignmentRequest {
  curriculum_item_id: string;
  classroom_id: string;
}

export interface ClassroomAssignmentResult {
  success: boolean;
  message: string;
}

export interface BulkAssignmentResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export interface ClassroomScheduleQuery {
  classroom_id: string;
  start_date: string;
  end_date: string;
}

export interface AvailableClassroomQuery {
  date: string;
  start_time: string;
  end_time: string;
  min_capacity?: number;
}
