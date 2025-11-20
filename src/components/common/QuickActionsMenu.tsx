import React, { useState, useRef, useEffect } from 'react';
import {
  EllipsisVerticalIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  BookOpenIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  external?: boolean;
}

interface QuickActionsMenuProps {
  roundId?: string;
  templateId?: string;
  sessionId?: string;
  actions?: QuickAction[];
  className?: string;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  roundId,
  templateId,
  sessionId,
  actions,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 기본 액션 목록 생성
  const defaultActions: QuickAction[] = [];

  if (roundId) {
    defaultActions.push({
      label: '차수 관리',
      href: `/courses?roundId=${roundId}`,
      icon: <AcademicCapIcon className="w-5 h-5" />,
      description: '차수 정보 및 설정'
    });
  }

  if (templateId) {
    defaultActions.push({
      label: '커리큘럼 보기',
      href: `/courses/templates/${templateId}`,
      icon: <BookOpenIcon className="w-5 h-5" />,
      description: '과정 커리큘럼 확인'
    });
  }

  if (roundId) {
    defaultActions.push({
      label: '수강생 관리',
      href: `/trainees?round=${roundId}`,
      icon: <UserGroupIcon className="w-5 h-5" />,
      description: '수강생 목록 및 관리'
    });
  }

  if (sessionId) {
    defaultActions.push({
      label: '출석 체크',
      href: `/attendance/${sessionId}`,
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      description: '출석 현황 관리'
    });
  }

  if (sessionId) {
    defaultActions.push({
      label: '세션 상세',
      href: `/sessions/${sessionId}`,
      icon: <ClockIcon className="w-5 h-5" />,
      description: '세션 정보 확인'
    });
  }

  const finalActions = actions || defaultActions;

  if (finalActions.length === 0) {
    return null;
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        aria-label="Quick actions"
        aria-expanded={isOpen}
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground">빠른 작업</p>
          </div>

          <div className="py-1">
            {finalActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 px-3 py-2 hover:bg-accent/10 transition-colors group"
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
              >
                <div className="flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    {action.external && (
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                  {action.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionsMenu;
