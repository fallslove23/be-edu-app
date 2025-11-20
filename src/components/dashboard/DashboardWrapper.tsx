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

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ onNavigate }) => {
  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">🏠 대시보드</h1>

        {/* 차트 기반 대시보드 */}
        <EnhancedDashboard />

        {/* 빠른 액션 */}
        <div className="mt-8">
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-6">빠른 작업</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 새 과정 개설 */}
                <button
                  onClick={() => onNavigate?.('course-management')}
                  className="group relative p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                      <AcademicCapIcon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-card-foreground mb-1 text-base">새 과정 개설</h4>
                  <p className="text-sm text-muted-foreground">BS 과정 차수 생성</p>
                </button>

                {/* 교육생 등록 */}
                <button
                  onClick={() => onNavigate?.('trainees')}
                  className="group relative p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                      <UserGroupIcon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-card-foreground mb-1 text-base">교육생 등록</h4>
                  <p className="text-sm text-muted-foreground">새 교육생 추가</p>
                </button>

                {/* 출석 체크 */}
                <button
                  onClick={() => onNavigate?.('course-management')}
                  className="group relative p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                      <ChartBarIcon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-card-foreground mb-1 text-base">출석 체크</h4>
                  <p className="text-sm text-muted-foreground">오늘 출석 현황</p>
                </button>

                {/* 일정 관리 */}
                <button
                  onClick={() => onNavigate?.('schedule-management')}
                  className="group relative p-5 bg-card hover:bg-muted rounded-lg transition-all duration-200 text-left border border-border hover:border-primary hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 group-hover:scale-105 transition-all shadow-sm">
                      <CalendarDaysIcon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-card-foreground mb-1 text-base">일정 관리</h4>
                  <p className="text-sm text-muted-foreground">과정 스케줄 확인</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          BS 학습 관리 시스템 - 실시간 대시보드
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
