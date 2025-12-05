import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PageContainer } from '../common/PageContainer';

interface ExamTakingProps {
  exam: Exam;
  onBack: () => void;
  onSubmit: (answers: ExamAnswer[]) => void;
}

interface AnswerState {
  answer: string | string[]; // Can be a single string for text, or string[] for multiple choice
  selectedOptions?: string[]; // For multiple choice, if needed to store selected option texts
  timeSpent: number; // New field to track time spent on this question
}

interface QuestionOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
}

// Local interface to match the transformed data in loadQuestions
interface ExamTakingQuestion extends ExamQuestion {
  question_type: string;
  question_text: string;
  options?: QuestionOption[];
  explanation?: string;
}

const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  onBack,
  onSubmit
}) => {
  const [questions, setQuestions] = useState<ExamTakingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60); // 초 단위
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  // Timer for tracking time spent per question
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentQuestionTimeSpent, setCurrentQuestionTimeSpent] = useState(0);

  // 시험 문제 로딩
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ExamTaking] 시험 문제 로딩 시작:', exam.id);

        const examWithQuestions = await ExamService.getExamById(exam.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!examWithQuestions || !(examWithQuestions as any).exam_questions) {
          throw new Error('시험 문제를 불러올 수 없습니다.');
        }

        // exam_questions를 ExamTakingQuestion 형식으로 변환
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedQuestions: ExamTakingQuestion[] = (examWithQuestions as any).exam_questions.map((eq: any) => ({
          id: eq.question.id,
          exam_id: exam.id,
          question_id: eq.question.id, // Add required field
          points: eq.points,
          order_index: eq.order_index,
          is_required: true, // Add required field or default

          question_type: eq.question.type,
          question_text: eq.question.question_text,
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

  // 현재 문제
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswerState = currentQuestion ? answers[currentQuestion.id] : undefined;

  // 자동 제출 (시간 종료)
  const handleAutoSubmit = useCallback(() => {
    // Ensure the last question's timeSpent is saved before submitting
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          timeSpent: currentQuestionTimeSpent
        }
      }));
    }

    const examAnswers: ExamAnswer[] = Object.entries(answers).map(([questionId, answerState]) => ({
      id: `answer-${questionId}`, // Unique ID for the answer
      attempt_id: 'attempt-1', // Placeholder, will be assigned by backend
      question_id: questionId,
      answer_text: typeof answerState.answer === 'string' ? answerState.answer : '',
      selected_options: Array.isArray(answerState.answer) ? answerState.answer : answerState.selectedOptions,
      points_awarded: 0, // Will be calculated by backend
      feedback: '', // Will be provided by backend
      time_spent_seconds: answerState.timeSpent || 0 // Include time spent
    }));

    onSubmit(examAnswers);
  }, [answers, onSubmit, currentQuestion, currentQuestionTimeSpent]);

  // 타이머 관리 (전체 시험 시간)
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
  }, [examStarted, handleAutoSubmit]); // Added handleAutoSubmit to dependencies

  // 문제별 시간 측정 타이머
  useEffect(() => {
    if (!examStarted || !currentQuestion) return;

    // Clear previous timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }

    // Initialize time spent for current question
    setCurrentQuestionTimeSpent(answers[currentQuestion.id]?.timeSpent || 0);

    // Start new timer
    questionTimerRef.current = setInterval(() => {
      setCurrentQuestionTimeSpent(prev => prev + 1);
    }, 1000);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [examStarted, currentQuestion, answers]);

  // currentQuestionIndex 변경 시 현재 문제의 timeSpent를 answers에 저장
  useEffect(() => {
    if (currentQuestion && examStarted) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          timeSpent: currentQuestionTimeSpent
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);



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
  const saveAnswer = useCallback((questionId: string, answer: string | string[], selectedOptions?: string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        answer,
        selectedOptions,
        timeSpent: prev[questionId]?.timeSpent || 0 // Preserve existing timeSpent or initialize to 0
      }
    }));
  }, []);

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



  // 수동 제출
  const handleSubmit = () => {
    // Ensure the last question's timeSpent is saved before submitting
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          timeSpent: currentQuestionTimeSpent
        }
      }));
    }

    const examAnswers: ExamAnswer[] = Object.entries(answers).map(([questionId, answerState]) => ({
      id: `answer-${questionId}`, // Unique ID for the answer
      attempt_id: 'attempt-1', // Placeholder, will be assigned by backend
      question_id: questionId,
      answer_text: typeof answerState.answer === 'string' ? answerState.answer : '',
      selected_options: Array.isArray(answerState.answer) ? answerState.answer : answerState.selectedOptions,
      points_awarded: 0, // Will be calculated by backend
      feedback: '', // Will be provided by backend
      time_spent_seconds: answerState.timeSpent || 0 // Include time spent
    }));

    onSubmit(examAnswers);
  };



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
      <PageContainer>
        <div className="max-w-2xl mx-auto py-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400 mx-auto"></div>
            <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">시험 준비 중...</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">문제 정보를 불러오고 있습니다. 잠시만 기다려주세요.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <PageContainer>
        <div className="max-w-xl mx-auto py-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">문제 로딩 실패</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onBack}
                className="btn-outline px-6"
              >
                돌아가기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary px-6"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // 시험 시작 전 화면
  if (!examStarted) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto py-10">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{exam.title}</h2>
              <p className="text-blue-100 font-medium">{exam.course_name}</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">문항 수</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{exam.question_count || 0}문항</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">시험 시간</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{exam.duration_minutes}분</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">합격 점수</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{exam.passing_score}점</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">응시 횟수</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{exam.max_attempts}회</span>
                </div>
              </div>

              {exam.description && (
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 mb-6 border border-blue-100 dark:border-blue-800/30">
                  <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    시험 안내
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{exam.description}</p>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5 mb-8">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3 shrink-0" />
                  <div>
                    <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2">주의사항</h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-200 space-y-1.5 list-disc list-inside">
                      <li>시험 시작 후에는 중도에 나갈 수 없습니다.</li>
                      <li>제한 시간이 지나면 자동으로 제출됩니다.</li>
                      <li>브라우저를 새로고침하면 답안이 초기화될 수 있습니다.</li>
                      <li>안정적인 인터넷 연결을 확인해주세요.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={onBack}
                  className="btn-ghost flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  목록으로 돌아가기
                </button>
                <button
                  onClick={startExam}
                  className="btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                >
                  시험 시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 - 시간 및 진행도 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4 z-40 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {exam.title}
                <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 ${getTimeColor()}`}>
                <ClockIcon className="h-5 w-5 mr-2" />
                <span className="text-xl font-mono font-bold tracking-wider">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="btn-primary shadow-md hover:shadow-lg transition-all"
              >
                제출하기
              </button>
            </div>
          </div>

          {/* 진행도 바 */}
          <div className="mt-4">
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 문제 내용 */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-8 min-h-[500px] flex flex-col relative overflow-hidden">
                {/* 배경 장식 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-full -mr-10 -mt-10 z-0"></div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center">
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">
                      문제 {currentQuestionIndex + 1}
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                      배점 {currentQuestion.points}점
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={`p-2.5 rounded-full transition-all duration-200 ${flaggedQuestions.has(currentQuestion.id)
                      ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                      }`}
                    title={flaggedQuestions.has(currentQuestion.id) ? "플래그 해제" : "나중에 다시 확인하기 위해 표시"}
                  >
                    <FlagIcon className={flaggedQuestions.has(currentQuestion.id) ? "h-6 w-6 fill-current" : "h-6 w-6"} />
                  </button>
                </div>

                <div className="mb-8 relative z-10">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                    {currentQuestion.question_text}
                  </h3>
                </div>

                {/* 객관식 선택지 */}
                {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-4 mb-8 relative z-10 flex-grow">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${currentAnswerState?.answer === option.option_text
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400 shadow-sm'
                          : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${currentAnswerState?.answer === option.option_text
                          ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-500 dark:bg-indigo-400'
                          : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-300'
                          }`}>
                          {currentAnswerState?.answer === option.option_text && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option.option_text}
                          checked={currentAnswerState?.answer === option.option_text}
                          onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                          className="sr-only"
                        />
                        <span className={`text-lg transition-colors ${currentAnswerState?.answer === option.option_text
                          ? 'text-indigo-900 dark:text-indigo-100 font-medium'
                          : 'text-gray-700 dark:text-gray-300'
                          }`}>
                          {option.option_text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* 주관식 답안 */}
                {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
                  <div className="flex-grow mb-8 relative z-10">
                    <textarea
                      value={currentAnswerState?.answer as string || ''}
                      onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                      rows={currentQuestion.question_type === 'essay' ? 12 : 4}
                      className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-lg transition-all resize-none"
                      placeholder="답안을 입력하세요."
                    />
                  </div>
                )}

                {/* 네비게이션 */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700 relative z-10 mt-auto">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="btn-outline px-6 py-2.5 flex items-center disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    <ChevronLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    이전
                  </button>

                  <div className="hidden sm:flex items-center space-x-3">
                    {currentAnswerState ? (
                      <span className="flex items-center text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-1.5 rounded-full text-sm">
                        <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                        답변 완료
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-800 px-4 py-1.5 rounded-full text-sm">
                        <div className="h-4 w-4 border-2 border-gray-400 dark:border-gray-500 rounded-full mr-2" />
                        답변 대기
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="btn-secondary px-6 py-2.5 flex items-center disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    다음
                    <ChevronRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 - 문제 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-28 transition-all">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span>문제 목록</span>
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {Object.keys(answers).length}/{questions.length} 완료
                </span>
              </h3>

              <div className="grid grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {questions.map((question, index) => {
                  const hasAnswer = !!answers[question.id];
                  const isFlagged = flaggedQuestions.has(question.id);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`relative w-full aspect-square flex items-center justify-center text-sm font-bold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isCurrent
                        ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 dark:ring-indigo-800'
                        : hasAnswer
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {index + 1}
                      {isFlagged && (
                        <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm">
                          <FlagIcon className="h-3 w-3 text-yellow-500 fill-current" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-xs font-medium space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-600 rounded mr-2.5"></div>
                  <span className="text-gray-600 dark:text-gray-400">현재 문제</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded mr-2.5"></div>
                  <span className="text-gray-600 dark:text-gray-400">답변 완료</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded mr-2.5"></div>
                  <span className="text-gray-600 dark:text-gray-400">답변 대기</span>
                </div>
                <div className="flex items-center">
                  <FlagIcon className="w-3 h-3 text-yellow-500 mr-2.5" />
                  <span className="text-gray-600 dark:text-gray-400">플래그 표시됨</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 제출 확인 모달 */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 scale-100 animate-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">시험 제출 확인</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  정말로 시험을 제출하시겠습니까?<br />제출 후에는 수정할 수 없습니다.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-6 text-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between mb-3 text-gray-600 dark:text-gray-400">
                  <span>전체 문항</span>
                  <span className="font-bold text-gray-900 dark:text-white">{questions.length}문항</span>
                </div>
                <div className="flex justify-between mb-3 text-gray-600 dark:text-gray-400">
                  <span>답변 완료</span>
                  <span className={`font-bold ${Object.keys(answers).length === questions.length ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {Object.keys(answers).length}문항
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                  <span>남은 시간</span>
                  <span className={`font-mono font-bold ${getTimeColor()}`}>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {Object.keys(answers).length < questions.length && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl flex items-start mb-6 border border-yellow-200 dark:border-yellow-800/50">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">아직 답변하지 않은 {questions.length - Object.keys(answers).length}문제가 있습니다.<br />그래도 제출하시겠습니까?</p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 btn-outline py-3"
                >
                  계속 풀기
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary flex-1 py-3"
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