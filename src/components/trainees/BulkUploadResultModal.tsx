import React from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { BulkUploadResult } from '../../types/trainee.types';

interface BulkUploadResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BulkUploadResult;
  onHandleDuplicates?: (duplicateIds: string[], action: 'update' | 'skip') => void;
}

const BulkUploadResultModal: React.FC<BulkUploadResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onHandleDuplicates
}) => {
  if (!isOpen) return null;

  const { success, failed, duplicates } = result;
  const totalProcessed = success.length + failed.length + duplicates.length;

  const handleDuplicateAction = (action: 'update' | 'skip') => {
    if (onHandleDuplicates && duplicates.length > 0) {
      const duplicateIds = duplicates.map(d => d.existingTrainee.id);
      onHandleDuplicates(duplicateIds, action);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            업로드 결과
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">전체 처리</p>
                  <p className="text-2xl font-bold text-blue-600">{totalProcessed}명</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-900">성공</p>
                  <p className="text-2xl font-bold text-green-600">{success.length}명</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentDuplicateIcon className="h-8 w-8 text-foreground mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">중복</p>
                  <p className="text-2xl font-bold text-foreground">{duplicates.length}명</p>
                </div>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-destructive mr-3" />
                <div>
                  <p className="text-sm font-medium text-destructive">실패</p>
                  <p className="text-2xl font-bold text-destructive">{failed.length}명</p>
                </div>
              </div>
            </div>
          </div>

          {/* 성공 목록 */}
          {success.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                성공적으로 등록된 교육생 ({success.length}명)
              </h3>
              <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
                <div className="max-h-40 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {success.map((trainee, index) => (
                      <div key={index} className="flex items-center text-sm text-green-800">
                        <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {trainee.name} ({trainee.department})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 중복 목록 */}
          {duplicates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <DocumentDuplicateIcon className="h-5 w-5 text-foreground mr-2" />
                중복된 교육생 ({duplicates.length}명)
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="mb-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    다음 교육생들은 이미 시스템에 등록되어 있습니다:
                  </p>
                  {onHandleDuplicates && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => handleDuplicateAction('update')}
                        className="px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-full hover:bg-yellow-200"
                      >
                        기존 정보 업데이트
                      </button>
                      <button
                        onClick={() => handleDuplicateAction('skip')}
                        className="px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-full hover:bg-yellow-200"
                      >
                        건너뛰기
                      </button>
                    </div>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {duplicates.map((duplicate, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-yellow-200 last:border-b-0">
                      <div className="flex items-center text-sm">
                        <UserIcon className="h-4 w-4 mr-2 text-foreground flex-shrink-0" />
                        <span className="font-medium">{duplicate.trainee.name}</span>
                        <span className="mx-2 text-foreground">→</span>
                        <span className="text-yellow-800">
                          기존: {duplicate.existingTrainee.name} ({duplicate.duplicateField === 'email' ? duplicate.existingTrainee.email : duplicate.existingTrainee.employee_id})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 실패 목록 */}
          {failed.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive mr-2" />
                등록 실패한 교육생 ({failed.length}명)
              </h3>
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {failed.map((failedItem, index) => (
                    <div key={index} className="bg-white border border-destructive/50 rounded p-3">
                      <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-4 w-4 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-destructive">
                            {failedItem.trainee.name || '이름 없음'}
                            {failedItem.trainee.email && ` (${failedItem.trainee.email})`}
                          </p>
                          <p className="text-sm text-destructive mt-1">{failedItem.error}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadResultModal;