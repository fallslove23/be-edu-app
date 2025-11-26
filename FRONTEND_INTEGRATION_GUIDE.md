# 🎯 프론트엔드 통합 가이드

Phase 1-3 구현 완료 후 프론트엔드에서 새 기능을 사용하는 방법

---

## 📦 새로 추가된 서비스

### 1. ResourceReservationService - 강의실 예약 관리

**위치**: `src/services/resource-reservation.service.ts`

```typescript
import { ResourceReservationService } from '@/services/resource-reservation.service';

// 1. 강의실 충돌 검증
const conflictInfo = await ResourceReservationService.checkClassroomConflict(
  classroomId,
  '2025-01-25',
  '09:00:00',
  '12:00:00'
);

if (conflictInfo.has_conflict) {
  alert(conflictInfo.message);
  // 예: "예약 충돌:\n09:00:00-12:00:00: React 기초 (BS Basic 1차)"
}

// 2. 사용 가능한 강의실 조회
const availableRooms = await ResourceReservationService.getAvailableClassrooms(
  '2025-01-25',
  '09:00:00',
  '12:00:00',
  30  // 최소 30명 수용
);

// 3. 강의실 할당
const result = await ResourceReservationService.assignClassroom(
  curriculumItemId,
  classroomId
);

if (!result.success) {
  console.error(result.message);
}

// 4. 강의실 사용 현황 조회
const schedule = await ResourceReservationService.getClassroomSchedule(
  classroomId,
  '2025-01-01',
  '2025-01-31'
);
```

---

### 2. CompletionCriteriaService - 수료 조건 검증

**위치**: `src/services/completion-criteria.service.ts`

```typescript
import { CompletionCriteriaService } from '@/services/completion-criteria.service';

// 1. 개별 교육생 수료 가능 여부 확인
const status = await CompletionCriteriaService.checkCompletionEligibility(
  traineeId,
  roundId,
  {
    min_attendance_rate: 80,  // 출석률 80% 이상
    min_final_score: 60,       // 최종 점수 60점 이상
    allow_late_as_present: true // 지각을 출석으로 인정
  }
);

if (status.can_complete) {
  console.log('수료 가능!');
} else {
  console.log('수료 불가 사유:', status.reasons);
  // 예: ['출석률 75% (최소 80% 필요)', '최종 점수 미달']
}

// 2. 차수 전체 수료 처리 (조건 충족자만)
const result = await CompletionCriteriaService.processRoundCompletion(
  roundId,
  {
    min_attendance_rate: 80,
    min_final_score: 60
  }
);

console.log(`수료: ${result.completed.length}명`);
console.log(`수료 불가: ${result.failed.length}명`);
```

---

### 3. StatisticsService - 고성능 통계 조회

**위치**: `src/services/statistics.service.ts`

```typescript
import { StatisticsService } from '@/services/statistics.service';

// 1. 대시보드 요약 통계
const summary = await StatisticsService.getDashboardSummary();

console.log(summary);
// {
//   total_rounds: 15,
//   active_rounds: 5,
//   total_enrollments: 350,
//   total_trainees: 120,
//   avg_completion_rate: 85.5,
//   recent_activities: 8
// }

// 2. 차수별 상세 통계 (Materialized View - 빠름!)
const roundStats = await StatisticsService.getRoundStatistics(roundId);

console.log(roundStats[0]);
// {
//   round_id: '...',
//   round_name: 'BS Basic 1차',
//   total_enrolled: 25,
//   active_count: 23,
//   completed_count: 2,
//   enrollment_rate: 83.33,
//   session_completion_rate: 60.00,
//   ...
// }

// 3. 월별 등록 추이
const trend = await StatisticsService.getMonthlyEnrollmentTrend(6);

console.log(trend);
// [
//   { month: '2024-08', enrollments: 45, completions: 38 },
//   { month: '2024-09', enrollments: 52, completions: 47 },
//   ...
// ]

// 4. 통계 갱신 (배치 작업 - 매일 자정 권장)
await StatisticsService.refreshStatistics();
```

---

### 4. AuditLogService - 감사 로그

**위치**: `src/services/audit-log.service.ts`

```typescript
import { AuditLogService } from '@/services/audit-log.service';

// 1. 특정 레코드의 변경 이력
const history = await AuditLogService.getRecordHistory(
  'course_rounds',
  roundId,
  50
);

history.forEach(log => {
  console.log(`${log.logged_at}: ${log.operation}`);
  console.log('변경 필드:', log.changed_fields);
  console.log('이전:', log.old_data);
  console.log('이후:', log.new_data);
});

// 2. 최근 24시간 로그
const recentLogs = await AuditLogService.getRecentLogs(24, 100);

// 3. 감사 로그 통계 (7일)
const stats = await AuditLogService.getLogStatistics(7);

console.log(stats);
// {
//   total_logs: 156,
//   by_operation: { INSERT: 45, UPDATE: 98, DELETE: 13 },
//   by_table: { course_rounds: 35, round_enrollments: 89, ... },
//   by_severity: { medium: 140, high: 16 }
// }
```

---

### 5. InstructorIntegrationService - 강사 관리

**위치**: `src/services/instructor-integration.service.ts`

```typescript
import { InstructorIntegrationService } from '@/services/instructor-integration.service';

// 1. 모든 강사 조회 (users + instructors 통합)
const instructors = await InstructorIntegrationService.getAllInstructors();

// 2. 활성 강사만 조회
const activeInstructors = await InstructorIntegrationService.getAllInstructors(true);

// 3. 특정 강사 상세 정보
const instructor = await InstructorIntegrationService.getInstructorById(userId);

// 4. 사용자를 강사로 승격
await InstructorIntegrationService.promoteToInstructor(userId, {
  specializations: ['React', 'TypeScript'],
  years_of_experience: 5,
  certifications: ['AWS Certified']
});
```

---

## 🎨 UI 컴포넌트 예시

### 강의실 예약 폼

```typescript
'use client';

import { useState } from 'react';
import { ResourceReservationService } from '@/services/resource-reservation.service';

export default function ClassroomReservationForm() {
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);

  const checkAvailability = async () => {
    const rooms = await ResourceReservationService.getAvailableClassrooms(
      selectedDate,
      startTime,
      endTime,
      30 // 최소 인원
    );
    setAvailableRooms(rooms);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">강의실 예약</h2>

      <div className="space-y-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={checkAvailability}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          사용 가능한 강의실 조회
        </button>

        <div className="mt-4">
          <h3 className="font-bold mb-2">사용 가능한 강의실</h3>
          {availableRooms.map((room) => (
            <div key={room.id} className="border p-3 rounded mb-2">
              <p className="font-semibold">{room.name}</p>
              <p className="text-sm text-gray-600">{room.location}</p>
              <p className="text-sm">수용 인원: {room.capacity}명</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 대시보드 통계 위젯

```typescript
'use client';

import { useEffect, useState } from 'react';
import { StatisticsService } from '@/services/statistics.service';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const summary = await StatisticsService.getDashboardSummary();
      setStats(summary);
    };
    loadStats();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">전체 차수</h3>
        <p className="text-3xl font-bold">{stats.total_rounds}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">진행 중인 차수</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.active_rounds}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">총 등록 인원</h3>
        <p className="text-3xl font-bold text-green-600">{stats.total_enrollments}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">평균 수료율</h3>
        <p className="text-3xl font-bold text-purple-600">{stats.avg_completion_rate}%</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">최근 활동 (24시간)</h3>
        <p className="text-3xl font-bold text-orange-600">{stats.recent_activities}</p>
      </div>
    </div>
  );
}
```

---

### 수료 처리 페이지

```typescript
'use client';

import { useState } from 'react';
import { CompletionCriteriaService } from '@/services/completion-criteria.service';

export default function CompletionProcessPage({ roundId }: { roundId: string }) {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleProcessCompletion = async () => {
    setProcessing(true);

    try {
      const result = await CompletionCriteriaService.processRoundCompletion(
        roundId,
        {
          min_attendance_rate: 80,
          min_final_score: 60,
          allow_late_as_present: true
        }
      );

      setResult(result);
      alert(`수료 처리 완료: ${result.completed.length}명 수료, ${result.failed.length}명 수료 불가`);
    } catch (error) {
      console.error('Error processing completion:', error);
      alert('수료 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">수료 처리</h2>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
        <p className="text-sm">
          ⚠️ 수료 조건: 출석률 80% 이상, 최종 점수 60점 이상
        </p>
      </div>

      <button
        onClick={handleProcessCompletion}
        disabled={processing}
        className="bg-green-600 text-white px-6 py-3 rounded disabled:bg-gray-400"
      >
        {processing ? '처리 중...' : '수료 처리 실행'}
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <h3 className="font-bold text-green-800">✅ 수료 완료: {result.completed.length}명</h3>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <h3 className="font-bold text-red-800">❌ 수료 불가: {result.failed.length}명</h3>
            {result.failed.map((item, idx) => (
              <div key={idx} className="mt-2 text-sm">
                <p className="font-semibold">{item.trainee_name}</p>
                <p className="text-red-600">{item.reasons.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 배치 작업 설정

### 매일 자정 통계 갱신

```typescript
// app/api/cron/refresh-statistics/route.ts
import { StatisticsService } from '@/services/statistics.service';

export async function GET() {
  try {
    await StatisticsService.refreshStatistics();
    return Response.json({ success: true, message: 'Statistics refreshed' });
  } catch (error) {
    console.error('Error refreshing statistics:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

**Vercel Cron 설정** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-statistics",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 🧪 테스트 예시

```typescript
// __tests__/services/resource-reservation.test.ts
import { ResourceReservationService } from '@/services/resource-reservation.service';

describe('ResourceReservationService', () => {
  it('should detect classroom conflicts', async () => {
    const conflict = await ResourceReservationService.checkClassroomConflict(
      'classroom-id',
      '2025-01-25',
      '09:00:00',
      '12:00:00'
    );

    expect(conflict).toHaveProperty('has_conflict');
    expect(conflict).toHaveProperty('conflicting_reservations');
  });

  it('should return available classrooms', async () => {
    const rooms = await ResourceReservationService.getAvailableClassrooms(
      '2025-01-25',
      '09:00:00',
      '12:00:00',
      30
    );

    expect(Array.isArray(rooms)).toBe(true);
  });
});
```

---

## 📚 추가 문서

- **[PHASE_1_3_USAGE_GUIDE.md](PHASE_1_3_USAGE_GUIDE.md)**: 전체 기능 사용 가이드
- **API 문서**: 각 서비스 파일의 JSDoc 주석 참조
- **타입 정의**: `src/types/*.types.ts`

---

**작성일**: 2025-01-24
**버전**: Phase 1-3 완료
