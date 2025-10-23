import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon
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
}

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'performance' | 'trends'>('overview');

  const { measureNow } = usePerformanceMonitor('AdvancedAnalytics', {
    loadTime: 3000,
    renderTime: 150
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

      return {
        learningProgress,
        courseCompletion,
        departmentStats,
        timeSeriesData,
        performanceMetrics
      };
    };

    setLoading(true);
    // API 호출 시뮬레이션
    setTimeout(() => {
      setAnalyticsData(generateMockData());
      setLoading(false);
    }, 1000);
  }, [selectedTimeRange, selectedDepartment, selectedCourse]);

  const exportData = () => {
    if (!analyticsData) return;
    
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
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

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
          <div className="flex flex-wrap items-center space-x-4">
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

            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              내보내기
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
              { key: 'trends', label: '트렌드', icon: CalendarDaysIcon }
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
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* KPI 카드들 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 학습자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.learningProgress.length}명
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 진도</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    analyticsData.learningProgress.reduce((sum, p) => sum + p.progress, 0) /
                    analyticsData.learningProgress.length
                  )}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    analyticsData.learningProgress.reduce((sum, p) => sum + p.score, 0) /
                    analyticsData.learningProgress.length
                  )}점
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.departmentStats.reduce((sum, d) => sum + d.activeUsers, 0)}명
                </p>
              </div>
            </div>
          </div>
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
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;