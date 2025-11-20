import React, { useState } from 'react';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import BSCourseManagement from '../courses/BSCourseManagement';
import UnifiedTemplateManagement from '../courses/UnifiedTemplateManagement';
import { AttendanceManagement } from '../attendance';
import toast from 'react-hot-toast';

type TabType = 'overview' | 'rounds' | 'templates' | 'attendance';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  roles: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: '과정 현황',
    icon: ChartBarIcon,
    description: '전체 교육 과정 현황 및 통계',
    roles: ['admin', 'manager', 'operator']
  },
  {
    id: 'templates',
    label: '과정 템플릿 관리',
    icon: DocumentDuplicateIcon,
    description: '교육 과정 템플릿 생성 및 관리',
    roles: ['admin', 'manager']
  },
  {
    id: 'rounds',
    label: '과정 운영 관리',
    icon: CalendarDaysIcon,
    description: '차수별 과정 진행 및 완료 관리',
    roles: ['admin', 'manager', 'operator']
  },
  {
    id: 'attendance',
    label: '출석 관리',
    icon: CheckCircleIcon,
    description: '수강생 출석 관리',
    roles: ['admin', 'manager', 'operator', 'instructor']
  }
];

interface UnifiedEducationManagementProps {
  userRole?: string;
}

const UnifiedEducationManagement: React.FC<UnifiedEducationManagementProps> = ({
  userRole = 'admin'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);

  // 사용자 권한에 따라 접근 가능한 탭 필터링
  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 데이터 새로고침 로직
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('데이터를 새로고침했습니다');
    } catch (error) {
      toast.error('새로고침 중 오류가 발생했습니다');
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <BSCourseManagement viewMode="overview" isRoundModalOpen={isRoundModalOpen} setIsRoundModalOpen={setIsRoundModalOpen} />;
      case 'rounds':
        return <BSCourseManagement viewMode="rounds" isRoundModalOpen={isRoundModalOpen} setIsRoundModalOpen={setIsRoundModalOpen} />;
      case 'templates':
        return <UnifiedTemplateManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      default:
        return <BSCourseManagement viewMode="overview" isRoundModalOpen={isRoundModalOpen} setIsRoundModalOpen={setIsRoundModalOpen} />;
    }
  };

  const getActiveTabConfig = () => {
    return availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];
  };

  // 빠른 액션은 각 하위 컴포넌트에서 자체적으로 관리

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* 통합 헤더 + 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          {/* 상단 액션 바 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
                교육 운영 관리
              </h1>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* 과정 관리 탭일 때만 새 과정 생성 버튼 표시 */}
                {activeTab === 'rounds' && (
                  <button
                    onClick={() => setIsRoundModalOpen(true)}
                    className="btn-primary flex items-center text-sm shadow-sm hover:shadow-md"
                  >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    새 과정 생성
                  </button>
                )}

                {/* 새로고침 버튼 */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center text-sm font-medium disabled:opacity-50"
                  title="새로고침"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6 px-6 overflow-x-auto" aria-label="탭">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedEducationManagement;
