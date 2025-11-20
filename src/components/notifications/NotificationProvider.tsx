import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // ms, undefined = 영구
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<boolean>;
  showBrowserNotification: (title: string, body: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export function NotificationProvider({ children, maxNotifications = 5 }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // 브라우저 알림 권한 확인
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // 브라우저 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission === 'granted';
    }

    return false;
  }, []);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback(
    (title: string, body: string, options?: NotificationOptions) => {
      if (browserPermission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });

        // 알림 클릭 시 창 포커스
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    },
    [browserPermission]
  );

  // 토스트 알림 추가
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      // 자동 제거
      if (notification.duration !== undefined) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
      }

      // 브라우저 알림도 함께 표시 (선택적)
      if (notification.type === 'success' || notification.type === 'error') {
        showBrowserNotification(notification.title, notification.message);
      }
    },
    [maxNotifications, showBrowserNotification]
  );

  // 알림 제거
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // 모두 제거
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        requestPermission,
        showBrowserNotification,
      }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

// 알림 컨테이너 (화면에 표시)
interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

// 개별 토스트
interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // 애니메이션 후 제거
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <ExclamationCircleIcon className="h-6 w-6 text-foreground" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500/10 border-green-200';
      case 'error':
        return 'bg-destructive/10 border-destructive/50';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`pointer-events-auto bg-white rounded-full shadow-2xl border-2 p-4 min-w-[320px] max-w-md transition-all duration-300 ${
        isExiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0 animate-slide-in'
      } ${getBgColor()}`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{notification.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// 편의 함수 Hooks
export function useNotify() {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message: string, duration = 5000) =>
      addNotification({ type: 'success', title, message, duration }),
    error: (title: string, message: string, duration = 7000) =>
      addNotification({ type: 'error', title, message, duration }),
    warning: (title: string, message: string, duration = 6000) =>
      addNotification({ type: 'warning', title, message, duration }),
    info: (title: string, message: string, duration = 5000) =>
      addNotification({ type: 'info', title, message, duration }),
  };
}

// CSS 애니메이션
const styles = `
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
`;

// 스타일 삽입
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
