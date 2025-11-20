import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  TrophyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  category: 'score' | 'course' | 'schedule' | 'report' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  position = 'top-right', 
  maxVisible = 5 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // 초기 알림 데이터 생성 (실제로는 서버에서 받아옴)
    const generateSampleNotifications = (): Notification[] => {
      const now = new Date();
      return [
        {
          id: 'notif-1',
          type: 'urgent',
          category: 'score',
          title: '점수 입력 기한 임박',
          message: 'BS-2025-01 1차 과정의 점수 입력 기한이 내일까지입니다.',
          actionUrl: '/student-management',
          actionLabel: '점수 입력하기',
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif-2',
          type: 'info',
          category: 'course',
          title: '새로운 과정 개설',
          message: 'BS-2025-04 4차 과정이 3월에 개설 예정입니다.',
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif-3',
          type: 'warning',
          category: 'schedule',
          title: '오늘의 강의 일정 변경',
          message: '오늘 오후 2시 강의가 3시로 변경되었습니다.',
          actionUrl: '/today-lecture',
          actionLabel: '일정 확인',
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif-4',
          type: 'success',
          category: 'report',
          title: '월간 성과 리포트 완성',
          message: '1월 성과 리포트가 성공적으로 생성되었습니다.',
          actionUrl: '/analytics',
          actionLabel: '리포트 보기',
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
          readAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'notif-5',
          type: 'info',
          category: 'system',
          title: '시스템 업데이트',
          message: '새로운 기능이 추가되었습니다. 성과 리포트 자동 생성 기능을 확인해보세요.',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    };

    setNotifications(generateSampleNotifications());
    
    // 5분마다 새 알림 확인
    const interval = setInterval(() => {
      // 실제로는 서버에서 새 알림을 가져옴
      checkForNewNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 읽지 않은 알림 확인
    const unread = notifications.some(n => !n.readAt);
    setHasUnread(unread);
  }, [notifications]);

  const checkForNewNotifications = () => {
    // 실제로는 API 호출로 새 알림을 가져옴
    // 여기서는 랜덤하게 새 알림을 생성
    if (Math.random() > 0.7) {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)] as any,
        category: 'system',
        title: '새로운 알림',
        message: '시스템에서 새로운 업데이트가 있습니다.',
        createdAt: new Date().toISOString()
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, readAt: new Date().toISOString() }
          : n
      )
    );
  };

  const markAllAsRead = () => {
    const now = new Date().toISOString();
    setNotifications(prev => 
      prev.map(n => ({ ...n, readAt: n.readAt || now }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleActionClick = (notification: Notification) => {
    if (notification.actionUrl) {
      // 실제 라우팅 로직 (여기서는 시뮬레이션)
      console.log('Navigate to:', notification.actionUrl);
    }
    markAsRead(notification.id);
  };

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'urgent') return <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />;
    if (type === 'warning') return <ExclamationTriangleIcon className="h-5 w-5 text-foreground" />;
    if (type === 'success') return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    
    switch (category) {
      case 'score': return <TrophyIcon className="h-5 w-5 text-blue-500" />;
      case 'course': return <DocumentTextIcon className="h-5 w-5 text-purple-500" />;
      case 'schedule': return <CalendarDaysIcon className="h-5 w-5 text-orange-500" />;
      case 'report': return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-l-red-500 bg-destructive/10';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'success': return 'border-l-green-500 bg-green-500/10';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <>
      {/* 알림 벨 아이콘 */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="알림"
        >
          {hasUnread ? (
            <BellSolidIcon className="h-6 w-6" />
          ) : (
            <BellIcon className="h-6 w-6" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-lg h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* 알림 드롭다운 */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            {/* 헤더 */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">알림</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, maxVisible).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.readAt ? 'bg-blue-25' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.readAt ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-1">
                              {!notification.readAt && (
                                <div className="w-2 h-2 bg-blue-500 rounded-lg"></div>
                              )}
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.actionUrl && notification.actionLabel && (
                              <button
                                onClick={() => handleActionClick(notification)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {notification.actionLabel}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">새로운 알림이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            {notifications.length > maxVisible && (
              <div className="px-4 py-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium rounded-full">
                  모든 알림 보기 ({notifications.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 외부 클릭으로 드롭다운 닫기 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default NotificationSystem;