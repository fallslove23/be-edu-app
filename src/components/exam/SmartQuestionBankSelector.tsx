import React, { useState, useMemo } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { QuestionBank } from '@/types/exam.types';

interface SmartQuestionBankSelectorProps {
  banks: QuestionBank[];
  onSelect: (bank: QuestionBank) => void;
  onClose: () => void;
}

// 태그 타입 정의
interface FilterTag {
  id: string;
  label: string;
  color: string;
}

const SmartQuestionBankSelector: React.FC<SmartQuestionBankSelectorProps> = ({
  banks,
  onSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'questions' | 'recent'>('recent');

  // 사용 가능한 필터 태그 생성
  const availableTags = useMemo(() => {
    const tags: FilterTag[] = [];
    const categories = new Set<string>();
    const questionCounts = new Set<string>();

    banks.forEach(bank => {
      if (bank.category) categories.add(bank.category);

      const count = bank.question_count || 0;
      if (count > 50) questionCounts.add('50+문제');
      else if (count > 20) questionCounts.add('20-50문제');
      else if (count > 10) questionCounts.add('10-20문제');
      else if (count > 0) questionCounts.add('~10문제');
    });

    // 카테고리 태그
    categories.forEach(cat => {
      tags.push({
        id: `cat-${cat}`,
        label: cat,
        color: 'blue'
      });
    });

    // 문제 개수 태그
    questionCounts.forEach(count => {
      tags.push({
        id: `count-${count}`,
        label: count,
        color: 'green'
      });
    });

    return tags;
  }, [banks]);

  // 필터링된 문제은행
  const filteredBanks = useMemo(() => {
    let filtered = [...banks];

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bank =>
        bank.name.toLowerCase().includes(term) ||
        bank.description?.toLowerCase().includes(term) ||
        bank.category?.toLowerCase().includes(term)
      );
    }

    // 태그 필터
    if (selectedTags.length > 0) {
      filtered = filtered.filter(bank => {
        return selectedTags.every(tagId => {
          if (tagId.startsWith('cat-')) {
            const category = tagId.replace('cat-', '');
            return bank.category === category;
          }
          if (tagId.startsWith('count-')) {
            const count = bank.question_count || 0;
            if (tagId.includes('50+')) return count > 50;
            if (tagId.includes('20-50')) return count > 20 && count <= 50;
            if (tagId.includes('10-20')) return count > 10 && count <= 20;
            if (tagId.includes('~10')) return count > 0 && count <= 10;
          }
          return true;
        });
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      }
      if (sortBy === 'questions') {
        return (b.question_count || 0) - (a.question_count || 0);
      }
      if (sortBy === 'recent') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return 0;
    });

    return filtered;
  }, [banks, searchTerm, selectedTags, sortBy]);

  // 태그 토글
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 태그 색상 가져오기
  const getTagColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      green: 'bg-green-500/10 text-green-700 hover:bg-green-200',
      purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      orange: 'bg-orange-500/10 text-orange-700 hover:bg-orange-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // AI 추천 (간단한 로직)
  const recommendedBank = useMemo(() => {
    if (banks.length === 0) return null;
    // 가장 많은 문제를 가진 최근 업데이트된 은행
    const sorted = [...banks].sort((a, b) => {
      const countDiff = (b.question_count || 0) - (a.question_count || 0);
      if (countDiff !== 0) return countDiff;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return sorted[0];
  }, [banks]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">문제은행 선택</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredBanks.length}개의 문제은행 | 총 {banks.reduce((sum, b) => sum + (b.question_count || 0), 0)}개 문제
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-2 rounded-full"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* AI 추천 */}
          {recommendedBank && selectedTags.length === 0 && !searchTerm && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <SparklesIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-1">AI 추천</h3>
                  <p className="text-sm text-purple-800 mb-2">
                    "{recommendedBank.name}" ({recommendedBank.question_count}문제)
                  </p>
                  <button
                    onClick={() => onSelect(recommendedBank)}
                    className="btn-primary text-sm py-1.5"
                  >
                    바로 사용하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 검색 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="문제은행 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 필터 태그 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">빠른 필터</span>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                초기화
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag.id)
                    ? 'bg-blue-600 text-white shadow-md'
                    : getTagColor(tag.color)
                  }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* 정렬 */}
        <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {filteredBanks.length}개 문제은행
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">최근 수정순</option>
              <option value="name">이름순</option>
              <option value="questions">문제 개수순</option>
            </select>
          </div>
        </div>

        {/* 카드 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredBanks.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">검색 결과가 없습니다</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTags([]);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBanks.map((bank) => {
                const isRecommended = bank.id === recommendedBank?.id;
                return (
                  <div
                    key={bank.id}
                    className={`relative group border-2 rounded-lg p-5 transition-all cursor-pointer ${isRecommended
                        ? 'border-purple-300 bg-purple-50 hover:shadow-lg hover:border-purple-400'
                        : 'border-gray-200 bg-white hover:shadow-lg hover:border-blue-300'
                      }`}
                    onClick={() => {
                      if (window.confirm(`"${bank.name}" 문제은행의 문제를 가져오시겠습니까?\n\n기존 문제는 모두 교체됩니다.`)) {
                        onSelect(bank);
                      }
                    }}
                  >
                    {/* AI 추천 배지 */}
                    {isRecommended && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                        <SparklesIcon className="h-3 w-3" />
                        AI 추천
                      </div>
                    )}

                    {/* 카드 헤더 */}
                    <div className="mb-3">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        {bank.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {bank.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {bank.category}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-green-500/10 text-green-700 text-xs rounded-full font-medium">
                          {bank.question_count || 0}문제
                        </span>
                      </div>
                    </div>

                    {/* 설명 */}
                    {bank.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {bank.description}
                      </p>
                    )}

                    {/* 하단 정보 */}
                    <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(bank.updated_at).toLocaleDateString('ko-KR')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`"${bank.name}" 문제은행의 문제를 가져오시겠습니까?\n\n기존 문제는 모두 교체됩니다.`)) {
                            onSelect(bank);
                          }
                        }}
                        className="btn-primary text-sm py-2"
                      >
                        선택
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartQuestionBankSelector;
