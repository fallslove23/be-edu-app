'use client';

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { integratedResourceService } from '@/services/integrated-resource.service';

interface UtilizationData {
  id: string;
  name: string;
  sessionCount: number;
  totalHours: number;
}

/**
 * 자원 활용도 대시보드
 * Phase 3: 통합 대시보드
 */
export function ResourceUtilizationDashboard() {
  const [instructorStats, setInstructorStats] = useState<UtilizationData[]>([]);
  const [classroomStats, setClassroomStats] = useState<UtilizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 올해 1월 1일
    endDate: new Date().toISOString().split('T')[0], // 오늘
  });

  useEffect(() => {
    loadUtilizationStats();
  }, [dateRange]);

  const loadUtilizationStats = async () => {
    try {
      setLoading(true);

      // 강사 활용도
      const instructors = await integratedResourceService.getResourceUtilization(
        'instructor',
        dateRange.startDate,
        dateRange.endDate
      );
      setInstructorStats(instructors);

      // 강의실 활용도
      const classrooms = await integratedResourceService.getResourceUtilization(
        'classroom',
        dateRange.startDate,
        dateRange.endDate
      );
      setClassroomStats(classrooms);
    } catch (error) {
      console.error('자원 활용도 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 활용도에 따른 색상
  const getUtilizationColor = (hours: number) => {
    if (hours >= 100) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (hours >= 50) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (hours >= 20) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  // 활용도 레벨
  const getUtilizationLevel = (hours: number) => {
    if (hours >= 100) return '매우 높음';
    if (hours >= 50) return '높음';
    if (hours >= 20) return '보통';
    return '낮음';
  };

  // 진행률 계산 (최대 200시간 기준)
  const getProgress = (hours: number) => {
    return Math.min((hours / 200) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">자원 활용도 분석</h2>
          <p className="text-sm text-muted-foreground mt-1">
            강사 및 강의실의 활용 현황을 확인하세요
          </p>
        </div>

        {/* 기간 선택 */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">시작일</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">종료일</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg bg-background text-sm"
            />
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">총 강사</div>
              <div className="text-2xl font-bold">{instructorStats.length}명</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <BuildingOffice2Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">총 강의실</div>
              <div className="text-2xl font-bold">{classroomStats.length}개</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">총 세션</div>
              <div className="text-2xl font-bold">
                {instructorStats.reduce((sum, s) => sum + s.sessionCount, 0)}개
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <ClockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">총 강의 시간</div>
              <div className="text-2xl font-bold">
                {instructorStats.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 강사 활용도 */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            강사 활용도
          </h3>
        </div>

        <div className="p-6">
          {instructorStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              해당 기간에 활동한 강사가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {instructorStats
                .sort((a, b) => b.totalHours - a.totalHours)
                .map((instructor) => (
                  <div key={instructor.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{instructor.name}</div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getUtilizationColor(
                            instructor.totalHours
                          )}`}
                        >
                          {getUtilizationLevel(instructor.totalHours)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                          <CalendarIcon className="w-4 h-4 inline mr-1" />
                          {instructor.sessionCount}회
                        </div>
                        <div className="font-semibold text-card-foreground">
                          <ClockIcon className="w-4 h-4 inline mr-1" />
                          {instructor.totalHours.toFixed(1)}시간
                        </div>
                      </div>
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getProgress(instructor.totalHours)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 강의실 활용도 */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BuildingOffice2Icon className="w-5 h-5" />
            강의실 활용도
          </h3>
        </div>

        <div className="p-6">
          {classroomStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              해당 기간에 사용된 강의실이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classroomStats
                .sort((a, b) => b.totalHours - a.totalHours)
                .map((classroom) => (
                  <div
                    key={classroom.id}
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium">{classroom.name}</div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getUtilizationColor(
                          classroom.totalHours
                        )}`}
                      >
                        {getUtilizationLevel(classroom.totalHours)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">세션 수</div>
                        <div className="font-semibold">{classroom.sessionCount}회</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">총 시간</div>
                        <div className="font-semibold">{classroom.totalHours.toFixed(1)}h</div>
                      </div>
                    </div>

                    {/* 진행률 바 */}
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${getProgress(classroom.totalHours)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>활용도 기준</strong>: 매우 높음 (100h+), 높음 (50-100h), 보통 (20-50h), 낮음 (20h 미만)
        </p>
      </div>
    </div>
  );
}
