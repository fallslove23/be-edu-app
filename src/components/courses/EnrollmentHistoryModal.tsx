import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  XMarkIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { CourseEnrollmentService } from '../../services/course-enrollment.service';
import type { EnrollmentHistory } from '../../types/course-enrollment.types';
import { enrollmentActionLabels } from '../../types/course-enrollment.types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EnrollmentHistoryModalProps {
  courseId: string;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
}

const EnrollmentHistoryModal: React.FC<EnrollmentHistoryModalProps> = ({
  courseId,
  courseName,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<EnrollmentHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<EnrollmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 데이터 로드
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const historyData = await CourseEnrollmentService.getEnrollmentHistory(courseId);
      setHistory(historyData);
      setFilteredHistory(historyData);
    } catch (error) {
      console.error('Failed to load enrollment history:', error);
      setError('배정 이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, courseId]);

  // 필터 적용
  useEffect(() => {
    let filtered = [...history];

    // 액션 필터
    if (actionFilter !== 'all') {
      filtered = filtered.filter(h => h.action === actionFilter);
    }

    // 날짜 필터
    const now = new Date();
    if (dateFilter !== 'all') {
      const days = dateFilter === 'today' ? 1 
                  : dateFilter === 'week' ? 7 
                  : dateFilter === 'month' ? 30 : 0;
      
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(h => new Date(h.action_date) >= cutoff);
      }
    }

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h => 
        h.trainee_name.toLowerCase().includes(term) ||
        h.action_by_name.toLowerCase().includes(term) ||
        (h.reason && h.reason.toLowerCase().includes(term))
      );
    }

    setFilteredHistory(filtered);
  }, [history, actionFilter, dateFilter, searchTerm]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy.MM.dd HH:mm', { locale: ko });
    } catch {
      return dateString;
    }
  };

  // 액션 배지 색상
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      case 'unenrolled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'dropped':
        return 'bg-yellow-100 text-yellow-800';
      case 'transferred':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
              배정 이력
            </h2>
            <p className="text-sm text-gray-600 mt-1">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* 검색바 */}
            <div className="relative">
              <input
                type="text"
                placeholder="교육생명, 담당자명, 사유로 검색..."
                className="block w-full pl-4 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 필터 토글 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                필터
                {showFilters ? (
                  <ChevronUpIcon className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>

              <div className="text-sm text-gray-600">
                총 {filteredHistory.length}개 이력
              </div>
            </div>

            {/* 확장 필터 */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">액션</label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="enrolled">등록</option>
                    <option value="unenrolled">등록해제</option>
                    <option value="completed">수료</option>
                    <option value="dropped">중도포기</option>
                    <option value="transferred">이전</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">최근 30일</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 이력 목록 */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '500px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">이력을 불러오는 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
              <p>{error}</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>배정 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredHistory.map((historyItem) => (
                <div key={historyItem.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeClass(historyItem.action)}`}>
                          {enrollmentActionLabels[historyItem.action]}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {historyItem.trainee_name}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2" />
                          <span>담당자: {historyItem.action_by_name}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span>{formatDate(historyItem.action_date)}</span>
                        </div>
                        
                        {historyItem.reason && (
                          <div className="flex items-start">
                            <DocumentTextIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{historyItem.reason}</span>
                          </div>
                        )}
                        
                        {historyItem.notes && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            {historyItem.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(historyItem.previous_status || historyItem.new_status) && (
                      <div className="ml-4 text-xs text-gray-500">
                        {historyItem.previous_status && (
                          <div>이전: {historyItem.previous_status}</div>
                        )}
                        {historyItem.new_status && (
                          <div>변경: {historyItem.new_status}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
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
    </div>
  );
};

export default EnrollmentHistoryModal;