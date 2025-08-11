import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkType?: string;
  connectionSpeed?: string;
}

interface PerformanceThresholds {
  loadTime: number; // ms
  renderTime: number; // ms
  memoryUsage: number; // MB
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  loadTime: 3000, // 3초
  renderTime: 100, // 100ms
  memoryUsage: 50 // 50MB
};

export const usePerformanceMonitor = (
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {}
) => {
  const startTimeRef = useRef<number>(Date.now());
  const mountTimeRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // 메모리 사용량 측정
  const getMemoryUsage = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB 단위
    }
    return 0;
  }, []);

  // 네트워크 정보 가져오기
  const getNetworkInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        networkType: connection.effectiveType || 'unknown',
        connectionSpeed: connection.downlink ? `${connection.downlink}Mbps` : 'unknown'
      };
    }
    return { networkType: 'unknown', connectionSpeed: 'unknown' };
  }, []);

  // 성능 메트릭 수집
  const collectMetrics = useCallback(() => {
    const endTime = Date.now();
    const loadTime = endTime - startTimeRef.current;
    const renderTime = endTime - mountTimeRef.current;
    const memoryUsage = getMemoryUsage();
    const networkInfo = getNetworkInfo();

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      memoryUsage,
      ...networkInfo
    };

    metricsRef.current = metrics;

    // 임계값 초과 시 경고
    const warnings: string[] = [];
    
    if (loadTime > finalThresholds.loadTime) {
      warnings.push(`로드 시간 초과: ${loadTime}ms > ${finalThresholds.loadTime}ms`);
    }
    
    if (renderTime > finalThresholds.renderTime) {
      warnings.push(`렌더 시간 초과: ${renderTime}ms > ${finalThresholds.renderTime}ms`);
    }
    
    if (memoryUsage > finalThresholds.memoryUsage) {
      warnings.push(`메모리 사용량 초과: ${memoryUsage}MB > ${finalThresholds.memoryUsage}MB`);
    }

    if (warnings.length > 0) {
      console.warn(`⚠️ [${componentName}] 성능 이슈 감지:`, warnings);
    } else {
      console.log(`✅ [${componentName}] 성능 정상:`, metrics);
    }

    return metrics;
  }, [componentName, finalThresholds, getMemoryUsage, getNetworkInfo]);

  // Core Web Vitals 측정
  const measureWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = Math.round(entry.startTime);
            console.log(`📊 [${componentName}] LCP: ${lcp}ms`);
            
            if (lcp > 2500) {
              console.warn(`⚠️ [${componentName}] LCP 임계값 초과: ${lcp}ms > 2500ms`);
            }
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fid = Math.round((entry as any).processingStart - entry.startTime);
            console.log(`📊 [${componentName}] FID: ${fid}ms`);
            
            if (fid > 100) {
              console.warn(`⚠️ [${componentName}] FID 임계값 초과: ${fid}ms > 100ms`);
            }
          }
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((list) => {
        let clsScore = 0;
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        
        if (clsScore > 0) {
          console.log(`📊 [${componentName}] CLS: ${clsScore.toFixed(4)}`);
          
          if (clsScore > 0.1) {
            console.warn(`⚠️ [${componentName}] CLS 임계값 초과: ${clsScore.toFixed(4)} > 0.1`);
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }, [componentName]);

  // 컴포넌트 마운트 시 시작 시간 기록
  useEffect(() => {
    mountTimeRef.current = Date.now();
    
    // Web Vitals 측정 시작
    measureWebVitals();
    
    // 컴포넌트 언마운트 시 메트릭 수집
    return () => {
      const metrics = collectMetrics();
      
      // 성능 데이터를 로컬 스토리지에 저장 (선택사항)
      const performanceLog = JSON.parse(localStorage.getItem('performance-log') || '[]');
      performanceLog.push({
        component: componentName,
        timestamp: new Date().toISOString(),
        metrics
      });
      
      // 최근 100개 기록만 유지
      if (performanceLog.length > 100) {
        performanceLog.splice(0, performanceLog.length - 100);
      }
      
      localStorage.setItem('performance-log', JSON.stringify(performanceLog));
    };
  }, [componentName, collectMetrics, measureWebVitals]);

  // 수동으로 메트릭 수집
  const measureNow = useCallback(() => {
    return collectMetrics();
  }, [collectMetrics]);

  // 성능 리포트 생성
  const generateReport = useCallback(() => {
    const performanceLog = JSON.parse(localStorage.getItem('performance-log') || '[]');
    const componentLogs = performanceLog.filter((log: any) => log.component === componentName);
    
    if (componentLogs.length === 0) {
      return null;
    }

    const avgMetrics = componentLogs.reduce((acc: any, log: any) => {
      acc.loadTime += log.metrics.loadTime;
      acc.renderTime += log.metrics.renderTime;
      acc.memoryUsage += log.metrics.memoryUsage;
      return acc;
    }, { loadTime: 0, renderTime: 0, memoryUsage: 0 });

    Object.keys(avgMetrics).forEach(key => {
      avgMetrics[key] = Math.round(avgMetrics[key] / componentLogs.length);
    });

    return {
      component: componentName,
      recordCount: componentLogs.length,
      averageMetrics: avgMetrics,
      latestMetrics: componentLogs[componentLogs.length - 1]?.metrics,
      thresholds: finalThresholds
    };
  }, [componentName, finalThresholds]);

  return {
    measureNow,
    generateReport,
    currentMetrics: metricsRef.current,
    thresholds: finalThresholds
  };
};