'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { AttendanceService, type AttendanceTarget, type AttendanceStatus } from '@/services/attendance.service';
import toast from 'react-hot-toast';

export default function AttendanceCheckPage() {
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<AttendanceTarget[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionId, setSessionId] = useState<string>('');
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([]);
  const [checkingAll, setCheckingAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId && selectedDate) {
      loadTargets();
    }
  }, [sessionId, selectedDate]);

  const loadSessions = async () => {
    try {
      // TODO: Implement session loading
      // For now, using mock data
      setSessions([
        { id: '1', name: '웹 개발 과정 1기' },
        { id: '2', name: '웹 개발 과정 2기' },
      ]);
    } catch (error) {
      console.error('세션 로드 실패:', error);
      toast.error('세션 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadTargets = async () => {
    try {
      setLoading(true);
      const data = await AttendanceService.getAttendanceTargets(sessionId, selectedDate);
      setTargets(data);
    } catch (error) {
      console.error('출석 대상 로드 실패:', error);
      toast.error('출석 대상을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (traineeId: string, status: AttendanceStatus) => {
    try {
      await AttendanceService.checkAttendance({
        session_id: sessionId,
        trainee_id: traineeId,
        attendance_date: selectedDate,
        status,
      });

      setTargets((prev) =>
        prev.map((target) =>
          target.id === traineeId ? { ...target, attendance_status: status } : target
        )
      );

      toast.success('출석 상태가 업데이트되었습니다.');
    } catch (error) {
      console.error('출석 체크 실패:', error);
      toast.error('출석 체크 중 오류가 발생했습니다.');
    }
  };

  const handleCheckAllPresent = async () => {
    if (!confirm('모든 교육생을 출석 처리하시겠습니까?')) {
      return;
    }

    try {
      setCheckingAll(true);
      const uncheckedTargets = targets.filter((t) => !t.attendance_status);

      await AttendanceService.checkAttendanceBulk(
        uncheckedTargets.map((t) => ({
          session_id: sessionId,
          trainee_id: t.id,
          attendance_date: selectedDate,
          status: 'present',
        }))
      );

      setTargets((prev) =>
        prev.map((target) => ({
          ...target,
          attendance_status: target.attendance_status || 'present',
        }))
      );

      toast.success(`${uncheckedTargets.length}명을 출석 처리했습니다.`);
    } catch (error) {
      console.error('일괄 출석 체크 실패:', error);
      toast.error('일괄 출석 처리 중 오류가 발생했습니다.');
    } finally {
      setCheckingAll(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
            출석
          </span>
        );
      case 'late':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
            지각
          </span>
        );
      case 'absent':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
            결석
          </span>
        );
      case 'excused':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            사유결석
          </span>
        );
      case 'early_leave':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
            조퇴
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            미체크
          </span>
        );
    }
  };

  const stats = {
    total: targets.length,
    checked: targets.filter((t) => t.attendance_status).length,
    present: targets.filter((t) => t.attendance_status === 'present').length,
    late: targets.filter((t) => t.attendance_status === 'late').length,
    absent: targets.filter((t) => t.attendance_status === 'absent').length,
    excused: targets.filter((t) => t.attendance_status === 'excused').length,
  };

  return (
    <PageContainer>
      <PageHeader title="📝 출석 체크" description="교육생 출석을 체크하고 관리합니다.">
        <button
          onClick={handleCheckAllPresent}
          disabled={checkingAll || targets.length === 0}
          className="btn-primary"
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          전체 출석 처리
        </button>
      </PageHeader>

      {/* 필터 영역 */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              과정 선택
            </label>
            <div className="relative">
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">과정을 선택하세요</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              출석 날짜
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      {sessionId && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}명</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">출석</p>
                <p className="text-2xl font-bold text-success">{stats.present}명</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">지각</p>
                <p className="text-2xl font-bold text-warning">{stats.late}명</p>
              </div>
              <ClockIcon className="h-8 w-8 text-warning" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">결석</p>
                <p className="text-2xl font-bold text-destructive">{stats.absent}명</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">미체크</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.total - stats.checked}명
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* 출석 체크 목록 */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">출석 대상을 불러오는 중...</p>
        </div>
      ) : !sessionId ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <UserGroupIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">과정을 선택하세요</h3>
          <p className="text-muted-foreground">출석 체크할 과정을 선택해주세요.</p>
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <UserGroupIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">등록된 교육생이 없습니다</h3>
          <p className="text-muted-foreground">선택한 과정에 등록된 교육생이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h3 className="text-lg font-medium text-foreground">
              교육생 목록 ({targets.length}명)
            </h3>
          </div>
          <div className="divide-y divide-border">
            {targets.map((target) => (
              <div
                key={target.id}
                className="p-6 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-foreground">{target.name}</h4>
                      {getStatusBadge(target.attendance_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {target.email && <span>{target.email}</span>}
                      {target.phone && (
                        <>
                          <span>|</span>
                          <span>{target.phone}</span>
                        </>
                      )}
                      {target.department && (
                        <>
                          <span>|</span>
                          <span>{target.department}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(target.id, 'present')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        target.attendance_status === 'present'
                          ? 'bg-success text-white'
                          : 'border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      출석
                    </button>
                    <button
                      onClick={() => handleStatusChange(target.id, 'late')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        target.attendance_status === 'late'
                          ? 'bg-warning text-white'
                          : 'border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      지각
                    </button>
                    <button
                      onClick={() => handleStatusChange(target.id, 'absent')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        target.attendance_status === 'absent'
                          ? 'bg-destructive text-white'
                          : 'border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      결석
                    </button>
                    <button
                      onClick={() => handleStatusChange(target.id, 'excused')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        target.attendance_status === 'excused'
                          ? 'bg-primary text-white'
                          : 'border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      사유결석
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
