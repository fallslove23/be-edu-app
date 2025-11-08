/**
 * 알림 헬퍼 함수들
 * 과정/일정 관리에서 사용하기 위한 알림 생성 유틸리티
 */

import { notificationDBService } from '../services/notification-db.service';

/**
 * 과정 확정 시 알림 전송
 */
export async function notifyOnCourseConfirmed(
  courseId: string,
  courseTitle: string,
  enrolledUserIds: string[]
) {
  try {
    await notificationDBService.notifyCourseConfirmed(
      courseId,
      courseTitle,
      enrolledUserIds
    );
    console.log(`✅ 과정 확정 알림 전송 완료: ${courseTitle}`);
  } catch (error) {
    console.error('과정 확정 알림 전송 실패:', error);
  }
}

/**
 * 과정 변경 시 알림 전송
 */
export async function notifyOnCourseUpdated(
  courseId: string,
  courseTitle: string,
  changes: string,
  enrolledUserIds: string[]
) {
  try {
    await notificationDBService.notifyCourseUpdated(
      courseId,
      courseTitle,
      changes,
      enrolledUserIds
    );
    console.log(`✅ 과정 변경 알림 전송 완료: ${courseTitle}`);
  } catch (error) {
    console.error('과정 변경 알림 전송 실패:', error);
  }
}

/**
 * 일정 변경 시 알림 전송
 */
export async function notifyOnSessionChanged(
  courseId: string,
  courseTitle: string,
  sessionTitle: string,
  changes: string,
  enrolledUserIds: string[]
) {
  try {
    await notificationDBService.notifySessionChanged(
      courseId,
      courseTitle,
      sessionTitle,
      changes,
      enrolledUserIds
    );
    console.log(`✅ 일정 변경 알림 전송 완료: ${sessionTitle}`);
  } catch (error) {
    console.error('일정 변경 알림 전송 실패:', error);
  }
}

/**
 * 일정 충돌 감지 시 알림 전송
 */
export async function notifyOnConflictDetected(
  userId: string,
  conflictType: 'classroom' | 'instructor',
  details: string
) {
  try {
    await notificationDBService.notifyConflict(userId, conflictType, details);
    console.log(`⚠️ 일정 충돌 알림 전송 완료: ${conflictType}`);
  } catch (error) {
    console.error('일정 충돌 알림 전송 실패:', error);
  }
}

/**
 * 과정 시작 알림 예약
 */
export async function scheduleCourseStartNotification(
  courseId: string,
  courseTitle: string,
  startDate: string,
  enrolledUserIds: string[]
) {
  try {
    await notificationDBService.notifyCourseStart(
      courseId,
      courseTitle,
      startDate,
      enrolledUserIds
    );
    console.log(`📅 과정 시작 알림 예약 완료: ${courseTitle}`);
  } catch (error) {
    console.error('과정 시작 알림 예약 실패:', error);
  }
}

/**
 * 등록된 교육생 ID 목록 가져오기
 */
export async function getEnrolledUserIds(courseId: string): Promise<string[]> {
  // 실제 구현에서는 Supabase에서 등록된 교육생 목록을 가져와야 합니다
  // 현재는 빈 배열 반환
  return [];
}
