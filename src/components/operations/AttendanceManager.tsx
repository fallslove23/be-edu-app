'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  CalendarDays,
  BarChart2,
  FileDown,
  Filter,
  Search,
  Plus,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#F2F4F6] p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <ClipboardList className="h-8 w-8 text-blue-600" />
                </div>
                출석 현황 요약
              </h1>
              <p className="text-gray-600">
                과정별 출석 현황을 한눈에 확인하세요.
              </p>
            </div>
            <button
              onClick={() => router.push('/attendance')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-all flex items-center space-x-2"
            >
              <span>출석 관리로 이동</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 요약 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">평균 출석률</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.averageAttendanceRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 세션 수</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalSessions}개</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">총 교육생</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalStudents}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">오늘 세션</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.todaySessions}개</p>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-2xl flex-shrink-0">
              <BarChart2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                전체 출석 관리 기능
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                실시간 출석 체크, 교육생별 출석 현황, 출석 통계 분석 등 모든 출석 관리 기능은
                <span className="font-semibold text-blue-600"> 출석 관리 페이지</span>에서 이용하실 수 있습니다.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-6">
                <li className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  차수별/날짜별 출석 체크
                </li>
                <li className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  교육생별 출석 현황 및 통계
                </li>
                <li className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  일별/차수별 출석 통계
                </li>
                <li className="flex items-center p-3 bg-gray-50 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  출석부 Excel 다운로드
                </li>
              </ul>
              <button
                onClick={() => router.push('/attendance')}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow transition-all inline-flex items-center space-x-2"
              >
                <span>출석 관리로 이동</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;