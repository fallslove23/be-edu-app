/**
 * 재사용 가능한 Select 컴포넌트
 *
 * 일관된 스타일과 기능을 제공하는 드롭다운 컴포넌트
 */

import React from 'react';
import { DropdownOption } from '@/config/dropdown-options';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helpText?: string;
  showIcons?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = '선택하세요',
  disabled = false,
  required = false,
  error,
  helpText,
  showIcons = true,
  showDescriptions = false,
  className = ''
}) => {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 라벨 */}
      {label && (
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3.5
            border border-gray-200 dark:border-gray-600
            rounded-2xl
            bg-gray-50 dark:bg-gray-700
            text-gray-900 dark:text-white
            font-medium
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-all
            shadow-sm hover:shadow-md
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {showIcons && option.icon ? `${option.icon} ` : ''}
              {option.label}
            </option>
          ))}
        </select>

        {/* 선택된 옵션 아이콘 표시 (왼쪽) */}
        {showIcons && selectedOption?.icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {selectedOption.icon}
          </span>
        )}
      </div>

      {/* 선택된 옵션 설명 */}
      {showDescriptions && selectedOption?.description && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {selectedOption.description}
        </p>
      )}

      {/* 도움말 */}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
