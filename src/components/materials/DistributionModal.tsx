'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MaterialService } from '@/services/material.service';
import type { Material, MaterialCategory } from '@/types/material.types';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';

interface DistributionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DistributionModal({ onClose, onSuccess }: DistributionModalProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'course' | 'round' | 'group' | 'individual'>('all');
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsData, categoriesData] = await Promise.all([
        MaterialService.getMaterials(),
        MaterialService.getCategories(),
      ]);
      setMaterials(materialsData);
      setCategories(categoriesData);
    } catch (error) {
      logger.error('자료 목록 로드 실패', error as Error, {
        component: 'DistributionModal',
        action: 'loadData',
      });
      toast.error('자료 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMaterialId) {
      toast.error('배포할 자료를 선택해주세요.');
      return;
    }

    if (!title.trim()) {
      toast.error('배포 제목을 입력해주세요.');
      return;
    }

    if (targetType !== 'all' && totalRecipients === 0) {
      toast.error('배포 대상 수를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      await MaterialService.createDistribution({
        material_id: selectedMaterialId,
        title: title.trim(),
        description: description.trim() || undefined,
        target_type: targetType,
        target_ids: targetIds.length > 0 ? targetIds : undefined,
        distributed_by: 'current-user-id', // TODO: 실제 user ID 사용
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        status: scheduledAt ? 'scheduled' : 'in_progress',
        total_recipients: targetType === 'all' ? totalRecipients : totalRecipients,
      });

      toast.success('자료 배포가 생성되었습니다.');
      onSuccess();
      onClose();
    } catch (error) {
      logger.error('배포 생성 실패', error as Error, {
        component: 'DistributionModal',
        action: 'handleSubmit',
      });
      toast.error('배포 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const selectedCategory = categories.find(c => c.id === selectedMaterial?.category_id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl border border-border shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
          <h3 className="text-lg font-bold text-card-foreground">자료 배포 생성</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 자료 선택 */}
          <div>
            <label htmlFor="material" className="block text-sm font-medium text-foreground mb-2">
              배포할 자료 *
            </label>
            <select
              id="material"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            >
              <option value="">자료를 선택해주세요</option>
              {materials.map(material => {
                const category = categories.find(c => c.id === material.category_id);
                return (
                  <option key={material.id} value={material.id}>
                    {category?.icon} {material.title}
                  </option>
                );
              })}
            </select>

            {selectedMaterial && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">카테고리:</span>
                  <span className="font-medium text-foreground">
                    {selectedCategory?.icon} {selectedCategory?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">파일명:</span>
                  <span className="font-medium text-foreground truncate ml-2">
                    {selectedMaterial.file_name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 배포 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              배포 제목 *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 1차 영업 교육 자료 배포"
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>

          {/* 배포 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              배포 설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="배포에 대한 추가 설명을 입력해주세요"
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* 배포 대상 유형 */}
          <div>
            <label htmlFor="targetType" className="block text-sm font-medium text-foreground mb-2">
              배포 대상 *
            </label>
            <select
              id="targetType"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">전체 교육생</option>
              <option value="course">과정별</option>
              <option value="round">차수별</option>
              <option value="group">그룹별</option>
              <option value="individual">개별 선택</option>
            </select>
          </div>

          {/* 배포 대상 수 */}
          <div>
            <label htmlFor="totalRecipients" className="block text-sm font-medium text-foreground mb-2">
              배포 대상 수 *
            </label>
            <input
              type="number"
              id="totalRecipients"
              value={totalRecipients}
              onChange={(e) => setTotalRecipients(parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              배포될 총 인원 수를 입력해주세요
            </p>
          </div>

          {/* 예약 시간 */}
          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-foreground mb-2">
              예약 시간 (선택사항)
            </label>
            <input
              type="datetime-local"
              id="scheduledAt"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              지정하지 않으면 즉시 배포됩니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-border rounded-full text-foreground hover:bg-muted transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '생성 중...' : '배포 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
