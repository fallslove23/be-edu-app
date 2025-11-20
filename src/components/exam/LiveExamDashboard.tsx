import React, { useState, useEffect, useCallback } from 'react';
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/services/supabase';
import type { Exam } from '@/types/exam.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  user_name?: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  progress?: number; // 0-100
  current_question?: number;
  total_questions?: number;
  time_remaining?: number; // seconds
}

interface LiveExamDashboardProps {
  exam: Exam;
  onClose: () => void;
}

export default function LiveExamDashboard({ exam, onClose }: LiveExamDashboardProps) {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    averageScore: 0,
    averageProgress: 0,
  });

  // 통계 계산
  const calculateStats = useCallback((attemptsList: ExamAttempt[]) => {
    const inProgress = attemptsList.filter(a => a.status === 'in_progress').length;
    const completed = attemptsList.filter(a => a.status === 'completed').length;
    const scores = attemptsList.filter(a => a.score !== undefined).map(a => a.score!);
    const progresses = attemptsList.filter(a => a.progress !== undefined).map(a => a.progress!);

    setStats({
      total: attemptsList.length,
      inProgress,
      completed,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      averageProgress: progresses.length > 0 ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0,
    });
  }, []);

  // 초기 데이터 로드
  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);

      // 실제 구현에서는 exam_attempts 테이블에서 조회
      // 현재는 Mock 데이터 사용
      const mockAttempts: ExamAttempt[] = [
        {
          id: '1',
          exam_id: exam.id,
          user_id: 'user1',
          user_name: '김철수',
          started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          status: 'in_progress',
          progress: 65,
          current_question: 7,
          total_questions: 10,
          time_remaining: 1200, // 20분
        },
        {
          id: '2',
          exam_id: exam.id,
          user_id: 'user2',
          user_name: '이영희',
          started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          status: 'completed',
          score: 85,
          progress: 100,
        },
        {
          id: '3',
          exam_id: exam.id,
          user_id: 'user3',
          user_name: '박민수',
          started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          status: 'in_progress',
          progress: 30,
          current_question: 3,
          total_questions: 10,
          time_remaining: 900, // 15분
        },
      ];

      setAttempts(mockAttempts);
      calculateStats(mockAttempts);

    } catch (error) {
      console.error('❌ Failed to load attempts:', error);
    } finally {
      setLoading(false);
    }
  }, [exam.id, calculateStats]);

  // Realtime 구독 설정
  useEffect(() => {
    loadAttempts();

    // Supabase Realtime 채널 생성
    const examChannel = supabase
      .channel(`exam:${exam.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_attempts',
          filter: `exam_id=eq.${exam.id}`,
        },
        (payload) => {
          console.log('🔔 Realtime update:', payload);

          if (payload.eventType === 'INSERT') {
            const newAttempt = payload.new as ExamAttempt;
            setAttempts((prev) => {
              const updated = [...prev, newAttempt];
              calculateStats(updated);
              return updated;
            });

            // 새 응시자 알림
            showNotification('새 응시자', `${newAttempt.user_name || '사용자'}님이 시험을 시작했습니다.`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedAttempt = payload.new as ExamAttempt;
            setAttempts((prev) => {
              const updated = prev.map((a) =>
                a.id === updatedAttempt.id ? updatedAttempt : a
              );
              calculateStats(updated);
              return updated;
            });

            // 완료 알림
            if (updatedAttempt.status === 'completed') {
              showNotification(
                '시험 완료',
                `${updatedAttempt.user_name || '사용자'}님이 시험을 완료했습니다. (${updatedAttempt.score}점)`
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setAttempts((prev) => {
              const updated = prev.filter((a) => a.id !== payload.old.id);
              calculateStats(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    setChannel(examChannel);

    // 정리
    return () => {
      if (examChannel) {
        supabase.removeChannel(examChannel);
      }
    };
  }, [exam.id, loadAttempts, calculateStats]);

  // 브라우저 알림
  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  };

  // 시간 포맷
  const formatTime = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 경과 시간 계산
  const getElapsedTime = (startedAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return formatTime(elapsed);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-lg animate-pulse"></div>
                <h2 className="text-2xl font-bold text-gray-900">실시간 응시 현황</h2>
              </div>
              <p className="text-sm text-gray-600 mt-2">{exam.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAttempts}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-full transition-all"
                title="새로고침"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <UsersIcon className="h-4 w-4" />
                <span>총 응시자</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 text-sm mb-1">
                <ClockIcon className="h-4 w-4" />
                <span>응시 중</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{stats.inProgress}</div>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 shadow-sm border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm mb-1">
                <CheckCircleIcon className="h-4 w-4" />
                <span>완료</span>
              </div>
              <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 text-sm mb-1">
                <ChartBarIcon className="h-4 w-4" />
                <span>평균 점수</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{stats.averageScore}점</div>
            </div>

            <div className="bg-orange-500/10 rounded-lg p-4 shadow-sm border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 text-sm mb-1">
                <ArrowPathIcon className="h-4 w-4" />
                <span>평균 진행률</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{stats.averageProgress}%</div>
            </div>
          </div>
        </div>

        {/* 응시자 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">로딩 중...</span>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">아직 응시자가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className={`border-2 rounded-lg p-5 transition-all ${
                    attempt.status === 'in_progress'
                      ? 'border-blue-300 bg-blue-50'
                      : attempt.status === 'completed'
                      ? 'border-green-300 bg-green-500/10'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* 사용자 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            attempt.status === 'in_progress'
                              ? 'bg-blue-600'
                              : attempt.status === 'completed'
                              ? 'bg-green-600'
                              : 'bg-gray-600'
                          }`}
                        >
                          {attempt.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{attempt.user_name || '익명'}</h3>
                          <p className="text-xs text-gray-600">
                            시작: {new Date(attempt.started_at).toLocaleTimeString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      {/* 진행률 바 */}
                      {attempt.status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>
                              {attempt.current_question} / {attempt.total_questions} 문제
                            </span>
                            <span>{attempt.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-lg h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-lg transition-all duration-300"
                              style={{ width: `${attempt.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 상태 및 정보 */}
                    <div className="ml-6 text-right">
                      {attempt.status === 'in_progress' ? (
                        <div>
                          <div className="flex items-center justify-end gap-2 text-blue-700 font-semibold mb-1">
                            <ClockIcon className="h-5 w-5 animate-pulse" />
                            <span>응시 중</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            경과: {getElapsedTime(attempt.started_at)}
                          </div>
                          <div className="text-sm text-gray-600">
                            남은 시간: {formatTime(attempt.time_remaining)}
                          </div>
                        </div>
                      ) : attempt.status === 'completed' ? (
                        <div>
                          <div className="flex items-center justify-end gap-2 text-green-700 font-semibold mb-1">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>완료</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900">
                            {attempt.score}점
                          </div>
                          <div className="text-xs text-gray-600">
                            {attempt.completed_at && new Date(attempt.completed_at).toLocaleTimeString('ko-KR')}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                          <XCircleIcon className="h-5 w-5" />
                          <span>중단됨</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-lg animate-pulse"></div>
              <span>실시간 업데이트 활성</span>
            </div>
            <div className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              <span>알림 활성화됨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
