import React, { useState, useCallback } from 'react';
import {
  PlusIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BSActivityJournal from './BSActivityJournal';
import type { BSActivity } from '../../types/bs-activities.types';
import { ACTIVITY_STATUS_LABELS, MOCK_BS_ACTIVITIES } from '../../types/bs-activities.types';

const StudentActivityJournal: React.FC = () => {
  // 현재 로그인된 교육생의 활동일지만 필터링 (실제로는 API에서 가져올 데이터)
  const [myActivities, setMyActivities] = useState<BSActivity[]>(
    MOCK_BS_ACTIVITIES.filter(activity => activity.trainee_id === 'trainee-001') // 현재 사용자 ID
  );
  const [selectedActivity, setSelectedActivity] = useState<BSActivity | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');

  // 새 활동 생성
  const handleCreateActivity = useCallback(async (activityData: Partial<BSActivity>) => {
    const newActivity: BSActivity = {
      id: `bs-activity-${Date.now()}`,
      trainee_id: 'trainee-001', // 현재 로그인된 교육생 ID
      trainee_name: '김영업', // 현재 로그인된 교육생 이름
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

    setMyActivities(prev => [newActivity, ...prev]);
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

    setMyActivities(prev => prev.map(a => a.id === selectedActivity.id ? updatedActivity : a));
    setSelectedActivity(updatedActivity);
    
    if (viewMode === 'edit') {
      setViewMode('view');
    }
    
    toast.success('활동 일지가 업데이트되었습니다.');
  }, [selectedActivity, viewMode]);

  // 활동 삭제 (작성 중인 것만 삭제 가능)
  const handleDeleteActivity = useCallback((activityId: string) => {
    const activity = myActivities.find(a => a.id === activityId);
    
    if (activity?.status !== 'draft') {
      toast.error('제출된 활동일지는 삭제할 수 없습니다.');
      return;
    }

    if (window.confirm('정말로 이 활동 일지를 삭제하시겠습니까?')) {
      setMyActivities(prev => prev.filter(a => a.id !== activityId));
      if (selectedActivity?.id === activityId) {
        setSelectedActivity(null);
        setViewMode('list');
      }
      toast.success('활동 일지가 삭제되었습니다.');
    }
  }, [myActivities, selectedActivity]);

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-foreground border-gray-200';
      case 'submitted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reviewed': return 'bg-yellow-100 text-orange-700 border-yellow-200';
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-foreground border-gray-200';
    }
  };

  // 목록 화면
  if (viewMode === 'list') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 md:p-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">내 활동 일지</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">치과 방문 활동 일지 작성 및 관리</p>
            </div>
            <button
              onClick={() => setViewMode('create')}
              className="flex items-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-lg"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              새 활동 일지 작성
            </button>
          </div>
        </div>

        {/* 통계 요약 - 모바일 가로 스크롤 */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-x-visible md:pb-0 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <DocumentTextIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 일지</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{myActivities.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <CheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">제출 완료</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {myActivities.filter(a => a.status === 'submitted' || a.status === 'reviewed' || a.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">작성 중</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {myActivities.filter(a => a.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                <PhotoIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">사진 수</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {myActivities.reduce((sum, a) => sum + a.photos.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 활동 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              나의 활동 일지 ({myActivities.length})
            </h2>
          </div>

          {myActivities.length > 0 ? (
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {myActivities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {activity.clinic_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getStatusColor(activity.status)}`}>
                            {ACTIVITY_STATUS_LABELS[activity.status]}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
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

                        <p className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">{activity.visit_purpose}</p>

                        {/* 활동 개수 */}
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg px-2 py-1 inline-block">
                          활동 {activity.activities.length}개 기록됨
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setViewMode('view');
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="보기"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {activity.status === 'draft' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedActivity(activity);
                                setViewMode('edit');
                              }}
                              className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                              title="편집"
                            >
                              <DocumentTextIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 강사 피드백 표시 */}
                    {activity.instructor_feedback && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">강사 피드백</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                className={`text-sm ${star <= activity.instructor_feedback!.overall_rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-blue-700 dark:text-blue-400">
                            ({activity.instructor_feedback.overall_rating}/5)
                          </span>
                        </div>
                        {activity.instructor_feedback.strengths.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">잘한 점:</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              {activity.instructor_feedback.strengths.slice(0, 2).join(', ')}
                              {activity.instructor_feedback.strengths.length > 2 && '...'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">아직 작성된 활동 일지가 없습니다</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">첫 번째 치과 방문 활동 일지를 작성해보세요.</p>
              <button
                onClick={() => setViewMode('create')}
                className="inline-flex items-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-lg"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                첫 번째 활동 일지 작성
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 일지 작성/편집/보기 화면
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedActivity(null);
          }}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </button>
      </div>

      <BSActivityJournal
        activity={selectedActivity || undefined}
        onSave={selectedActivity ? handleUpdateActivity : handleCreateActivity}
        onSubmit={selectedActivity ? handleUpdateActivity : handleCreateActivity}
        readonly={viewMode === 'view'}
      />
    </div>
  );
};

export default StudentActivityJournal;