import React, { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

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
      case 'high': return 'bg-destructive text-destructive-foreground border-border';
      case 'medium': return 'bg-accent text-accent-foreground border-border';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-primary text-primary-foreground';
      case 'draft': return 'bg-secondary text-secondary-foreground';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MegaphoneIcon className="h-8 w-8 mr-3 text-blue-600" />
              공지사항 관리
            </h1>
            <p className="mt-2 text-gray-600">
              중요한 소식과 공지사항을 관리하세요.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2 whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            <span>새 공지 작성</span>
          </button>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">{notices.filter(n => n.status === 'published').length}</div>
            <div className="text-sm text-muted-foreground">게시중</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">{notices.filter(n => n.status === 'draft').length}</div>
            <div className="text-sm text-muted-foreground">임시저장</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">{notices.filter(n => n.is_pinned).length}</div>
            <div className="text-sm text-muted-foreground">고정됨</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">
              {notices.reduce((sum, n) => sum + n.views, 0)}
            </div>
            <div className="text-sm text-muted-foreground">총 조회수</div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목, 내용으로 검색..."
              className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all">전체</option>
            <option value="published">게시중</option>
            <option value="draft">임시저장</option>
            <option value="archived">보관됨</option>
          </select>

          {/* 결과 카운트 */}
          <div className="flex items-center px-4 py-2.5 bg-secondary/30 rounded-lg border border-border">
            <FunnelIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              총 <span className="text-primary font-semibold">{filteredNotices.length}</span>개 공지
            </span>
          </div>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">공지사항 목록</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">공지사항을 불러오는 중...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    notice.is_pinned ? 'border-primary bg-accent/10' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.is_pinned && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            📌 고정
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notice.priority)}`}>
                          {notice.priority === 'high' ? '긴급' :
                           notice.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(notice.status)}`}>
                          {notice.status === 'published' ? '게시중' :
                           notice.status === 'draft' ? '임시저장' : '보관됨'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2 break-words">
                        {notice.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2 break-words">
                        {notice.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {notice.created_by}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDate(notice.created_at)}
                        </div>
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          {notice.views.toLocaleString()}회 조회
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="btn-ghost p-2">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="btn-ghost p-2">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="btn-ghost p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredNotices.length === 0 && (
                <div className="text-center py-12">
                  <MegaphoneIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeManagement;