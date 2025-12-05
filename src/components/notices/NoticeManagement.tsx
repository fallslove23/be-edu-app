'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Clock,
  User,
  X
} from 'lucide-react';
import { PageContainer } from '../common/PageContainer';

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

const NoticeManagement: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      // 목업 데이터
      const mockNotices: Notice[] = [
        {
          id: '1',
          title: '🎯 새로운 영업 교육 과정 개설 안내',
          content: 'BS 영업 기초과정과 고급 영업 전략 과정이 새롭게 개설되었습니다. 수강 신청은 다음 주부터 가능합니다.',
          priority: 'high',
          status: 'published',
          created_by: '관리자',
          created_at: '2024-08-20T09:00:00Z',
          views: 245,
          is_pinned: true
        },
        {
          id: '2',
          title: '📅 8월 정기 시험 일정 공지',
          content: '8월 정기 시험이 8월 25일 진행됩니다. 출석 확인 및 시험 준비를 완료해주세요.',
          priority: 'high',
          status: 'published',
          created_by: '교육팀',
          created_at: '2024-08-18T14:30:00Z',
          views: 189,
          is_pinned: true
        },
        {
          id: '3',
          title: '✅ 출석 관리 시스템 업데이트',
          content: '출석 관리 시스템이 업데이트되어 더욱 편리하게 이용할 수 있습니다.',
          priority: 'medium',
          status: 'published',
          created_by: '시스템팀',
          created_at: '2024-08-15T11:20:00Z',
          views: 156,
          is_pinned: false
        },
        {
          id: '4',
          title: '📚 신규 교육 자료 업로드 완료',
          content: 'CRM 시스템 활용 교육 자료가 새롭게 업로드되었습니다.',
          priority: 'medium',
          status: 'published',
          created_by: '교육팀',
          created_at: '2024-08-12T16:45:00Z',
          views: 134,
          is_pinned: false
        },
        {
          id: '5',
          title: '🔧 시스템 점검 안내 (임시저장)',
          content: '다음 주 화요일 시스템 점검 예정입니다.',
          priority: 'low',
          status: 'draft',
          created_by: '시스템팀',
          created_at: '2024-08-10T10:00:00Z',
          views: 0,
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

  // 필터링된 공지사항
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || notice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'archived': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Megaphone className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
              공지사항 관리
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              중요한 소식과 공지사항을 관리하세요.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2 whitespace-nowrap px-4 py-2.5 rounded-full"
          >
            <Plus className="h-5 w-5" />
            <span>새 공지 작성</span>
          </button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{notices.filter(n => n.status === 'published').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">게시중</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{notices.filter(n => n.status === 'draft').length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">임시저장</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{notices.filter(n => n.is_pinned).length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">고정됨</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {notices.reduce((sum, n) => sum + n.views, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">총 조회수</div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목, 내용으로 검색..."
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft' | 'archived')}
              className="w-full md:w-48 appearance-none border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">전체 상태</option>
              <option value="published">게시중</option>
              <option value="draft">임시저장</option>
              <option value="archived">보관됨</option>
            </select>
            <Filter className="h-4 w-4 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* 결과 카운트 */}
          <div className="flex items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-200 dark:border-gray-600 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              총 <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredNotices.length}</span>개 공지
            </span>
          </div>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">공지사항 목록</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">공지사항을 불러오는 중...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`border rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${notice.is_pinned
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.is_pinned && (
                          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md">
                            📌 고정
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-1 rounded-md border ${getPriorityColor(notice.priority)}`}>
                          {notice.priority === 'high' ? '긴급' :
                            notice.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(notice.status)}`}>
                          {notice.status === 'published' ? '게시중' :
                            notice.status === 'draft' ? '임시저장' : '보관됨'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {notice.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 break-words">
                        {notice.content}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1.5" />
                          {notice.created_by}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1.5" />
                          {formatDate(notice.created_at)}
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1.5" />
                          {notice.views.toLocaleString()}회 조회
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pt-2 lg:pt-0">
                      <button
                        onClick={() => setSelectedNotice(notice)}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                        title="보기"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNotice(notice);
                          setShowForm(true);
                        }}
                        className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                        title="수정"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('이 공지사항을 삭제하시겠습니까?')) {
                            setNotices(notices.filter(n => n.id !== notice.id));
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredNotices.length === 0 && (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <Megaphone className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">검색 결과가 없습니다.</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">다른 검색어나 필터를 시도해보세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 공지사항 상세보기 모달 */}
      {selectedNotice && !showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">공지사항 상세</h2>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* 헤더 정보 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {selectedNotice.is_pinned && (
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md">
                      📌 고정
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-md border ${getPriorityColor(selectedNotice.priority)}`}>
                    {selectedNotice.priority === 'high' ? '긴급' :
                      selectedNotice.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(selectedNotice.status)}`}>
                    {selectedNotice.status === 'published' ? '게시중' :
                      selectedNotice.status === 'draft' ? '임시저장' : '보관됨'}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {selectedNotice.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1.5" />
                    {selectedNotice.created_by}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {formatDate(selectedNotice.created_at)}
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1.5" />
                    {selectedNotice.views.toLocaleString()}회 조회
                  </div>
                </div>
              </div>

              {/* 본문 */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-base">
                  {selectedNotice.content}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    setShowForm(true);
                  }}
                  className="btn-primary px-5 py-2.5 rounded-full flex items-center"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  수정하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 작성/수정 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                {selectedNotice ? (
                  <>
                    <Pencil className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    공지사항 수정
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    새 공지 작성
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedNotice(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedNotice?.title}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    defaultValue={selectedNotice?.content}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 우선순위 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      우선순위 <span className="text-red-500">*</span>
                    </label>
                    <select
                      defaultValue={selectedNotice?.priority || 'medium'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all appearance-none"
                    >
                      <option value="high">긴급</option>
                      <option value="medium">보통</option>
                      <option value="low">낮음</option>
                    </select>
                  </div>

                  {/* 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      상태 <span className="text-red-500">*</span>
                    </label>
                    <select
                      defaultValue={selectedNotice?.status || 'draft'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all appearance-none"
                    >
                      <option value="published">게시중</option>
                      <option value="draft">임시저장</option>
                      <option value="archived">보관됨</option>
                    </select>
                  </div>
                </div>

                {/* 고정 여부 */}
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    defaultChecked={selectedNotice?.is_pinned}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white dark:bg-gray-600"
                  />
                  <label htmlFor="is_pinned" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    이 공지사항을 상단에 고정합니다
                  </label>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedNotice(null);
                    }}
                    className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('공지사항이 저장되었습니다!');
                      setShowForm(false);
                      setSelectedNotice(null);
                      loadNotices();
                    }}
                    className="btn-primary px-6 py-2.5 rounded-full font-medium shadow-lg shadow-blue-500/20"
                  >
                    {selectedNotice ? '수정 완료' : '작성 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default NoticeManagement;