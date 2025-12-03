'use client';

import React, { useState } from 'react';
import {
  UserIcon,
  AcademicCapIcon,
  UserGroupIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import TraineeDashboard from '../trainee/TraineeDashboard';
import { useAuth } from '../../contexts/AuthContext';

interface RolePreviewSelectorProps {
  onClose?: () => void;
}

const RolePreviewSelector: React.FC<RolePreviewSelectorProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [previewRole, setPreviewRole] = useState<'trainee' | 'instructor' | null>(null);

  // 관리자가 아니면 이 컴포넌트를 보여주지 않음
  if (!user || !['admin', 'manager'].includes(user.role)) {
    return null;
  }

  const roles = [
    {
      id: 'trainee' as const,
      name: '교육생 대시보드',
      icon: UserIcon,
      color: 'indigo',
      description: '교육생이 보는 화면'
    },
    {
      id: 'instructor' as const,
      name: '강사 대시보드',
      icon: AcademicCapIcon,
      color: 'emerald',
      description: '강사가 보는 화면'
    }
  ];

  if (previewRole === 'trainee') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            {/* 미리보기 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">교육생 대시보드 미리보기</span>
                  <p className="text-xs text-white/80 hidden sm:block">관리자 모드에서 교육생 화면 확인</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewRole(null)}
                className="px-3 sm:px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 교육생 대시보드 */}
            <div className="bg-background rounded-b-xl sm:rounded-b-2xl shadow-2xl">
              <TraineeDashboard traineeId={user.id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (previewRole === 'instructor') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-2 sm:p-4">
          <div className="max-w-7xl mx-auto">
            {/* 미리보기 헤더 */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-3 rounded-t-xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <span className="font-semibold text-sm sm:text-base">강사 대시보드 미리보기</span>
                  <p className="text-xs text-white/80 hidden sm:block">관리자 모드에서 강사 화면 확인</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewRole(null)}
                className="px-3 sm:px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 강사 대시보드 (추후 구현) */}
            <div className="bg-background rounded-b-xl sm:rounded-b-2xl shadow-2xl p-6 sm:p-12">
              <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-card-foreground mb-3">
                  강사 대시보드
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  강사 전용 대시보드는 Phase 2에서 구현 예정입니다.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  개발 예정
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">미리보기:</span>
      {roles.map((role) => {
        const Icon = role.icon;
        const colorClasses = {
          indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800',
          emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
        };

        return (
          <button
            key={role.id}
            onClick={() => setPreviewRole(role.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200 text-xs font-medium ${colorClasses[role.color as keyof typeof colorClasses]}`}
            title={role.description}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{role.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RolePreviewSelector;
