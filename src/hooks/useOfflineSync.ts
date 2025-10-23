import { useState, useEffect, useCallback } from 'react';
import { OfflineStorageManager, SyncStatus, OfflineData } from '../utils/offlineStorage';

interface UseOfflineSyncOptions {
  autoSync?: boolean;
  enableNotifications?: boolean;
  syncOnReconnect?: boolean;
}

interface UseOfflineSyncReturn {
  syncStatus: SyncStatus;
  offlineData: OfflineData[];
  isOnline: boolean;
  isPending: boolean;
  hasConflicts: boolean;
  storeOfflineData: (type: OfflineData['type'], data: Record<string, unknown>, userId: string) => Promise<string>;
  syncNow: () => Promise<void>;
  resolveConflict: (itemId: string, resolution: 'use_local' | 'use_remote' | 'merge', mergedData?: Record<string, unknown>) => Promise<void>;
  clearSyncedData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useOfflineSync = (options: UseOfflineSyncOptions = {}): UseOfflineSyncReturn => {
  const {
    autoSync = true,
    enableNotifications = true,
    syncOnReconnect = true
  } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTime: null,
    pendingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    totalSize: 0
  });

  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [syncing, setSyncing] = useState(false);

  // 알림 표시
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('BS 학습 시스템', {
        body: message,
        icon: '/favicon.ico',
        tag: 'sync-notification'
      });
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }, []);

  // 데이터 새로고침
  const refreshData = useCallback(async () => {
    try {
      const status = await OfflineStorageManager.getSyncStatus();
      setSyncStatus(status);

      const data = await OfflineStorageManager.getOfflineData();
      setOfflineData(data);
    } catch (error) {
      console.error('오프라인 데이터 새로고침 실패:', error);
    }
  }, []);

  // 오프라인 데이터 저장
  const storeOfflineData = useCallback(async (
    type: OfflineData['type'],
    data: Record<string, unknown>,
    userId: string
  ): Promise<string> => {
    try {
      const id = await OfflineStorageManager.storeOfflineData(type, data, userId);
      await refreshData();
      
      if (enableNotifications) {
        showNotification('데이터가 오프라인으로 저장되었습니다.', 'info');
      }
      
      return id;
    } catch (error) {
      console.error('오프라인 데이터 저장 실패:', error);
      if (enableNotifications) {
        showNotification('데이터 저장에 실패했습니다.', 'error');
      }
      throw error;
    }
  }, [refreshData, enableNotifications, showNotification]);

  // 수동 동기화
  const syncNow = useCallback(async (): Promise<void> => {
    if (!syncStatus.isOnline) {
      throw new Error('오프라인 상태에서는 동기화할 수 없습니다.');
    }

    if (syncing) {
      return;
    }

    setSyncing(true);
    try {
      const result = await OfflineStorageManager.syncNow();
      await refreshData();
      
      if (enableNotifications) {
        if (result.success > 0) {
          showNotification(`${result.success}개 항목이 동기화되었습니다.`, 'success');
        }
        if (result.conflicts > 0) {
          showNotification(`${result.conflicts}개 충돌이 발견되었습니다.`, 'warning');
        }
        if (result.failed > 0) {
          showNotification(`${result.failed}개 항목 동기화에 실패했습니다.`, 'error');
        }
      }
    } catch (error) {
      console.error('동기화 실패:', error);
      if (enableNotifications) {
        showNotification('동기화에 실패했습니다.', 'error');
      }
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [syncStatus.isOnline, syncing, refreshData, enableNotifications, showNotification]);

  // 충돌 해결
  const resolveConflict = useCallback(async (
    itemId: string,
    resolution: 'use_local' | 'use_remote' | 'merge',
    mergedData?: Record<string, unknown>
  ): Promise<void> => {
    try {
      await OfflineStorageManager.resolveConflict(itemId, resolution, mergedData);
      await refreshData();
      
      if (enableNotifications) {
        showNotification('충돌이 해결되었습니다.', 'success');
      }
    } catch (error) {
      console.error('충돌 해결 실패:', error);
      if (enableNotifications) {
        showNotification('충돌 해결에 실패했습니다.', 'error');
      }
      throw error;
    }
  }, [refreshData, enableNotifications, showNotification]);

  // 동기화된 데이터 정리
  const clearSyncedData = useCallback(async (): Promise<void> => {
    try {
      const result = await OfflineStorageManager.cleanupData();
      await refreshData();
      
      if (enableNotifications && result.removed > 0) {
        showNotification(`${result.removed}개 항목이 정리되었습니다.`, 'success');
      }
    } catch (error) {
      console.error('데이터 정리 실패:', error);
      if (enableNotifications) {
        showNotification('데이터 정리에 실패했습니다.', 'error');
      }
      throw error;
    }
  }, [refreshData, enableNotifications, showNotification]);

  // 상태 변경 리스너
  useEffect(() => {
    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    OfflineStorageManager.addStatusListener(statusListener);
    return () => OfflineStorageManager.removeStatusListener(statusListener);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 온라인 상태 변경 처리
  useEffect(() => {
    const handleOnline = async () => {
      await refreshData();
      if (syncOnReconnect && autoSync) {
        setTimeout(() => syncNow().catch(console.error), 1000);
      }
      if (enableNotifications) {
        showNotification('온라인 상태로 복귀했습니다.', 'info');
      }
    };

    const handleOffline = async () => {
      await refreshData();
      if (enableNotifications) {
        showNotification('오프라인 모드로 전환되었습니다.', 'warning');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncOnReconnect, enableNotifications, syncNow, refreshData, showNotification]);

  return {
    syncStatus,
    offlineData,
    isOnline: syncStatus.isOnline,
    isPending: syncStatus.pendingCount > 0,
    hasConflicts: syncStatus.conflictCount > 0,
    storeOfflineData,
    syncNow,
    resolveConflict,
    clearSyncedData,
    refreshData
  };
};

export const useOfflineStatus = () => {
  const { syncStatus, isOnline, isPending, hasConflicts } = useOfflineSync({
    autoSync: false,
    enableNotifications: false
  });

  return {
    isOnline,
    isPending,
    hasConflicts,
    pendingCount: syncStatus.pendingCount,
    conflictCount: syncStatus.conflictCount,
    lastSyncTime: syncStatus.lastSyncTime
  };
};