'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { PageContainer } from '../../src/components/common/PageContainer';
import { PageHeader } from '../../src/components/common/PageHeader';
import {
  TrophyIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface GradeData {
  course_name: string;
  exam_score: number;
  practice_score: number;
  attendance_rate: number;
  total_score: number;
  grade: string;
  rank?: number;
}

const ComprehensiveGradesPage: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setLoading(true);
      // TODO: API 호출로 성적 데이터 가져오기
      // const data = await GradeService.getMyGrades();

      // 임시 데이터
      const mockData: GradeData[] = [
        {
          course_name: 'BS Basic 과정',
          exam_score: 85,
          practice_score: 90,
          attendance_rate: 95,
          total_score: 88,
          grade: 'A',
          rank: 3
        }
      ];

      setGrades(mockData);
    } catch (error) {
      console.error('성적 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 dark:text-green-400';
      case 'B': return 'text-blue-600 dark:text-blue-400';
      case 'C': return 'text-yellow-600 dark:text-yellow-400';
      case 'D': return 'text-orange-600 dark:text-orange-400';
      case 'F': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (user?.role === 'trainee') {
    // 교육생용 성적 조회
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="내 성적"
            description="시험 및 실습 종합 성적을 확인하세요"
            badge="My Grades"
          />

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : grades.length > 0 ? (
            <>
              {/* 성적 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">평균 성적</div>
                    <TrophyIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {grades[0].total_score}점
                  </div>
                  <div className={`text-sm font-medium ${getGradeColor(grades[0].grade)}`}>
                    학점: {grades[0].grade}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">시험 점수</div>
                    <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {grades[0].exam_score}점
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">실습 점수</div>
                    <AcademicCapIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {grades[0].practice_score}점
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">출석률</div>
                    <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {grades[0].attendance_rate}%
                  </div>
                </div>
              </div>

              {/* 상세 성적표 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    과정별 상세 성적
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          과정명
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          시험
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          실습
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          출석률
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          총점
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          학점
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          석차
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {grades.map((grade, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {grade.course_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                            {grade.exam_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                            {grade.practice_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                            {grade.attendance_rate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {grade.total_score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-bold ${getGradeColor(grade.grade)}`}>
                              {grade.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                            {grade.rank ? `${grade.rank}위` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <TrophyIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                아직 등록된 성적이 없습니다.
              </p>
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  // 관리자/강사용 성적 관리
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="종합 성적 관리"
          description="교육생 성적 조회 및 관리"
          badge="Grade Management"
        />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            종합 성적 관리 기능은 준비 중입니다.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default ComprehensiveGradesPage;
