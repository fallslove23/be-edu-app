import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface PerformanceBudgetMonitorProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showDetails?: boolean;
}

const PerformanceBudgetMonitor: React.FC<PerformanceBudgetMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  showDetails = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const {
    budgetStatus,
    alerts,
    violations,
    webVitals,
    currentMetrics,
    generateEnhancedReport,
    generateRecommendations,
    clearAlerts,
    isHealthy,
    hasWarnings,
    hasCriticalIssues
  } = usePerformanceMonitor('Global', {
    loadTime: 2500,
    renderTime: 100,
    memoryUsage: 100,
    fps: 50,
    budget: {
      maxLoadTime: 2000,
      maxRenderTime: 100,
      maxMemoryUsage: 150,
      maxBundleSize: 500,
      minFPS: 50
    }
  }, true);

  // 자동 보고서 생성 (개발 모드에서만)
  useEffect(() => {
    if (enabled && process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const report = generateEnhancedReport();
        console.group('📊 성능 예산 리포트');
        console.table(report);
        console.groupEnd();
      }, 30000); // 30초마다

      return () => clearInterval(interval);
    }
  }, [enabled, generateEnhancedReport]);

  if (!enabled) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const getStatusColor = () => {
    if (hasCriticalIssues) return 'bg-red-500';
    if (hasWarnings) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (hasCriticalIssues) return '❌';
    if (hasWarnings) return '⚠️';
    return '✅';
  };

  const formatMetric = (value: number | undefined, unit: string) => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(1)}${unit}`;
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 font-mono text-xs`}>
      {/* 메인 상태 표시기 */}
      <div 
        className={`
          ${getStatusColor()} text-white rounded-full w-12 h-12 
          flex items-center justify-center cursor-pointer shadow-lg
          hover:scale-110 transition-transform duration-200
        `}
        onClick={() => setIsExpanded(!isExpanded)}
        title={`성능 상태: ${budgetStatus.toUpperCase()}`}
      >
        <span className="text-lg">{getStatusIcon()}</span>
      </div>

      {/* 알림 배지 */}
      {alerts.length > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-lg w-5 h-5 flex items-center justify-center text-xs font-bold">
          {alerts.length}
        </div>
      )}

      {/* 확장된 패널 */}
      {isExpanded && (
        <div className="absolute bottom-14 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 max-h-96 overflow-y-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">성능 모니터</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                💡 권장사항
              </button>
              <button
                onClick={clearAlerts}
                className="text-gray-500 hover:text-gray-700 text-xs"
                disabled={alerts.length === 0}
              >
                🗑️ 지우기
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 현재 상태 */}
          <div className="mb-3">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              budgetStatus === 'passed' ? 'bg-green-500/10 text-green-700 dark:bg-green-900 dark:text-green-200' :
              budgetStatus === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-destructive/10 text-destructive dark:bg-red-900 dark:text-red-200'
            }`}>
              예산 상태: {budgetStatus.toUpperCase()}
            </div>
          </div>

          {/* 성능 메트릭스 */}
          {currentMetrics && (
            <div className="mb-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">현재 메트릭스</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="font-medium">로드 시간</div>
                  <div className={currentMetrics.loadTime > 2000 ? 'text-destructive' : 'text-green-600'}>
                    {currentMetrics.loadTime.toFixed(0)}ms
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="font-medium">메모리</div>
                  <div className={currentMetrics.memoryUsage > 100 ? 'text-destructive' : 'text-green-600'}>
                    {currentMetrics.memoryUsage.toFixed(1)}MB
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="font-medium">FPS</div>
                  <div className={(currentMetrics.fps || 0) < 50 ? 'text-destructive' : 'text-green-600'}>
                    {currentMetrics.fps?.toFixed(0) || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="font-medium">렌더 시간</div>
                  <div className={currentMetrics.renderTime > 100 ? 'text-destructive' : 'text-green-600'}>
                    {currentMetrics.renderTime.toFixed(0)}ms
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Web Vitals */}
          {webVitals && Object.keys(webVitals).length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Web Vitals</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {webVitals.lcp && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-medium">LCP</div>
                    <div className={webVitals.lcp > 2500 ? 'text-destructive' : 'text-green-600'}>
                      {webVitals.lcp.toFixed(0)}ms
                    </div>
                  </div>
                )}
                {webVitals.fid !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-medium">FID</div>
                    <div className={webVitals.fid > 100 ? 'text-destructive' : 'text-green-600'}>
                      {webVitals.fid.toFixed(0)}ms
                    </div>
                  </div>
                )}
                {webVitals.cls !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-medium">CLS</div>
                    <div className={webVitals.cls > 0.1 ? 'text-destructive' : 'text-green-600'}>
                      {webVitals.cls.toFixed(4)}
                    </div>
                  </div>
                )}
                {webVitals.fcp && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-medium">FCP</div>
                    <div className={webVitals.fcp > 1800 ? 'text-destructive' : 'text-green-600'}>
                      {webVitals.fcp.toFixed(0)}ms
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 위반 사항 */}
          {violations.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-destructive mb-2">위반 사항</h4>
              <div className="space-y-1">
                {violations.map((violation, index) => (
                  <div key={index} className="text-xs text-destructive bg-destructive/10 dark:bg-red-900/20 p-2 rounded">
                    {violation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 실시간 알림 */}
          {alerts.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-orange-600 mb-2">실시간 알림</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <div key={index} className="text-xs text-orange-600 bg-orange-500/10 dark:bg-orange-900/20 p-2 rounded">
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 권장사항 */}
          {showRecommendations && (
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">성능 개선 권장사항</h4>
              <div className="space-y-1">
                {generateRecommendations().map((recommendation, index) => (
                  <div key={index} className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    💡 {recommendation}
                  </div>
                ))}
                {generateRecommendations().length === 0 && (
                  <div className="text-xs text-gray-500 italic">
                    현재 성능이 양호합니다. 추가 최적화가 필요하지 않습니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 빠른 액션 */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const report = generateEnhancedReport();
                  console.log('📊 성능 리포트:', report);
                  navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
                }}
                className="btn-primary"
              >
                📋 리포트 복사
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
              >
                🔄 캐시 지우기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceBudgetMonitor;