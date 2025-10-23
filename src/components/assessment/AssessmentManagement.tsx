import React, { useState } from 'react';
import TabNavigation from '../common/TabNavigation';
import { ExamManagement } from '../exam';
import { PracticeEvaluation } from '../practice';

const AssessmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('theory-exams');

  const tabs = [
    { id: 'theory-exams', label: '이론 평가', icon: '■', count: 5 },
    { id: 'practical-assessments', label: '실습 평가', icon: '▲', count: 8 },
    { id: 'certificates', label: '인증서', icon: '●' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theory-exams':
        return <ExamManagement />;
      case 'practical-assessments':
        return <PracticeEvaluation />;
      case 'certificates':
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-6xl mb-4 text-gray-500">●</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">인증서 관리</h3>
              <p className="text-gray-600">수료증 및 인증서 발급을 관리합니다.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">BS 활동 관리</h3>
            <p className="text-gray-600">BS 활동 관리 기능을 개발 중입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📝 평가 및 활동 관리</h1>
        <p className="text-gray-600">BS 활동부터 시험, 실습평가까지 통합 관리</p>
      </div>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {renderTabContent()}
    </div>
  );
};

export default AssessmentManagement;