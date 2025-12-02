'use client';

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
import { PageContainer } from '../common/PageContainer';

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
          { label: '성과 리포트 생성', action: () => { }, primary: true },
          { label: '대시보드 설정', action: () => { }, primary: false }
        ];
      case 'analytics':
        return [
          { label: '새 분석', action: () => { }, primary: true },
          { label: '분석 템플릿', action: () => { }, primary: false }
        ];
      case 'reports':
        return [
          { label: '보고서 생성', action: () => { }, primary: true },
          { label: '스케줄 설정', action: () => { }, primary: false }
        ];
      default:
        return [];
    }
  };

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">분석 및 보고서</h1>
              <p className="text-sm text-gray-600 mt-1">{getActiveTabConfig()?.description}</p>
            </div>
          </div>

          {/* 모바일 최적화된 필터 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="3months">최근 3개월</option>
              <option value="6months">최근 6개월</option>
              <option value="1year">최근 1년</option>
            </select>

            <button
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              <ArrowDownTrayIcon className="h-4 w-4 inline mr-1.5" />
              리포트 생성
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex px-4 sm:px-6" aria-label="탭">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
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
    </PageContainer>
  );
};

export default IntegratedAnalyticsManagement;