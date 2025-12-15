import React, { useState, useEffect } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';

// TODO: 실제 타입 정의 필요
interface PracticeEvaluation {
  id: string;
  title: string;
  description?: string;
  course_name: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'evaluated';
  score?: number;
  max_score: number;
  feedback?: string;
  submitted_at?: string;
  evaluated_at?: string;
}

const StudentPracticeDashboard: React.FC = () => {
  const [evaluations, setEvaluations] = useState<PracticeEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all');

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      // TODO: API 호출로 교육생의 실습 평가 목록 가져오기
      // const data = await EvaluationService.getMyEvaluations();

      // 임시 데이터
      const mockData: PracticeEvaluation[] = [
        {
          id: '1',
          title: '임플란트 실습 평가',
          description: '임플란트 식립 술식 평가',
          course_name: 'BS Basic',
          due_date: '2025-12-15',
          status: 'evaluated',
          score: 85,
          max_score: 100,
          feedback: '전반적으로 우수한 술식을 보여주셨습니다. 다만 초기 고정 시 각도 조절에 더 신경쓰시면 좋을 것 같습니다.',
          submitted_at: '2025-12-10',
          evaluated_at: '2025-12-12'
        },
        {
          id: '2',
          title: '보철물 제작 실습',
          description: '크라운 제작 및 세팅',
          course_name: 'BS Advanced',
          due_date: '2025-12-20',
          status: 'submitted',
          max_score: 100,
          submitted_at: '2025-12-11'
        }
      ];

      setEvaluations(mockData);
    } catch (error) {
      console.error('실습 평가 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvaluations = () => {
    if (filter === 'all') return evaluations;
    return evaluations.filter(e => e.status === filter);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
            제출 대기
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            평가 대기
          </span>
        );
      case 'evaluated':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            평가 완료
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const stats = {
    total: evaluations.length,
    pending: evaluations.filter(e => e.status === 'pending').length,
    submitted: evaluations.filter(e => e.status === 'submitted').length,
    evaluated: evaluations.filter(e => e.status === 'evaluated').length,
    averageScore: evaluations.filter(e => e.score).length > 0
      ? Math.round(evaluations.filter(e => e.score).reduce((sum, e) => sum + (e.score || 0), 0) / evaluations.filter(e => e.score).length)
      : 0
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">내 실습 평가</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">실습 과제 및 평가 결과를 확인하세요.</p>
        </div>

        {/* 통계 카드 */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-5 md:overflow-x-visible md:pb-0 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <BeakerIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 평가</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/30">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">제출 대기</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <ExclamationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평가 대기</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.submitted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/30">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평가 완료</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.evaluated}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-w-[280px] md:min-w-0 snap-start flex-shrink-0 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                <StarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 점수</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.averageScore}점</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: '전체', count: stats.total },
              { key: 'pending', label: '제출 대기', count: stats.pending },
              { key: 'submitted', label: '평가 대기', count: stats.submitted },
              { key: 'evaluated', label: '평가 완료', count: stats.evaluated }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* 평가 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              실습 평가 목록 ({getFilteredEvaluations().length})
            </h2>
          </div>

          {getFilteredEvaluations().length === 0 ? (
            <div className="p-12 text-center">
              <BeakerIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">실습 평가가 없습니다</h3>
              <p className="text-gray-600 dark:text-gray-400">담당 강사가 실습 평가를 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {getFilteredEvaluations().map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{evaluation.title}</h3>
                          {getStatusBadge(evaluation.status)}
                        </div>

                        {evaluation.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{evaluation.description}</p>
                        )}

                        <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span className="flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-1" />
                            {evaluation.course_name}
                          </span>
                          <span>마감일: {new Date(evaluation.due_date).toLocaleDateString()}</span>
                          {evaluation.submitted_at && (
                            <span>제출: {new Date(evaluation.submitted_at).toLocaleDateString()}</span>
                          )}
                        </div>

                        {evaluation.status === 'evaluated' && evaluation.score !== undefined && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">점수</span>
                              <span className={`text-2xl font-bold ${getScoreColor(evaluation.score, evaluation.max_score)}`}>
                                {evaluation.score}/{evaluation.max_score}
                              </span>
                            </div>
                            {evaluation.feedback && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">강사 피드백</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {evaluation.status === 'pending' && (
                        <button className="ml-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium">
                          제출하기
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default StudentPracticeDashboard;
