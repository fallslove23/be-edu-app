import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  CalendarDays,
  Download,
  Filter,
  Eye,
  Clock,
  RefreshCw,
  Settings,
  FileBarChart,
  Table
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { useTheme } from '../../contexts/ThemeContext';

interface LearningProgress {
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  timeSpent: number; // 분 단위
  lastActivity: string;
  score: number;
  department: string;
}

interface AnalyticsData {
  learningProgress: LearningProgress[];
  courseCompletion: {
    courseId: string;
    courseName: string;
    totalStudents: number;
    completedStudents: number;
    avgProgress: number;
    avgScore: number;
  }[];
  departmentStats: {
    department: string;
    avgProgress: number;
    avgScore: number;
    activeUsers: number;
    totalUsers: number;
  }[];
  timeSeriesData: {
    date: string;
    completions: number;
    newEnrollments: number;
    totalActiveUsers: number;
    avgSessionTime: number;
  }[];
  performanceMetrics: {
    category: string;
    score: number;
    maxScore: number;
  }[];
  realTimeMetrics: {
    timestamp: string;
    activeUsers: number;
    newSessions: number;
    completedLessons: number;
    avgResponseTime: number;
  }[];
  heatMapData: {
    hour: number;
    day: string;
    activity: number;
  }[];
}

const AdvancedAnalytics: React.FC = () => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'performance' | 'trends' | 'realtime'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30초
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

  // 성능 모니터링 (간소화) - 개발 모드에서는 경고 비활성화
  // SSR 호환성을 위해 조건부로 사용
  const performanceMonitor = typeof window !== 'undefined'
    ? usePerformanceMonitor('AdvancedAnalytics', {
        loadTime: 5000,    // 5초로 증가 (차트가 많은 페이지)
        renderTime: 500,   // 500ms로 증가 (복잡한 컴포넌트)
        memoryUsage: 100   // 100MB로 증가
      })
    : null;

  // Mock 데이터 생성
  useEffect(() => {
    const generateMockData = (): AnalyticsData => {
      const departments = ['영업1팀', '영업2팀', '마케팅팀', '고객서비스팀', '교육팀'];
      const courses = [
        { id: 'c1', name: '신입 영업사원 기초 교육' },
        { id: 'c2', name: '중급 영업 스킬 향상' },
        { id: 'c3', name: '고객 관계 관리 전문' },
        { id: 'c4', name: 'CS 응대 매뉴얼' },
        { id: 'c5', name: '마케팅 전략 기초' }
      ];

      // 학습 진도 데이터
      const learningProgress: LearningProgress[] = [];
      for (let i = 1; i <= 50; i++) {
        const dept = departments[Math.floor(Math.random() * departments.length)];
        const course = courses[Math.floor(Math.random() * courses.length)];
        const progress = Math.floor(Math.random() * 100);
        const totalLessons = Math.floor(Math.random() * 20) + 5;
        const completedLessons = Math.floor((progress / 100) * totalLessons);

        learningProgress.push({
          userId: `user_${i}`,
          userName: `사용자${i}`,
          courseId: course.id,
          courseName: course.name,
          progress,
          completedLessons,
          totalLessons,
          timeSpent: Math.floor(Math.random() * 300) + 30,
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          score: Math.floor(Math.random() * 40) + 60,
          department: dept
        });
      }

      // 과정별 완료도
      const courseCompletion = courses.map(course => {
        const courseStudents = learningProgress.filter(p => p.courseId === course.id);
        const completedStudents = courseStudents.filter(p => p.progress >= 100).length;
        const avgProgress = courseStudents.reduce((sum, p) => sum + p.progress, 0) / courseStudents.length;
        const avgScore = courseStudents.reduce((sum, p) => sum + p.score, 0) / courseStudents.length;

        return {
          courseId: course.id,
          courseName: course.name,
          totalStudents: courseStudents.length,
          completedStudents,
          avgProgress: Math.round(avgProgress),
          avgScore: Math.round(avgScore)
        };
      });

      // 부서별 통계
      const departmentStats = departments.map(dept => {
        const deptUsers = learningProgress.filter(p => p.department === dept);
        const avgProgress = deptUsers.reduce((sum, p) => sum + p.progress, 0) / deptUsers.length;
        const avgScore = deptUsers.reduce((sum, p) => sum + p.score, 0) / deptUsers.length;
        const activeUsers = deptUsers.filter(p =>
          new Date(p.lastActivity).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length;

        return {
          department: dept,
          avgProgress: Math.round(avgProgress),
          avgScore: Math.round(avgScore),
          activeUsers,
          totalUsers: deptUsers.length
        };
      });

      // 시계열 데이터
      const timeSeriesData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          completions: Math.floor(Math.random() * 10) + 2,
          newEnrollments: Math.floor(Math.random() * 15) + 5,
          totalActiveUsers: Math.floor(Math.random() * 20) + 30,
          avgSessionTime: Math.floor(Math.random() * 60) + 20
        };
      });

      // 성과 메트릭
      const performanceMetrics = [
        { category: '완료율', score: 78, maxScore: 100 },
        { category: '참여도', score: 85, maxScore: 100 },
        { category: '만족도', score: 92, maxScore: 100 },
        { category: '시험점수', score: 87, maxScore: 100 },
        { category: '출석률', score: 94, maxScore: 100 }
      ];

      // 실시간 메트릭 (최근 24시간)
      const realTimeMetrics = Array.from({ length: 24 }, (_, i) => {
        const timestamp = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
        return {
          timestamp: timestamp.toISOString(),
          activeUsers: Math.floor(Math.random() * 50) + 10,
          newSessions: Math.floor(Math.random() * 20) + 5,
          completedLessons: Math.floor(Math.random() * 15) + 2,
          avgResponseTime: Math.floor(Math.random() * 500) + 200
        };
      });

      // 히트맵 데이터 (요일별, 시간별 활동)
      const days = ['월', '화', '수', '목', '금', '토', '일'];
      const heatMapData = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const day = days[dayIndex];
          // 업무시간에 높은 활동, 주말에 낮은 활동
          let baseActivity = 30;
          if (dayIndex < 5) { // 평일
            if (hour >= 9 && hour <= 17) baseActivity = 80;
            else if (hour >= 19 && hour <= 22) baseActivity = 60;
          } else { // 주말
            if (hour >= 10 && hour <= 20) baseActivity = 40;
          }

          const activity = Math.max(0, baseActivity + Math.floor(Math.random() * 30) - 15);
          heatMapData.push({ hour, day, activity });
        }
      }

      return {
        learningProgress,
        courseCompletion,
        departmentStats,
        timeSeriesData,
        performanceMetrics,
        realTimeMetrics,
        heatMapData
      };
    };

    setLoading(true);
    // API 호출 시뮬레이션
    setTimeout(() => {
      setAnalyticsData(generateMockData());
      setLoading(false);
      setLastUpdated(new Date());
    }, 1000);
  }, [selectedTimeRange, selectedDepartment, selectedCourse]);

  // 실시간 데이터 자동 새로고침
  useEffect(() => {
    if (activeTab === 'realtime' && refreshInterval > 0) {
      const interval = setInterval(() => {
        setAnalyticsData(prev => {
          if (!prev) return null;
          const newData = { ...prev };
          // 실시간 메트릭만 업데이트
          const lastMetric = newData.realTimeMetrics[newData.realTimeMetrics.length - 1];
          const newMetric = {
            timestamp: new Date().toISOString(),
            activeUsers: Math.floor(Math.random() * 50) + 10,
            newSessions: Math.floor(Math.random() * 20) + 5,
            completedLessons: Math.floor(Math.random() * 15) + 2,
            avgResponseTime: Math.floor(Math.random() * 500) + 200
          };
          newData.realTimeMetrics = [...newData.realTimeMetrics.slice(1), newMetric];
          return newData;
        });
        setLastUpdated(new Date());
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [activeTab, refreshInterval]);

  const exportData = useCallback((format: 'json' | 'csv' = 'json') => {
    if (!analyticsData) return;

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        timeRange: selectedTimeRange,
        department: selectedDepartment,
        course: selectedCourse,
        data: analyticsData
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${timestamp}.json`;
      link.click();

      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // CSV 내보내기
      const csvData = analyticsData.learningProgress.map(item => ({
        '사용자명': item.userName,
        '부서': item.department,
        '과정명': item.courseName,
        '진도율': `${item.progress}%`,
        '완료차시': `${item.completedLessons}/${item.totalLessons}`,
        '학습시간': `${item.timeSpent}분`,
        '점수': `${item.score}점`,
        '최종활동': new Date(item.lastActivity).toLocaleDateString()
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n');

      const csvBlob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(csvBlob);

      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `analytics-report-${timestamp}.csv`;
      link.click();

      URL.revokeObjectURL(csvUrl);
    }
  }, [analyticsData, selectedTimeRange, selectedDepartment, selectedCourse]);

  // 성과 지표 계산
  const performanceIndicators = useMemo(() => {
    if (!analyticsData) return null;

    const avgProgress = analyticsData.learningProgress.reduce((sum, p) => sum + p.progress, 0) / analyticsData.learningProgress.length;
    const avgScore = analyticsData.learningProgress.reduce((sum, p) => sum + p.score, 0) / analyticsData.learningProgress.length;
    const completionRate = analyticsData.learningProgress.filter(p => p.progress >= 100).length / analyticsData.learningProgress.length * 100;
    const activeUsers = analyticsData.departmentStats.reduce((sum, d) => sum + d.activeUsers, 0);

    // 전월 대비 변화율 (가상 데이터)
    const progressChange = Math.floor(Math.random() * 20) - 10;
    const scoreChange = Math.floor(Math.random() * 10) - 5;
    const completionChange = Math.floor(Math.random() * 15) - 7;
    const activeChange = Math.floor(Math.random() * 25) - 12;

    return {
      avgProgress: Math.round(avgProgress),
      avgScore: Math.round(avgScore),
      completionRate: Math.round(completionRate),
      activeUsers,
      progressChange,
      scoreChange,
      completionChange,
      activeChange
    };
  }, [analyticsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">분석 데이터를 로딩 중...</span>
      </div>
    );
  }

  if (!analyticsData) return null;

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <BarChart2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">고급 학습 분석</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">학습 진도, 성과 분석 및 트렌드 리포트</p>
            </div>
          </div>

          {/* 필터 컨트롤 */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="1y">최근 1년</option>
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">전체 부서</option>
              {analyticsData.departmentStats.map(dept => (
                <option key={dept.department} value={dept.department}>
                  {dept.department}
                </option>
              ))}
            </select>

            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('charts')}
                className={`px-4 py-2.5 text-sm ${viewMode === 'charts' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors`}
              >
                <BarChart2 className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2.5 text-sm ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors`}
              >
                <Table className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportData('json')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="btn-primary px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center"
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                CSV
              </button>
            </div>

            <button className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-8">
            {[
              { key: 'overview', label: '개요', icon: Eye },
              { key: 'progress', label: '학습 진도', icon: TrendingUp },
              { key: 'performance', label: '성과 분석', icon: GraduationCap },
              { key: 'trends', label: '트렌드', icon: CalendarDays },
              { key: 'realtime', label: '실시간', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-5 px-1 border-b-2 font-bold text-sm flex items-center transition-all ${activeTab === key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <Icon className={`h-4 w-4 mr-2 ${activeTab === key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'overview' && performanceIndicators && (
        <div className="space-y-6">
          {/* 향상된 KPI 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">총 학습자</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analyticsData.learningProgress.length}명
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">평균 진도</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {performanceIndicators.avgProgress}%
                  </p>
                  <div className={`flex items-center mt-2 ${performanceIndicators.progressChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {performanceIndicators.progressChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-bold">
                      {Math.abs(performanceIndicators.progressChange)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">평균 점수</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {performanceIndicators.avgScore}점
                  </p>
                  <div className={`flex items-center mt-2 ${performanceIndicators.scoreChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {performanceIndicators.scoreChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-bold">
                      {Math.abs(performanceIndicators.scoreChange)}점
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
                  <GraduationCap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">완료율</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {performanceIndicators.completionRate}%
                  </p>
                  <div className={`flex items-center mt-2 ${performanceIndicators.completionChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {performanceIndicators.completionChange >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-bold">
                      {Math.abs(performanceIndicators.completionChange)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <CalendarDays className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div >

          {/* 차트 섹션 */}
          {
            viewMode === 'charts' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 시계열 트렌드 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">학습 활동 트렌드</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#f0f0f0',
                          color: isDark ? '#f3f4f6' : '#111827',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area type="monotone" dataKey="totalActiveUsers" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="newEnrollments" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 부서별 성과 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">부서별 성과 분포</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.departmentStats}
                        dataKey="avgScore"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        label={({ department, avgScore }) => `${department}: ${avgScore}점`}
                      >
                        {analyticsData.departmentStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#f0f0f0',
                          color: isDark ? '#f3f4f6' : '#111827',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* 테이블 뷰 */
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">학습 진도 상세</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">사용자</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">부서</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">과정</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">진도율</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">점수</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">학습시간</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {analyticsData.learningProgress.slice(0, 10).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                            {item.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.courseName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-blue-600 dark:text-blue-400">{item.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                            {item.score}점
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.timeSpent}분
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        </div >
      )}

      {
        activeTab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 과정별 완료도 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">과정별 완료도</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.courseCompletion}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f0f0f0'} />
                  <XAxis dataKey="courseName" angle={-45} textAnchor="end" height={80} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#f0f0f0',
                      color: isDark ? '#f3f4f6' : '#111827',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: isDark ? '#374151' : '#f9fafb' }}
                  />
                  <Bar dataKey="avgProgress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 부서별 진도 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">부서별 학습 진도</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.departmentStats}
                    dataKey="avgProgress"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={({ department, avgProgress }) => `${department}: ${avgProgress}%`}
                  >
                    {analyticsData.departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }

      {
        activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 성과 레이더 차트 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">종합 성과 분석</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analyticsData.performanceMetrics}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis domain={[0, 100]} axisLine={false} tick={false} />
                  <Radar
                    name="현재 성과"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 부서별 성과 비교 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">부서별 성과 비교</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f0f0f0'} />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#f0f0f0',
                      color: isDark ? '#f3f4f6' : '#111827',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: isDark ? '#374151' : '#f9fafb' }}
                  />
                  <Bar dataKey="avgScore" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }

      {
        activeTab === 'trends' && (
          <div className="space-y-6">
            {/* 시계열 트렌드 */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">학습 활동 트렌드</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f0f0f0'} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#f0f0f0',
                      color: isDark ? '#f3f4f6' : '#111827',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="completions" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} name="완료" />
                  <Line type="monotone" dataKey="newEnrollments" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} name="신규 등록" />
                  <Line type="monotone" dataKey="totalActiveUsers" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} name="활성 사용자" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 활동 히트맵 */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">요일별 시간대 활동 패턴</h3>
              <div className="space-y-3">
                {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                  <div key={day} className="flex items-center space-x-3">
                    <div className="w-8 text-sm font-bold text-gray-500">{day}</div>
                    <div className="flex space-x-1 flex-1">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const heatData = analyticsData.heatMapData.find(d => d.day === day && d.hour === hour);
                        const activity = heatData?.activity || 0;
                        const intensity = Math.min(activity / 100, 1);
                        return (
                          <div
                            key={hour}
                            className="flex-1 h-8 rounded-md cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                              opacity: Math.max(0.1, intensity)
                            }}
                            title={`${day} ${hour}:00 - 활동도: ${activity}%`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-gray-400 mt-2 pl-11">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        activeTab === 'realtime' && (
          <div className="space-y-6">
            {/* 실시간 제어 패널 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">실시간 모니터링</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>마지막 업데이트: {lastUpdated.toLocaleTimeString()}</span>
                  </div>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5000}>5초</option>
                    <option value={10000}>10초</option>
                    <option value={30000}>30초</option>
                    <option value={60000}>1분</option>
                    <option value={0}>수동</option>
                  </select>
                  <button
                    onClick={() => {
                      setAnalyticsData(prev => {
                        if (!prev) return null;
                        const newData = { ...prev };
                        const newMetric = {
                          timestamp: new Date().toISOString(),
                          activeUsers: Math.floor(Math.random() * 50) + 10,
                          newSessions: Math.floor(Math.random() * 20) + 5,
                          completedLessons: Math.floor(Math.random() * 15) + 2,
                          avgResponseTime: Math.floor(Math.random() * 500) + 200
                        };
                        newData.realTimeMetrics = [...newData.realTimeMetrics.slice(1), newMetric];
                        return newData;
                      });
                      setLastUpdated(new Date());
                    }}
                    className="btn-primary"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 실시간 메트릭 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData.realTimeMetrics.length > 0 && (
                <>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">현재 활성 사용자</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {analyticsData.realTimeMetrics[analyticsData.realTimeMetrics.length - 1].activeUsers}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">신규 세션</p>
                        <p className="text-2xl font-bold text-green-600">
                          {analyticsData.realTimeMetrics[analyticsData.realTimeMetrics.length - 1].newSessions}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">완료된 레슨</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {analyticsData.realTimeMetrics[analyticsData.realTimeMetrics.length - 1].completedLessons}
                        </p>
                      </div>
                      <GraduationCap className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">평균 응답시간</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analyticsData.realTimeMetrics[analyticsData.realTimeMetrics.length - 1].avgResponseTime}ms
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-foreground" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 실시간 차트 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">실시간 활동 (최근 24시간)</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.realTimeMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `시간: ${new Date(value).toLocaleString()}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={2} name="활성 사용자" />
                  <Line type="monotone" dataKey="newSessions" stroke="#10b981" strokeWidth={2} name="신규 세션" />
                  <Line type="monotone" dataKey="completedLessons" stroke="#8b5cf6" strokeWidth={2} name="완료된 레슨" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 성능 모니터링 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">시스템 성능</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analyticsData.realTimeMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `시간: ${new Date(value).toLocaleString()}`}
                    formatter={(value) => [`${value}ms`, '응답시간']}
                  />
                  <Area type="monotone" dataKey="avgResponseTime" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdvancedAnalytics;