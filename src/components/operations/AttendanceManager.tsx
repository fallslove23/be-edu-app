import React, { useState, useEffect } from 'react';
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
  PlusIcon
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
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'sessions' | 'check' | 'report'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // 모의 데이터 생성
    setTimeout(() => {
      const mockSessions: AttendanceSession[] = [
        {
          id: 'session-1',
          date: '2025-01-26',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정 1차',
          sessionName: '1일차 오리엔테이션',
          startTime: '09:00',
          endTime: '18:00',
          instructor: '김강사',
          status: 'completed',
          totalStudents: 25,
          presentCount: 23,
          absentCount: 1,
          lateCount: 1
        },
        {
          id: 'session-2',
          date: '2025-01-26',
          courseCode: 'BS-2025-02',
          courseName: 'BS 고급 영업 전략과정 2차',
          sessionName: '5일차 실습',
          startTime: '14:00',
          endTime: '17:00',
          instructor: '이강사',
          status: 'in_progress',
          totalStudents: 18,
          presentCount: 17,
          absentCount: 0,
          lateCount: 1
        },
        {
          id: 'session-3',
          date: '2025-01-27',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정 1차',
          sessionName: '2일차 기초 이론',
          startTime: '09:00',
          endTime: '18:00',
          instructor: '김강사',
          status: 'scheduled',
          totalStudents: 25,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0
        }
      ];

      const mockStudents: Student[] = [
        { id: 'std-1', name: '김교육', department: '영업1팀', courseCode: 'BS-2025-01', courseName: 'BS 신입 영업사원 기초과정 1차' },
        { id: 'std-2', name: '이학습', department: '영업2팀', courseCode: 'BS-2025-01', courseName: 'BS 신입 영업사원 기초과정 1차' },
        { id: 'std-3', name: '박성장', department: '마케팅팀', courseCode: 'BS-2025-02', courseName: 'BS 고급 영업 전략과정 2차' },
        { id: 'std-4', name: '정발전', department: '영업1팀', courseCode: 'BS-2025-01', courseName: 'BS 신입 영업사원 기초과정 1차' },
        { id: 'std-5', name: '최우수', department: '개발팀', courseCode: 'BS-2025-02', courseName: 'BS 고급 영업 전략과정 2차' }
      ];

      const mockAttendance: AttendanceRecord[] = [
        {
          id: 'att-1',
          studentId: 'std-1',
          studentName: '김교육',
          date: '2025-01-26',
          status: 'present',
          checkInTime: '08:55',
          checkOutTime: '18:10',
          courseCode: 'BS-2025-01',
          sessionName: '1일차 오리엔테이션'
        },
        {
          id: 'att-2',
          studentId: 'std-2',
          studentName: '이학습',
          date: '2025-01-26',
          status: 'late',
          checkInTime: '09:15',
          checkOutTime: '18:05',
          note: '지하철 지연으로 인한 지각',
          courseCode: 'BS-2025-01',
          sessionName: '1일차 오리엔테이션'
        },
        {
          id: 'att-3',
          studentId: 'std-4',
          studentName: '정발전',
          date: '2025-01-26',
          status: 'absent',
          note: '개인 사정으로 인한 결석',
          courseCode: 'BS-2025-01',
          sessionName: '1일차 오리엔테이션'
        }
      ];

      setSessions(mockSessions);
      setStudents(mockStudents);
      setAttendanceRecords(mockAttendance);
      setLoading(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-500/10';
      case 'absent': return 'text-destructive bg-destructive/10';
      case 'late': return 'text-orange-600 bg-yellow-100';
      case 'excused': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircleIcon className="h-4 w-4" />;
      case 'absent': return <XCircleIcon className="h-4 w-4" />;
      case 'late': return <ClockIcon className="h-4 w-4" />;
      case 'excused': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'in_progress': return 'text-green-600 bg-green-500/10';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused', note?: string) => {
    if (!selectedSession) return;

    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    
    const existingRecord = attendanceRecords.find(
      r => r.studentId === studentId && r.date === selectedSession.date
    );

    if (existingRecord) {
      setAttendanceRecords(prev => 
        prev.map(record => 
          record.id === existingRecord.id
            ? { 
                ...record, 
                status, 
                note,
                checkInTime: status === 'present' || status === 'late' ? timeString : undefined,
                checkOutTime: status === 'present' ? undefined : record.checkOutTime
              }
            : record
        )
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        studentId,
        studentName: students.find(s => s.id === studentId)?.name || '',
        date: selectedSession.date,
        status,
        checkInTime: status === 'present' || status === 'late' ? timeString : undefined,
        note,
        courseCode: selectedSession.courseCode,
        sessionName: selectedSession.sessionName
      };
      setAttendanceRecords(prev => [...prev, newRecord]);
    }
  };

  const calculateAttendanceRate = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === studentId);
    const totalSessions = studentRecords.length;
    const presentSessions = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    
    return totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesDate = session.date === dateFilter;
    const matchesSearch = session.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

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
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">📋 출석 관리</h1>
            <p className="text-muted-foreground">
              교육생 출석을 체크하고 출석률을 관리하세요.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveView('sessions')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeView === 'sessions'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                세션 목록
              </button>
              <button
                onClick={() => setActiveView('check')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeView === 'check'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                출석 체크
              </button>
              <button
                onClick={() => setActiveView('report')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeView === 'report'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                출석 현황
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="과정명, 세션명, 강사명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-border bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2">
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>출석부 다운로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 세션 목록 */}
      {activeView === 'sessions' && (
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">
              교육 세션 ({filteredSessions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    과정 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    강사
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    출석 현황
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {session.courseName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.sessionName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {new Date(session.date).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.startTime} ~ {session.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {session.instructor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-600 dark:text-green-400">출석: {session.presentCount}</span>
                        <span className="text-amber-600 dark:text-amber-400">지각: {session.lateCount}</span>
                        <span className="text-destructive">결석: {session.absentCount}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        총 {session.totalStudents}명
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                        <span>
                          {session.status === 'completed' ? '완료' :
                           session.status === 'in_progress' ? '진행중' : '예정'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setActiveView('check');
                        }}
                        className="text-primary hover:text-primary/80 mr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      >
                        출석체크
                      </button>
                      <button className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded">
                        출석부
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 출석 체크 */}
      {activeView === 'check' && selectedSession && (
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {selectedSession.courseName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSession.sessionName} • {selectedSession.date} {selectedSession.startTime}~{selectedSession.endTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students
                .filter(student => student.courseCode === selectedSession.courseCode)
                .map((student) => {
                  const attendance = attendanceRecords.find(
                    r => r.studentId === student.id && r.date === selectedSession.date
                  );

                  return (
                    <div key={student.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{student.name}</h4>
                          <p className="text-sm text-muted-foreground">{student.department}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {(['present', 'late', 'absent', 'excused'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateAttendance(student.id, status)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                              attendance?.status === status
                                ? getStatusColor(status)
                                : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(status)}
                              <span>
                                {status === 'present' ? '출석' :
                                 status === 'late' ? '지각' :
                                 status === 'absent' ? '결석' : '공결'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {attendance && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          {attendance.checkInTime && (
                            <div>입실: {attendance.checkInTime}</div>
                          )}
                          {attendance.checkOutTime && (
                            <div>퇴실: {attendance.checkOutTime}</div>
                          )}
                          {attendance.note && (
                            <div>메모: {attendance.note}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 출석 현황 리포트 */}
      {activeView === 'report' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">평균 출석률</p>
                  <p className="text-2xl font-bold text-foreground">92.3%</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">평균 지각률</p>
                  <p className="text-2xl font-bold text-foreground">4.1%</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <XCircleIcon className="h-6 w-6 text-destructive" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">결석률</p>
                  <p className="text-2xl font-bold text-foreground">3.6%</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">총 교육생</p>
                  <p className="text-2xl font-bold text-foreground">43명</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">개별 출석 현황</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      교육생
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      과정
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      출석률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      출석/지각/결석
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      최근 출석
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {students.map((student) => {
                    const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
                    const presentCount = studentRecords.filter(r => r.status === 'present').length;
                    const lateCount = studentRecords.filter(r => r.status === 'late').length;
                    const absentCount = studentRecords.filter(r => r.status === 'absent').length;
                    const attendanceRate = calculateAttendanceRate(student.id);
                    const lastAttendance = studentRecords[studentRecords.length - 1];

                    return (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                              <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {student.courseName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            attendanceRate >= 90 ? 'text-green-600 dark:text-green-400' :
                            attendanceRate >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
                          }`}>
                            {attendanceRate}%
                          </div>
                          <div className="w-20 bg-muted rounded-lg h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                attendanceRate >= 90 ? 'bg-green-500' :
                                attendanceRate >= 80 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${attendanceRate}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-4">
                            <span className="text-green-600 dark:text-green-400">출석: {presentCount}</span>
                            <span className="text-amber-600 dark:text-amber-400">지각: {lateCount}</span>
                            <span className="text-destructive">결석: {absentCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {lastAttendance && (
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lastAttendance.status)}`}>
                              {getStatusIcon(lastAttendance.status)}
                              <span>
                                {new Date(lastAttendance.date).toLocaleDateString('ko-KR')}
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;