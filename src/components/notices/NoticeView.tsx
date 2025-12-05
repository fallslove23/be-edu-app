import React, { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status: 'published' | 'draft' | 'archived';
  created_by: string;
  created_at: string;
  views: number;
  is_pinned: boolean;
}

const NoticeView: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      // 목업 데이터 (published 공지사항만)
      const mockNotices: Notice[] = [
        {
          id: '1',
          title: '🎯 새로운 영업 교육 과정 개설 안내',
          content: 'BS 영업 기초과정과 고급 영업 전략 과정이 새롭게 개설되었습니다. 수강 신청은 다음 주부터 가능합니다.',
          priority: 'high',
          status: 'published',
          created_by: '관리자',
          created_at: '2024-08-20T09:00:00Z',
          views: 156,
          is_pinned: true
        },
        {
          id: '2',
          title: '📚 교육 자료 업데이트 안내',
          content: '영업 프레젠테이션 자료와 고객 관리 매뉴얼이 업데이트되었습니다. 새로운 자료는 각 과정 페이지에서 다운로드 가능합니다.',
          priority: 'medium',
          status: 'published',
          created_by: '교육팀',
          created_at: '2024-08-19T14:30:00Z',
          views: 89,
          is_pinned: false
        },
        {
          id: '3',
          title: '💼 실습 평가 일정 변경 안내',
          content: '8월 25일 예정된 실습 평가가 8월 27일로 변경되었습니다. 자세한 사항은 담당 강사에게 문의해주세요.',
          priority: 'high',
          status: 'published',
          created_by: '교육운영팀',
          created_at: '2024-08-18T11:15:00Z',
          views: 234,
          is_pinned: true
        },
        {
          id: '4',
          title: '🎉 우수 교육생 선발 결과 발표',
          content: '7월 우수 교육생으로 김영업님, 이실무님, 박전략님이 선발되었습니다. 축하드립니다!',
          priority: 'medium',
          status: 'published',
          created_by: '인사팀',
          created_at: '2024-08-17T16:00:00Z',
          views: 178,
          is_pinned: false
        },
        {
          id: '5',
          title: '📞 시스템 점검 안내',
          content: '8월 24일 새벽 2시~4시 시스템 점검으로 인해 학습 플랫폼 이용이 제한됩니다.',
          priority: 'low',
          status: 'published',
          created_by: 'IT팀',
          created_at: '2024-08-16T10:30:00Z',
          views: 145,
          is_pinned: false
        }
      ];

      setNotices(mockNotices);
    } catch (error) {
      console.error('Failed to load notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = notices.filter(notice =>
    notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notice.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNotices = [...filteredNotices].sort((a, b) => {
    // 고정된 공지사항을 먼저, 그 다음 날짜순
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '중요';
      case 'medium':
        return '보통';
      case 'low':
        return '일반';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">공지사항을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <MegaphoneIcon className="h-9 w-9 mr-3 text-blue-600 dark:text-blue-400" />
            공지사항
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            최신 교육 소식과 중요 안내사항을 확인하세요.
          </p>
        </div>

        {/* 검색 */}
        {!selectedNotice && (
          <div className="mb-8">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="공지사항 검색..."
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 공지사항 목록 */}
        {selectedNotice ? (
          // 상세 보기
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedNotice(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mb-6 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                목록으로 돌아가기
              </button>

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedNotice.is_pinned && (
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center">
                        <StarSolidIcon className="h-3 w-3 mr-1" />
                        고정
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityClass(selectedNotice.priority)}`}>
                      {getPriorityLabel(selectedNotice.priority)}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                    {selectedNotice.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pb-2">
                    <span className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1.5" />
                      {selectedNotice.created_by}
                    </span>
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1.5" />
                      {format(parseISO(selectedNotice.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </span>
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1.5" />
                      {selectedNotice.views}회 조회
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-white dark:bg-gray-800">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                  {selectedNotice.content}
                </p>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          // 목록 보기
          <div className="space-y-4">
            {sortedNotices.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <MegaphoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">등록된 공지사항이 없습니다.</p>
                {searchTerm && <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">검색어를 변경해보세요.</p>}
              </div>
            ) : (
              sortedNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 cursor-pointer group ${notice.is_pinned
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  onClick={() => setSelectedNotice(notice)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {notice.is_pinned && (
                          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md flex items-center">
                            <StarSolidIcon className="h-3 w-3 mr-1" />
                            고정
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getPriorityClass(notice.priority)}`}>
                          {getPriorityLabel(notice.priority)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {notice.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {notice.content}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center">
                          <UserIcon className="h-3.5 w-3.5 mr-1" />
                          {notice.created_by}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          {format(parseISO(notice.created_at), 'MM/dd HH:mm', { locale: ko })}
                        </span>
                        <span className="flex items-center">
                          <EyeIcon className="h-3.5 w-3.5 mr-1" />
                          {notice.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeView;