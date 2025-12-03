'use client';

import React from 'react';
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
} from 'lucide-react';
import EnhancedDashboard from './EnhancedDashboard';
import RolePreviewSelector from '../admin/RolePreviewSelector';
import TraineeDashboard from '../trainee/TraineeDashboard';
import InstructorDashboard from '../instructor/InstructorDashboard';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardWrapperProps {
  onNavigate?: (view: string) => void;
}

import { PageContainer } from '../common/PageContainer';

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'manager'].includes(user.role);

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0] || 'A'}
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.name || '관리자'}님
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* 역할 미리보기 버튼 */}
            {isAdmin && <RolePreviewSelector />}

            <button
              onClick={() => onNavigate?.('search')}
              className="p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="검색"
            >
              <Search className="w-6 h-6" />
            </button>
            <button
              onClick={() => onNavigate?.('messages')}
              className="p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="메시지"
            >
              <MessageCircle className="w-6 h-6" />
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
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-6">
              <div className="inline-flex items-baseline justify-center space-x-2">
                <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
                  8
                </span>
                <span className="text-xl font-medium text-gray-500 dark:text-gray-400">
                  개 과정 진행중
                </span>
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
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">오늘 출석률</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">98.5%</div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-gray-700/50">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">총 교육생</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">156명</div>
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
            onClick={() => onNavigate?.('messages')}
            className="flex flex-col items-center space-y-1 group"
          >
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">메시지</span>
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

        {/* Original Dashboard Content (Hidden or moved below) */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2">상세 대시보드</h3>
          <EnhancedDashboard embedded={true} />
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
