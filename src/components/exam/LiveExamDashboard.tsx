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
  // const [channel, setChannel] = useState<RealtimeChannel | null>(null);
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

      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`
          *,
          trainee:trainees (
            id,
            name,
            user:users (
              name
            )
          )
        `)
        .eq('exam_id', exam.id);

      if (error) throw error;

      // Transform data
      const realAttempts: ExamAttempt[] = data.map((attempt: any) => {
        const startedAt = new Date(attempt.started_at);
        const durationMs = (exam.duration_minutes || 60) * 60 * 1000;
        const endsAt = new Date(startedAt.getTime() + durationMs);
        const timeRemaining = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));

        // Progress estimate (using score percentage as proxy if completed, else 0 or needs simpler logic)
        // For real progress tracking, we'd need to count question_responses. 
        // For now, simpler approximation:
        const progress = attempt.status === 'completed' ? 100 :
          attempt.status === 'in_progress' ? 50 : 0; // Placeholder until question_response count is integrated

        return {
          id: attempt.id,
          exam_id: attempt.exam_id,
          user_id: attempt.trainee_id, // Using trainee_id for user_id field for now
          user_name: attempt.trainee?.name || attempt.trainee?.user?.name || 'Unknown',
          started_at: attempt.started_at,
          completed_at: attempt.submitted_at,
          score: attempt.score,
          status: attempt.status,
          progress: progress,
          current_question: 0, // Not available without joining question_responses
          total_questions: exam.question_count || 0,
          time_remaining: attempt.status === 'in_progress' ? timeRemaining : 0,
        };
      });

      setAttempts(realAttempts);
      calculateStats(realAttempts);

    } catch (error) {
      console.error('❌ Failed to load attempts:', error);
    } finally {
      setLoading(false);
    }
  }, [exam.id, exam.duration_minutes, exam.question_count, calculateStats]);

  // Realtime 구독 설정
  useEffect(() => {
    loadAttempts();

    // Polling for time remaining updates
    const timer = setInterval(() => {
      setAttempts(prev => prev.map(a => {
        if (a.status === 'in_progress') {
          const startedAt = new Date(a.started_at);
          const durationMs = (exam.duration_minutes || 60) * 60 * 1000;
          const endsAt = new Date(startedAt.getTime() + durationMs);
          const timeRemaining = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
          return { ...a, time_remaining: timeRemaining };
        }
        return a;
      }));
    }, 1000);

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
        () => {
          // Instead of incremental updates, reload all to keep simple with trainee relations
          loadAttempts();
        }
      )
      .subscribe();

    // setChannel(examChannel); (Unused)

    // 정리
    return () => {
      clearInterval(timer);
      if (examChannel) {
        supabase.removeChannel(examChannel);
      }
    };
  }, [exam.id, loadAttempts, exam.duration_minutes]);

  // 브라우저 알림
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">실시간 응시 현황</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{exam.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAttempts}
                className="btn-ghost p-2 rounded-full"
                title="새로고침"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                닫기
              </button>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm mb-1 font-medium">
                <UsersIcon className="h-4 w-4" />
                <span>총 응시자</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 shadow-sm border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm mb-1 font-medium">
                <ClockIcon className="h-4 w-4" />
                <span>응시 중</span>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.inProgress}</div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 shadow-sm border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm mb-1 font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                <span>완료</span>
              </div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.completed}</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 shadow-sm border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm mb-1 font-medium">
                <ChartBarIcon className="h-4 w-4" />
                <span>평균 점수</span>
              </div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.averageScore}점</div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 shadow-sm border border-orange-100 dark:border-orange-800">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-sm mb-1 font-medium">
                <ArrowPathIcon className="h-4 w-4" />
                <span>평균 진행률</span>
              </div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.averageProgress}%</div>
            </div>
          </div>
        </div>

        {/* 응시자 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">로딩 중...</span>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">아직 응시자가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className={`border rounded-2xl p-5 transition-all ${attempt.status === 'in_progress'
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm'
                    : attempt.status === 'completed'
                      ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    {/* 사용자 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${attempt.status === 'in_progress'
                            ? 'bg-blue-600'
                            : attempt.status === 'completed'
                              ? 'bg-green-600'
                              : 'bg-gray-600'
                            }`}
                        >
                          {attempt.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{attempt.user_name || '익명'}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            시작: {new Date(attempt.started_at).toLocaleTimeString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      {/* 진행률 바 */}
                      {attempt.status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>
                              {attempt.current_question} / {attempt.total_questions} 문제
                            </span>
                            <span>{attempt.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
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
                          <div className="flex items-center justify-end gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-1">
                            <ClockIcon className="h-5 w-5 animate-pulse" />
                            <span>응시 중</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            경과: {getElapsedTime(attempt.started_at)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            남은 시간: {formatTime(attempt.time_remaining)}
                          </div>
                        </div>
                      ) : attempt.status === 'completed' ? (
                        <div>
                          <div className="flex items-center justify-end gap-2 text-green-700 dark:text-green-400 font-semibold mb-1">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span>완료</span>
                          </div>
                          <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                            {attempt.score}점
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {attempt.completed_at && new Date(attempt.completed_at).toLocaleTimeString('ko-KR')}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
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

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-medium">실시간 업데이트 활성</span>
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
