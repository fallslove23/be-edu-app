import React, { useState } from 'react';
import { 
  ChartBarIcon,
  PresentationChartLineIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import PerformanceTracking from '../performance/PerformanceTracking';
import AdvancedAnalytics from './AdvancedAnalytics';
import { ReportGenerator } from '../reports';

type TabType = 'performance' | 'analytics' | 'reports';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  roles: string[];
}

const tabs: TabConfig[] = [
  {
    id: 'performance',
    label: '성과 분석',
    icon: ChartBarIcon,
    description: '교육생 성과 추적 및 리포팅',
    roles: ['admin', 'manager', 'operator', 'instructor']
  },
  {
    id: 'analytics',
    label: '고급 분석',
    icon: PresentationChartLineIcon,
    description: '상세 데이터 분석 및 시각화',
    roles: ['admin', 'manager']
  },
  {
    id: 'reports',
    label: '보고서 생성',
    icon: DocumentArrowDownIcon,
    description: '맞춤형 보고서 생성 및 내보내기',
    roles: ['admin', 'manager', 'operator', 'instructor']
  }
];

interface IntegratedAnalyticsManagementProps {
  userRole?: string;
}

const IntegratedAnalyticsManagement: React.FC<IntegratedAnalyticsManagementProps> = ({ 
  userRole = 'admin' 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7days');

  // 사용자 권한에 따라 접근 가능한 탭 필터링
  const availableTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return <PerformanceTracking />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'reports':
        return <ReportGenerator />;
      default:
        return <PerformanceTracking />;
    }
  };

  const getActiveTabConfig = () => {
    return availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];
  };

  const getQuickActions = () => {
    switch (activeTab) {
      case 'performance':
        return [
          { label: '성과 리포트 생성', action: () => {}, primary: true },
          { label: '대시보드 설정', action: () => {}, primary: false }
        ];
      case 'analytics':
        return [
          { label: '새 분석', action: () => {}, primary: true },
          { label: '분석 템플릿', action: () => {}, primary: false }
        ];
      case 'reports':
        return [
          { label: '보고서 생성', action: () => {}, primary: true },
          { label: '스케줄 설정', action: () => {}, primary: false }
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
              <h1 className="text-2xl font-bold text-gray-900">분석 및 보고서</h1>
              <p className="text-gray-600">{getActiveTabConfig()?.description}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* 기간 선택 */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7days">최근 7일</option>
                <option value="30days">최근 30일</option>
                <option value="3months">최근 3개월</option>
                <option value="6months">최근 6개월</option>
                <option value="1year">최근 1년</option>
                <option value="custom">사용자 지정</option>
              </select>

              {/* 통합 검색 */}
              <div className="relative w-full sm:w-96">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="교육생, 과정, 지표명으로 검색..."
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
                    className={`px-4 py-2 rounded-full transition-colors flex items-center text-sm font-medium ${
                      action.primary
                        ? 'btn-primary'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {action.primary && action.label.includes('생성') && <ArrowDownTrayIcon className="h-4 w-4 mr-2" />}
                    {action.primary && !action.label.includes('생성') && <PresentationChartLineIcon className="h-4 w-4 mr-2" />}
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

        {/* 분석 통계 대시보드 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 분석 건수</p>
                <p className="text-2xl font-semibold text-gray-900">1,248</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <PresentationChartLineIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 대시보드</p>
                <p className="text-2xl font-semibold text-gray-900">15개</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">생성된 보고서</p>
                <p className="text-2xl font-semibold text-gray-900">89개</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FunnelIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 처리시간</p>
                <p className="text-2xl font-semibold text-gray-900">2.3초</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedAnalyticsManagement;