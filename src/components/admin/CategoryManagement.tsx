'use client';

import React, { useState, useEffect } from 'react';
import { CategoryService } from '../../services/resource.services';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../../types/resource.types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../types/resource.types';
import { PageContainer } from '../common/PageContainer';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    parent_id: null,
    description: '',
    color: CATEGORY_COLORS[0],
    icon: CATEGORY_ICONS[0],
    display_order: 0,
    is_active: true
  });

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CategoryService.getCategories();
      console.log('✅ Loaded categories:', data.length);
      setCategories(data);
    } catch (err) {
      console.error('❌ Failed to load categories:', err);
      setError(err instanceof Error ? err.message : '카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle create
  const handleCreate = async () => {
    try {
      setError(null);
      await CategoryService.createCategory(formData);
      console.log('✅ Category created');
      await loadCategories();
      resetForm();
    } catch (err) {
      console.error('❌ Failed to create category:', err);
      setError(err instanceof Error ? err.message : '카테고리 생성에 실패했습니다.');
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingCategory) return;

    try {
      setError(null);
      const updateData: UpdateCategoryData = {
        name: formData.name,
        parent_id: formData.parent_id,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        display_order: formData.display_order,
        is_active: formData.is_active
      };
      await CategoryService.updateCategory(editingCategory.id, updateData);
      console.log('✅ Category updated');
      await loadCategories();
      resetForm();
    } catch (err) {
      console.error('❌ Failed to update category:', err);
      setError(err instanceof Error ? err.message : '카테고리 수정에 실패했습니다.');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await CategoryService.deleteCategory(id);
      console.log('✅ Category deleted');
      await loadCategories();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('❌ Failed to delete category:', err);
      setError(err instanceof Error ? err.message : '카테고리 삭제에 실패했습니다.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      parent_id: null,
      description: '',
      color: CATEGORY_COLORS[0],
      icon: CATEGORY_ICONS[0],
      display_order: 0,
      is_active: true
    });
    setEditingCategory(null);
    setIsFormOpen(false);
  };

  // Start editing
  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id,
      description: category.description || '',
      color: category.color,
      icon: category.icon,
      display_order: category.display_order,
      is_active: category.is_active
    });
    setIsFormOpen(true);
  };

  // Render category tree
  const renderCategoryTree = (parentCategories: Category[], level = 0) => {
    return parentCategories.map((category) => (
      <div key={category.id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl mb-2 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white">{category.name}</h3>
                {!category.is_active && (
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full font-medium">
                    비활성
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  아이콘: {category.icon}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  순서: {category.display_order}
                </span>
                {category.children && category.children.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    하위 카테고리: {category.children.length}개
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(category)}
              className="btn-ghost p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
              title="수정"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteConfirmId(category.id)}
              className="btn-ghost p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              title="삭제"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Render children recursively */}
        {category.children && category.children.length > 0 && (
          <div className="ml-6 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirmId === category.id && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">카테고리 삭제</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                &quot;{category.name}&quot; 카테고리를 삭제하시겠습니까?
                {category.children && category.children.length > 0 && (
                  <span className="block mt-2 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                    ⚠️ 이 카테고리는 {category.children.length}개의 하위 카테고리를 가지고 있습니다.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="btn-danger"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ));
  };

  // Get root categories (parent_id is null)
  const rootCategories = categories.filter(c => c.parent_id === null);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">카테고리 관리</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                과정 카테고리를 추가, 수정, 삭제할 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              카테고리 추가
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Category list */}
        <div className="space-y-2">
          {rootCategories.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">등록된 카테고리가 없습니다.</p>
            </div>
          ) : (
            renderCategoryTree(rootCategories)
          )}
        </div>

        {/* Form modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCategory ? '카테고리 수정' : '카테고리 추가'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    카테고리 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                    placeholder="예: BS 영업"
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    상위 카테고리
                  </label>
                  <select
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="">없음 (최상위 카테고리)</option>
                    {rootCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} disabled={cat.id === editingCategory?.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="카테고리에 대한 설명을 입력하세요"
                  />
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    색상
                  </label>
                  <div className="flex gap-3 flex-wrap p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${formData.color === color
                          ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-200 dark:ring-blue-900'
                          : 'border-transparent hover:scale-105'
                          }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    아이콘
                  </label>
                  <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600 max-h-40 overflow-y-auto">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`text-2xl p-2 rounded-lg transition-all ${formData.icon === icon
                          ? 'bg-white dark:bg-gray-600 shadow-sm ring-2 ring-blue-500'
                          : 'hover:bg-white dark:hover:bg-gray-600'
                          }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display order */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                    min={0}
                  />
                </div>

                {/* Active status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    활성화 상태로 설정
                  </label>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={resetForm}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={editingCategory ? handleUpdate : handleCreate}
                  disabled={!formData.name.trim()}
                  className="btn-primary"
                >
                  {editingCategory ? '수정 완료' : '카테고리 추가'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default React.memo(CategoryManagement);
