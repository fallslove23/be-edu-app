import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalStudents: number;
  activeCourses: number;
  completedExams: number;
  averageAttendance: number;
  upcomingExams: number;
  needsAttention: number;
}

interface RecentActivity {
  id: string;
  type: 'exam' | 'attendance' | 'course' | 'performance';
  title: string;
  description: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface QuickStats {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeCourses: 0,
    completedExams: 0,
    averageAttendance: 0,
    upcomingExams: 0,
    needsAttention: 0
  });

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'exam',
      title: '새로운 시험 완료',
      description: '김민수님이 "영업 기초 이론 평가"를 완료했습니다. (85점)',
      time: '10분 전',
      priority: 'medium'
    },
    {
      id: '2',
      type: 'attendance',
      title: '출석 확인 필요',
      description: '정다은님이 3일 연속 결석했습니다.',
      time: '1시간 전',
      priority: 'high'
    },
    {
      id: '3',
      type: 'course',
      title: '새 과정 시작',
      description: '"BS 고급 영업 전략" 과정이 시작되었습니다.',
      time: '2시간 전',
      priority: 'low'
    },
    {
      id: '4',
      type: 'performance',
      title: '성과 향상',
      description: '이영희님의 전체 성과가 "우수" 등급으로 향상되었습니다.',
      time: '4시간 전',
      priority: 'medium'
    }
  ]);

  const [quickStats] = useState<QuickStats[]>([
    { label: '이번 주 출석률', value: 92, change: 5, trend: 'up', color: 'text-green-600' },
    { label: '평균 시험 점수', value: 78, change: -2, trend: 'down', color: 'text-red-600' },
    { label: '진행 중인 과정', value: 8, change: 1, trend: 'up', color: 'text-blue-600' },
    { label: '완료된 시험', value: 24, change: 8, trend: 'up', color: 'text-purple-600' }
  ]);

  useEffect(() => {
    // 실제로는 API에서 데이터를 가져올 것
    setStats({
      totalStudents: 45,
      activeCourses: 8,
      completedExams: 24,
      averageAttendance: 92,
      upcomingExams: 5,
      needsAttention: 3
    });
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'exam': return '🎯';
      case 'attendance': return '✅';
      case 'course': return '📚';
      case 'performance': return '📈';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
            <p className="text-gray-600">BS 학습 관리 시스템의 전체 현황을 한눈에 확인하세요.</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              weekday: 'long' 
            })}
          </div>
        </div>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 교육생</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">활성 과정</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">완료된 시험</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedExams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">주의 필요</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.needsAttention}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          빠른 통계
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                {stat.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                ) : stat.trend === 'down' ? (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                ) : (
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-semibold ${stat.color}`}>
                  {stat.value}{stat.label.includes('점수') || stat.label.includes('출석률') ? (stat.label.includes('출석률') ? '%' : '점') : ''}
                </span>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 공지사항 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              공지사항
            </h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
              전체보기
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2">
                      📌 고정
                    </span>
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      긴급
                    </span>
                  </div>
                  <p className="font-medium text-red-900 mt-2">새로운 영업 교육 과정 개설 안내</p>
                  <p className="text-sm text-red-700 mt-1">BS 영업 기초과정과 고급 영업 전략 과정이 새롭게 개설되었습니다.</p>
                </div>
                <span className="text-xs text-red-500">8월 20일</span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                      📌 고정
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      긴급
                    </span>
                  </div>
                  <p className="font-medium text-blue-900 mt-2">8월 정기 시험 일정 공지</p>
                  <p className="text-sm text-blue-700 mt-1">8월 정기 시험이 8월 25일 진행됩니다. 출석 확인 및 시험 준비를 완료해주세요.</p>
                </div>
                <span className="text-xs text-blue-500">8월 18일</span>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      보통
                    </span>
                  </div>
                  <p className="font-medium text-yellow-900 mt-2">출석 관리 시스템 업데이트</p>
                  <p className="text-sm text-yellow-700 mt-1">출석 관리 시스템이 업데이트되어 더욱 편리하게 이용할 수 있습니다.</p>
                </div>
                <span className="text-xs text-yellow-500">8월 15일</span>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📋 최근 활동</h2>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className={`p-4 rounded-lg border-l-4 ${getPriorityColor(activity.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="mr-2">{getActivityIcon(activity.type)}</span>
                      <span className="font-medium text-gray-900">{activity.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              모든 활동 보기 →
            </button>
          </div>
        </div>

        {/* 오늘의 일정 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">📅 오늘의 일정</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="font-medium text-blue-900">영업 기초 과정 (1차시)</div>
                <div className="text-sm text-blue-700">09:00 - 12:00</div>
              </div>
              <div className="text-blue-600">📚</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="font-medium text-green-900">출석 확인</div>
                <div className="text-sm text-green-700">12:00 - 13:00</div>
              </div>
              <div className="text-green-600">✅</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div>
                <div className="font-medium text-purple-900">CRM 활용 시험</div>
                <div className="text-sm text-purple-700">14:00 - 15:00</div>
              </div>
              <div className="text-purple-600">🎯</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <div className="font-medium text-orange-900">주간 성과 리뷰</div>
                <div className="text-sm text-orange-700">16:00 - 17:00</div>
              </div>
              <div className="text-orange-600">📈</div>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">⚡ 빠른 액션</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-center">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-medium text-blue-900">새 과정 생성</div>
            <div className="text-sm text-blue-700">과정 추가하기</div>
          </button>
          
          <button className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium text-green-900">출석 확인</div>
            <div className="text-sm text-green-700">오늘 출석 관리</div>
          </button>
          
          <button className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium text-purple-900">새 시험 생성</div>
            <div className="text-sm text-purple-700">시험 만들기</div>
          </button>
          
          <button className="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-orange-900">성과 리포트</div>
            <div className="text-sm text-orange-700">분석 보고서</div>
          </button>
        </div>
      </div>

      {/* 시스템 상태 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">🔧 시스템 상태</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium text-green-900">서버 상태</div>
              <div className="text-sm text-green-700">정상 운영 중</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium text-green-900">데이터베이스</div>
              <div className="text-sm text-green-700">연결 정상</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <div className="font-medium text-green-900">백업</div>
              <div className="text-sm text-green-700">최근 백업: 2시간 전</div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;