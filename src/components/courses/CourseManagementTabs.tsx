'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import BSCourseManagement from './BSCourseManagement';
import AttendanceManager from '../operations/AttendanceManager';

import { PageContainer } from '../common/PageContainer';

const CourseManagementTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'templates' | 'attendance'>('overview');

  return (
    <PageContainer>
      {/* 헤더 */}
      {/* 헤더 */}
      <div className="relative mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                  Education Management
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                과정 관리
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                BS 과정의 템플릿, 차수, 출석을 통합 관리합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

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
