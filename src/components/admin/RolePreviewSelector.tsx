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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-4">
          <div className="max-w-7xl mx-auto">
            {/* 미리보기 헤더 */}
            <div className="bg-amber-500 text-white px-6 py-3 rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-lg">
              <div className="flex items-center gap-3">
                <EyeIcon className="h-5 w-5" />
                <span className="font-semibold">미리보기: 교육생 대시보드</span>
              </div>
              <button
                onClick={() => setPreviewRole(null)}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 교육생 대시보드 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-b-2xl p-6">
              <TraineeDashboard traineeId={user.id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (previewRole === 'instructor') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen p-4">
          <div className="max-w-7xl mx-auto">
            {/* 미리보기 헤더 */}
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-lg">
              <div className="flex items-center gap-3">
                <EyeIcon className="h-5 w-5" />
                <span className="font-semibold">미리보기: 강사 대시보드</span>
              </div>
              <button
                onClick={() => setPreviewRole(null)}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>

            {/* 강사 대시보드 (추후 구현) */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-b-2xl p-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  강사 대시보드
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Phase 2에서 구현 예정입니다.
                </p>
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
