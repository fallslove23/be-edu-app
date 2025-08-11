import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  XMarkIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CourseEnrollmentService } from '../../services/course-enrollment.service';
import type { WaitingListEntry } from '../../types/course-enrollment.types';
import { waitingListStatusLabels } from '../../types/course-enrollment.types';
import type { Course } from '../../types/course.types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface WaitingListManagerProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onWaitingListUpdate?: () => void;
}

const WaitingListManager: React.FC<WaitingListManagerProps> = ({
  course,
  isOpen,
  onClose,
  onWaitingListUpdate
}) => {
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // 대기자 목록 로드
  const loadWaitingList = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await CourseEnrollmentService.getWaitingList(course.id);
      setWaitingList(list);
    } catch (error) {
      console.error('Failed to load waiting list:', error);
      setError('대기자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWaitingList();
    }
  }, [isOpen, course.id]);

  // 우선 배정
  const handlePriorityEnroll = async (entry: WaitingListEntry) => {
    if (!confirm(`${entry.trainee_name}님을 우선 배정하시겠습니까?`)) {
      return;
    }

    try {
      setProcessing(entry.id);
      // TODO: 실제 우선 배정 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 대기
      
      toast.success(`${entry.trainee_name}님이 우선 배정되었습니다.`);
      loadWaitingList();
      onWaitingListUpdate?.();
      
    } catch (error) {
      console.error('Failed to priority enroll:', error);
      toast.error('우선 배정에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  // 대기순번 변경
  const handlePositionChange = async (entryId: string, _newPosition: number) => {
    try {
      setProcessing(entryId);
      // TODO: 실제 순번 변경 API 호출
      await new Promise(resolve => setTimeout(resolve, 500)); // 임시 대기
      
      toast.success('대기순번이 변경되었습니다.');
      loadWaitingList();
      
    } catch (error) {
      console.error('Failed to change position:', error);
      toast.error('순번 변경에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  // 대기자 제거
  const handleRemoveFromWaitingList = async (entry: WaitingListEntry) => {
    if (!confirm(`${entry.trainee_name}님을 대기자 목록에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      setProcessing(entry.id);
      // TODO: 실제 대기자 제거 API 호출
      await new Promise(resolve => setTimeout(resolve, 500)); // 임시 대기
      
      toast.success(`${entry.trainee_name}님이 대기자 목록에서 제거되었습니다.`);
      loadWaitingList();
      onWaitingListUpdate?.();
      
    } catch (error) {
      console.error('Failed to remove from waiting list:', error);
      toast.error('대기자 제거에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  // 전체 대기자 자동 배정 처리
  const handleProcessWaitingList = async () => {
    if (!confirm('대기자 목록을 자동으로 처리하시겠습니까? 정원 내에서 순번대로 자동 배정됩니다.')) {
      return;
    }

    try {
      setProcessing('all');
      await CourseEnrollmentService.processWaitingList(course.id);
      toast.success('대기자 목록이 처리되었습니다.');
      loadWaitingList();
      onWaitingListUpdate?.();
      
    } catch (error) {
      console.error('Failed to process waiting list:', error);
      toast.error('대기자 목록 처리에 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  // 우선순위 배지 색상
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 배지 색상
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'notified':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  const availableSpots = course.max_trainees - course.current_trainees;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-yellow-600" />
              대기자 관리
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {course.name} - 현재 {availableSpots}자리 남음
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {waitingList.length > 0 && availableSpots > 0 && (
              <button
                onClick={handleProcessWaitingList}
                disabled={processing !== null}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <UserPlusIcon className="h-4 w-4 mr-1" />
                자동 처리
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 현황 정보 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{waitingList.length}</div>
              <div className="text-sm text-gray-600">총 대기자</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{availableSpots}</div>
              <div className="text-sm text-gray-600">배정 가능</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {waitingList.filter(w => w.priority !== 'normal').length}
              </div>
              <div className="text-sm text-gray-600">우선순위</div>
            </div>
          </div>
        </div>

        {/* 대기자 목록 */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">대기자 목록을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
              <p>{error}</p>
            </div>
          ) : waitingList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>대기자가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {waitingList.map((entry, _index) => (
                <div key={entry.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    {/* 대기자 정보 */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* 순번 */}
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold text-gray-900">
                          {entry.position}
                        </div>
                        <div className="text-xs text-gray-500">순번</div>
                      </div>

                      {/* 교육생 정보 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{entry.trainee_name}</h4>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadgeClass(entry.priority)}`}>
                            {entry.priority === 'urgent' ? '긴급' 
                             : entry.priority === 'high' ? '높음' : '일반'}
                          </span>
                          
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(entry.status)}`}>
                            {waitingListStatusLabels[entry.status]}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {entry.trainee_email}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1">
                          요청일: {formatDate(entry.requested_at)}
                          {entry.estimated_enrollment_date && (
                            <span className="ml-2">
                              • 예상 배정일: {formatDate(entry.estimated_enrollment_date)}
                            </span>
                          )}
                        </div>
                        
                        {entry.notes && (
                          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center space-x-1">
                      {/* 순번 변경 */}
                      {entry.position > 1 && (
                        <button
                          onClick={() => handlePositionChange(entry.id, entry.position - 1)}
                          disabled={processing === entry.id}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="순번 올리기"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {entry.position < waitingList.length && (
                        <button
                          onClick={() => handlePositionChange(entry.id, entry.position + 1)}
                          disabled={processing === entry.id}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="순번 내리기"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* 우선 배정 */}
                      {availableSpots > 0 && (
                        <button
                          onClick={() => handlePriorityEnroll(entry)}
                          disabled={processing === entry.id}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="우선 배정"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      )}

                      {/* 제거 */}
                      <button
                        onClick={() => handleRemoveFromWaitingList(entry)}
                        disabled={processing === entry.id}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="대기자 제거"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {processing === entry.id && (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      처리 중...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        {waitingList.length > 0 && availableSpots > 0 && (
          <div className="p-4 border-t border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div className="text-sm text-blue-800">
                현재 {availableSpots}자리가 남아있어 {Math.min(availableSpots, waitingList.length)}명을 즉시 배정할 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* 하단 */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 전체 처리 중 오버레이 */}
      {processing === 'all' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-700">대기자 목록을 처리하는 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingListManager;