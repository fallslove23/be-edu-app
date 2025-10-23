import React, { useState } from 'react';
import {
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { 
  BSActivity, 
  InstructorFeedback, 
  ActivityFeedback,
  ActivityDetail 
} from '../../types/bs-activities.types';
import toast from 'react-hot-toast';

interface InstructorFeedbackProps {
  activity: BSActivity;
  onSaveFeedback: (feedback: InstructorFeedback) => void;
  onClose: () => void;
  readonly?: boolean;
}

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          {star <= rating ? (
            <StarSolidIcon className={`${sizeClasses[size]} text-yellow-400`} />
          ) : (
            <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
          )}
        </button>
      ))}
    </div>
  );
};

const InstructorFeedback: React.FC<InstructorFeedbackProps> = ({
  activity,
  onSaveFeedback,
  onClose,
  readonly = false
}) => {
  const [overallRating, setOverallRating] = useState(
    activity.instructor_feedback?.overall_rating || 0
  );
  
  const [activityFeedbacks, setActivityFeedbacks] = useState<ActivityFeedback[]>(
    activity.instructor_feedback?.detailed_feedback || 
    activity.activities.map(act => ({
      activity_detail_id: act.id,
      rating: 0,
      comment: '',
      specific_suggestions: []
    }))
  );

  const [strengths, setStrengths] = useState<string[]>(
    activity.instructor_feedback?.strengths || []
  );
  
  const [improvements, setImprovements] = useState<string[]>(
    activity.instructor_feedback?.areas_for_improvement || []
  );
  
  const [suggestions, setSuggestions] = useState<string[]>(
    activity.instructor_feedback?.suggestions || []
  );
  
  const [nextGoals, setNextGoals] = useState<string[]>(
    activity.instructor_feedback?.next_goals || []
  );

  const [newStrength, setNewStrength] = useState('');
  const [newImprovement, setNewImprovement] = useState('');
  const [newSuggestion, setNewSuggestion] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const updateActivityFeedback = (activityId: string, field: keyof ActivityFeedback, value: any) => {
    setActivityFeedbacks(prev => prev.map(feedback => 
      feedback.activity_detail_id === activityId 
        ? { ...feedback, [field]: value }
        : feedback
    ));
  };

  const addToList = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string, setValue: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setList(prev => [...prev, value.trim()]);
      setValue('');
    }
  };

  const removeFromList = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setList(prev => prev.filter((_, i) => i !== index));
  };

  const addSuggestionToActivity = (activityId: string, suggestion: string) => {
    if (suggestion.trim()) {
      updateActivityFeedback(activityId, 'specific_suggestions', 
        activityFeedbacks.find(f => f.activity_detail_id === activityId)?.specific_suggestions.concat(suggestion.trim()) || [suggestion.trim()]
      );
    }
  };

  const removeSuggestionFromActivity = (activityId: string, index: number) => {
    const feedback = activityFeedbacks.find(f => f.activity_detail_id === activityId);
    if (feedback) {
      updateActivityFeedback(activityId, 'specific_suggestions', 
        feedback.specific_suggestions.filter((_, i) => i !== index)
      );
    }
  };

  const handleSave = () => {
    if (overallRating === 0) {
      toast.error('전체 평가를 선택해주세요.');
      return;
    }

    const incompleteFeedback = activityFeedbacks.find(f => f.rating === 0);
    if (incompleteFeedback) {
      toast.error('모든 활동에 대한 평가를 완료해주세요.');
      return;
    }

    const feedback: InstructorFeedback = {
      id: activity.instructor_feedback?.id || `feedback-${Date.now()}`,
      activity_id: activity.id,
      instructor_id: 'current-instructor', // 실제로는 로그인된 강사 ID
      instructor_name: '김강사', // 실제로는 로그인된 강사 이름
      overall_rating: overallRating,
      detailed_feedback: activityFeedbacks,
      strengths,
      areas_for_improvement: improvements,
      suggestions,
      next_goals: nextGoals,
      reviewed_at: new Date().toISOString()
    };

    onSaveFeedback(feedback);
    toast.success('피드백이 저장되었습니다.');
  };

  const getActivityById = (id: string): ActivityDetail | undefined => {
    return activity.activities.find(act => act.id === id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">강사 피드백</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activity.trainee_name} | {activity.clinic_name} | {activity.visit_date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 전체 평가 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">전체 평가</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">평점:</span>
              <RatingStars
                rating={overallRating}
                onRatingChange={setOverallRating}
                readonly={readonly}
                size="lg"
              />
              <span className="text-sm text-gray-600">({overallRating}/5)</span>
            </div>
          </div>

          {/* 활동별 상세 피드백 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">활동별 상세 피드백</h3>
            <div className="space-y-6">
              {activity.activities.map((activityDetail, index) => {
                const feedback = activityFeedbacks.find(f => f.activity_detail_id === activityDetail.id);
                const [newSuggestion, setNewSuggestion] = useState('');
                
                return (
                  <div key={activityDetail.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{activityDetail.title}</h4>
                        <p className="text-sm text-gray-600">{activityDetail.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">평점:</span>
                        <RatingStars
                          rating={feedback?.rating || 0}
                          onRatingChange={(rating) => updateActivityFeedback(activityDetail.id, 'rating', rating)}
                          readonly={readonly}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          코멘트
                        </label>
                        <textarea
                          value={feedback?.comment || ''}
                          onChange={(e) => updateActivityFeedback(activityDetail.id, 'comment', e.target.value)}
                          placeholder="이 활동에 대한 피드백을 작성하세요"
                          rows={3}
                          readOnly={readonly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          구체적 제안사항
                        </label>
                        <div className="space-y-2">
                          {feedback?.specific_suggestions.map((suggestion, suggestionIndex) => (
                            <div key={suggestionIndex} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{suggestion}</span>
                              {!readonly && (
                                <button
                                  onClick={() => removeSuggestionFromActivity(activityDetail.id, suggestionIndex)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          {!readonly && (
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newSuggestion}
                                onChange={(e) => setNewSuggestion(e.target.value)}
                                placeholder="새 제안사항 추가"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    addSuggestionToActivity(activityDetail.id, newSuggestion);
                                    setNewSuggestion('');
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  addSuggestionToActivity(activityDetail.id, newSuggestion);
                                  setNewSuggestion('');
                                }}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 종합 피드백 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 잘한 점 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">잘한 점</h3>
              <div className="space-y-2">
                {strengths.map((strength, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 px-3 py-2 rounded">
                    <span className="text-sm">{strength}</span>
                    {!readonly && (
                      <button
                        onClick={() => removeFromList(strengths, setStrengths, index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!readonly && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newStrength}
                      onChange={(e) => setNewStrength(e.target.value)}
                      placeholder="잘한 점 추가"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList(strengths, setStrengths, newStrength, setNewStrength);
                        }
                      }}
                    />
                    <button
                      onClick={() => addToList(strengths, setStrengths, newStrength, setNewStrength)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 개선할 점 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">개선할 점</h3>
              <div className="space-y-2">
                {improvements.map((improvement, index) => (
                  <div key={index} className="flex items-center justify-between bg-orange-50 px-3 py-2 rounded">
                    <span className="text-sm">{improvement}</span>
                    {!readonly && (
                      <button
                        onClick={() => removeFromList(improvements, setImprovements, index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!readonly && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newImprovement}
                      onChange={(e) => setNewImprovement(e.target.value)}
                      placeholder="개선할 점 추가"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList(improvements, setImprovements, newImprovement, setNewImprovement);
                        }
                      }}
                    />
                    <button
                      onClick={() => addToList(improvements, setImprovements, newImprovement, setNewImprovement)}
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 제안사항 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">제안사항</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded">
                    <span className="text-sm">{suggestion}</span>
                    {!readonly && (
                      <button
                        onClick={() => removeFromList(suggestions, setSuggestions, index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!readonly && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newSuggestion}
                      onChange={(e) => setNewSuggestion(e.target.value)}
                      placeholder="제안사항 추가"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList(suggestions, setSuggestions, newSuggestion, setNewSuggestion);
                        }
                      }}
                    />
                    <button
                      onClick={() => addToList(suggestions, setSuggestions, newSuggestion, setNewSuggestion)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 다음 목표 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">다음 목표</h3>
              <div className="space-y-2">
                {nextGoals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded">
                    <span className="text-sm">{goal}</span>
                    {!readonly && (
                      <button
                        onClick={() => removeFromList(nextGoals, setNextGoals, index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!readonly && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="다음 목표 추가"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToList(nextGoals, setNextGoals, newGoal, setNewGoal);
                        }
                      }}
                    />
                    <button
                      onClick={() => addToList(nextGoals, setNextGoals, newGoal, setNewGoal)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        {!readonly && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              피드백 저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorFeedback;