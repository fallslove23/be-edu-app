'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  FileText,
  Calendar,
  Download,
  ChartPie,
  Info,
  Database,
  RefreshCw
} from 'lucide-react';
import PerformanceTracking from '../performance/PerformanceTracking';
import AdvancedAnalytics from './AdvancedAnalytics';
import { ReportGenerator } from '../reports';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import { AnalyticsService } from '../../services/analytics.service';

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
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'mock'>('loading');
  const [stats, setStats] = useState<any>(null);

  // 데이터 상태 확인
  useEffect(() => {
    checkDataAvailability();
  }, []);

  const checkDataAvailability = async () => {
    try {
      setDataStatus('loading');

      // AnalyticsService로 실제 데이터 확인
      const [summary, coursePerf] = await Promise.all([
        AnalyticsService.getSummary().catch(() => null),
        AnalyticsService.getCoursePerformance().catch(() => [])
      ]);

      if (summary && (summary.total_students > 0 || coursePerf.length > 0)) {
        setDataStatus('ready');
        setStats(summary);
      } else {
        setDataStatus('mock');
      }
    } catch (error) {
      console.error('데이터 확인 실패:', error);
      setDataStatus('mock');
    }
  };

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

        {/* 데이터 상태 배너 */}
        {dataStatus === 'ready' && stats && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
                실시간 데이터 연동 중
              </h3>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                총 {stats.total_students}명의 교육생, {stats.active_courses}개 과정 데이터 표시 중
              </p>
            </div>
            <button
              onClick={checkDataAvailability}
              className="flex-shrink-0 p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
          </div>
        )}

        {dataStatus === 'mock' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                샘플 데이터 표시 중
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                실제 교육생 데이터가 입력되면 자동으로 실시간 데이터로 전환됩니다
              </p>
            </div>
            <button
              onClick={checkDataAvailability}
              className="flex-shrink-0 p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="다시 확인"
            >
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        )}

        {dataStatus === 'loading' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">데이터 확인 중...</p>
          </div>
        )}

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