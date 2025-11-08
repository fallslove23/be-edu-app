import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Settings, X } from 'lucide-react';
import { notificationDBService, Notification } from '../../services/notification-db.service';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationCenterProps {
  onNavigate?: (view: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>(new Date().toISOString());

  // 알림 목록 로드
  const loadNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await notificationDBService.getNotifications(user.id);
      setNotifications(data);

      const count = await notificationDBService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 알림 확인 함수
  const checkNewNotifications = async () => {
    if (!user?.id) return;

    try {
      const newNotifications = await notificationDBService.getNewNotifications(
        user.id,
        lastCheckTime
      );

      if (newNotifications.length > 0) {
        // 새 알림을 기존 목록에 추가
        setNotifications((prev) => [...newNotifications, ...prev]);
        setUnreadCount((prev) => prev + newNotifications.length);
        setLastCheckTime(new Date().toISOString());

        // 브라우저 알림 표시
        newNotifications.forEach((notification) => {
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: notification.id
            });
          }
        });
      }
    } catch (error) {
      console.error('새 알림 확인 실패:', error);
    }
  };

  // 실시간 알림 구독 (폴링 방식 - Realtime 미지원 시)
  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    // 30초마다 새 알림 확인
    const pollingInterval = setInterval(() => {
      checkNewNotifications();
    }, 30000); // 30초

    return () => {
      clearInterval(pollingInterval);
    };
  }, [user?.id, lastCheckTime]);

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationDBService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await notificationDBService.markAllAsRead(user.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 삭제
  const handleDelete = async (notificationId: string) => {
    try {
      await notificationDBService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // 우선순위에 따른 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // 알림 타입 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course_start':
        return '🎓';
      case 'course_updated':
        return '📝';
      case 'conflict_detected':
        return '⚠️';
      case 'course_confirmed':
        return '✅';
      case 'session_changed':
        return '📅';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* 알림 벨 아이콘 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="알림"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigate) {
                    onNavigate('notification-settings');
                  } else {
                    window.location.hash = 'notification-settings';
                  }
                }}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="알림 설정"
              >
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="닫기"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">로딩 중...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 아이콘 */}
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority === 'urgent'
                              ? '긴급'
                              : notification.priority === 'high'
                              ? '높음'
                              : notification.priority === 'normal'
                              ? '보통'
                              : '낮음'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-700"
                                title="읽음으로 표시"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // 전체 알림 페이지로 이동 (향후 구현)
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                모든 알림 보기
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default NotificationCenter;
