'use client';

import React from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import EnhancedDashboard from './EnhancedDashboard';

interface DashboardWrapperProps {
  onNavigate?: (view: string) => void;
}

import { PageContainer } from '../common/PageContainer';

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ onNavigate }) => {
  return (
    <PageContainer>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">🏠 대시보드</h1>

      {/* 차트 기반 대시보드 */}
      <EnhancedDashboard />

      {/* 빠른 액션 */}
      <div className="mt-6 sm:mt-8">
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4 sm:mb-6">빠른 작업</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:pb-0 snap-x snap-mandatory">
              {/* 새 과정 개설 */}
              <button
                onClick={() => onNavigate?.('course-management')}
                className="group relative p-3 sm:p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg mobile-button touch-manipulation min-w-[160px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                    <AcademicCapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="font-semibold text-card-foreground mb-1 text-sm sm:text-base">새 과정 개설</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">BS 과정 차수 생성</p>
              </button>

              {/* 교육생 등록 */}
              <button
                onClick={() => onNavigate?.('trainees')}
                className="group relative p-3 sm:p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg mobile-button touch-manipulation min-w-[160px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                    <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="font-semibold text-card-foreground mb-1 text-sm sm:text-base">교육생 등록</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">새 교육생 추가</p>
              </button>

              {/* 출석 체크 */}
              <button
                onClick={() => onNavigate?.('course-management')}
                className="group relative p-3 sm:p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg mobile-button touch-manipulation min-w-[160px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                    <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="font-semibold text-card-foreground mb-1 text-sm sm:text-base">출석 체크</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">오늘 출석 현황</p>
              </button>

              {/* 일정 관리 */}
              <button
                onClick={() => onNavigate?.('schedule-management')}
                className="group relative p-3 sm:p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg mobile-button touch-manipulation min-w-[160px] sm:min-w-0 snap-start flex-shrink-0"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                    <CalendarDaysIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>
                <h4 className="font-semibold text-card-foreground mb-1 text-sm sm:text-base">일정 관리</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">과정 스케줄 확인</p>
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
