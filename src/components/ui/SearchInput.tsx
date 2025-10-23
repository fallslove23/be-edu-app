import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * 공통 SearchInput 컴포넌트
 * 검색 기능이 있는 입력 필드
 */

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * 검색어
   */
  value: string;
  /**
   * 검색어 변경 핸들러
   */
  onValueChange: (value: string) => void;
  /**
   * 검색어 초기화 핸들러
   */
  onClear?: () => void;
  /**
   * 크기
   */
  size?: 'sm' | 'md' | 'lg';
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      onClear,
      size = 'md',
      placeholder = '검색...',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm pl-9',
      md: 'px-4 py-2.5 text-sm pl-10',
      lg: 'px-5 py-3 text-base pl-12',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`${iconSizes[size]} text-gray-400`} />
        </div>

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={`
            block w-full rounded-lg border border-gray-300
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-all duration-200
            ${sizeClasses[size]}
            ${value ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onValueChange('');
              onClear?.();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className={iconSizes[size]} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
