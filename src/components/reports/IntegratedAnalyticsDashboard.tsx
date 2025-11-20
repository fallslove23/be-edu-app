import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  AcademicCapIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
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
  ResponsiveContainer
} from 'recharts';
import { AnalyticsService } from '../../services/analytics.service';
import { ReportExportUtil } from '../../utils/report-export.util';
import type {
  AnalyticsSummary,
  CoursePerformance,
  StudentPerformance,
  DepartmentStats,
  TimeSeriesData,
  DateRange,
  AnalyticsFilter
} from '../../types/analytics.types';

/**
 * 통합 분석 대시보드 컴포넌트
 */
const IntegratedAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'courses' | 'students' | 'departments'>('summary');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [loading, setLoading] = useState(true);

  // 데이터 상태
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  const filter: AnalyticsFilter = { date_range: dateRange };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [summaryData, coursesData, studentsData, deptsData, timeData] = await Promise.all([
        AnalyticsService.getSummary(filter),
        AnalyticsService.getCoursePerformance(undefined, filter),
        AnalyticsService.getStudentPerformance(filter),
        AnalyticsService.getDepartmentStats(),
        AnalyticsService.getTimeSeriesData(30, filter)
      ]);

      setSummary(summaryData);
      setCoursePerformance(coursesData);
      setStudentPerformance(studentsData);
      setDepartmentStats(deptsData);
      setTimeSeriesData(timeData);
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    if (summary) {
      ReportExportUtil.exportAnalyticsSummaryToExcel(summary);
    }
  };

  const handleExportCourses = () => {
    if (coursePerformance.length > 0) {
      ReportExportUtil.exportCoursePerformanceToExcel(coursePerformance);
    }
  };

  const handleExportStudents = () => {
    if (studentPerformance.length > 0) {
      ReportExportUtil.exportStudentPerformanceToExcel(studentPerformance);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">분석 데이터 로드 중...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📊 통합 분석 대시보드</h1>
          <p className="text-muted-foreground mt-1">
            전체 교육 성과 및 통계 분석
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
            <option value="month">최근 1개월</option>
            <option value="quarter">최근 3개월</option>
            <option value="year">최근 1년</option>
          </select>

          {/* 새로고침 */}
          <button
            onClick={loadAnalyticsData}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="총 교육생"
            value={summary.total_students}
            subtitle={`활성: ${summary.active_students}`}
            growth={summary.student_growth}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="indigo"
          />
          <StatCard
            title="활성 과정"
            value={summary.active_courses}
            subtitle={`전체: ${summary.total_courses}`}
            growth={summary.course_growth}
            icon={<AcademicCapIcon className="h-6 w-6" />}
            color="cyan"
          />
          <StatCard
            title="완료율"
            value={`${summary.completion_rate.toFixed(1)}%`}
            subtitle={`인증서: ${summary.total_certificates}`}
            growth={summary.completion_growth}
            icon={<DocumentChartBarIcon className="h-6 w-6" />}
            color="emerald"
          />
          <StatCard
            title="평균 점수"
            value={summary.average_score.toFixed(1)}
            subtitle={`출석률: ${summary.average_attendance.toFixed(1)}%`}
            growth={summary.score_growth}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="amber"
          />
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          {[
            { id: 'summary', label: '개요', icon: ChartBarIcon },
            { id: 'courses', label: '과정별 분석', icon: AcademicCapIcon },
            { id: 'students', label: '교육생별 분석', icon: UserGroupIcon },
            { id: 'departments', label: '부서별 통계', icon: DocumentChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 내용 */}
      <div className="mt-6">
        {activeTab === 'summary' && (
          <SummaryTab
            timeSeriesData={timeSeriesData}
            departmentStats={departmentStats}
            onExport={handleExportSummary}
          />
        )}

        {activeTab === 'courses' && (
          <CoursesTab
            coursePerformance={coursePerformance}
            onExport={handleExportCourses}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTab
            studentPerformance={studentPerformance}
            onExport={handleExportStudents}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsTab
            departmentStats={departmentStats}
          />
        )}
      </div>
    </div>
  );
};

// ========== 통계 카드 컴포넌트 ==========
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  growth: number;
  icon: React.ReactNode;
  color: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, growth, icon, color }) => {
  const colorClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400'
  };

  const isPositive = growth >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowTrendingUpIcon className="h-4 w-4 mr-1" /> : <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />}
          {Math.abs(growth).toFixed(1)}%
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
};

// ========== 개요 탭 ==========
interface SummaryTabProps {
  timeSeriesData: TimeSeriesData[];
  departmentStats: DepartmentStats[];
  onExport: () => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ timeSeriesData, departmentStats, onExport }) => {
  const enrollmentChartData = timeSeriesData.map(d => ({
    date: new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    등록: d.new_enrollments,
    완료: d.completions
  }));

  const deptChartData = departmentStats.map(d => ({
    name: d.department,
    value: d.total_students
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="btn-primary flex items-center"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Excel 다운로드
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 등록 및 완료 추이 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">등록 및 완료 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="등록" stroke="#4f46e5" strokeWidth={2} />
              <Line type="monotone" dataKey="완료" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 부서별 교육생 분포 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">부서별 교육생 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deptChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {deptChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ========== 과정별 분석 탭 ==========
interface CoursesTabProps {
  coursePerformance: CoursePerformance[];
  onExport: () => void;
}

const CoursesTab: React.FC<CoursesTabProps> = ({ coursePerformance, onExport }) => {
  const chartData = coursePerformance.slice(0, 10).map(c => ({
    name: c.course_name.length > 15 ? c.course_name.substring(0, 15) + '...' : c.course_name,
    완료율: c.completion_rate,
    평균점수: c.average_score
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="btn-primary flex items-center"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Excel 다운로드
        </button>
      </div>

      {/* 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">과정별 성과 비교</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="완료율" fill="#4f46e5" />
            <Bar dataKey="평균점수" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">과정명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">등록자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">완료율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평균점수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">출석률</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {coursePerformance.map((course) => (
                <tr key={course.course_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{course.course_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.total_enrolled}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.completion_rate.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.average_score.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.average_attendance.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ========== 교육생별 분석 탭 ==========
interface StudentsTabProps {
  studentPerformance: StudentPerformance[];
  onExport: () => void;
}

const StudentsTab: React.FC<StudentsTabProps> = ({ studentPerformance, onExport }) => {
  const topStudents = [...studentPerformance]
    .sort((a, b) => b.overall_average - a.overall_average)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="btn-primary flex items-center"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Excel 다운로드
        </button>
      </div>

      {/* 상위 10명 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🏆 상위 성적 교육생</h3>
        <div className="space-y-3">
          {topStudents.map((student, index) => (
            <div key={student.student_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? 'bg-amber-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{student.student_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{student.department}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{student.overall_average.toFixed(1)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">완료: {student.completed_courses}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">부서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평균점수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">완료과정</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">백분위</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {studentPerformance.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{student.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.overall_average.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.completed_courses}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.percentile.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ========== 부서별 통계 탭 ==========
interface DepartmentsTabProps {
  departmentStats: DepartmentStats[];
}

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ departmentStats }) => {
  const chartData = departmentStats.map(d => ({
    name: d.department,
    교육생수: d.total_students,
    평균점수: d.average_score,
    완료율: d.completion_rate
  }));

  return (
    <div className="space-y-6">
      {/* 차트 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">부서별 성과 비교</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="교육생수" fill="#4f46e5" />
            <Bar dataKey="평균점수" fill="#10b981" />
            <Bar dataKey="완료율" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">부서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">총 교육생</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">활성 교육생</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평균 점수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">완료율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">등록 과정 수</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {departmentStats.map((dept) => (
                <tr key={dept.department} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{dept.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dept.total_students}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dept.active_students}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dept.average_score.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dept.completion_rate.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dept.total_courses_enrolled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IntegratedAnalyticsDashboard;
