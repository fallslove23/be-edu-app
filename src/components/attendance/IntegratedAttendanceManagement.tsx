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

type ViewMode = 'calendar' | 'session' | 'trainee' | 'daily';

interface Session {
  id: string;
  session_name: string;
  session_code: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface CurriculumItem {
  id: string;
  session_id: string;
  title: string;
  date: string;
  day: number;
  order_index: number;
  start_time: string;
  end_time: string;
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
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumItem | null>(null);
  const [attendanceTargets, setAttendanceTargets] = useState<TraineeTarget[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics[]>([]);
  const [traineeSummary, setTraineeSummary] = useState<TraineeAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 초기 데이터 로드
  useEffect(() => {
    loadSessions();
  }, []);

  // 세션 변경 시 커리큘럼 로드
  useEffect(() => {
    if (selectedSession) {
      loadCurriculumItems(selectedSession.id);
      loadStatistics(selectedSession.id);
      loadTraineeSummary(selectedSession.id);
    }
  }, [selectedSession]);

  // 커리큘럼 선택 시 출석 대상 및 기록 로드
  useEffect(() => {
    if (selectedCurriculum) {
      loadAttendanceTargets(selectedCurriculum.id);
      loadAttendanceRecords(selectedCurriculum.id);
    }
  }, [selectedCurriculum]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_rounds')
        .select(`
          id,
          round_name,
          round_code,
          start_date,
          end_date,
          status
        `)
        .order('start_date', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Map course_rounds to Session interface
      const mappedSessions = (data || []).map(round => ({
        id: round.id,
        session_name: round.round_name,
        session_code: round.round_code,
        start_date: round.start_date,
        end_date: round.end_date,
        status: round.status
      }));

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

  const loadCurriculumItems = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('curriculum_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('date', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCurriculumItems(data || []);
    } catch (error) {
      console.error('Failed to load curriculum:', error);
      toast.error('커리큘럼을 불러오는데 실패했습니다.');
    }
  };

  const loadAttendanceTargets = async (curriculumItemId: string) => {
    try {
      const targets = await AttendanceService.getAttendanceTargets(curriculumItemId);
      setAttendanceTargets(targets);
    } catch (error) {
      console.error('Failed to load attendance targets:', error);
      toast.error('출석 대상을 불러오는데 실패했습니다.');
    }
  };

  const loadAttendanceRecords = async (curriculumItemId: string) => {
    try {
      const records = await AttendanceService.getAttendanceRecords(curriculumItemId);
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
    if (!selectedCurriculum) return;

    try {
      await AttendanceService.checkAttendance({
        curriculum_item_id: selectedCurriculum.id,
        trainee_id: traineeId,
        status,
      });

      toast.success('출석 체크가 완료되었습니다.');
      await loadAttendanceRecords(selectedCurriculum.id);
      await loadAttendanceTargets(selectedCurriculum.id);

      if (selectedSession) {
        await loadStatistics(selectedSession.id);
        await loadTraineeSummary(selectedSession.id);
      }
    } catch (error) {
      console.error('Failed to check attendance:', error);
      toast.error('출석 체크에 실패했습니다.');
    }
  };

  const handleBulkAttendanceCheck = async (status: AttendanceStatus) => {
    if (!selectedCurriculum || attendanceTargets.length === 0) return;

    const confirmed = window.confirm(
      `전체 ${attendanceTargets.length}명을 "${getStatusLabel(status)}"로 일괄 처리하시겠습니까?`
    );

    if (!confirmed) return;

    try {
      const records = attendanceTargets
        .filter(t => !t.attendance_status)
        .map(t => ({
          curriculum_item_id: selectedCurriculum.id,
          trainee_id: t.id,
          status,
        }));

      await AttendanceService.checkAttendanceBulk(records);
      toast.success(`${records.length}명의 출석 체크가 완료되었습니다.`);

      await loadAttendanceRecords(selectedCurriculum.id);
      await loadAttendanceTargets(selectedCurriculum.id);

      if (selectedSession) {
        await loadStatistics(selectedSession.id);
        await loadTraineeSummary(selectedSession.id);
      }
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

  const filteredTargets = attendanceTargets.filter(target =>
    target.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    target.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 캘린더 뷰 렌더링
  const renderCalendarView = () => {
    if (!selectedSession) {
      return (
        <div className="text-center py-12 text-gray-500">
          차수를 선택해주세요.
        </div>
      );
    }

    // 날짜별로 커리큘럼 그룹화
    const groupedByDate = curriculumItems.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, CurriculumItem[]>);

    const dates = Object.keys(groupedByDate).sort();

    return (
      <div className="space-y-4">
        {dates.map(date => {
          const items = groupedByDate[date];
          const stat = statistics.find(s => s.date === date);

          return (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(new Date(date), 'M월 d일 (EEE)', { locale: ko })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {items[0]?.day}일차 • {items.length}개 세션
                  </p>
                </div>

                {stat && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{stat.attendance_rate}%</div>
                      <div className="text-gray-500">출석률</div>
                    </div>
                    <div className="text-gray-400">|</div>
                    <div className="flex gap-2">
                      <span className="text-emerald-600">✓ {stat.present_count}</span>
                      <span className="text-yellow-600">⏰ {stat.late_count}</span>
                      <span className="text-red-600">✗ {stat.absent_count}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCurriculum(item);
                      setViewMode('session');
                    }}
                    className="w-full text-left p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.start_time} - {item.end_time}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.order_index}교시
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 세션별 출석 체크 뷰
  const renderSessionView = () => {
    if (!selectedCurriculum) {
      return (
        <div className="text-center py-12 text-gray-500">
          세션을 선택해주세요.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 세션 정보 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <button
            onClick={() => {
              setViewMode('calendar');
              setSelectedCurriculum(null);
            }}
            className="text-white/80 hover:text-white text-sm mb-4"
          >
            ← 목록으로 돌아가기
          </button>

          <h2 className="text-2xl font-bold mb-2">{selectedCurriculum.title}</h2>
          <div className="flex items-center gap-4 text-blue-100">
            <span>{format(new Date(selectedCurriculum.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
            <span>•</span>
            <span>{selectedCurriculum.start_time} - {selectedCurriculum.end_time}</span>
            <span>•</span>
            <span>{selectedCurriculum.day}일차 {selectedCurriculum.order_index}교시</span>
          </div>
        </div>

        {/* 일괄 처리 버튼 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleBulkAttendanceCheck('present')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            전체 출석 처리
          </button>
          <button
            onClick={() => handleBulkAttendanceCheck('absent')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            미체크자 결석 처리
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="교육생 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* 출석 대상 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTargets.map(target => (
              <div key={target.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{target.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {target.email} {target.department && `• ${target.department}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {target.attendance_status ? (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(target.attendance_status)}`}>
                        {getStatusIcon(target.attendance_status)}
                        {getStatusLabel(target.attendance_status)}
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'present')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                          title="출석"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'late')}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                          title="지각"
                        >
                          <ClockIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'absent')}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="결석"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAttendanceCheck(target.id, 'excused')}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          title="사유결석"
                        >
                          <ExclamationTriangleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 교육생별 출석 현황 뷰
  const renderTraineeView = () => {
    if (!selectedSession) {
      return (
        <div className="text-center py-12 text-gray-500">
          차수를 선택해주세요.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  교육생
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  총 세션
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  출석
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  지각
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  결석
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  출석률
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  수료
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {traineeSummary.map(summary => (
                <tr key={summary.trainee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">{summary.trainee_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{summary.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    {summary.total_sessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-emerald-600 font-medium">{summary.present_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-yellow-600 font-medium">{summary.late_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-red-600 font-medium">{summary.absent_count}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`font-bold ${summary.attendance_rate >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {summary.attendance_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {summary.can_complete ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        가능
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        불가
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📋 통합 출석 관리
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          커리큘럼 기반 실시간 출석 체크 및 통계
        </p>
      </div>

      {/* 차수 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          과정 차수
        </label>
        <select
          value={selectedSession?.id || ''}
          onChange={(e) => {
            const session = sessions.find(s => s.id === e.target.value);
            setSelectedSession(session || null);
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">차수를 선택하세요</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.session_name} ({session.session_code}) - {format(new Date(session.start_date), 'yyyy-MM-dd')}
            </option>
          ))}
        </select>
      </div>

      {/* 뷰 모드 탭 */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'calendar'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <CalendarDaysIcon className="w-5 h-5 inline mr-2" />
          캘린더
        </button>
        <button
          onClick={() => setViewMode('trainee')}
          className={`px-4 py-2 font-medium ${
            viewMode === 'trainee'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <UserGroupIcon className="w-5 h-5 inline mr-2" />
          교육생별
        </button>
      </div>

      {/* 컨텐츠 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <>
          {viewMode === 'calendar' && renderCalendarView()}
          {viewMode === 'session' && renderSessionView()}
          {viewMode === 'trainee' && renderTraineeView()}
        </>
      )}
    </div>
  );
};

export default IntegratedAttendanceManagement;
