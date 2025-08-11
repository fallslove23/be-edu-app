import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { examStatusLabels, examTypeLabels } from '../../services/exam.services';
import type { Exam, ExamType, ExamStatus, ExamQuestion, QuestionType } from '../../types/exam.types';
import type { Course } from '../../services/course.services';
import { format, addDays } from 'date-fns';

interface ExamFormProps {
  exam: Exam | null;
  courses: Course[];
  onBack: () => void;
  onSave: (examData: Partial<Exam>) => void;
}

interface ExamFormData {
  course_id: string;
  title: string;
  description: string;
  exam_type: ExamType;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  max_attempts: number;
  is_randomized: boolean;
  show_results_immediately: boolean;
  scheduled_start: string;
  scheduled_end: string;
  status: ExamStatus;
}

interface QuestionFormData {
  question_type: QuestionType;
  question_text: string;
  points: number;
  options: string[];
  correct_answer: string;
  explanation: string;
}

const ExamForm: React.FC<ExamFormProps> = ({
  exam,
  courses,
  onBack,
  onSave
}) => {
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ExamFormData>({
    defaultValues: exam ? {
      course_id: exam.course_id,
      title: exam.title,
      description: exam.description || '',
      exam_type: exam.exam_type,
      duration_minutes: exam.duration_minutes,
      total_questions: exam.total_questions,
      passing_score: exam.passing_score,
      max_attempts: exam.max_attempts,
      is_randomized: exam.is_randomized,
      show_results_immediately: exam.show_results_immediately,
      scheduled_start: exam.scheduled_start ? format(new Date(exam.scheduled_start), "yyyy-MM-dd'T'HH:mm") : '',
      scheduled_end: exam.scheduled_end ? format(new Date(exam.scheduled_end), "yyyy-MM-dd'T'HH:mm") : '',
      status: exam.status
    } : {
      course_id: '',
      title: '',
      description: '',
      exam_type: 'multiple_choice',
      duration_minutes: 60,
      total_questions: 10,
      passing_score: 70,
      max_attempts: 3,
      is_randomized: false,
      show_results_immediately: true,
      scheduled_start: format(new Date(), "yyyy-MM-dd'T'09:00"),
      scheduled_end: format(addDays(new Date(), 1), "yyyy-MM-dd'T'18:00"),
      status: 'draft'
    }
  });

  const watchedTotalQuestions = watch('total_questions');

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
        scheduled_start: new Date(data.scheduled_start).toISOString(),
        scheduled_end: new Date(data.scheduled_end).toISOString()
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {exam ? '시험 편집' : '새 시험 생성'}
              </h1>
              <p className="text-gray-600">
                {exam ? '기존 시험을 수정합니다.' : '새로운 이론 평가 시험을 생성합니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                과정 선택 *
              </label>
              <select
                {...register('course_id', { required: '과정을 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">과정 선택</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
              {errors.course_id && (
                <p className="mt-1 text-sm text-red-600">{errors.course_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 유형 *
              </label>
              <select
                {...register('exam_type', { required: '시험 유형을 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {(Object.keys(examTypeLabels) as ExamType[]).map(type => (
                  <option key={type} value={type}>{examTypeLabels[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시험 제목 *
            </label>
            <input
              type="text"
              {...register('title', { required: '시험 제목을 입력해주세요.' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 영업 기초 이론 평가"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시험 설명
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="시험에 대한 상세 설명을 입력하세요."
            />
          </div>
        </div>

        {/* 시험 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">시험 설정</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 시간 (분) *
              </label>
              <input
                type="number"
                {...register('duration_minutes', { 
                  required: '시험 시간을 입력해주세요.',
                  min: { value: 1, message: '1분 이상이어야 합니다.' }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-600">{errors.duration_minutes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                총 문항 수 *
              </label>
              <input
                type="number"
                {...register('total_questions', { 
                  required: '문항 수를 입력해주세요.',
                  min: { value: 1, message: '1문항 이상이어야 합니다.' },
                  max: { value: 100, message: '100문항을 초과할 수 없습니다.' }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="100"
              />
              {errors.total_questions && (
                <p className="mt-1 text-sm text-red-600">{errors.total_questions.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                합격 점수 *
              </label>
              <input
                type="number"
                {...register('passing_score', { 
                  required: '합격 점수를 입력해주세요.',
                  min: { value: 0, message: '0점 이상이어야 합니다.' },
                  max: { value: 100, message: '100점을 초과할 수 없습니다.' }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
              />
              {errors.passing_score && (
                <p className="mt-1 text-sm text-red-600">{errors.passing_score.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 응시 횟수 *
              </label>
              <input
                type="number"
                {...register('max_attempts', { 
                  required: '최대 응시 횟수를 입력해주세요.',
                  min: { value: 1, message: '1회 이상이어야 합니다.' }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
              {errors.max_attempts && (
                <p className="mt-1 text-sm text-red-600">{errors.max_attempts.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('is_randomized')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                문제 순서 랜덤화
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('show_results_immediately')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                제출 즉시 결과 표시
              </label>
            </div>
          </div>
        </div>

        {/* 일정 설정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">일정 설정</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 일시 *
              </label>
              <input
                type="datetime-local"
                {...register('scheduled_start', { required: '시작 일시를 설정해주세요.' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.scheduled_start && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_start.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 일시 *
              </label>
              <input
                type="datetime-local"
                {...register('scheduled_end', { required: '종료 일시를 설정해주세요.' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.scheduled_end && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_end.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 *
              </label>
              <select
                {...register('status', { required: '상태를 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {(Object.keys(examStatusLabels) as ExamStatus[]).map(status => (
                  <option key={status} value={status}>{examStatusLabels[status]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 문제 관리 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              문제 관리 ({questions.length}개)
            </h2>
            <button
              type="button"
              onClick={() => setShowQuestions(!showQuestions)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700"
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

          {showQuestions && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                총 {watchedTotalQuestions}개의 문제를 설정할 수 있습니다. (현재 {questions.length}개)
              </p>
              
              {questions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">문제 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => setActiveQuestionIndex(activeQuestionIndex === index ? null : index)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {activeQuestionIndex === index ? '접기' : '편집'}
                    </button>
                  </div>

                  {activeQuestionIndex === index && (
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          문제 내용 *
                        </label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="문제를 입력하세요."
                        />
                      </div>

                      {question.question_type === 'multiple_choice' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            선택지
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 w-6">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder={`선택지 ${optionIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            정답
                          </label>
                          <input
                            type="text"
                            value={question.correct_answer}
                            onChange={(e) => updateQuestion(index, { correct_answer: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="정답을 입력하세요."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            배점
                          </label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 1 })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          해설 (선택사항)
                        </label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="정답 해설을 입력하세요."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? '저장 중...' : (exam ? '수정 완료' : '시험 생성')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;