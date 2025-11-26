'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Student {
  id: string;
  name: string;
  department: string;
  courseCode: string;
  courseName: string;
  photo?: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  note?: string;
  courseCode: string;
  sessionName: string;
}

interface AttendanceSession {
  id: string;
  date: string;
  courseCode: string;
  courseName: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  instructor: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

const AttendanceManager: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    totalSessions: 0,
    averageAttendanceRate: 0,
    totalStudents: 0,
    todaySessions: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    // 모의 데이터로 요약 통계 생성
    setTimeout(() => {
      setSummaryStats({
        totalSessions: 12,
        averageAttendanceRate: 92.3,
        totalStudents: 43,
        todaySessions: 2,
      });
      setLoading(false);
    }, 500);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">출석 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">📋 출석 현황 요약</h1>
            <p className="text-gray-600 dark:text-gray-300">
              과정별 출석 현황을 한눈에 확인하세요.
            </p>
          </div>
          <button
            onClick={() => router.push('/attendance')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
          >
            <span>출석 관리로 이동</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 출석률</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.averageAttendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 세션 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.totalSessions}개</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 교육생</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.totalStudents}명</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">오늘 세션</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.todaySessions}개</p>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
            <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              전체 출석 관리 기능
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              실시간 출석 체크, 교육생별 출석 현황, 출석 통계 분석 등 모든 출석 관리 기능은
              <span className="font-semibold"> 출석 관리 페이지</span>에서 이용하실 수 있습니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                차수별/날짜별 출석 체크
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                교육생별 출석 현황 및 통계
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                일별/차수별 출석 통계
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                출석부 Excel 다운로드
              </li>
            </ul>
            <button
              onClick={() => router.push('/attendance')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:shadow transition-all inline-flex items-center space-x-2"
            >
              <span>출석 관리로 이동</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;