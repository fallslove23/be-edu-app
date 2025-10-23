import React, { useState } from 'react';
import TabNavigation from '../common/TabNavigation';
import { CourseManagement } from '../courses';
import { TraineeManagement } from '../trainees';

const EducationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('courses');

  const tabs = [
    { id: 'courses', label: '과정 관리', icon: '■', count: 3 },
    { id: 'templates', label: '과정 템플릿', icon: '▲' },
    { id: 'sessions', label: '차수별 과정', icon: '●' },
    { id: 'attendance', label: '출석 관리', icon: '◆' },
    { id: 'trainees', label: '교육생 관리', icon: '◾', count: 25 }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'courses':
        return <CourseManagement />;
      case 'templates':
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-6xl mb-4 text-gray-500">▲</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">과정 템플릿 관리</h3>
              <p className="text-gray-600 mb-6">재사용 가능한 과정 템플릿을 생성하고 관리합니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-center">
                    <div className="text-2xl mb-2">➕</div>
                    <p className="text-sm text-gray-600">새 템플릿 만들기</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'sessions':
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-6xl mb-4 text-gray-500">●</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">차수별 과정 관리</h3>
              <p className="text-gray-600">동일한 과정의 여러 차수를 관리합니다.</p>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-6xl mb-4 text-gray-500">◆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">출석 관리</h3>
              <p className="text-gray-600">교육생 출석을 체크하고 관리합니다.</p>
            </div>
          </div>
        );
      case 'trainees':
        return <TraineeManagement />;
      default:
        return <CourseManagement />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🎓 교육 운영 관리</h1>
        <p className="text-gray-600">과정 생성부터 교육생 관리까지 통합 교육 운영</p>
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

export default EducationManagement;