'use client';

/**
 * 종합 성적 페이지
 * - 과정 회차 선택 + 종합 성적표 대시보드
 */

import React, { useState, useEffect } from 'react';
import { PageContainer } from '../common/PageContainer';
import { courseTemplateService } from '../../services/course-template.service';
import ComprehensiveGradesDashboard from './ComprehensiveGradesDashboard';
import type { CourseRound } from '../../types/course-template.types';

export default function ComprehensiveGradesPage() {
  const [courseRounds, setCourseRounds] = useState<CourseRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseRounds();
  }, []);

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

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </PageContainer>
    );
  }

  if (courseRounds.length === 0) {
    return (
      <PageContainer>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                진행 중인 과정이 없습니다
              </h3>
              <p className="text-foreground dark:text-yellow-300">
                성적을 확인하려면 먼저 과정 회차를 생성해주세요.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 과정 회차 선택 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📚 과정 회차 선택
        </label>
        <select
          value={selectedRoundId}
          onChange={(e) => setSelectedRoundId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

      {/* 종합 성적표 */}
      {selectedRoundId && <ComprehensiveGradesDashboard courseRoundId={selectedRoundId} />}
    </PageContainer>
  );
}
