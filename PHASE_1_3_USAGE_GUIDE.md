# 📘 과정 관리 시스템 개선 - 사용 가이드

Phase 1~3 구현 완료 후 사용 방법

---

## 🚀 시작하기

### 1️⃣ 데이터베이스 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 순서대로 실행:

```sql
-- Phase 2: 데이터 무결성 강화
-- database/migrations/009_data_integrity_enhancement.sql 내용 복사 & 실행

-- Phase 3: 성능 최적화 및 감사 로그
-- database/migrations/010_performance_and_audit.sql 내용 복사 & 실행
```

### 2️⃣ 통계 뷰 초기화

```sql
-- Materialized View 초기 생성
SELECT refresh_statistics_views();
```

---

## 📚 사용 예시

### 1. 강사 관리 (Phase 1-1)

```typescript
import { UnifiedCourseService } from '@/services/unified-course.service';

// 사용 가능한 강사 목록 (users.role='instructor' 자동 통합)
const instructors = await UnifiedCourseService.getAvailableInstructors();

// 강사 검색
const results = await UnifiedCourseService.searchInstructors('김');

// 사용자를 강사로 승격
import { InstructorIntegrationService } from '@/services/instructor-integration.service';
await InstructorIntegrationService.promoteToInstructor(userId, {
  specializations: ['React', 'TypeScript'],
  years_of_experience: 5
});
```

---

### 2. 수료 조건 검증 (Phase 1-2)

```typescript
// 개별 교육생 수료 가능 여부 확인
const status = await UnifiedCourseService.checkTraineeCompletion(
  traineeId,
  roundId
);

console.log(status);
// {
//   can_complete: false,
//   attendance_rate: 75,
//   attended_sessions: 15,
//   total_sessions: 20,
//   reasons: ['출석률 75% (최소 80% 필요)']
// }

// 차수 전체 수료 처리 (조건 충족자만)
const result = await UnifiedCourseService.processCompletion(roundId, {
  min_attendance_rate: 80,
  min_final_score: 60
});

console.log(result);
// {
//   completed: ['trainee-id-1', 'trainee-id-2'],
//   failed: [
//     { traineeId: 'trainee-id-3', reasons: ['출석률 부족'] }
//   ]
// }
```

---

### 3. 강의실 예약 (Phase 1-3)

```typescript
// 강의실 충돌 검증
const conflict = await UnifiedCourseService.checkClassroomConflict(
  classroomId,
  '2025-01-25',
  '09:00:00',
  '12:00:00'
);

if (conflict.has_conflict) {
  console.log(conflict.message);
  // "예약 충돌:
  //  09:00:00-12:00:00: React 기초 (BS Basic 1차)"
}

// 사용 가능한 강의실 조회
const available = await UnifiedCourseService.getAvailableClassrooms(
  '2025-01-25',
  '09:00:00',
  '12:00:00',
  30 // 최소 30명 수용
);

// 강의실 할당 (충돌 자동 검증)
const result = await UnifiedCourseService.assignClassroom(
  curriculumItemId,
  classroomId
);

if (!result.success) {
  console.error(result.message);
}

// 차수 전체 일괄 할당
const bulkResult = await UnifiedCourseService.bulkAssignClassroom(
  roundId,
  defaultClassroomId
);

console.log(bulkResult);
// {
//   total: 15,
//   success: 14,
//   failed: 1,
//   errors: ['2025-01-26 14:00-17:00 Node.js: 예약 충돌']
// }

// 강의실 사용 현황
const schedule = await UnifiedCourseService.getClassroomSchedule(
  classroomId,
  '2025-01-01',
  '2025-01-31'
);
```

---

### 4. 고성능 통계 조회 (Phase 3)

```typescript
import { StatisticsService } from '@/services/statistics.service';

// 차수 통계 (Materialized View - 빠름!)
const stats = await StatisticsService.getRoundStatistics(roundId);

console.log(stats);
// {
//   round_id: '...',
//   total_enrolled: 25,
//   active_count: 23,
//   completed_count: 2,
//   enrollment_rate: 83.33,
//   session_completion_rate: 60.00,
//   ...
// }

// 대시보드 요약
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

// 월별 등록 추이
const trend = await StatisticsService.getMonthlyEnrollmentTrend(6);

console.log(trend);
// [
//   { month: '2024-08', enrollments: 45, completions: 38 },
//   { month: '2024-09', enrollments: 52, completions: 47 },
//   ...
// ]

// 통계 갱신 (배치 작업)
await StatisticsService.refreshStatistics();
```

---

### 5. 감사 로그 (Phase 3)

```typescript
import { AuditLogService } from '@/services/audit-log.service';

// 특정 레코드의 변경 이력
const history = await AuditLogService.getRecordHistory(
  'course_rounds',
  roundId,
  50
);

history.forEach(log => {
  console.log(`${log.timestamp}: ${log.operation}`);
  console.log('변경 필드:', log.changed_fields);
  console.log('이전:', log.old_data);
  console.log('이후:', log.new_data);
});

// 최근 24시간 로그
const recent = await AuditLogService.getRecentLogs(24);

// 감사 로그 통계 (7일)
const logStats = await AuditLogService.getLogStatistics(7);

console.log(logStats);
// {
//   total_logs: 156,
//   by_operation: { INSERT: 45, UPDATE: 98, DELETE: 13 },
//   by_table: { course_rounds: 35, round_enrollments: 89, ... },
//   by_severity: { medium: 140, high: 16 }
// }
```

---

## 🔄 배치 작업 권장

### 매일 자정 실행

```typescript
// 통계 뷰 갱신 (Materialized View)
await StatisticsService.refreshStatistics();
```

### 매주 실행

```typescript
// 오래된 감사 로그 아카이빙 (90일 이상)
const deletedCount = await AuditLogService.archiveLogs(90);
console.log(`${deletedCount}개 로그 아카이빙 완료`);
```

---

## ⚙️ 설정

### 수료 조건 커스터마이징

```typescript
// 기본값: 출석률 80%, 지각을 출석으로 인정
const result = await UnifiedCourseService.processCompletion(roundId);

// 커스텀 조건
const result = await UnifiedCourseService.processCompletion(roundId, {
  min_attendance_rate: 90,    // 출석률 90% 이상
  min_final_score: 70,         // 최종 점수 70점 이상
  allow_late_as_present: false // 지각은 출석으로 인정 안 함
});
```

---

## 🐛 트러블슈팅

### 통계가 업데이트되지 않음

```sql
-- Materialized View 수동 갱신
SELECT refresh_statistics_views();
```

### 감사 로그가 기록되지 않음

마이그레이션 010번 실행 여부 확인:

```sql
-- audit_logs 테이블 존재 확인
SELECT COUNT(*) FROM audit_logs;

-- 트리거 존재 확인
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('course_rounds', 'round_enrollments', 'curriculum_items');
```

### 강의실 충돌 검증이 작동하지 않음

`curriculum_items_full` 뷰 확인:

```sql
-- 뷰 존재 여부
SELECT COUNT(*) FROM curriculum_items_full;
```

---

## 📖 추가 문서

- **API 레퍼런스**: 각 서비스 파일의 주석 참조
- **데이터베이스 스키마**: `database/migrations/` 참조
- **타입 정의**: `src/types/*.types.ts` 참조

---

## 🎯 다음 개선 사항 (선택)

1. **실시간 알림**: 강의실 충돌 시 실시간 알림
2. **대시보드 UI**: 통계 시각화 대시보드
3. **자동 배치**: Cron job으로 통계 자동 갱신
4. **이메일 알림**: 수료 불가 교육생 알림
5. **리포트 생성**: PDF 수료증 자동 생성

---

**작성일**: 2025-01-24
**버전**: Phase 1~3 완료
