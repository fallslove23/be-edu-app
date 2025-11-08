/**
 * 데이터베이스 기반 알림 서비스
 * - 과정/일정 관련 알림 생성, 조회, 읽음 처리
 * - 실시간 알림 구독 (Supabase Realtime)
 */

import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'course_start' | 'course_updated' | 'conflict_detected' | 'course_confirmed' | 'session_changed';
  title: string;
  message: string;
  link?: string;
  related_course_id?: string;
  related_session_id?: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  course_start_enabled: boolean;
  course_update_enabled: boolean;
  conflict_enabled: boolean;
  course_confirmed_enabled: boolean;
  session_change_enabled: boolean;
  days_before_start: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
  related_course_id?: string;
  related_session_id?: string;
  priority?: Notification['priority'];
}

class NotificationDBService {
  /**
   * 알림 목록 조회 (최신순)
   */
  async getNotifications(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Notification[];
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * 단일 사용자에게 알림 생성
   */
  async createNotification(params: CreateNotificationParams) {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: params.user_id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        related_course_id: params.related_course_id,
        related_session_id: params.related_session_id,
        priority: params.priority || 'normal',
      }]);

    if (error) throw error;
  }

  /**
   * 과정 시작 알림 생성
   */
  async notifyCourseStart(courseId: string, courseTitle: string, startDate: string, userIds: string[]) {
    const daysUntilStart = Math.ceil(
      (new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const title = '과정 시작 예정';
    const message = `"${courseTitle}" 과정이 ${daysUntilStart}일 후 시작됩니다. (${new Date(startDate).toLocaleDateString('ko-KR')})`;

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'course_start' as const,
      title,
      message,
      related_course_id: courseId,
      priority: 'normal' as const
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  }

  /**
   * 과정 변경 알림
   */
  async notifyCourseUpdated(courseId: string, courseTitle: string, changes: string, userIds: string[]) {
    const title = '과정 정보 변경';
    const message = `"${courseTitle}" 과정 정보가 변경되었습니다.\n${changes}`;

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'course_updated' as const,
      title,
      message,
      related_course_id: courseId,
      priority: 'normal' as const
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  }

  /**
   * 과정 확정 알림
   */
  async notifyCourseConfirmed(courseId: string, courseTitle: string, userIds: string[]) {
    const title = '과정 확정';
    const message = `"${courseTitle}" 과정이 확정되었습니다. 일정을 확인해주세요.`;

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'course_confirmed' as const,
      title,
      message,
      related_course_id: courseId,
      priority: 'high' as const
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  }

  /**
   * 일정 충돌 알림
   */
  async notifyConflict(
    userId: string,
    conflictType: 'classroom' | 'instructor',
    details: string
  ) {
    const title = conflictType === 'classroom' ? '강의실 충돌 감지' : '강사 일정 충돌 감지';
    const message = `일정 충돌이 감지되었습니다.\n${details}`;

    await this.createNotification({
      user_id: userId,
      type: 'conflict_detected',
      title,
      message,
      priority: 'urgent'
    });
  }

  /**
   * 일정 변경 알림
   */
  async notifySessionChanged(
    courseId: string,
    courseTitle: string,
    sessionTitle: string,
    changes: string,
    userIds: string[]
  ) {
    const title = '일정 변경';
    const message = `"${courseTitle}" - ${sessionTitle}\n${changes}`;

    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: 'session_changed' as const,
      title,
      message,
      related_course_id: courseId,
      priority: 'high' as const
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  }

  /**
   * 알림 설정 조회
   */
  async getPreferences(userId: string): Promise<NotificationPreference | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data as NotificationPreference | null;
  }

  /**
   * 알림 설정 저장/업데이트
   */
  async savePreferences(userId: string, preferences: Partial<NotificationPreference>) {
    // 기존 설정 확인
    const existing = await this.getPreferences(userId);

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // 생성
      const { error } = await supabase
        .from('notification_preferences')
        .insert([{
          user_id: userId,
          ...preferences
        }]);

      if (error) throw error;
    }
  }

  /**
   * 최신 알림 조회 (마지막 조회 시간 이후)
   * 폴링 방식으로 새 알림 확인
   */
  async getNewNotifications(userId: string, lastCheckTime: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .gt('created_at', lastCheckTime)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  }
}

export const notificationDBService = new NotificationDBService();
