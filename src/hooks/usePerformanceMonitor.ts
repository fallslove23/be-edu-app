import { useEffect, useCallback, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkType?: string;
  connectionSpeed?: string;
  fps?: number;
  violations: string[];
}

interface VitalMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface PerformanceBudget {
  maxLoadTime: number;
  maxRenderTime: number;
  maxMemoryUsage: number;
  maxBundleSize: number; // KB
  minFPS: number;
}

interface PerformanceThresholds {
  loadTime: number; // ms
  renderTime: number; // ms
  memoryUsage: number; // MB
  fps?: number;
  budget?: PerformanceBudget;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  loadTime: 3000, // 3초
  renderTime: 100, // 100ms
  memoryUsage: 50, // 50MB
  fps: 60,
  budget: {
    maxLoadTime: 2500,
    maxRenderTime: 100,
    maxMemoryUsage: 100,
    maxBundleSize: 500, // 500KB
    minFPS: 50
  }
};

export const usePerformanceMonitor = (
  componentName: string,
  thresholds: Partial<PerformanceThresholds> = {},
  enableRealTimeMonitoring = false
) => {
  const startTimeRef = useRef<number>(Date.now());
  const mountTimeRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const vitalsRef = useRef<Partial<VitalMetrics>>({});
  
  const [alerts, setAlerts] = useState<string[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<'passed' | 'warning' | 'failed'>('passed');
  
  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // 메모리 사용량 측정
  const getMemoryUsage = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB 단위
    }
    return 0;
  }, []);

  // FPS 측정 - 안정화된 버전
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    if (now - lastFrameTimeRef.current >= 1000) { // 1초마다 측정
      const fps = frameCountRef.current;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
      return fps;
    }

    return metricsRef.current?.fps || 60; // 기본값 60 FPS
  }, []);

  // 성능 예산 검증
  const checkPerformanceBudget = useCallback((metrics: PerformanceMetrics) => {
    if (!finalThresholds.budget) return 'passed';
    
    const budget = finalThresholds.budget;
    let failedChecks = 0;
    let warningChecks = 0;
    
    // 각 메트릭 검증
    if (metrics.loadTime > budget.maxLoadTime) failedChecks++;
    else if (metrics.loadTime > budget.maxLoadTime * 0.8) warningChecks++;
    
    if (metrics.renderTime > budget.maxRenderTime) failedChecks++;
    else if (metrics.renderTime > budget.maxRenderTime * 0.8) warningChecks++;
    
    if (metrics.memoryUsage > budget.maxMemoryUsage) failedChecks++;
    else if (metrics.memoryUsage > budget.maxMemoryUsage * 0.8) warningChecks++;
    
    if (metrics.fps && metrics.fps < budget.minFPS) failedChecks++;
    else if (metrics.fps && metrics.fps < budget.minFPS * 1.2) warningChecks++;
    
    if (failedChecks > 0) return 'failed';
    if (warningChecks > 0) return 'warning';
    return 'passed';
  }, [finalThresholds.budget]);

  // 실시간 알림 시스템 - 개발 환경에서는 비활성화
  const addAlert = useCallback((message: string, type: 'warning' | 'error' = 'warning') => {
    // 프로덕션 환경에서만 알림 표시
    if (process.env.NODE_ENV !== 'production') return;

    const alertMessage = `${type.toUpperCase()}: ${message}`;
    setAlerts(prev => [...prev.slice(-4), alertMessage]); // 최대 5개 유지

    // 5초 후 자동 제거
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert !== alertMessage));
    }, 5000);
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

  // 성능 메트릭 수집 (향상된 버전)
  const collectMetrics = useCallback(() => {
    const endTime = Date.now();
    const loadTime = endTime - startTimeRef.current;
    const renderTime = endTime - mountTimeRef.current;
    const memoryUsage = getMemoryUsage();
    const networkInfo = getNetworkInfo();
    const fps = measureFPS();

    // 위반 사항 체크
    const violations: string[] = [];
    
    if (loadTime > finalThresholds.loadTime) {
      violations.push(`로드 시간 초과: ${loadTime}ms > ${finalThresholds.loadTime}ms`);
    }
    
    if (renderTime > finalThresholds.renderTime) {
      violations.push(`렌더 시간 초과: ${renderTime}ms > ${finalThresholds.renderTime}ms`);
    }
    
    if (memoryUsage > finalThresholds.memoryUsage) {
      violations.push(`메모리 사용량 초과: ${memoryUsage}MB > ${finalThresholds.memoryUsage}MB`);
    }

    if (finalThresholds.fps && fps < finalThresholds.fps) {
      violations.push(`FPS 부족: ${fps} < ${finalThresholds.fps}`);
    }

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      memoryUsage,
      fps,
      violations,
      ...networkInfo
    };

    metricsRef.current = metrics;

    // 성능 예산 상태 업데이트
    const budgetResult = checkPerformanceBudget(metrics);
    setBudgetStatus(budgetResult);

    // 위반사항 처리 (프로덕션에서만 로깅)
    if (violations.length > 0 && process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ [${componentName}] 성능 이슈 감지:`, violations);
      violations.forEach(violation => addAlert(violation, 'warning'));
    }

    // 예산 실패 시 경고 (프로덕션에서만)
    if (process.env.NODE_ENV === 'production') {
      if (budgetResult === 'failed') {
        addAlert(`성능 예산 초과: ${componentName}`, 'error');
      } else if (budgetResult === 'warning') {
        addAlert(`성능 예산 주의: ${componentName}`, 'warning');
      }
    }

    return metrics;
  }, [componentName, finalThresholds, getMemoryUsage, getNetworkInfo, measureFPS, checkPerformanceBudget, addAlert]);

  // Core Web Vitals 측정 (향상된 버전)
  const measureWebVitals = useCallback(() => {
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            const lcp = Math.round(lastEntry.startTime);
            vitalsRef.current.lcp = lcp;

            if (process.env.NODE_ENV === 'production') {
              console.log(`📊 [${componentName}] LCP: ${lcp}ms`);
              if (lcp > 2500) {
                addAlert(`LCP 임계값 초과: ${lcp}ms > 2500ms`, 'warning');
              }
            }
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = Math.round(entry.processingStart - entry.startTime);
              vitalsRef.current.fid = fid;

              if (process.env.NODE_ENV === 'production') {
                console.log(`📊 [${componentName}] FID: ${fid}ms`);
                if (fid > 100) {
                  addAlert(`FID 임계값 초과: ${fid}ms > 100ms`, 'warning');
                }
              }
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          if (clsValue > 0) {
            vitalsRef.current.cls = clsValue;

            if (process.env.NODE_ENV === 'production') {
              console.log(`📊 [${componentName}] CLS: ${clsValue.toFixed(4)}`);
              if (clsValue > 0.1) {
                addAlert(`CLS 임계값 초과: ${clsValue.toFixed(4)} > 0.1`, 'warning');
              }
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              const fcp = Math.round(entry.startTime);
              vitalsRef.current.fcp = fcp;

              if (process.env.NODE_ENV === 'production') {
                console.log(`📊 [${componentName}] FCP: ${fcp}ms`);
              }
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

      } catch (error) {
        console.warn('Web Vitals measurement failed:', error);
      }
    }

    // TTFB (Time to First Byte) 측정
    if (performance.timing) {
      const navigationTiming = performance.timing;
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      vitalsRef.current.ttfb = ttfb;
    }
  }, [componentName, addAlert]);

  // 컴포넌트 마운트 시 시작 시간 기록
  useEffect(() => {
    mountTimeRef.current = Date.now();
    
    // Web Vitals 측정 시작
    measureWebVitals();
    
    // 컴포넌트 언마운트 시 메트릭 수집
    return () => {
      const metrics = collectMetrics();

      // 성능 데이터를 로컬 스토리지에 저장 (선택사항, SSR-safe)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
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
        } catch (error) {
          console.warn('Failed to save performance log:', error);
        }
      }
    };
  }, [componentName, collectMetrics, measureWebVitals]);

  // 수동으로 메트릭 수집
  const measureNow = useCallback(() => {
    return collectMetrics();
  }, [collectMetrics]);

  // 성능 리포트 생성
  const generateReport = useCallback(() => {
    // SSR-safe localStorage access
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
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
    } catch (error) {
      console.warn('Failed to generate performance report:', error);
      return null;
    }

    return {
      component: componentName,
      recordCount: componentLogs.length,
      averageMetrics: avgMetrics,
      latestMetrics: componentLogs[componentLogs.length - 1]?.metrics,
      thresholds: finalThresholds
    };
  }, [componentName, finalThresholds]);

  // 실시간 모니터링 시작
  useEffect(() => {
    if (enableRealTimeMonitoring) {
      const interval = setInterval(() => {
        collectMetrics();
      }, 5000); // 5초마다 체크
      
      return () => clearInterval(interval);
    }
  }, [enableRealTimeMonitoring, collectMetrics]);

  // 성능 개선 권장사항 생성
  const generateRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    const metrics = metricsRef.current;
    
    if (!metrics) return recommendations;
    
    if (metrics.loadTime > finalThresholds.loadTime) {
      recommendations.push('코드 스플리팅을 통해 초기 번들 크기를 줄이세요');
      recommendations.push('이미지 최적화 및 지연 로딩을 구현하세요');
    }
    
    if (metrics.memoryUsage > finalThresholds.memoryUsage) {
      recommendations.push('불필요한 상태나 참조를 정리하세요');
      recommendations.push('메모이제이션을 통해 불필요한 재렌더링을 방지하세요');
    }
    
    if (finalThresholds.fps && metrics.fps && metrics.fps < finalThresholds.fps) {
      recommendations.push('애니메이션 최적화 및 requestAnimationFrame 사용을 검토하세요');
      recommendations.push('DOM 조작을 최소화하고 CSS 변환을 활용하세요');
    }
    
    // Web Vitals 기반 권장사항
    const vitals = vitalsRef.current;
    if (vitals.lcp && vitals.lcp > 2500) {
      recommendations.push('LCP 개선: 주요 콘텐츠 로딩 속도를 향상시키세요');
    }
    
    if (vitals.fid && vitals.fid > 100) {
      recommendations.push('FID 개선: JavaScript 실행을 최적화하세요');
    }
    
    if (vitals.cls && vitals.cls > 0.1) {
      recommendations.push('CLS 개선: 레이아웃 시프트를 줄이세요');
    }
    
    return recommendations;
  }, [finalThresholds]);

  // 향상된 성능 리포트 생성
  const generateEnhancedReport = useCallback(() => {
    const performanceLog = JSON.parse(localStorage.getItem('performance-log') || '[]');
    const componentLogs = performanceLog.filter((log: any) => log.component === componentName);
    
    const report = {
      component: componentName,
      timestamp: new Date().toISOString(),
      currentMetrics: metricsRef.current,
      webVitals: vitalsRef.current,
      budgetStatus,
      alerts: alerts.length,
      recommendations: generateRecommendations(),
      thresholds: finalThresholds,
      history: componentLogs.slice(-10) // 최근 10개 기록
    };
    
    return report;
  }, [componentName, budgetStatus, alerts.length, generateRecommendations, finalThresholds]);

  return {
    // 기존 메서드
    measureNow,
    generateReport,
    currentMetrics: metricsRef.current,
    thresholds: finalThresholds,
    
    // 새로운 기능
    webVitals: vitalsRef.current,
    budgetStatus,
    alerts,
    violations: metricsRef.current?.violations || [],
    generateEnhancedReport,
    generateRecommendations,
    
    // 액션
    clearAlerts: () => setAlerts([]),
    startRealTimeMonitoring: () => measureFPS(),
    
    // 상태 체크
    isHealthy: budgetStatus === 'passed',
    hasWarnings: budgetStatus === 'warning' || alerts.length > 0,
    hasCriticalIssues: budgetStatus === 'failed'
  };
};