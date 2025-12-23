'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ScheduleConflict, ConflictType } from '@/types/schedule.types';
import toast from 'react-hot-toast';

interface ConflictResolution {
  conflict_id: string;
  resolution_type: 'change_time' | 'change_instructor' | 'change_classroom' | 'cancel';
  new_start_time?: string;
  new_end_time?: string;
  new_instructor_id?: string;
  new_classroom_id?: string;
  notes: string;
}

interface AlternativeSuggestion {
  type: 'instructor' | 'classroom' | 'time';
  resource_id?: string;
  resource_name?: string;
  time_slot?: {
    start: string;
    end: string;
  };
  reason: string;
}

export default function ScheduleConflictsPage() {
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [filterType, setFilterType] = useState<'all' | ConflictType>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showResolvedOnly, setShowResolvedOnly] = useState(false);

  // 충돌 해결 모달
  const [selectedConflict, setSelectedConflict] = useState<ScheduleConflict | null>(null);
  const [suggestions, setSuggestions] = useState<AlternativeSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출
      // const data = await scheduleService.getConflicts();
      setConflicts([]);
    } catch (error) {
      console.error('충돌 조회 실패:', error);
      toast.error('충돌 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (conflict: ScheduleConflict) => {
    try {
      setLoadingSuggestions(true);
      // TODO: 실제 API 호출
      // const data = await scheduleService.getConflictSuggestions(conflict.id);

      // 예시 제안
      const mockSuggestions: AlternativeSuggestion[] = [];

      if (conflict.type === 'instructor') {
        mockSuggestions.push({
          type: 'instructor',
          resource_id: 'alt-instructor-1',
          resource_name: '대체 강사 A',
          reason: '동일 과목 강의 가능, 해당 시간 가용',
        });
        mockSuggestions.push({
          type: 'time',
          time_slot: {
            start: new Date(new Date(conflict.date).setHours(14, 0)).toISOString(),
            end: new Date(new Date(conflict.date).setHours(16, 0)).toISOString(),
          },
          reason: '강사 가용 시간, 강의실 사용 가능',
        });
      } else if (conflict.type === 'classroom') {
        mockSuggestions.push({
          type: 'classroom',
          resource_id: 'alt-room-1',
          resource_name: '강의실 B',
          reason: '동일 수용 인원, 필요 장비 구비',
        });
      }

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('제안 조회 실패:', error);
      toast.error('해결 제안을 불러오는데 실패했습니다.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleOpenResolution = (conflict: ScheduleConflict) => {
    setSelectedConflict(conflict);
    setResolutionNotes('');
    loadSuggestions(conflict);
  };

  const handleResolve = async (resolution: ConflictResolution) => {
    try {
      // TODO: 실제 API 호출
      // await scheduleService.resolveConflict(resolution);

      // 로컬 상태 업데이트
      setConflicts(
        conflicts.map((c) =>
          c.id === resolution.conflict_id
            ? { ...c, resolved: true, resolution_notes: resolution.notes }
            : c
        )
      );

      toast.success('충돌이 해결되었습니다.');
      setSelectedConflict(null);
    } catch (error) {
      console.error('충돌 해결 실패:', error);
      toast.error('충돌 해결 중 오류가 발생했습니다.');
    }
  };

  const handleMarkResolved = async (conflictId: string) => {
    if (!resolutionNotes) {
      toast.error('해결 내용을 입력해주세요.');
      return;
    }

    try {
      // TODO: 실제 API 호출
      // await scheduleService.markConflictResolved(conflictId, resolutionNotes);

      setConflicts(
        conflicts.map((c) =>
          c.id === conflictId ? { ...c, resolved: true, resolution_notes: resolutionNotes } : c
        )
      );

      toast.success('충돌이 해결됨으로 표시되었습니다.');
      setSelectedConflict(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('충돌 해결 표시 실패:', error);
      toast.error('충돌 해결 표시 중 오류가 발생했습니다.');
    }
  };

  const filteredConflicts = conflicts.filter((conflict) => {
    if (filterType !== 'all' && conflict.type !== filterType) return false;
    if (filterSeverity !== 'all' && conflict.severity !== filterSeverity) return false;
    if (showResolvedOnly && !conflict.resolved) return false;
    return true;
  });

  const getTypeLabel = (type: ConflictType) => {
    const labels: Record<ConflictType, string> = {
      instructor: '강사',
      classroom: '강의실',
      trainee: '교육생',
      holiday: '공휴일',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: ConflictType) => {
    switch (type) {
      case 'instructor':
        return <UserIcon className="h-5 w-5" />;
      case 'classroom':
        return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'trainee':
        return <UserIcon className="h-5 w-5" />;
      case 'holiday':
        return <ClockIcon className="h-5 w-5" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'low':
        return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getSeverityLabel = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return '높음';
      case 'medium':
        return '중간';
      case 'low':
        return '낮음';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="⚠️ 일정 충돌 관리"
        description="일정 충돌을 확인하고 해결 방안을 제안받습니다."
      />

      {/* 필터 및 통계 */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* 통계 카드 */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">전체 충돌</p>
                <p className="text-2xl font-bold text-foreground">{conflicts.length}건</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="border border-destructive/20 rounded-xl p-4 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">높은 우선순위</p>
                <p className="text-2xl font-bold text-destructive">
                  {conflicts.filter((c) => c.severity === 'high').length}건
                </p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">미해결</p>
                <p className="text-2xl font-bold text-foreground">
                  {conflicts.filter((c) => !c.resolved).length}건
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="border border-success/20 rounded-xl p-4 bg-success/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">해결됨</p>
                <p className="text-2xl font-bold text-success">
                  {conflicts.filter((c) => c.resolved).length}건
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">모든 유형</option>
            <option value="instructor">강사 충돌</option>
            <option value="classroom">강의실 충돌</option>
            <option value="trainee">교육생 충돌</option>
            <option value="holiday">공휴일 충돌</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="appearance-none border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">모든 우선순위</option>
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-all">
            <input
              type="checkbox"
              checked={showResolvedOnly}
              onChange={(e) => setShowResolvedOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">해결됨만 보기</span>
          </label>
        </div>
      </div>

      {/* 충돌 목록 */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">충돌 목록을 불러오는 중...</p>
        </div>
      ) : filteredConflicts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-success mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">충돌이 없습니다</h3>
          <p className="text-muted-foreground">
            {conflicts.length === 0
              ? '현재 일정 충돌이 발견되지 않았습니다.'
              : '선택한 필터 조건에 해당하는 충돌이 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`bg-card rounded-2xl border p-6 transition-all ${
                conflict.resolved ? 'border-success/20 bg-success/5' : 'border-border hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${getSeverityColor(conflict.severity)}`}>
                    {getTypeIcon(conflict.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        {getTypeLabel(conflict.type)} 충돌
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(
                          conflict.severity
                        )}`}
                      >
                        {getSeverityLabel(conflict.severity)}
                      </span>
                      {conflict.resolved && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          해결됨
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ClockIcon className="h-4 w-4" />
                        {new Date(conflict.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </div>

                      <div className="text-sm text-foreground">
                        <p className="font-medium mb-1">충돌 자원: {conflict.resource_name}</p>
                        <div className="space-y-1">
                          {conflict.conflicting_schedules.map((schedule, idx) => (
                            <div
                              key={idx}
                              className="pl-4 border-l-2 border-primary/30 text-muted-foreground"
                            >
                              <p className="font-medium">{schedule.course_name}</p>
                              <p className="text-xs">{schedule.time_range}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {conflict.resolution_notes && (
                        <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-lg">
                          <p className="text-sm font-medium text-success mb-1">해결 내용</p>
                          <p className="text-sm text-muted-foreground">{conflict.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!conflict.resolved && (
                  <button
                    onClick={() => handleOpenResolution(conflict)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <LightBulbIcon className="h-4 w-4" />
                    해결 방안 보기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 해결 방안 모달 */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">충돌 해결 방안</h3>
              <button
                onClick={() => setSelectedConflict(null)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-all"
              >
                <XMarkIcon className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* 충돌 상세 정보 */}
            <div className="bg-muted/30 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-foreground mb-2">
                {getTypeLabel(selectedConflict.type)} 충돌 - {selectedConflict.resource_name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedConflict.date).toLocaleDateString('ko-KR')}
              </p>
              <div className="mt-2 space-y-1">
                {selectedConflict.conflicting_schedules.map((schedule, idx) => (
                  <p key={idx} className="text-sm text-foreground">
                    • {schedule.course_name} ({schedule.time_range})
                  </p>
                ))}
              </div>
            </div>

            {/* 자동 제안 */}
            <div className="mb-6">
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-primary" />
                추천 해결 방안
              </h4>

              {loadingSuggestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">해결 방안을 찾는 중...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-xl">
                  <p className="text-sm text-muted-foreground">자동 제안을 사용할 수 없습니다.</p>
                  <p className="text-xs text-muted-foreground mt-1">수동으로 해결 내용을 입력해주세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">
                            {suggestion.type === 'instructor' && '대체 강사'}
                            {suggestion.type === 'classroom' && '대체 강의실'}
                            {suggestion.type === 'time' && '시간 변경'}
                          </h5>
                          {suggestion.resource_name && (
                            <p className="text-sm text-primary">{suggestion.resource_name}</p>
                          )}
                          {suggestion.time_slot && (
                            <p className="text-sm text-primary">
                              {new Date(suggestion.time_slot.start).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              -{' '}
                              {new Date(suggestion.time_slot.end).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                        </div>
                        <button className="px-3 py-1 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-all">
                          적용
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 수동 해결 */}
            <div className="border-t border-border pt-6">
              <h4 className="font-medium text-foreground mb-3">수동 해결</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    해결 내용 *
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    placeholder="충돌을 어떻게 해결했는지 입력해주세요"
                    className="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <button
                  onClick={() => handleMarkResolved(selectedConflict.id)}
                  className="w-full btn-primary"
                >
                  해결됨으로 표시
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
