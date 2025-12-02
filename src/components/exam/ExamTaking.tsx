import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import type { Exam, ExamQuestion, ExamAnswer } from '../../types/exam.types';
import { ExamService } from '../../services/exam.services';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageContainer } from '../common/PageContainer';

interface ExamTakingProps {
  exam: Exam;
  onBack: () => void;
  onSubmit: (answers: ExamAnswer[]) => void;
}

interface Answer {
  questionId: string;
  answer: string;
  selectedOptions?: string[];
}

const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  onBack,
  onSubmit
}) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60); // 초 단위
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  // 시험 문제 로딩
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ExamTaking] 시험 문제 로딩 시작:', exam.id);

        const examWithQuestions = await ExamService.getExamById(exam.id);

        if (!examWithQuestions || !(examWithQuestions as any).exam_questions) {
          throw new Error('시험 문제를 불러올 수 없습니다.');
        }

        // exam_questions를 ExamQuestion 형식으로 변환
        const loadedQuestions: ExamQuestion[] = (examWithQuestions as any).exam_questions.map((eq: any) => ({
          id: eq.question.id,
          exam_id: exam.id,
          question_type: eq.question.type,
          question_text: eq.question.question_text,
          points: eq.points,
          order_index: eq.order_index,
          options: eq.question.options || [],
          correct_answer: '', // 학생에게는 정답 노출하지 않음
          explanation: eq.question.explanation || '',
          created_at: new Date().toISOString()
        }));

        console.log('[ExamTaking] 문제 로딩 완료:', loadedQuestions.length, '개');
        setQuestions(loadedQuestions);

      } catch (err) {
        console.error('[ExamTaking] 문제 로딩 실패:', err);
        setError(err instanceof Error ? err.message : '문제를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [exam.id]);

  // 타이머 관리
  useEffect(() => {
    if (!examStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 시간 종료 시 자동 제출
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted]);

  // 시간 포맷팅
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 시험 시작
  const startExam = () => {
    setExamStarted(true);
  };

  // 답변 저장
  const saveAnswer = (questionId: string, answer: string, selectedOptions?: string[]) => {
    setAnswers(prev => new Map(prev).set(questionId, {
      questionId,
      answer,
      selectedOptions
    }));
  };

  // 문제 플래그 토글
  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // 자동 제출 (시간 종료)
  const handleAutoSubmit = useCallback(() => {
    const examAnswers: ExamAnswer[] = Array.from(answers.values()).map((answer, index) => ({
      id: `answer-${index + 1}`,
      attempt_id: 'attempt-1',
      question_id: answer.questionId,
      answer_text: answer.answer,
      selected_options: answer.selectedOptions,
      points_awarded: 0,
      feedback: ''
    }));

    onSubmit(examAnswers);
  }, [answers, onSubmit]);

  // 수동 제출
  const handleSubmit = () => {
    const examAnswers: ExamAnswer[] = Array.from(answers.values()).map((answer, index) => ({
      id: `answer-${index + 1}`,
      attempt_id: 'attempt-1',
      question_id: answer.questionId,
      answer_text: answer.answer,
      selected_options: answer.selectedOptions,
      points_awarded: 0,
      feedback: ''
    }));

    onSubmit(examAnswers);
  };

  // 현재 문제
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : undefined;

  // 시간 경고 색상
  const getTimeColor = () => {
    const percentage = (timeLeft / (exam.duration_minutes * 60)) * 100;
    if (percentage <= 10) return 'text-destructive';
    if (percentage <= 25) return 'text-foreground';
    return 'text-green-600';
  };

  // 로딩 중 화면
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">시험 문제를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">문제 로딩 실패</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6 space-x-3">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
              >
                돌아가기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 시험 시작 전 화면
  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">{exam.title}</h2>
            <p className="mt-2 text-gray-600">{exam.course_name}</p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">시험 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">문항 수:</span>
                  <span className="ml-2 font-medium">{exam.question_count || 0}문항</span>
                </div>
                <div>
                  <span className="text-gray-600">시험 시간:</span>
                  <span className="ml-2 font-medium">{exam.duration_minutes}분</span>
                </div>
                <div>
                  <span className="text-gray-600">합격 점수:</span>
                  <span className="ml-2 font-medium">{exam.passing_score}점</span>
                </div>
                <div>
                  <span className="text-gray-600">응시 횟수:</span>
                  <span className="ml-2 font-medium">{exam.max_attempts}회</span>
                </div>
              </div>
            </div>

            {exam.description && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">시험 안내</h3>
                <p className="text-sm text-blue-800">{exam.description}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">주의사항</h3>
                  <ul className="mt-2 text-sm text-foreground space-y-1">
                    <li>• 시험 시작 후에는 중도에 나갈 수 없습니다.</li>
                    <li>• 제한 시간이 지나면 자동으로 제출됩니다.</li>
                    <li>• 브라우저를 새로고침하면 답안이 초기화될 수 있습니다.</li>
                    <li>• 안정적인 인터넷 연결을 확인해주세요.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </button>
            <button
              onClick={startExam}
              className="btn-primary"
            >
              시험 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 - 시간 및 진행도 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600">
                문제 {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${getTimeColor()}`}>
                <ClockIcon className="h-5 w-5 mr-2" />
                <span className="text-lg font-mono font-bold">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="btn-primary"
              >
                제출하기
              </button>
            </div>
          </div>

          {/* 진행도 바 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>진행도</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-lg h-2">
              <div
                className="bg-blue-600 h-2 rounded-lg transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 문제 내용 */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      문제 {currentQuestionIndex + 1}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({currentQuestion.points}점)
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`p-2 rounded-full transition-colors ${flaggedQuestions.has(currentQuestion.id)
                      ? 'text-foreground bg-yellow-100 hover:bg-yellow-200'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    title="문제 플래그"
                  >
                    <FlagIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-lg text-gray-900 leading-relaxed">
                    {(currentQuestion as any).question_text}
                  </p>
                </div>

                {/* 객관식 선택지 */}
                {(currentQuestion as any).question_type === 'multiple_choice' && (currentQuestion as any).options && (
                  <div className="space-y-3">
                    {(currentQuestion as any).options.map((option: any, index: number) => (
                      <label
                        key={option.id}
                        className={`flex items-center p-4 border rounded-full cursor-pointer transition-colors ${currentAnswer?.answer === option.option_text
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option.option_text}
                          checked={currentAnswer?.answer === option.option_text}
                          onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-900">
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option.option_text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* 주관식 답안 */}
                {((currentQuestion as any).question_type === 'short_answer' || (currentQuestion as any).question_type === 'essay') && (
                  <div>
                    <textarea
                      value={currentAnswer?.answer || ''}
                      onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                      rows={(currentQuestion as any).question_type === 'essay' ? 8 : 3}
                      className="w-full border border-gray-300 rounded-full px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="답안을 입력하세요."
                    />
                  </div>
                )}

                {/* 네비게이션 */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-2" />
                    이전 문제
                  </button>

                  <div className="flex items-center space-x-2">
                    {currentAnswer ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-lg" />
                    )}
                    <span className="text-sm text-gray-600">
                      {currentAnswer ? '답변 완료' : '답변 대기'}
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="btn-outline flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음 문제
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 - 문제 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <h3 className="font-medium text-gray-900 mb-4">문제 목록</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                {questions.map((question, index) => {
                  const hasAnswer = answers.has(question.id);
                  const isFlagged = flaggedQuestions.has(question.id);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`relative p-2 text-sm font-medium rounded-full transition-colors ${isCurrent
                        ? 'bg-blue-600 text-white'
                        : hasAnswer
                          ? 'bg-green-500/10 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <FlagIcon className="absolute -top-1 -right-1 h-3 w-3 text-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500/10 rounded mr-2"></div>
                  <span>답변 완료</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div>
                  <span>답변 대기</span>
                </div>
                <div className="flex items-center">
                  <FlagIcon className="w-3 h-3 text-foreground mr-2" />
                  <span>플래그</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                <div className="text-gray-600">
                  답변 진행률: {Math.round((answers.size / questions.length) * 100)}%
                </div>
                <div className="text-gray-600">
                  답변한 문제: {answers.size} / {questions.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 제출 확인 모달 */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">시험 제출 확인</h3>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  정말로 시험을 제출하시겠습니까?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span>전체 문제:</span>
                    <span>{questions.length}문항</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>답변한 문제:</span>
                    <span className={answers.size === questions.length ? 'text-green-600' : 'text-foreground'}>
                      {answers.size}문항
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>남은 시간:</span>
                    <span className={getTimeColor()}>{formatTime(timeLeft)}</span>
                  </div>
                </div>
                {answers.size < questions.length && (
                  <p className="text-foreground text-sm mt-3">
                    ⚠️ 아직 답변하지 않은 문제가 있습니다.
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                >
                  제출하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ExamTaking;