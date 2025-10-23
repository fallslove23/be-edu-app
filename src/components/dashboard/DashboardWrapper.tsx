import React from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BellIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const DashboardWrapper: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🏠 대시보드</h1>
        
        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">총 교육생</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">247</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="sr-only">증가</span>
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">진행 중인 과정</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">8</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="sr-only">증가</span>
                      2개
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">평균 출석률</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">94%</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="sr-only">증가</span>
                      3%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">이번 주 일정</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">23</div>
                    <div className="ml-2 text-sm text-gray-500">
                      세션
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 최근 활동 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">BS Basic 3차 과정 완료</p>
                    <p className="text-sm text-gray-500">25명 수료 - 30분 전</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <BellIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">새로운 교육생 등록</p>
                    <p className="text-sm text-gray-500">김교육 외 3명 - 1시간 전</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">BS Advanced 4차 개설</p>
                    <p className="text-sm text-gray-500">2025년 1월 20일 시작 - 2시간 전</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 액션 - 트렌디한 디자인 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">빠른 작업</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* 새 과정 개설 */}
                <button className="group relative p-5 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 text-left border border-gray-200 hover:border-indigo-300 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-700 group-hover:scale-105 transition-all shadow-sm">
                      <AcademicCapIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-base">새 과정 개설</h4>
                  <p className="text-sm text-gray-500">BS 과정 차수 생성</p>
                </button>

                {/* 교육생 등록 */}
                <button className="group relative p-5 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 text-left border border-gray-200 hover:border-emerald-300 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-700 group-hover:scale-105 transition-all shadow-sm">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-base">교육생 등록</h4>
                  <p className="text-sm text-gray-500">새 교육생 추가</p>
                </button>

                {/* 출석 체크 */}
                <button className="group relative p-5 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 text-left border border-gray-200 hover:border-sky-300 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-sky-600 rounded-xl flex items-center justify-center group-hover:bg-sky-700 group-hover:scale-105 transition-all shadow-sm">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-base">출석 체크</h4>
                  <p className="text-sm text-gray-500">오늘 출석 현황</p>
                </button>

                {/* 일정 관리 */}
                <button className="group relative p-5 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 text-left border border-gray-200 hover:border-violet-300 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center group-hover:bg-violet-700 group-hover:scale-105 transition-all shadow-sm">
                      <CalendarDaysIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-base">일정 관리</h4>
                  <p className="text-sm text-gray-500">과정 스케줄 확인</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          BS 학습 관리 시스템 - 실시간 대시보드
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;