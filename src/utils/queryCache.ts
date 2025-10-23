// 고성능 쿼리 캐싱 시스템
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  enablePersistence: boolean;
  compressionThreshold: number; // bytes
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private accessPatterns = new Map<string, number[]>();
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 500,
      defaultTTL: 5 * 60 * 1000, // 5분
      enablePersistence: true,
      compressionThreshold: 10240, // 10KB
      ...config
    };
    
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  // 캐시 키 생성 (쿼리 파라미터 기반)
  private generateKey(queryName: string, params: any = {}): string {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${queryName}:${btoa(sortedParams)}`;
  }

  // 지능형 TTL 계산 (접근 패턴 기반)
  private calculateSmartTTL(key: string, baseTTL: number): number {
    const pattern = this.accessPatterns.get(key) || [];
    
    if (pattern.length < 2) return baseTTL;
    
    // 최근 접근 빈도 분석
    const now = Date.now();
    const recentAccess = pattern.filter(time => now - time < 60000); // 1분 내
    const frequency = recentAccess.length;
    
    // 높은 빈도 → 긴 TTL
    if (frequency > 10) return baseTTL * 3;
    if (frequency > 5) return baseTTL * 2;
    if (frequency > 2) return baseTTL * 1.5;
    
    return baseTTL;
  }

  // 캐시 저장
  set<T>(queryName: string, data: T, params: any = {}, customTTL?: number): void {
    const key = this.generateKey(queryName, params);
    const now = Date.now();
    const ttl = customTTL || this.calculateSmartTTL(key, this.config.defaultTTL);
    
    // 캐시 크기 관리
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }
    
    // 접근 패턴 기록
    this.recordAccess(key);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      hits: 1,
      lastAccessed: now
    });
    
    this.persistToStorage();
  }

  // 캐시 조회
  get<T>(queryName: string, params: any = {}): T | null {
    const key = this.generateKey(queryName, params);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    
    // TTL 체크
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // 접근 통계 업데이트
    entry.hits++;
    entry.lastAccessed = now;
    this.recordAccess(key);
    
    return entry.data;
  }

  // 스마트 프리페치 (자주 사용되는 쿼리 미리 로딩)
  async prefetch<T>(
    queryName: string, 
    queryFn: () => Promise<T>, 
    params: any = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    const key = this.generateKey(queryName, params);
    
    // 이미 캐시된 경우 스킵
    if (this.get(queryName, params)) return;
    
    // 우선순위에 따른 지연
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 100 : 500;
    
    setTimeout(async () => {
      try {
        const data = await queryFn();
        this.set(queryName, data, params);
      } catch (error) {
        console.warn(`프리페치 실패 (${key}):`, error);
      }
    }, delay);
  }

  // 조건부 캐시 무효화
  invalidate(pattern: string | RegExp): number {
    let count = 0;
    
    for (const [key] of this.cache) {
      const shouldInvalidate = typeof pattern === 'string' 
        ? key.includes(pattern)
        : pattern.test(key);
        
      if (shouldInvalidate) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.persistToStorage();
    return count;
  }

  // 캐시 새로고침 (백그라운드에서 데이터 업데이트)
  async refresh<T>(
    queryName: string, 
    queryFn: () => Promise<T>, 
    params: any = {}
  ): Promise<T> {
    const key = this.generateKey(queryName, params);
    const oldEntry = this.cache.get(key);
    
    try {
      const newData = await queryFn();
      this.set(queryName, newData, params);
      return newData;
    } catch (error) {
      // 에러 시 기존 캐시 데이터 반환 (stale-while-revalidate)
      if (oldEntry) {
        console.warn(`캐시 새로고침 실패, 기존 데이터 사용 (${key}):`, error);
        return oldEntry.data;
      }
      throw error;
    }
  }

  // 접근 패턴 기록
  private recordAccess(key: string): void {
    const pattern = this.accessPatterns.get(key) || [];
    const now = Date.now();
    
    pattern.push(now);
    
    // 1시간 이전 기록 제거
    const filtered = pattern.filter(time => now - time < 3600000);
    this.accessPatterns.set(key, filtered.slice(-100)); // 최대 100개 기록
  }

  // LRU 방식으로 캐시 항목 제거
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastScore = Infinity;
    
    for (const [key, entry] of this.cache) {
      // 점수 = 접근 횟수 + 최근성 가중치
      const recencyWeight = (Date.now() - entry.lastAccessed) / 60000; // 분 단위
      const score = entry.hits - recencyWeight;
      
      if (score < leastScore) {
        leastScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.accessPatterns.delete(leastUsedKey);
    }
  }

  // 자동 정리 타이머
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [key, entry] of this.cache) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
      
      // 메모리 사용량 체크
      if (this.cache.size > this.config.maxSize * 0.8) {
        this.evictLeastUsed();
      }
      
    }, 60000); // 1분마다 정리
  }

  // IndexedDB에 영구 저장
  private persistToStorage(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const serializable = Array.from(this.cache.entries())
        .filter(([_, entry]) => Date.now() - entry.timestamp < entry.ttl)
        .slice(0, 100); // 최대 100개만 저장
      
      localStorage.setItem('queryCache', JSON.stringify(serializable));
    } catch (error) {
      console.warn('캐시 저장 실패:', error);
    }
  }

  // 저장된 캐시 로드
  private loadFromStorage(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const stored = localStorage.getItem('queryCache');
      if (stored) {
        const entries = JSON.parse(stored);
        const now = Date.now();
        
        for (const [key, entry] of entries) {
          // 유효한 캐시만 로드
          if (now - entry.timestamp < entry.ttl) {
            this.cache.set(key, entry);
          }
        }
      }
    } catch (error) {
      console.warn('캐시 로드 실패:', error);
    }
  }

  // 캐시 통계
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let totalHits = 0;
    
    for (const [_, entry] of this.cache) {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++;
        totalHits += entry.hits;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      hitRate: totalHits > 0 ? totalHits / (totalHits + validEntries) : 0,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length,
      accessPatterns: this.accessPatterns.size
    };
  }

  // 캐시 초기화
  clear(): void {
    this.cache.clear();
    this.accessPatterns.clear();
    localStorage.removeItem('queryCache');
  }
}

// 전역 캐시 인스턴스
export const queryCache = new QueryCache({
  maxSize: 500,
  defaultTTL: 5 * 60 * 1000, // 5분
  enablePersistence: true
});

// 캐시 데코레이터 함수 (간소화된 버전)
export function cached<T>(
  queryName: string,
  ttl?: number,
  invalidatePattern?: string | RegExp
) {
  return function (target: any, propertyKey: string, descriptor: any) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const params = args.length > 0 ? args[0] : {};
      
      // 캐시 확인
      const cached = queryCache.get(queryName, params);
      if (cached) return cached;
      
      // 캐시 미스 시 실제 실행
      const result = await originalMethod.apply(this, args);
      
      // 결과 캐시
      queryCache.set(queryName, result, params, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

// 간단한 캐시 래퍼 함수 (데코레이터 대신 사용 가능)
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  queryName: string,
  ttl?: number
): T {
  return (async (...args: any[]) => {
    const params = args.length > 0 ? args[0] : {};
    
    // 캐시 확인
    const cached = queryCache.get(queryName, params);
    if (cached) return cached;
    
    // 캐시 미스 시 실제 실행
    const result = await fn(...args);
    
    // 결과 캐시
    queryCache.set(queryName, result, params, ttl);
    
    return result;
  }) as T;
}

// 쿼리 배치 실행기
export class QueryBatcher {
  private batches = new Map<string, {
    queries: Array<{
      params: any;
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }>;
    timer: NodeJS.Timeout;
  }>();

  // 배치에 쿼리 추가
  add<T>(
    queryName: string,
    queryFn: (params: any[]) => Promise<T[]>,
    params: any,
    batchDelay = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.batches.get(queryName);
      
      if (!batch) {
        batch = {
          queries: [],
          timer: setTimeout(() => this.executeBatch(queryName, queryFn), batchDelay)
        };
        this.batches.set(queryName, batch);
      }
      
      batch.queries.push({ params, resolve, reject });
    });
  }

  // 배치 실행
  private async executeBatch<T>(
    queryName: string,
    queryFn: (params: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(queryName);
    if (!batch) return;
    
    this.batches.delete(queryName);
    
    try {
      const allParams = batch.queries.map(q => q.params);
      const results = await queryFn(allParams);
      
      batch.queries.forEach((query, index) => {
        query.resolve(results[index]);
      });
    } catch (error) {
      batch.queries.forEach(query => {
        query.reject(error);
      });
    }
  }
}

export const queryBatcher = new QueryBatcher();