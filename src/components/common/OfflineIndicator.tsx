import React, { useState, useEffect } from 'react';
import {
  WifiIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useOfflineStatus } from '../../hooks/useOfflineSync';

const OfflineIndicator: React.FC = () => {
  const { 
    isOnline, 
    isPending, 
    hasConflicts, 
    pendingCount, 
    conflictCount, 
    lastSyncTime 
  } = useOfflineStatus();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 오프라인이거나 대기/충돌이 있으면 표시
    if (!isOnline || isPending || hasConflicts) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, isPending, hasConflicts]);

  // 온라인이고 문제없으면 자동 숨김
  useEffect(() => {
    if (isOnline && !isPending && !hasConflicts) {
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isPending, hasConflicts]);

  // 표시할 필요가 없으면 숨김
  if (!showIndicator) return null;

  const formatDuration = (ms?: number): string => {
    if (!ms) return '';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
    if (minutes > 0) return `${minutes}분 ${seconds % 60}초`;
    return `${seconds}초`;
  };

  return (
    <>
      {/* 메인 오프라인 표시기 */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}
      >
        <div
          className={`rounded-full shadow-lg border backdrop-blur-sm cursor-pointer transition-all duration-200 ${
            !isOnline
              ? 'bg-destructive/10 border-destructive/50 text-destructive'
              : hasConflicts
              ? 'bg-purple-50 border-purple-200 text-purple-800'
              : isPending
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-green-500/10 border-green-200 text-green-800'
          } ${isExpanded ? 'p-4' : 'p-3'}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {!isOnline ? (
              <ExclamationTriangleIcon className="h-5 w-5" />
            ) : hasConflicts ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-purple-500" />
            ) : isPending ? (
              <CloudArrowUpIcon className="h-5 w-5 animate-bounce" />
            ) : (
              <WifiIcon className="h-5 w-5" />
            )}
            
            <span className="font-medium text-sm">
              {!isOnline
                ? '오프라인'
                : hasConflicts
                ? `충돌 ${conflictCount}개`
                : isPending
                ? `동기화 대기 ${pendingCount}개`
                : '온라인 복구됨'
              }
            </span>
            
            {(pendingCount > 0 || conflictCount > 0) && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                !isOnline 
                  ? 'bg-red-200 text-destructive'
                  : hasConflicts
                  ? 'bg-purple-200 text-purple-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}>
                {conflictCount > 0 ? conflictCount : pendingCount}
              </span>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3">
              <div className="text-sm opacity-75">
                {!isOnline ? (
                  <div className="space-y-1">
                    <p>현재 인터넷 연결이 끊어졌습니다.</p>
                    <p>연결이 복구되면 자동으로 동기화됩니다.</p>
                  </div>
                ) : hasConflicts ? (
                  <p>데이터 충돌이 발견되었습니다. 해결이 필요합니다.</p>
                ) : isPending ? (
                  <p>동기화 대기 중인 데이터가 있습니다.</p>
                ) : (
                  <p>인터넷 연결이 복구되었습니다.</p>
                )}
              </div>

              {(pendingCount > 0 || conflictCount > 0) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {hasConflicts 
                      ? `충돌: ${conflictCount}개` 
                      : `동기화 대기: ${pendingCount}개`
                    }
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(true);
                      }}
                      className="btn-primary"
                    >
                      상세 보기
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  동기화 상태
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* 현재 상태 */}
                <div className="flex items-center space-x-3">
                  {!isOnline ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                  ) : (
                    <WifiIcon className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {!isOnline ? '오프라인 상태' : '온라인 상태'}
                    </div>
                    {lastSyncTime && (
                      <div className="text-sm text-gray-500">
                        마지막 동기화: {new Date(lastSyncTime).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* 동기화 상태 */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">동기화 상태</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {pendingCount > 0 && (
                      <p>• 대기 중: {pendingCount}개</p>
                    )}
                    {conflictCount > 0 && (
                      <p>• 충돌: {conflictCount}개</p>
                    )}
                    {pendingCount === 0 && conflictCount === 0 && (
                      <p>모든 데이터가 동기화되었습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                오프라인 상태에서도 앱을 사용할 수 있습니다.<br />
                연결이 복구되면 자동으로 동기화됩니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;