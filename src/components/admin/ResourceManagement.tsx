'use client';

import React, { useState } from 'react';
import { CategoryManagement } from './CategoryManagement';
import { ClassroomManagement } from './ClassroomManagement';

export default function ResourceManagementPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'classrooms'>('categories');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-card border-b border-border p-6">
          <h1 className="text-3xl font-bold text-card-foreground">자원 관리</h1>
          <p className="text-muted-foreground mt-2">
            과정 운영에 필요한 카테고리와 강의실을 관리합니다.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-card border-b border-border">
          <div className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              카테고리 관리
            </button>
            <button
              onClick={() => setActiveTab('classrooms')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'classrooms'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              강의실 관리
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-background">
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'classrooms' && <ClassroomManagement />}
        </div>
      </div>
    </div>
  );
}
