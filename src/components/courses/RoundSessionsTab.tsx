'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CourseTemplateService } from '@/services/course-template.service';
import type { CourseRound, CourseSession } from '@/types/course-template.types';
import toast from 'react-hot-toast';
import modal from '@/lib/modal';

interface RoundSessionsTabProps {
  round: CourseRound;
  onUpdate: () => void;
}

interface SessionFormData {
  session_date: string;
  start_time: string;
  end_time: string;
  session_number: number;
  title: string;
  description?: string;
  location?: string;
  instructor_id?: string;
  session_type: 'theory' | 'practice' | 'exam' | 'other';
}

const RoundSessionsTab: React.FC<RoundSessionsTabProps> = ({ round, onUpdate }) => {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    session_date: '',
    start_time: '09:00',
    end_time: '18:00',
    session_number: 1,
    title: '',
    description: '',
    location: round.location || '',
    instructor_id: '',
    session_type: 'theory',
  });

  useEffect(() => {
    loadSessions();
    loadInstructors();
  }, [round.id]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await CourseTemplateService.getSessions(round.id);
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('세션 로드 실패:', error);
      toast.error('세션 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      // 강사 목록 조회 (users 테이블에서 role='instructor')
      const { data, error } = await CourseTemplateService['supabase']
        .from('users')
        .select('id, name, email')
        .eq('role', 'instructor')
        .eq('status', 'active');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('강사 목록 로드 실패:', error);
    }
  };

  const handleOpenModal = (session?: CourseSession) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        session_date: session.session_date,
        start_time: session.start_time || '09:00',
        end_time: session.end_time || '18:00',
        session_number: session.session_number,
        title: session.title || '',
        description: session.description || '',
        location: session.location || round.location || '',
        instructor_id: session.instructor_id || '',
        session_type: session.session_type || 'theory',
      });
    } else {
      setEditingSession(null);
      const nextSessionNumber = sessions.length > 0
        ? Math.max(...sessions.map(s => s.session_number)) + 1
        : 1;
      setFormData({
        session_date: '',
        start_time: '09:00',
        end_time: '18:00',
        session_number: nextSessionNumber,
        title: '',
        description: '',
        location: round.location || '',
        instructor_id: '',
        session_type: 'theory',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.session_date || !formData.title) {
      toast.error('날짜와 제목은 필수입니다.');
      return;
    }

    try {
      if (editingSession) {
        await CourseTemplateService.updateSession(editingSession.id, formData);
        toast.success('세션이 수정되었습니다.');
      } else {
        await CourseTemplateService.createSession({
          ...formData,
          round_id: round.id,
        });
        toast.success('세션이 추가되었습니다.');
      }

      handleCloseModal();
      loadSessions();
      onUpdate();
    } catch (error) {
      console.error('세션 저장 실패:', error);
      toast.error('세션 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (session: CourseSession) => {
    const confirmed = await modal.confirm(
      '세션 삭제',
      `"${session.title}" 세션을 삭제하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      await CourseTemplateService.deleteSession(session.id);
      toast.success('세션이 삭제되었습니다.');
      loadSessions();
      onUpdate();
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      toast.error('세션 삭제 중 오류가 발생했습니다.');
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'theory':
        return '이론';
      case 'practice':
        return '실습';
      case 'exam':
        return '시험';
      case 'other':
        return '기타';
      default:
        return type;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'theory':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'practice':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'exam':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'other':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">세션 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">세션 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            총 {sessions.length}개의 세션
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          세션 추가
        </button>
      </div>

      {/* 세션 목록 */}
      {sessions.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            등록된 세션이 없습니다
          </h3>
          <p className="text-muted-foreground mb-4">
            첫 번째 세션을 추가해보세요.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary"
          >
            세션 추가
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions
            .sort((a, b) => a.session_number - b.session_number)
            .map((session) => {
              const instructor = instructors.find((i) => i.id === session.instructor_id);
              return (
                <div
                  key={session.id}
                  className="bg-card rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {session.session_number}
                        </span>
                        <h3 className="text-lg font-semibold text-foreground">
                          {session.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(
                            session.session_type
                          )}`}
                        >
                          {getSessionTypeLabel(session.session_type)}
                        </span>
                      </div>

                      {session.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {session.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{session.session_date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ClockIcon className="w-4 h-4" />
                          <span>
                            {session.start_time} ~ {session.end_time}
                          </span>
                        </div>
                        {session.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{session.location}</span>
                          </div>
                        )}
                        {instructor && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserIcon className="w-4 h-4" />
                            <span>{instructor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleOpenModal(session)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="수정"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(session)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* 세션 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                {editingSession ? '세션 수정' : '세션 추가'}
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
                    세션 번호 *
                  </label>
                  <input
                    type="number"
                    value={formData.session_number}
                    onChange={(e) =>
                      setFormData({ ...formData, session_number: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    세션 유형 *
                  </label>
                  <select
                    value={formData.session_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        session_type: e.target.value as SessionFormData['session_type'],
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="theory">이론</option>
                    <option value="practice">실습</option>
                    <option value="exam">시험</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  세션 제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="예: 1일차 - 기초 이론"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  세션 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="세션에 대한 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    날짜 *
                  </label>
                  <input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">장소</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="강의실 위치"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">강사</label>
                <select
                  value={formData.instructor_id}
                  onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">선택 안함</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} ({instructor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingSession ? '수정' : '추가'}
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

export default RoundSessionsTab;
