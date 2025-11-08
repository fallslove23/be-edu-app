import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  AcademicCapIcon,
  BeakerIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { ExamManagement } from '../exam';
import { PracticeEvaluation } from '../practice';
import { ActivityJournal } from '../journal';

type TabType = 'bs-activity' | 'exams' | 'practice';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  roles: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'bs-activity',
    label: 'BS 활동 점검',
    icon: DocumentTextIcon,
    description: 'BS 활동 일지 작성 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee']
  },
  {
    id: 'exams',
    label: '이론 평가',
    icon: AcademicCapIcon,
    description: '시험 생성 및 채점 관리',
    roles: ['admin', 'manager', 'operator', 'instructor']
  },
  {
    id: 'practice',
    label: '실습 평가',
    icon: BeakerIcon,
    description: '실습 및 시뮬레이션 평가',
    roles: ['admin', 'manager', 'operator', 'instructor']
  }
];

interface IntegratedAssessmentManagementProps {
  userRole?: string;
}

const IntegratedAssessmentManagement: React.FC<IntegratedAssessmentManagementProps> = ({ 
  userRole = 'admin' 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bs-activity');
  const [searchTerm, setSearchTerm] = useState('');

  // 사용자 권한에 따라 접근 가능한 탭 필터링
  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bs-activity':
        return <ActivityJournal />;
      case 'exams':
        return <ExamManagement />;
      case 'practice':
        return <PracticeEvaluation />;
      default:
        return <ActivityJournal />;
    }
  };

  const getActiveTabConfig = () => {
    return availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];
  };

  const getQuickActions = () => {
    switch (activeTab) {
      case 'bs-activity':
        return [
          { label: '새 활동 기록', action: () => {}, primary: true },
          { label: '활동 템플릿', action: () => {}, primary: false }
        ];
      case 'exams':
        return [
          { label: '새 시험 생성', action: () => {}, primary: true },
          { label: '문제 은행', action: () => {}, primary: false }
        ];
      case 'practice':
        return [
          { label: '실습 평가 생성', action: () => {}, primary: true },
          { label: '평가 기준 관리', action: () => {}, primary: false }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">평가 및 활동 관리</h1>
              <p className="text-gray-600">{getActiveTabConfig()?.description}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* 통합 검색 */}
              <div className="relative w-full sm:w-96">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="활동명, 시험명, 교육생명으로 검색..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 빠른 액션 버튼들 */}
              <div className="flex space-x-3">
                {getQuickActions().map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium ${
                      action.primary
                        ? 'btn-primary'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {action.primary && <PlusIcon className="h-4 w-4 mr-2" />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="탭">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>

        {/* 평가 및 활동 통계 대시보드 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BS 활동 기록</p>
                <p className="text-2xl font-semibold text-gray-900">156건</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">이론 시험</p>
                <p className="text-2xl font-semibold text-gray-900">28회</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BeakerIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">실습 평가</p>
                <p className="text-2xl font-semibold text-gray-900">42회</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 점수</p>
                <p className="text-2xl font-semibold text-gray-900">87.4점</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedAssessmentManagement;