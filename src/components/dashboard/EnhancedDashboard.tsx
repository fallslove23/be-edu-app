'use client';

import React, { useState, useEffect } from 'react';
import { StaggerContainer, FadeInUp } from '../common/Animations';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
} from 'lucide-react';
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
import { PageContainer } from '../common/PageContainer';

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

interface EnhancedDashboardProps {
  embedded?: boolean;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ embedded = false }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendData[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<CourseDistribution[]>([]);
  const [instructorWorkload, setInstructorWorkload] = useState<InstructorWorkload[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([]);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('30days');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setError('대시보드를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
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
      icon: Users,
    },
    {
      label: '진행 중인 과정',
      value: stats.activeCourses.toString(),
      change: `${stats.courseGrowth > 0 ? '+' : ''}${stats.courseGrowth.toFixed(1)}%`,
      trend: stats.courseGrowth >= 0 ? 'up' : 'down',
      subtitle: '활발한 교육 운영',
      icon: GraduationCap,
    },
    {
      label: '평균 출석률',
      value: `${stats.averageAttendance.toFixed(1)}%`,
      change: `${stats.attendanceGrowth > 0 ? '+' : ''}${stats.attendanceGrowth.toFixed(1)}%`,
      trend: stats.attendanceGrowth >= 0 ? 'up' : 'down',
      subtitle: '높은 참여도 유지',
      icon: CheckCircle,
    },
    {
      label: '완료율',
      value: `${stats.completionRate.toFixed(1)}%`,
      change: `${stats.completionGrowth > 0 ? '+' : ''}${stats.completionGrowth.toFixed(1)}%`,
      trend: stats.completionGrowth >= 0 ? 'up' : 'down',
      subtitle: '목표 달성률 상승',
      icon: Clock,
    },
  ] : [];

  // Clean Minimalist Theme (inspired by screenshot)
  const cleanTheme = {
    primary: '#0f172a', // Slate 900 (Main Line/Bar)
    secondary: '#94a3b8', // Slate 400 (Secondary Bar)
    grid: '#f1f5f9', // Slate 100 (Grid lines)
    text: '#64748b', // Slate 500 (Labels)
    background: '#ffffff',
  };

  // 출석률 추이 차트 데이터
  const attendanceChartData = {
    labels: attendanceTrend.map(d => new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: '출석률 (%)',
        data: attendanceTrend.map(d => d.rate),
        borderColor: cleanTheme.primary,
        backgroundColor: 'transparent', // No fill for clean look
        borderWidth: 2.5,
        tension: 0.4, // Smooth bezier curve
        pointBackgroundColor: '#ffffff',
        pointBorderColor: cleanTheme.primary,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: cleanTheme.primary,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
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
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 13, family: 'Pretendard' },
        bodyFont: { size: 13, family: 'Pretendard' },
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `출석률: ${context.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: { size: 11, family: 'Pretendard' },
          color: cleanTheme.text,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: cleanTheme.grid,
          borderDash: [4, 4],
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          callback: (value: any) => `${value}%`,
          font: { size: 11, family: 'Pretendard' },
          color: cleanTheme.text,
          stepSize: 25,
          padding: 10,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // 과정별 분포 도넛 차트 데이터
  const distributionChartData = {
    labels: courseDistribution.map(d => d.courseType),
    datasets: [
      {
        data: courseDistribution.map(d => d.count),
        backgroundColor: [
          '#0f172a', // Slate 900
          '#334155', // Slate 700
          '#64748b', // Slate 500
          '#94a3b8', // Slate 400
          '#cbd5e1', // Slate 300
          '#e2e8f0', // Slate 200
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const distributionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12, family: 'Pretendard' },
          color: '#4b5563',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Pretendard' },
        bodyFont: { family: 'Pretendard' },
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
        backgroundColor: cleanTheme.primary,
        borderRadius: 4,
        barThickness: 24,
        borderSkipped: false,
      },
      {
        label: '진행 과정 수',
        data: instructorWorkload.map(w => w.activeCourses),
        backgroundColor: cleanTheme.secondary,
        borderRadius: 4,
        barThickness: 24,
        borderSkipped: false,
      },
    ],
  };

  const workloadChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: 'Pretendard' },
          color: cleanTheme.text,
          boxWidth: 6,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Pretendard' },
        bodyFont: { family: 'Pretendard' },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: { size: 11, family: 'Pretendard' },
          color: cleanTheme.text,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: cleanTheme.grid,
          borderDash: [4, 4],
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: { size: 11, family: 'Pretendard' },
          color: cleanTheme.text,
          stepSize: 5,
          padding: 10,
        }
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            대시보드를 불러오는데 실패했습니다
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={loadDashboardData}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* 통계 카드 그리드 */}
      <StaggerContainer className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-x-visible md:pb-0 snap-x snap-mandatory scroll-touch">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between relative overflow-hidden hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 min-w-[260px] md:min-w-0 snap-start flex-shrink-0 group"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${stat.trend === 'up'
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>

            {/* 서브타이틀 */}
            <p className="text-sm text-gray-400 dark:text-gray-500">{stat.subtitle}</p>
          </div>
        ))}
      </StaggerContainer>

      {/* 차트 그리드 */}
      <FadeInUp delay={0.2} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 출석률 추이 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">출석률 추이</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">최근 30일 출석률 변화</p>
            </div>
          </div>
          <div className="h-72">
            <Line data={attendanceChartData} options={attendanceChartOptions} />
          </div>
        </div>

        {/* 과정별 분포 도넛 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">과정 분포</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">진행 중인 과정 유형별 현황</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={distributionChartData} options={distributionChartOptions} />
          </div>
        </div>

        {/* 강사별 부하 바 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">강사별 강의 부하</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">담당 교육생 및 과정 수</p>
            </div>
          </div>
          <div className="h-72">
            <Bar data={workloadChartData} options={workloadChartOptions} />
          </div>
        </div>
      </FadeInUp>

      {/* 활발한 과정 테이블 */}
      <FadeInUp delay={0.4} className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center space-x-4 px-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">활발한 과정</h2>
            <span className="px-2.5 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
              {activeCourses.length}개 과정
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  과정명
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  과정 유형
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  교육생 수
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  진행률
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  담당 강사
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {activeCourses.map((course, index) => (
                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {course.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      {course.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {course.trainees}명
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white font-medium w-12">{course.progress}%</span>
                      <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ml-2">
                        <div
                          className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {course.instructor}
                  </td>
                </tr>
              ))}
              {activeCourses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    진행 중인 과정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </FadeInUp>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer>
      {content}
    </PageContainer>
  );
};

export default EnhancedDashboard;
