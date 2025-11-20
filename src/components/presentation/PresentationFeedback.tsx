import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { InstructorFeedback, BSActivityEntry } from '../../types/activity-journal.types';

interface PresentationFeedbackProps {
  activityEntry: BSActivityEntry;
  onFeedbackSubmit: (feedback: Partial<InstructorFeedback>) => void;
  onClose: () => void;
  isRealTime?: boolean; // 실시간 피드백 모드 여부
}

const PresentationFeedback: React.FC<PresentationFeedbackProps> = ({
  activityEntry,
  onFeedbackSubmit,
  onClose,
  isRealTime = false
}) => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

  const [feedbackData, setFeedbackData] = useState({
    presentationScore: 0,
    contentQuality: 0,
    presentationSkill: 0,
    strengths: '',
    areasForImprovement: '',
    specificSuggestions: '',
    encouragement: '',
    overallGrade: 'B' as 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  });

  const [quickNotes, setQuickNotes] = useState<string[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presentationTimer, setPresentationTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // 실시간 피드백 상태
  const [liveComments, setLiveComments] = useState<{
    id: string;
    timestamp: string;
    comment: string;
    type: 'positive' | 'improvement' | 'neutral';
  }[]>([]);

  // 발표 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && isRealTime) {
      interval = setInterval(() => {
        setPresentationTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isRealTime]);

  // 빠른 메모 추가
  const addQuickNote = () => {
    if (currentNote.trim()) {
      setQuickNotes(prev => [...prev, currentNote.trim()]);
      setCurrentNote('');
    }
  };

  // 실시간 코멘트 추가
  const addLiveComment = (comment: string, type: 'positive' | 'improvement' | 'neutral') => {
    const newComment = {
      id: `comment-${Date.now()}`,
      timestamp: new Date().toISOString(),
      comment,
      type
    };
    setLiveComments(prev => [...prev, newComment]);
  };

  // 점수에 따른 자동 등급 계산
  const calculateGrade = (scores: { presentationScore: number; contentQuality: number; presentationSkill: number }) => {
    const average = (scores.presentationScore + scores.contentQuality + scores.presentationSkill) / 3;
    
    if (average >= 9.5) return 'A+';
    if (average >= 9.0) return 'A';
    if (average >= 8.5) return 'B+';
    if (average >= 8.0) return 'B';
    if (average >= 7.5) return 'C+';
    if (average >= 7.0) return 'C';
    if (average >= 6.0) return 'D';
    return 'F';
  };

  // 점수 변경 핸들러
  const handleScoreChange = (field: 'presentationScore' | 'contentQuality' | 'presentationSkill', value: number) => {
    const newFeedbackData = {
      ...feedbackData,
      [field]: value
    };
    
    // 자동 등급 계산
    const autoGrade = calculateGrade(newFeedbackData);
    newFeedbackData.overallGrade = autoGrade;
    
    setFeedbackData(newFeedbackData);
  };

  // 피드백 제출
  const handleSubmit = async () => {
    if (!isInstructor) return;

    setIsSubmitting(true);
    
    try {
      const feedback: Partial<InstructorFeedback> = {
        activityId: activityEntry.id,
        instructorId: user?.id || '',
        instructorName: user?.name || '',
        ...feedbackData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onFeedbackSubmit(feedback);
      alert('피드백이 성공적으로 제출되었습니다!');
      onClose();
    } catch (error) {
      console.error('피드백 제출 실패:', error);
      alert('피드백 제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderStarRating = (field: 'presentationScore' | 'contentQuality' | 'presentationSkill', label: string) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleScoreChange(field, star)}
              className={`p-1 rounded transition-colors ${
                star <= feedbackData[field]
                  ? 'text-yellow-400 hover:text-foreground'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <StarIcon className="h-5 w-5 fill-current" />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-gray-700">
            {feedbackData[field]}/10
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isRealTime ? '🎤 실시간 발표 피드백' : '📝 발표 피드백 작성'}
              </h2>
              <p className="text-sm text-gray-600">
                발표자: {activityEntry.studentName} | 제목: {activityEntry.title}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isRealTime && (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-mono text-lg font-medium text-blue-600">
                    {formatTime(presentationTimer)}
                  </span>
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      timerActive 
                        ? 'bg-destructive/10 text-destructive hover:bg-red-200' 
                        : 'bg-green-500/10 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {timerActive ? '일시정지' : '시작'}
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽: 실시간 메모 (실시간 모드) 또는 점수 입력 */}
            <div className="space-y-6">
              {isRealTime && (
                <>
                  {/* 빠른 메모 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-3">💡 실시간 메모</h3>
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addQuickNote()}
                        placeholder="빠른 메모 입력..."
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={addQuickNote}
                        className="btn-primary"
                      >
                        추가
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {quickNotes.map((note, index) => (
                        <div key={index} className="text-sm text-blue-800 bg-white p-2 rounded border border-blue-200">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 빠른 평가 버튼 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">⚡ 빠른 평가</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => addLiveComment('발표 내용이 명확합니다', 'positive')}
                        className="flex items-center justify-center space-x-1 bg-green-500/10 text-green-700 p-2 rounded-lg hover:bg-green-200"
                      >
                        <HandThumbUpIcon className="h-4 w-4" />
                        <span>내용 명확</span>
                      </button>
                      <button
                        onClick={() => addLiveComment('목소리를 크게 해주세요', 'improvement')}
                        className="flex items-center justify-center space-x-1 bg-yellow-100 text-orange-700 p-2 rounded-lg hover:bg-yellow-200"
                      >
                        <MicrophoneIcon className="h-4 w-4" />
                        <span>목소리 크게</span>
                      </button>
                      <button
                        onClick={() => addLiveComment('아이컨택이 좋습니다', 'positive')}
                        className="flex items-center justify-center space-x-1 bg-green-500/10 text-green-700 p-2 rounded-lg hover:bg-green-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>아이컨택 좋음</span>
                      </button>
                      <button
                        onClick={() => addLiveComment('속도 조절이 필요합니다', 'improvement')}
                        className="flex items-center justify-center space-x-1 bg-orange-500/10 text-orange-700 p-2 rounded-lg hover:bg-orange-200"
                      >
                        <ClockIcon className="h-4 w-4" />
                        <span>속도 조절</span>
                      </button>
                    </div>
                  </div>

                  {/* 실시간 코멘트 목록 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">📝 실시간 코멘트</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {liveComments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-2 rounded-full text-sm ${
                            comment.type === 'positive' 
                              ? 'bg-green-500/10 border border-green-200 text-green-800'
                              : comment.type === 'improvement'
                                ? 'bg-orange-500/10 border border-orange-200 text-orange-800'
                                : 'bg-gray-50 border border-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span>{comment.comment}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(comment.timestamp).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 점수 입력 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">📊 점수 평가</h3>
                {renderStarRating('presentationScore', '전체 발표 점수')}
                {renderStarRating('contentQuality', '내용의 질')}
                {renderStarRating('presentationSkill', '발표 스킬')}
                
                {/* 자동 계산된 등급 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">전체 등급</span>
                    <span className="text-lg font-bold text-blue-900">{feedbackData.overallGrade}</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    평균 점수: {((feedbackData.presentationScore + feedbackData.contentQuality + feedbackData.presentationSkill) / 3).toFixed(1)}/10
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 상세 피드백 */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">💬 상세 피드백</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  잘한 점 <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={feedbackData.strengths}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, strengths: e.target.value }))}
                  placeholder="발표에서 특히 잘한 부분을 구체적으로 작성해주세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  개선점
                </label>
                <textarea
                  value={feedbackData.areasForImprovement}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                  placeholder="개선이 필요한 부분을 건설적으로 제안해주세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  구체적 제안사항
                </label>
                <textarea
                  value={feedbackData.specificSuggestions}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, specificSuggestions: e.target.value }))}
                  placeholder="다음 발표를 위한 구체적인 제안사항을 작성해주세요..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  격려 메시지 <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={feedbackData.encouragement}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, encouragement: e.target.value }))}
                  placeholder="학습자에게 동기부여가 되는 격려 메시지를 작성해주세요..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 빠른 메모 반영 버튼 (실시간 모드) */}
              {isRealTime && quickNotes.length > 0 && (
                <button
                  onClick={() => {
                    const notesText = quickNotes.join('. ') + '.';
                    setFeedbackData(prev => ({ 
                      ...prev, 
                      specificSuggestions: prev.specificSuggestions + (prev.specificSuggestions ? ' ' : '') + notesText 
                    }));
                  }}
                  className="w-full bg-blue-100 text-blue-700 border border-blue-300 py-2 rounded-lg hover:bg-blue-200"
                >
                  실시간 메모를 제안사항에 반영
                </button>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !feedbackData.strengths || !feedbackData.encouragement}
              className="btn-primary"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-lg h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
              <span>{isSubmitting ? '제출 중...' : '피드백 제출'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationFeedback;