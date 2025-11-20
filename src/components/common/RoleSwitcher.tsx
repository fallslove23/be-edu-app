import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/auth.types';
import { ShieldCheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const roleLabels: Record<UserRole, string> = {
  admin: '관리자',
  manager: '조직장',
  operator: '운영',
  instructor: '강사',
  trainee: '교육생'
};

const roleDescriptions: Record<UserRole, string> = {
  admin: '시스템 전체 관리',
  manager: '조직 및 인사 관리',
  operator: '교육 운영 관리',
  instructor: '교육 및 평가',
  trainee: '수강 및 학습'
};

const availableRoles: UserRole[] = ['admin', 'manager', 'operator', 'instructor', 'trainee'];

const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors mobile-button-enhanced touch-target-improved"
      >
        <ShieldCheckIcon className="h-4 w-4 icon-neutral" />
        <span>{roleLabels[user.role]}</span>
        <ChevronDownIcon className="h-3 w-3 icon-neutral-light" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {availableRoles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors mobile-button-enhanced touch-target-improved ${
                  user.role === role ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className={`h-4 w-4 ${user.role === role ? 'text-blue-600' : 'icon-neutral'}`} />
                  <div>
                    <div className="font-medium">{roleLabels[role]}</div>
                    <div className="text-xs text-gray-500">{roleDescriptions[role]}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 오버레이 - 드롭다운 외부 클릭 시 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher;