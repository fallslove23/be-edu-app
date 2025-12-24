'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Calendar,
  Target,
  TrendingUp,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  ImprovedStatCard,
  QuickActionCard,
  ActivityFeedItem,
  ChartCard,
  MiniStatCard,
  ProgressCard,
  chartTheme,
  getChartOptions,
} from './ImprovedDashboardWidgets';
import { DashboardService } from '@/services/dashboard.service';
import type {
  DashboardStats,
  AttendanceTrendData,
  CourseDistribution,
} from '@/services/dashboard.service';
import { useTheme } from '@/contexts/ThemeContext';
import toast from 'react-hot-toast';

export default function ImprovedDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendData[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<CourseDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, trendData, distributionData] = await Promise.all([
        DashboardService.getMainStats(),
        DashboardService.getAttendanceTrend(30),
        DashboardService.getCourseDistribution(),
      ]);

      setStats(statsData);
      setAttendanceTrend(trendData);
      setCourseDistribution(distributionData);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      toast.error('대시보드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('데이터가 새로고침되었습니다.');
  };

  // 출석률 추이 차트 데이터
  const attendanceChartData = {
    labels: attendanceTrend.map((item) => item.date),
    datasets: [
      {
        label: '출석률',
        data: attendanceTrend.map((item) => item.attendanceRate),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: isDark
          ? 'rgba(59, 130, 246, 0.1)'
          : 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // 과정 분포 차트 데이터
  const courseDistributionData = {
    labels: courseDistribution.map((item) => item.courseName),
    datasets: [
      {
        data: courseDistribution.map((item) => item.studentCount),
        backgroundColor: chartTheme.backgroundColor,
        borderColor: chartTheme.borderColor,
        borderWidth: 2,
      },
    ],
  };

  // 최근 활동 (모의 데이터)
  const recentActivities = [
    {
      title: '새로운 과정 등록',
      description: 'React 심화과정에 5명의 교육생이 등록했습니다',
      time: '5분 전',
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      title: '출석 완료',
      description: '오늘 출석률 95% 달성',
      time: '1시간 전',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: '성적 입력',
      description: '중간평가 성적이 입력되었습니다',
      time: '2시간 전',
      icon: Award,
      color: 'bg-purple-500',
    },
    {
      title: '일정 추가',
      description: '다음 주 특강 일정이 추가되었습니다',
      time: '3시간 전',
      icon: Calendar,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            교육 현황을 한눈에 확인하세요
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ImprovedStatCard
          title="전체 교육생"
          value={stats?.totalTrainees || 0}
          change={stats?.traineeGrowth}
          subtitle="이번 달 신규 등록"
          icon={Users}
          color="blue"
          trend={stats && stats.traineeGrowth >= 0 ? 'up' : 'down'}
          loading={loading}
        />
        <ImprovedStatCard
          title="진행 중인 과정"
          value={stats?.activeCourses || 0}
          change={stats?.courseGrowth}
          subtitle="활발한 교육 운영"
          icon={GraduationCap}
          color="green"
          trend={stats && stats.courseGrowth >= 0 ? 'up' : 'down'}
          loading={loading}
        />
        <ImprovedStatCard
          title="평균 출석률"
          value={`${stats?.averageAttendance.toFixed(1) || 0}%`}
          change={stats?.attendanceGrowth}
          subtitle="높은 참여도 유지"
          icon={CheckCircle}
          color="purple"
          trend={stats && stats.attendanceGrowth >= 0 ? 'up' : 'down'}
          loading={loading}
        />
        <ImprovedStatCard
          title="완료율"
          value={`${stats?.completionRate.toFixed(1) || 0}%`}
          change={stats?.completionGrowth}
          subtitle="목표 달성률"
          icon={Target}
          color="orange"
          trend={stats && stats.completionGrowth >= 0 ? 'up' : 'down'}
          loading={loading}
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 출석률 추이 */}
        <div className="lg:col-span-2">
          <ChartCard
            title="출석률 추이"
            subtitle="최근 30일간 출석률 변화"
            actions={
              <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Download className="w-4 h-4" />
                내보내기
              </button>
            }
          >
            <div className="h-80">
              <Line data={attendanceChartData} options={getChartOptions(isDark)} />
            </div>
          </ChartCard>
        </div>

        {/* 과정별 교육생 분포 */}
        <div>
          <ChartCard title="과정별 교육생 분포" subtitle="현재 진행 중인 과정">
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={courseDistributionData}
                options={{
                  ...getChartOptions(isDark),
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 빠른 작업 및 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 빠른 작업 */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              빠른 작업
            </h3>
            <div className="space-y-3">
              <QuickActionCard
                title="출석 체크"
                description="오늘의 출석을 확인하세요"
                icon={CheckCircle}
                color="bg-green-500"
                onClick={() => window.location.href = '/attendance-check'}
              />
              <QuickActionCard
                title="성적 입력"
                description="평가 성적을 입력하세요"
                icon={Award}
                color="bg-purple-500"
                onClick={() => window.location.href = '/grade-input'}
              />
              <QuickActionCard
                title="일정 관리"
                description="교육 일정을 확인하세요"
                icon={Calendar}
                color="bg-blue-500"
                onClick={() => window.location.href = '/schedule-calendar'}
              />
              <QuickActionCard
                title="자료 업로드"
                description="교육 자료를 업로드하세요"
                icon={BookOpen}
                color="bg-orange-500"
                onClick={() => window.location.href = '/materials-upload'}
              />
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                최근 활동
              </h3>
              <button className="text-sm text-primary hover:underline">
                전체 보기
              </button>
            </div>
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <ActivityFeedItem key={index} {...activity} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard
          label="오늘 출석"
          value="43/45"
          icon={CheckCircle}
          color="bg-green-500"
          trend={5.2}
        />
        <MiniStatCard
          label="이번 주 평균"
          value="92%"
          icon={TrendingUp}
          color="bg-blue-500"
          trend={2.1}
        />
        <MiniStatCard
          label="완료 과정"
          value="8"
          icon={Award}
          color="bg-purple-500"
          trend={12.5}
        />
        <MiniStatCard
          label="진행 예정"
          value="3"
          icon={Calendar}
          color="bg-orange-500"
          trend={-3.2}
        />
      </div>

      {/* 진행률 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressCard
          title="이번 달 출석 목표"
          current={87}
          total={100}
          color="bg-blue-500"
          subtitle="13% 남음"
        />
        <ProgressCard
          title="평가 완료율"
          current={6}
          total={8}
          color="bg-green-500"
          subtitle="2개 남음"
        />
        <ProgressCard
          title="자료 배포율"
          current={24}
          total={30}
          color="bg-purple-500"
          subtitle="6개 남음"
        />
      </div>
    </div>
  );
}
