import React, { useState } from 'react';
import {
  WifiIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useOffline } from '../../hooks/useOffline';

const OfflineIndicator: React.FC = () => {
  const { 
    isOffline, 
    isOnline, 
    queuedCount, 
    syncInProgress, 
    syncQueuedRequests,
    clearQueue,
    offlineDuration 
  } = useOffline();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 온라인 상태면 표시하지 않음
  if (isOnline && queuedCount === 0) return null;

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
            isOffline
              ? 'bg-destructive/10 border-destructive/50 text-destructive'
              : 'bg-green-500/10 border-green-200 text-green-800'
          } ${isExpanded ? 'p-4' : 'p-3'}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            {syncInProgress ? (
              <CloudArrowUpIcon className="h-5 w-5 animate-pulse" />
            ) : isOffline ? (
              <ExclamationTriangleIcon className="h-5 w-5" />
            ) : (
              <WifiIcon className="h-5 w-5" />
            )}
            
            <span className="font-medium text-sm">
              {syncInProgress
                ? '동기화 중...'
                : isOffline
                ? '오프라인'
                : '온라인 복구됨'
              }
            </span>
            
            {queuedCount > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                isOffline 
                  ? 'bg-red-200 text-destructive'
                  : 'bg-green-200 text-green-800'
              }`}>
                {queuedCount}
              </span>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3">
              <div className="text-sm opacity-75">
                {isOffline ? (
                  <div className="space-y-1">
                    <p>현재 인터넷 연결이 끊어졌습니다.</p>
                    {offlineDuration && (
                      <p>오프라인 지속 시간: {formatDuration(offlineDuration)}</p>
                    )}
                    <p>연결이 복구되면 자동으로 동기화됩니다.</p>
                  </div>
                ) : (
                  <p>인터넷 연결이 복구되었습니다.</p>
                )}
              </div>

              {queuedCount > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    동기화 대기 중인 작업: {queuedCount}개
                  </div>
                  
                  <div className="flex space-x-2">
                    {isOnline && !syncInProgress && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          syncQueuedRequests();
                        }}
                        className="btn-primary"
                      >
                        지금 동기화
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(true);
                      }}
                      className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors"
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
                  오프라인 작업 상태
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
                  {isOffline ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                  ) : (
                    <WifiIcon className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {isOffline ? '오프라인 상태' : '온라인 상태'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {offlineDuration && isOffline && (
                        `${formatDuration(offlineDuration)} 동안 오프라인`
                      )}
                    </div>
                  </div>
                </div>

                {/* 큐 상태 */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">동기화 대기열</span>
                  </div>
                  
                  {queuedCount === 0 ? (
                    <p className="text-sm text-gray-600">
                      동기화 대기 중인 작업이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {queuedCount}개 작업이 동기화를 기다리고 있습니다.
                      </p>
                      
                      <div className="space-y-2">
                        {isOnline && !syncInProgress && (
                          <button
                            onClick={() => {
                              syncQueuedRequests();
                              setShowDetails(false);
                            }}
                            className="btn-primary"
                          >
                            <CloudArrowUpIcon className="h-4 w-4 inline mr-2" />
                            지금 동기화
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm('정말로 모든 대기 중인 작업을 삭제하시겠습니까?')) {
                              clearQueue();
                              setShowDetails(false);
                            }
                          }}
                          className="btn-danger"
                        >
                          모든 작업 삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {syncInProgress && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center space-x-2">
                      <CloudArrowUpIcon className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="text-sm text-blue-800">동기화가 진행 중입니다...</span>
                    </div>
                  </div>
                )}
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