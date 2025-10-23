// 오프라인 데이터 관리 서비스
export interface OfflineData {
  timestamp: number;
  data: any;
  version: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineService {
  private readonly DB_NAME = 'BSLearningApp';
  private readonly DB_VERSION = 1;
  private db: IDBDatabase | null = null;

  // IndexedDB 초기화
  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;

        // 오프라인 데이터 저장소
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 동기화 대기열
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // 사용자 설정
        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'key' });
        }
      };
    });
  }

  // 오프라인 데이터 저장
  async setOfflineData(key: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const offlineData: OfflineData = {
        timestamp: Date.now(),
        data,
        version: 1
      };

      const request = store.put({ key, ...offlineData });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 오프라인 데이터 조회
  async getOfflineData(key: string): Promise<any | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // 7일 이상 된 데이터는 무효화
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          if (result.timestamp > sevenDaysAgo) {
            resolve(result.data);
          } else {
            this.removeOfflineData(key); // 만료된 데이터 삭제
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 오프라인 데이터 삭제
  async removeOfflineData(key: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 동기화 대기열에 추가
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) await this.initDB();

    const syncItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${item.table}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(syncItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 동기화 대기열 조회
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // 동기화 항목 제거
  async removeSyncItem(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 동기화 재시도 횟수 증가
  async incrementRetryCount(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retryCount += 1;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 사용자 설정 저장
  async setUserSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userSettings'], 'readwrite');
      const store = transaction.objectStore('userSettings');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 사용자 설정 조회
  async getUserSetting(key: string): Promise<any | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userSettings'], 'readonly');
      const store = transaction.objectStore('userSettings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 전체 오프라인 데이터 크기 계산
  async getStorageSize(): Promise<{ offlineData: number; syncQueue: number; total: number }> {
    if (!this.db) await this.initDB();

    const getSize = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore('offlineData');
        const request = store.getAll();

        request.onsuccess = () => {
          const data = request.result || [];
          const size = JSON.stringify(data).length;
          resolve(size);
        };
        request.onerror = () => reject(request.error);
      });
    };

    try {
      const [offlineDataSize, syncQueueSize] = await Promise.all([
        getSize('offlineData'),
        getSize('syncQueue')
      ]);

      return {
        offlineData: offlineDataSize,
        syncQueue: syncQueueSize,
        total: offlineDataSize + syncQueueSize
      };
    } catch (error) {
      console.error('❌ 스토리지 크기 계산 실패:', error);
      return { offlineData: 0, syncQueue: 0, total: 0 };
    }
  }

  // 오프라인 데이터 정리
  async cleanup(): Promise<void> {
    if (!this.db) await this.initDB();

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(sevenDaysAgo));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineService = new OfflineService();