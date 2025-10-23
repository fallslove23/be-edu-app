import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  TrashIcon,
  WifiIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { OfflineStorageManager, SyncStatus, OfflineData, SyncConfig } from '../../utils/offlineStorage';
import { useAuth } from '../../contexts/AuthContext';

interface OfflineManagerProps {
  compact?: boolean;
}

const OfflineManager: React.FC<OfflineManagerProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    totalSize: 0
  });
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<OfflineData | null>(null);

  useEffect(() => {
    loadData();
    loadConfig();

    // 상태 변경 리스너 등록
    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    OfflineStorageManager.addStatusListener(statusListener);

    return () => {
      OfflineStorageManager.removeStatusListener(statusListener);
    };
  }, []);

  const loadData = async () => {
    try {
      const status = await OfflineStorageManager.getSyncStatus();
      setSyncStatus(status);

      const data = await OfflineStorageManager.getOfflineData();
      setOfflineData(data);
    } catch (error) {
      console.error('오프라인 데이터 로드 실패:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const cfg = await OfflineStorageManager.getConfig();
      setConfig(cfg);
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const handleSync = async () => {
    if (!syncStatus.isOnline) {
      alert('오프라인 상태에서는 동기화할 수 없습니다.');
      return;
    }

    setSyncing(true);
    try {
      const result = await OfflineStorageManager.syncNow();
      alert(`동기화 완료: 성공 ${result.success}개, 실패 ${result.failed}개, 충돌 ${result.conflicts}개`);
      await loadData();
    } catch (error) {
      console.error('동기화 실패:', error);
      alert('동기화에 실패했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (itemId: string, resolution: 'use_local' | 'use_remote' | 'merge') => {
    try {
      await OfflineStorageManager.resolveConflict(itemId, resolution);
      setSelectedConflict(null);
      await loadData();
    } catch (error) {
      console.error('충돌 해결 실패:', error);
      alert('충돌 해결에 실패했습니다.');
    }
  };

  const handleCleanup = async () => {
    if (confirm('30일 이상 된 동기화된 데이터를 정리하시겠습니까?')) {
      try {
        const result = await OfflineStorageManager.cleanupData();
        alert(`정리 완료: ${result.removed}개 항목 삭제, ${formatFileSize(result.sizeFreed)} 공간 확보`);
        await loadData();
      } catch (error) {
        console.error('데이터 정리 실패:', error);
        alert('데이터 정리에 실패했습니다.');
      }
    }
  };

  const handleConfigUpdate = async (newConfig: Partial<SyncConfig>) => {
    try {
      await OfflineStorageManager.updateConfig(newConfig);
      await loadConfig();
      setShowSettings(false);
    } catch (error) {
      console.error('설정 업데이트 실패:', error);
      alert('설정 업데이트에 실패했습니다.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: OfflineData['status']) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'conflict': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: OfflineData['status']) => {
    switch (status) {
      case 'synced': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'failed': return <XCircleIcon className="h-4 w-4" />;
      case 'conflict': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: OfflineData['type']) => {
    const labels = {
      course: '과정',
      attendance: '출석',
      exam: '시험',
      file: '파일',
      user_progress: '진도',
      notice: '공지'
    };
    return labels[type] || type;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className={`flex items-center space-x-1 ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <WifiIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {syncStatus.isOnline ? '온라인' : '오프라인'}
          </span>
        </div>
        
        {syncStatus.pendingCount > 0 && (
          <div className="flex items-center space-x-1 text-yellow-600">
            <CloudArrowUpIcon className="h-4 w-4" />
            <span className="text-sm">{syncStatus.pendingCount}</span>
          </div>
        )}
        
        {syncStatus.conflictCount > 0 && (
          <div className="flex items-center space-x-1 text-purple-600">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span className="text-sm">{syncStatus.conflictCount}</span>
          </div>
        )}
        
        <button
          onClick={handleSync}
          disabled={!syncStatus.isOnline || syncing}
          className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          title="동기화"
        >
          <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CloudArrowDownIcon className="h-8 w-8 mr-3 text-blue-600" />
              오프라인 동기화
            </h1>
            <p className="text-gray-600 mt-1">
              오프라인 데이터 관리 및 동기화 상태를 확인합니다
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="설정"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleCleanup}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="데이터 정리"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${syncStatus.isOnline ? 'border-green-200' : 'border-red-200'}`}>
          <div className="flex items-center">
            <WifiIcon className={`h-8 w-8 ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">연결 상태</p>
              <p className={`text-2xl font-bold ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {syncStatus.isOnline ? '온라인' : '오프라인'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CloudArrowUpIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">대기 중</p>
              <p className="text-2xl font-bold text-yellow-600">{syncStatus.pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">충돌</p>
              <p className="text-2xl font-bold text-purple-600">{syncStatus.conflictCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">저장 용량</p>
              <p className="text-2xl font-bold text-blue-600">{formatFileSize(syncStatus.totalSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 동기화 제어 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">동기화 제어</h3>
          {syncStatus.lastSyncTime && (
            <p className="text-sm text-gray-600">
              마지막 동기화: {new Date(syncStatus.lastSyncTime).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSync}
            disabled={!syncStatus.isOnline || syncing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '동기화 중...' : '지금 동기화'}
          </button>
          
          <div className="text-sm text-gray-600">
            {syncStatus.pendingCount > 0 && (
              <span className="mr-4">대기: {syncStatus.pendingCount}개</span>
            )}
            {syncStatus.failedCount > 0 && (
              <span className="mr-4 text-red-600">실패: {syncStatus.failedCount}개</span>
            )}
            {syncStatus.conflictCount > 0 && (
              <span className="text-purple-600">충돌: {syncStatus.conflictCount}개</span>
            )}
          </div>
        </div>
      </div>

      {/* 오프라인 데이터 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">오프라인 데이터 ({offlineData.length})</h3>
        
        {offlineData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            오프라인 데이터가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {offlineData.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    <span>
                      {item.status === 'synced' ? '동기화됨' :
                       item.status === 'pending' ? '대기 중' :
                       item.status === 'failed' ? '실패' : '충돌'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{getTypeLabel(item.type)}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(item.timestamp).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    {item.retryCount > 0 && (
                      <p className="text-xs text-gray-500">재시도 횟수: {item.retryCount}</p>
                    )}
                  </div>
                </div>
                
                {item.status === 'conflict' && (
                  <button
                    onClick={() => setSelectedConflict(item)}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    충돌 해결
                  </button>
                )}
              </div>
            ))}
            
            {offlineData.length > 10 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  {offlineData.length - 10}개 항목이 더 있습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 충돌 해결 모달 */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">충돌 해결</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">로컬 데이터:</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedConflict.data, null, 2)}
                </pre>
              </div>
              
              {selectedConflict.conflictData && (
                <div>
                  <h4 className="font-medium text-gray-700">서버 데이터:</h4>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedConflict.conflictData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleResolveConflict(selectedConflict.id, 'use_local')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                로컬 사용
              </button>
              <button
                onClick={() => handleResolveConflict(selectedConflict.id, 'use_remote')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                서버 사용
              </button>
              <button
                onClick={() => setSelectedConflict(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 설정 모달 */}
      {showSettings && config && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">동기화 설정</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  동기화 간격 (초)
                </label>
                <input
                  type="number"
                  defaultValue={config.syncInterval / 1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) => {
                    config.syncInterval = parseInt(e.target.value) * 1000;
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배치 크기
                </label>
                <input
                  type="number"
                  defaultValue={config.batchSize}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) => {
                    config.batchSize = parseInt(e.target.value);
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 재시도 횟수
                </label>
                <input
                  type="number"
                  defaultValue={config.maxRetries}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) => {
                    config.maxRetries = parseInt(e.target.value);
                  }}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleConfigUpdate(config)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                저장
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineManager;