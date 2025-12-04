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
    <div className="min-h-screen bg-[#F2F4F6] dark:bg-gray-900 p-4 sm:p-6 pb-24 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ChartPie className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">분석 및 보고서</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{getActiveTabConfig()?.description}</p>
            </div>
          </div>

          {/* 기간 선택 드롭다운 */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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

        {/* 탭 네비게이션 - 모바일 최적화 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 콘텐츠 - 박스 제거하고 직접 렌더링 */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default IntegratedAnalyticsManagement;