import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { QuestionFormData } from './VisualQuestionBuilder';

interface QuestionEditModalProps {
  question: QuestionFormData;
  questionIndex: number;
  onSave: (question: QuestionFormData) => void;
  onClose: () => void;
}

export default function QuestionEditModal({
  question: initialQuestion,
  questionIndex,
  onSave,
  onClose
}: QuestionEditModalProps) {
  const [question, setQuestion] = React.useState<QuestionFormData>(initialQuestion);

  const updateField = (field: keyof QuestionFormData, value: any) => {
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    updateField('options', newOptions);
  };

  const handleSave = () => {
    onSave(question);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              문제 {questionIndex + 1} 편집
            </h2>
            <button
              onClick={onClose}
              className="btn-ghost p-2 rounded-full"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 문제 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 유형 *
            </label>
            <select
              value={question.question_type}
              onChange={(e) => updateField('question_type', e.target.value)}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="multiple_choice">객관식</option>
              <option value="true_false">O/X</option>
              <option value="short_answer">단답형</option>
              <option value="essay">서술형</option>
            </select>
          </div>

          {/* 문제 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 내용 *
            </label>
            <textarea
              value={question.question_text}
              onChange={(e) => updateField('question_text', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="문제를 입력하세요."
            />
          </div>

          {/* 객관식 선택지 */}
          {question.question_type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택지
              </label>
              <div className="space-y-2">
                {(question.options || ['', '', '', '']).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500 w-8">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`선택지 ${optionIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 배점 & 정답 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배점 *
              </label>
              <input
                type="number"
                value={question.points}
                onChange={(e) => updateField('points', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정답 *
              </label>
              {question.question_type === 'true_false' ? (
                <select
                  value={question.correct_answer}
                  onChange={(e) => updateField('correct_answer', e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="true">O (참)</option>
                  <option value="false">X (거짓)</option>
                </select>
              ) : question.question_type === 'multiple_choice' ? (
                <select
                  value={question.correct_answer}
                  onChange={(e) => updateField('correct_answer', e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">선택하세요</option>
                  {(question.options || []).map((_, i) => (
                    <option key={i} value={String(i + 1)}>
                      {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={question.correct_answer}
                  onChange={(e) => updateField('correct_answer', e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="정답을 입력하세요."
                />
              )}
            </div>
          </div>

          {/* 해설 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해설 (선택사항)
            </label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => updateField('explanation', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="정답 해설을 입력하세요."
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-outline"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
