/**
 * 평가 관리 통합 페이지
 * - 평가 템플릿, 강사 평가, 종합 성적을 탭으로 구성
 */

import React, { useState } from 'react';
import EvaluationTemplateManagement from './EvaluationTemplateManagement';
import ComprehensiveGradesDashboard from './ComprehensiveGradesDashboard';

type Tab = 'templates' | 'grades';

export default function EvaluationManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('templates');

  // TODO: 과정 회차 선택 기능 추가
  const [selectedCourseRoundId] = useState('');

  console.log('EvaluationManagement rendered, activeTab:', activeTab);

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            ⚙️ 평가 템플릿
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'grades'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            📊 종합 성적
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'templates' && <EvaluationTemplateManagement />}
        {activeTab === 'grades' && (
          <>
            {selectedCourseRoundId ? (
              <ComprehensiveGradesDashboard courseRoundId={selectedCourseRoundId} />
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <p className="text-yellow-800 dark:text-yellow-200">
                  과정 회차를 선택해주세요.
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
                  향후 과정 회차 선택 UI가 추가될 예정입니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
