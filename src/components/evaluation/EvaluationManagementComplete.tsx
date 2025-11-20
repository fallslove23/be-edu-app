/**
 * 평가 관리 완전판
 * - 평가 템플릿, 강사 평가, 종합 성적을 탭으로 구성
 * - 과정 회차 선택 기능 포함
 */

import React, { useState, useEffect } from 'react';
import { courseTemplateService } from '../../services/course-template.service';
import { useAuth } from '../../contexts/AuthContext';
import EvaluationTemplateManagement from './EvaluationTemplateManagement';
import InstructorEvaluationForm from './InstructorEvaluationForm';
import ComprehensiveGradesDashboard from './ComprehensiveGradesDashboard';
import type { CourseRound } from '../../types/course-template.types';

type Tab = 'templates' | 'instructor' | 'grades';

export default function EvaluationManagementComplete() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [courseRounds, setCourseRounds] = useState<CourseRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseRounds();
  }, []);

  useEffect(() => {
    if (selectedRoundId) {
      loadTrainees();
    }
  }, [selectedRoundId]);

  const loadCourseRounds = async () => {
    try {
      setLoading(true);
      const rounds = await courseTemplateService.getRounds({
        status: 'in_progress',
      });
      setCourseRounds(rounds || []);

      // 첫 번째 과정 자동 선택
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

      // 첫 번째 학생 자동 선택
      if (enrollments && enrollments.length > 0) {
        setSelectedTraineeId(enrollments[0].user_id);
      }
    } catch (error) {
      console.error('Failed to load trainees:', error);
    }
  };

  const selectedRound = courseRounds.find((r) => r.id === selectedRoundId);
  const selectedTrainee = trainees.find((t) => t.user_id === selectedTraineeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 과정 회차 선택 */}
      {(activeTab === 'instructor' || activeTab === 'grades') && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📚 과정 회차 선택
          </label>
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">선택하세요</option>
            {courseRounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.course_name || round.title} - {round.round_number}차 (
                {new Date(round.start_date).toLocaleDateString()} ~{' '}
                {new Date(round.end_date).toLocaleDateString()})
              </option>
            ))}
          </select>

          {courseRounds.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              진행 중인 과정 회차가 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 학생 선택 (강사 평가 탭) */}
      {activeTab === 'instructor' && selectedRoundId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            👤 평가 대상 학생
          </label>
          <select
            value={selectedTraineeId}
            onChange={(e) => setSelectedTraineeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">선택하세요</option>
            {trainees.map((trainee) => (
              <option key={trainee.user_id} value={trainee.user_id}>
                {trainee.user_name || trainee.name} ({trainee.email})
              </option>
            ))}
          </select>

          {trainees.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              등록된 학생이 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            ⚙️ 평가 템플릿
          </button>
          <button
            onClick={() => setActiveTab('instructor')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'instructor'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            ✏️ 강사 평가
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'grades'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            📊 종합 성적
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'templates' && <EvaluationTemplateManagement />}

        {activeTab === 'instructor' && (
          <>
            {selectedRoundId && selectedTraineeId && selectedRound ? (
              <InstructorEvaluationForm
                courseRoundId={selectedRoundId}
                traineeId={selectedTraineeId}
                traineeName={selectedTrainee?.user_name || selectedTrainee?.name || ''}
                templateId={selectedRound.template_id || ''}
                onComplete={() => {
                  // 다음 학생으로 이동
                  const currentIndex = trainees.findIndex((t) => t.user_id === selectedTraineeId);
                  if (currentIndex < trainees.length - 1) {
                    setSelectedTraineeId(trainees[currentIndex + 1].user_id);
                  } else {
                    alert('모든 학생 평가가 완료되었습니다!');
                  }
                }}
              />
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <p className="text-yellow-800 dark:text-yellow-200">
                  {!selectedRoundId
                    ? '과정 회차를 선택해주세요.'
                    : !selectedTraineeId
                    ? '평가할 학생을 선택해주세요.'
                    : '평가 템플릿이 설정되지 않았습니다.'}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'grades' && (
          <>
            {selectedRoundId ? (
              <ComprehensiveGradesDashboard courseRoundId={selectedRoundId} />
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <p className="text-yellow-800 dark:text-yellow-200">과정 회차를 선택해주세요.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
