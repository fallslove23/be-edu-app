'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Users,
  GraduationCap,
  BarChart2,
  CalendarDays,
  LayoutGrid,
  Search,
  MessageCircle,
  Copy,
  MoreVertical,
  CreditCard,
  Utensils,
  Plane,
  Wallet,
  CheckCircle,
  ClipboardCheck,
  TrendingUp,
  FolderOpen,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import ErrorBoundary from '../common/ErrorBoundary';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import { DashboardService, type DashboardStats } from '../../services/dashboard.service';

// Dynamic imports for heavy dashboard components
const ImprovedDashboard = dynamic(() => import('./ImprovedDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false,
});

const TraineeDashboard = dynamic(() => import('../trainee/TraineeDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false,
});

const InstructorDashboard = dynamic(() => import('../instructor/InstructorDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false,
});

interface DashboardWrapperProps {
  onNavigate?: (view: string) => void;
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Load dashboard stats
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await DashboardService.getMainStats();
      setStats(dashboardStats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setShowMoreMenu(false);
    loadDashboardStats();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 교육생 대시보드 렌더링
  if (user?.role === 'trainee') {
    return <TraineeDashboard traineeId={user.id} />;
  }

  // 강사 대시보드 렌더링
  if (user?.role === 'instructor') {
    return <InstructorDashboard instructorId={user.id} />;
  }

  // 관리자 대시보드 렌더링
  return (
    <div className="min-h-screen bg-[#F2F4F6] dark:bg-gray-900 p-4 sm:p-6 pb-24 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <PageHeader
            title={`${user?.name || '관리자'}님`}
            description="오늘도 즐거운 하루 되세요!"
            badge={user?.role === 'admin' ? '관리자' : '매니저'}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.('search')}
              className="p-2 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all shadow-sm hover:shadow-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              title="검색"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner - Notice */}
        <div
          onClick={() => onNavigate?.('notices')}
          className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
        >
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">새로운 공지사항이 있습니다</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">12월 정기 시스템 점검 안내 <span className="inline-block ml-1">&gt;</span></p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📢</span>
          </div>
        </div>

        {/* Main Card (LMS Status Style) */}
        {/* Main Card (LMS Status Style) */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-lg relative overflow-hidden border border-gray-100 dark:border-gray-700 group">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity opacity-50 group-hover:opacity-70"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">교육 현황</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
                      2024 하반기
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    BS Education Center
                  </div>
                </div>
              </div>
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20">
                    <button
                      onClick={handleRefresh}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? '새로고침 중...' : '새로고침'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        onNavigate?.('analytics');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span>📊</span> 상세 분석 보기
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center py-6">
              <div className="inline-flex items-baseline justify-center space-x-2">
                {loading ? (
                  <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <>
                    <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
                      {stats?.activeCourses || 0}
                    </span>
                    <span className="text-xl font-medium text-gray-500 dark:text-gray-400">
                      개 과정 진행중
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => onNavigate?.('course-management')}
                className="py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all hover:scale-[1.02] active:scale-95 text-center shadow-sm"
              >
                과정 관리
              </button>
              <button
                onClick={() => onNavigate?.('trainees')}
                className="py-4 rounded-2xl bg-white dark:bg-gray-700 border-2 border-indigo-50 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:scale-[1.02] active:scale-95 text-center shadow-sm"
              >
                교육생 관리
              </button>
            </div>

            {/* Sub Info (Attendance / New Students) */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-gray-700/50">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">평균 출석률</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : `${stats?.averageAttendance.toFixed(1) || 0}%`}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-gray-700/50">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">총 교육생</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : `${stats?.totalTrainees || 0}명`}
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center space-x-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
              <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>

        {/* Middle Action Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center justify-between border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">빠른 출석 체크</span>
          </div>
          <button
            onClick={() => onNavigate?.('attendance')}
            className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            바로가기
          </button>
        </div>

        {/* Horizontal Menu */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex justify-around items-center border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onNavigate?.('my-courses')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">내 강의실</span>
          </button>
          <div className="h-8 w-px bg-gray-100 dark:bg-gray-700"></div>
          <button
            onClick={() => onNavigate?.('assignments')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">과제</span>
          </button>
          <div className="h-8 w-px bg-gray-100 dark:bg-gray-700"></div>
          <button
            onClick={() => onNavigate?.('grades')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">성적</span>
          </button>
          <div className="h-8 w-px bg-gray-100 dark:bg-gray-700"></div>
          <button
            onClick={() => onNavigate?.('statistics')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">통계</span>
          </button>
        </div>

        {/* Bottom Grid (Colorful Cards) */}
        <div className="grid grid-cols-3 gap-4">
          {/* Orange Card - Schedule */}
          <button
            onClick={() => onNavigate?.('schedule-management')}
            className="bg-[#FF8800] rounded-3xl p-5 h-40 relative overflow-hidden text-left hover:opacity-90 transition-opacity shadow-sm group"
          >
            <h3 className="text-white font-bold text-lg relative z-10">일정 관리</h3>
            <div className="absolute bottom-[-10px] right-[-10px] opacity-90 group-hover:scale-110 transition-transform duration-300">
              <CalendarDays className="w-20 h-20 text-white/30" />
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 rounded-full blur-xl"></div>
            </div>
            <div className="absolute bottom-4 right-4">
              <CalendarDays className="w-10 h-10 text-white" />
            </div>
          </button>

          {/* Blue Card - Analytics */}
          <button
            onClick={() => onNavigate?.('analytics')}
            className="bg-[#28C2FF] rounded-3xl p-5 h-40 relative overflow-hidden text-left hover:opacity-90 transition-opacity shadow-sm group"
          >
            <h3 className="text-white font-bold text-lg relative z-10">성과 분석</h3>
            <div className="absolute bottom-2 right-2 group-hover:scale-110 transition-transform duration-300">
              <BarChart2 className="w-16 h-16 text-white/90" />
            </div>
            <div className="absolute bottom-4 left-4">
              <TrendingUp className="w-8 h-8 text-white/50" />
            </div>
          </button>

          {/* White Card - Resources */}
          {/* White Card - Resources */}
          <button
            onClick={() => onNavigate?.('materials-library')}
            className="bg-white dark:bg-gray-800 rounded-3xl p-5 h-40 relative overflow-hidden text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-100 dark:border-gray-700 group"
          >
            <h3 className="text-gray-900 dark:text-white font-bold text-lg relative z-10">자료실</h3>
            <div className="absolute bottom-4 right-4 group-hover:scale-110 transition-transform duration-300">
              <FolderOpen className="w-14 h-14 text-indigo-500 dark:text-indigo-400" />
            </div>
          </button>
        </div>

        {/* Improved Dashboard Content */}
        <div className="pt-8">
          <ErrorBoundary>
            <ImprovedDashboard />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardWrapper);
