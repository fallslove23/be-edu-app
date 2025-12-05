import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  XMarkIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import type { Exam } from '../../types/exam.types';
import { supabase } from '@/services/supabase';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ExamAttempt {
  id: string;
  user_id: string;
  user_name: string;
  score: number;
  progress: number;
  status: 'in_progress' | 'completed' | 'pending';
  started_at: string;
  completed_at?: string;
  answers: Record<string, any>;
}

interface QuestionAnalytics {
  question_number: number;
  question_text: string;
  correct_count: number;
  total_count: number;
  correct_rate: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface InteractiveExamAnalyticsProps {
  exam: Exam;
  onClose: () => void;
}

export default function InteractiveExamAnalytics({
  exam,
  onClose,
}: InteractiveExamAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'students' | 'trends'>('overview');
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Data
  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          user_id:trainee_id,
          score,
          status,
          started_at,
          submitted_at,
          answers,
          trainee:trainees(name, user:users(name))
        `)
        .eq('exam_id', exam.id);

      if (attemptsError) throw attemptsError;

      // Map to local interface
      const loadedAttempts: ExamAttempt[] = attemptsData.map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        user_name: a.trainee?.name || a.trainee?.user?.name || 'Unknown',
        score: a.score || 0,
        progress: a.status === 'completed' ? 100 : 0, // Simplified
        status: a.status,
        started_at: a.started_at,
        completed_at: a.submitted_at,
        answers: a.answers || {},
      }));

      setAttempts(loadedAttempts);

      // 2. Fetch Questions for Item Analysis
      const { data: questionsData, error: questionsError } = await supabase
        .from('exam_questions')
        .select(`
          question_id,
          order_index,
          question:questions (
            id,
            question_text,
            correct_answer,
            difficulty,
            type
          )
        `)
        .eq('exam_id', exam.id)
        .order('order_index');

      if (questionsError) throw questionsError;

      // 3. Compute Question Analytics
      const qAnalytics: QuestionAnalytics[] = questionsData.map((eq: { question: any }, index: number) => {
        const q = eq.question;
        const qId = q.id;

        let correctCount = 0;
        let totalCount = 0;

        loadedAttempts.forEach(attempt => {
          if (attempt.status === 'completed' && attempt.answers) {
            totalCount++;
            const userAnswer = attempt.answers[qId]?.answer || attempt.answers[qId]; // Handle different answer structures if any
            // Simple equality check for auto-gradable questions.
            // Note: deeply equal check might be needed for arrays/objects
            // For now assuming primitive or string comparison
            if (JSON.stringify(userAnswer) === JSON.stringify(q.correct_answer)) {
              correctCount++;
            }
          }
        });

        return {
          question_number: index + 1,
          question_text: q.question_text || `Question ${index + 1}`,
          correct_count: correctCount,
          total_count: totalCount,
          correct_rate: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
          difficulty: q.difficulty || 'medium'
        };
      });

      setQuestionAnalytics(qAnalytics);

    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [exam.id]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // 통계 계산
  const stats = useMemo(() => {
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const scores = completedAttempts.map(a => a.score);

    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      passingRate: completedAttempts.length > 0
        ? Math.round((completedAttempts.filter(a => a.score >= exam.passing_score).length / completedAttempts.length) * 100)
        : 0,
    };
  }, [attempts, exam.passing_score]);

  // 점수 분포 데이터
  const scoreDistributionData = useMemo(() => {
    const ranges = ['0-59', '60-69', '70-79', '80-89', '90-100'];
    const counts = ranges.map(() => 0);

    attempts.forEach(attempt => {
      if (attempt.status === 'completed') {
        const score = attempt.score;
        if (score < 60) counts[0]++;
        else if (score < 70) counts[1]++;
        else if (score < 80) counts[2]++;
        else if (score < 90) counts[3]++;
        else counts[4]++;
      }
    });

    return {
      labels: ranges,
      datasets: [
        {
          label: '응시자 수',
          data: counts,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',   // red
            'rgba(251, 146, 60, 0.8)',  // orange
            'rgba(250, 204, 21, 0.8)',  // yellow
            'rgba(34, 197, 94, 0.8)',   // green
            'rgba(59, 130, 246, 0.8)',  // blue
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(251, 146, 60)',
            'rgb(250, 204, 21)',
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [attempts]);

  // 문제별 정답률 데이터
  const questionAccuracyData = useMemo(() => {
    return {
      labels: questionAnalytics.map(q => `Q${q.question_number}`),
      datasets: [
        {
          label: '정답률 (%)',
          data: questionAnalytics.map(q => q.correct_rate),
          backgroundColor: questionAnalytics.map(q => {
            if (q.correct_rate >= 80) return 'rgba(34, 197, 94, 0.8)';
            if (q.correct_rate >= 60) return 'rgba(250, 204, 21, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: questionAnalytics.map(q => {
            if (q.correct_rate >= 80) return 'rgb(34, 197, 94)';
            if (q.correct_rate >= 60) return 'rgb(250, 204, 21)';
            return 'rgb(239, 68, 68)';
          }),
          borderWidth: 2,
        },
      ],
    };
  }, [questionAnalytics]);

  // 시간대별 응시 추세
  const timeSeriesData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const counts = hours.map(() => 0);

    attempts.forEach(attempt => {
      const hour = new Date(attempt.started_at).getHours();
      counts[hour]++;
    });

    return {
      labels: hours.map(h => `${h}:00`),
      datasets: [
        {
          label: '응시자 수',
          data: counts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [attempts]);

  // 난이도별 분포
  const difficultyDistributionData = useMemo(() => {
    const easy = questionAnalytics.filter(q => q.difficulty === 'easy').length;
    const medium = questionAnalytics.filter(q => q.difficulty === 'medium').length;
    const hard = questionAnalytics.filter(q => q.difficulty === 'hard').length;

    return {
      labels: ['쉬움', '보통', '어려움'],
      datasets: [
        {
          data: [easy, medium, hard],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(250, 204, 21, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(250, 204, 21)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [questionAnalytics]);

  // Chart 옵션
  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}${activeTab === 'questions' ? '%' : '명'}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: activeTab === 'questions' ? 100 : undefined,
      },
    },
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
    },
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ChartBarIcon className="h-6 w-6" />
              시험 결과 상세 분석
            </h2>
            <p className="text-blue-100 mt-1">{exam.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-100">총 응시자</div>
            <div className="text-2xl font-bold mt-1">{stats.totalAttempts}명</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-100">완료</div>
            <div className="text-2xl font-bold mt-1">{stats.completedAttempts}명</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-100">평균 점수</div>
            <div className="text-2xl font-bold mt-1">{stats.averageScore}점</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-100">최고 점수</div>
            <div className="text-2xl font-bold mt-1">{stats.highestScore}점</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-100">최저 점수</div>
            <div className="text-2xl font-bold mt-1">{stats.lowestScore}점</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="text-sm text-blue-100 font-medium">합격률</div>
            <div className="text-2xl font-bold mt-1">{stats.passingRate}%</div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2">
        <div className="flex space-x-1 p-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 rounded-full font-medium transition-all ${activeTab === 'overview'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            전체 개요
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 px-4 py-3 rounded-full font-medium transition-all ${activeTab === 'questions'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
          >
            <AcademicCapIcon className="h-5 w-5 inline mr-2" />
            문제별 분석
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-4 py-3 rounded-full font-medium transition-all ${activeTab === 'students'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
          >
            <UserGroupIcon className="h-5 w-5 inline mr-2" />
            학습자 분석
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'trends'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700'
              : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <ClockIcon className="h-5 w-5 inline mr-2" />
            추세 분석
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 점수 분포 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">점수 분포</h3>
              <div className="h-80">
                <Bar data={scoreDistributionData} options={barChartOptions} />
              </div>
            </div>

            {/* 난이도 분포 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">문제 난이도 분포</h3>
              <div className="h-80">
                <Doughnut data={difficultyDistributionData} options={doughnutChartOptions} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* 문제별 정답률 차트 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">문제별 정답률</h3>
              <div className="h-96">
                <Bar data={questionAccuracyData} options={barChartOptions} />
              </div>
            </div>

            {/* 문제별 상세 테이블 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">문제별 상세 분석</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white rounded-l-lg">문제</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">난이도</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">정답자/전체</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">정답률</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white rounded-r-lg">평가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {questionAnalytics.map((q) => (
                      <tr key={q.question_number} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">문제 {q.question_number}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${q.difficulty === 'easy' ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                            q.difficulty === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              'bg-destructive/10 dark:bg-red-900/30 text-destructive dark:text-red-400'
                            }`}>
                            {q.difficulty === 'easy' ? '쉬움' : q.difficulty === 'medium' ? '보통' : '어려움'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-300">
                          {q.correct_count} / {q.total_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          <span className={
                            q.correct_rate >= 80 ? 'text-green-600 dark:text-green-400' :
                              q.correct_rate >= 60 ? 'text-gray-900 dark:text-gray-300' :
                                'text-destructive dark:text-red-400'
                          }>
                            {q.correct_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {q.correct_rate >= 80 ? '✅ 우수' :
                            q.correct_rate >= 60 ? '⚠️ 보통' :
                              '❌ 개선 필요'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* 학습자별 성과 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">학습자별 성과</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">순위</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">이름</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">점수</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">소요 시간</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {attempts
                      .filter(a => a.status === 'completed')
                      .sort((a, b) => b.score - a.score)
                      .map((attempt, index) => {
                        const duration = attempt.completed_at
                          ? Math.floor(
                            (new Date(attempt.completed_at).getTime() -
                              new Date(attempt.started_at).getTime()) /
                            60000
                          )
                          : 0;

                        return (
                          <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                              {index === 0 && '🥇'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                              {index > 2 && index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">{attempt.user_name}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className={`font-semibold ${attempt.score >= exam.passing_score ? 'text-green-600 dark:text-green-400' : 'text-destructive dark:text-red-400'
                                }`}>
                                {attempt.score}점
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{duration}분</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${attempt.score >= exam.passing_score
                                ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                : 'bg-destructive/10 dark:bg-red-900/30 text-destructive dark:text-red-400'
                                }`}>
                                {attempt.score >= exam.passing_score ? '합격' : '불합격'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* 시간대별 응시 추세 */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">시간대별 응시 추세</h3>
              <div className="h-96">
                <Line data={timeSeriesData} options={lineChartOptions} />
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>분석:</strong> 대부분의 응시자가 오전 9시~12시 사이에 시험을 응시합니다.
              </p>
            </div>

            {/* 인사이트 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 shadow-sm">
                <div className="text-green-600 dark:text-green-400 font-bold mb-2">✨ 우수 문제</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                  {questionAnalytics.filter(q => q.correct_rate >= 80).length}개
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">정답률 80% 이상</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 shadow-sm">
                <div className="text-yellow-700 dark:text-yellow-400 font-bold mb-2">⚠️ 주의 문제</div>
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                  {questionAnalytics.filter(q => q.correct_rate >= 60 && q.correct_rate < 80).length}개
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">정답률 60-80%</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-destructive/50 dark:border-red-800 rounded-2xl p-6 shadow-sm">
                <div className="text-destructive dark:text-red-400 font-bold mb-2">🚨 개선 필요</div>
                <div className="text-2xl font-bold text-destructive dark:text-red-200 mb-2">
                  {questionAnalytics.filter(q => q.correct_rate < 60).length}개
                </div>
                <p className="text-sm text-destructive dark:text-red-300 font-medium">정답률 60% 미만</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          마지막 업데이트: {new Date().toLocaleString('ko-KR')}
        </div>
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
