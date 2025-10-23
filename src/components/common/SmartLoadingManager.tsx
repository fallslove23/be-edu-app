import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CubeTransparentIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SmartLoadingManagerProps {
  children: React.ReactNode;
  loadingStates?: {
    component?: boolean;
    data?: boolean;
    network?: boolean;
  };
  optimizations?: {
    enableLazyImages?: boolean;
    enablePreloadCritical?: boolean;
    enableResourceHints?: boolean;
  };
}

// 지능형 이미지 레이지 로딩
const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className = '', placeholder }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    const element = document.getElementById(`lazy-${src}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [src]);

  return (
    <div id={`lazy-${src}`} className={`relative overflow-hidden ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <span className="text-sm text-gray-500">{placeholder}</span>
          ) : (
            <CubeTransparentIcon className="h-8 w-8 text-gray-400" />
          )}
        </div>
      )}
      
      {inView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
      
      {error && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
        </div>
      )}
    </div>
  );
};

// 스마트 리소스 프리로더
const useResourcePreloader = () => {
  const preloadResource = useCallback((url: string, type: 'script' | 'style' | 'image' | 'font') => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'image':
        link.as = 'image';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
    }
    
    document.head.appendChild(link);
  }, []);

  const preloadCriticalResources = useCallback(() => {
    // 중요한 폰트 프리로드
    preloadResource('/fonts/inter.woff2', 'font');
    
    // 주요 아이콘 프리로드
    preloadResource('/icons/heroicons.svg', 'image');
    
    // 중요한 CSS 프리로드
    preloadResource('/styles/critical.css', 'style');
  }, [preloadResource]);

  return { preloadResource, preloadCriticalResources };
};

// 네트워크 상태 모니터링
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('4g');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API (지원하는 브라우저에서)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.type || 'unknown');
      setEffectiveType(connection.effectiveType || '4g');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType, effectiveType };
};

// 성능 메트릭스 수집
const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    cls: 0, // Cumulative Layout Shift
    fid: 0, // First Input Delay
    ttfb: 0 // Time to First Byte
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // LCP 측정
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID 측정
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS 측정
    const clsObserver = new PerformanceObserver((list) => {
      let cls = 0;
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      setMetrics(prev => ({ ...prev, cls }));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return metrics;
};

// 스마트 로딩 상태 관리
const SmartLoadingManager: React.FC<SmartLoadingManagerProps> = ({
  children,
  loadingStates = {},
  optimizations = {
    enableLazyImages: true,
    enablePreloadCritical: true,
    enableResourceHints: true
  }
}) => {
  const { isOnline, effectiveType } = useNetworkStatus();
  const { preloadCriticalResources } = useResourcePreloader();
  const metrics = usePerformanceMetrics();
  const [isLoading, setIsLoading] = useState(false);

  // 연결 속도에 따른 최적화 전략
  const adaptToConnection = useMemo(() => {
    const strategies = {
      'slow-2g': { images: false, animations: false, preload: false },
      '2g': { images: false, animations: false, preload: false },
      '3g': { images: true, animations: false, preload: true },
      '4g': { images: true, animations: true, preload: true }
    };
    return strategies[effectiveType as keyof typeof strategies] || strategies['4g'];
  }, [effectiveType]);

  // 중요 리소스 프리로드
  useEffect(() => {
    if (optimizations.enablePreloadCritical && adaptToConnection.preload) {
      preloadCriticalResources();
    }
  }, [optimizations.enablePreloadCritical, adaptToConnection.preload, preloadCriticalResources]);

  // 리소스 힌트 추가
  useEffect(() => {
    if (!optimizations.enableResourceHints) return;

    const addResourceHint = (href: string, rel: string) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    };

    // DNS 프리페치
    addResourceHint('//fonts.googleapis.com', 'dns-prefetch');
    addResourceHint('//cdnjs.cloudflare.com', 'dns-prefetch');
    
    // 중요한 도메인 프리커넥트
    addResourceHint('//api.example.com', 'preconnect');
  }, [optimizations.enableResourceHints]);

  // 로딩 상태 결합
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return (
    <div className="relative">
      {/* 네트워크 상태 인디케이터 */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
          <div className="flex items-center justify-center space-x-2">
            <WifiIcon className="h-4 w-4" />
            <span className="text-sm">오프라인 모드</span>
          </div>
        </div>
      )}

      {/* 성능 기반 로딩 인디케이터 */}
      {(isAnyLoading || isLoading) && (
        <div className="fixed inset-0 bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 z-40 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {effectiveType === 'slow-2g' || effectiveType === '2g' 
                ? '느린 연결 감지됨. 최적화된 로딩 중...' 
                : '로딩 중...'
              }
            </p>
            {metrics.lcp > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                LCP: {(metrics.lcp / 1000).toFixed(2)}s
              </p>
            )}
          </div>
        </div>
      )}

      {/* 성능 최적화된 컨텐츠 */}
      <div 
        className={`transition-opacity duration-300 ${
          isAnyLoading ? 'opacity-50' : 'opacity-100'
        }`}
        style={{
          // 느린 연결에서 애니메이션 비활성화
          '--animation-duration': adaptToConnection.animations ? '300ms' : '0ms'
        } as React.CSSProperties}
      >
        {children}
      </div>

      {/* 개발 모드에서 성능 메트릭스 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>연결: {effectiveType}</div>
          {metrics.lcp > 0 && <div>LCP: {(metrics.lcp / 1000).toFixed(2)}s</div>}
          {metrics.fid > 0 && <div>FID: {metrics.fid.toFixed(2)}ms</div>}
          {metrics.cls > 0 && <div>CLS: {metrics.cls.toFixed(3)}</div>}
        </div>
      )}
    </div>
  );
};

export { SmartLoadingManager, LazyImage };
export default SmartLoadingManager;