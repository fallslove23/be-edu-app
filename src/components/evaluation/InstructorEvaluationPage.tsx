/**
 * 강사 평가 페이지
 * - 과정 회차 선택 + 학생 선택 + 평가 입력 폼
 */

import React, { useState, useEffect } from 'react';
import { courseTemplateService } from '../../services/course-template.service';
import { evaluationTemplateService } from '../../services/evaluation.service';
import { useAuth } from '../../contexts/AuthContext';
import InstructorEvaluationForm from './InstructorEvaluationForm';
import type { CourseRound } from '../../types/course-template.types';

export default function InstructorEvaluationPage() {
  const { user } = useAuth();
  const [courseRounds, setCourseRounds] = useState<CourseRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string>('');

  useEffect(() => {
    loadCourseRounds();
  }, []);

  useEffect(() => {
    if (selectedRoundId) {
      loadTrainees();
      loadTemplateForRound();
    }
  }, [selectedRoundId]);

  const loadCourseRounds = async () => {
    try {
      setLoading(true);
      const rounds = await courseTemplateService.getRounds({
        status: 'in_progress',
      });
      setCourseRounds(rounds || []);

      if (rounds && rounds.length > 0) {
        setSelectedRoundId(rounds[0].id);
      }
    } catch (error) {
      console.error('Failed to load course rounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrainees = async () => {
    if (!selectedRoundId) return;

    try {
      const enrollments = await courseTemplateService.getRoundEnrollments(selectedRoundId);
      setTrainees(enrollments || []);

      if (enrollments && enrollments.length > 0) {
        setSelectedTraineeId(enrollments[0].user_id);
      }
    } catch (error) {
      console.error('Failed to load trainees:', error);
    }
  };

  const loadTemplateForRound = async () => {
    if (!selectedRoundId) return;

    try {
      const round = courseRounds.find((r) => r.id === selectedRoundId);
      if (round && round.template_id) {
        // 과정 템플릿에 연결된 평가 템플릿 찾기
        const templates = await evaluationTemplateService.getAll();
        const template = templates.find((t) => t.course_template_id === round.template_id);
        if (template) {
          setTemplateId(template.id);
        }
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleEvaluationComplete = () => {
    // 다음 학생으로 자동 이동
    const currentIndex = trainees.findIndex((t) => t.user_id === selectedTraineeId);
    if (currentIndex >= 0 && currentIndex < trainees.length - 1) {
      setSelectedTraineeId(trainees[currentIndex + 1].user_id);
    } else {
      alert('모든 학생 평가가 완료되었습니다!');
    }
  };

  const selectedRound = courseRounds.find((r) => r.id === selectedRoundId);
  const selectedTrainee = trainees.find((t) => t.user_id === selectedTraineeId);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (courseRounds.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                진행 중인 과정이 없습니다
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                평가를 입력하려면 먼저 과정 회차를 생성하고 학생을 등록해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 과정 회차 선택 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📚 과정 회차 선택
        </label>
        <select
          value={selectedRoundId}
          onChange={(e) => setSelectedRoundId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {courseRounds.map((round: any) => (
            <option key={round.id} value={round.id}>
              {round.course_name || '과정'} - {round.round_number}차 (
              {new Date(round.start_date).toLocaleDateString()} ~{' '}
              {new Date(round.end_date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* 학생 선택 */}
      {selectedRoundId && trainees.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            👤 평가 대상 학생 선택
          </label>
          <select
            value={selectedTraineeId}
            onChange={(e) => setSelectedTraineeId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {trainees.map((trainee: any, index: number) => (
              <option key={trainee.user_id} value={trainee.user_id}>
                {index + 1}. {trainee.user_name} ({trainee.email})
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {trainees.findIndex((t) => t.user_id === selectedTraineeId) + 1} / {trainees.length}명
          </p>
        </div>
      )}

      {/* 평가 입력 폼 */}
      {selectedRoundId && selectedTraineeId && templateId && (
        <InstructorEvaluationForm
          courseRoundId={selectedRoundId}
          traineeId={selectedTraineeId}
          traineeName={selectedTrainee?.user_name || ''}
          templateId={templateId}
          onComplete={handleEvaluationComplete}
        />
      )}

      {selectedRoundId && trainees.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                등록된 학생이 없습니다
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                선택한 과정에 학생을 먼저 등록해주세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
