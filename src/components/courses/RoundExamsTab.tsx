'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { CourseTemplateService } from '@/services/course-template.service';
import type { CourseRound } from '@/types/course-template.types';
import toast from 'react-hot-toast';
import modal from '@/lib/modal';

interface RoundExamsTabProps {
  round: CourseRound;
  onUpdate: () => void;
}

interface Exam {
  id: string;
  round_id: string;
  exam_number: number;
  title: string;
  description?: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  total_score: number;
  passing_score: number;
  exam_type: 'written' | 'practical' | 'oral' | 'project' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

interface ExamFormData {
  exam_number: number;
  title: string;
  description?: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  total_score: number;
  passing_score: number;
  exam_type: 'written' | 'practical' | 'oral' | 'project' | 'other';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

const RoundExamsTab: React.FC<RoundExamsTabProps> = ({ round, onUpdate }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState<ExamFormData>({
    exam_number: 1,
    title: '',
    description: '',
    exam_date: '',
    start_time: '09:00',
    end_time: '12:00',
    total_score: 100,
    passing_score: 60,
    exam_type: 'written',
    status: 'scheduled',
  });

  useEffect(() => {
    loadExams();
  }, [round.id]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const examsData = await CourseTemplateService.getExams(round.id);
      setExams(examsData || []);
    } catch (error) {
      console.error('시험 로드 실패:', error);
      toast.error('시험 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        exam_number: exam.exam_number,
        title: exam.title,
        description: exam.description || '',
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        total_score: exam.total_score,
        passing_score: exam.passing_score,
        exam_type: exam.exam_type,
        status: exam.status,
      });
    } else {
      setEditingExam(null);
      const nextExamNumber = exams.length > 0
        ? Math.max(...exams.map(e => e.exam_number)) + 1
        : 1;
      setFormData({
        exam_number: nextExamNumber,
        title: '',
        description: '',
        exam_date: '',
        start_time: '09:00',
        end_time: '12:00',
        total_score: 100,
        passing_score: 60,
        exam_type: 'written',
        status: 'scheduled',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExam(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.exam_date || !formData.title) {
      toast.error('날짜와 제목은 필수입니다.');
      return;
    }

    if (formData.passing_score > formData.total_score) {
      toast.error('합격 점수는 만점을 초과할 수 없습니다.');
      return;
    }

    try {
      if (editingExam) {
        await CourseTemplateService.updateExam(editingExam.id, formData);
        toast.success('시험이 수정되었습니다.');
      } else {
        await CourseTemplateService.createExam({
          ...formData,
          round_id: round.id,
        });
        toast.success('시험이 추가되었습니다.');
      }

      handleCloseModal();
      loadExams();
      onUpdate();
    } catch (error) {
      console.error('시험 저장 실패:', error);
      toast.error('시험 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (exam: Exam) => {
    const confirmed = await modal.confirm(
      '시험 삭제',
      `"${exam.title}" 시험을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      await CourseTemplateService.deleteExam(exam.id);
      toast.success('시험이 삭제되었습니다.');
      loadExams();
      onUpdate();
    } catch (error) {
      console.error('시험 삭제 실패:', error);
      toast.error('시험 삭제 중 오류가 발생했습니다.');
    }
  };

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'written':
        return '필기';
      case 'practical':
        return '실기';
      case 'oral':
        return '구술';
      case 'project':
        return '프로젝트';
      case 'other':
        return '기타';
      default:
        return type;
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'written':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'practical':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'oral':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'project':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'other':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '예정';
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">시험 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">시험 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {exams.length}개의 시험
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          시험 추가
        </button>
      </div>

      {/* 시험 목록 */}
      {exams.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <DocumentTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            등록된 시험이 없습니다
          </h3>
          <p className="text-muted-foreground mb-4">
            첫 번째 시험을 추가해보세요.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary"
          >
            시험 추가
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams
            .sort((a, b) => a.exam_number - b.exam_number)
            .map((exam) => (
              <div
                key={exam.id}
                className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {exam.exam_number}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">
                        {exam.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getExamTypeColor(
                          exam.exam_type
                        )}`}
                      >
                        {getExamTypeLabel(exam.exam_type)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          exam.status
                        )}`}
                      >
                        {getStatusLabel(exam.status)}
                      </span>
                    </div>

                    {exam.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {exam.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{exam.exam_date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {exam.start_time} ~ {exam.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>만점: {exam.total_score}점</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>합격: {exam.passing_score}점</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(exam)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="수정"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 시험 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                {editingExam ? '시험 수정' : '시험 추가'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    시험 번호 *
                  </label>
                  <input
                    type="number"
                    value={formData.exam_number}
                    onChange={(e) =>
                      setFormData({ ...formData, exam_number: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    시험 유형 *
                  </label>
                  <select
                    value={formData.exam_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exam_type: e.target.value as ExamFormData['exam_type'],
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="written">필기</option>
                    <option value="practical">실기</option>
                    <option value="oral">구술</option>
                    <option value="project">프로젝트</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  시험 제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="예: 중간고사"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  시험 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="시험 범위, 준비물 등"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    시험 날짜 *
                  </label>
                  <input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    만점 *
                  </label>
                  <input
                    type="number"
                    value={formData.total_score}
                    onChange={(e) =>
                      setFormData({ ...formData, total_score: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    합격 점수 *
                  </label>
                  <input
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) =>
                      setFormData({ ...formData, passing_score: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    max={formData.total_score}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  상태 *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as ExamFormData['status'],
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="scheduled">예정</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingExam ? '수정' : '추가'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-outline flex-1"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundExamsTab;
