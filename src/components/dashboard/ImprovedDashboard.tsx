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
    <div className="space-y-4">
      {/* 헤더 - 제거하고 심플하게 */}

      {/* 주요 통계 카드 - 심플한 스타일 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 출석률 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">출석률</span>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats?.averageAttendance.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-green-500 mt-1">
            ↑ {stats?.attendanceGrowth.toFixed(1) || 0}%
          </div>
        </div>

        {/* 진행 과정 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">진행 과정</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats?.activeCourses || 0}개
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            총 {stats?.totalTrainees || 0}명 수강
          </div>
        </div>

        {/* 완료율 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">완료율</span>
            <Target className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {stats?.completionRate.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-purple-500 mt-1">
            ↑ {stats?.completionGrowth.toFixed(1) || 0}%
          </div>
        </div>

        {/* 평균 성적 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">평균 성적</span>
            <Award className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">87.0점</div>
          <div className="text-xs text-orange-500 mt-1">↑ 3.2%</div>
        </div>
      </div>

      {/* 차트 섹션 - 심플하게 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* 출석률 추이 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">출석률 추이</h3>
          <div className="h-48">
            <Line data={attendanceChartData} options={getChartOptions(isDark)} />
          </div>
        </div>

        {/* 과정별 교육생 분포 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">과정별 분포</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut
              data={courseDistributionData}
              options={{
                ...getChartOptions(isDark),
                maintainAspectRatio: true,
              }}
            />
          </div>
        </div>
      </div>

      {/* 빠른 작업 - 심플한 버튼 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => (window.location.href = '/attendance-check')}
          className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left"
        >
          <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-sm font-medium text-foreground">출석 체크</div>
          <div className="text-xs text-muted-foreground mt-1">오늘 출석 확인</div>
        </button>

        <button
          onClick={() => (window.location.href = '/grade-input')}
          className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left"
        >
          <Award className="w-5 h-5 text-purple-500 mb-2" />
          <div className="text-sm font-medium text-foreground">성적 입력</div>
          <div className="text-xs text-muted-foreground mt-1">평가 성적 입력</div>
        </button>

        <button
          onClick={() => (window.location.href = '/schedule-calendar')}
          className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left"
        >
          <Calendar className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-sm font-medium text-foreground">일정 관리</div>
          <div className="text-xs text-muted-foreground mt-1">교육 일정 확인</div>
        </button>

        <button
          onClick={() => (window.location.href = '/materials-upload')}
          className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors text-left"
        >
          <BookOpen className="w-5 h-5 text-orange-500 mb-2" />
          <div className="text-sm font-medium text-foreground">자료 업로드</div>
          <div className="text-xs text-muted-foreground mt-1">교육 자료 업로드</div>
        </button>
      </div>

      {/* 최근 활동 - 심플한 리스트 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">최근 활동</h3>
        <div className="space-y-2">
          {recentActivities.slice(0, 4).map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
              <div className={`p-1.5 rounded ${activity.color} bg-opacity-10`}>
                <activity.icon className={`w-3 h-3 ${activity.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">{activity.title}</div>
                <div className="text-xs text-muted-foreground">{activity.description}</div>
              </div>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
