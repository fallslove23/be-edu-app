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
      {/* Page Header */}
      <div className="bg-card border-b border-border p-6">
        <h1 className="text-3xl font-bold text-card-foreground">🎯 통합 자원 관리</h1>
        <p className="text-muted-foreground mt-2">
          과정 운영에 필요한 모든 자원을 한 곳에서 관리합니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">카테고리: 과정 분류 체계</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">과목: 교육 내용</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-muted-foreground">강사: 교육 담당자</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-muted-foreground">강의실: 교육 공간</span>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-card border-b border-border">
        <div className="flex gap-2 p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
      <div className="bg-background">
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'instructors' && <InstructorManagement />}
        {activeTab === 'classrooms' && <ClassroomManagement />}
      </div>
    </PageContainer>
  );
}
