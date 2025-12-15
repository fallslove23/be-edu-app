/**
 * 드롭다운 옵션 관리 컴포넌트
 *
 * 관리자가 웹 UI에서 드롭다운 옵션을 관리할 수 있는 인터페이스
 */

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import {
  DropdownOptionsService,
  DropdownCategory,
  DropdownOption,
  CreateDropdownOptionData,
  UpdateDropdownOptionData
} from '@/services/dropdown-options.service';
import toast from 'react-hot-toast';

const DropdownOptionsManagement: React.FC = () => {
  const [categories, setCategories] = useState<DropdownCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DropdownCategory | null>(null);
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState<Partial<CreateDropdownOptionData>>({
    value: '',
    label: '',
    description: '',
    icon: '',
    color: '',
    display_order: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadOptions(selectedCategory.code);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const data = await DropdownOptionsService.getAllCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error('카테고리 로딩 실패:', error);
      toast.error('카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async (categoryCode: string) => {
    try {
      setLoading(true);
      const data = await DropdownOptionsService.getOptionsByCategory(categoryCode);
      setOptions(data);
    } catch (error) {
      console.error('옵션 로딩 실패:', error);
      toast.error('옵션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOption = async () => {
    if (!selectedCategory) return;
    if (!formData.value || !formData.label) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }

    try {
      await DropdownOptionsService.createOption({
        ...formData as CreateDropdownOptionData,
        category_id: selectedCategory.id
      });
      toast.success('옵션이 추가되었습니다.');
      setShowCreateModal(false);
      setFormData({
        value: '',
        label: '',
        description: '',
        icon: '',
        color: '',
        display_order: 0
      });
      loadOptions(selectedCategory.code);
    } catch (error) {
      console.error('옵션 생성 실패:', error);
      toast.error('옵션 추가에 실패했습니다.');
    }
  };

  const handleUpdateOption = async () => {
    if (!editingOption) return;

    try {
      await DropdownOptionsService.updateOption(editingOption.id, formData as UpdateDropdownOptionData);
      toast.success('옵션이 수정되었습니다.');
      setShowEditModal(false);
      setEditingOption(null);
      if (selectedCategory) {
        loadOptions(selectedCategory.code);
      }
    } catch (error) {
      console.error('옵션 수정 실패:', error);
      toast.error('옵션 수정에 실패했습니다.');
    }
  };

  const handleDeleteOption = async (optionId: string, optionLabel: string) => {
    if (!confirm(`"${optionLabel}" 옵션을 삭제하시겠습니까?`)) return;

    try {
      await DropdownOptionsService.deleteOption(optionId);
      toast.success('옵션이 삭제되었습니다.');
      if (selectedCategory) {
        loadOptions(selectedCategory.code);
      }
    } catch (error: any) {
      console.error('옵션 삭제 실패:', error);
      toast.error(error.message || '옵션 삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (option: DropdownOption) => {
    try {
      await DropdownOptionsService.toggleOptionActive(option.id, !option.is_active);
      toast.success(option.is_active ? '옵션이 비활성화되었습니다.' : '옵션이 활성화되었습니다.');
      if (selectedCategory) {
        loadOptions(selectedCategory.code);
      }
    } catch (error) {
      console.error('옵션 상태 변경 실패:', error);
      toast.error('옵션 상태 변경에 실패했습니다.');
    }
  };

  const handleMoveUp = async (option: DropdownOption, index: number) => {
    if (index === 0) return;

    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];

    try {
      await DropdownOptionsService.reorderOptions(
        selectedCategory!.id,
        newOptions.map(opt => opt.id)
      );
      setOptions(newOptions);
      toast.success('순서가 변경되었습니다.');
    } catch (error) {
      console.error('순서 변경 실패:', error);
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  const handleMoveDown = async (option: DropdownOption, index: number) => {
    if (index === options.length - 1) return;

    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];

    try {
      await DropdownOptionsService.reorderOptions(
        selectedCategory!.id,
        newOptions.map(opt => opt.id)
      );
      setOptions(newOptions);
      toast.success('순서가 변경되었습니다.');
    } catch (error) {
      console.error('순서 변경 실패:', error);
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  const openEditModal = (option: DropdownOption) => {
    setEditingOption(option);
    setFormData({
      label: option.label,
      description: option.description || '',
      icon: option.icon || '',
      color: option.color || '',
      is_active: option.is_active,
      display_order: option.display_order
    });
    setShowEditModal(true);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && categories.length === 0) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            드롭다운 옵션 관리
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            시스템 전체의 드롭다운 메뉴 옵션을 관리합니다. 옵션 추가, 수정, 삭제 및 순서 변경이 가능합니다.
          </p>
        </div>

        {/* 카테고리 선택 탭 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedCategory?.id === category.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 및 추가 버튼 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="옵션 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={selectedCategory?.is_system === true}
              className="flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              새 옵션 추가
            </button>
          </div>

          {selectedCategory && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>카테고리:</strong> {selectedCategory.name}
              </p>
              {selectedCategory.description && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {selectedCategory.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 옵션 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              옵션 목록 ({filteredOptions.length})
            </h2>
          </div>

          {filteredOptions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 옵션이 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`border rounded-xl p-4 transition-all ${
                      option.is_active
                        ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 옵션 정보 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {option.icon && (
                            <span className="text-2xl">{option.icon}</span>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              값: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{option.value}</code>
                            </p>
                          </div>
                          {option.color && (
                            <span className={`px-2 py-1 text-xs rounded-lg bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-700 dark:text-${option.color}-300`}>
                              {option.color}
                            </span>
                          )}
                          {option.is_system && (
                            <span className="px-2 py-1 text-xs rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              시스템
                            </span>
                          )}
                        </div>
                        {option.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.description}
                          </p>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2">
                        {/* 순서 변경 */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveUp(option, index)}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="위로 이동"
                          >
                            <ChevronUpIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(option, index)}
                            disabled={index === filteredOptions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="아래로 이동"
                          >
                            <ChevronDownIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 활성화/비활성화 */}
                        <button
                          onClick={() => handleToggleActive(option)}
                          className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          title={option.is_active ? '비활성화' : '활성화'}
                        >
                          {option.is_active ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeSlashIcon className="w-5 h-5" />
                          )}
                        </button>

                        {/* 수정 */}
                        <button
                          onClick={() => openEditModal(option)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="수정"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>

                        {/* 삭제 */}
                        <button
                          onClick={() => handleDeleteOption(option.id, option.label)}
                          disabled={option.is_system}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={option.is_system ? '시스템 옵션은 삭제할 수 없습니다' : '삭제'}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <OptionModal
          title="새 옵션 추가"
          formData={formData}
          setFormData={setFormData}
          onSave={handleCreateOption}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({
              value: '',
              label: '',
              description: '',
              icon: '',
              color: '',
              display_order: 0
            });
          }}
        />
      )}

      {/* 수정 모달 */}
      {showEditModal && editingOption && (
        <OptionModal
          title={`옵션 수정: ${editingOption.label}`}
          formData={formData}
          setFormData={setFormData}
          onSave={handleUpdateOption}
          onClose={() => {
            setShowEditModal(false);
            setEditingOption(null);
          }}
          isEditing
        />
      )}
    </PageContainer>
  );
};

// 옵션 생성/수정 모달 컴포넌트
interface OptionModalProps {
  title: string;
  formData: Partial<CreateDropdownOptionData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CreateDropdownOptionData>>>;
  onSave: () => void;
  onClose: () => void;
  isEditing?: boolean;
}

const OptionModal: React.FC<OptionModalProps> = ({
  title,
  formData,
  setFormData,
  onSave,
  onClose,
  isEditing = false
}) => {
  const commonIcons = ['🎯', '📊', '❓', '📝', '💡', '📚', '✅', '❌', '⏰', '📄', '🔴', '🟡', '🟢', '⭕', '✏️', '📢', '📅', '▶️', '📦', '☑️', '✍️', '🔗', '🔢', '📋', '⚙️', '👑', '👔', '👨‍🏫', '🎓', '🔧', '🎤'];
  const commonColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'indigo', 'pink', 'gray', 'teal'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* 값 (편집 시 비활성화) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              값 (Value) *
            </label>
            <input
              type="text"
              value={formData.value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              disabled={isEditing}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder="예: final"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              시스템 내부에서 사용되는 영문 값 (수정 불가)
            </p>
          </div>

          {/* 라벨 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              라벨 (Label) *
            </label>
            <input
              type="text"
              value={formData.label || ''}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="예: 최종평가"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              사용자에게 표시되는 이름
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="옵션에 대한 설명"
            />
          </div>

          {/* 아이콘 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              아이콘 (이모지)
            </label>
            <div className="grid grid-cols-12 gap-2 p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 max-h-32 overflow-y-auto">
              {commonIcons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    formData.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900' : ''
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            {formData.icon && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                선택된 아이콘: <span className="text-2xl">{formData.icon}</span>
              </p>
            )}
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              색상
            </label>
            <div className="flex flex-wrap gap-2">
              {commonColors.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    formData.color === color
                      ? `bg-${color}-600 text-white ring-2 ring-${color}-400`
                      : `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 hover:bg-${color}-200 dark:hover:bg-${color}-800/50`
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
          >
            {isEditing ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DropdownOptionsManagement;
