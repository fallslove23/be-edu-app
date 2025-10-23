import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  action: () => void;
  description: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when user is typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement).contentEditable === 'true'
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = (shortcut.ctrlKey ?? false) === event.ctrlKey;
      const altMatch = (shortcut.altKey ?? false) === event.altKey;
      const shiftMatch = (shortcut.shiftKey ?? false) === event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Common shortcuts for the BS Learning App
export const createAppShortcuts = (onViewChange: (view: string) => void) => [
  {
    key: 'h',
    description: '대시보드로 이동',
    action: () => onViewChange('dashboard')
  },
  {
    key: 'c',
    description: '과정 관리',
    action: () => onViewChange('courses')
  },
  {
    key: 's',
    description: '교육생 관리',
    action: () => onViewChange('student-management')
  },
  {
    key: 'a',
    description: '출석 관리',
    action: () => onViewChange('attendance')
  },
  {
    key: 'e',
    description: '평가 관리',
    action: () => onViewChange('exams')
  },
  {
    key: 'r',
    description: '리포트',
    action: () => onViewChange('reports')
  },
  {
    key: 'u',
    description: '사용자 관리',
    action: () => onViewChange('users')
  },
  {
    key: '/',
    description: '검색창 포커스',
    action: () => {
      const searchInput = document.querySelector('input[placeholder*="검색"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  },
  {
    key: 'Escape',
    description: '검색 초기화/모달 닫기',
    action: () => {
      // Clear search inputs
      const searchInputs = document.querySelectorAll('input[placeholder*="검색"]') as NodeListOf<HTMLInputElement>;
      searchInputs.forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      // Close modals (basic implementation)
      const closeButtons = document.querySelectorAll('[aria-label*="닫기"], [aria-label*="close"]') as NodeListOf<HTMLElement>;
      if (closeButtons.length > 0) {
        closeButtons[0].click();
      }
    }
  }
];

export const useAppKeyboardShortcuts = (onViewChange: (view: string) => void) => {
  const shortcuts = createAppShortcuts(onViewChange);
  useKeyboardShortcuts(shortcuts);
  return shortcuts;
};