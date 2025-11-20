import React from 'react';
import { ArrowLeftIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
import type { PracticeEvaluation } from '../../types/practice.types';

interface PracticeResultsProps {
  practice: PracticeEvaluation;
  onBack: () => void;
}

const PracticeResults: React.FC<PracticeResultsProps> = ({
  practice,
  onBack
}) => {
  // Mock results data
  const mockResults = [
    {
      id: '1',
      traineeName: '김영희',
      score: 85,
      grade: 'B+',
      completedAt: '2024-01-25T14:30:00Z',
      evaluatorNotes: '전반적으로 우수한 수행을 보였으나, 클로징 부분에서 개선이 필요함'
    },
    {
      id: '2',
      traineeName: '박철수',
      score: 92,
      grade: 'A',
      completedAt: '2024-01-25T15:45:00Z',
      evaluatorNotes: '매우 자연스러운 대화 진행과 고객 니즈 파악이 뛰어남'
    },
    {
      id: '3',
      traineeName: '이민정',
      score: 78,
      grade: 'B',
      completedAt: '2024-01-25T16:20:00Z',
      evaluatorNotes: '기본기는 탄탄하나 자신감 있는 태도 개발이 필요'
    }
  ];

  const averageScore = mockResults.reduce((sum, result) => sum + result.score, 0) / mockResults.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
              {practice.title} - 실습 결과
            </h1>
            <p className="text-gray-600">실습 평가 결과와 피드백을 확인합니다.</p>
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">참여자 수</p>
              <p className="text-2xl font-semibold text-gray-900">{mockResults.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">평균 점수</p>
              <p className="text-2xl font-semibold text-gray-900">{averageScore.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">최고 점수</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.max(...mockResults.map(r => r.score))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">합격률</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((mockResults.filter(r => r.score >= 70).length / mockResults.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 개별 결과 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">개별 평가 결과</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  교육생
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  완료 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평가자 의견
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{result.traineeName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{result.score}점</div>
                    <div className="w-20 bg-gray-200 rounded-lg h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          result.score >= 90 ? 'bg-green-500' :
                          result.score >= 80 ? 'bg-blue-500' :
                          result.score >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${result.score}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      result.score >= 90 ? 'bg-green-500/10 text-green-700' :
                      result.score >= 80 ? 'bg-blue-100 text-blue-800' :
                      result.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(result.completedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={result.evaluatorNotes}>
                      {result.evaluatorNotes}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 평가 기준별 분석 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">평가 기준별 분석</h2>
        <div className="space-y-4">
          {practice.evaluation_criteria.map((criteria, index) => (
            <div key={criteria.id}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{criteria.name}</span>
                <span className="text-sm text-gray-500">
                  평균 {Math.floor(Math.random() * 20) + 80}% ({criteria.max_points}점 만점)
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-lg h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-lg"
                  style={{ width: `${Math.floor(Math.random() * 20) + 80}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeResults;