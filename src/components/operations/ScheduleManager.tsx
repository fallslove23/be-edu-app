'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LinkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { FirebasePlannerService } from '../../services/firebase-planner.service';
import { isPlannerConfigured } from '../../services/firebase';
import type { CalendarEvent } from '../../types/schedule.types';

interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  classroom: string;
  instructor: string;
  color: string;
}

const ScheduleManager: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [plannerStatus, setPlannerStatus] = useState<'connected' | 'disconnected' | 'checking'>('disconnected');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Firebase 플래너 연결 상태 확인
  const checkPlannerConnection = async () => {
    setPlannerStatus('checking');
    try {
      const isConfigured = isPlannerConfigured();
      if (isConfigured) {
        // 실제 API 호출로 연결 테스트
        await FirebasePlannerService.getCoursesFromPlanner();
        setPlannerStatus('connected');
      } else {
        setPlannerStatus('disconnected');
      }
    } catch (error) {
      console.error('플래너 연결 확인 실패:', error);
      setPlannerStatus('disconnected');
    }
  };

  // Firebase 플래너에서 일정 가져오기
  const fetchSchedulesFromPlanner = async () => {
    setLoading(true);
    setError(null);
    try {
      // 현재 월의 시작일과 종료일
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const events = await FirebasePlannerService.getCalendarEvents(startDateStr, endDateStr);

      // CalendarEvent를 Schedule 형식으로 변환
      const convertedSchedules: Schedule[] = events.map(event => ({
        id: event.id,
        title: event.title,
        startTime: event.start,
        endTime: event.end,
        classroom: event.classroom || '미정',
        instructor: event.instructor_id || '미정',
        color: event.color || '#3B82F6'
      }));

      setSchedules(convertedSchedules);
      console.log('✅ Firebase 플래너에서 일정 가져오기 성공:', convertedSchedules.length, '개');
    } catch (err) {
      console.error('❌ 일정 가져오기 실패:', err);
      setError('일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Firebase 플래너와 동기화
  const syncWithPlanner = async () => {
    setSyncStatus('syncing');
    try {
      await fetchSchedulesFromPlanner();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('동기화 실패:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // 오늘의 일정 필터링
  const getTodaySchedules = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return schedules.filter(schedule => {
      const scheduleDate = schedule.startTime.split('T')[0];
      return scheduleDate === todayStr;
    });
  };

  // 컴포넌트 마운트 시 플래너 연결 상태 확인
  useEffect(() => {
    checkPlannerConnection();
  }, []);

  // 월이 변경될 때마다 일정 새로 가져오기
  useEffect(() => {
    if (plannerStatus === 'connected') {
      fetchSchedulesFromPlanner();
    }
  }, [currentDate, plannerStatus]);

  const todaySchedules = getTodaySchedules();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">📅 일정 관리</h1>
            <p className="text-muted-foreground">
              강의 일정 및 교실 배정을 관리합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 동기화 버튼 */}
            <button
              onClick={syncWithPlanner}
              disabled={plannerStatus !== 'connected' || syncStatus === 'syncing'}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>
                {syncStatus === 'syncing' ? '동기화 중...' :
                 syncStatus === 'success' ? '동기화 완료' :
                 syncStatus === 'error' ? '동기화 실패' : '동기화'}
              </span>
            </button>

            {/* 과정 플래너 연결 버튼 */}
            <button
              onClick={() => setIsPlannerModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 font-medium"
            >
              <LinkIcon className="h-4 w-4" />
              <span>과정 플래너 연결</span>
            </button>

            {/* 일정 추가 버튼 */}
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 font-medium">
              <PlusIcon className="h-4 w-4" />
              <span>일정 추가</span>
            </button>
          </div>
        </div>

        {/* 플래너 연결 상태 표시 */}
        <div className="mt-4 flex items-center gap-2">
          {plannerStatus === 'connected' ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Firebase 플래너 연결됨</span>
            </div>
          ) : plannerStatus === 'checking' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>연결 확인 중...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircleIcon className="h-5 w-5" />
              <span>Firebase 플래너 미연결 (환경 변수 설정 필요)</span>
            </div>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* 네비게이션 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-muted-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-card-foreground">
            {formatDate(currentDate)}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 캘린더 뷰 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        {loading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">일정을 불러오는 중...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">일정이 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              {plannerStatus === 'connected'
                ? '이번 달에 등록된 일정이 없습니다.'
                : 'Firebase 플래너를 연결하거나 일정을 추가하세요.'}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ 캘린더 뷰로 일정 확인</p>
              <p>✅ 강의실 배정 관리</p>
              <p>✅ 강사 및 수강생 정보</p>
              <p>✅ Firebase 플래너 실시간 동기화</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">
              📅 {formatDate(currentDate)} 일정 ({schedules.length}개)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow"
                  style={{ backgroundColor: `${schedule.color}10`, borderColor: schedule.color }}
                >
                  <h4 className="font-medium text-card-foreground mb-2">{schedule.title}</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {new Date(schedule.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {schedule.classroom}
                    </p>
                    <p>강사: {schedule.instructor}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 오늘의 일정 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">📌 오늘의 일정</h3>
        {todaySchedules.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">오늘은 예정된 일정이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {todaySchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-start space-x-4 p-4 rounded-lg border"
                style={{
                  backgroundColor: `${schedule.color}10`,
                  borderColor: schedule.color
                }}
              >
                <div className="flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: schedule.color }}
                  >
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground">{schedule.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(schedule.startTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - {new Date(schedule.endTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {schedule.classroom}
                    </span>
                    <span>강사: {schedule.instructor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 과정 플래너 연결 모달 */}
      {isPlannerModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">과정 플래너 연결</h3>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2">📱 외부 과정 플래너 앱</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Firebase 기반 과정 플래너 앱과 실시간으로 일정을 동기화합니다.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">URL:</span>
                    <a
                      href={process.env.NEXT_PUBLIC_FIREBASE_PLANNER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {process.env.NEXT_PUBLIC_FIREBASE_PLANNER_URL}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">상태:</span>
                    {plannerStatus === 'connected' ? (
                      <span className="text-green-600">✅ 연결됨</span>
                    ) : (
                      <span className="text-destructive">❌ 미연결</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-card-foreground mb-2">🔧 설정 방법</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>.env.local 파일에 Firebase 플래너 환경 변수를 설정하세요</li>
                  <li>NEXT_PUBLIC_FIREBASE_PLANNER_API_KEY</li>
                  <li>NEXT_PUBLIC_FIREBASE_PLANNER_PROJECT_ID</li>
                  <li>NEXT_PUBLIC_FIREBASE_PLANNER_AUTH_DOMAIN</li>
                  <li>개발 서버를 재시작하세요</li>
                </ol>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={checkPlannerConnection}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  연결 테스트
                </button>
                <a
                  href={process.env.NEXT_PUBLIC_FIREBASE_PLANNER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  플래너 앱 열기
                </a>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsPlannerModalOpen(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
