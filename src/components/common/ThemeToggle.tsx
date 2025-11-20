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
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
      rounded-full shadow-lg p-4 space-y-3
    `}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
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
                ? `${actualTheme === 'dark' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`
                : `${actualTheme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{label}</span>
            {theme === key && (
              <span className={`
                ml-auto text-xs px-2 py-1 rounded-full
                ${actualTheme === 'dark' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-200 text-blue-800'
                }
              `}>
                활성
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`
        mt-3 pt-3 border-t text-xs 
        ${actualTheme === 'dark' 
          ? 'border-gray-700 text-gray-400' 
          : 'border-gray-200 text-gray-500'
        }
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