# 강사료 계산 시스템 설치 및 사용 가이드

강사 강의 시간 집계 및 강사료 자동 계산 시스템입니다.

## 📋 기능 개요

### 1. 강의 시간 집계
- **이론/실기 구분**: 각 세션을 '이론(lecture)' 또는 '실기(practice)'로 분류
- **주강사/보조강사 구분**: 세션별로 주강사와 보조강사를 별도 관리
- **실제 강의 시간 기록**: 계획된 시간 외에 실제 강의 시간 입력 가능
- **자동 집계**: 과정별로 강사의 총 강의 시간 자동 계산

### 2. 강사료 계산
- **주강사**: 10,000원/시간
- **보조강사**: 5,000원/시간
- **자동 계산**: 총 강의 시간 × 시간당 단가
- **이론/실기 분리 집계**: 이론 시간과 실기 시간을 별도로 관리

### 3. 강사료 관리
- **확정 프로세스**: 관리자가 강사료 집계를 확정
- **지급 이력**: 실제 지급 내역 기록 및 관리
- **지급 상태**: 대기(pending), 완료(completed), 취소(cancelled)

## 🛠️ 데이터베이스 설정

### 1. 마이그레이션 실행

**중요**: Mock Auth를 사용하므로 RLS가 비활성화된 버전을 사용해야 합니다.

```bash
# Supabase SQL 에디터에서 다음 파일 실행
database/migrations/create-instructor-payment-system.sql
```

### 2. 생성되는 스키마

#### A. course_sessions 테이블 확장
기존 `course_sessions` 테이블에 다음 컬럼이 추가됩니다:

```sql
-- 세션 유형 및 강사 정보
session_category VARCHAR(20) DEFAULT 'lecture'  -- 'lecture' (이론) 또는 'practice' (실기)
primary_instructor_id UUID                       -- 주강사 (10,000원/시간)
assistant_instructor_id UUID                     -- 보조강사 (5,000원/시간)
actual_duration_hours DECIMAL(4, 2)            -- 실제 강의 시간

-- 강사료 확정 정보
is_payment_confirmed BOOLEAN DEFAULT false      -- 강사료 지급 확정 여부
payment_confirmed_at TIMESTAMP                  -- 강사료 확정 시간
payment_confirmed_by UUID                        -- 확정한 관리자
```

#### B. instructor_teaching_summary (강사 강의 집계 테이블)
강사별, 과정별 강의 시간 및 강사료 집계:

```sql
CREATE TABLE instructor_teaching_summary (
  id UUID PRIMARY KEY,
  instructor_id UUID,                    -- 강사 ID
  course_round_id UUID,                  -- 과정 ID
  instructor_type VARCHAR(20),           -- 'primary' (주강사) 또는 'assistant' (보조강사)

  -- 시간 집계
  total_lecture_hours DECIMAL(10, 2),   -- 이론 시간
  total_practice_hours DECIMAL(10, 2),  -- 실기 시간
  total_hours DECIMAL(10, 2),           -- 총 시간
  session_count INTEGER,                 -- 총 세션 수

  -- 강사료 계산
  hourly_rate DECIMAL(10, 2),           -- 시간당 강사료
  total_payment DECIMAL(12, 2),         -- 총 강사료

  -- 상태
  is_finalized BOOLEAN,                 -- 집계 확정 여부
  finalized_at TIMESTAMP,               -- 확정 시간
  finalized_by UUID,                    -- 확정한 관리자

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### C. instructor_payment_history (강사료 지급 이력)
실제 강사료 지급 내역:

```sql
CREATE TABLE instructor_payment_history (
  id UUID PRIMARY KEY,
  instructor_id UUID,
  course_round_id UUID,
  summary_id UUID,                       -- 집계 테이블 참조

  -- 지급 정보
  payment_amount DECIMAL(12, 2),        -- 지급 금액
  payment_date DATE,                     -- 지급일
  payment_method VARCHAR(50),           -- 지급 방법 (계좌이체, 현금 등)
  payment_status VARCHAR(20),           -- 'pending', 'completed', 'cancelled'

  -- 세부 내역
  lecture_hours DECIMAL(10, 2),         -- 이론 시간
  practice_hours DECIMAL(10, 2),        -- 실기 시간
  total_hours DECIMAL(10, 2),           -- 총 시간
  hourly_rate DECIMAL(10, 2),           -- 시간당 단가

  notes TEXT,                            -- 비고
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. 제공되는 함수

#### A. calculate_instructor_hours()
특정 강사의 강의 시간 집계:

```sql
SELECT * FROM calculate_instructor_hours(
  'course-round-id',  -- 과정 ID
  'instructor-id',    -- 강사 ID
  'primary'           -- 'primary' 또는 'assistant'
);

-- 결과:
-- lecture_hours: 이론 시간
-- practice_hours: 실기 시간
-- total_hours: 총 시간
-- session_count: 세션 수
```

#### B. calculate_instructor_payment()
강사료 계산:

```sql
SELECT calculate_instructor_payment(
  20.5,      -- 총 시간
  'primary'  -- 'primary' (10,000원) 또는 'assistant' (5,000원)
);

-- 결과: 205000 (20.5시간 × 10,000원)
```

#### C. update_instructor_summaries()
과정의 모든 강사 집계 업데이트:

```sql
SELECT update_instructor_summaries('course-round-id');

-- 결과: 업데이트된 강사 수
```

## 💻 코드 사용법

### 1. 서비스 레이어 (instructor-payment.service.ts)

```typescript
import { instructorPaymentService } from '@/services/instructor-payment.service';

// 1. 강사 집계 업데이트
const count = await instructorPaymentService.updateInstructorSummaries(courseRoundId);
console.log(`${count}명의 강사 집계가 업데이트되었습니다.`);

// 2. 강사 집계 조회
const summaries = await instructorPaymentService.getInstructorSummaries(
  courseRoundId,
  instructorId // 선택: 특정 강사만 조회
);

// 3. 강의 시간 계산
const hours = await instructorPaymentService.calculateInstructorHours(
  courseRoundId,
  instructorId,
  'primary' // 또는 'assistant'
);
console.log('이론:', hours.lecture_hours);
console.log('실기:', hours.practice_hours);
console.log('총 시간:', hours.total_hours);

// 4. 강사료 확정
await instructorPaymentService.finalizeSummary(summaryId, adminUserId);

// 5. 지급 이력 생성
await instructorPaymentService.createPaymentRecord({
  instructor_id: instructorId,
  course_round_id: courseRoundId,
  summary_id: summaryId,
  payment_amount: 205000,
  payment_date: '2025-01-20',
  payment_method: '계좌이체',
  payment_status: 'completed',
  lecture_hours: 15.5,
  practice_hours: 5.0,
  total_hours: 20.5,
  hourly_rate: 10000,
  notes: '1월 강사료',
  created_by: adminUserId
});

// 6. 지급 이력 조회
const history = await instructorPaymentService.getPaymentHistory(
  instructorId,     // 선택: 특정 강사
  courseRoundId     // 선택: 특정 과정
);
```

### 2. UI 컴포넌트 (InstructorPaymentManagement.tsx)

관리자 메뉴에 추가:

```typescript
import InstructorPaymentManagement from '@/components/admin/InstructorPaymentManagement';

// App.tsx 또는 라우팅 설정에서
case 'instructor-payment':
  return <InstructorPaymentManagement />;
```

## 🎯 사용 워크플로우

### 1. 세션 생성 시
```typescript
// 커리큘럼 매니저에서 세션 생성 시 추가 필드 입력
const session = {
  // 기존 필드들...
  session_category: 'lecture',           // 'lecture' 또는 'practice'
  primary_instructor_id: 'instructor-1',
  assistant_instructor_id: 'instructor-2', // 선택
  actual_duration_hours: 2.5              // 실제 강의 시간 (선택)
};
```

### 2. 강사료 집계
```typescript
// 과정 종료 후 또는 정기적으로
const updatedCount = await instructorPaymentService.updateInstructorSummaries(
  courseRoundId
);

// 집계 결과 조회
const summaries = await instructorPaymentService.getInstructorSummaries(courseRoundId);

summaries.forEach(summary => {
  console.log('강사:', summary.instructor_id);
  console.log('유형:', summary.instructor_type); // 'primary' 또는 'assistant'
  console.log('이론:', summary.total_lecture_hours, '시간');
  console.log('실기:', summary.total_practice_hours, '시간');
  console.log('총 강의 시간:', summary.total_hours, '시간');
  console.log('시간당 단가:', summary.hourly_rate, '원');
  console.log('총 강사료:', summary.total_payment, '원');
  console.log('확정 여부:', summary.is_finalized);
});
```

### 3. 강사료 확정
```typescript
// 집계 확인 후 확정
await instructorPaymentService.finalizeSummary(summaryId, adminUserId);

// 확정 취소 (필요시)
await instructorPaymentService.unfinalizeSummary(summaryId);
```

### 4. 지급 이력 기록
```typescript
// 실제 지급 후 이력 기록
const payment = await instructorPaymentService.createPaymentRecord({
  instructor_id: instructorId,
  course_round_id: courseRoundId,
  summary_id: summaryId,
  payment_amount: 205000,
  payment_date: '2025-01-20',
  payment_method: '계좌이체',
  payment_status: 'completed',
  notes: '2025년 1월 강사료'
});

// 지급 상태 업데이트
await instructorPaymentService.updatePaymentStatus(
  payment.id,
  'completed'
);
```

### 5. 강사별 총 지급액 조회
```typescript
// 특정 기간 강사의 총 지급액
const totalPayment = await instructorPaymentService.getInstructorTotalPayment(
  instructorId,
  '2025-01-01', // 시작일
  '2025-12-31'  // 종료일
);

console.log(`총 지급액: ${totalPayment.toLocaleString()}원`);
```

## 🎨 UI 기능

### 강사 집계 탭
- 과정 선택 드롭다운
- 집계 업데이트 버튼
- 강사별 집계 테이블:
  - 강사명, 구분 (주강사/보조강사)
  - 이론 시간, 실기 시간, 총 시간
  - 세션 수
  - 시간당 단가, 총 강사료
  - 확정 상태
  - 확정/취소 버튼
  - 지급 등록 버튼 (확정된 경우)

### 지급 이력 탭
- 지급일, 강사명
- 시간 내역 (이론/실기/총)
- 시간당 단가, 지급 금액
- 지급 방법, 상태
- 비고

### 지급 등록 모달
- 지급일 입력
- 지급 방법 선택 (계좌이체, 현금, 기타)
- 지급 금액 (자동 계산)
- 비고 입력

## 📊 데이터 흐름

```
1. 세션 생성/수정
   ↓
   session_category (lecture/practice)
   primary_instructor_id
   assistant_instructor_id
   actual_duration_hours

2. 집계 업데이트 (update_instructor_summaries)
   ↓
   course_sessions 테이블에서 completed 세션만 집계
   ↓
   instructor_teaching_summary 테이블 생성/업데이트
   - 이론/실기 시간 별도 집계
   - 강사료 자동 계산

3. 관리자 확정 (finalizeSummary)
   ↓
   is_finalized = true
   finalized_at = 현재 시간
   finalized_by = 관리자 ID

4. 지급 등록 (createPaymentRecord)
   ↓
   instructor_payment_history 테이블에 기록
   payment_status = 'completed'
```

## 🔍 문제 해결

### 집계가 업데이트되지 않는 경우
1. **세션 상태 확인**:
```sql
SELECT id, title, status, session_category, primary_instructor_id, assistant_instructor_id
FROM course_sessions
WHERE round_id = 'course-round-id';
```
- 집계는 `status = 'completed'`인 세션만 포함됩니다

2. **함수 실행 확인**:
```sql
SELECT update_instructor_summaries('course-round-id');
```

3. **집계 결과 확인**:
```sql
SELECT *
FROM instructor_teaching_summary
WHERE course_round_id = 'course-round-id';
```

### 강사료가 잘못 계산되는 경우
1. **시간당 단가 확인**:
   - 주강사(primary): 10,000원
   - 보조강사(assistant): 5,000원

2. **강의 시간 확인**:
```sql
SELECT
  session_category,
  COALESCE(actual_duration_hours, EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600) as hours
FROM course_sessions
WHERE round_id = 'course-round-id'
  AND primary_instructor_id = 'instructor-id';
```

### 확정이 안 되는 경우
- `is_finalized = false`인 집계만 확정 가능
- 관리자 권한 필요

## 🚀 향후 개선 사항

1. **강사 정보 확장**: 강사 프로필, 전문 분야, 평가
2. **알림 통합**: 강사료 확정 시 강사에게 알림
3. **엑셀 내보내기**: 집계 및 지급 이력 엑셀 다운로드
4. **통계 대시보드**: 강사별/기간별 통계 시각화
5. **자동 정산**: 월말 자동 집계 및 정산 프로세스
6. **세금 계산**: 원천징수세 자동 계산

## 📞 지원

문의사항이나 버그 리포트는 프로젝트 이슈 트래커에 등록해주세요.
