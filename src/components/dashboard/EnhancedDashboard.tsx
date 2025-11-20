import React, { useState, useEffect } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { DashboardService } from '../../services/dashboard.service';
import type {
  DashboardStats,
  AttendanceTrendData,
  CourseDistribution,
  InstructorWorkload,
  MonthlyComparison,
} from '../../services/dashboard.service';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EnhancedDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendData[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<CourseDistribution[]>([]);
  const [instructorWorkload, setInstructorWorkload] = useState<InstructorWorkload[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([]);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('30days');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        statsData,
        trendData,
        distributionData,
        workloadData,
        comparisonData,
        coursesData,
      ] = await Promise.all([
        DashboardService.getMainStats(),
        DashboardService.getAttendanceTrend(30),
        DashboardService.getCourseDistribution(),
        DashboardService.getInstructorWorkload(),
        DashboardService.getMonthlyComparison(),
        DashboardService.getActiveCourses(),
      ]);

      setStats(statsData);
      setAttendanceTrend(trendData);
      setCourseDistribution(distributionData);
      setInstructorWorkload(workloadData);
      setMonthlyComparison(comparisonData);
      setActiveCourses(coursesData);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 카드 데이터
  const statCards: StatCard[] = stats ? [
    {
      label: '전체 교육생',
      value: stats.totalTrainees.toString(),
      change: `${stats.traineeGrowth > 0 ? '+' : ''}${stats.traineeGrowth.toFixed(1)}%`,
      trend: stats.traineeGrowth >= 0 ? 'up' : 'down',
      subtitle: '이번 달 신규 등록 증가',
      icon: UsersIcon,
    },
    {
      label: '진행 중인 과정',
      value: stats.activeCourses.toString(),
      change: `${stats.courseGrowth > 0 ? '+' : ''}${stats.courseGrowth.toFixed(1)}%`,
      trend: stats.courseGrowth >= 0 ? 'up' : 'down',
      subtitle: '활발한 교육 운영',
      icon: AcademicCapIcon,
    },
    {
      label: '평균 출석률',
      value: `${stats.averageAttendance.toFixed(1)}%`,
      change: `${stats.attendanceGrowth > 0 ? '+' : ''}${stats.attendanceGrowth.toFixed(1)}%`,
      trend: stats.attendanceGrowth >= 0 ? 'up' : 'down',
      subtitle: '높은 참여도 유지',
      icon: CheckCircleIcon,
    },
    {
      label: '완료율',
      value: `${stats.completionRate.toFixed(1)}%`,
      change: `${stats.completionGrowth > 0 ? '+' : ''}${stats.completionGrowth.toFixed(1)}%`,
      trend: stats.completionGrowth >= 0 ? 'up' : 'down',
      subtitle: '목표 달성률 상승',
      icon: ClockIcon,
    },
  ] : [];

  // 출석률 추이 차트 데이터
  const attendanceChartData = {
    labels: attendanceTrend.map(d => new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: '출석률 (%)',
        data: attendanceTrend.map(d => d.rate),
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const attendanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `출석률: ${context.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  // 과정별 분포 도넛 차트 데이터
  const distributionChartData = {
    labels: courseDistribution.map(d => d.courseType),
    datasets: [
      {
        data: courseDistribution.map(d => d.count),
        backgroundColor: [
          'rgba(20, 184, 166, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgb(20, 184, 166)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(236, 72, 153)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const distributionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value}개 (${percentage}%)`;
          },
        },
      },
    },
  };

  // 강사별 부하 바 차트 데이터
  const workloadChartData = {
    labels: instructorWorkload.map(w => w.instructorName),
    datasets: [
      {
        label: '담당 교육생 수',
        data: instructorWorkload.map(w => w.totalTrainees),
        backgroundColor: 'rgba(20, 184, 166, 0.6)',
        borderColor: 'rgb(20, 184, 166)',
        borderWidth: 1,
      },
      {
        label: '진행 과정 수',
        data: instructorWorkload.map(w => w.activeCourses),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const workloadChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${
                  stat.trend === 'up'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-3 h-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>

            {/* 서브타이틀 */}
            <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출석률 추이 차트 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">출석률 추이</h2>
              <p className="text-sm text-muted-foreground">최근 30일 출석률 변화</p>
            </div>
          </div>
          <div className="h-64">
            <Line data={attendanceChartData} options={attendanceChartOptions} />
          </div>
        </div>

        {/* 과정별 분포 도넛 차트 */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">과정 분포</h2>
              <p className="text-sm text-muted-foreground">진행 중인 과정 유형별 현황</p>
            </div>
          </div>
          <div className="h-64">
            <Doughnut data={distributionChartData} options={distributionChartOptions} />
          </div>
        </div>

        {/* 강사별 부하 바 차트 */}
        <div className="bg-card rounded-lg border border-border p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">강사별 강의 부하</h2>
              <p className="text-sm text-muted-foreground">담당 교육생 및 과정 수</p>
            </div>
          </div>
          <div className="h-64">
            <Bar data={workloadChartData} options={workloadChartOptions} />
          </div>
        </div>
      </div>

      {/* 활발한 과정 테이블 */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="border-b border-border">
          <div className="flex items-center space-x-4 px-6 py-4">
            <button className="text-sm font-medium text-foreground pb-2 border-b-2 border-primary">
              활발한 과정
            </button>
            <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
              {activeCourses.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  과정명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  과정 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  교육생 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  진행률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  담당 강사
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {activeCourses.map((course, index) => (
                <tr key={index} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {course.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {course.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {course.trainees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {course.progress}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {course.instructor}
                  </td>
                </tr>
              ))}
              {activeCourses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    진행 중인 과정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
