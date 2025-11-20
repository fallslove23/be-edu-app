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
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
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
  const isStudent = user?.role === 'trainee' || user?.role === 'student';
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
  const handleDeleteActivity = useCallback((activityId: string) => {
    if (window.confirm('정말로 이 활동 일지를 삭제하시겠습니까?')) {
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

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reviewed': return 'bg-yellow-100 text-orange-700 border-yellow-200';
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // 활동 유형별 아이콘 색상
  const getActivityTypeColor = (type: ActivityType) => {
    const config = ACTIVITY_TYPE_CONFIG[type];
    switch (config.color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-green-500/10 text-green-700';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'indigo': return 'bg-indigo-100 text-indigo-600';
      case 'cyan': return 'bg-cyan-100 text-cyan-600';
      case 'orange': return 'bg-orange-500/10 text-orange-700';
      case 'pink': return 'bg-destructive/10 text-destructive';
      case 'yellow': return 'bg-yellow-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BS 활동 관리</h1>
              <p className="text-gray-600">전체 교육생의 활동 일지 관리, 피드백 및 발표</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode('create')}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors font-medium shadow-sm"
              >
                <PlusIcon className="w-5 h-5" />
                새 활동 작성
              </button>
              <button
                onClick={() => setShowPresentationMode(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors font-medium shadow-sm"
              >
                <PresentationChartLineIcon className="w-5 h-5" />
                프레젠테이션 모드
              </button>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="병원명, 활동 내용으로 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <FunnelIcon className="w-5 h-5" />
                필터
              </button>
            </div>

            {/* 필터 패널 */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                    <select
                      multiple
                      value={filters.status || []}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFilters(prev => ({ ...prev, status: values }));
                      }}
                      className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">작성 중</option>
                      <option value="submitted">제출 완료</option>
                      <option value="reviewed">검토 완료</option>
                      <option value="approved">승인 완료</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filters.date_from || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={filters.date_to || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                        className="flex-1 border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">병원명</label>
                    <input
                      type="text"
                      value={filters.clinic_name || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, clinic_name: e.target.value }))}
                      placeholder="병원명 검색"
                      className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
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
                    className="btn-ghost"
                  >
                    초기화
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">전체 일지</p>
                <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">피드백 대기</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.filter(a => a.status === 'submitted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <StarIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">피드백 완료</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.filter(a => a.instructor_feedback).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <PhotoIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">총 사진</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.reduce((sum, a) => sum + a.photos.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 활동 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              활동 일지 목록 ({filteredActivities.length})
            </h2>
          </div>

          {filteredActivities.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <CalendarDaysIcon className="w-5 h-5 text-gray-400 mt-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {activity.clinic_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(activity.status)}`}>
                            {ACTIVITY_STATUS_LABELS[activity.status]}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
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
                        
                        <p className="text-gray-700 line-clamp-2">{activity.visit_purpose}</p>
                        
                        {/* 활동 유형 태그 */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Array.from(new Set(activity.activities.map(a => a.type))).slice(0, 3).map(type => (
                            <span
                              key={type}
                              className={`px-2 py-1 text-xs rounded-full ${getActivityTypeColor(type)}`}
                            >
                              {ACTIVITY_TYPE_CONFIG[type].icon} {ACTIVITY_TYPE_CONFIG[type].label}
                            </span>
                          ))}
                          {Array.from(new Set(activity.activities.map(a => a.type))).length > 3 && (
                            <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                              +{Array.from(new Set(activity.activities.map(a => a.type))).length - 3}개 더
                            </span>
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
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="피드백 수정"
                        >
                          <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 피드백 표시 */}
                  {activity.instructor_feedback && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <StarIcon className="w-4 h-4 text-foreground" />
                        <span className="text-sm font-medium text-blue-900">강사 피드백</span>
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
                        <span className="text-xs text-blue-700">
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
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">제출된 활동 일지가 없습니다</h3>
              <p className="text-gray-600">교육생들이 활동 일지를 제출하면 여기에서 확인하고 피드백을 제공할 수 있습니다.</p>
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
    <div className="max-w-4xl mx-auto">
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
        onSave={async () => {}} // 운영자는 저장 불가
        onSubmit={async () => {}} // 운영자는 제출 불가
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
    </div>
  );
};

export default BSActivityManagement;