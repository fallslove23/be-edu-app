'use client';

import React, { useState, useCallback } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhotoIcon,
  EyeIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  PresentationChartLineIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import toast from 'react-hot-toast';
import modal from '@/lib/modal';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';
import BSActivityJournal from './BSActivityJournal';
import InstructorFeedback from './InstructorFeedback';
import StudentActivityInput from './StudentActivityInput';
import InstructorActivityReview from './InstructorActivityReview';
import BSPresentationMode from './BSPresentationMode';
import BSActivityForm from './BSActivityForm';
import { BSActivityService } from '../../services/bs-activity.service';
import type { BSActivity, BSActivityFilter, ActivityType, InstructorFeedback as InstructorFeedbackType } from '../../types/bs-activities.types';
import type { CreateBSActivityData, ActivityFeedback } from '../../types/bs-activity.types';
import { ACTIVITY_TYPE_CONFIG, ACTIVITY_STATUS_LABELS, MOCK_BS_ACTIVITIES } from '../../types/bs-activities.types';

const BSActivityManagement: React.FC = () => {
  const { user } = useAuth();

  // 사용자 역할 확인
  const isStudent = user?.role === 'trainee';
  const isInstructor = user?.role === 'instructor';
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  // 교육생용 화면 - StudentActivityInput 사용
  if (isStudent) {
    return (
      <StudentActivityInput
        traineeId={user?.id || 'current-user'}
        courseId="current-course-id"
        skipList={true}
        onSubmit={async (data) => {
          console.log('Activity submitted:', data);
          toast.success('활동이 성공적으로 생성되었습니다.');
        }}
      />
    );
  }

  // 강사용 모바일 최적화 검토 화면
  if (isInstructor && !isAdmin) {
    const handleProvideFeedback = async (activityId: string, feedback: ActivityFeedback) => {
      try {
        await BSActivityService.addFeedback(
          activityId,
          feedback.comment,
          feedback.score,
          feedback.reviewer_id,
          feedback.reviewer_name
        );
        toast.success('피드백이 성공적으로 제출되었습니다.');
      } catch (error) {
        console.error('Feedback submission error:', error);
        throw error;
      }
    };

    const handleMarkAsBestPractice = async (activityId: string, isBestPractice: boolean) => {
      try {
        await BSActivityService.markAsBestPractice(activityId, isBestPractice);
        toast.success(
          isBestPractice
            ? '우수 사례로 등록되었습니다.'
            : '우수 사례에서 제거되었습니다.'
        );
      } catch (error) {
        console.error('Best practice marking error:', error);
        throw error;
      }
    };

    return (
      <InstructorActivityReview
        courseId="current-course-id"
        onProvideFeedback={handleProvideFeedback}
        onMarkAsBestPractice={handleMarkAsBestPractice}
      />
    );
  }

  // 관리자용 데스크톱 화면 (기존 UI 유지)
  return <BSActivityManagementDesktop />;
};

// 기존 관리자용 컴포넌트를 별도 함수로 분리
const BSActivityManagementDesktop: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<BSActivity[]>(MOCK_BS_ACTIVITIES);
  const [filteredActivities, setFilteredActivities] = useState<BSActivity[]>(MOCK_BS_ACTIVITIES);
  const [selectedActivity, setSelectedActivity] = useState<BSActivity | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view' | 'feedback' | 'presentation'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPresentationMode, setShowPresentationMode] = useState(false);

  const [filters, setFilters] = useState<BSActivityFilter>({
    status: [],
    activity_types: [],
    date_from: '',
    date_to: '',
    clinic_name: '',
    has_photos: undefined,
    has_feedback: undefined
  });

  // 필터링 및 검색
  const applyFilters = useCallback(() => {
    let filtered = [...activities];

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.clinic_name.toLowerCase().includes(query) ||
        activity.visit_purpose.toLowerCase().includes(query) ||
        activity.activities.some(a =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
        )
      );
    }

    // 상태 필터링
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(activity => filters.status!.includes(activity.status));
    }

    // 활동 유형 필터링
    if (filters.activity_types && filters.activity_types.length > 0) {
      filtered = filtered.filter(activity =>
        activity.activities.some(a => filters.activity_types!.includes(a.type))
      );
    }

    // 날짜 필터링
    if (filters.date_from) {
      filtered = filtered.filter(activity => activity.visit_date >= filters.date_from!);
    }
    if (filters.date_to) {
      filtered = filtered.filter(activity => activity.visit_date <= filters.date_to!);
    }

    // 병원명 필터링
    if (filters.clinic_name) {
      const clinicQuery = filters.clinic_name.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.clinic_name.toLowerCase().includes(clinicQuery)
      );
    }

    // 사진 여부 필터링
    if (filters.has_photos !== undefined) {
      filtered = filtered.filter(activity =>
        filters.has_photos ? activity.photos.length > 0 : activity.photos.length === 0
      );
    }

    // 피드백 여부 필터링
    if (filters.has_feedback !== undefined) {
      filtered = filtered.filter(activity =>
        filters.has_feedback ? !!activity.instructor_feedback : !activity.instructor_feedback
      );
    }

    setFilteredActivities(filtered);
  }, [activities, searchQuery, filters]);

  // 필터 변경 시 적용
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // 새 활동 생성
  const handleCreateActivity = useCallback(async (activityData: Partial<BSActivity>) => {
    const newActivity: BSActivity = {
      id: `bs-activity-${Date.now()}`,
      trainee_id: 'current-user', // 실제로는 로그인된 사용자 ID
      trainee_name: '현재 사용자', // 실제로는 로그인된 사용자 이름
      visit_date: activityData.visit_date || new Date().toISOString().split('T')[0],
      clinic_name: activityData.clinic_name || '',
      clinic_address: activityData.clinic_address || '',
      clinic_phone: activityData.clinic_phone || '',
      visit_purpose: activityData.visit_purpose || '',
      activities: activityData.activities || [],
      photos: activityData.photos || [],
      status: activityData.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: activityData.status === 'submitted' ? new Date().toISOString() : undefined
    };

    setActivities(prev => [newActivity, ...prev]);
    setViewMode('list');
    toast.success('활동 일지가 저장되었습니다.');
  }, []);

  // 활동 수정
  const handleUpdateActivity = useCallback(async (activityData: Partial<BSActivity>) => {
    if (!selectedActivity) return;

    const updatedActivity: BSActivity = {
      ...selectedActivity,
      ...activityData,
      updated_at: new Date().toISOString(),
      submitted_at: activityData.status === 'submitted' && selectedActivity.status !== 'submitted'
        ? new Date().toISOString()
        : selectedActivity.submitted_at
    };

    setActivities(prev => prev.map(a => a.id === selectedActivity.id ? updatedActivity : a));
    setSelectedActivity(updatedActivity);

    if (viewMode === 'edit') {
      setViewMode('view');
    }

    toast.success('활동 일지가 업데이트되었습니다.');
  }, [selectedActivity, viewMode]);

  // 활동 삭제
  const handleDeleteActivity = useCallback(async (activityId: string) => {
    if (await modal.confirmDelete('활동 일지')) {
      setActivities(prev => prev.filter(a => a.id !== activityId));
      if (selectedActivity?.id === activityId) {
        setSelectedActivity(null);
        setViewMode('list');
      }
      toast.success('활동 일지가 삭제되었습니다.');
    }
  }, [selectedActivity]);

  // 강사 피드백 저장
  const handleSaveFeedback = useCallback((feedback: InstructorFeedbackType) => {
    if (!selectedActivity) return;

    const updatedActivity: BSActivity = {
      ...selectedActivity,
      instructor_feedback: feedback,
      status: 'reviewed',
      updated_at: new Date().toISOString()
    };

    setActivities(prev => prev.map(a => a.id === selectedActivity.id ? updatedActivity : a));
    setSelectedActivity(updatedActivity);
    setShowFeedbackModal(false);

    toast.success('피드백이 저장되었습니다.');
  }, [selectedActivity]);

  // Status mapping for Badge component
  const getStatusVariant = (status: string): 'inactive' | 'info' | 'warning' | 'success' => {
    switch (status) {
      case 'draft': return 'inactive';
      case 'submitted': return 'info';
      case 'reviewed': return 'warning';
      case 'approved': return 'success';
      default: return 'inactive';
    }
  };

  // Activity type mapping for Badge component
  const getActivityTypeVariant = (type: ActivityType): 'info' | 'success' | 'inactive' | 'warning' => {
    const config = ACTIVITY_TYPE_CONFIG[type];
    switch (config.color) {
      case 'blue': return 'info';
      case 'green': return 'success';
      case 'purple': return 'inactive';
      case 'indigo': return 'info';
      case 'cyan': return 'info';
      case 'orange': return 'warning';
      case 'pink': return 'inactive';
      case 'yellow': return 'warning';
      default: return 'inactive';
    }
  };

  // 프레젠테이션 모드
  if (showPresentationMode) {
    return (
      <BSPresentationMode
        courseId="current-course-id"
        presentationDate={new Date().toISOString().split('T')[0]}
        onClose={() => setShowPresentationMode(false)}
      />
    );
  }

  // 목록 화면
  if (viewMode === 'list') {
    return (
      <PageContainer>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
            <PageHeader
              title="BS 활동 관리"
              description="전체 교육생의 활동 일지 관리, 피드백 및 발표"
              badge="Activity Management"
            />
            <div className="flex gap-3 w-full lg:w-auto">
              <button
                onClick={() => setViewMode('create')}
                className="btn-primary flex-1 lg:flex-none flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                새 활동 작성
              </button>
              <button
                onClick={() => setShowPresentationMode(true)}
                className="btn-secondary flex-1 lg:flex-none flex items-center justify-center gap-2"
              >
                <PresentationChartLineIcon className="w-5 h-5" />
                프레젠테이션 모드
              </button>
            </div>
          </div>

          {/* Rest of the content will be added here */}
          {/* 통계 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">전체 일지</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-orange-600 dark:text-orange-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">피드백 대기</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activities.filter(a => a.status === 'submitted').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <StarIcon className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">피드백 완료</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activities.filter(a => a.instructor_feedback).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <PhotoIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 사진</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activities.reduce((sum, a) => sum + a.photos.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* 검색바 */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="병원명, 방문목적, 활동 내용으로 검색..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
                  showFilters || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v)
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                필터
                {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v) && (
                  <Badge variant="info" size="sm">
                    {(filters.status?.length || 0) +
                     (filters.activity_types?.length || 0) +
                     (filters.date_from ? 1 : 0) +
                     (filters.date_to ? 1 : 0) +
                     (filters.clinic_name ? 1 : 0) +
                     (filters.has_photos !== undefined ? 1 : 0) +
                     (filters.has_feedback !== undefined ? 1 : 0)}
                  </Badge>
                )}
              </button>
            </div>

            {/* 빠른 필터 칩 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: prev.status?.includes('submitted') ? [] : ['submitted'] }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.status?.includes('submitted')
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 dark:border-orange-600 text-orange-700 dark:text-orange-400 border'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🔔 피드백 대기
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, has_feedback: prev.has_feedback === true ? undefined : true }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.has_feedback === true
                    ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 dark:border-purple-600 text-purple-700 dark:text-purple-400 border'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                💬 피드백 있음
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, has_photos: prev.has_photos === true ? undefined : true }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.has_photos === true
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400 border'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📷 사진 있음
              </button>
              {(searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v)) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      status: [],
                      activity_types: [],
                      date_from: '',
                      date_to: '',
                      clinic_name: '',
                      has_photos: undefined,
                      has_feedback: undefined
                    });
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  ✕ 초기화
                </button>
              )}
            </div>

            {/* 고급 필터 패널 */}
            {showFilters && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 상태 필터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      상태
                    </label>
                    <div className="space-y-2">
                      {(['draft', 'submitted', 'reviewed', 'approved'] as const).map(status => (
                        <label key={status} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.status?.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({ ...prev, status: [...(prev.status || []), status] }));
                              } else {
                                setFilters(prev => ({ ...prev, status: prev.status?.filter(s => s !== status) || [] }));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {ACTIVITY_STATUS_LABELS[status]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 날짜 범위 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      기간
                    </label>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={filters.date_from || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="시작일"
                      />
                      <input
                        type="date"
                        value={filters.date_to || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="종료일"
                      />
                    </div>
                  </div>

                  {/* 병원명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      병원명
                    </label>
                    <input
                      type="text"
                      value={filters.clinic_name || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, clinic_name: e.target.value }))}
                      placeholder="병원명 입력"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 활동 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                활동 일지 목록
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({filteredActivities.length}/{activities.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onChange={(e) => {
                    const sortedActivities = [...filteredActivities];
                    if (e.target.value === 'date-desc') {
                      sortedActivities.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
                    } else if (e.target.value === 'date-asc') {
                      sortedActivities.sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
                    } else if (e.target.value === 'status') {
                      const statusOrder = { 'submitted': 0, 'reviewed': 1, 'approved': 2, 'draft': 3 };
                      sortedActivities.sort((a, b) => (statusOrder[a.status as keyof typeof statusOrder] || 999) - (statusOrder[b.status as keyof typeof statusOrder] || 999));
                    }
                    setFilteredActivities(sortedActivities);
                  }}
                >
                  <option value="date-desc">최신순</option>
                  <option value="date-asc">오래된순</option>
                  <option value="status">상태별</option>
                </select>
              </div>
            </div>

            {filteredActivities.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <CalendarDaysIcon className="w-5 h-5 text-gray-400 mt-1" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {activity.clinic_name}
                            </h3>
                            <Badge variant={getStatusVariant(activity.status)} size="sm">
                              {ACTIVITY_STATUS_LABELS[activity.status]}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="flex items-center">
                              <CalendarDaysIcon className="w-4 h-4 mr-1" />
                              {new Date(activity.visit_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {activity.clinic_address}
                            </span>
                            <span className="flex items-center">
                              <PhotoIcon className="w-4 h-4 mr-1" />
                              {activity.photos.length}장
                            </span>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{activity.visit_purpose}</p>

                          {/* 활동 유형 태그 */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {Array.from(new Set(activity.activities.map(a => a.type))).slice(0, 3).map(type => (
                              <Badge
                                key={type}
                                variant={getActivityTypeVariant(type)}
                                size="sm"
                              >
                                {ACTIVITY_TYPE_CONFIG[type].icon} {ACTIVITY_TYPE_CONFIG[type].label}
                              </Badge>
                            ))}
                            {Array.from(new Set(activity.activities.map(a => a.type))).length > 3 && (
                              <Badge variant="inactive" size="sm">
                                +{Array.from(new Set(activity.activities.map(a => a.type))).length - 3}개 더
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setViewMode('view');
                          }}
                          className="btn-ghost p-2"
                          title="상세보기"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {activity.status === 'submitted' && (
                          <button
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowFeedbackModal(true);
                            }}
                            className="btn-ghost p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="피드백 작성"
                          >
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                          </button>
                        )}
                        {activity.instructor_feedback && (
                          <button
                            onClick={() => {
                              setSelectedActivity(activity);
                              setShowFeedbackModal(true);
                            }}
                            className="btn-ghost p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="피드백 수정"
                          >
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 피드백 표시 */}
                    {activity.instructor_feedback && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2">
                          <StarIcon className="w-4 h-4 text-foreground" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">강사 피드백</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                className={`text-sm ${star <= activity.instructor_feedback!.overall_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-blue-700 dark:text-blue-400">
                            ({activity.instructor_feedback.overall_rating}/5)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">제출된 활동 일지가 없습니다</h3>
                <p className="text-gray-600 dark:text-gray-400">교육생들이 활동 일지를 제출하면 여기에서 확인하고 피드백을 제공할 수 있습니다.</p>
              </div>
            )}
          </div>

          {/* 강사 피드백 모달 */}
          {showFeedbackModal && selectedActivity && (
            <InstructorFeedback
              activity={selectedActivity}
              onSaveFeedback={handleSaveFeedback}
              onClose={() => setShowFeedbackModal(false)}
              readonly={!!selectedActivity.instructor_feedback}
            />
          )}

        </div>
      </PageContainer>
    );
  }

  // 활동 작성 화면 - StudentActivityInput 사용
  if (viewMode === 'create') {
    return (
      <StudentActivityInput
        traineeId={user?.id || 'current-user'}
        courseId="current-course-id"
        skipList={true}
        onSubmit={async (data) => {
          console.log('Activity submitted:', data);
          setViewMode('list');
          toast.success('활동이 성공적으로 생성되었습니다.');
        }}
      />
    );
  }

  // 일지 보기 화면 (운영자용 - 읽기 전용)
  return (
    <PageContainer>
      <div className="mb-6">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedActivity(null);
          }}
          className="btn-ghost"
        >
          ← 목록으로 돌아가기
        </button>
      </div>

      {/* 운영자는 항상 읽기 전용으로 보기 */}
      <BSActivityJournal
        activity={selectedActivity || undefined}
        onSave={async () => { }} // 운영자는 저장 불가
        onSubmit={async () => { }} // 운영자는 제출 불가
        readonly={true} // 항상 읽기 전용
      />

      {/* 강사 피드백 모달 */}
      {showFeedbackModal && selectedActivity && (
        <InstructorFeedback
          activity={selectedActivity}
          onSaveFeedback={handleSaveFeedback}
          onClose={() => setShowFeedbackModal(false)}
          readonly={false} // 피드백은 수정 가능
        />
      )}
    </PageContainer>
  );
};

export default BSActivityManagement;