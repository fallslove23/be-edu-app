# 일정 관리 시스템 개선 사항

## 📋 개요

BS 학습 관리 시스템의 일정 관리 기능을 대폭 개선하여 충돌 감지, 자동 일정 생성, 리소스 최적화 기능을 강화했습니다.

## ✨ 주요 개선 사항

### 1. 강화된 충돌 감지 시스템 (`schedule-validator.service.ts`)

#### 🎯 핵심 기능

**다차원 충돌 검증**
- ✅ **강사 일정 충돌**: 강사가 동일 시간대에 중복 배정되는 것을 방지
- ✅ **교실 예약 충돌**: 교실 이중 예약 차단
- ✅ **교육생 그룹 충돌**: 같은 차수 교육생들의 일정 겹침 방지
- ✅ **연속 강의 시간 제한**: 강사의 최대 연속 강의 시간(4시간) 체크
- ✅ **업무 시간 검증**: 근무 시간(09:00-18:00) 외 일정 경고
- ✅ **주말/공휴일 검증**: 주말 및 공휴일 일정 경고

#### 📊 충돌 심각도 분류

| 심각도 | 설명 | 처리 방식 |
|--------|------|----------|
| `critical` | 절대 진행 불가 (예: 강사 이중 배정) | 일정 생성 차단 |
| `high` | 매우 권장하지 않음 (예: 교실 이중 예약) | 일정 생성 차단 |
| `medium` | 주의 필요 (예: 연속 강의 4시간 초과) | 경고 표시 후 진행 가능 |
| `low` | 참고 사항 | 정보성 메시지 |

#### 💡 사용 예시

```typescript
import { ScheduleValidatorService } from '@/services/schedule-validator.service';

// 일정 검증
const validation = await ScheduleValidatorService.validateSchedule({
  start_time: '2025-12-03T09:00:00',
  end_time: '2025-12-03T11:00:00',
  instructor_id: 'instructor-id',
  classroom_id: 'classroom-id',
  course_round_id: 'round-id',
});

if (!validation.isValid) {
  console.log('충돌 발견:', validation.conflicts);
  console.log('경고:', validation.warnings);
}

// 가용 시간대 추천
const suggestions = await ScheduleValidatorService.suggestAvailableTimeSlots(
  '2025-12-03',
  2, // 2시간
  'instructor-id',
  'classroom-id'
);
// → [{start_time: '09:00:00', end_time: '11:00:00'}, ...]
```

### 2. 지능형 커리큘럼 자동 생성 (`curriculum-generator.service.ts`)

#### 🎯 핵심 기능

**템플릿 기반 자동 생성**
- 📝 커리큘럼 템플릿에서 세션 정보 로드
- 📅 시작일부터 자동으로 영업일 계산
- 🏫 주말/공휴일 자동 회피
- 👨‍🏫 강사 가용성 실시간 체크
- 🏢 교실 예약 상황 반영
- ⚡ 자동 충돌 감지 및 해결

#### 📐 최적화 알고리즘

**강사 배정 로직**
- 과목별 자격있는 강사 자동 검색
- 강사 선호도 및 우선순위 반영
- 하루 강의 부담 분산
- 연속 강의 시간 제한 준수

**교실 배정 로직**
- 수용 인원에 맞는 교실 자동 선택
- 선호 교실 우선 배정
- 예약 가능한 교실 실시간 필터링

**일정 품질 점수**
- 0-100점 스케일로 일정 품질 평가
- 선호 강사/교실 배정 시 가산점
- 충돌 발생 시 감점
- 품질 점수 기반 일정 최적화

#### 💡 사용 예시

```typescript
import { CurriculumGeneratorService } from '@/services/curriculum-generator.service';

// 커리큘럼 자동 생성
const result = await CurriculumGeneratorService.generateCurriculum({
  start_date: '2025-12-03',
  course_round_id: 'round-id',
  template_id: 'template-id',
  skip_weekends: true,
  skip_holidays: true,
  preferred_start_hour: 9,
  preferred_end_hour: 18,
  max_sessions_per_day: 4,
  min_break_minutes: 10,
});

console.log(`총 ${result.total_sessions}개 세션 중 ${result.successful_sessions}개 성공`);
console.log(`예상 종료일: ${result.estimated_end_date}`);

// 생성된 일정을 데이터베이스에 저장
if (result.success) {
  const saveResult = await CurriculumGeneratorService.saveCurriculum(
    'round-id',
    result.sessions
  );
  console.log(`${saveResult.saved_count}개 세션 저장 완료`);
}
```

### 3. 기존 서비스 통합 강화

#### `schedule.service.ts` 개선

**자동 검증 통합**
```typescript
// 일정 생성 시 자동 검증
async create(schedule: ScheduleCreate): Promise<Schedule> {
  // 충돌 자동 감지
  const validation = await ScheduleValidatorService.validateSchedule({...});

  if (!validation.isValid) {
    throw new Error(`일정 충돌 발견: ${criticalConflicts[0].message}`);
  }

  // 검증 통과 후 생성
  return await supabase.from('schedules').insert(schedule);
}
```

**일정 수정 시 검증**
- 시간 변경 시에만 충돌 검증 실행
- 기존 일정 제외하고 충돌 체크
- 성능 최적화

## 📊 개선 효과

| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| 충돌 감지 | 강사/교실만 | 강사/교실/교육생/시간 |
| 충돌 해결 | 수동 | 자동 제안 |
| 커리큘럼 생성 | 수동 입력 | 자동 생성 + 최적화 |
| 강사 배정 | 수동 선택 | 가용성 기반 자동 추천 |
| 교실 배정 | 수동 선택 | 예약 상황 기반 자동 추천 |
| 일정 품질 | 검증 없음 | 0-100점 품질 점수 |

## 🚀 사용 시나리오

### 시나리오 1: 새 과정 개설

```typescript
// 1. 템플릿 선택하여 커리큘럼 자동 생성
const result = await CurriculumGeneratorService.generateCurriculum({
  start_date: '2025-12-03',
  course_round_id: newRoundId,
  template_id: 'bs-basic-template',
  skip_weekends: true,
  skip_holidays: true,
  preferred_start_hour: 9,
  preferred_end_hour: 18,
  max_sessions_per_day: 4,
  min_break_minutes: 10,
});

// 2. 결과 검토
console.log('생성 결과:', result);
if (result.warnings.length > 0) {
  console.log('경고 사항:', result.warnings);
}

// 3. 저장
if (result.success) {
  await CurriculumGeneratorService.saveCurriculum(newRoundId, result.sessions);
}
```

### 시나리오 2: 수동 일정 추가

```typescript
// 1. 먼저 검증
const validation = await ScheduleValidatorService.validateSchedule({
  start_time: '2025-12-03T14:00:00',
  end_time: '2025-12-03T16:00:00',
  instructor_id: instructorId,
  classroom_id: classroomId,
  course_round_id: roundId,
});

// 2. 충돌이 있으면 대안 시간 추천
if (!validation.isValid) {
  const suggestions = await ScheduleValidatorService.suggestAvailableTimeSlots(
    '2025-12-03',
    2,
    instructorId,
    classroomId,
    roundId
  );
  console.log('추천 시간대:', suggestions);
} else {
  // 3. 검증 통과 시 생성
  await scheduleService.create({
    start_time: '2025-12-03T14:00:00',
    end_time: '2025-12-03T16:00:00',
    instructor_id: instructorId,
    classroom_id: classroomId,
    course_round_id: roundId,
    ...
  });
}
```

## 🔧 설정 가능 옵션

### 충돌 검증 상수

```typescript
// src/services/schedule-validator.service.ts
const WORK_START_HOUR = 9;          // 업무 시작 시간
const WORK_END_HOUR = 18;           // 업무 종료 시간
const MAX_CONTINUOUS_HOURS = 4;     // 최대 연속 강의 시간
const MIN_BREAK_MINUTES = 10;       // 최소 휴식 시간
```

### 공휴일 관리

```typescript
// 한국 공휴일 (2025년)
const KOREAN_HOLIDAYS_2025 = new Set([
  '2025-01-01',  // 신정
  '2025-01-28', '2025-01-29', '2025-01-30',  // 설날
  '2025-03-01',  // 삼일절
  // ... 추가 가능
]);
```

## ⚠️ 주의사항

1. **데이터베이스 권한**: course_sessions, schedules, classrooms, instructor_subjects 테이블에 대한 읽기/쓰기 권한 필요

2. **성능 고려**: 대량 일정 생성 시 시간이 소요될 수 있음 (100개 세션 기준 약 5-10초)

3. **트랜잭션**: saveCurriculum는 개별 INSERT를 수행하므로 일부만 저장될 수 있음

4. **시간대**: 모든 시간은 ISO 8601 형식 (예: '2025-12-03T09:00:00')

## 🔜 향후 개선 계획

- [ ] 일정 변경 이력 추적
- [ ] 일정 알림 시스템 (이메일/SMS)
- [ ] 강사 선호 시간대 관리
- [ ] AI 기반 최적 일정 추천
- [ ] 교육생별 맞춤 시간표 생성
- [ ] 엑셀 일괄 업로드/다운로드
- [ ] 캘린더 외부 동기화 (Google Calendar, Outlook)

## 📚 관련 파일

- `/src/services/schedule-validator.service.ts` - 충돌 감지 및 검증
- `/src/services/curriculum-generator.service.ts` - 자동 커리큘럼 생성
- `/src/services/schedule.service.ts` - 기존 일정 서비스 (검증 통합)
- `/src/components/schedule/IntegratedScheduleManager.tsx` - 통합 일정 관리 UI
- `/src/components/schedule/CurriculumManager.tsx` - 커리큘럼 관리 UI

## 🤝 기여

개선 사항이나 버그 발견 시 이슈 등록 또는 PR 제출 환영합니다.
