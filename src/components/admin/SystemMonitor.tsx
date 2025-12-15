import React, { useState, useEffect, useRef } from 'react';
import {
  CpuChipIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  ServerIcon,
  GlobeAltIcon,
  CircleStackIcon,
  UserIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  resolved?: boolean;
}

interface ConnectionInfo {
  activeUsers: number;
  totalSessions: number;
  avgResponseTime: number;
  requestsPerMinute: number;
}

const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    activeUsers: 0,
    totalSessions: 0,
    avgResponseTime: 0,
    requestsPerMinute: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(5); // seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    generateInitialData();
    startMonitoring();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [isMonitoring, autoRefresh]);

  const generateInitialData = () => {
    const initialMetrics: PerformanceMetric[] = [
      {
        id: 'cpu',
        name: 'CPU 사용률',
        value: Math.floor(Math.random() * 40 + 20), // 20-60%
        unit: '%',
        threshold: 80,
        status: 'good',
        trend: 'stable',
        history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 40 + 20))
      },
      {
        id: 'memory',
        name: '메모리 사용률',
        value: Math.floor(Math.random() * 30 + 40), // 40-70%
        unit: '%',
        threshold: 85,
        status: 'good',
        trend: 'up',
        history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 30 + 40))
      },
      {
        id: 'disk',
        name: '디스크 사용률',
        value: Math.floor(Math.random() * 20 + 60), // 60-80%
        unit: '%',
        threshold: 90,
        status: 'warning',
        trend: 'up',
        history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 20 + 60))
      },
      {
        id: 'network',
        name: '네트워크 대역폭',
        value: Math.floor(Math.random() * 50 + 25), // 25-75%
        unit: '%',
        threshold: 90,
        status: 'good',
        trend: 'stable',
        history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 50 + 25))
      },
      {
        id: 'response_time',
        name: '평균 응답시간',
        value: Math.floor(Math.random() * 200 + 100), // 100-300ms
        unit: 'ms',
        threshold: 500,
        status: 'good',
        trend: 'down',
        history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 200 + 100))
      },
      {
        id: 'error_rate',
        name: '오류율',
        value: parseFloat((Math.random() * 2).toFixed(2)), // 0-2%
        unit: '%',
        threshold: 5,
        status: 'good',
        trend: 'stable',
        history: Array.from({ length: 20 }, () => parseFloat((Math.random() * 2).toFixed(2)))
      }
    ];

    const initialAlerts: SystemAlert[] = [
      {
        id: 'alert-1',
        type: 'warning',
        title: '디스크 공간 부족',
        message: '시스템 디스크 사용량이 75%를 초과했습니다. 정리가 필요합니다.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'alert-2',
        type: 'info',
        title: '백업 완료',
        message: '일일 자동 백업이 성공적으로 완료되었습니다.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: true
      }
    ];

    setMetrics(initialMetrics);
    setAlerts(initialAlerts);
    updateConnectionInfo();
  };

  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateMetrics();
      updateConnectionInfo();
      checkForAlerts();
    }, autoRefresh * 1000);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateMetrics = () => {
    setMetrics(prev => prev.map(metric => {
      const variance = Math.random() * 10 - 5; // -5 to +5
      let newValue = Math.max(0, Math.min(100, metric.value + variance));

      // 특별한 로직 추가
      if (metric.id === 'response_time') {
        newValue = Math.max(50, Math.min(1000, metric.value + variance * 10));
      } else if (metric.id === 'error_rate') {
        newValue = Math.max(0, Math.min(10, metric.value + variance * 0.1));
        newValue = parseFloat(newValue.toFixed(2));
      }

      // 상태 업데이트
      let status: 'good' | 'warning' | 'critical' = 'good';
      if (metric.id === 'error_rate') {
        if (newValue >= metric.threshold) status = 'critical';
        else if (newValue >= metric.threshold * 0.7) status = 'warning';
      } else {
        if (newValue >= metric.threshold) status = 'critical';
        else if (newValue >= metric.threshold * 0.8) status = 'warning';
      }

      // 트렌드 계산
      const recentHistory = [...metric.history.slice(-4), newValue];
      const trend = recentHistory[recentHistory.length - 1] > recentHistory[0] ? 'up' :
        recentHistory[recentHistory.length - 1] < recentHistory[0] ? 'down' : 'stable';

      return {
        ...metric,
        value: newValue,
        status,
        trend,
        history: [...metric.history.slice(-19), newValue]
      };
    }));
  };

  const updateConnectionInfo = () => {
    setConnectionInfo({
      activeUsers: Math.floor(Math.random() * 50 + 20), // 20-70
      totalSessions: Math.floor(Math.random() * 100 + 150), // 150-250
      avgResponseTime: Math.floor(Math.random() * 200 + 100), // 100-300ms
      requestsPerMinute: Math.floor(Math.random() * 500 + 200) // 200-700
    });
  };

  const checkForAlerts = () => {
    const currentTime = new Date().toISOString();

    // CPU 사용률 체크
    const cpuMetric = metrics.find(m => m.id === 'cpu');
    if (cpuMetric && cpuMetric.value > 90) {
      const existingAlert = alerts.find(a => a.title.includes('CPU') && !a.resolved);
      if (!existingAlert) {
        const newAlert: SystemAlert = {
          id: `cpu-alert-${Date.now()}`,
          type: 'error',
          title: 'CPU 과부하 경고',
          message: `CPU 사용률이 ${cpuMetric.value}%에 달했습니다. 시스템 성능 점검이 필요합니다.`,
          timestamp: currentTime
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }

    // 메모리 사용률 체크
    const memoryMetric = metrics.find(m => m.id === 'memory');
    if (memoryMetric && memoryMetric.value > 90) {
      const existingAlert = alerts.find(a => a.title.includes('메모리') && !a.resolved);
      if (!existingAlert) {
        const newAlert: SystemAlert = {
          id: `memory-alert-${Date.now()}`,
          type: 'warning',
          title: '메모리 부족 경고',
          message: `메모리 사용률이 ${memoryMetric.value}%입니다. 불필요한 프로세스를 정리하세요.`,
          timestamp: currentTime
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? { ...alert, resolved: true }
          : alert
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-900/30';
      case 'warning': return 'text-orange-600 dark:text-orange-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'critical': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'down': return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 dark:bg-gray-500 rounded-lg"></div>;
      default: return null;
    }
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu': return <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'memory': return <ServerIcon className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'disk': return <CircleStackIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
      case 'network': return <GlobeAltIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />;
      case 'response_time': return <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />;
      case 'error_rate': return <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />;
      default: return <ChartBarIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MiniChart: React.FC<{ data: number[] }> = ({ data }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="flex items-end space-x-1 h-8 w-20">
        {data.slice(-8).map((value, index) => {
          const height = ((value - min) / range) * 100;
          return (
            <div
              key={index}
              className="bg-blue-500 dark:bg-blue-400 w-2 opacity-70 rounded-t-sm"
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📊 시스템 모니터</h1>
              <p className="text-gray-600 dark:text-gray-400">
                실시간 시스템 성능 및 리소스 사용량을 모니터링합니다.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value={1}>1초마다</option>
                <option value={5}>5초마다</option>
                <option value={10}>10초마다</option>
                <option value={30}>30초마다</option>
              </select>
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 transition-all ${isMonitoring
                  ? 'bg-red-500 hover:bg-red-600 shadow-sm hover:shadow'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow'
                  }`}
              >
                {isMonitoring ? (
                  <>
                    <PauseIcon className="h-4 w-4" />
                    <span>일시정지</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4" />
                    <span>시작</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 연결 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">활성 사용자</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{connectionInfo.activeUsers}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">총 세션</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{connectionInfo.totalSessions}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <ServerIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">평균 응답</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{connectionInfo.avgResponseTime}ms</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">요청/분</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{connectionInfo.requestsPerMinute}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <BoltIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 성능 메트릭 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">시스템 성능 메트릭</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <div key={metric.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-md transition-all bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {getMetricIcon(metric.id)}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{metric.name}</span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {metric.value}{metric.unit}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(metric.status)}`}>
                      {getStatusIcon(metric.status)}
                      <span>
                        {metric.status === 'good' ? '양호' :
                          metric.status === 'warning' ? '주의' : '위험'}
                      </span>
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                      <span>0</span>
                      <span>임계값: {metric.threshold}{metric.unit}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${metric.status === 'critical' ? 'bg-red-500' :
                          metric.status === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                        style={{
                          width: `${Math.min(100, (metric.value / (metric.id === 'response_time' ? 1000 : 100)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">최근 추이</span>
                    <MiniChart data={metric.history} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 시스템 알림 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              시스템 알림 ({alerts.filter(a => !a.resolved).length})
            </h3>
            {alerts.length > 0 && (
              <button
                onClick={() => setAlerts([])}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                모두 지우기
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${alert.resolved ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      alert.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                      <ExclamationTriangleIcon className={`h-5 w-5 ${alert.type === 'error' ? 'text-red-600 dark:text-red-400' :
                        alert.type === 'warning' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{alert.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">{formatDate(alert.timestamp)}</p>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-4 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      해결됨
                    </button>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">모든 시스템이 정상입니다</h4>
                <p className="text-gray-500 dark:text-gray-400">현재 활성화된 알림이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default React.memo(SystemMonitor);