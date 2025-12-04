'use client';

import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  FileText,
  Calendar,
  Download,
  ChartPie
} from 'lucide-react';
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
    label: '성적 분석',
    icon: BarChart2,
    description: '교육생 성적 및 학습 성과 분석',
    roles: ['admin', 'manager', 'operator', 'instructor']
  },
  {
    id: 'analytics',
    label: '고급 분석',
    icon: TrendingUp,
    description: '데이터 트렌드 및 통계 분석',
    roles: ['admin', 'manager']
  },
  {
    id: 'reports',
    label: '보고서 생성',
    icon: FileText,
    description: '기간별 리포트 작성 및 내보내기',
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
      <div className="space-y-6">
        {/* 헤더 */}
        <PageHeader
          title="분석 및 보고서"
          description={getActiveTabConfig()?.description || '데이터 기반의 의사결정을 위한 분석 도구'}
          badge="Analytics & Reports"
        />

        {/* 탭 네비게이션 및 필터 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl w-full md:w-auto overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${isActive
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 기간 선택 드롭다운 */}
          <div className="relative w-full md:w-auto">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full md:w-48 appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="3months">최근 3개월</option>
              <option value="6months">최근 6개월</option>
              <option value="1year">최근 1년</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </PageContainer>
  );
};

export default IntegratedAnalyticsManagement;