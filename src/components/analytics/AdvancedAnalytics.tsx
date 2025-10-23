import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon,
  ClockIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  DocumentChartBarIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
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
  const performanceMonitor = usePerformanceMonitor('AdvancedAnalytics', {
    loadTime: 5000,    // 5초로 증가 (차트가 많은 페이지)
    renderTime: 500,   // 500ms로 증가 (복잡한 컴포넌트)
    memoryUsage: 100   // 100MB로 증가
  });

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">분석 데이터를 로딩 중...</span>
      </div>
    );
  }

  if (!analyticsData) return null;

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2" />
              고급 학습 분석
            </h1>
            <p className="text-gray-600">학습 진도, 성과 분석 및 트렌드 리포트</p>
          </div>
          
          {/* 필터 컨트롤 */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
              <option value="1y">최근 1년</option>
            </select>
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">전체 부서</option>
              {analyticsData.departmentStats.map(dept => (
                <option key={dept.department} value={dept.department}>
                  {dept.department}
                </option>
              ))}
            </select>

            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('charts')}
                className={`px-3 py-2 text-sm ${viewMode === 'charts' ? 'bg-blue-500 text-white' : 'text-gray-600'} rounded-l-lg transition-colors`}
              >
                <ChartBarIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-600'} rounded-r-lg transition-colors`}
              >
                <TableCellsIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportData('json')}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <DocumentChartBarIcon className="h-4 w-4 mr-1" />
                CSV
              </button>
            </div>

            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Cog6ToothIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: '개요', icon: EyeIcon },
              { key: 'progress', label: '학습 진도', icon: ArrowTrendingUpIcon },
              { key: 'performance', label: '성과 분석', icon: AcademicCapIcon },
              { key: 'trends', label: '트렌드', icon: CalendarDaysIcon },
              { key: 'realtime', label: '실시간', icon: ClockIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 학습자</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.learningProgress.length}명
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 진도</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceIndicators.avgProgress}%
                  </p>
                  <div className={`flex items-center mt-1 ${performanceIndicators.progressChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceIndicators.progressChange >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(performanceIndicators.progressChange)}%
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">평균 점수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceIndicators.avgScore}점
                  </p>
                  <div className={`flex items-center mt-1 ${performanceIndicators.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceIndicators.scoreChange >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(performanceIndicators.scoreChange)}점
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">완료율</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceIndicators.completionRate}%
                  </p>
                  <div className={`flex items-center mt-1 ${performanceIndicators.completionChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {performanceIndicators.completionChange >= 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm font-medium">
                      {Math.abs(performanceIndicators.completionChange)}%
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 차트 섹션 */}
          {viewMode === 'charts' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 시계열 트렌드 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">학습 활동 트렌드</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalActiveUsers" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="newEnrollments" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 부서별 성과 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">부서별 성과 분포</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.departmentStats}
                      dataKey="avgScore"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ department, avgScore }) => `${department}: ${avgScore}점`}
                    >
                      {analyticsData.departmentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            /* 테이블 뷰 */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">학습 진도 상세</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부서</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과정</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">진도율</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">점수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학습시간</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.learningProgress.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                            <span>{item.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.score}점
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.timeSpent}분
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 과정별 완료도 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">과정별 완료도</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.courseCompletion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="courseName" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgProgress" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 부서별 진도 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">부서별 학습 진도</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.departmentStats}
                  dataKey="avgProgress"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ department, avgProgress }) => `${department}: ${avgProgress}%`}
                >
                  {analyticsData.departmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 성과 레이더 차트 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">종합 성과 분석</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={analyticsData.performanceMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="현재 성과"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 부서별 성과 비교 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">부서별 성과 비교</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* 시계열 트렌드 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">학습 활동 트렌드</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completions" stroke="#3b82f6" name="완료" />
                <Line type="monotone" dataKey="newEnrollments" stroke="#10b981" name="신규 등록" />
                <Line type="monotone" dataKey="totalActiveUsers" stroke="#f59e0b" name="활성 사용자" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 활동 히트맵 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">요일별 시간대 활동 패턴</h3>
            <div className="space-y-2">
              {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <div className="w-8 text-sm text-gray-600">{day}</div>
                  <div className="flex space-x-1">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const heatData = analyticsData.heatMapData.find(d => d.day === day && d.hour === hour);
                      const activity = heatData?.activity || 0;
                      const intensity = Math.min(activity / 100, 1);
                      return (
                        <div
                          key={hour}
                          className="w-4 h-4 rounded-sm cursor-pointer hover:ring-2 hover:ring-blue-300"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                            border: intensity > 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #e5e7eb'
                          }}
                          title={`${day} ${hour}:00 - 활동도: ${activity}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                <span>0시</span>
                <span>6시</span>
                <span>12시</span>
                <span>18시</span>
                <span>23시</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>낮음</span>
                <div className="flex space-x-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map(opacity => (
                    <div
                      key={opacity}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                    />
                  ))}
                </div>
                <span>높음</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'realtime' && (
        <div className="space-y-6">
          {/* 실시간 제어 패널 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">실시간 모니터링</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" />
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
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4" />
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
                    <UserGroupIcon className="h-8 w-8 text-blue-500" />
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
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
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
                    <AcademicCapIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">평균 응답시간</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {analyticsData.realTimeMetrics[analyticsData.realTimeMetrics.length - 1].avgResponseTime}ms
                      </p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-yellow-500" />
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
      )}
    </div>
  );
};

export default AdvancedAnalytics;