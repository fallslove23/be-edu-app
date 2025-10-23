import React from 'react';
import {
  PlusIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onClick: () => void;
  roles: string[];
}

interface QuickActionsProps {
  onViewChange: (viewId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onViewChange }) => {
  const { user } = useAuth();

  if (!user) return null;

  const quickActions: QuickAction[] = [
    {
      id: 'new-course',
      label: '새 과정 생성',
      icon: PlusIcon,
      description: '새로운 교육 과정을 빠르게 생성합니다',
      onClick: () => onViewChange('courses'),
      roles: ['admin', 'manager', 'operator', 'instructor']
    },
    {
      id: 'student-register',
      label: '교육생 등록',
      icon: UserGroupIcon,
      description: '새로운 교육생을 등록합니다',
      onClick: () => onViewChange('trainees'),
      roles: ['admin', 'manager', 'operator', 'instructor']
    },
    {
      id: 'attendance-today',
      label: '오늘 출석체크',
      icon: ClipboardDocumentCheckIcon,
      description: '오늘 진행되는 강의의 출석을 체크합니다',
      onClick: () => onViewChange('attendance'),
      roles: ['admin', 'manager', 'operator', 'instructor']
    },
    {
      id: 'schedule-view',
      label: '일정 확인',
      icon: CalendarDaysIcon,
      description: '오늘과 이번 주 강의 일정을 확인합니다',
      onClick: () => onViewChange('schedule'),
      roles: ['admin', 'manager', 'operator', 'instructor', 'trainee']
    },
    {
      id: 'reports-quick',
      label: '빠른 리포트',
      icon: ChartBarIcon,
      description: '출석률 및 성과 리포트를 빠르게 생성합니다',
      onClick: () => onViewChange('reports'),
      roles: ['admin', 'manager', 'operator']
    },
    {
      id: 'exam-create',
      label: '평가 생성',
      icon: DocumentDuplicateIcon,
      description: '새로운 시험이나 평가를 생성합니다',
      onClick: () => onViewChange('exams'),
      roles: ['admin', 'manager', 'operator', 'instructor']
    }
  ];

  // Filter actions based on user role
  const availableActions = quickActions.filter(action => 
    action.roles.includes(user.role)
  );

  // Don't show if no actions available
  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        빠른 작업
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {availableActions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
            title={action.description}
          >
            <action.icon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
            <span className="text-xs text-center text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-medium">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;