'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  QrCodeIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  AttendanceService,
  type AttendanceRecord,
  type AttendanceStatistics,
  type TraineeAttendanceSummary,
  type AttendanceStatus,
} from '../../services/attendance.service';
import { supabase } from '../../services/supabase';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';

type ViewMode = 'check' | 'trainee' | 'statistics';

interface Session {
  id: string;
  session_name: string;
  session_code: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface TraineeTarget {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  attendance_status: AttendanceStatus | null;
}

const IntegratedAttendanceManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('check');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceTargets, setAttendanceTargets] = useState<TraineeTarget[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics[]>([]);
  const [traineeSummary, setTraineeSummary] = useState<TraineeAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus | 'unchecked'>('all');

  // 초기 데이터 로드
  useEffect(() => {
    loadSessions();
  }, []);

  // 세션 변경 시 통계 및 요약 로드
  useEffect(() => {
    if (selectedSession) {
      loadStatistics(selectedSession.id);
      loadTraineeSummary(selectedSession.id);
    }
  }, [selectedSession]);

  // 세션과 날짜 선택 시 출석 대상 및 기록 로드
  useEffect(() => {
    if (selectedSession && selectedDate) {
      loadAttendanceTargets(selectedSession.id, selectedDate);
      loadAttendanceRecords(selectedSession.id, selectedDate);
    }
  }, [selectedSession, selectedDate]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_rounds')
        .select(`
          id,
          round_name,
          round_code,
          round_number,
          course_name,
          start_date,
          end_date,
          status
        `)
        .order('start_date', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Debug: 첫 번째 레코드 확인
      if (data && data.length > 0) {
        console.log('📊 Course Round Data Sample:', data[0]);
      }

      // Map course_rounds to Session interface with formatted display name
      const mappedSessions = (data || []).map(round => {
        // 차수 표시 형식: "25-8차 BS Basic" 또는 "{year}-{round_number}차 {course_name}"
        const year = round.start_date ? new Date(round.start_date).getFullYear().toString().slice(-2) : '';
        const displayName = round.round_number && round.course_name
          ? `${year}-${round.round_number}차 ${round.course_name}`
          : round.round_name; // fallback to round_name if fields are missing

        console.log('🔄 Mapping round:', {
          round_name: round.round_name,
          round_number: round.round_number,
          course_name: round.course_name,
          displayName
        });

        return {
          id: round.id,
          session_name: displayName,
          session_code: round.round_code,
          start_date: round.start_date,
          end_date: round.end_date,
          status: round.status
        };
      });

      setSessions(mappedSessions);

      if (mappedSessions.length > 0) {
        setSelectedSession(mappedSessions[0]);
      }
    } catch (error: any) {
      console.error('Failed to load sessions:', error);
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast.error(`차수 목록을 불러오는데 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceTargets = async (sessionId: string, attendanceDate: string) => {
    try {
      const targets = await AttendanceService.getAttendanceTargets(sessionId, attendanceDate);
      setAttendanceTargets(targets);
    } catch (error) {
      console.error('Failed to load attendance targets:', error);
      toast.error('출석 대상을 불러오는데 실패했습니다.');
    }
  };

  const loadAttendanceRecords = async (sessionId: string, attendanceDate: string) => {
    try {
      const records = await AttendanceService.getAttendanceRecords(sessionId, attendanceDate);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
      toast.error('출석 기록을 불러오는데 실패했습니다.');
    }
  };

  const loadStatistics = async (sessionId: string) => {
    try {
      const stats = await AttendanceService.getAttendanceStatistics(sessionId);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadTraineeSummary = async (sessionId: string) => {
    try {
      const summary = await AttendanceService.getTraineeAttendanceSummary(sessionId);
      setTraineeSummary(summary);
    } catch (error) {
      console.error('Failed to load trainee summary:', error);
    }
  };

  const handleAttendanceCheck = async (traineeId: string, status: AttendanceStatus) => {
    if (!selectedSession || !selectedDate) return;

    try {
      await AttendanceService.checkAttendance({
        session_id: selectedSession.id,
        trainee_id: traineeId,
        attendance_date: selectedDate,
        status,
      });

      toast.success('출석 체크가 완료되었습니다.');
      await loadAttendanceRecords(selectedSession.id, selectedDate);
      await loadAttendanceTargets(selectedSession.id, selectedDate);
      await loadStatistics(selectedSession.id);
      await loadTraineeSummary(selectedSession.id);
    } catch (error) {
      console.error('Failed to check attendance:', error);
      toast.error('출석 체크에 실패했습니다.');
    }
  };

  const handleBulkAttendanceCheck = async (status: AttendanceStatus) => {
    if (!selectedSession || !selectedDate || attendanceTargets.length === 0) return;

    const confirmed = window.confirm(
      `전체 ${attendanceTargets.length}명을 "${getStatusLabel(status)}"로 일괄 처리하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      const records = attendanceTargets
        .filter(t => !t.attendance_status)
        .map(t => ({
          session_id: selectedSession.id,
          trainee_id: t.id,
          attendance_date: selectedDate,
          status,
        }));

      await AttendanceService.checkAttendanceBulk(records);
      toast.success(`${records.length}명의 출석 체크가 완료되었습니다.`);

      await loadAttendanceRecords(selectedSession.id, selectedDate);
      await loadAttendanceTargets(selectedSession.id, selectedDate);
      await loadStatistics(selectedSession.id);
      await loadTraineeSummary(selectedSession.id);
    } catch (error) {
      console.error('Failed to bulk check attendance:', error);
      toast.error('일괄 출석 체크에 실패했습니다.');
    }
  };

  const getStatusLabel = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present': return '출석';
      case 'late': return '지각';
      case 'absent': return '결석';
      case 'excused': return '사유결석';
      case 'early_leave': return '조퇴';
      default: return '미체크';
    }
  };

  const getStatusColor = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      case 'late': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'absent': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'excused': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'early_leave': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present': return <CheckCircleIcon className="w-5 h-5" />;
      case 'late': return <ClockIcon className="w-5 h-5" />;
      case 'absent': return <XCircleIcon className="w-5 h-5" />;
      case 'excused': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'early_leave': return <ArrowRightOnRectangleIcon className="w-5 h-5" />;
      default: return null;
    }
  };

  const filteredTargets = attendanceTargets.filter(target => {
    // 검색 필터
    const matchesSearch = target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // 상태 필터
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'unchecked') return matchesSearch && !target.attendance_status;
    return matchesSearch && target.attendance_status === statusFilter;
  });

  // 출석 통계 계산
  const getAttendanceSummary = () => {
    const total = attendanceTargets.length;
    const checked = attendanceTargets.filter(t => t.attendance_status).length;
    const unchecked = total - checked;
    const present = attendanceTargets.filter(t => t.attendance_status === 'present').length;
    const late = attendanceTargets.filter(t => t.attendance_status === 'late').length;
    const absent = attendanceTargets.filter(t => t.attendance_status === 'absent').length;
    const excused = attendanceTargets.filter(t => t.attendance_status === 'excused').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, checked, unchecked, present, late, absent, excused, attendanceRate };
  };

  // Excel 내보내기
  const exportToExcel = () => {
    if (!selectedSession || !selectedDate) return;

    const data = attendanceTargets.map(target => ({
      '이름': target.name,
      '이메일': target.email || '-',
      '부서': target.department || '-',
      '전화번호': target.phone || '-',
      '출석상태': getStatusLabel(target.attendance_status)
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `출석부_${selectedSession.session_name}_${selectedDate}.csv`;
    link.click();

    toast.success('출석부가 다운로드되었습니다.');
  };

  // 출석 체크 뷰
  const renderCheckView = () => {
    if (!selectedSession) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          차수를 선택해주세요.
        </div>
      );
    }

    const summary = getAttendanceSummary();

    return (
      <div className="space-y-6">
        {/* 날짜 및 세션 정보 */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{selectedSession.session_name}</h2>
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 text-sm">
            <span className="font-medium">{selectedSession.session_code}</span>
            <span>•</span>
            <span>{format(new Date(selectedSession.start_date), 'yyyy-MM-dd')} ~ {format(new Date(selectedSession.end_date), 'yyyy-MM-dd')}</span>
          </div>
        </div>

        {/* 출석 현황 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">총 인원</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}명</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-sm p-4 text-white">
            <div className="text-sm text-emerald-100 mb-1">출석률</div>
            <div className="text-2xl font-bold">{summary.attendanceRate}%</div>
            <div className="text-xs text-emerald-100 mt-1">출석 {summary.present} / 지각 {summary.late}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm p-4 text-white">
            <div className="text-sm text-red-100 mb-1">결석</div>
            <div className="text-2xl font-bold">{summary.absent}명</div>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg shadow-sm p-4 text-white">
            <div className="text-sm text-gray-100 mb-1">미체크</div>
            <div className="text-2xl font-bold">{summary.unchecked}명</div>
          </div>
        </div>

        {/* 일괄 처리 버튼 및 필터 */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleBulkAttendanceCheck('present')}
              className="btn-primary"
            >
              <CheckCircleIcon className="w-5 h-5" />
              전체 출석 처리
            </button>
            <button
              onClick={() => handleBulkAttendanceCheck('absent')}
              className="btn-danger"
            >
              <XCircleIcon className="w-5 h-5" />
              미체크자 결석 처리
            </button>
            <button
              onClick={exportToExcel}
              className="btn-secondary"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Excel 내보내기
            </button>
          </div>

          {/* 빠른 필터 */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'all'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              전체 ({summary.total})
            </button>
            <button
              onClick={() => setStatusFilter('unchecked')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'unchecked'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              미체크 ({summary.unchecked})
            </button>
            <button
              onClick={() => setStatusFilter('present')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'present'
                ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              출석 ({summary.present})
            </button>
            <button
              onClick={() => setStatusFilter('absent')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'absent'
                ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              결석 ({summary.absent})
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="교육생 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* 출석 대상 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTargets.length > 0 ? (
              filteredTargets.map(target => (
                <div key={target.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-white text-lg">{target.name}</div>
                        {target.attendance_status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(target.attendance_status)}`}>
                            {getStatusLabel(target.attendance_status)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {target.email} {target.department && `• ${target.department}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 출석 상태 버튼 - 항상 표시하여 변경 가능 */}
                      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'present')}
                          className={`p-2 rounded-md transition-all ${target.attendance_status === 'present'
                            ? 'bg-white dark:bg-gray-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          title="출석"
                        >
                          <CheckCircleIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'late')}
                          className={`p-2 rounded-md transition-all ${target.attendance_status === 'late'
                            ? 'bg-white dark:bg-gray-600 text-yellow-600 dark:text-yellow-400 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          title="지각"
                        >
                          <ClockIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'absent')}
                          className={`p-2 rounded-md transition-all ${target.attendance_status === 'absent'
                            ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          title="결석"
                        >
                          <XCircleIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'excused')}
                          className={`p-2 rounded-md transition-all ${target.attendance_status === 'excused'
                            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          title="사유결석"
                        >
                          <ExclamationTriangleIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 교육생별 출석 현황 뷰
  const renderTraineeView = () => {
    if (!selectedSession) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          차수를 선택해주세요.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    교육생
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    총 세션
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    출석
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    지각
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    결석
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    출석률
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    수료
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {traineeSummary.map(summary => (
                  <tr key={summary.trainee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{summary.trainee_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{summary.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {summary.total_sessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{summary.present_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">{summary.late_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-red-600 dark:text-red-400 font-medium">{summary.absent_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`font-bold ${summary.attendance_rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {summary.attendance_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {summary.can_complete ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          가능
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          불가
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {traineeSummary.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 통계 뷰
  const renderStatisticsView = () => {
    if (!selectedSession) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          차수를 선택해주세요.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    등록 인원
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    체크 인원
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    출석
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    지각
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    결석
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    사유결석
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    출석률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {statistics.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {format(new Date(stat.date), 'yyyy-MM-dd (EEE)', { locale: ko })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {stat.total_enrolled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                      {stat.total_checked}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{stat.present_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">{stat.late_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-red-600 dark:text-red-400 font-medium">{stat.absent_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{stat.excused_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`font-bold ${stat.attendance_rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stat.attendance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {statistics.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <PageHeader
          title="통합 출석 관리"
          description="세션 및 날짜 기반 실시간 출석 체크 및 통계"
          badge="Attendance Management"
        />

        {/* 필터 및 탭 컨테이너 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* 차수 및 날짜 선택 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                과정 차수
              </label>
              <select
                value={selectedSession?.id || ''}
                onChange={(e) => {
                  const session = sessions.find(s => s.id === e.target.value);
                  setSelectedSession(session || null);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">차수를 선택하세요</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.session_name} ({session.session_code}) - {format(new Date(session.start_date), 'yyyy-MM-dd')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                출석 날짜
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* 뷰 모드 탭 */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
            <button
              onClick={() => setViewMode('check')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'check'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <CheckCircleIcon className="w-4 h-4 inline mr-2" />
              출석 체크
            </button>
            <button
              onClick={() => setViewMode('trainee')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'trainee'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <UserGroupIcon className="w-4 h-4 inline mr-2" />
              교육생별 통계
            </button>
            <button
              onClick={() => setViewMode('statistics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'statistics'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              통계
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <>
            {viewMode === 'check' && renderCheckView()}
            {viewMode === 'trainee' && renderTraineeView()}
            {viewMode === 'statistics' && renderStatisticsView()}
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default IntegratedAttendanceManagement;
