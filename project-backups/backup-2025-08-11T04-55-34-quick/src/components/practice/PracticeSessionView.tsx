import React from 'react';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';
import type { PracticeEvaluation } from '../../types/practice.types';

interface PracticeSessionViewProps {
  practice: PracticeEvaluation;
  onBack: () => void;
}

const PracticeSessionView: React.FC<PracticeSessionViewProps> = ({
  practice,
  onBack
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <PlayIcon className="h-6 w-6 mr-2 text-green-600" />
              {practice.title} - 실습 세션
            </h1>
            <p className="text-gray-600">실습 평가 세션 진행 화면입니다.</p>
          </div>
        </div>
      </div>

      {/* 시나리오 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">시나리오: {practice.scenario.title}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">배경</h3>
            <p className="text-gray-600 text-sm">{practice.scenario.background}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">고객 프로필</h3>
            <div className="bg-gray-50 rounded p-4 mt-2">
              <p><strong>이름:</strong> {practice.scenario.customer_profile.name}</p>
              <p><strong>나이:</strong> {practice.scenario.customer_profile.age}세</p>
              <p><strong>직업:</strong> {practice.scenario.customer_profile.occupation}</p>
              <p><strong>예산:</strong> {practice.scenario.customer_profile.budget_range}</p>
              <p><strong>니즈:</strong> {practice.scenario.customer_profile.needs.join(', ')}</p>
              <p><strong>우려사항:</strong> {practice.scenario.customer_profile.concerns.join(', ')}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">성공 기준</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              {practice.scenario.success_criteria.map((criteria, index) => (
                <li key={index}>{criteria}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <PlayIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-medium text-blue-900 mb-2">실습 세션 준비</h3>
        <p className="text-blue-700 mb-4">
          실제 실습 세션 기능은 곧 구현됩니다. 평가자와 교육생이 함께 참여할 수 있는 실시간 평가 시스템이 제공될 예정입니다.
        </p>
        <p className="text-sm text-blue-600">
          예정 시간: {practice.duration_minutes}분 | 최대 점수: {practice.max_score}점
        </p>
      </div>
    </div>
  );
};

export default PracticeSessionView;