/**
 * 종합 성적 대시보드
 * - 과정별 전체 성적 조회
 * - 수료/미수료 현황
 * - 상세 성적표
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { comprehensiveGradeService } from '../../services/evaluation.service';
import type {
  ComprehensiveGradeWithTrainee,
  EvaluationStatistics,
  ComponentScore,
} from '../../types/evaluation.types';

interface ComprehensiveGradesDashboardProps {
  courseRoundId: string;
}

export default function ComprehensiveGradesDashboard({ courseRoundId }: ComprehensiveGradesDashboardProps) {
  const [grades, setGrades] = useState<ComprehensiveGradeWithTrainee[]>([]);
  const [statistics, setStatistics] = useState<EvaluationStatistics | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<ComprehensiveGradeWithTrainee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, [courseRoundId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gradesData, stats] = await Promise.all([
        comprehensiveGradeService.getWithTrainees(courseRoundId),
        comprehensiveGradeService.getStatistics(courseRoundId),
      ]);

      setGrades(gradesData);
      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateRanks = async () => {
    try {
      setCalculating(true);
      await comprehensiveGradeService.updateRanks(courseRoundId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '등수 재계산 실패');
    } finally {
      setCalculating(false);
    }
  };

  const getGradeColor = (score: number, passingScore?: number) => {
    if (!passingScore) return 'text-gray-900 dark:text-gray-100';
    if (score >= passingScore) return 'text-green-600 dark:text-green-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGradeBgColor = (score: number, passingScore?: number) => {
    if (!passingScore) return 'bg-gray-100 dark:bg-gray-700';
    if (score >= passingScore) return 'bg-green-100 dark:bg-green-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">전체 인원</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.total_trainees}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">수료</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.passed_count}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">미수료</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statistics.failed_count}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.average_score.toFixed(1)}점
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">종합 성적표</h2>
        <button
          onClick={handleRecalculateRanks}
          disabled={calculating}
          className="btn-primary"
        >
          <ArrowPathIcon className={`w-5 h-5 ${calculating ? 'animate-spin' : ''}`} />
          등수 재계산
        </button>
      </div>

      {/* 성적 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  등수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  총점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  수료 여부
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {grades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {grade.rank || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {grade.trainee.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {grade.trainee.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-2xl font-bold ${getGradeColor(grade.total_score, grade.passing_score)}`}>
                      {grade.total_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      / 100점
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {grade.is_passed ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        수료
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        미수료
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedGrade(grade)}
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <DocumentTextIcon className="w-5 h-5 mr-1" />
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {grades.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">아직 평가된 학생이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedGrade.trainee.name} 상세 성적표
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedGrade.trainee.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGrade(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* 최종 점수 */}
              <div className={`p-6 rounded-lg mb-6 ${getGradeBgColor(selectedGrade.total_score, selectedGrade.passing_score)}`}>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">최종 점수</p>
                  <p className={`text-5xl font-bold ${getGradeColor(selectedGrade.total_score, selectedGrade.passing_score)}`}>
                    {selectedGrade.total_score.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    수료 기준: {selectedGrade.passing_score}점
                  </p>
                  <div className="mt-4">
                    {selectedGrade.is_passed ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                        <CheckCircleIcon className="w-6 h-6 mr-2" />
                        수료
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                        <XCircleIcon className="w-6 h-6 mr-2" />
                        미수료
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 구성 요소별 점수 */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  평가 항목별 상세
                </h4>

                {selectedGrade.component_scores.map((component: ComponentScore) => (
                  <div
                    key={component.component_id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {component.name}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          가중치: {component.weight}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {component.raw_score.toFixed(1)}점
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          → 가중 {component.weighted_score.toFixed(1)}점
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    {component.breakdown && Object.keys(component.breakdown).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          상세 내역
                        </p>
                        <div className="space-y-2">
                          {Object.entries(component.breakdown).map(([key, value]: [string, any]) => (
                            <div
                              key={key}
                              className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-900/50 rounded p-2"
                            >
                              <span className="text-gray-700 dark:text-gray-300">{key}</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {typeof value === 'object'
                                  ? `${value.score}/${value.max} (${value.normalized?.toFixed(1) || 0}점, ${value.weight}%)`
                                  : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 메타 정보 */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">등수</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedGrade.rank} / {selectedGrade.total_trainees}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">계산 방식</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedGrade.calculation_method === 'auto' ? '자동 계산' : '수동 입력'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">계산 일시</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(selectedGrade.calculated_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 닫기 버튼 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedGrade(null)}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
