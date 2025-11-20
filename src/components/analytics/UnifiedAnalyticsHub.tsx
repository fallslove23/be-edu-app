import React, { useState } from 'react';
import {
  DocumentChartBarIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// 기존 컴포넌트들 import
import IntegratedAnalyticsDashboard from '../reports/IntegratedAnalyticsDashboard';
import StudentReportsContent from '../reports/StudentReportsContent';
import PerformanceTracking from '../performance/PerformanceTracking';
import AdvancedAnalytics from './AdvancedAnalytics';
import PersonalAnalytics from './PersonalAnalytics';

/**
 * 통합 분석 허브
 * 모든 분석 및 보고서 기능을 하나의 페이지에서 탭으로 제공
 */
const UnifiedAnalyticsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'performance' | 'advanced' | 'personal'>('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: '통합 대시보드',
      icon: DocumentChartBarIcon,
      description: '전체 통계 및 과정별/교육생별/부서별 분석'
    },
    {
      id: 'reports',
      label: '교육생 리포트',
      icon: UserGroupIcon,
      description: '교육생 개별 성과 및 이수 현황'
    },
    {
      id: 'performance',
      label: '기본 성과 추적',
      icon: ChartBarIcon,
      description: '일별 진도 및 출석 현황'
    },
    {
      id: 'advanced',
      label: '고급 분석',
      icon: MagnifyingGlassCircleIcon,
      description: '실시간 데이터 및 상세 분석'
    },
    {
      id: 'personal',
      label: '개인 분석',
      icon: UserIcon,
      description: '개별 학습자 심층 분석'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          📊 분석 및 보고서
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          교육 성과 분석, 통계, 리포트를 한 곳에서 확인하세요
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium bg-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 내용 */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <IntegratedAnalyticsDashboard />}
        {activeTab === 'reports' && <StudentReportsContent />}
        {activeTab === 'performance' && <PerformanceTracking />}
        {activeTab === 'advanced' && <AdvancedAnalytics />}
        {activeTab === 'personal' && <PersonalAnalytics />}
      </div>
    </div>
  );
};

export default UnifiedAnalyticsHub;
