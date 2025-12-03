'use client';

import React from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import EnhancedDashboard from './EnhancedDashboard';
import RolePreviewSelector from '../admin/RolePreviewSelector';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardWrapperProps {
  onNavigate?: (view: string) => void;
}

import { PageContainer } from '../common/PageContainer';

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'manager'].includes(user.role);

  return (
    <PageContainer>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">🏠 대시보드</h1>

      {/* 관리자 전용: 역할별 대시보드 미리보기 */}
      {isAdmin && (
        <div className="mb-6 sm:mb-8">
          <RolePreviewSelector />
        </div>
      )}

      {/* 차트 기반 대시보드 */}
      <EnhancedDashboard />

      {/* 빠른 액션 */}
      <div className="mt-6 sm:mt-8">
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4 sm:mb-6">빠른 작업</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0 snap-x snap-mandatory scroll-touch hide-scrollbar">
              {/* 새 과정 개설 */}
              <button
                onClick={() => onNavigate?.('course-management')}
                className="group relative p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-300 text-left border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/10 min-w-[200px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <AcademicCapIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-base">새 과정 개설</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">BS 과정 차수 생성</p>
              </button>

              {/* 교육생 등록 */}
              <button
                onClick={() => onNavigate?.('trainees')}
                className="group relative p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-300 text-left border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg hover:shadow-blue-500/10 min-w-[200px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-base">교육생 등록</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">새 교육생 추가</p>
              </button>

              {/* 출석 체크 */}
              <button
                onClick={() => onNavigate?.('course-management')}
                className="group relative p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-300 text-left border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-500/10 min-w-[200px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ChartBarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-base">출석 체크</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">오늘 출석 현황</p>
              </button>

              {/* 일정 관리 */}
              <button
                onClick={() => onNavigate?.('schedule-management')}
                className="group relative p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-300 text-left border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg hover:shadow-purple-500/10 min-w-[200px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CalendarDaysIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 text-base">일정 관리</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">과정 스케줄 확인</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground pb-4">
        BS 학습 관리 시스템 - 실시간 대시보드
      </div>
    </PageContainer>
  );
};

export default DashboardWrapper;
