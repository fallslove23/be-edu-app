import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  BellSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { notificationService, NotificationPermissionState } from '../../services/notification.service';

const NotificationPermission: React.FC = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    supported: false,
    serviceWorkerReady: false,
    subscribed: false
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    checkPermissionState();
    
    // 알림 권한 상태가 변경되었을 때 감지
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkPermissionState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkPermissionState = async () => {
    try {
      const state = await notificationService.getPermissionState();
      setPermissionState(state);
      
      // 지원되지만 권한이 없는 경우 프롬프트 표시
      if (state.supported && state.permission === 'default') {
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (!dismissed) {
          setTimeout(() => setShowPrompt(true), 5000); // 5초 후 표시
        }
      }
    } catch (error) {
      console.error('❌ 알림 권한 상태 확인 실패:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    
    try {
      const permission = await notificationService.requestPermission();
      
      if (permission === 'granted') {
        // 푸시 구독 생성
        await notificationService.subscribe();
        
        // 환영 알림 표시
        await notificationService.showNotification({
          title: '🎉 알림이 활성화되었습니다!',
          body: 'BS 학습앱의 중요한 소식을 놓치지 마세요.',
          icon: '/icons/icon-192x192.svg',
          tag: 'welcome-notification'
        });
        
        console.log('✅ 알림 설정 완료');
      }
      
      await checkPermissionState();
      setShowPrompt(false);
    } catch (error) {
      console.error('❌ 알림 활성화 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    
    try {
      await notificationService.unsubscribe();
      await checkPermissionState();
      console.log('✅ 알림 비활성화 완료');
    } catch (error) {
      console.error('❌ 알림 비활성화 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  const testNotification = async () => {
    try {
      await notificationService.showNotification({
        title: '🔔 테스트 알림',
        body: '알림이 정상적으로 작동합니다!',
        icon: '/icons/icon-192x192.svg',
        tag: 'test-notification',
        requireInteraction: true,
        actions: [
          { action: 'view', title: '확인' },
          { action: 'dismiss', title: '닫기' }
        ]
      });
    } catch (error) {
      console.error('❌ 테스트 알림 실패:', error);
    }
  };

  // 지원되지 않거나 이미 거절된 상태면 렌더링하지 않음
  if (!permissionState.supported || permissionState.permission === 'denied') {
    return null;
  }

  return (
    <>
      {/* 권한 요청 프롬프트 */}
      {showPrompt && permissionState.permission === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm mx-auto">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2 flex-shrink-0">
              <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                알림 받기
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                새로운 과정, 시험 일정, 중요한 공지사항을 놓치지 마세요.
              </p>
              
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleEnableNotifications}
                  disabled={loading}
                  className="btn-primary mobile-button flex-1 disabled:opacity-50 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    '허용'
                  )}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="mobile-button flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm font-medium"
                >
                  나중에
                </button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="mobile-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* 알림 상태 인디케이터 (설정에서 접근 가능) */}
      {permissionState.permission === 'granted' && (
        <div className="hidden"> {/* 필요시 표시 */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center space-x-1">
              {permissionState.subscribed ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-gray-600 dark:text-gray-300">
                알림 {permissionState.subscribed ? '활성' : '비활성'}
              </span>
            </div>
            
            <button
              onClick={() => setShowSettings(true)}
              className="mobile-button p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* 알림 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  알림 설정
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="mobile-button text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* 현재 상태 */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {permissionState.subscribed ? (
                      <BellIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <BellSlashIcon className="h-5 w-5 text-gray-400" />
                    )}
                    <span className="font-medium">
                      알림 {permissionState.subscribed ? '활성화' : '비활성화'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {permissionState.subscribed ? (
                      <button
                        onClick={handleDisableNotifications}
                        disabled={loading}
                        className="btn-danger mobile-button disabled:opacity-50 px-3 py-1 rounded text-sm"
                      >
                        비활성화
                      </button>
                    ) : (
                      <button
                        onClick={handleEnableNotifications}
                        disabled={loading}
                        className="btn-primary mobile-button disabled:opacity-50 px-3 py-1 rounded text-sm"
                      >
                        활성화
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 테스트 알림 */}
              {permissionState.subscribed && (
                <div>
                  <button
                    onClick={testNotification}
                    className="mobile-button w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg"
                  >
                    테스트 알림 보내기
                  </button>
                </div>
              )}

              {/* 알림 정보 */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• 새로운 과정 및 시험 일정</p>
                <p>• 중요한 공지사항</p>
                <p>• 학습 진도 리마인더</p>
                <p>• 시스템 업데이트 안내</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPermission;