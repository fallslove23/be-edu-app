import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  Cog6ToothIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

// 알림 타입 정의
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: {
    label: string;
    action: () => void;
    primary?: boolean;
  }[];
  autoClose?: boolean;
  closeDelay?: number;
  category: 'system' | 'course' | 'user' | 'exam' | 'chat';
}

// 웹소켓 연결 상태
interface WebSocketStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected?: Date;
  retryCount: number;
}

// 알림 설정
interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  categories: {
    system: boolean;
    course: boolean;
    user: boolean;
    exam: boolean;
    chat: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

// Supabase Realtime 매니저 (무료 요금제 지원)
class SupabaseRealtimeManager {
  private subscription: any = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private reconnectDelay = 1000;

  constructor(
    private onMessage: (data: any) => void,
    private onStatusChange: (status: WebSocketStatus) => void
  ) {}

  connect() {
    try {
      // Supabase Realtime 연결 (무료 요금제에서 지원)
      // 실제 환경에서는 supabase.channel()을 사용
      this.simulateSupabaseConnection();
    } catch (error) {
      console.error('Supabase Realtime connection failed:', error);
      this.handleReconnect();
    }
  }

  private simulateSupabaseConnection() {
    // Supabase Realtime 연결 시뮬레이션 (실제로는 supabase.channel() 사용)
    setTimeout(() => {
      this.onStatusChange({
        connected: true,
        reconnecting: false,
        lastConnected: new Date(),
        retryCount: this.retryCount
      });

      // Supabase에서 notifications 테이블 변경사항 구독
      this.startSupabaseMessages();
      this.startHeartbeat();
    }, 1000);
  }

  private startSupabaseMessages() {
    // 실제 환경에서는 Supabase Realtime을 통해 notifications 테이블 변경사항 수신
    // supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => this.onMessage(payload))
    const mockMessages = [
      {
        type: 'notification',
        data: {
          type: 'info',
          title: '새 과정 등록',
          message: '신입사원 교육 과정이 새로 추가되었습니다.',
          category: 'course',
          priority: 'medium',
          autoClose: true
        }
      },
      {
        type: 'notification',
        data: {
          type: 'success',
          title: '과제 제출 완료',
          message: '사용자15님이 React 기초 과제를 제출했습니다.',
          category: 'user',
          priority: 'low',
          autoClose: true
        }
      },
      {
        type: 'notification',
        data: {
          type: 'warning',
          title: '시험 시간 임박',
          message: '중급 JavaScript 시험이 30분 후 시작됩니다.',
          category: 'exam',
          priority: 'high',
          autoClose: false
        }
      },
      {
        type: 'notification',
        data: {
          type: 'error',
          title: '시스템 점검',
          message: '오늘 밤 12시부터 2시간 동안 시스템 점검이 예정되어 있습니다.',
          category: 'system',
          priority: 'critical',
          autoClose: false
        }
      }
    ];

    let messageIndex = 0;
    const sendInterval = setInterval(() => {
      if (messageIndex < mockMessages.length) {
        this.onMessage(mockMessages[messageIndex]);
        messageIndex++;
      } else {
        clearInterval(sendInterval);
        
        // 랜덤 메시지 계속 전송
        this.startRandomMessages();
      }
    }, 5000);
  }

  private startRandomMessages() {
    const randomInterval = setInterval(() => {
      const randomMessages = [
        {
          type: 'notification',
          data: {
            type: Math.random() > 0.7 ? 'warning' : 'info',
            title: '새 활동',
            message: `사용자${Math.floor(Math.random() * 100)}님이 학습을 완료했습니다.`,
            category: 'user',
            priority: 'low',
            autoClose: true
          }
        },
        {
          type: 'notification',
          data: {
            type: 'success',
            title: '과정 완료',
            message: `총 ${Math.floor(Math.random() * 50 + 10)}명이 오늘 과정을 완료했습니다.`,
            category: 'course',
            priority: 'medium',
            autoClose: true
          }
        }
      ];

      const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      this.onMessage(randomMessage);
    }, 15000 + Math.random() * 30000); // 15-45초 간격

    return randomInterval;
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      // 실제 환경에서는 ping/pong 메시지 전송
      this.onMessage({ type: 'heartbeat', timestamp: new Date() });
    }, 30000);
  }

  private handleReconnect() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.onStatusChange({
        connected: false,
        reconnecting: true,
        retryCount: this.retryCount
      });

      this.reconnectInterval = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.retryCount - 1)); // 지수 백오프
    } else {
      this.onStatusChange({
        connected: false,
        reconnecting: false,
        retryCount: this.retryCount
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  send(message: any) {
    // 실제 환경에서는 웹소켓을 통해 메시지 전송
    console.log('Sending message:', message);
  }
}

// 알림 아이템 컴포넌트
const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
  onMarkRead: () => void;
  compact?: boolean;
}> = ({ notification, onClose, onMarkRead, compact = false }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (notification.autoClose && notification.closeDelay) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(onClose, 300);
      }, notification.closeDelay);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-300';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-l-4 ${getBorderColor()} shadow-lg rounded-lg p-4 mb-3 transition-all duration-300 ${
        isClosing ? 'opacity-0 transform translate-x-full' : 'opacity-100'
      } ${!notification.read ? 'ring-2 ring-blue-200' : ''}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {notification.title}
              </h4>
              {!compact && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {notification.timestamp.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {!notification.read && (
                <button
                  onClick={onMarkRead}
                  className="text-blue-500 hover:text-blue-600 text-xs"
                  title="읽음으로 표시"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => {
                  setIsClosing(true);
                  setTimeout(onClose, 300);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex space-x-2 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`px-3 py-1 text-xs rounded font-medium ${
                    action.primary
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 알림 설정 컴포넌트
const NotificationSettings: React.FC<{
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  onClose: () => void;
}> = ({ settings, onSettingsChange, onClose }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">알림 설정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 전체 알림 설정 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">알림 활성화</span>
            <input
              type="checkbox"
              checked={localSettings.enabled}
              onChange={(e) =>
                setLocalSettings(prev => ({ ...prev, enabled: e.target.checked }))
              }
              className="rounded"
            />
          </div>

          {/* 소리 설정 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">알림 소리</span>
            <input
              type="checkbox"
              checked={localSettings.soundEnabled}
              onChange={(e) =>
                setLocalSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))
              }
              className="rounded"
            />
          </div>

          {/* 데스크탑 알림 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">데스크탑 알림</span>
            <input
              type="checkbox"
              checked={localSettings.desktopNotifications}
              onChange={(e) =>
                setLocalSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))
              }
              className="rounded"
            />
          </div>

          {/* 카테고리별 설정 */}
          <div>
            <h4 className="text-sm font-medium mb-2">카테고리별 알림</h4>
            <div className="space-y-2">
              {Object.entries(localSettings.categories).map(([category, enabled]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{category}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      setLocalSettings(prev => ({
                        ...prev,
                        categories: { ...prev.categories, [category]: e.target.checked }
                      }))
                    }
                    className="rounded"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 우선순위별 설정 */}
          <div>
            <h4 className="text-sm font-medium mb-2">우선순위별 알림</h4>
            <div className="space-y-2">
              {Object.entries(localSettings.priorities).map(([priority, enabled]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{priority}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      setLocalSettings(prev => ({
                        ...prev,
                        priorities: { ...prev.priorities, [priority]: e.target.checked }
                      }))
                    }
                    className="rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

// 메인 실시간 알림 컴포넌트
const RealTimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>({
    connected: false,
    reconnecting: false,
    retryCount: 0
  });
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    desktopNotifications: true,
    categories: {
      system: true,
      course: true,
      user: true,
      exam: true,
      chat: true
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      critical: true
    }
  });
  const [showPanel, setShowPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 웹소켓 연결 관리
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.type === 'notification') {
        addNotification(data.data);
      }
    };

    const handleStatusChange = (status: WebSocketStatus) => {
      setWsStatus(status);
    };

    wsManagerRef.current = new SupabaseRealtimeManager(handleMessage, handleStatusChange);
    wsManagerRef.current.connect();

    return () => {
      wsManagerRef.current?.disconnect();
    };
  }, []);

  // 알림 추가
  const addNotification = useCallback((notificationData: Partial<Notification>) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type: notificationData.type || 'info',
      title: notificationData.title || '알림',
      message: notificationData.message || '',
      timestamp: new Date(),
      read: false,
      priority: notificationData.priority || 'medium',
      category: notificationData.category || 'system',
      autoClose: notificationData.autoClose !== false,
      closeDelay: notificationData.closeDelay || 5000,
      ...notificationData
    };

    // 설정에 따른 필터링
    if (!settings.enabled) return;
    if (!settings.categories[notification.category]) return;
    if (!settings.priorities[notification.priority]) return;

    setNotifications(prev => [notification, ...prev]);

    // 소리 재생
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // 데스크탑 알림
    if (settings.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/icon-192x192.svg'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icons/icon-192x192.svg'
            });
          }
        });
      }
    }
  }, [settings]);

  // 읽지 않은 알림 수 계산
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // 알림 제거
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 알림 읽음 처리
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 모든 알림 제거
  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative">
      {/* 알림 소리 */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
      </audio>

      {/* 알림 버튼 */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={`relative p-2 rounded-lg transition-colors ${
            wsStatus.connected
              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              : 'text-red-600 hover:text-red-800 hover:bg-red-50'
          }`}
          title={wsStatus.connected ? '알림' : '연결 끊김'}
        >
          <BellIcon className="h-6 w-6" />
          
          {/* 읽지 않은 알림 배지 */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* 연결 상태 표시 */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            wsStatus.connected ? 'bg-green-500' : wsStatus.reconnecting ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </button>

        {/* 알림 패널 */}
        {showPanel && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">알림</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="설정"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </button>
                  {settings.soundEnabled ? (
                    <SpeakerWaveIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <SpeakerXMarkIcon className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* 연결 상태 */}
              <div className="flex items-center space-x-2 mt-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  wsStatus.connected ? 'bg-green-500' : wsStatus.reconnecting ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {wsStatus.connected ? '연결됨' : wsStatus.reconnecting ? '재연결 중...' : '연결 끊김'}
                </span>
                {wsStatus.lastConnected && (
                  <span className="text-xs text-gray-400">
                    (마지막: {wsStatus.lastConnected.toLocaleTimeString()})
                  </span>
                )}
              </div>

              {/* 액션 버튼 */}
              {notifications.length > 0 && (
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    모두 읽음
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    모두 삭제
                  </button>
                </div>
              )}
            </div>

            {/* 알림 목록 */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClose={() => removeNotification(notification.id)}
                      onMarkRead={() => markAsRead(notification.id)}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 알림 설정 모달 */}
      {showSettings && (
        <NotificationSettings
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 플로팅 알림 (최신 알림만 표시) */}
      <div className="fixed top-4 right-4 z-40 w-80">
        {notifications
          .filter(n => !n.read && n.autoClose)
          .slice(0, 3)
          .map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
              onMarkRead={() => markAsRead(notification.id)}
            />
          ))}
      </div>
    </div>
  );
};

export { RealTimeNotifications, SupabaseRealtimeManager };
export type { Notification, NotificationSettings, WebSocketStatus };
export default RealTimeNotifications;