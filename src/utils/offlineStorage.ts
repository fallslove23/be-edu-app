// 오프라인 데이터 저장 및 동기화 유틸리티 - 600명 규모 최적화

export interface OfflineData {
  id: string;
  type: 'course' | 'attendance' | 'exam' | 'file' | 'user_progress' | 'notice';
  data: Record<string, unknown>;
  timestamp: string;
  userId: string;
  status: 'pending' | 'synced' | 'conflict' | 'failed';
  retryCount: number;
  lastSyncAttempt?: string;
  conflictData?: Record<string, unknown>;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  totalSize: number;
}

export interface SyncConfig {
  maxRetries: number;
  syncInterval: number; // milliseconds
  batchSize: number;
  maxStorageSize: number; // bytes
}

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 3,
  syncInterval: 30000, // 30초
  batchSize: 10,
  maxStorageSize: 50 * 1024 * 1024 // 50MB
};

export class OfflineStorageManager {
  private static readonly STORAGE_KEY = 'bs_offline_data';
  private static readonly STATUS_KEY = 'bs_sync_status';
  private static readonly CONFIG_KEY = 'bs_sync_config';
  private static syncTimer: number | null = null;
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private static listeners: ((status: SyncStatus) => void)[] = [];

  // 온라인/오프라인 상태 모니터링 시작
  static initialize() {
    // 온라인 상태 리스너
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // 주기적 동기화 시작
    this.startSyncTimer();
    
    // 페이지 언로드 시 동기화 시도
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    console.log('오프라인 저장소 매니저 초기화 완료');
  }

  // 데이터 저장 (오프라인 모드)
  static async storeOfflineData(type: OfflineData['type'], data: Record<string, unknown>, userId: string): Promise<string> {
    const offlineData: OfflineData = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      userId,
      status: 'pending',
      retryCount: 0
    };

    const existingData = await this.getAllOfflineData();
    existingData.push(offlineData);

    // 저장소 크기 체크
    const config = await this.getConfig();
    const totalSize = this.calculateStorageSize(existingData);
    
    if (totalSize > config.maxStorageSize) {
      await this.cleanupOldData(existingData, config.maxStorageSize * 0.8); // 80%까지 정리
    }

    await this.saveOfflineData(existingData);
    this.notifyListeners();
    
    return offlineData.id;
  }

  // 오프라인 데이터 조회
  static async getOfflineData(filter: {
    type?: OfflineData['type'];
    userId?: string;
    status?: OfflineData['status'];
  } = {}): Promise<OfflineData[]> {
    const allData = await this.getAllOfflineData();
    
    return allData.filter(item => {
      if (filter.type && item.type !== filter.type) return false;
      if (filter.userId && item.userId !== filter.userId) return false;
      if (filter.status && item.status !== filter.status) return false;
      return true;
    });
  }

  // 동기화 상태 조회
  static async getSyncStatus(): Promise<SyncStatus> {
    const allData = await this.getAllOfflineData();
    const pendingData = allData.filter(item => item.status === 'pending');
    const failedData = allData.filter(item => item.status === 'failed');
    const conflictData = allData.filter(item => item.status === 'conflict');
    
    const stored = localStorage.getItem(this.STATUS_KEY);
    const lastSyncTime = stored ? JSON.parse(stored).lastSyncTime : null;

    return {
      isOnline: this.isOnline,
      lastSyncTime,
      pendingCount: pendingData.length,
      failedCount: failedData.length,
      conflictCount: conflictData.length,
      totalSize: this.calculateStorageSize(allData)
    };
  }

  // 수동 동기화 실행
  static async syncNow(): Promise<{ success: number; failed: number; conflicts: number }> {
    if (!this.isOnline) {
      throw new Error('오프라인 상태에서는 동기화할 수 없습니다.');
    }

    const pendingData = await this.getOfflineData({ status: 'pending' });
    const config = await this.getConfig();
    
    let success = 0;
    let failed = 0;
    let conflicts = 0;

    // 배치 단위로 동기화
    for (let i = 0; i < pendingData.length; i += config.batchSize) {
      const batch = pendingData.slice(i, i + config.batchSize);
      
      for (const item of batch) {
        try {
          const result = await this.syncSingleItem(item);
          
          if (result.success) {
            await this.markAsSynced(item.id);
            success++;
          } else if (result.conflict) {
            await this.markAsConflict(item.id, result.conflictData);
            conflicts++;
          } else {
            await this.markAsFailed(item.id);
            failed++;
          }
        } catch (error) {
          console.error(`동기화 실패: ${item.id}`, error);
          await this.markAsFailed(item.id);
          failed++;
        }
      }
      
      // 배치 간 잠시 대기 (서버 부하 방지)
      if (i + config.batchSize < pendingData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 동기화 완료 시간 업데이트
    await this.updateLastSyncTime();
    this.notifyListeners();

    return { success, failed, conflicts };
  }

  // 충돌 해결
  static async resolveConflict(itemId: string, resolution: 'use_local' | 'use_remote' | 'merge', mergedData?: Record<string, unknown>): Promise<void> {
    const allData = await this.getAllOfflineData();
    const itemIndex = allData.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error('충돌 항목을 찾을 수 없습니다.');
    }

    const item = allData[itemIndex];
    
    switch (resolution) {
      case 'use_local':
        // 로컬 데이터를 서버에 강제 적용
        item.status = 'pending';
        item.retryCount = 0;
        break;
        
      case 'use_remote':
        // 원격 데이터를 사용하고 로컬 삭제
        allData.splice(itemIndex, 1);
        await this.saveOfflineData(allData);
        this.notifyListeners();
        return;
        
      case 'merge':
        // 병합된 데이터 사용
        if (!mergedData) {
          throw new Error('병합 데이터가 필요합니다.');
        }
        item.data = mergedData;
        item.status = 'pending';
        item.retryCount = 0;
        delete item.conflictData;
        break;
    }

    allData[itemIndex] = item;
    await this.saveOfflineData(allData);
    this.notifyListeners();
  }

  // 설정 관리
  static async getConfig(): Promise<SyncConfig> {
    const stored = localStorage.getItem(this.CONFIG_KEY);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  }

  static async updateConfig(config: Partial<SyncConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
    
    // 동기화 타이머 재시작
    this.stopSyncTimer();
    this.startSyncTimer();
  }

  // 데이터 정리
  static async cleanupData(olderThanDays: number = 30): Promise<{ removed: number; sizeFreed: number }> {
    const allData = await this.getAllOfflineData();
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    
    const toRemove: OfflineData[] = [];
    const toKeep: OfflineData[] = [];
    
    for (const item of allData) {
      const itemDate = new Date(item.timestamp);
      
      // 동기화된 오래된 데이터만 제거
      if (item.status === 'synced' && itemDate < cutoffDate) {
        toRemove.push(item);
      } else {
        toKeep.push(item);
      }
    }
    
    const sizeFreed = this.calculateStorageSize(toRemove);
    await this.saveOfflineData(toKeep);
    this.notifyListeners();
    
    return {
      removed: toRemove.length,
      sizeFreed
    };
  }

  // 상태 변경 리스너
  static addStatusListener(callback: (status: SyncStatus) => void) {
    this.listeners.push(callback);
  }

  static removeStatusListener(callback: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Private 메서드들
  private static async getAllOfflineData(): Promise<OfflineData[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static async saveOfflineData(data: OfflineData[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private static generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculateStorageSize(data: OfflineData[]): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private static async cleanupOldData(data: OfflineData[], targetSize: number): Promise<void> {
    // 동기화된 오래된 데이터부터 제거
    const sortedData = [...data].sort((a, b) => {
      if (a.status === 'synced' && b.status !== 'synced') return -1;
      if (a.status !== 'synced' && b.status === 'synced') return 1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    while (this.calculateStorageSize(sortedData) > targetSize && sortedData.length > 0) {
      const removed = sortedData.shift();
      if (removed && removed.status !== 'synced') {
        // 중요한 미동기화 데이터는 보존
        break;
      }
    }

    await this.saveOfflineData(sortedData);
  }

  private static async syncSingleItem(item: OfflineData): Promise<{ success: boolean; conflict?: boolean; conflictData?: Record<string, unknown> }> {
    // 실제 구현에서는 API 호출을 통해 서버와 동기화
    // 여기서는 시뮬레이션
    
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      // 랜덤하게 성공/실패/충돌 시뮬레이션
      const rand = Math.random();
      
      if (rand < 0.8) {
        // 80% 성공
        return { success: true };
      } else if (rand < 0.9) {
        // 10% 충돌
        return {
          success: false,
          conflict: true,
          conflictData: { ...item.data, serverModified: true }
        };
      } else {
        // 10% 실패
        return { success: false };
      }
    } catch {
      return { success: false };
    }
  }

  private static async markAsSynced(itemId: string): Promise<void> {
    const allData = await this.getAllOfflineData();
    const item = allData.find(item => item.id === itemId);
    
    if (item) {
      item.status = 'synced';
      item.lastSyncAttempt = new Date().toISOString();
      await this.saveOfflineData(allData);
    }
  }

  private static async markAsFailed(itemId: string): Promise<void> {
    const allData = await this.getAllOfflineData();
    const item = allData.find(item => item.id === itemId);
    
    if (item) {
      item.status = 'failed';
      item.retryCount++;
      item.lastSyncAttempt = new Date().toISOString();
      await this.saveOfflineData(allData);
    }
  }

  private static async markAsConflict(itemId: string, conflictData: Record<string, unknown>): Promise<void> {
    const allData = await this.getAllOfflineData();
    const item = allData.find(item => item.id === itemId);
    
    if (item) {
      item.status = 'conflict';
      item.conflictData = conflictData;
      item.lastSyncAttempt = new Date().toISOString();
      await this.saveOfflineData(allData);
    }
  }

  private static async updateLastSyncTime(): Promise<void> {
    const status = { lastSyncTime: new Date().toISOString() };
    localStorage.setItem(this.STATUS_KEY, JSON.stringify(status));
  }

  private static handleOnline(): void {
    this.isOnline = true;
    console.log('온라인 상태로 전환됨');
    
    // 온라인 복귀 시 자동 동기화
    setTimeout(() => {
      this.syncNow().catch(console.error);
    }, 1000);
    
    this.notifyListeners();
  }

  private static handleOffline(): void {
    this.isOnline = false;
    console.log('오프라인 상태로 전환됨');
    this.notifyListeners();
  }

  private static startSyncTimer(): void {
    this.getConfig().then(config => {
      this.syncTimer = window.setInterval(() => {
        if (this.isOnline) {
          this.syncNow().catch(console.error);
        }
      }, config.syncInterval);
    });
  }

  private static stopSyncTimer(): void {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private static handleBeforeUnload(): void {
    // 페이지 종료 전 마지막 동기화 시도
    if (this.isOnline) {
      navigator.sendBeacon('/api/sync', JSON.stringify({
        action: 'final_sync',
        timestamp: new Date().toISOString()
      }));
    }
  }

  private static async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('상태 리스너 오류:', error);
      }
    });
  }
}

// 자동 초기화
if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
  OfflineStorageManager.initialize();
}