'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MaterialService } from '@/services/material.service';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import type { MaterialCategory } from '@/types/material.types';

interface CategoryModalProps {
  category?: MaterialCategory | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('📁');
  const [saving, setSaving] = useState(false);

  const colorOptions = [
    { value: '#3B82F6', label: '파란색' },
    { value: '#10B981', label: '초록색' },
    { value: '#F59E0B', label: '주황색' },
    { value: '#EF4444', label: '빨간색' },
    { value: '#8B5CF6', label: '보라색' },
    { value: '#EC4899', label: '분홍색' },
  ];

  const iconOptions = ['📁', '📚', '📝', '📋', '📊', '🎯', '💼', '🎓'];

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setColor(category.color || '#3B82F6');
      setIcon(category.icon || '📁');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      setSaving(true);

      if (category) {
        // 수정
        await MaterialService.updateCategory(category.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          icon,
        });
        toast.success('카테고리가 수정되었습니다.');
      } else {
        // 생성
        await MaterialService.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          icon,
          created_by: user.id,
        });
        toast.success('카테고리가 생성되었습니다.');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('카테고리 저장 실패:', error);
      toast.error('카테고리 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-foreground">
            {category ? '카테고리 수정' : '새 카테고리'}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 아이콘 선택 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              아이콘
            </label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((iconOption) => (
                <button
                  key={iconOption}
                  type="button"
                  onClick={() => setIcon(iconOption)}
                  className={`text-2xl p-3 rounded-lg border-2 transition-all ${
                    icon === iconOption
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {iconOption}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              색상
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    color === colorOption.value
                      ? 'border-foreground scale-110'
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              카테고리 이름 *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 강의자료"
              required
              disabled={saving}
            />
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="카테고리에 대한 설명을 입력하세요"
              disabled={saving}
            />
          </div>

          {/* 미리보기 */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">미리보기</p>
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${color}20` }}
              >
                <span className="text-2xl">{icon}</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">{name || '카테고리 이름'}</h4>
                <p className="text-sm text-muted-foreground">
                  {description || '설명이 없습니다'}
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : category ? '수정' : '생성'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-outline flex-1 disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
