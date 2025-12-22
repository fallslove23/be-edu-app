'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CourseTemplateService } from '@/services/course-template.service';
import type { CourseRound } from '@/types/course-template.types';
import toast from 'react-hot-toast';

interface RoundEditModalProps {
  round: CourseRound;
  onClose: () => void;
  onUpdate: () => void;
}

interface RoundFormData {
  title: string;
  round_number: number;
  start_date: string;
  end_date: string;
  location: string;
  max_trainees: number;
  description?: string;
  status: 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
}

const RoundEditModal: React.FC<RoundEditModalProps> = ({ round, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<RoundFormData>({
    title: round.title || '',
    round_number: round.round_number,
    start_date: round.start_date,
    end_date: round.end_date,
    location: round.location || '',
    max_trainees: round.max_trainees,
    description: round.description || '',
    status: round.status,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.title || !formData.start_date || !formData.end_date) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('종료일은 시작일 이후여야 합니다.');
      return;
    }

    if (formData.max_trainees < round.current_trainees) {
      toast.error(
        `최대 인원은 현재 등록된 인원(${round.current_trainees}명)보다 작을 수 없습니다.`
      );
      return;
    }

    try {
      setSaving(true);
      await CourseTemplateService.updateRound(round.id, formData);
      toast.success('과정 회차가 수정되었습니다.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('과정 회차 수정 실패:', error);
      toast.error('과정 회차 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'round_number' || name === 'max_trainees' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-foreground">과정 회차 수정</h2>
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
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              과정 제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 2024년 1기 BS Basic"
              required
              disabled={saving}
            />
          </div>

          {/* 회차 번호 & 상태 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="round_number"
                className="block text-sm font-medium text-foreground mb-2"
              >
                회차 *
              </label>
              <input
                type="number"
                id="round_number"
                name="round_number"
                value={formData.round_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
                required
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                상태 *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={saving}
              >
                <option value="planning">기획 중</option>
                <option value="recruiting">모집 중</option>
                <option value="in_progress">진행 중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>

          {/* 시작일 & 종료일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-medium text-foreground mb-2"
              >
                시작일 *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-foreground mb-2">
                종료일 *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={saving}
              />
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
              장소
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 본사 3층 교육장"
              disabled={saving}
            />
          </div>

          {/* 최대 인원 */}
          <div>
            <label
              htmlFor="max_trainees"
              className="block text-sm font-medium text-foreground mb-2"
            >
              최대 인원 *
            </label>
            <input
              type="number"
              id="max_trainees"
              name="max_trainees"
              value={formData.max_trainees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              min={round.current_trainees}
              required
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground mt-1">
              현재 등록 인원: {round.current_trainees}명
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground mb-2"
            >
              설명
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="과정 회차에 대한 설명을 입력하세요"
              disabled={saving}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '수정'}
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

export default RoundEditModal;
