'use client';

import React, { useState } from 'react';
import BSCourseManagement from './BSCourseManagement';
import AttendanceManager from '../operations/AttendanceManager';

const CourseManagementTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'templates' | 'attendance'>('overview');

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* 헤더 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">📚 과정 관리</h1>
        <p className="text-muted-foreground">BS 과정의 템플릿, 차수, 출석을 통합 관리합니다.</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="border-b border-border bg-card rounded-t-lg px-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              aria-current={activeTab === 'overview' ? 'page' : undefined}
            >
              전체 현황
            </button>
            <button
              onClick={() => setActiveTab('rounds')}
              className={`${
                activeTab === 'rounds'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              aria-current={activeTab === 'rounds' ? 'page' : undefined}
            >
              차수 관리
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`${
                activeTab === 'templates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              aria-current={activeTab === 'templates' ? 'page' : undefined}
            >
              템플릿 관리
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`${
                activeTab === 'attendance'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              aria-current={activeTab === 'attendance' ? 'page' : undefined}
            >
              출석 관리
            </button>
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'attendance' ? (
        <AttendanceManager />
      ) : (
        <BSCourseManagement viewMode={activeTab} />
      )}
    </div>
  );
};

export default CourseManagementTabs;
