import { useState, useEffect, useCallback } from 'react';

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineTime?: Date;
  offlineDuration?: number;
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: Date;
  retryCount: number;
}

export const useOffline = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : undefined
  });

  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // 온라인/오프라인 상태 변경 처리
  const handleOnline = useCallback(() => {
    const now = new Date();
    const offlineDuration = state.lastOnlineTime 
      ? now.getTime() - state.lastOnlineTime.getTime()
      : undefined;

    setState({
      isOnline: true,
      isOffline: false,
      lastOnlineTime: now,
      offlineDuration
    });

    console.log('🌐 온라인 상태 복구');
    
    // 오프라인 동안 쌓인 요청들 동기화
    if (queuedRequests.length > 0) {
      syncQueuedRequests();
    }
  }, [state.lastOnlineTime, queuedRequests.length]);

  const handleOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: false,
      isOffline: true
    }));

    console.log('📱 오프라인 상태');
  }, []);

  // 큐에 요청 추가
  const queueRequest = useCallback((
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): string => {
    const requestId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedRequest: QueuedRequest = {
      id: requestId,
      url,
      method,
      body,
      headers,
      timestamp: new Date(),
      retryCount: 0
    };

    setQueuedRequests(prev => [...prev, queuedRequest]);
    
    // 로컬 스토리지에도 저장
    const existingQueue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
    existingQueue.push(queuedRequest);
    localStorage.setItem('offline-queue', JSON.stringify(existingQueue));

    console.log(`📤 오프라인 요청 큐에 추가: ${method} ${url}`);
    
    return requestId;
  }, []);

  // 큐된 요청들 동기화
  const syncQueuedRequests = useCallback(async () => {
    if (syncInProgress || !state.isOnline) return;
    
    setSyncInProgress(true);
    console.log(`🔄 ${queuedRequests.length}개 오프라인 요청 동기화 시작`);

    const successfulRequests: string[] = [];
    const failedRequests: QueuedRequest[] = [];

    for (const request of queuedRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            ...request.headers
          },
          body: request.body ? JSON.stringify(request.body) : undefined
        });

        if (response.ok) {
          successfulRequests.push(request.id);
          console.log(`✅ 동기화 성공: ${request.method} ${request.url}`);
        } else {
          console.warn(`⚠️ 동기화 실패 (HTTP ${response.status}): ${request.method} ${request.url}`);
          
          if (request.retryCount < 3) {
            failedRequests.push({
              ...request,
              retryCount: request.retryCount + 1
            });
          }
        }
      } catch (error) {
        console.error(`❌ 동기화 오류: ${request.method} ${request.url}`, error);
        
        if (request.retryCount < 3) {
          failedRequests.push({
            ...request,
            retryCount: request.retryCount + 1
          });
        }
      }
    }

    // 성공한 요청들은 큐에서 제거
    setQueuedRequests(failedRequests);
    
    // 로컬 스토리지 업데이트
    localStorage.setItem('offline-queue', JSON.stringify(failedRequests));

    console.log(`🎯 동기화 완료: ${successfulRequests.length}개 성공, ${failedRequests.length}개 실패/재시도`);
    setSyncInProgress(false);
  }, [queuedRequests, state.isOnline, syncInProgress]);

  // 로컬 스토리지에서 큐 복원
  useEffect(() => {
    const savedQueue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
    if (savedQueue.length > 0) {
      setQueuedRequests(savedQueue);
      console.log(`📋 ${savedQueue.length}개 오프라인 요청 복원`);
    }
  }, []);

  // 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // 주기적으로 연결 상태 확인
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // 실제 서버에 ping을 보내서 연결 상태 확인
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch('/api/ping', {
          method: 'HEAD',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!state.isOnline) {
          handleOnline();
        }
      } catch {
        if (state.isOnline) {
          handleOffline();
        }
      }
    };

    const intervalId = setInterval(checkConnection, 30000); // 30초마다 확인

    return () => clearInterval(intervalId);
  }, [state.isOnline, handleOnline, handleOffline]);

  // 큐 관리 함수들
  const clearQueue = useCallback(() => {
    setQueuedRequests([]);
    localStorage.removeItem('offline-queue');
    console.log('🗑️ 오프라인 요청 큐 초기화');
  }, []);

  const removeFromQueue = useCallback((requestId: string) => {
    setQueuedRequests(prev => prev.filter(req => req.id !== requestId));
    
    const updatedQueue = queuedRequests.filter(req => req.id !== requestId);
    localStorage.setItem('offline-queue', JSON.stringify(updatedQueue));
    
    console.log(`🗑️ 오프라인 요청 제거: ${requestId}`);
  }, [queuedRequests]);

  // 오프라인 데이터 저장/복원 헬퍼
  const saveOfflineData = useCallback((key: string, data: any) => {
    const offlineData = JSON.parse(localStorage.getItem('offline-data') || '{}');
    offlineData[key] = {
      data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('offline-data', JSON.stringify(offlineData));
  }, []);

  const getOfflineData = useCallback((key: string) => {
    const offlineData = JSON.parse(localStorage.getItem('offline-data') || '{}');
    return offlineData[key]?.data;
  }, []);

  const isDataStale = useCallback((key: string, maxAgeMs: number = 300000): boolean => {
    const offlineData = JSON.parse(localStorage.getItem('offline-data') || '{}');
    const entry = offlineData[key];
    
    if (!entry) return true;
    
    const age = Date.now() - new Date(entry.timestamp).getTime();
    return age > maxAgeMs;
  }, []);

  return {
    ...state,
    queuedRequests,
    queuedCount: queuedRequests.length,
    syncInProgress,
    queueRequest,
    syncQueuedRequests,
    clearQueue,
    removeFromQueue,
    saveOfflineData,
    getOfflineData,
    isDataStale
  };
};