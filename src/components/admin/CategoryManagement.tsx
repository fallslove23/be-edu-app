'use client';

import React, { useState, useEffect } from 'react';
import { CategoryService } from '../../services/resource.services';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../../types/resource.types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../types/resource.types';

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
        <div className="flex items-center justify-between p-4 bg-card hover:bg-accent rounded-lg mb-2 transition-colors">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-card-foreground">{category.name}</h3>
                {!category.is_active && (
                  <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                    비활성
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>아이콘: {category.icon}</span>
                <span>순서: {category.display_order}</span>
                {category.children && category.children.length > 0 && (
                  <span>하위 카테고리: {category.children.length}개</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startEdit(category)}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              수정
            </button>
            <button
              onClick={() => setDeleteConfirmId(category.id)}
              className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>

        {/* Render children recursively */}
        {category.children && category.children.length > 0 && (
          <div className="ml-6 border-l-2 border-border pl-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirmId === category.id && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">카테고리 삭제</h3>
              <p className="text-muted-foreground mb-4">
                &quot;{category.name}&quot; 카테고리를 삭제하시겠습니까?
                {category.children && category.children.length > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    ⚠️ 이 카테고리는 {category.children.length}개의 하위 카테고리를 가지고 있습니다.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
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
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">카테고리 관리</h2>
          <p className="text-muted-foreground mt-1">
            과정 카테고리를 추가, 수정, 삭제할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          + 카테고리 추가
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {rootCategories.length === 0 ? (
          <div className="text-center p-8 bg-card rounded-lg">
            <p className="text-muted-foreground">등록된 카테고리가 없습니다.</p>
          </div>
        ) : (
          renderCategoryTree(rootCategories)
        )}
      </div>

      {/* Form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">
              {editingCategory ? '카테고리 수정' : '카테고리 추가'}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  카테고리 이름 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="예: BS 영업"
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  상위 카테고리
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
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
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="카테고리에 대한 설명을 입력하세요"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  색상
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color ? 'border-primary scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  아이콘
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORY_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display order */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  표시 순서
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  min={0}
                />
              </div>

              {/* Active status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-card-foreground">
                  활성화
                </label>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                취소
              </button>
              <button
                onClick={editingCategory ? handleUpdate : handleCreate}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
