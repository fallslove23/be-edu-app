import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  TrophyIcon,

  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import type { Exam, ExamStatistics } from '../../types/exam.types';
import { ExamService } from '../../services/exam.services';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';

interface ExamResultsProps {
  exam: Exam;
  onBack: () => void;
  onRetake: () => void;
}

interface TraineeResult {
  trainee_id: string;
  trainee_name: string;
  best_score: number;
  attempts_count: number;
  last_attempt_date: string;
  passed: boolean;
  status: 'completed' | 'in_progress' | 'not_started';
}

const ExamResults: React.FC<ExamResultsProps> = ({
  exam,
  onBack,
  onRetake
}) => {
  const [results, setResults] = useState<TraineeResult[]>([]);
  const [statistics, setStatistics] = useState<ExamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'individual' | 'statistics'>('overview');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'in_progress'>('all');

  useEffect(() => {
    loadResults();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // 목업 데이터
      const mockResults: TraineeResult[] = [
        {
          trainee_id: '1',
          trainee_name: '김민수',
          best_score: 85,
          attempts_count: 2,
          last_attempt_date: '2024-08-20T14:30:00Z',
          passed: true,
          status: 'completed'
        },
        {
          trainee_id: '2',
          trainee_name: '이영희',
          best_score: 92,
          attempts_count: 1,
          last_attempt_date: '2024-08-20T15:45:00Z',
          passed: true,
          status: 'completed'
        },
        {
          trainee_id: '3',
          trainee_name: '박정우',
          best_score: 65,
          attempts_count: 3,
          last_attempt_date: '2024-08-20T16:20:00Z',
          passed: false,
          status: 'completed'
        },
        {
          trainee_id: '4',
          trainee_name: '최수현',
          best_score: 78,
          attempts_count: 1,
          last_attempt_date: '2024-08-20T13:15:00Z',
          passed: true,
          status: 'completed'
        },
        {
          trainee_id: '5',
          trainee_name: '정다은',
          best_score: 0,
          attempts_count: 0,
          last_attempt_date: '',
          passed: false,
          status: 'not_started'
        },
        {
          trainee_id: '6',
          trainee_name: '한성호',
          best_score: 45,
          attempts_count: 1,
          last_attempt_date: '',
          passed: false,
          status: 'in_progress'
        }
      ];

      setResults(mockResults);
    } catch (error) {
      console.error('Failed to load exam results:', error);
      setError('시험 결과를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await ExamService.getExamStatistics(exam.id);
      setStatistics(stats[0] || null);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // 결과 필터링 및 정렬
  const filteredAndSortedResults = results
    .filter(result => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'passed') return result.passed;
      if (filterStatus === 'failed') return !result.passed && result.status === 'completed';
      if (filterStatus === 'in_progress') return result.status === 'in_progress' || result.status === 'not_started';
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.best_score - a.best_score;
        case 'name':
          return a.trainee_name.localeCompare(b.trainee_name);
        case 'date':
          if (!a.last_attempt_date) return 1;
          if (!b.last_attempt_date) return -1;
          return new Date(b.last_attempt_date).getTime() - new Date(a.last_attempt_date).getTime();
        default:
          return 0;
      }
    });

  // 통계 계산
  const completedResults = results.filter(r => r.status === 'completed');
  const passedResults = completedResults.filter(r => r.passed);
  const failedResults = completedResults.filter(r => !r.passed);
  const inProgressResults = results.filter(r => r.status === 'in_progress');
  const notStartedResults = results.filter(r => r.status === 'not_started');

  const passRate = completedResults.length > 0 ? (passedResults.length / completedResults.length) * 100 : 0;
  const averageScore = completedResults.length > 0
    ? completedResults.reduce((sum, r) => sum + r.best_score, 0) / completedResults.length
    : 0;

  // 성적 분포
  const getScoreDistribution = () => {
    const ranges = [
      { label: '90-100점', min: 90, max: 100, count: 0, color: 'bg-green-500' },
      { label: '80-89점', min: 80, max: 89, count: 0, color: 'bg-blue-500' },
      { label: '70-79점', min: 70, max: 79, count: 0, color: 'bg-yellow-500' },
      { label: '60-69점', min: 60, max: 69, count: 0, color: 'bg-orange-500' },
      { label: '60점 미만', min: 0, max: 59, count: 0, color: 'bg-red-500' }
    ];

    completedResults.forEach(result => {
      const range = ranges.find(r => result.best_score >= r.min && result.best_score <= r.max);
      if (range) range.count++;
    });

    return ranges;
  };

  const scoreDistribution = getScoreDistribution();
  const maxCount = Math.max(...scoreDistribution.map(r => r.count), 1);

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto py-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
            <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">결과를 불러오는 중...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto py-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">결과 로딩 실패</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
            <button
              onClick={loadResults}
              className="btn-primary"
            >
              다시 시도
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}

        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={onBack} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeftIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <PageHeader
                title="시험 결과"
                description={`${exam.title} - ${exam.course_name}`}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={onRetake}
              className="btn-outline flex items-center shadow-sm"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              재응시
            </button>
            <button className="btn-outline flex items-center shadow-sm">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">

          {/* 요약 통계 */}
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{results.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">총 수강생</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{passedResults.length}</div>
              <div className="text-sm text-green-600/80 dark:text-green-400/80 font-medium">합격</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-100 dark:border-red-800 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{failedResults.length}</div>
              <div className="text-sm text-red-600/80 dark:text-red-400/80 font-medium">불합격</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 border border-yellow-100 dark:border-yellow-800 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{inProgressResults.length}</div>
              <div className="text-sm text-yellow-600/80 dark:text-yellow-400/80 font-medium">응시중</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{passRate.toFixed(1)}%</div>
              <div className="text-sm text-blue-600/80 dark:text-blue-400/80 font-medium">합격률</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{averageScore.toFixed(1)}</div>
              <div className="text-sm text-purple-600/80 dark:text-purple-400/80 font-medium">평균 점수</div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex">
              {[
                { id: 'overview', label: '개요' },
                { id: 'individual', label: '개별 결과' },
                { id: 'statistics', label: '통계 분석' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as 'overview' | 'individual' | 'statistics')}
                  className={`px-8 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 개요 탭 */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* 성적 분포 차트 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">성적 분포</h3>
                  <div className="space-y-4">
                    {scoreDistribution.map((range, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{range.label}</div>
                        <div className="flex-1 mx-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{range.count}명</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {completedResults.length > 0 ? ((range.count / completedResults.length) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg h-3">
                            <div
                              className={`h-3 rounded-full ${range.color} transition-all duration-300`}
                              style={{ width: `${(range.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 상위 수강생 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">상위 성과자</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {passedResults
                      .sort((a, b) => b.best_score - a.best_score)
                      .slice(0, 3)
                      .map((result, index) => (
                        <div key={result.trainee_id} className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-800/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-200">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrophyIcon className="w-20 h-20 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                              {index + 1}등
                            </span>
                            <TrophyIcon className={`h-5 w-5 ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' :
                              index === 1 ? 'text-gray-500 dark:text-gray-400' : 'text-orange-600 dark:text-orange-400'
                              }`} />
                          </div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-1">{result.trainee_name}</div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{result.best_score}<span className="text-sm text-gray-500 dark:text-gray-400 font-medium ml-1">점</span></div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2 bg-white/50 dark:bg-black/20 inline-block px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-800/20">
                            {result.attempts_count}회 응시
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 추가 개선이 필요한 수강생 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">추가 지원이 필요한 수강생</h3>
                  <div className="space-y-3">
                    {results
                      .filter(r => !r.passed || r.status !== 'completed')
                      .slice(0, 5)
                      .map(result => (
                        <div key={result.trainee_id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{result.trainee_name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {result.status === 'not_started' ? '미응시' :
                                result.status === 'in_progress' ? '응시중' :
                                  `${result.best_score}점 (${result.attempts_count}회 응시)`}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${result.status === 'not_started' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                            result.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                              'bg-destructive/10 dark:bg-red-900/30 text-destructive dark:text-red-400'
                            }`}>
                            {result.status === 'not_started' ? '미응시' :
                              result.status === 'in_progress' ? '응시중' : '불합격'}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* 개별 결과 탭 */}
            {selectedTab === 'individual' && (
              <div className="space-y-4">
                {/* 필터 및 정렬 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'passed' | 'failed' | 'in_progress')}
                        className="pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                        <option value="all">모든 상태</option>
                        <option value="passed">합격</option>
                        <option value="failed">불합격</option>
                        <option value="in_progress">진행중</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'date')}
                        className="pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                        <option value="score">점수 높은순</option>
                        <option value="name">이름순</option>
                        <option value="date">최신 응시순</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                    총 <span className="text-gray-900 dark:text-white font-bold">{filteredAndSortedResults.length}</span>명
                  </div>
                </div>

                {/* 결과 목록 */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          수강생
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          최고 점수
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          응시 횟수
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          최근 응시일
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAndSortedResults.map((result) => (
                        <tr key={result.trainee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {result.trainee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${result.best_score >= exam.passing_score ? 'text-green-600 dark:text-green-400' :
                              result.best_score > 0 ? 'text-destructive dark:text-red-400' : 'text-gray-400'
                              }`}>
                              {result.status === 'not_started' ? '-' : `${result.best_score}점`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {result.attempts_count}회
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {result.last_attempt_date
                              ? format(parseISO(result.last_attempt_date), 'MM/dd HH:mm', { locale: ko })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.passed ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                              result.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                result.status === 'not_started' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' :
                                  'bg-destructive/10 dark:bg-red-900/30 text-destructive dark:text-red-400'
                              }`}>
                              {result.passed && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                              {!result.passed && result.status === 'completed' && <XCircleIcon className="w-3 h-3 mr-1" />}
                              {result.passed ? '합격' :
                                result.status === 'in_progress' ? '응시중' :
                                  result.status === 'not_started' ? '미응시' : '불합격'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {result.status === 'completed' && (
                              <button className="btn-ghost text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center rounded-full">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                상세보기
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 통계 분석 탭 */}
            {selectedTab === 'statistics' && statistics && (
              <div className="space-y-6">
                {/* 전체 통계 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {statistics.avg_score.toFixed(1)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 점수</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800/30">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {statistics.pass_rate.toFixed(1)}%
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">합격률</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800/30">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {statistics.averageAttempts.toFixed(1)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 응시 횟수</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800/30">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {statistics.totalAttempts}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">총 응시 횟수</div>
                  </div>
                </div>

                {/* 상세 점수 분포 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">점수대별 분포</h3>
                  <div className="space-y-4">
                    {statistics.scoreDistribution.map((dist, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{dist.range}</div>
                        <div className="flex-1 mx-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{dist.count}명</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{dist.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg h-3">
                            <div
                              className="bg-blue-500 h-3 rounded-lg transition-all duration-300"
                              style={{ width: `${dist.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 개선 권장사항 */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300 mb-3">개선 권장사항</h3>
                  <div className="space-y-2 text-sm text-foreground dark:text-gray-300">
                    {passRate < 70 && (
                      <div>• 합격률이 {passRate.toFixed(1)}%로 낮습니다. 교육 내용을 보완하거나 난이도를 조정해보세요.</div>
                    )}
                    {averageScore < exam.passing_score + 10 && (
                      <div>• 평균 점수가 합격 기준에 근접합니다. 추가 학습 자료 제공을 고려해보세요.</div>
                    )}
                    {failedResults.length > 0 && (
                      <div>• {failedResults.length}명의 불합격자가 있습니다. 개별 상담이나 보충 교육을 제공해보세요.</div>
                    )}
                    {notStartedResults.length > 0 && (
                      <div>• {notStartedResults.length}명이 아직 응시하지 않았습니다. 응시 독려가 필요합니다.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ExamResults;