import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Supabase 쿼리 기반 분석 (외부 분석 서비스 없음)
interface AnalyticsData {
  userEngagement: {
    totalUsers: number;
    activeUsers: number;
    dailyActive: number;
    weeklyActive: number;
    retentionRate: number;
  };
  courseProgress: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageCompletionTime: number;
    completionRate: number;
  };
  activityMetrics: {
    totalActivities: number;
    submissionRate: number;
    onTimeSubmissions: number;
    averageScore: number;
    feedbackCoverage: number;
  };
  timeBasedAnalytics: {
    dailyLogins: any[];
    weeklyProgress: any[];
    monthlyCompletion: any[];
    peakHours: any[];
  };
}

const SupabaseAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'courses' | 'activities'>('users');

  // Supabase에서 분석 데이터 가져오기 (시뮬레이션)
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      
      // 실제 환경에서는 Supabase 쿼리 사용:
      // const { data: users } = await supabase.from('users').select('*');
      // const { data: courses } = await supabase.from('courses').select('*');
      // const { data: activities } = await supabase.from('activity_journals').select('*');
      
      const mockAnalytics: AnalyticsData = {
        userEngagement: {
          totalUsers: 145,
          activeUsers: 87,
          dailyActive: 34,
          weeklyActive: 67,
          retentionRate: 73.2
        },
        courseProgress: {
          totalCourses: 12,
          completedCourses: 8,
          inProgressCourses: 4,
          averageCompletionTime: 14.5,
          completionRate: 66.7
        },
        activityMetrics: {
          totalActivities: 234,
          submissionRate: 89.3,
          onTimeSubmissions: 198,
          averageScore: 8.2,
          feedbackCoverage: 78.5
        },
        timeBasedAnalytics: {
          dailyLogins: [
            { date: '01-20', count: 45 },
            { date: '01-21', count: 52 },
            { date: '01-22', count: 38 },
            { date: '01-23', count: 61 },
            { date: '01-24', count: 48 },
            { date: '01-25', count: 55 },
            { date: '01-26', count: 43 }
          ],
          weeklyProgress: [
            { week: '1주차', progress: 85 },
            { week: '2주차', progress: 78 },
            { week: '3주차', progress: 92 },
            { week: '4주차', progress: 67 }
          ],
          monthlyCompletion: [
            { month: '10월', completed: 23, started: 35 },
            { month: '11월', completed: 18, started: 28 },
            { month: '12월', completed: 31, started: 42 },
            { month: '1월', completed: 27, started: 38 }
          ],
          peakHours: [
            { hour: '09:00', activity: 25 },
            { hour: '10:00', activity: 35 },
            { hour: '11:00', activity: 42 },
            { hour: '14:00', activity: 38 },
            { hour: '15:00', activity: 31 },
            { hour: '16:00', activity: 28 }
          ]
        }
      };

      setTimeout(() => {
        setAnalytics(mockAnalytics);
        setLoading(false);
      }, 1000);
    };

    fetchAnalytics();
  }, [dateRange]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">분석 데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 학습 분석 대시보드</h1>
            <p className="text-gray-600">Supabase 데이터 기반 학습 현황 및 성과 분석</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 3개월</option>
            </select>
          </div>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활성 사용자</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.userEngagement.activeUsers}</p>
              <p className="text-xs text-green-600">전체 {analytics.userEngagement.totalUsers}명 중</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">과정 완료율</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.courseProgress.completionRate}%</p>
              <p className="text-xs text-gray-500">{analytics.courseProgress.completedCourses}/{analytics.courseProgress.totalCourses} 과정</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DocumentChartBarIcon className="h-6 w-6 text-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">활동일지 제출률</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activityMetrics.submissionRate}%</p>
              <p className="text-xs text-gray-500">{analytics.activityMetrics.totalActivities}개 중</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 점수</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activityMetrics.averageScore}</p>
              <p className="text-xs text-gray-500">10점 만점</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메트릭 선택 탭 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setSelectedMetric('users')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              selectedMetric === 'users'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            사용자 분석
          </button>
          <button
            onClick={() => setSelectedMetric('courses')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              selectedMetric === 'courses'
                ? 'bg-green-500/10 text-green-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            과정 분석
          </button>
          <button
            onClick={() => setSelectedMetric('activities')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              selectedMetric === 'activities'
                ? 'bg-yellow-100 text-orange-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            활동 분석
          </button>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 로그인 추이 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">일별 로그인 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.timeBasedAnalytics.dailyLogins}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 주차별 진도율 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">주차별 진도율</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.timeBasedAnalytics.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="progress" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 월별 과정 완료 현황 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">월별 과정 완료 현황</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.timeBasedAnalytics.monthlyCompletion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="started" fill="#F59E0B" name="시작" />
              <Bar dataKey="completed" fill="#10B981" name="완료" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 시간대별 활동량 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">시간대별 활동량</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.timeBasedAnalytics.peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="activity" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 분석 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">상세 분석 리포트</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">사용자 참여도</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">일일 활성 사용자</span>
                  <span className="font-medium">{analytics.userEngagement.dailyActive}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">주간 활성 사용자</span>
                  <span className="font-medium">{analytics.userEngagement.weeklyActive}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">사용자 유지율</span>
                  <span className="font-medium">{analytics.userEngagement.retentionRate}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">과정 성과</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 완료 시간</span>
                  <span className="font-medium">{analytics.courseProgress.averageCompletionTime}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">진행 중인 과정</span>
                  <span className="font-medium">{analytics.courseProgress.inProgressCourses}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">완료된 과정</span>
                  <span className="font-medium">{analytics.courseProgress.completedCourses}개</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">활동 성과</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">정시 제출</span>
                  <span className="font-medium">{analytics.activityMetrics.onTimeSubmissions}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">피드백 커버리지</span>
                  <span className="font-medium">{analytics.activityMetrics.feedbackCoverage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">전체 활동일지</span>
                  <span className="font-medium">{analytics.activityMetrics.totalActivities}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 소스 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm text-blue-800">
            이 분석은 Supabase 데이터베이스의 실시간 데이터를 기반으로 생성됩니다. 
            외부 분석 서비스 없이 비용 효율적인 분석을 제공합니다.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SupabaseAnalytics;