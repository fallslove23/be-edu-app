import React, { useState } from 'react';
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { Exam } from '@/types/exam.types';
import { format, addDays } from 'date-fns';

interface ExamCloneWizardProps {
  exam: Exam;
  onClone: (clonedExam: Partial<Exam>, options: CloneOptions) => void;
  onClose: () => void;
}

interface CloneOptions {
  shuffleQuestions: boolean;
  adjustDifficulty?: 'easier' | 'harder' | 'same';
  adjustSchedule: boolean;
  daysOffset?: number;
}

export default function ExamCloneWizard({
  exam,
  onClone,
  onClose
}: ExamCloneWizardProps) {
  const [step, setStep] = useState(1);
  const [clonedExam, setClonedExam] = useState<Partial<Exam>>({
    title: `${exam.title} (복사본)`,
    description: exam.description,
    exam_type: exam.exam_type,
    duration_minutes: exam.duration_minutes,
    passing_score: exam.passing_score,
    max_attempts: exam.max_attempts,
    randomize_questions: exam.randomize_questions,
    show_correct_answers: exam.show_correct_answers,
    status: 'draft' as const,
  });

  const [options, setOptions] = useState<CloneOptions>({
    shuffleQuestions: false,
    adjustDifficulty: 'same',
    adjustSchedule: true,
    daysOffset: 7,
  });

  const updateExamField = (field: keyof Exam, value: any) => {
    setClonedExam(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (field: keyof CloneOptions, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClone = () => {
    // 일정 조정
    if (options.adjustSchedule && exam.scheduled_at && options.daysOffset) {
      const newSchedule = addDays(new Date(exam.scheduled_at), options.daysOffset);
      clonedExam.scheduled_at = newSchedule.toISOString();

      if (exam.available_until) {
        const newDeadline = addDays(new Date(exam.available_until), options.daysOffset);
        clonedExam.available_until = newDeadline.toISOString();
      }
    }

    onClone(clonedExam, options);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentDuplicateIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">시험 복제 마법사</h2>
                <p className="text-sm text-gray-600 mt-1">
                  "{exam.title}" 시험을 복제합니다
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 진행 단계 */}
          <div className="mt-6 flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                      step === s
                        ? 'bg-purple-600 text-white shadow-lg'
                        : step > s
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s ? <CheckCircleIcon className="h-6 w-6" /> : s}
                  </div>
                  <span className={`text-sm font-medium ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
                    {s === 1 && '기본 정보'}
                    {s === 2 && '복제 옵션'}
                    {s === 3 && '일정 설정'}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      step > s ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: 기본 정보 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">원본 시험 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-blue-700">유형:</span> <span className="font-medium">{exam.exam_type}</span></div>
                  <div><span className="text-blue-700">시간:</span> <span className="font-medium">{exam.duration_minutes}분</span></div>
                  <div><span className="text-blue-700">합격점:</span> <span className="font-medium">{exam.passing_score}점</span></div>
                  <div><span className="text-blue-700">최대 응시:</span> <span className="font-medium">{exam.max_attempts}회</span></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시험 제목 *
                </label>
                <input
                  type="text"
                  value={clonedExam.title}
                  onChange={(e) => updateExamField('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="복제된 시험 제목"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={clonedExam.description || ''}
                  onChange={(e) => updateExamField('description', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="시험 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시험 시간 (분)
                  </label>
                  <input
                    type="number"
                    value={clonedExam.duration_minutes}
                    onChange={(e) => updateExamField('duration_minutes', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    합격 점수
                  </label>
                  <input
                    type="number"
                    value={clonedExam.passing_score}
                    onChange={(e) => updateExamField('passing_score', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 복제 옵션 */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-3">
                  <SparklesIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">스마트 복제 옵션</h3>
                    <p className="text-sm text-purple-800">
                      시험의 특성을 유지하면서 새로운 시험을 만듭니다
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* 문제 섞기 */}
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-full hover:border-purple-300 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={options.shuffleQuestions}
                    onChange={(e) => updateOption('shuffleQuestions', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ArrowsRightLeftIcon className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900">문제 순서 섞기</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      복제된 시험의 문제 순서를 무작위로 섞습니다
                    </p>
                  </div>
                </label>

                {/* 난이도 조정 */}
                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    난이도 조정 (향후 지원 예정)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easier', 'same', 'harder'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => updateOption('adjustDifficulty', level)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          options.adjustDifficulty === level
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level === 'easier' && '쉽게'}
                        {level === 'same' && '동일'}
                        {level === 'harder' && '어렵게'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    AI를 통해 문제 난이도를 자동 조정합니다 (개발 중)
                  </p>
                </div>

                {/* 랜덤 출제 */}
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-full hover:border-purple-300 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={clonedExam.randomize_questions}
                    onChange={(e) => updateExamField('randomize_questions', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">문제 랜덤 출제</span>
                    <p className="text-sm text-gray-600 mt-1">
                      응시자마다 다른 순서로 문제가 출제됩니다
                    </p>
                  </div>
                </label>

                {/* 정답 표시 */}
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-full hover:border-purple-300 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={clonedExam.show_correct_answers}
                    onChange={(e) => updateExamField('show_correct_answers', e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">정답 표시</span>
                    <p className="text-sm text-gray-600 mt-1">
                      시험 완료 후 정답을 표시합니다
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: 일정 설정 */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">일정 자동 조정</h3>
                    <p className="text-sm text-green-800">
                      원본 시험 일정을 기준으로 새로운 일정을 설정합니다
                    </p>
                  </div>
                </div>
              </div>

              {exam.scheduled_at && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">원본 시험 일정</div>
                  <div className="font-medium text-gray-900">
                    {format(new Date(exam.scheduled_at), 'yyyy년 MM월 dd일 HH:mm')}
                    {exam.available_until && (
                      <span className="text-gray-600">
                        {' '}~ {format(new Date(exam.available_until), 'yyyy년 MM월 dd일 HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-full hover:border-green-300 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={options.adjustSchedule}
                  onChange={(e) => updateOption('adjustSchedule', e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">일정 자동 조정</span>
                  <p className="text-sm text-gray-600 mt-1">
                    원본 일정을 기준으로 날짜를 자동으로 조정합니다
                  </p>
                </div>
              </label>

              {options.adjustSchedule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일정 이동 (일)
                  </label>
                  <input
                    type="number"
                    value={options.daysOffset}
                    onChange={(e) => updateOption('daysOffset', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    원본 시험 일정에서 며칠 후로 설정할지 입력하세요 (기본: 7일)
                  </p>

                  {exam.scheduled_at && options.daysOffset !== undefined && (
                    <div className="mt-3 p-3 bg-green-500/10 rounded border border-green-200">
                      <div className="text-xs text-green-700 mb-1">새로운 일정</div>
                      <div className="font-medium text-green-900 text-sm">
                        {format(addDays(new Date(exam.scheduled_at), options.daysOffset), 'yyyy년 MM월 dd일 HH:mm')}
                        {exam.available_until && (
                          <span className="text-green-700">
                            {' '}~ {format(addDays(new Date(exam.available_until), options.daysOffset), 'yyyy년 MM월 dd일 HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                이전
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleClone}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg"
              >
                복제 완료
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
