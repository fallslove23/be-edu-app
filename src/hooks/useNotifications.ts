import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '../components/common/NotificationSystem';

interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = (): NotificationHookReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 초기 알림 데이터 로드
  useEffect(() => {
    loadInitialNotifications();
  }, []);

  const loadInitialNotifications = () => {
    // 실제로는 서버에서 데이터를 가져옴
    const initialNotifications: Notification[] = [
      {
        id: 'init-1',
        type: 'info',
        category: 'system',
        title: '시스템 알림',
        message: 'BS 학습 관리 시스템에 오신 것을 환영합니다!',
        createdAt: new Date().toISOString()
      }
    ];
    
    setNotifications(initialNotifications);
  };

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // 브라우저 알림 표시 (긴급하거나 중요한 알림만)
    if (
      (notification.type === 'urgent' || notification.type === 'warning') &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, readAt: new Date().toISOString() }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        readAt: notification.readAt || now
      }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
};

// 특정 상황에서 사용할 수 있는 미리 정의된 알림 생성 함수들
export const createScoreDeadlineNotification = (courseCode: string, deadline: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'urgent',
  category: 'score',
  title: '점수 입력 기한 임박',
  message: `${courseCode} 과정의 점수 입력 기한이 ${deadline}까지입니다.`,
  actionUrl: '/student-management',
  actionLabel: '점수 입력하기',
  expiresAt: new Date(deadline).toISOString()
});

export const createCourseStartNotification = (courseName: string, startDate: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'info',
  category: 'course',
  title: '새 과정 시작',
  message: `${courseName}이(가) ${startDate}에 시작됩니다.`,
  actionUrl: '/courses',
  actionLabel: '과정 보기'
});

export const createReportGeneratedNotification = (reportName: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'success',
  category: 'report',
  title: '리포트 생성 완료',
  message: `${reportName}이(가) 성공적으로 생성되었습니다.`,
  actionUrl: '/analytics',
  actionLabel: '리포트 보기'
});

export const createBackupCompleteNotification = (backupName: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'success',
  category: 'system',
  title: '백업 완료',
  message: `"${backupName}" 백업이 성공적으로 완료되었습니다.`,
  actionUrl: '/backup',
  actionLabel: '백업 관리'
});

export const createRestoreCompleteNotification = (backupName: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'success',
  category: 'system',
  title: '복구 완료',
  message: `"${backupName}"로부터 데이터 복구가 완료되었습니다.`,
  actionUrl: '/backup',
  actionLabel: '백업 관리'
});

export const createScheduleChangeNotification = (changeDetails: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'warning',
  category: 'schedule',
  title: '일정 변경 안내',
  message: changeDetails,
  actionUrl: '/today-lecture',
  actionLabel: '일정 확인'
});

export const createSystemUpdateNotification = (updateDetails: string): Omit<Notification, 'id' | 'createdAt'> => ({
  type: 'info',
  category: 'system',
  title: '시스템 업데이트',
  message: updateDetails
});