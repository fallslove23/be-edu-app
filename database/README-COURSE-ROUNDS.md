# Course Rounds (차수) 관리 시스템 가이드

## 개요
과정 차수 관리 기능을 사용하려면 다음 테이블들이 필요합니다:
- `course_rounds`: 차수 기본 정보
- `course_sessions`: 차수별 세션 (일정)
- `round_enrollments`: 차수별 수강생 등록

## 마이그레이션 순서

### 1. 차수 기본 테이블 생성
```bash
# Supabase SQL Editor에서 실행
psql "$DATABASE_URL" -f database/migrations/create-course-rounds-table-fixed.sql
```

또는 Supabase Dashboard → SQL Editor에서:
```sql
-- database/migrations/create-course-rounds-table-fixed.sql 내용을 복사하여 실행
```

이 스크립트는 다음을 생성합니다:
- ✅ `course_rounds` 테이블 (차수 기본 정보)
- ✅ `course_sessions` 테이블 (차수별 세션)
- ✅ 인덱스 (성능 최적화)
- ✅ RLS (Row Level Security) 정책
- ✅ 제약 조건 (데이터 무결성)

### 2. 수강생 등록 테이블 생성
```bash
# Supabase SQL Editor에서 실행
psql "$DATABASE_URL" -f database/migrations/create-round-enrollments-table.sql
```

이 스크립트는 다음을 생성합니다:
- ✅ `round_enrollments` 테이블 (차수별 수강생 등록)
- ✅ 자동 current_trainees 업데이트 트리거
- ✅ RLS 정책
- ✅ 인덱스

### 3. 샘플 데이터 생성 (선택사항)
```bash
# Supabase SQL Editor에서 실행
psql "$DATABASE_URL" -f database/migrations/insert-sample-course-rounds.sql
```

샘플 데이터:
- BS Basic 1차 (완료) - 18명 등록
- BS Basic 2차 (진행중) - 15명 등록
- BS Basic 3차 (모집중) - 0명 등록
- BS Basic 4차 (기획중) - 0명 등록
- BS Advanced 1차 (진행중) - 12명 등록
- BS Advanced 2차 (모집중) - 0명 등록

## 테이블 구조

### course_rounds (차수)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 차수 ID (PK) |
| template_id | UUID | 과정 템플릿 ID (FK) |
| round_number | INTEGER | 차수 번호 (1차, 2차...) |
| title | TEXT | 차수 제목 |
| instructor_id | UUID | 강사 ID (FK) - 세션별 배정 권장 |
| instructor_name | TEXT | 강사 이름 - "강사 미배정" 기본값 |
| manager_id | UUID | 운영 담당자 ID (FK) |
| manager_name | TEXT | 운영 담당자 이름 |
| start_date | DATE | 시작일 |
| end_date | DATE | 종료일 |
| max_trainees | INTEGER | 최대 수강생 |
| current_trainees | INTEGER | 현재 수강생 (자동 업데이트) |
| location | TEXT | 강의 장소 |
| status | TEXT | 상태 (planning/recruiting/in_progress/completed/cancelled) |
| description | TEXT | 설명 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

### round_enrollments (차수 수강생 등록)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 등록 ID (PK) |
| round_id | UUID | 차수 ID (FK) |
| trainee_id | UUID | 교육생 ID (FK) |
| enrolled_at | TIMESTAMPTZ | 등록일시 |
| status | TEXT | 수강 상태 (active/completed/dropped) |
| completion_date | DATE | 완료일 |
| final_score | INTEGER | 최종 점수 (0-100) |
| notes | TEXT | 비고 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

### course_sessions (세션)
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 세션 ID (PK) |
| round_id | UUID | 차수 ID (FK) |
| template_curriculum_id | UUID | 커리큘럼 ID |
| day_number | INTEGER | 일차 번호 (1일차, 2일차...) |
| title | TEXT | 세션 제목 |
| session_date | DATE | 세션 날짜 |
| scheduled_date | DATE | 예정일 |
| start_time | TIME | 시작 시간 |
| end_time | TIME | 종료 시간 |
| classroom | TEXT | 강의실 |
| actual_instructor_id | UUID | 실제 강사 ID (FK) |
| status | TEXT | 상태 (scheduled/in_progress/completed/cancelled/rescheduled) |
| attendance_count | INTEGER | 출석 인원 |
| notes | TEXT | 비고 |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

## 권한 설정 (RLS)

### course_rounds
- **읽기**: 모든 사용자
- **쓰기**: app_admin, course_manager

### round_enrollments
- **읽기**: 모든 사용자
- **쓰기**: app_admin, course_manager, instructor
- **자동 트리거**: 등록/해제 시 course_rounds.current_trainees 자동 업데이트

### course_sessions
- **읽기**: 모든 사용자
- **쓰기**: app_admin, course_manager, instructor

## 자동 상태 업데이트 기능

시스템은 페이지 로드 시 자동으로 차수 상태를 업데이트합니다:

1. **자동 시작**: `recruiting` → `in_progress`
   - 조건: 시작일이 오늘이거나 지난 경우

2. **자동 완료**: `in_progress` → `completed`
   - 조건: 종료일이 지난 경우

이 기능은 `CourseTemplateService.autoUpdateRoundStatus()` 함수에서 실행됩니다.

## 확인 방법

### 1. 테이블 생성 확인
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('course_rounds', 'course_sessions');
```

### 2. 데이터 확인
```sql
-- 차수 목록
SELECT id, title, status, start_date, end_date, current_trainees, max_trainees
FROM course_rounds
ORDER BY start_date DESC;

-- 세션 목록
SELECT cs.id, cr.title as round_title, cs.day_number, cs.session_date, cs.status
FROM course_sessions cs
JOIN course_rounds cr ON cs.round_id = cr.id
ORDER BY cs.session_date;
```

### 3. RLS 정책 확인
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('course_rounds', 'course_sessions');
```

## 문제 해결

### 404/400 에러 발생
**증상**: `Failed to load resource: the server responded with a status of 404`

**원인**: course_rounds 테이블이 존재하지 않음

**해결**: 위의 "1. 테이블 생성" 단계 실행

### RLS 권한 오류
**증상**: `new row violates row-level security policy`

**원인**: RLS 정책이 올바르게 설정되지 않음

**해결**:
```sql
-- RLS 정책 재생성
DROP POLICY IF EXISTS "course_rounds_read_all" ON course_rounds;
DROP POLICY IF EXISTS "course_rounds_write_admin" ON course_rounds;

-- create-course-rounds-table.sql의 RLS 정책 부분 다시 실행
```

### 외래 키 제약 조건 오류
**증상**: `violates foreign key constraint`

**원인**: 참조하는 테이블이 존재하지 않거나 데이터가 없음

**해결**:
1. course_templates 테이블 먼저 생성
2. users 테이블에 instructor, course_manager 역할 사용자 추가

## 주요 기능

### 차수 상세 페이지 (`/app/courses/rounds/[id]/page.tsx`)
- **탭 기반 네비게이션**: 기본 정보, 수강생, 세션, 시험
- **기본 정보 탭**: 차수 설명 및 주요 정보 표시
- **수강생 탭**: 수강생 등록/해제, 목록 관리
- **세션 탭**: 일정별 세션 관리 (구현 예정)
- **시험 탭**: 차수별 시험 관리 (구현 예정)

### 수강생 관리 기능
- **검색 및 필터**: 이름, 이메일, 사번으로 검색
- **일괄 등록**: 여러 교육생 동시 선택 및 등록
- **정원 관리**: 자동 정원 확인 및 초과 방지
- **등록 해제**: 개별 수강생 등록 해제
- **실시간 업데이트**: current_trainees 자동 업데이트

## 관련 파일

### 프론트엔드
- `src/app/courses/rounds/[id]/page.tsx` - 차수 상세 페이지
- `src/components/courses/BSCourseManagement.tsx` - 차수 목록 및 생성
- `src/components/courses/RoundTraineesTab.tsx` - 수강생 관리 탭

### 서비스 레이어
- `src/services/course-template.service.ts` - 차수 관리 서비스
  - `getRounds()` - 차수 목록 조회
  - `createRound()` - 차수 생성
  - `updateRound()` - 차수 수정
  - `deleteRound()` - 차수 삭제
  - `getRoundEnrollments()` - 차수 수강생 목록
  - `addRoundTrainees()` - 수강생 등록
  - `removeRoundTrainee()` - 수강생 등록 해제
  - `autoUpdateRoundStatus()` - 자동 상태 업데이트

### 타입 정의
- `src/types/course-template.types.ts` - 차수 및 세션 타입

### 데이터베이스
- `database/migrations/create-course-rounds-table-fixed.sql` - 차수 테이블
- `database/migrations/create-round-enrollments-table.sql` - 수강생 등록 테이블
- `database/migrations/insert-sample-course-rounds.sql` - 샘플 데이터
