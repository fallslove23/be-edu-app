import React, { useState } from 'react';
import {
  BookOpenIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CourseManagement, CourseTemplateManagement, NewCourseManagement } from '../courses';
import { AttendanceManagement } from '../attendance';
import { PageContainer } from '../common/PageContainer';

type TabType = 'courses' | 'templates' | 'sessions' | 'attendance';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  roles: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'courses',
    label: '과정 관리',
    icon: BookOpenIcon,
    description: '교육 과정 생성 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor']
  },
  {
    id: 'templates',
    label: '과정 템플릿',
    icon: DocumentDuplicateIcon,
    description: '표준 과정 템플릿 및 마스터 관리',
    roles: ['admin', 'manager']
  },
  {
    id: 'sessions',
    label: '차수별 과정',
    icon: CalendarDaysIcon,
    description: '과정 차수별 상세 운영 관리',
    roles: ['admin', 'manager', 'operator']
  },
  {
    id: 'attendance',
    label: '출석 관리',
    icon: CheckCircleIcon,
    description: '수강생 출석 체크 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor']
  }
];

interface IntegratedEducationManagementProps {
  userRole?: string;
}

const IntegratedEducationManagement: React.FC<IntegratedEducationManagementProps> = ({
  userRole = 'admin'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [searchTerm, setSearchTerm] = useState('');

  // 사용자 권한에 따라 접근 가능한 탭 필터링
  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'courses':
        return <CourseManagement />;
      case 'templates':
        return <CourseTemplateManagement />;
      case 'sessions':
        return <NewCourseManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      default:
        return <CourseManagement />;
    }
  };

  const getActiveTabConfig = () => {
    return availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];
  };

  const getQuickActions = () => {
    switch (activeTab) {
      case 'courses':
        return [
          { label: '새 과정 생성', action: () => { }, primary: true },
          { label: '과정 가져오기', action: () => { }, primary: false }
        ];
      case 'templates':
        return [
          { label: '새 템플릿', action: () => { }, primary: true },
          { label: '템플릿 복사', action: () => { }, primary: false }
        ];
      case 'sessions':
        return [
          { label: '새 차수 개설', action: () => { }, primary: true },
          { label: '일괄 개설', action: () => { }, primary: false }
        ];
      case 'attendance':
        return [
          { label: '출석 체크', action: () => { }, primary: true },
          { label: '보강 관리', action: () => { }, primary: false }
        ];
      default:
        return [];
    }
  };

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">교육 운영 관리</h1>
            <p className="text-gray-600">{getActiveTabConfig()?.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* 통합 검색 */}
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="과정명, 강사명, 기관명으로 검색..."
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
                  className={`px-4 py-2 rounded-full transition-colors flex items-center text-sm font-medium ${action.primary
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
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
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

      {/* 교육 운영 통계 대시보드 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">운영 중인 과정</p>
              <p className="text-2xl font-semibold text-gray-900">24개</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <DocumentDuplicateIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활용 템플릿</p>
              <p className="text-2xl font-semibold text-gray-900">8개</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번 달 차수</p>
              <p className="text-2xl font-semibold text-gray-900">12차수</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 출석률</p>
              <p className="text-2xl font-semibold text-gray-900">94.2%</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default IntegratedEducationManagement;