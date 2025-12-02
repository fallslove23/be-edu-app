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
  Cog6ToothIcon,
  EyeIcon,
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
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
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
      case 'good': return 'text-green-600 bg-green-500/10';
      case 'warning': return 'text-orange-600 bg-yellow-100';
      case 'critical': return 'text-destructive bg-destructive/10';
      default: return 'text-gray-600 bg-gray-100';
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
      case 'up': return <ArrowTrendingUpIcon className="h-4 w-4 text-destructive" />;
      case 'down': return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-lg"></div>;
      default: return null;
    }
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu': return <CpuChipIcon className="h-6 w-6 text-blue-600" />;
      case 'memory': return <ServerIcon className="h-6 w-6 text-green-600" />;
      case 'disk': return <CircleStackIcon className="h-6 w-6 text-purple-600" />;
      case 'network': return <GlobeAltIcon className="h-6 w-6 text-orange-600" />;
      case 'response_time': return <ClockIcon className="h-6 w-6 text-indigo-600" />;
      case 'error_rate': return <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />;
      default: return <ChartBarIcon className="h-6 w-6 text-gray-600" />;
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
              className="bg-blue-500 w-2 opacity-70"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 시스템 모니터</h1>
              <p className="text-gray-600">
                실시간 시스템 성능 및 리소스 사용량을 모니터링합니다.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value={1}>1초마다</option>
                <option value={5}>5초마다</option>
                <option value={10}>10초마다</option>
                <option value={30}>30초마다</option>
              </select>
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`px-4 py-2 rounded-lg text-white flex items-center space-x-2 ${isMonitoring ? 'btn-danger' : 'btn-primary'
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-blue-600">{connectionInfo.activeUsers}</p>
              </div>
              <UserIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 세션</p>
                <p className="text-2xl font-bold text-green-600">{connectionInfo.totalSessions}</p>
              </div>
              <ServerIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 응답</p>
                <p className="text-2xl font-bold text-purple-600">{connectionInfo.avgResponseTime}ms</p>
              </div>
              <ClockIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">요청/분</p>
                <p className="text-2xl font-bold text-orange-600">{connectionInfo.requestsPerMinute}</p>
              </div>
              <BoltIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 성능 메트릭 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">시스템 성능 메트릭</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getMetricIcon(metric.id)}
                      <span className="font-medium text-gray-900">{metric.name}</span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}{metric.unit}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {getStatusIcon(metric.status)}
                      <span>
                        {metric.status === 'good' ? '양호' :
                          metric.status === 'warning' ? '주의' : '위험'}
                      </span>
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>0</span>
                      <span>임계값: {metric.threshold}{metric.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-lg h-2">
                      <div
                        className={`h-2 rounded-lg ${metric.status === 'critical' ? 'bg-red-500' :
                            metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{
                          width: `${Math.min(100, (metric.value / (metric.id === 'response_time' ? 1000 : 100)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">최근 추이</span>
                    <MiniChart data={metric.history} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 시스템 알림 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                시스템 알림 ({alerts.filter(a => !a.resolved).length})
              </h3>
              <button
                onClick={() => setAlerts([])}
                className="btn-ghost text-sm"
              >
                모두 지우기
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-4 ${alert.resolved ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-lg ${alert.type === 'error' ? 'bg-destructive/10' :
                        alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                      <ExclamationTriangleIcon className={`h-4 w-4 ${alert.type === 'error' ? 'text-destructive' :
                          alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                        }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDate(alert.timestamp)}</p>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="btn-ghost text-sm text-blue-600 hover:text-blue-900"
                    >
                      해결됨
                    </button>
                  )}
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="p-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">모든 시스템이 정상입니다</h4>
                <p className="text-gray-600">현재 활성화된 알림이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SystemMonitor;