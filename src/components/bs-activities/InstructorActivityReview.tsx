import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import {
  BSActivity,
  ActivityCategory,
  SubmissionStatus,
  activityCategoryLabels,
  activityCategoryIcons,
  ActivityFeedback
} from '../../types/bs-activity.types';
import toast from 'react-hot-toast';

interface InstructorActivityReviewProps {
  courseId: string;
  onProvideFeedback?: (activityId: string, feedback: ActivityFeedback) => Promise<void>;
  onMarkAsBestPractice?: (activityId: string, isBestPractice: boolean) => Promise<void>;
}

const InstructorActivityReview: React.FC<InstructorActivityReviewProps> = ({
  courseId,
  onProvideFeedback,
  onMarkAsBestPractice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<BSActivity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  // Mock 데이터 - 실제로는 API에서 가져옴
  const mockActivities: BSActivity[] = [
    {
      id: '1',
      trainee_id: 'trainee1',
      trainee_name: '홍길동',
      trainee_email: 'hong@example.com',
      course_id: courseId,
      course_name: '영업 마스터 과정',
      activity_date: '2024-08-25',
      category: 'new_visit',
      title: '신규 잠재 고객사 방문',
      content: 'A사를 방문하여 제품 소개 및 니즈 파악을 진행했습니다. 담당자는 우리 제품에 높은 관심을 보였으며, 다음 주 재방문 약속을 잡았습니다.',
      images: [
        {
          url: 'https://via.placeholder.com/400x300',
          file_name: 'meeting1.jpg',
          file_size: 204800,
          uploaded_at: '2024-08-25T14:30:00Z'
        },
        {
          url: 'https://via.placeholder.com/400x300',
          file_name: 'meeting2.jpg',
          file_size: 184320,
          uploaded_at: '2024-08-25T14:35:00Z'
        }
      ],
      location: {
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울시 중구 을지로'
      },
      submission_status: 'submitted',
      submitted_at: '2024-08-25T15:00:00Z',
      feedback: {
        comment: '훌륭한 활동입니다. 고객의 니즈를 잘 파악했네요!',
        score: 5,
        reviewer_id: 'instructor1',
        reviewer_name: '김강사',
        reviewed_at: '2024-08-26T09:00:00Z'
      },
      is_best_practice: true,
      created_at: '2024-08-25T14:00:00Z',
      updated_at: '2024-08-26T09:00:00Z'
    },
    {
      id: '2',
      trainee_id: 'trainee2',
      trainee_name: '김영희',
      trainee_email: 'kim@example.com',
      course_id: courseId,
      course_name: '영업 마스터 과정',
      activity_date: '2024-08-24',
      category: 'follow_up',
      title: '기존 고객 재방문 및 추가 상담',
      content: 'B사 재방문하여 이전 미팅에서 논의된 사항에 대한 후속 조치를 진행했습니다.',
      images: [
        {
          url: 'https://via.placeholder.com/400x300',
          file_name: 'followup.jpg',
          file_size: 195840,
          uploaded_at: '2024-08-24T16:00:00Z'
        }
      ],
      submission_status: 'submitted',
      submitted_at: '2024-08-24T17:00:00Z',
      is_best_practice: false,
      created_at: '2024-08-24T15:30:00Z',
      updated_at: '2024-08-24T17:00:00Z'
    },
    {
      id: '3',
      trainee_id: 'trainee3',
      trainee_name: '이철수',
      trainee_email: 'lee@example.com',
      course_id: courseId,
      course_name: '영업 마스터 과정',
      activity_date: '2024-08-23',
      category: 'contract',
      title: '계약 체결 완료',
      content: 'C사와 최종 계약을 체결했습니다. 3개월간 협상 끝에 성공적으로 마무리되었습니다.',
      images: [
        {
          url: 'https://via.placeholder.com/400x300',
          file_name: 'contract.jpg',
          file_size: 215040,
          uploaded_at: '2024-08-23T11:00:00Z'
        }
      ],
      submission_status: 'submitted',
      submitted_at: '2024-08-23T12:00:00Z',
      feedback: {
        comment: '장기간의 노력 끝에 성과를 이루셨네요. 축하합니다!',
        score: 5,
        reviewer_id: 'instructor1',
        reviewer_name: '김강사',
        reviewed_at: '2024-08-23T14:00:00Z'
      },
      is_best_practice: true,
      created_at: '2024-08-23T10:30:00Z',
      updated_at: '2024-08-23T14:00:00Z'
    }
  ];

  const [activities] = useState<BSActivity[]>(mockActivities);

  // 필터링된 활동 목록
  const filteredActivities = activities.filter(activity => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.trainee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || activity.submission_status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 피드백 제출
  const handleSubmitFeedback = async () => {
    if (!selectedActivity) return;

    if (!feedbackComment.trim()) {
      toast.error('피드백 내용을 입력해주세요.');
      return;
    }

    const feedback: ActivityFeedback = {
      comment: feedbackComment.trim(),
      score: feedbackScore,
      reviewer_id: 'current_user_id', // 실제로는 로그인한 사용자 ID
      reviewer_name: '김강사', // 실제로는 로그인한 사용자 이름
      reviewed_at: new Date().toISOString()
    };

    try {
      if (onProvideFeedback) {
        await onProvideFeedback(selectedActivity.id, feedback);
      }
      toast.success('피드백이 제출되었습니다.');
      setIsFeedbackModalOpen(false);
      setFeedbackComment('');
      setFeedbackScore(5);
    } catch (error) {
      toast.error('피드백 제출에 실패했습니다.');
      console.error('Feedback error:', error);
    }
  };

  // 우수 사례 토글
  const handleToggleBestPractice = async (activity: BSActivity) => {
    try {
      if (onMarkAsBestPractice) {
        await onMarkAsBestPractice(activity.id, !activity.is_best_practice);
      }
      toast.success(
        activity.is_best_practice
          ? '우수 사례에서 제거되었습니다.'
          : '우수 사례로 등록되었습니다.'
      );
    } catch (error) {
      toast.error('우수 사례 설정에 실패했습니다.');
      console.error('Best practice error:', error);
    }
  };

  // 활동 상세 카드 렌더링
  const renderActivityCard = (activity: BSActivity) => {
    const isExpanded = expandedActivityId === activity.id;

    return (
      <div key={activity.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* 카드 헤더 */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-blue-600">
                  {activity.trainee_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-semibold text-gray-900">{activity.trainee_name}</h3>
                  {activity.is_best_practice && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center">
                      <StarIconSolid className="w-3 h-3 mr-1" />
                      우수사례
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{activity.activity_date}</p>
              </div>
            </div>
            <span className="text-2xl">{activityCategoryIcons[activity.category]}</span>
          </div>

          {/* 활동 제목 */}
          <h4 className="font-medium text-gray-900 mb-2">{activity.title}</h4>

          {/* 카테고리 배지 */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              {activityCategoryLabels[activity.category]}
            </span>
            {activity.submission_status === 'submitted' && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                제출완료
              </span>
            )}
            {activity.feedback && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center">
                <StarIconSolid className="w-3 h-3 mr-1" />
                {activity.feedback.score}점
              </span>
            )}
          </div>

          {/* 활동 내용 미리보기 */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {activity.content}
          </p>

          {/* 이미지 미리보기 */}
          {activity.images.length > 0 && (
            <div className="flex space-x-2 mb-3">
              {activity.images.slice(0, 3).map((image, idx) => (
                <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={`활동 사진 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {activity.images.length > 3 && (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-500">
                    +{activity.images.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 확장/축소 버튼 */}
          <button
            onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="w-4 h-4 mr-1" />
                간단히 보기
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4 mr-1" />
                자세히 보기
              </>
            )}
          </button>
        </div>

        {/* 확장된 내용 */}
        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
            {/* 전체 내용 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">활동 상세 내용</h5>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{activity.content}</p>
            </div>

            {/* 위치 정보 */}
            {activity.location && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  활동 위치
                </h5>
                <p className="text-sm text-gray-600">{activity.location.address}</p>
              </div>
            )}

            {/* 모든 이미지 */}
            {activity.images.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <PhotoIcon className="w-4 h-4 mr-1" />
                  활동 사진 ({activity.images.length}장)
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {activity.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={image.url}
                      alt={`활동 사진 ${idx + 1}`}
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 피드백 표시 */}
            {activity.feedback && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                  강사 피드백
                </h5>
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIconSolid
                      key={star}
                      className={`w-4 h-4 ${
                        star <= activity.feedback!.score
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {activity.feedback.score}점
                  </span>
                </div>
                <p className="text-sm text-gray-700">{activity.feedback.comment}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {activity.feedback.reviewer_name} | {new Date(activity.feedback.reviewed_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex space-x-2">
              {!activity.feedback && (
                <button
                  onClick={() => {
                    setSelectedActivity(activity);
                    setIsFeedbackModalOpen(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                  피드백 작성
                </button>
              )}
              <button
                onClick={() => handleToggleBestPractice(activity)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  activity.is_best_practice
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <StarIcon className="w-4 h-4 mr-2" />
                {activity.is_best_practice ? '우수사례 해제' : '우수사례 등록'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900">BS 활동 검토</h1>
          <p className="text-sm text-gray-500 mt-1">교육생 활동을 확인하고 피드백을 제공하세요</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">전체 활동</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{activities.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">피드백 대기</div>
          <div className="text-xl font-bold text-orange-600 mt-1">
            {activities.filter(a => !a.feedback).length}
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-500">우수 사례</div>
          <div className="text-xl font-bold text-yellow-600 mt-1">
            {activities.filter(a => a.is_best_practice).length}
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="p-4 space-y-2">
        {/* 검색 */}
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="교육생 이름, 활동 제목 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* 필터 */}
        <div className="flex space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ActivityCategory | 'all')}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 유형</option>
            {(Object.keys(activityCategoryLabels) as ActivityCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {activityCategoryIcons[cat]} {activityCategoryLabels[cat]}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'all')}
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">모든 상태</option>
            <option value="submitted">제출완료</option>
            <option value="draft">임시저장</option>
          </select>
        </div>
      </div>

      {/* 활동 목록 */}
      <div className="p-4 space-y-3 pb-20">
        {filteredActivities.length > 0 ? (
          filteredActivities.map(renderActivityCard)
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">활동이 없습니다</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? '검색 조건에 맞는 활동이 없습니다.'
                : '아직 제출된 활동이 없습니다.'}
            </p>
          </div>
        )}
      </div>

      {/* 피드백 모달 */}
      {isFeedbackModalOpen && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">피드백 작성</h3>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 활동 정보 */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700">
                  {selectedActivity.trainee_name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedActivity.title}
                </div>
              </div>

              {/* 점수 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  점수 *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setFeedbackScore(score)}
                      className="flex-1"
                    >
                      <StarIconSolid
                        className={`w-10 h-10 mx-auto ${
                          score <= feedbackScore
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                  {feedbackScore}점
                </div>
              </div>

              {/* 피드백 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  피드백 내용 *
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="교육생에게 전달할 피드백을 작성해주세요"
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {feedbackComment.length}/500
                </div>
              </div>

              {/* 제출 버튼 */}
              <button
                onClick={handleSubmitFeedback}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                피드백 제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorActivityReview;
