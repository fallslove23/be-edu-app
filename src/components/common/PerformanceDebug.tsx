import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  SignalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface PerformanceLog {
  component: string;
  timestamp: string;
  metrics: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    networkType?: string;
    connectionSpeed?: string;
  };
}

const PerformanceDebug: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string>('all');

  // 개발 모드가 아니면 표시하지 않음
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    // 로컬 스토리지에서 성능 로그 불러오기
    const logs = JSON.parse(localStorage.getItem('performance-log') || '[]');
    setPerformanceLogs(logs);
  }, [isOpen]);

  const filteredLogs = selectedComponent === 'all' 
    ? performanceLogs 
    : performanceLogs.filter(log => log.component === selectedComponent);

  const uniqueComponents = [...new Set(performanceLogs.map(log => log.component))];

  const getAverageMetrics = (componentName: string) => {
    const componentLogs = performanceLogs.filter(log => log.component === componentName);
    if (componentLogs.length === 0) return null;

    const avg = componentLogs.reduce((acc, log) => ({
      loadTime: acc.loadTime + log.metrics.loadTime,
      renderTime: acc.renderTime + log.metrics.renderTime,
      memoryUsage: acc.memoryUsage + log.metrics.memoryUsage
    }), { loadTime: 0, renderTime: 0, memoryUsage: 0 });

    return {
      loadTime: Math.round(avg.loadTime / componentLogs.length),
      renderTime: Math.round(avg.renderTime / componentLogs.length),
      memoryUsage: Math.round(avg.memoryUsage / componentLogs.length),
      count: componentLogs.length
    };
  };

  const clearLogs = () => {
    localStorage.removeItem('performance-log');
    setPerformanceLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(performanceLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-log-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="btn-info"
          title="성능 디버그 (개발 모드)"
        >
          <ChartBarIcon className="h-6 w-6" />
        </button>
      </div>

      {/* 성능 디버그 모달 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  성능 디버그 패널
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportLogs}
                    className="btn-primary"
                  >
                    내보내기
                  </button>
                  <button
                    onClick={clearLogs}
                    className="btn-danger"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-80">
              {/* 필터 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  컴포넌트 필터
                </label>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="all">전체</option>
                  {uniqueComponents.map(component => (
                    <option key={component} value={component}>{component}</option>
                  ))}
                </select>
              </div>

              {/* 요약 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {uniqueComponents.map(component => {
                  const avg = getAverageMetrics(component);
                  if (!avg) return null;

                  return (
                    <div key={component} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {component}
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          로드: {avg.loadTime}ms
                        </div>
                        <div className="flex items-center">
                          <CpuChipIcon className="h-3 w-3 mr-1" />
                          렌더: {avg.renderTime}ms
                        </div>
                        <div className="flex items-center">
                          <SignalIcon className="h-3 w-3 mr-1" />
                          메모리: {avg.memoryUsage}MB
                        </div>
                        <div className="text-gray-500">
                          {avg.count}회 측정
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 상세 로그 */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">상세 로그</h4>
                
                {filteredLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm">성능 로그가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 20) // 최근 20개만 표시
                      .map((log, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{log.component}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                            <div>
                              로드: {log.metrics.loadTime}ms
                              {log.metrics.loadTime > 3000 && (
                                <span className="text-red-500 ml-1">⚠️</span>
                              )}
                            </div>
                            <div>
                              렌더: {log.metrics.renderTime}ms
                              {log.metrics.renderTime > 100 && (
                                <span className="text-red-500 ml-1">⚠️</span>
                              )}
                            </div>
                            <div>
                              메모리: {log.metrics.memoryUsage}MB
                              {log.metrics.memoryUsage > 50 && (
                                <span className="text-red-500 ml-1">⚠️</span>
                              )}
                            </div>
                          </div>

                          {log.metrics.networkType && (
                            <div className="text-xs text-gray-500 mt-1">
                              네트워크: {log.metrics.networkType} ({log.metrics.connectionSpeed})
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                성능 디버그 패널 (개발 모드 전용)<br />
                ⚠️ = 임계값 초과 (로드 3s, 렌더 100ms, 메모리 50MB)
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformanceDebug;