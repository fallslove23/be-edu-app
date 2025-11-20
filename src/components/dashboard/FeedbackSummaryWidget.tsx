/**
 * 대시보드 - 만족도 평가 요약 위젯
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { FeedbackStatistics, CourseRoundFeedbackSummary } from '../../types/feedback.types';
import { getFeedbackStatistics, getCourseRoundFeedbackSummaries } from '../../services/feedback.service';

interface FeedbackSummaryWidgetProps {
  courseRoundId?: string; // 특정 과정 차수
  showTrend?: boolean;    // 트렌드 표시 여부
}

export const FeedbackSummaryWidget: React.FC<FeedbackSummaryWidgetProps> = ({
  courseRoundId,
  showTrend = false
}) => {
  const [statistics, setStatistics] = useState<FeedbackStatistics | null>(null);
  const [summaries, setSummaries] = useState<CourseRoundFeedbackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (courseRoundId) {
        // 특정 과정 차수의 통계
        const stats = await getFeedbackStatistics(courseRoundId);
        setStatistics(stats);
      } else {
        // 전체 과정 요약
        const allSummaries = await getCourseRoundFeedbackSummaries();
        setSummaries(allSummaries.slice(0, 5)); // 최근 5개
      }
    } catch (err) {
      // 에러 객체를 더 자세히 로깅
      console.error('Failed to load feedback data:', err);
      
      // 에러 메시지 추출
      let errorMessage = '만족도 평가 데이터를 불러오는데 실패했습니다.';
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (err && typeof err === 'object') {
        // Supabase 에러 객체 처리
        const errorObj = err as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error?.message) {
          errorMessage = errorObj.error.message;
        } else if (errorObj.code) {
          errorMessage = `데이터베이스 오류 (${errorObj.code})`;
        }
      }
      
      console.error('Error details:', {
        message: errorMessage,
        error: err,
        courseRoundId,
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [courseRoundId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderStarRating = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;

    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400">
            {i < fullStars ? '★' : (i === fullStars && hasHalfStar ? '⯨' : '☆')}
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{score.toFixed(1)}</span>
      </div>
    );
  };

  const renderProgressBar = (value: number, max: number = 5) => {
    const percentage = (value / max) * 100;
    const color = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    // 데이터베이스 테이블이 없거나 데이터가 없는 경우 위젯을 숨김
    console.warn('만족도 평가 위젯: 데이터를 불러올 수 없어 숨김 처리됨', error);
    return null;
  }

  // 특정 과정 차수의 상세 통계
  if (courseRoundId && statistics) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            만족도 평가 결과
          </h3>
          <a
            href="https://sseducationfeedback.info/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>상세보기</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* 응답률 */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">응답률</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {statistics.response_rate.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {statistics.response_count}/{statistics.total_trainees}명 응답
          </p>
          {renderProgressBar(statistics.response_rate, 100)}
        </div>

        {/* 종합 만족도 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">종합 만족도</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.overall_average.toFixed(1)} / 5.0
            </span>
          </div>
          {renderStarRating(statistics.overall_average)}
        </div>

        {/* 세부 만족도 */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">📚 과정 만족도</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {statistics.course_satisfaction.overall_satisfaction.toFixed(1)}
              </span>
            </div>
            {renderProgressBar(statistics.course_satisfaction.overall_satisfaction)}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">👨‍🏫 강사 만족도</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {statistics.instructor_satisfaction.overall_satisfaction.toFixed(1)}
              </span>
            </div>
            {renderProgressBar(statistics.instructor_satisfaction.overall_satisfaction)}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">⚙️ 운영 만족도</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {statistics.operation_satisfaction.overall_satisfaction.toFixed(1)}
              </span>
            </div>
            {renderProgressBar(statistics.operation_satisfaction.overall_satisfaction)}
          </div>
        </div>

        {/* 분포도 */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">점수 분포</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">매우 만족 (5점)</span>
              <span className="font-medium text-green-600">{statistics.distribution.very_satisfied}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">만족 (4점)</span>
              <span className="font-medium text-blue-600">{statistics.distribution.satisfied}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">보통 (3점)</span>
              <span className="font-medium text-yellow-600">{statistics.distribution.neutral}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">불만족 (2점 이하)</span>
              <span className="font-medium text-red-600">
                {statistics.distribution.dissatisfied + statistics.distribution.very_dissatisfied}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 전체 과정 요약
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          최근 만족도 평가
        </h3>
        <a
          href="https://sseducationfeedback.info/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>전체보기</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>아직 평가 데이터가 없습니다.</p>
          <p className="text-sm mt-2">과정 종료 후 교육생들에게 만족도 평가를 요청하세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.map((summary) => (
            <div
              key={summary.course_round_id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{summary.course_name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{summary.course_period}</p>
                </div>
                {summary.is_completed && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                    완료
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">응답률</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {summary.response_rate.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">종합 만족도</p>
                  {renderStarRating(summary.overall_avg)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-gray-600 dark:text-gray-400">과정</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">{summary.course_avg.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="text-gray-600 dark:text-gray-400">강사</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">{summary.instructor_avg.toFixed(1)}</p>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <p className="text-gray-600 dark:text-gray-400">운영</p>
                  <p className="font-semibold text-purple-600 dark:text-purple-400">{summary.operation_avg.toFixed(1)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
