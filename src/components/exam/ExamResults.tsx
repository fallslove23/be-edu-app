import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import type { Exam, ExamResult, ExamAttempt, ExamStatistics } from '../../types/exam.types';
import { ExamService } from '../../services/exam.services';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

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
      setStatistics(stats);
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">결과를 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={loadResults}
                className="btn-danger"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
                시험 결과
              </h1>
              <p className="mt-1 text-gray-600">{exam.title} - {exam.course_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onRetake}
              className="flex items-center px-4 py-2 text-blue-700 border border-blue-300 rounded-full hover:bg-blue-50 transition-colors"
            >
              재응시
            </button>
            <button className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{results.length}</div>
            <div className="text-sm text-gray-600">총 수강생</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{passedResults.length}</div>
            <div className="text-sm text-gray-600">합격</div>
          </div>
          <div className="bg-destructive/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-destructive">{failedResults.length}</div>
            <div className="text-sm text-gray-600">불합격</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">{inProgressResults.length}</div>
            <div className="text-sm text-gray-600">응시중</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{passRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">합격률</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{averageScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">평균 점수</div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              개요
            </button>
            <button
              onClick={() => setSelectedTab('individual')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'individual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              개별 결과
            </button>
            <button
              onClick={() => setSelectedTab('statistics')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              통계 분석
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 개요 탭 */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* 성적 분포 차트 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">성적 분포</h3>
                <div className="space-y-4">
                  {scoreDistribution.map((range, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600">{range.label}</div>
                      <div className="flex-1 mx-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{range.count}명</span>
                          <span className="text-sm text-gray-500">
                            {completedResults.length > 0 ? ((range.count / completedResults.length) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-lg h-3">
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">상위 성과자</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {passedResults
                    .sort((a, b) => b.best_score - a.best_score)
                    .slice(0, 3)
                    .map((result, index) => (
                      <div key={result.trainee_id} className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-yellow-800">
                            {index + 1}등
                          </span>
                          <TrophyIcon className={`h-5 w-5 ${
                            index === 0 ? 'text-foreground' :
                            index === 1 ? 'text-gray-500' : 'text-orange-600'
                          }`} />
                        </div>
                        <div className="text-lg font-bold text-gray-900">{result.trainee_name}</div>
                        <div className="text-2xl font-bold text-foreground">{result.best_score}점</div>
                        <div className="text-sm text-gray-600">
                          {result.attempts_count}회 응시
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* 추가 개선이 필요한 수강생 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">추가 지원이 필요한 수강생</h3>
                <div className="space-y-3">
                  {results
                    .filter(r => !r.passed || r.status !== 'completed')
                    .slice(0, 5)
                    .map(result => (
                      <div key={result.trainee_id} className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{result.trainee_name}</div>
                          <div className="text-sm text-gray-600">
                            {result.status === 'not_started' ? '미응시' :
                             result.status === 'in_progress' ? '응시중' :
                             `${result.best_score}점 (${result.attempts_count}회 응시)`}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          result.status === 'not_started' ? 'bg-gray-100 text-gray-800' :
                          result.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-destructive/10 text-destructive'
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="passed">합격</option>
                    <option value="failed">불합격</option>
                    <option value="in_progress">진행중</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="score">점수순</option>
                    <option value="name">이름순</option>
                    <option value="date">응시일순</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-600">
                  {filteredAndSortedResults.length}명 표시
                </div>
              </div>

              {/* 결과 목록 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수강생
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        점수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        응시 횟수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        최근 응시일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedResults.map((result) => (
                      <tr key={result.trainee_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {result.trainee_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            result.best_score >= exam.passing_score ? 'text-green-600' :
                            result.best_score > 0 ? 'text-destructive' : 'text-gray-400'
                          }`}>
                            {result.status === 'not_started' ? '-' : `${result.best_score}점`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.attempts_count}회
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.last_attempt_date 
                            ? format(parseISO(result.last_attempt_date), 'MM/dd HH:mm', { locale: ko })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.passed ? 'bg-green-500/10 text-green-700' :
                            result.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            result.status === 'not_started' ? 'bg-gray-100 text-gray-800' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {result.passed && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                            {!result.passed && result.status === 'completed' && <XCircleIcon className="w-3 h-3 mr-1" />}
                            {result.passed ? '합격' :
                             result.status === 'in_progress' ? '응시중' :
                             result.status === 'not_started' ? '미응시' : '불합격'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.status === 'completed' && (
                            <button className="text-blue-600 hover:text-blue-700 flex items-center rounded-full">
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
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {statistics.averageScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">평균 점수</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {statistics.passRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">합격률</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {statistics.averageAttempts.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">평균 응시 횟수</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {statistics.totalAttempts}
                  </div>
                  <div className="text-sm text-gray-600">총 응시 횟수</div>
                </div>
              </div>

              {/* 상세 점수 분포 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">점수대별 분포</h3>
                <div className="space-y-4">
                  {statistics.scoreDistribution.map((dist, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600">{dist.range}</div>
                      <div className="flex-1 mx-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{dist.count}명</span>
                          <span className="text-sm text-gray-500">{dist.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-lg h-3">
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-3">개선 권장사항</h3>
                <div className="space-y-2 text-sm text-foreground">
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
  );
};

export default ExamResults;