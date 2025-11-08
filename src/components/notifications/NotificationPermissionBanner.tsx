import React, { useState, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotifications } from './NotificationProvider';

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { requestPermission } = useNotifications();

  useEffect(() => {
    // 브라우저 알림 지원 확인
    if (!('Notification' in window)) {
      return;
    }

    // 이미 권한이 있거나 거부된 경우 표시하지 않음
    if (Notification.permission !== 'default') {
      return;
    }

    // localStorage에서 배너 숨김 설정 확인
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (dismissed === 'true') {
      return;
    }

    // 3초 후 배너 표시
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-200 p-5">
        <div className="flex items-start gap-4">
          {/* 아이콘 */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1">실시간 알림 받기</h3>
            <p className="text-sm text-gray-600 mb-3">
              시험 응시 시작, 완료 등 중요한 알림을 실시간으로 받아보세요.
            </p>

            {/* 버튼 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                알림 허용
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                나중에
              </button>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
