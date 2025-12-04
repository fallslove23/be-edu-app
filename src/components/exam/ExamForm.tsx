import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { examStatusLabels, examTypeLabels } from '../../services/exam.services';
import type { Exam, ExamType, ExamStatus, ExamQuestion, QuestionType } from '../../types/exam.types';
import type { CourseRound } from '../../types/course-template.types';
import { format, addDays } from 'date-fns';
import { QuestionBankService } from '../../services/question-bank.service';
import type { QuestionBank as QB, Question } from '../../services/question-bank.service';
import SmartQuestionBankSelector from './SmartQuestionBankSelector';
import VisualQuestionBuilder, { QuestionFormData } from './VisualQuestionBuilder';
import QuestionEditModal from './QuestionEditModal';
import { PageContainer } from '../common/PageContainer';

interface ExamFormProps {
  exam: Exam | null;
  courseRounds: CourseRound[];
  onBack: () => void;
  onSave: (examData: Partial<Exam>) => void;
  questionBank?: {
    id: string;
    name: string;
    questions: any[];
  };
  selectedTargets?: string[];
}

interface ExamFormData {
  round_id: string;
  title: string;
  description: string;
  exam_type: ExamType;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  max_attempts: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  scheduled_at: string;
  available_until: string;
  status: ExamStatus;
}

const ExamForm: React.FC<ExamFormProps> = ({
  exam,
  courseRounds,
  onBack,
  onSave,
  questionBank,
  selectedTargets = []
}) => {
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [availableBanks, setAvailableBanks] = useState<any[]>([]);

  // 디버깅: courseRounds 확인
  useEffect(() => {
    console.log('📊 ExamForm courseRounds:', courseRounds);
    console.log('📊 ExamForm courseRounds length:', courseRounds?.length);
  }, [courseRounds]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ExamFormData>({
    defaultValues: exam ? {
      round_id: exam.round_id || '',
      title: exam.title,
      description: exam.description || '',
      exam_type: exam.exam_type,
      duration_minutes: exam.duration_minutes,
      total_questions: 10,
      passing_score: exam.passing_score,
      max_attempts: exam.max_attempts,
      randomize_questions: exam.randomize_questions,
      show_correct_answers: exam.show_correct_answers,
      scheduled_at: exam.scheduled_at ? format(new Date(exam.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
      available_until: exam.available_until ? format(new Date(exam.available_until), "yyyy-MM-dd'T'HH:mm") : '',
      status: exam.status
    } : {
      round_id: '',
      title: questionBank ? `${questionBank.name} 시험` : '',
      description: '',
      exam_type: 'final',
      duration_minutes: 60,
      total_questions: questionBank ? questionBank.questions.length : 10,
      passing_score: 70,
      max_attempts: 3,
      randomize_questions: false,
      show_correct_answers: false,
      scheduled_at: format(new Date(), "yyyy-MM-dd'T'09:00"),
      available_until: format(addDays(new Date(), 7), "yyyy-MM-dd'T'23:59"),
      status: 'draft'
    }
  });

  const watchedTotalQuestions = watch('total_questions');

  // exam이 변경될 때 (편집 모드) 폼 값 업데이트
  useEffect(() => {
    if (exam) {
      console.log('📝 Setting form values from exam:', exam);
      console.log('📝 exam.round_id:', exam.round_id);

      if (exam.round_id) {
        setValue('round_id', exam.round_id);
      }
      setValue('title', exam.title);
      setValue('description', exam.description || '');
      setValue('exam_type', exam.exam_type);
      setValue('duration_minutes', exam.duration_minutes);
      setValue('total_questions', 10);
      setValue('passing_score', exam.passing_score);
      setValue('max_attempts', exam.max_attempts);
      setValue('randomize_questions', exam.randomize_questions);
      setValue('show_correct_answers', exam.show_correct_answers);

      if (exam.scheduled_at) {
        setValue('scheduled_at', format(new Date(exam.scheduled_at), "yyyy-MM-dd'T'HH:mm"));
      }
      if (exam.available_until) {
        setValue('available_until', format(new Date(exam.available_until), "yyyy-MM-dd'T'HH:mm"));
      }
      setValue('status', exam.status);
    }
  }, [exam, setValue]);

  // 문제은행 목록 로드
  useEffect(() => {
    const loadQuestionBanks = async () => {
      try {
        const banks = await QuestionBankService.getQuestionBanks({ includeQuestions: true });
        setAvailableBanks(banks);
      } catch (error) {
        console.error('❌ Failed to load question banks:', error);
      }
    };
    loadQuestionBanks();
  }, []);

  // 문제은행에서 온 경우 문제 목록 미리 설정
  useEffect(() => {
    if (questionBank && questionBank.questions.length > 0) {
      const bankQuestions: QuestionFormData[] = questionBank.questions.map(q => ({
        question_type: q.type || 'multiple_choice',
        question_text: q.question || '',
        points: 1,
        options: q.options || ['', '', '', ''],
        correct_answer: q.correct_answer?.toString() || '',
        explanation: q.explanation || ''
      }));
      setQuestions(bankQuestions);
      setShowQuestions(true); // 문제은행에서 온 경우 자동으로 문제 표시
    }
  }, [questionBank]);

  // 문제은행에서 문제 가져오기
  const importQuestionsFromBank = (bank: QB) => {
    if (!bank.questions || bank.questions.length === 0) {
      alert('이 문제은행에는 문제가 없습니다.');
      return;
    }

    const bankQuestions: QuestionFormData[] = bank.questions.map((q: Question) => ({
      question_type: (q.type === 'multiple_choice' || q.type === 'true_false' ||
        q.type === 'short_answer' || q.type === 'essay'
        ? q.type : 'multiple_choice') as QuestionType,
      question_text: q.question_text,
      points: q.points,
      options: (q.options as string[]) || ['', '', '', ''],
      correct_answer: q.correct_answer?.toString() || '',
      explanation: q.explanation || ''
    }));

    setQuestions(bankQuestions);
    setValue('total_questions', bankQuestions.length);
    setShowQuestions(true);
    setShowBankSelector(false);
    alert(`${bank.name}에서 ${bankQuestions.length}개의 문제를 가져왔습니다.`);
  };

  // 총 문항 수 변경 시 문제 목록 업데이트
  useEffect(() => {
    const currentLength = questions.length;
    const targetLength = watchedTotalQuestions;

    if (targetLength > currentLength) {
      // 문제 추가
      const newQuestions = Array.from({ length: targetLength - currentLength }, () => ({
        question_type: 'multiple_choice' as QuestionType,
        question_text: '',
        points: 1,
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: ''
      }));
      setQuestions([...questions, ...newQuestions]);
    } else if (targetLength < currentLength) {
      // 문제 제거
      setQuestions(questions.slice(0, targetLength));
    }
  }, [watchedTotalQuestions, questions.length]);

  const onSubmit = async (data: ExamFormData) => {
    try {
      // 시험 데이터 생성
      const examData: Partial<Exam> = {
        ...data,
        id: exam?.id,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        available_until: new Date(data.available_until).toISOString(),
        total_points: 100,
        allow_review: true
      };

      onSave(examData);
    } catch (error) {
      console.error('Failed to save exam:', error);
    }
  };

  // 문제 업데이트
  const updateQuestion = (index: number, questionData: Partial<QuestionFormData>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...questionData };
    setQuestions(newQuestions);
  };

  // 문제 옵션 업데이트
  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...newQuestions[questionIndex].options];
    newOptions[optionIndex] = value;
    newQuestions[questionIndex].options = newOptions;
    setQuestions(newQuestions);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 btn-ghost p-2 rounded-full"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {exam ? '시험 편집' : (questionBank ? '문제은행에서 시험 생성' : '새 시험 생성')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {exam ? '기존 시험을 수정합니다.' :
                    questionBank ? `"${questionBank.name}" 문제은행을 사용하여 시험을 생성합니다.` :
                      '새로운 이론 평가 시험을 생성합니다.'}
                </p>
                {questionBank && selectedTargets.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    대상 과정: {selectedTargets.length}개 차수 선택됨
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">기본 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  과정 차수 선택 *
                </label>
                <select
                  {...register('round_id', { required: '과정 차수를 선택해주세요.' })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">과정 차수 선택</option>
                  {courseRounds.map(round => (
                    <option key={round.id} value={round.id}>
                      {round.title} ({round.status === 'recruiting' ? '모집중' :
                        round.status === 'in_progress' ? '진행중' :
                          round.status === 'planning' ? '기획중' : '완료'})
                    </option>
                  ))}
                </select>
                {errors.round_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.round_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시험 유형 *
                </label>
                <select
                  {...register('exam_type', { required: '시험 유형을 선택해주세요.' })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {(Object.keys(examTypeLabels) as ExamType[]).map(type => (
                    <option key={type} value={type}>{examTypeLabels[type]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                시험 제목 *
              </label>
              <input
                type="text"
                {...register('title', { required: '시험 제목을 입력해주세요.' })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 영업 기초 이론 평가"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                시험 설명
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="시험에 대한 상세 설명을 입력하세요."
              />
            </div>
          </div>

          {/* 시험 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">시험 설정</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시험 시간 (분) *
                </label>
                <input
                  type="number"
                  {...register('duration_minutes', {
                    required: '시험 시간을 입력해주세요.',
                    min: { value: 1, message: '1분 이상이어야 합니다.' }
                  })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
                {errors.duration_minutes && (
                  <p className="mt-1 text-sm text-destructive">{errors.duration_minutes.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  총 문항 수 *
                </label>
                <input
                  type="number"
                  {...register('total_questions', {
                    required: '문항 수를 입력해주세요.',
                    min: { value: 1, message: '1문항 이상이어야 합니다.' },
                    max: { value: 100, message: '100문항을 초과할 수 없습니다.' }
                  })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="100"
                />
                {errors.total_questions && (
                  <p className="mt-1 text-sm text-destructive">{errors.total_questions.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  합격 점수 *
                </label>
                <input
                  type="number"
                  {...register('passing_score', {
                    required: '합격 점수를 입력해주세요.',
                    min: { value: 0, message: '0점 이상이어야 합니다.' },
                    max: { value: 100, message: '100점을 초과할 수 없습니다.' }
                  })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                />
                {errors.passing_score && (
                  <p className="mt-1 text-sm text-destructive">{errors.passing_score.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  최대 응시 횟수 *
                </label>
                <input
                  type="number"
                  {...register('max_attempts', {
                    required: '최대 응시 횟수를 입력해주세요.',
                    min: { value: 1, message: '1회 이상이어야 합니다.' }
                  })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
                {errors.max_attempts && (
                  <p className="mt-1 text-sm text-destructive">{errors.max_attempts.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('randomize_questions')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  문제 순서 랜덤화
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('show_correct_answers')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  정답 표시
                </label>
              </div>
            </div>
          </div>

          {/* 일정 설정 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">일정 설정</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시험 시작 일시 *
                </label>
                <input
                  type="datetime-local"
                  {...register('scheduled_at', { required: '시작 일시를 설정해주세요.' })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.scheduled_at && (
                  <p className="mt-1 text-sm text-destructive">{errors.scheduled_at.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  응시 마감 일시 *
                </label>
                <input
                  type="datetime-local"
                  {...register('available_until', { required: '마감 일시를 설정해주세요.' })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.available_until && (
                  <p className="mt-1 text-sm text-destructive">{errors.available_until.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태 *
                </label>
                <select
                  {...register('status', { required: '상태를 선택해주세요.' })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {(Object.keys(examStatusLabels) as ExamStatus[]).map(status => (
                    <option key={status} value={status}>{examStatusLabels[status]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 문제 관리 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                문제 관리 ({questions.length}개)
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBankSelector(true)}
                  className="btn-secondary py-2 px-3 text-sm flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  문제은행에서 가져오기
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="btn-ghost text-sm flex items-center"
                >
                  {showQuestions ? (
                    <>
                      <EyeSlashIcon className="h-4 w-4 mr-1" />
                      문제 숨기기
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-4 w-4 mr-1" />
                      문제 보기
                    </>
                  )}
                </button>
              </div>
            </div>

            {showQuestions && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  총 {watchedTotalQuestions}개의 문제를 설정할 수 있습니다. (현재 {questions.length}개)
                </p>

                <VisualQuestionBuilder
                  questions={questions}
                  onQuestionsChange={setQuestions}
                  onEditQuestion={(index) => setEditingQuestionIndex(index)}
                  onDeleteQuestion={(index) => {
                    if (window.confirm('이 문제를 삭제하시겠습니까?')) {
                      setQuestions(prev => prev.filter((_, i) => i !== index));
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="btn-outline"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {isSubmitting ? '저장 중...' : (exam ? '수정 완료' : '시험 생성')}
              </button>
            </div>
          </div>
        </form>

        {/* 스마트 문제은행 선택 모달 */}
        {showBankSelector && (
          <SmartQuestionBankSelector
            banks={availableBanks}
            onSelect={importQuestionsFromBank as any}
            onClose={() => setShowBankSelector(false)}
          />
        )}

        {/* 문제 편집 모달 */}
        {editingQuestionIndex !== null && questions[editingQuestionIndex] && (
          <QuestionEditModal
            question={questions[editingQuestionIndex]}
            questionIndex={editingQuestionIndex}
            onSave={(updatedQuestion) => {
              const newQuestions = [...questions];
              newQuestions[editingQuestionIndex] = updatedQuestion;
              setQuestions(newQuestions);
            }}
            onClose={() => setEditingQuestionIndex(null)}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default ExamForm;