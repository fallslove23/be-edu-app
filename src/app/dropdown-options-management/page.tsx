'use client';

import { useState, useEffect } from 'react';
import { PageContainer, PageHeader, Card } from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { DropdownOptionsService } from '@/services/dropdown-options.service';
import type { DropdownCategory, DropdownOption } from '@/services/dropdown-options.service';
import toast from 'react-hot-toast';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';

export default function DropdownOptionsManagementPage() {
  const [categories, setCategories] = useState<DropdownCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DropdownCategory | null>(null);
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState<DropdownOption | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    description: '',
    icon: '',
    color: 'gray',
    is_default: false,
    is_active: true,
  });

  const colorOptions = [
    { value: 'gray', label: '회색', bg: 'bg-gray-500' },
    { value: 'red', label: '빨강', bg: 'bg-red-500' },
    { value: 'orange', label: '주황', bg: 'bg-orange-500' },
    { value: 'yellow', label: '노랑', bg: 'bg-yellow-500' },
    { value: 'green', label: '초록', bg: 'bg-green-500' },
    { value: 'blue', label: '파랑', bg: 'bg-blue-500' },
    { value: 'indigo', label: '남색', bg: 'bg-indigo-500' },
    { value: 'purple', label: '보라', bg: 'bg-purple-500' },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadOptions();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await DropdownOptionsService.getAllCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      toast.error('카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    if (!selectedCategory) return;

    try {
      setLoading(true);
      const data = await DropdownOptionsService.getOptionsByCategory(selectedCategory.code);
      setOptions(data);
    } catch (error) {
      console.error('옵션 로드 실패:', error);
      toast.error('옵션을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setEditingOption(null);
    setFormData({
      value: '',
      label: '',
      description: '',
      icon: '',
      color: 'gray',
      is_default: false,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEditOption = (option: DropdownOption) => {
    setEditingOption(option);
    setFormData({
      value: option.value,
      label: option.label,
      description: option.description || '',
      icon: option.icon || '',
      color: option.color || 'gray',
      is_default: option.is_default,
      is_active: option.is_active,
    });
    setShowModal(true);
  };

  const handleSaveOption = async () => {
    if (!formData.value || !formData.label) {
      toast.error('값과 레이블은 필수 항목입니다.');
      return;
    }

    if (!selectedCategory) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    try {
      if (editingOption) {
        // 수정
        await DropdownOptionsService.updateOption(editingOption.id, {
          label: formData.label,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          is_default: formData.is_default,
          is_active: formData.is_active,
        });
        toast.success('옵션이 수정되었습니다.');
      } else {
        // 생성
        await DropdownOptionsService.createOption({
          category_id: selectedCategory.id,
          value: formData.value,
          label: formData.label,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          is_default: formData.is_default,
          display_order: options.length,
        });
        toast.success('옵션이 추가되었습니다.');
      }

      setShowModal(false);
      loadOptions();
    } catch (error) {
      console.error('옵션 저장 실패:', error);
      toast.error('옵션 저장에 실패했습니다.');
    }
  };

  const handleDeleteOption = async (option: DropdownOption) => {
    if (option.is_system) {
      toast.error('시스템 옵션은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`"${option.label}" 옵션을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await DropdownOptionsService.deleteOption(option.id);
      toast.success('옵션이 삭제되었습니다.');
      loadOptions();
    } catch (error) {
      console.error('옵션 삭제 실패:', error);
      toast.error('옵션 삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (option: DropdownOption) => {
    try {
      await DropdownOptionsService.toggleOptionActive(option.id, !option.is_active);
      toast.success(option.is_active ? '옵션이 비활성화되었습니다.' : '옵션이 활성화되었습니다.');
      loadOptions();
    } catch (error) {
      console.error('옵션 활성화 토글 실패:', error);
      toast.error('옵션 상태 변경에 실패했습니다.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !selectedCategory) {
      return;
    }

    const oldIndex = options.findIndex((opt) => opt.id === active.id);
    const newIndex = options.findIndex((opt) => opt.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 로컬 상태 업데이트
    const newOptions = [...options];
    const [movedItem] = newOptions.splice(oldIndex, 1);
    newOptions.splice(newIndex, 0, movedItem);
    setOptions(newOptions);

    // 서버에 순서 업데이트
    try {
      const orderedIds = newOptions.map((opt) => opt.id);
      await DropdownOptionsService.reorderOptions(selectedCategory.id, orderedIds);
      toast.success('순서가 변경되었습니다.');
    } catch (error) {
      console.error('순서 변경 실패:', error);
      toast.error('순서 변경에 실패했습니다.');
      loadOptions(); // 실패시 원래 데이터로 복구
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="🎛️ 드롭다운 옵션 관리"
        description="시스템에서 사용되는 드롭다운 메뉴 옵션을 관리합니다."
      >
        {selectedCategory && !selectedCategory.is_system && (
          <button
            onClick={handleAddOption}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            옵션 추가
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 카테고리 목록 */}
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">카테고리</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {categories.length}개 카테고리
            </p>
          </div>

          <div className="divide-y divide-border">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={`w-full p-4 text-left transition-all hover:bg-muted/50 ${
                  selectedCategory?.id === category.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {category.icon && <span className="text-2xl">{category.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{category.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{category.code}</p>
                  </div>
                  {category.is_system && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded">
                      시스템
                    </span>
                  )}
                  {!category.is_active && (
                    <span className="px-2 py-1 bg-gray-500/10 text-gray-600 text-xs rounded">
                      비활성
                    </span>
                  )}
                </div>
                {category.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* 옵션 목록 */}
        <Card className="lg:col-span-3">
          {selectedCategory ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      {selectedCategory.icon && <span>{selectedCategory.icon}</span>}
                      {selectedCategory.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {options.length}개 옵션
                      {selectedCategory.is_system && ' (시스템 관리)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowsUpDownIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">드래그하여 순서 변경</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : options.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">등록된 옵션이 없습니다.</p>
                  {!selectedCategory.is_system && (
                    <button
                      onClick={handleAddOption}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                    >
                      첫 옵션 추가하기
                    </button>
                  )}
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={options.map((opt) => opt.id)} strategy={verticalListSortingStrategy}>
                    <div className="divide-y divide-border">
                      {options.map((option) => (
                        <SortableOptionItem
                          key={option.id}
                          option={option}
                          isSystem={selectedCategory.is_system}
                          onEdit={handleEditOption}
                          onDelete={handleDeleteOption}
                          onToggleActive={handleToggleActive}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">왼쪽에서 카테고리를 선택해주세요.</p>
            </div>
          )}
        </Card>
      </div>

      {/* 옵션 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">
                {editingOption ? '옵션 수정' : '옵션 추가'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  값 (Value) *
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  disabled={!!editingOption} // 수정 시에는 value 변경 불가
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="예: final_exam"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  시스템에서 사용되는 고유 값 (영문, 숫자, 언더스코어만)
                </p>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  레이블 (Label) *
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="예: 최종평가"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  사용자에게 표시되는 이름
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="옵션에 대한 설명 (선택사항)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Icon */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    아이콘
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="예: 🎯"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    이모지 하나 (선택사항)
                  </p>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    색상
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          formData.color === color.value
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <div className={`w-full h-6 ${color.bg} rounded`}></div>
                        <p className="text-xs text-center mt-1">{color.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">기본값으로 설정</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">활성화</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSaveOption}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
              >
                {editingOption ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

// 드래그 가능한 옵션 아이템 컴포넌트
function SortableOptionItem({
  option,
  isSystem,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  option: DropdownOption;
  isSystem: boolean;
  onEdit: (option: DropdownOption) => void;
  onDelete: (option: DropdownOption) => void;
  onToggleActive: (option: DropdownOption) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getColorClass = (color?: string) => {
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-500/10 text-gray-600',
      red: 'bg-red-500/10 text-red-600',
      orange: 'bg-orange-500/10 text-orange-600',
      yellow: 'bg-yellow-500/10 text-yellow-600',
      green: 'bg-green-500/10 text-green-600',
      blue: 'bg-blue-500/10 text-blue-600',
      indigo: 'bg-indigo-500/10 text-indigo-600',
      purple: 'bg-purple-500/10 text-purple-600',
    };
    return colorMap[color || 'gray'] || colorMap.gray;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 ${!option.is_active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowsUpDownIcon className="w-5 h-5" />
        </button>

        {/* 옵션 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {option.icon && <span className="text-xl">{option.icon}</span>}
            <h4 className="font-medium text-foreground">{option.label}</h4>
            <span className={`px-2 py-1 text-xs rounded ${getColorClass(option.color)}`}>
              {option.value}
            </span>
            {option.is_default && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                기본값
              </span>
            )}
            {option.is_system && (
              <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded">
                시스템
              </span>
            )}
          </div>
          {option.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {option.description}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleActive(option)}
            className={`p-2 rounded-lg transition-all ${
              option.is_active
                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                : 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20'
            }`}
            title={option.is_active ? '비활성화' : '활성화'}
          >
            {option.is_active ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>

          {!isSystem && (
            <>
              <button
                onClick={() => onEdit(option)}
                className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-all"
                title="수정"
              >
                <PencilIcon className="w-5 h-5" />
              </button>

              {!option.is_system && (
                <button
                  onClick={() => onDelete(option)}
                  className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-all"
                  title="삭제"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
