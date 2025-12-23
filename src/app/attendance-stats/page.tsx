'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { AttendanceService, type TraineeAttendanceSummary } from '@/services/attendance.service';
import toast from 'react-hot-toast';

export default function AttendanceStatsPage() {
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<TraineeAttendanceSummary[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([]);
  const [sortBy, setSortBy] = useState<'name' | 'attendance_rate'>('name');

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSummaries();
    }
  }, [sessionId]);

  const loadSessions = async () => {
    try {
      // TODO: Implement session loading
      // For now, using mock data
      setSessions([
        { id: '1', name: '웹 개발 과정 1기' },
        { id: '2', name: '웹 개발 과정 2기' },
      ]);
    } catch (error) {
      console.error('세션 로드 실패:', error);
      toast.error('세션 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const data = await AttendanceService.getTraineeAttendanceSummary(sessionId);
      setSummaries(data);
    } catch (error) {
      console.error('출석 통계 로드 실패:', error);
      toast.error('출석 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sortedSummaries = [...summaries].sort((a, b) => {
    if (sortBy === 'name') {
      return a.trainee_name.localeCompare(b.trainee_name);
    }
    return b.attendance_rate - a.attendance_rate;
  });

  const overallStats = {
    totalTrainees: summaries.length,
    averageRate:
      summaries.length > 0
        ? Math.round(
            summaries.reduce((sum, s) => sum + s.attendance_rate, 0) / summaries.length
          )
        : 0,
    canComplete: summaries.filter((s) => s.can_complete).length,
    atRisk: summaries.filter((s) => !s.can_complete).length,
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getAttendanceRateBg = (rate: number) => {
    if (rate >= 80) return 'bg-success/10';
    if (rate >= 60) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  return (
    <PageContainer>
      <PageHeader
        title="📊 출석 통계"
        description="교육생별 출석 현황과 통계를 확인합니다."
      />

      {/* 필터 영역 */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              과정 선택
            </label>
            <div className="relative">
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">과정을 선택하세요</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              정렬 기준
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'attendance_rate')}
                className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="name">이름순</option>
                <option value="attendance_rate">출석률순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 전체 통계 카드 */}
      {sessionId && summaries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체 교육생</p>
                <p className="text-2xl font-bold text-foreground">{overallStats.totalTrainees}명</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">평균 출석률</p>
                <p className="text-2xl font-bold text-primary">{overallStats.averageRate}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">수료 가능</p>
                <p className="text-2xl font-bold text-success">{overallStats.canComplete}명</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">수료 위험</p>
                <p className="text-2xl font-bold text-destructive">{overallStats.atRisk}명</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </div>
      )}

      {/* 교육생별 통계 */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">출석 통계를 불러오는 중...</p>
        </div>
      ) : !sessionId ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <ChartBarIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">과정을 선택하세요</h3>
          <p className="text-muted-foreground">출석 통계를 조회할 과정을 선택해주세요.</p>
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <UserGroupIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">출석 데이터가 없습니다</h3>
          <p className="text-muted-foreground">아직 출석 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className="text-lg font-medium text-foreground">
              교육생별 출석 통계 ({summaries.length}명)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground">이름</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-foreground">이메일</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    전체 세션
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">출석</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">지각</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">결석</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    사유결석
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    출석률
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                    수료 가능
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedSummaries.map((summary) => (
                  <tr key={summary.trainee_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{summary.trainee_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">{summary.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-foreground">{summary.total_sessions}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        {summary.present_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        {summary.late_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        {summary.absent_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {summary.excused_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              summary.attendance_rate >= 80
                                ? 'bg-success'
                                : summary.attendance_rate >= 60
                                ? 'bg-warning'
                                : 'bg-destructive'
                            }`}
                            style={{ width: `${summary.attendance_rate}%` }}
                          ></div>
                        </div>
                        <span
                          className={`text-sm font-medium ${getAttendanceRateColor(
                            summary.attendance_rate
                          )}`}
                        >
                          {Math.round(summary.attendance_rate)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {summary.can_complete ? (
                        <CheckCircleIcon className="h-5 w-5 text-success mx-auto" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-destructive mx-auto" />
                      )}
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
