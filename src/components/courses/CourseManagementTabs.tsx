'use client';

import React, { useState } from 'react';
import { BookOpen, Book } from 'lucide-react';
import BSCourseManagement from './BSCourseManagement';
import AttendanceManager from '../operations/AttendanceManager';

import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';

const CourseManagementTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'templates' | 'attendance'>('overview');

  return (
    <PageContainer>
      {/* 헤더 */}
      {/* 헤더 */}
      <PageHeader
        title="과정 관리"
        description="BS 과정의 템플릿, 차수 및 출석을 통합 관리합니다."
        badge="Education Management"
      />

      {/* 탭 네비게이션 */}
      <div className="mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl inline-flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'overview'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
              }`}
          >
            전체 현황
          </button>
          <button
            onClick={() => setActiveTab('rounds')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'rounds'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
              }`}
          >
            차수 관리
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'templates'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
              }`}
          >
            템플릿 관리
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'attendance'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
              }`}
          >
            출석 관리
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'attendance' ? (
        <AttendanceManager />
      ) : (
        <BSCourseManagement viewMode={activeTab} />
      )}
    </PageContainer>
  );
};

export default CourseManagementTabs;
