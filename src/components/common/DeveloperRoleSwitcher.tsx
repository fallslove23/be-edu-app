'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth.types';
import {
  UserCircleIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { roleLabels } from '@/types/auth.types';

/**
 * DeveloperRoleSwitcher
 *
 * 개발자용 역할 전환 UI 컴포넌트
 * - 관리자/조직장만 표시됨
 * - 모든 역할(교육생, 강사, 관리자 등)로 전환 가능
 * - sessionStorage에 원본 역할 저장 (브라우저 닫으면 초기화)
 * - 시각적 인디케이터로 전환 모드 표시
 * - 최소화 가능한 플로팅 UI
 */
export default function DeveloperRoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [originalRole, setOriginalRole] = useState<UserRole | null>(null);
  const [isSwitched, setIsSwitched] = useState(false);

  // 컴포넌트 마운트 시 원본 역할 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = sessionStorage.getItem('developerOriginalRole');
    if (saved) {
      setOriginalRole(saved as UserRole);
      setIsSwitched(true);
    } else if (user?.role) {
      // 최초 로드 시 현재 역할을 원본으로 저장
      sessionStorage.setItem('developerOriginalRole', user.role);
      setOriginalRole(user.role);
    }
  }, [user?.role]);

  // 원본 역할이 관리자/조직장인 경우에만 표시 (전환 후에도 계속 표시)
  if (!user || !originalRole || (originalRole !== 'admin' && originalRole !== 'manager')) {
    return null;
  }

  const availableRoles: UserRole[] = ['trainee', 'instructor', 'operator', 'manager', 'admin'];

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setIsSwitched(role !== originalRole);
    setIsOpen(false);
  };

  const handleReset = () => {
    if (originalRole) {
      switchRole(originalRole);
      setIsSwitched(false);
    }
  };

  const handleMinimize = () => {
    setIsOpen(false); // 드롭다운 닫기
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    setIsOpen(false); // 복원 시 드롭다운 닫은 상태로
  };

  // 최소화된 상태
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={handleMaximize}
          className={`p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${
            isSwitched
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
          }`}
          title="개발자 도구 열기"
          aria-label="개발자 도구 열기"
        >
          <UserCircleIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 transition-all ${
        isSwitched
          ? 'border-orange-500 dark:border-orange-600'
          : 'border-purple-500 dark:border-purple-600'
      }`}>
        {/* Header */}
        <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${
          isSwitched
            ? 'bg-gradient-to-r from-orange-500 to-red-500'
            : 'bg-gradient-to-r from-purple-500 to-blue-500'
        }`}>
          <div className="flex items-center gap-2">
            <UserCircleIcon className="w-5 h-5 text-white" />
            <span className="text-sm font-bold text-white">개발자 도구</span>
            {isSwitched && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                전환 모드
              </span>
            )}
          </div>
          <button
            onClick={handleMinimize}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            title="최소화"
            aria-label="최소화"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 min-w-[280px]">
          {/* Current Role Display */}
          <div className="mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">현재 역할</div>
            <div className={`px-3 py-2 rounded-lg font-medium flex items-center justify-between ${
              isSwitched
                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
                : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400'
            }`}>
              <span>{roleLabels[user.role]}</span>
              {isSwitched && originalRole && (
                <span className="text-xs opacity-70">(원본: {roleLabels[originalRole]})</span>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="relative mb-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium">역할 전환</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-[300px] overflow-y-auto">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      user.role === role
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{roleLabels[role]}</span>
                      {user.role === role && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">●</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Button */}
          {isSwitched && originalRole && (
            <button
              onClick={handleReset}
              className="w-full px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              원래 역할로 되돌리기
            </button>
          )}

          {/* Info */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              💡 브라우저를 닫으면 원래 역할로 자동 복구됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
