import React from 'react';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  const getThemeIcon = (themeMode: string) => {
    switch (themeMode) {
      case 'light':
        return <SunIcon className="h-4 w-4" />;
      case 'dark':
        return <MoonIcon className="h-4 w-4" />;
      case 'auto':
        return <ComputerDesktopIcon className="h-4 w-4" />;
      default:
        return <SunIcon className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeMode: string) => {
    switch (themeMode) {
      case 'light':
        return '라이트';
      case 'dark':
        return '다크';
      case 'auto':
        return '시스템';
      default:
        return '라이트';
    }
  };

  return (
    <div className="relative">
      {/* 간단한 토글 버튼 */}
      <button
        onClick={toggleTheme}
        className={`
          p-2 rounded-full transition-colors duration-200 
          ${actualTheme === 'dark'
            ? 'bg-secondary text-yellow-400 hover:bg-secondary/80'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }
        `}
        title={`현재: ${getThemeLabel(theme)} (${actualTheme === 'dark' ? '다크' : '라이트'})`}
      >
        {getThemeIcon(theme)}
      </button>
    </div>
  );
};

export const ThemeSelector: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();

  return (
    <div className={`
      bg-popover border border-border 
      rounded-full shadow-lg p-4 space-y-3
    `}>
      <h3 className="text-sm font-medium text-foreground mb-3">
        테마 설정
      </h3>

      <div className="space-y-2">
        {[
          { key: 'light', label: '라이트 모드', icon: SunIcon },
          { key: 'dark', label: '다크 모드', icon: MoonIcon },
          { key: 'auto', label: '시스템 설정', icon: ComputerDesktopIcon }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTheme(key as any)}
            className={`
              w-full flex items-center space-x-3 p-2 rounded-full text-left transition-colors
              ${theme === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
            {theme === key && (
              <span className={`
                ml-auto text-xs px-2 py-1 rounded-full
                ml-auto text-xs px-2 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground
              `}>
                활성
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`
        mt-3 pt-3 border-t text-xs 
        mt-3 pt-3 border-t border-border text-xs text-muted-foreground
      `}>
        현재 적용된 테마: <span className="font-medium">
          {actualTheme === 'dark' ? '다크' : '라이트'}
        </span>
        {theme === 'auto' && (
          <span className="block mt-1">시스템 설정에 따라 자동 변경됩니다.</span>
        )}
      </div>
    </div>
  );
};

export default ThemeToggle;