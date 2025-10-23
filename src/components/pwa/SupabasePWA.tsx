import React, { useState, useEffect, useCallback } from 'react';
import {
  DevicePhoneMobileIcon,
  WifiIcon,
  ArrowDownTrayIcon,
  BellIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowDownIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

// PWA 설치 가능성 체크
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Supabase 기반 PWA 컴포넌트 (외부 서버 비용 없음)
const SupabasePWA: React.FC = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineData, setOfflineData] = useState<any[]>([]);

  // PWA 설치 관련
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 온라인/오프라인 상태 관리
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 서비스 워커 업데이트 감지
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch(error => console.error('SW registration failed:', error));
    }
  }, []);

  // PWA 설치 실행
  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  // 오프라인 데이터 동기화 (Supabase와)
  const syncOfflineData = useCallback(async () => {
    try {
      // IndexedDB에서 오프라인 데이터 가져오기
      const offlineEntries = await getOfflineData();
      
      if (offlineEntries.length > 0) {
        // Supabase에 동기화 (실제 환경에서는 supabase.from('table').insert() 사용)
        console.log('Syncing offline data to Supabase:', offlineEntries);
        
        // 동기화 완료 후 오프라인 데이터 삭제
        await clearOfflineData();
        setOfflineData([]);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, []);

  // IndexedDB 오프라인 데이터 관리
  const getOfflineData = async (): Promise<any[]> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('BSLearningApp', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_data'], 'readonly');
        const store = transaction.objectStore('offline_data');
        const getAll = store.getAll();
        
        getAll.onsuccess = () => resolve(getAll.result);
      };
      
      request.onerror = () => resolve([]);
    });
  };

  const clearOfflineData = async (): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('BSLearningApp', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offline_data'], 'readwrite');
        const store = transaction.objectStore('offline_data');
        store.clear();
        
        transaction.oncomplete = () => resolve();
      };
    });
  };

  // 앱 업데이트 적용
  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  // PWA 설치 프롬프트 표시 여부 결정
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const installCount = localStorage.getItem('pwa-install-count') || '0';
    
    if (!dismissed && isInstallable && parseInt(installCount) < 3) {
      setTimeout(() => setShowInstallPrompt(true), 5000);
    }
  }, [isInstallable]);

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <>
      {/* 설치 프롬프트 */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 md:max-w-md md:left-auto">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">앱으로 설치하기</h3>
              <p className="text-sm text-gray-600 mt-1">
                홈 화면에 추가하여 더 빠르고 편리하게 이용하세요
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  설치
                </button>
                <button
                  onClick={dismissInstallPrompt}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 업데이트 알림 */}
      {updateAvailable && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowDownTrayIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900">업데이트 가능</h3>
              <p className="text-sm text-green-700 mt-1">
                새로운 기능이 추가되었습니다
              </p>
              <button
                onClick={handleUpdateApp}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mt-2"
              >
                업데이트
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 연결 상태 표시 */}
      <div className="fixed top-4 left-4 z-40">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? (
            <SignalIcon className="h-4 w-4" />
          ) : (
            <WifiIcon className="h-4 w-4" />
          )}
          <span>{isOnline ? '온라인' : '오프라인'}</span>
          {!isOnline && offlineData.length > 0 && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
              {offlineData.length}개 대기
            </span>
          )}
        </div>
      </div>

      {/* PWA 상태 정보 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-3 rounded-lg text-xs z-40">
          <div>PWA 상태:</div>
          <div>설치 가능: {isInstallable ? '✅' : '❌'}</div>
          <div>설치됨: {isInstalled ? '✅' : '❌'}</div>
          <div>온라인: {isOnline ? '✅' : '❌'}</div>
          <div>서비스 워커: {'serviceWorker' in navigator ? '✅' : '❌'}</div>
        </div>
      )}
    </>
  );
};

export default SupabasePWA;