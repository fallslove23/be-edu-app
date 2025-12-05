'use client';

import React, { useState } from 'react';
import { CategoryManagement } from './CategoryManagement';
import { SubjectManagement } from './SubjectManagement';
import { InstructorManagement } from './InstructorManagement';
import { ClassroomManagement } from './ClassroomManagement';
import {
  FolderIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';

type TabType = 'categories' | 'subjects' | 'instructors' | 'classrooms';

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

  const tabs = [
    { id: 'categories' as TabType, label: '카테고리', icon: FolderIcon },
    { id: 'subjects' as TabType, label: '과목', icon: AcademicCapIcon },
    { id: 'instructors' as TabType, label: '강사', icon: UserGroupIcon },
    { id: 'classrooms' as TabType, label: '강의실', icon: BuildingOfficeIcon },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🎯 통합 자원 관리</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            과정 운영에 필요한 모든 자원을 한 곳에서 관리합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">카테고리: 과정 분류 체계</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">과목: 교육 내용</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">강사: 교육 담당자</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">강의실: 교육 공간</span>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'subjects' && <SubjectManagement />}
          {activeTab === 'instructors' && <InstructorManagement />}
          {activeTab === 'classrooms' && <ClassroomManagement />}
        </div>
      </div>
    </PageContainer>
  );
}
