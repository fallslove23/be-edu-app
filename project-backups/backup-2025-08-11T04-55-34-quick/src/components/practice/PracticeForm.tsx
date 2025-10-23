import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { PracticeEvaluation } from '../../types/practice.types';

interface PracticeFormProps {
  practice: PracticeEvaluation | null;
  onBack: () => void;
  onSave: (practiceData: Partial<PracticeEvaluation>) => void;
}

const PracticeForm: React.FC<PracticeFormProps> = ({
  practice,
  onBack,
  onSave
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {practice ? '실습 평가 수정' : '새 실습 평가 생성'}
            </h1>
            <p className="text-gray-600">실습 평가 폼은 곧 구현됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeForm;