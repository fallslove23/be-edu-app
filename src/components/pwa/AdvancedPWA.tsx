import React, { useState, useEffect } from 'react';
import { 
  CloudArrowDownIcon,
  WifiIcon,
  ServerIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Service Worker 관리
export const serviceWorkerManager = {
  register: async (): Promise<ServiceWorkerRegistration | null> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered:', registration.scope);
        
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 버전 사용 가능
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  },

  unregister: async (): Promise<boolean> => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const results = await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      return results.every(Boolean);
    }
    return false;
  },

  update: async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach(registration => registration.update());
    }
  }
};

// 오프라인 데이터 관리
export const offlineDataManager = {
  // IndexedDB 초기화
  initDB: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BSLearningApp', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 과정 데이터 저장소
        if (!db.objectStoreNames.contains('courses')) {
          const coursesStore = db.createObjectStore('courses', { keyPath: 'id' });
          coursesStore.createIndex('status', 'status', { unique: false });
        }
        
        // 사용자 데이터 저장소
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        
        // 공지사항 저장소
        if (!db.objectStoreNames.contains('notices')) {
          const noticesStore = db.createObjectStore('notices', { keyPath: 'id' });
          noticesStore.createIndex('timestamp', 'created_at', { unique: false });
        }
        
        // 오프라인 액션 큐
        if (!db.objectStoreNames.contains('offline_actions')) {
          const actionsStore = db.createObjectStore('offline_actions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  },

  // 데이터 저장
  saveData: async (storeName: string, data: any): Promise<void> => {
    const db = await offlineDataManager.initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 데이터 조회
  getData: async (storeName: string, key?: string): Promise<any> => {
    const db = await offlineDataManager.initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = key ? store.get(key) : store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // 오프라인 액션 큐에 추가
  queueAction: async (action: {
    type: 'create' | 'update' | 'delete';
    resource: string;
    data: any;
    endpoint: string;
  }): Promise<void> => {
    const actionWithTimestamp = {
      ...action,
      timestamp: Date.now(),
      synced: false
    };
    
    await offlineDataManager.saveData('offline_actions', actionWithTimestamp);
  },

  // 온라인 상태에서 동기화
  syncOfflineActions: async (): Promise<void> => {
    const actions = await offlineDataManager.getData('offline_actions');
    const unsynced = actions.filter((action: any) => !action.synced);
    
    for (const action of unsynced) {
      try {
        // 실제 API 호출은 여기서 구현
        console.log('Syncing action:', action);
        
        // 성공시 synced 플래그 업데이트
        action.synced = true;
        await offlineDataManager.saveData('offline_actions', action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
  }
};

// PWA 설치 관리
export const pwaInstallManager = {
  deferredPrompt: null as any,
  
  init: () => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      pwaInstallManager.deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    });
    
    window.addEventListener('appinstalled', () => {
      pwaInstallManager.deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
  },
  
  install: async (): Promise<boolean> => {
    if (!pwaInstallManager.deferredPrompt) return false;
    
    pwaInstallManager.deferredPrompt.prompt();
    const { outcome } = await pwaInstallManager.deferredPrompt.userChoice;
    pwaInstallManager.deferredPrompt = null;
    
    return outcome === 'accepted';
  },
  
  isInstalled: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }
};


// 오프라인 상태 관리 컴포넌트
const OfflineManager: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineActions, setOfflineActions] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      
      // 온라인 상태가 되면 자동 동기화
      setIsSyncing(true);
      try {
        await offlineDataManager.syncOfflineActions();
        setLastSync(new Date());
        
        // 오프라인 액션 목록 업데이트
        const actions = await offlineDataManager.getData('offline_actions');
        setOfflineActions(actions.filter((action: any) => !action.synced));
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 오프라인 액션 로드
    offlineDataManager.getData('offline_actions').then(actions => {
      setOfflineActions(actions.filter((action: any) => !action.synced));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      await offlineDataManager.syncOfflineActions();
      setLastSync(new Date());
      
      const actions = await offlineDataManager.getData('offline_actions');
      setOfflineActions(actions.filter((action: any) => !action.synced));
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <WifiIcon className="h-5 w-5 text-green-500" />
          ) : (
            <WifiIcon className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">
            {isOnline ? '온라인' : '오프라인 모드'}
          </span>
        </div>
        
        {isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="btn-primary"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? '동기화 중' : '동기화'}</span>
          </button>
        )}
      </div>
      
      {!isOnline && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              오프라인 모드입니다. 변경사항은 온라인 상태에서 동기화됩니다.
            </span>
          </div>
        </div>
      )}
      
      {offlineActions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">
            대기 중인 작업 ({offlineActions.length}개)
          </h3>
          <div className="space-y-2">
            {offlineActions.slice(0, 5).map((action, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <ServerIcon className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{action.type}</span>
                <span className="text-gray-500">{action.resource}</span>
                <span className="text-xs text-gray-400">
                  {new Date(action.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {offlineActions.length > 5 && (
              <div className="text-xs text-gray-500">
                +{offlineActions.length - 5}개 더...
              </div>
            )}
          </div>
        </div>
      )}
      
      {lastSync && (
        <div className="mt-4 text-xs text-gray-500 flex items-center space-x-1">
          <ClockIcon className="h-4 w-4" />
          <span>마지막 동기화: {lastSync.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

// PWA 설치 프롬프트 컴포넌트
const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    pwaInstallManager.init();
    setIsInstalled(pwaInstallManager.isInstalled());

    const handleInstallable = () => setShowPrompt(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await pwaInstallManager.install();
      if (installed) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5" />
          <span className="text-sm">앱이 설치되었습니다!</span>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <CloudArrowDownIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-sm mb-1">앱 설치</h3>
          <p className="text-xs opacity-90 mb-3">
            홈 화면에 추가하여 더 빠르고 편리하게 이용하세요.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-3 py-1 bg-white text-blue-500 rounded text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              {isInstalling ? '설치 중...' : '설치'}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1 border border-white/30 rounded text-xs hover:bg-white/10"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 캐시 관리 컴포넌트
const CacheManager: React.FC = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [cacheStats, setCacheStats] = useState({
    images: 0,
    data: 0,
    pages: 0
  });

  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        let stats = { images: 0, data: 0, pages: 0 };

        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const clone = response.clone();
              const arrayBuffer = await clone.arrayBuffer();
              totalSize += arrayBuffer.byteLength;
              
              // 타입별 분류
              if (request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
                stats.images++;
              } else if (request.url.includes('/api/')) {
                stats.data++;
              } else {
                stats.pages++;
              }
            }
          }
        }

        setCacheSize(totalSize);
        setCacheStats(stats);
      } catch (error) {
        console.error('Failed to get cache stats:', error);
      }
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      await updateCacheStats();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">캐시 관리</h3>
        <button
          onClick={clearCache}
          className="btn-danger"
        >
          캐시 정리
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>총 캐시 크기:</span>
          <span className="font-medium">{formatBytes(cacheSize)}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium">{cacheStats.pages}</div>
            <div className="text-gray-500">페이지</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{cacheStats.images}</div>
            <div className="text-gray-500">이미지</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{cacheStats.data}</div>
            <div className="text-gray-500">데이터</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 고급 PWA 관리 컴포넌트
const AdvancedPWA: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState(pwaInstallManager.isInstalled());
  const [isInstallable, setIsInstallable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Service Worker 등록
    const initServiceWorker = async () => {
      const registration = await serviceWorkerManager.register();
      setSwRegistration(registration);
    };

    initServiceWorker();
    pwaInstallManager.init();

    // 이벤트 리스너 등록
    const handleInstallable = () => setIsInstallable(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstall = async () => {
    await pwaInstallManager.install();
  };

  const handleUpdate = async () => {
    if (swRegistration) {
      await serviceWorkerManager.update(swRegistration);
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">📱 고급 PWA 관리</h2>
      
      {/* PWA 설치 상태 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">설치 상태</h3>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${isInstalled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            <CheckCircleIcon className="w-6 h-6 inline mr-2" />
            {isInstalled ? 'PWA 설치됨' : 'PWA 미설치'}
          </div>
          
          {isInstallable && !isInstalled && (
            <button
              onClick={handleInstall}
              className="btn-primary"
            >
              <DocumentArrowDownIcon className="w-5 h-5 inline mr-2" />
              앱 설치
            </button>
          )}
          
          {updateAvailable && (
            <button
              onClick={handleUpdate}
              className="btn-warning"
            >
              <ArrowPathIcon className="w-5 h-5 inline mr-2" />
              업데이트
            </button>
          )}
        </div>
      </div>

      {/* Service Worker 상태 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Service Worker</h3>
        <div className={`p-3 rounded-lg ${swRegistration ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <ServerIcon className="w-6 h-6 inline mr-2" />
          {swRegistration ? '등록됨' : '미등록'}
        </div>
      </div>

      {/* 오프라인 관리 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">오프라인 관리</h3>
        <OfflineManager />
      </div>
    </div>
  );
};

export default AdvancedPWA;