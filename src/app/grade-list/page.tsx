'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  AcademicCapIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { comprehensiveGradeService } from '@/services/evaluation.service';
import type { ComprehensiveGradeWithTrainee, EvaluationStatistics } from '@/types/evaluation.types';
import toast from 'react-hot-toast';

export default function GradeListPage() {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [grades, setGrades] = useState<ComprehensiveGradeWithTrainee[]>([]);
  const [statistics, setStatistics] = useState<EvaluationStatistics | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'score'>('rank');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadGrades();
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    // TODO: 실제 과정 목록 로드
    setCourses([
      { id: '1', name: '웹 개발 과정 1기' },
      { id: '2', name: '웹 개발 과정 2기' },
    ]);
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const [gradesData, statsData] = await Promise.all([
        comprehensiveGradeService.getWithTrainees(selectedCourseId),
        comprehensiveGradeService.getStatistics(selectedCourseId),
      ]);

      setGrades(gradesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('성적 조회 실패:', error);
      toast.error('성적을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateGrades = async () => {
    if (!selectedCourseId) {
      toast.error('과정을 선택해주세요.');
      return;
    }

    if (!confirm('전체 교육생의 성적을 재계산하시겠습니까?')) {
      return;
    }

    try {
      setCalculating(true);

      // TODO: 실제 성적 계산 로직
      // const template = await evaluationTemplateService.getByCourseTemplateId(...);
      // for (const trainee of trainees) {
      //   await comprehensiveGradeService.calculate(selectedCourseId, trainee.id, template.id);
      // }
      // await comprehensiveGradeService.updateRanks(selectedCourseId);

      toast.success('성적 계산이 완료되었습니다.');
      await loadGrades();
    } catch (error) {
      console.error('성적 계산 실패:', error);
      toast.error('성적 계산 중 오류가 발생했습니다.');
    } finally {
      setCalculating(false);
    }
  };

  const sortedGrades = [...grades].sort((a, b) => {
    switch (sortBy) {
      case 'rank':
        return (a.rank || 999) - (b.rank || 999);
      case 'name':
        return a.trainee.name.localeCompare(b.trainee.name);
      case 'score':
        return b.total_score - a.total_score;
      default:
        return 0;
    }
  });

  return (
    <PageContainer>
      <PageHeader
        title="📊 성적 조회"
        description="교육생별 종합 성적을 확인하고 관리합니다."
      >
        <button
          onClick={handleCalculateGrades}
          disabled={calculating || !selectedCourseId}
          className="btn-primary"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          {calculating ? '계산 중...' : '성적 재계산'}
        </button>
      </PageHeader>

      {/* 과정 선택 */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">과정 선택</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">과정을 선택하세요</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">정렬 기준</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="rank">등수순</option>
              <option value="name">이름순</option>
              <option value="score">점수순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      {statistics && selectedCourseId && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체 교육생</p>
                <p className="text-2xl font-bold text-foreground">{statistics.total_trainees}명</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">평균 점수</p>
                <p className="text-2xl font-bold text-primary">{Math.round(statistics.average_score)}점</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">최고 점수</p>
                <p className="text-2xl font-bold text-success">{Math.round(statistics.highest_score)}점</p>
              </div>
              <TrophyIcon className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">수료</p>
                <p className="text-2xl font-bold text-success">{statistics.passed_count}명</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">미수료</p>
                <p className="text-2xl font-bold text-destructive">{statistics.failed_count}명</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </div>
      )}

      {/* 성적 목록 */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">성적을 불러오는 중...</p>
        </div>
      ) : !selectedCourseId ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <AcademicCapIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">과정을 선택하세요</h3>
          <p className="text-muted-foreground">성적을 조회할 과정을 선택해주세요.</p>
        </div>
      ) : grades.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <AcademicCapIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">성적 데이터가 없습니다</h3>
          <p className="text-muted-foreground mb-6">아직 계산된 성적이 없습니다.</p>
          <button onClick={handleCalculateGrades} disabled={calculating} className="btn-primary">
            성적 계산하기
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className="text-lg font-medium text-foreground">
              종합 성적표 ({grades.length}명)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground">등수</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground">이름</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground">이메일</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">총점</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    수료 기준
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">결과</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    계산일시
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {grade.rank === 1 && <TrophyIcon className="h-5 w-5 text-yellow-500" />}
                        <span className="font-medium text-foreground">{grade.rank || '-'}등</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{grade.trainee.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">{grade.trainee.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-primary">
                        {Math.round(grade.total_score)}점
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        {grade.passing_score || 80}점 이상
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {grade.is_passed ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          수료
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                          미수료
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        {new Date(grade.calculated_at).toLocaleDateString('ko-KR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
