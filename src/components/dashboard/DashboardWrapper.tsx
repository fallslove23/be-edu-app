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
} from 'lucide-react';
import EnhancedDashboard from './EnhancedDashboard';
import RolePreviewSelector from '../admin/RolePreviewSelector';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardWrapperProps {
  onNavigate?: (view: string) => void;
}

import { PageContainer } from '../common/PageContainer';

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user && ['admin', 'manager'].includes(user.role);

  return (
    <div className="min-h-screen bg-[#F2F4F6] p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {user?.name || '최효동'}님
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
              <Search className="w-6 h-6" />
            </button>
            <button className="p-2 text-gray-800 hover:bg-gray-200 rounded-full transition-colors">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Banner */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <div>
            <p className="text-xs text-gray-500 mb-1">커플 모임통장이 드리는 데이트 지원금♥</p>
            <p className="text-sm font-bold text-gray-900">선착순 200명! 5만원 받으러 가기 <span className="inline-block ml-1">&gt;</span></p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">💌</span>
          </div>
        </div>

        {/* Main Card (Account Style) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-gray-900">입출금</span>
                  <span className="text-sm text-gray-500 underline decoration-gray-300 underline-offset-2">쏠편한 입출금통장(저축예금)</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center">
                  신한 110-580-623839 <Copy className="w-3 h-3 ml-1 cursor-pointer" />
                </div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center py-4">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              43,759<span className="text-2xl font-normal ml-1">원</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => onNavigate?.('attendance')}
              className="py-3.5 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors text-center"
            >
              이체
            </button>
            <button
              onClick={() => onNavigate?.('course-management')}
              className="py-3.5 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors text-center"
            >
              급여클럽+
            </button>
          </div>

          {/* Sub Accounts / Info */}
          <div className="flex space-x-3 mt-6 overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex-shrink-0 bg-gray-50 rounded-2xl p-3 flex items-center space-x-3 min-w-[160px]">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                S
              </div>
              <div>
                <div className="text-xs text-gray-500">강서구50버4141최영철</div>
                <div className="text-sm font-bold text-gray-900">32,000</div>
              </div>
            </div>
            <div className="flex-shrink-0 bg-gray-50 rounded-2xl p-3 flex items-center space-x-3 min-w-[160px]">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                S
              </div>
              <div>
                <div className="text-xs text-gray-500">김아영</div>
                <div className="text-sm font-bold text-gray-900">1,300,000</div>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center space-x-1.5 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
          </div>
        </div>

        {/* Middle Action Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">신한 SOL Pay</span>
          </div>
          <button className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded-full hover:bg-blue-100 transition-colors">
            결제
          </button>
        </div>

        {/* Horizontal Menu */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex justify-around items-center">
          <div className="flex items-center space-x-1">
            <span className="text-blue-500 font-bold italic text-lg">Super</span>
            <span className="text-blue-600 font-bold text-lg">SOL</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <button className="text-blue-500 font-bold text-sm">카드</button>
          <div className="h-4 w-px bg-gray-200"></div>
          <button className="text-blue-500 font-bold text-sm">증권</button>
          <div className="h-4 w-px bg-gray-200"></div>
          <button className="text-purple-500 font-bold text-sm bg-purple-50 px-3 py-1 rounded-full">보험</button>
        </div>

        {/* Bottom Grid (Colorful Cards) */}
        <div className="grid grid-cols-3 gap-4">
          {/* Orange Card */}
          <button
            onClick={() => onNavigate?.('notices')}
            className="bg-[#FF8800] rounded-3xl p-5 h-40 relative overflow-hidden text-left hover:opacity-90 transition-opacity shadow-sm group"
          >
            <h3 className="text-white font-bold text-lg relative z-10">땡겨요</h3>
            <div className="absolute bottom-[-10px] right-[-10px] opacity-90 group-hover:scale-110 transition-transform duration-300">
              <Utensils className="w-20 h-20 text-white/30" />
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/20 rounded-full blur-xl"></div>
            </div>
            <div className="absolute bottom-4 right-4">
              <img src="https://cdn-icons-png.flaticon.com/512/1046/1046771.png" alt="chicken" className="w-12 h-12 object-contain opacity-90 drop-shadow-lg" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
          </button>

          {/* Blue Card */}
          <button
            onClick={() => onNavigate?.('schedule-management')}
            className="bg-[#28C2FF] rounded-3xl p-5 h-40 relative overflow-hidden text-left hover:opacity-90 transition-opacity shadow-sm group"
          >
            <h3 className="text-white font-bold text-lg relative z-10">SOL트래블</h3>
            <div className="absolute bottom-2 right-2 group-hover:scale-110 transition-transform duration-300">
              <Plane className="w-16 h-16 text-white/90" />
            </div>
            <div className="absolute bottom-4 left-4">
              <CreditCard className="w-10 h-10 text-white/50" />
            </div>
          </button>

          {/* White Card */}
          <button
            onClick={() => onNavigate?.('trainees')}
            className="bg-white rounded-3xl p-5 h-40 relative overflow-hidden text-left hover:bg-gray-50 transition-colors shadow-sm border border-gray-100 group"
          >
            <h3 className="text-gray-900 font-bold text-lg relative z-10">쏠지갑</h3>
            <div className="absolute bottom-4 right-4 group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-14 h-14 text-blue-500" />
            </div>
          </button>
        </div>

        {/* Original Dashboard Content (Hidden or moved below) */}
        <div className="pt-8 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">상세 대시보드</h3>
          <EnhancedDashboard />
        </div>
      </div>
    </div>
  );
};

export default DashboardWrapper;
