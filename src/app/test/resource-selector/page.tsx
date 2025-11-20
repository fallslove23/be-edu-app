'use client';

import React, { useState } from 'react';
import { ResourceSelector } from '@/components/schedule/ResourceSelector';

/**
 * ResourceSelector 테스트 페이지
 * Phase 2 통합 자원 관리 기능 테스트
 */
export default function ResourceSelectorTestPage() {
  const [sessionDate, setSessionDate] = useState('2025-02-10');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-card-foreground mb-2">
            🧪 ResourceSelector 테스트
          </h1>
          <p className="text-muted-foreground">
            Phase 2: 커리큘럼-자원 통합 기능 테스트 페이지
          </p>
        </div>

        {/* 테스트 설정 */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">세션 정보 입력</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">세션 날짜</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">과목 ID (선택)</label>
              <input
                type="text"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                placeholder="UUID 입력 (추천 기능 테스트용)"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">시작 시간</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">종료 시간</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
          </div>
        </div>

        {/* ResourceSelector 컴포넌트 */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">자원 선택</h2>

          <ResourceSelector
            sessionDate={sessionDate}
            startTime={startTime}
            endTime={endTime}
            subjectId={subjectId || undefined}
            selectedInstructorId={selectedInstructorId}
            selectedClassroomId={selectedClassroomId}
            onInstructorChange={setSelectedInstructorId}
            onClassroomChange={setSelectedClassroomId}
            showRecommendations={true}
          />
        </div>

        {/* 선택 결과 */}
        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">선택 결과</h2>

          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">세션 날짜/시간</div>
              <div className="font-medium">
                {sessionDate} | {startTime} ~ {endTime}
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">선택된 강사 ID</div>
              <div className="font-medium font-mono text-sm">
                {selectedInstructorId || '(없음)'}
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">선택된 강의실 ID</div>
              <div className="font-medium font-mono text-sm">
                {selectedClassroomId || '(없음)'}
              </div>
            </div>
          </div>
        </div>

        {/* 테스트 가이드 */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
            📋 테스트 가이드
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li>✅ <strong>Step 1</strong>: 날짜와 시간을 입력하세요</li>
            <li>✅ <strong>Step 2</strong>: 사용 가능한 강사/강의실 목록이 표시되는지 확인</li>
            <li>✅ <strong>Step 3</strong>: 충돌하는 자원 선택 시 경고가 표시되는지 확인</li>
            <li>✅ <strong>Step 4</strong>: 과목 ID를 입력하면 스마트 추천이 동작하는지 확인</li>
            <li>✅ <strong>Step 5</strong>: 자원 선택 시 하단에 선택 결과가 표시되는지 확인</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
