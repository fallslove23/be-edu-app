import React, { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TagIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export interface SearchFilter {
  id: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'date' | 'daterange' | 'boolean';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  defaultValue?: any;
}

export interface SearchQuery {
  searchText: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  filters: SearchFilter[];
  onSearch: (query: SearchQuery) => void;
  placeholder?: string;
  showResults?: boolean;
  resultCount?: number;
  recentSearches?: string[];
  suggestions?: string[];
  className?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onSearch,
  placeholder = "검색어를 입력하세요...",
  showResults = false,
  resultCount = 0,
  recentSearches = [],
  suggestions = [],
  className = ''
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 필터 초기값 설정
  useEffect(() => {
    const defaultFilters: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultFilters[filter.id] = filter.defaultValue;
      }
    });
    setActiveFilters(defaultFilters);
  }, [filters]);

  // 검색 실행
  const executeSearch = () => {
    const query: SearchQuery = {
      searchText: searchText.trim(),
      filters: activeFilters,
      sortBy,
      sortOrder
    };
    onSearch(query);
    setShowSuggestions(false);
  };

  // 엔터키 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // 필터 값 변경
  const updateFilter = (filterId: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  // 필터 초기화
  const clearFilters = () => {
    const defaultFilters: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultFilters[filter.id] = filter.defaultValue;
      }
    });
    setActiveFilters(defaultFilters);
  };

  // 개별 필터 제거
  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
  };

  // 활성 필터 개수
  const activeFilterCount = useMemo(() => {
    return Object.keys(activeFilters).length;
  }, [activeFilters]);

  // 검색어 자동완성
  const filteredSuggestions = useMemo(() => {
    if (!searchText.trim()) return recentSearches.slice(0, 5);
    
    return suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 5);
  }, [searchText, suggestions, recentSearches]);

  // 필터 렌더링
  const renderFilter = (filter: SearchFilter) => {
    const value = activeFilters[filter.id];

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filter.options?.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      updateFilter(filter.id, [...currentValues, option.value]);
                    } else {
                      updateFilter(filter.id, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'range':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={value?.min || ''}
              onChange={(e) => updateFilter(filter.id, { ...value, min: e.target.value })}
              placeholder="최소"
              min={filter.min}
              max={filter.max}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">~</span>
            <input
              type="number"
              value={value?.max || ''}
              onChange={(e) => updateFilter(filter.id, { ...value, max: e.target.value })}
              placeholder="최대"
              min={filter.min}
              max={filter.max}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'daterange':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={value?.start || ''}
              onChange={(e) => updateFilter(filter.id, { ...value, start: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={value?.end || ''}
              onChange={(e) => updateFilter(filter.id, { ...value, end: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={filter.id}
                value="true"
                checked={value === true}
                onChange={() => updateFilter(filter.id, true)}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">예</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={filter.id}
                value="false"
                checked={value === false}
                onChange={() => updateFilter(filter.id, false)}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">아니오</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={filter.id}
                value=""
                checked={value === undefined}
                onChange={() => removeFilter(filter.id)}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">전체</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 검색 바 */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount}
              </span>
            )}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-1 rounded-lg hover:bg-gray-100 ${
                showFilterPanel ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            <button
              onClick={executeSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              검색
            </button>
          </div>
        </div>

        {/* 검색 제안 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="py-1">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchText(suggestion);
                    setShowSuggestions(false);
                    setTimeout(executeSearch, 100);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
                    {suggestion}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 필터 패널 */}
      {showFilterPanel && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">고급 필터</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                초기화
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>

          {/* 정렬 옵션 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">정렬 기준</h4>
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">생성일</option>
                <option value="updatedAt">수정일</option>
                <option value="name">이름</option>
                <option value="score">점수</option>
                <option value="status">상태</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={executeSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              필터 적용
            </button>
          </div>
        </div>
      )}

      {/* 활성 필터 표시 */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">활성 필터:</span>
          {Object.entries(activeFilters).map(([filterId, value]) => {
            const filter = filters.find(f => f.id === filterId);
            if (!filter || !value) return null;

            let displayValue = '';
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                displayValue = value.join(', ');
              } else if (value.start && value.end) {
                displayValue = `${value.start} ~ ${value.end}`;
              } else if (value.min || value.max) {
                displayValue = `${value.min || 0} ~ ${value.max || '∞'}`;
              }
            } else {
              displayValue = String(value);
            }

            return (
              <span
                key={filterId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {filter.label}: {displayValue}
                <button
                  onClick={() => removeFilter(filterId)}
                  className="ml-2 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* 검색 결과 요약 */}
      {showResults && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          <span>
            총 <span className="font-medium text-gray-900">{resultCount.toLocaleString()}</span>개의 결과를 찾았습니다.
          </span>
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>{activeFilterCount}개 필터 활성</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;