import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Select } from './Select';
import { SearchInput } from './SearchInput';

/**
 * 공통 FilterGroup 컴포넌트
 * 검색 + 필터를 그룹화한 컴포넌트
 */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  name: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterGroupProps {
  /**
   * 검색어
   */
  searchValue?: string;
  /**
   * 검색어 변경 핸들러
   */
  onSearchChange?: (value: string) => void;
  /**
   * 검색 placeholder
   */
  searchPlaceholder?: string;
  /**
   * 필터 설정
   */
  filters?: FilterConfig[];
  /**
   * 추가 액션 버튼
   */
  actions?: React.ReactNode;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = '검색...',
  filters = [],
  actions,
}) => {
  const showSearch = onSearchChange !== undefined;
  const showFilters = filters.length > 0;

  if (!showSearch && !showFilters && !actions) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-700">필터 및 검색</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 검색 입력 */}
        {showSearch && (
          <div className="lg:col-span-2">
            <SearchInput
              value={searchValue}
              onValueChange={onSearchChange}
              placeholder={searchPlaceholder}
              size="md"
            />
          </div>
        )}

        {/* 필터 선택 */}
        {showFilters &&
          filters.map((filter) => (
            <div key={filter.name}>
              <Select
                label={filter.label}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                options={filter.options}
                size="md"
              />
            </div>
          ))}

        {/* 추가 액션 */}
        {actions && (
          <div className="flex items-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
