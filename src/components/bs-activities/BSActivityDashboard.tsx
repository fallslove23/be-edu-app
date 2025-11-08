import React, { useState, useEffect } from 'react';
import { BSActivityService } from '../../services/bs-activity.service';
import type { BSActivityDashboard as DashboardData, BSActivity, ActivityCategory } from '../../types/bs-activity.types';
import { activityCategoryLabels, activityCategoryIcons } from '../../types/bs-activity.types';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrophyIcon,
  CalendarDaysIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface BSActivityDashboardProps {
  courseId: string;
}

const BSActivityDashboard: React.FC<BSActivityDashboardProps> = ({ courseId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<BSActivity | null>(null);
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'submitted'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({ comment: '', score: 5 });

  // 대시보드 데이터 로드
  useEffect(() => {
    loadDashboard();
  }, [courseId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await BSActivityService.getDashboard(courseId);
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 활동 목록 필터링
  const filteredActivities = dashboardData?.recent_activities.filter(activity => {
    const categoryMatch = filterCategory === 'all' || activity.category === filterCategory;
    const statusMatch = filterStatus === 'all' || activity.submission_status === filterStatus;
    const keywordMatch = !searchKeyword ||
      activity.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      activity.content.toLowerCase().includes(searchKeyword.toLowerCase());

    return categoryMatch && statusMatch && keywordMatch;
  }) || [];

  // 피드백 제출
  const handleSubmitFeedback = async () => {
    if (!selectedActivity) return;

    try {
      await BSActivityService.addFeedback(
        selectedActivity.id,
        feedbackForm.comment,
        feedbackForm.score,
        'current_user_id', // TODO: 실제 사용자 ID
        '강사명' // TODO: 실제 사용자 이름
      );

      await loadDashboard();
      setSelectedActivity(null);
      setFeedbackForm({ comment: '', score: 5 });
    } catch (error) {
      console.error('Feedback submit error:', error);
    }
  };

  // 우수 사례 마킹
  const handleToggleBestPractice = async (activityId: string, isBest: boolean) => {
    try {
      await BSActivityService.markAsBestPractice(activityId, isBest);
      await loadDashboard();
    } catch (error) {
      console.error('Best practice toggle error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { stats, upcoming_deadlines, best_practices } = dashboardData;

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 활동</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_activities}</p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">제출 완료</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.submitted_activities}</p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">평균 점수</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.average_score.toFixed(1)}</p>
            </div>
            <StarIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">우수 사례</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.best_practices_count}</p>
            </div>
            <TrophyIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* 카테고리별 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 활동</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.entries(stats.activities_by_category) as [ActivityCategory, number][]).map(([category, count]) => (
            <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-1">{activityCategoryIcons[category]}</div>
              <div className="text-sm text-gray-600">{activityCategoryLabels[category]}</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 다가오는 마감일 */}
      {upcoming_deadlines.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
            다가오는 제출 기한
          </h3>
          <div className="space-y-2">
            {upcoming_deadlines.map(deadline => (
              <div key={deadline.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{deadline.week_number}주차</p>
                  <p className="text-sm text-gray-600">필수 제출: {deadline.required_count}건</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-orange-600">{deadline.deadline_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all"
          />
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all">모든 카테고리</option>
            {(Object.entries(activityCategoryLabels) as [ActivityCategory, string][]).map(([cat, label]) => (
              <option key={cat} value={cat}>{label}</option>
            ))}
          </select>

          <select
            id="status-filter"
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
            <option value="all">모든 상태</option>
            <option value="submitted">제출 완료</option>
            <option value="draft">임시 저장</option>
          </select>
        </div>
      </div>

      {/* 활동 목록 컨테이너 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

        {/* 활동 목록 */}
        <div className="space-y-3">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{activityCategoryIcons[activity.category]}</span>
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    {activity.is_best_practice && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        ⭐ 우수사례
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      activity.submission_status === 'submitted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.submission_status === 'submitted' ? '제출완료' : '임시저장'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{activity.trainee_name} · {activity.activity_date}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{activity.content}</p>
                  {activity.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {activity.images.slice(0, 3).map((img, idx) => (
                        <img key={idx} src={img.url} alt="" className="w-16 h-16 object-cover rounded" />
                      ))}
                      {activity.images.length > 3 && (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm">
                          +{activity.images.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedActivity(activity)}
                    className="btn-primary"
                  >
                    <EyeIcon className="h-4 w-4 inline mr-1" />
                    상세
                  </button>
                  <button
                    onClick={() => handleToggleBestPractice(activity.id, !activity.is_best_practice)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      activity.is_best_practice
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⭐
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 활동 상세 모달 */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{selectedActivity.title}</h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">교육생:</span>
                    <span className="ml-2 font-medium">{selectedActivity.trainee_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">활동일:</span>
                    <span className="ml-2 font-medium">{selectedActivity.activity_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">카테고리:</span>
                    <span className="ml-2 font-medium">
                      {activityCategoryIcons[selectedActivity.category]} {activityCategoryLabels[selectedActivity.category]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">제출 상태:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      selectedActivity.submission_status === 'submitted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedActivity.submission_status === 'submitted' ? '제출완료' : '임시저장'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">활동 내용</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedActivity.content}</p>
                </div>

                {selectedActivity.images.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">활동 사진</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedActivity.images.map((img, idx) => (
                        <img key={idx} src={img.url} alt="" className="w-full h-48 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.location && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">위치 정보</h4>
                    <p className="text-gray-700">📍 {selectedActivity.location.address}</p>
                  </div>
                )}
              </div>

              {/* 피드백 섹션 */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
                  피드백
                </h4>

                {selectedActivity.feedback ? (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{selectedActivity.feedback.reviewer_name}</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarIcon
                            key={star}
                            className={`h-5 w-5 ${
                              star <= selectedActivity.feedback!.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{selectedActivity.feedback.comment}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">평가 점수</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={score}
                            onClick={() => setFeedbackForm({ ...feedbackForm, score })}
                            className="focus:outline-none"
                          >
                            <StarIcon
                              className={`h-8 w-8 ${
                                score <= feedbackForm.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">코멘트</label>
                      <textarea
                        value={feedbackForm.comment}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="피드백을 작성해주세요"
                      />
                    </div>
                    <button
                      onClick={handleSubmitFeedback}
                      className="btn-primary"
                    >
                      피드백 제출
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BSActivityDashboard;
