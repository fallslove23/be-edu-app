# 자원-일정 통합 마이그레이션 가이드

## 📋 개요

자원 관리(강의실, 강사)와 일정 관리 시스템을 통합하는 마이그레이션입니다.

### 주요 변경사항

1. **강의실 테이블 통합**
   - Resource 관리의 `classrooms` 테이블을 일정 관리에서도 사용
   - 중복 제거 및 일관성 확보

2. **강사 프로필 시스템**
   - `instructor_profiles` 테이블 추가
   - 전문분야, 자격증, 계약 정보, 평가 등 관리

3. **일정 유연성 향상**
   - `schedules.course_round_id` NULL 허용
   - 과정과 무관한 독립 일정 생성 가능

---

## 🚀 실행 순서

### 1단계: 선행 마이그레이션 확인

다음 파일들이 **먼저 실행**되어 있어야 합니다:

```bash
# 1. 자원 관리 테이블 (강의실, 카테고리)
database/migrations/create-resource-management-tables.sql

# 2. 일정 관리 테이블 (schedules, personal_events)
database/migrations/create-schedule-tables-only.sql
```

### 2단계: 통합 마이그레이션 실행

Supabase SQL Editor에서 실행:

```sql
-- 파일 내용 복사 후 실행
database/migrations/integrate-resource-schedule-tables.sql
```

### 3단계: 결과 확인

실행 후 다음 메시지가 표시되어야 합니다:

```
✅ 자원-일정 통합 마이그레이션 완료!
========================================
생성/수정된 항목:
  ✓ instructor_profiles 테이블 생성
  ✓ classrooms 테이블 통합 (컬럼 추가)
  ✓ schedules.course_round_id NULL 허용
  ✓ RLS 정책 설정
```

---

## 📊 생성되는 테이블

### `instructor_profiles` (강사 프로필)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | Primary Key |
| user_id | UUID | users 테이블 참조 (UNIQUE) |
| specializations | TEXT[] | 전문 분야 배열 |
| certifications | JSONB | 자격증 정보 |
| contract_type | TEXT | 계약 유형 (full-time, part-time, freelance) |
| hourly_rate | NUMERIC | 시급 |
| max_hours_per_week | INTEGER | 주당 최대 근무시간 |
| bio | TEXT | 자기소개 |
| profile_photo_url | TEXT | 프로필 사진 URL |
| rating | NUMERIC(3,2) | 평점 (0.00~5.00) |
| total_sessions | INTEGER | 총 강의 횟수 |
| is_active | BOOLEAN | 활성 상태 |

**샘플 데이터:**
```json
{
  "specializations": ["BS 영업", "리더십"],
  "certifications": [
    {
      "name": "BS 전문강사 자격증",
      "issued_by": "BS협회",
      "date": "2024-01-01"
    }
  ],
  "contract_type": "full-time",
  "hourly_rate": 50000.00,
  "rating": 4.8
}
```

---

## 🔗 테이블 관계도

```
┌─────────────────────┐
│      users          │
│  (role=instructor)  │
└──────┬──────────────┘
       │ 1:1
       ↓
┌─────────────────────┐
│ instructor_profiles │ ← 새로 생성
│  - specializations  │
│  - certifications   │
│  - hourly_rate      │
└─────────────────────┘

┌─────────────────────┐
│    categories       │
└─────────────────────┘

┌─────────────────────┐
│    classrooms       │ ← 통합 (기존 resource 테이블 사용)
│  - code             │
│  - facilities       │
│  - equipment        │
└──────┬──────────────┘
       │
       │ N:1
       ↓
┌─────────────────────┐
│     schedules       │
│  - course_round_id  │ ← NULL 허용으로 변경
│  - classroom_id     │
│  - instructor_id    │
│  - subject          │
└─────────────────────┘
```

---

## ✅ 검증 방법

### 1. 강사 프로필 확인

```sql
SELECT
  u.name as instructor_name,
  u.email,
  ip.specializations,
  ip.contract_type,
  ip.hourly_rate,
  ip.rating,
  ip.total_sessions
FROM instructor_profiles ip
JOIN users u ON ip.user_id = u.id
ORDER BY ip.rating DESC;
```

### 2. 강의실 통합 확인

```sql
SELECT
  name,
  code,
  location,
  building,
  floor,
  capacity,
  jsonb_array_length(COALESCE(facilities, '[]'::jsonb)) as facilities_count,
  COALESCE(is_available, is_active) as available
FROM classrooms
ORDER BY capacity DESC;
```

### 3. 일정 테이블 확인

```sql
-- course_round_id가 NULL인 독립 일정도 생성 가능한지 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'schedules'
AND column_name = 'course_round_id';
```

예상 결과: `is_nullable = 'YES'`

---

## 🎯 사용 예시

### 강사 프로필 생성

```sql
INSERT INTO instructor_profiles (
  user_id,
  specializations,
  certifications,
  contract_type,
  hourly_rate,
  bio,
  is_active
)
SELECT
  id,
  ARRAY['BS 영업', '전문가과정'],
  '[{"name": "BS 강사 자격증", "date": "2024-06-15"}]'::jsonb,
  'part-time',
  45000.00,
  '영업 교육 전문 강사입니다.',
  true
FROM users
WHERE email = 'instructor@example.com';
```

### 과정 일정 생성 (과정 회차 연결)

```sql
INSERT INTO schedules (
  course_round_id,
  title,
  subject,
  start_time,
  end_time,
  instructor_id,
  classroom_id,
  status
) VALUES (
  'course-round-uuid',
  'BS 기본과정 1일차',
  '실기평가',
  '2025-01-10 09:00:00',
  '2025-01-10 18:00:00',
  'instructor-uuid',
  'classroom-uuid',
  'scheduled'
);
```

### 독립 일정 생성 (과정 회차 없음)

```sql
INSERT INTO schedules (
  course_round_id,  -- NULL 가능
  title,
  subject,
  start_time,
  end_time,
  instructor_id,
  classroom_id,
  status
) VALUES (
  NULL,  -- 독립 일정
  '특별 세미나',
  '리더십 워크샵',
  '2025-01-15 14:00:00',
  '2025-01-15 17:00:00',
  'instructor-uuid',
  'classroom-uuid',
  'scheduled'
);
```

---

## 🚨 주의사항

### 1. 강의실 테이블 중복 방지

- 이 마이그레이션은 기존 `classrooms` 테이블에 컬럼을 **추가**합니다
- 데이터가 손실되지 않습니다
- Resource 관리의 classrooms를 **단일 소스**로 사용합니다

### 2. 강사 프로필 선택적 생성

- `instructor_profiles`는 필요한 강사에게만 생성
- users.role='instructor'라고 해서 자동 생성되지 않음
- UI에서 수동 생성하거나 관리자가 추가

### 3. 기존 일정 영향 없음

- 기존 schedules 데이터는 그대로 유지
- course_round_id가 NULL이 아닌 기존 일정은 정상 작동

---

## 🔄 롤백 방법

문제 발생 시:

```sql
-- 1. instructor_profiles 테이블 삭제
DROP TABLE IF EXISTS instructor_profiles CASCADE;

-- 2. classrooms 테이블의 추가 컬럼 제거 (선택적)
ALTER TABLE classrooms
  DROP COLUMN IF EXISTS code,
  DROP COLUMN IF EXISTS building,
  DROP COLUMN IF EXISTS floor,
  DROP COLUMN IF EXISTS facilities,
  DROP COLUMN IF EXISTS is_available,
  DROP COLUMN IF EXISTS photo_url,
  DROP COLUMN IF EXISTS created_by;

-- 3. schedules.course_round_id NOT NULL 복원 (선택적)
-- 주의: 기존에 NULL 값이 있으면 실패합니다
ALTER TABLE schedules ALTER COLUMN course_round_id SET NOT NULL;
```

---

## 📝 다음 단계

마이그레이션 완료 후:

1. **UI 수정**
   - [ ] 일정 생성 시 통합 classrooms 사용
   - [ ] 강사 선택 시 프로필 정보 표시
   - [ ] 강사 프로필 관리 페이지 구현

2. **서비스 레이어 수정**
   - [ ] `classroomService` 수정 (통합 테이블 사용)
   - [ ] `instructorProfileService` 생성
   - [ ] 충돌 검사 로직 업데이트

3. **TypeScript 타입 정의**
   - [ ] `InstructorProfile` 타입 추가
   - [ ] `Classroom` 타입 업데이트

---

## 📞 문의

마이그레이션 중 문제가 발생하면:
1. Supabase SQL Editor의 오류 메시지 확인
2. 선행 마이그레이션 실행 여부 확인
3. 테이블 존재 여부 확인: `\dt` 명령어 사용
