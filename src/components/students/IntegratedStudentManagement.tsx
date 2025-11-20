import React, { useState } from 'react';
import { 
  UserGroupIcon, 
  AcademicCapIcon, 
  DocumentTextIcon, 
  TrophyIcon,
  DocumentIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import TraineeManagement from '../trainees/TraineeManagement';
import EnrollmentHistory from './EnrollmentHistory';
import CompletionHistory from './CompletionHistory';
import PerformanceReportGenerator from './PerformanceReportGenerator';
import CertificateManagement from './CertificateManagement';

type TabType = 'students' | 'enrollment' | 'completion' | 'performance' | 'certificates';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'students',
    label: '교육생 목록',
    icon: UserGroupIcon,
    description: '교육생 기본 정보 및 현황'
  },
  {
    id: 'enrollment',
    label: '수강 이력',
    icon: DocumentTextIcon,
    description: '과정별 수강 현황 및 이력'
  },
  {
    id: 'completion',
    label: '수료 이력',
    icon: AcademicCapIcon,
    description: '교육생별 수료 현황'
  },
  {
    id: 'performance',
    label: '성과 분석',
    icon: TrophyIcon,
    description: '학습 성과 및 평가 결과'
  },
  {
    id: 'certificates',
    label: '인증서 관리',
    icon: DocumentIcon,
    description: '수료증 및 인증서 발급'
  }
];

const IntegratedStudentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [searchTerm, setSearchTerm] = useState('');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return <TraineeManagement />;
      case 'enrollment':
        return <EnrollmentHistory />;
      case 'completion':
        return <CompletionHistory />;
      case 'performance':
        return (
          <PerformanceReportGenerator 
            onClose={() => {}} 
          />
        );
      case 'certificates':
        return <CertificateManagement />;
      default:
        return <TraineeManagement />;
    }
  };

  const getActiveTabConfig = () => {
    return tabs.find(tab => tab.id === activeTab) || tabs[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">교육생 관리</h1>
              <p className="text-gray-600">{getActiveTabConfig().description}</p>
            </div>
            
            {/* 통합 검색 */}
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="교육생명, 과정명, 기관명으로 검색..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="탭">
              {tabs.map((tab) => {
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

        {/* 요약 통계 (전체 탭에서 공통) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 교육생</p>
                <p className="text-2xl font-semibold text-gray-900">248명</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수강 중</p>
                <p className="text-2xl font-semibold text-gray-900">156명</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수료 완료</p>
                <p className="text-2xl font-semibold text-gray-900">92명</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-foreground" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 성과</p>
                <p className="text-2xl font-semibold text-gray-900">85.2점</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedStudentManagement;