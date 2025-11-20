# 데이터베이스 마이그레이션 가이드

Phase 2 커리큘럼-자원 통합 기능을 위한 데이터베이스 마이그레이션입니다.

## 마이그레이션 실행 방법

### 방법 1: Supabase Studio 사용 (권장)

1. **Supabase Dashboard 접속**
   - URL: https://supabase.com/dashboard
   - 프로젝트 선택: `sdecinmapanpmohbtdbi`

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭

3. **마이그레이션 파일 실행**

   **Step 1: 마이그레이션 추적 테이블 생성**
   - `database/migrations/000_schema_migrations_table.sql` 파일 내용을 복사하여 실행

   **Step 2: 자원 통합 마이그레이션 실행**
   - `database/migrations/006_resource_integration.sql` 파일 내용을 복사하여 실행

4. **실행 확인**
   - 성공 메시지 확인: "✅ Phase 2 마이그레이션 완료"

### 방법 2: psql CLI 사용

DATABASE_URL이 있는 경우 터미널에서 실행:

```bash
# .env.local에 DATABASE_URL 추가
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.sdecinmapanpmohbtdbi.supabase.co:5432/postgres"

# 마이그레이션 스크립트 실행
bash database/run-migration.sh
```

## 마이그레이션 내용

### 1. course_sessions 테이블 강화
- `subject_id`: 과목 참조 (UUID)
- `classroom_id`: 강의실 UUID 참조
- `resource_status`: 자원 배정 상태
- `conflict_notes`: 충돌 메모

### 2. resource_bookings 테이블 생성
- 자원 예약 로그 및 이력 관리
- 중복 예약 방지 제약조건
- 자동 예약 생성/취소 트리거

### 3. 충돌 감지 함수
```sql
detect_resource_conflicts(
  p_session_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_instructor_id UUID,
  p_classroom_id UUID,
  p_exclude_session_id UUID
)
```

### 4. 자원 활용도 통계 뷰
- `resource_utilization_stats`: 강사/강의실별 활용 통계

### 5. 자동화 트리거
- 세션 생성/수정 시 자동 예약 생성
- 세션 삭제 시 자동 예약 취소

## 롤백 (필요시)

마이그레이션을 되돌리려면:

```sql
-- resource_bookings 테이블 삭제
DROP TABLE IF EXISTS resource_bookings CASCADE;

-- course_sessions 컬럼 제거
ALTER TABLE course_sessions
DROP COLUMN IF EXISTS subject_id,
DROP COLUMN IF EXISTS classroom_id,
DROP COLUMN IF EXISTS resource_status,
DROP COLUMN IF EXISTS conflict_notes;

-- 뷰 삭제
DROP VIEW IF EXISTS resource_utilization_stats;

-- 함수 삭제
DROP FUNCTION IF EXISTS detect_resource_conflicts;
DROP FUNCTION IF EXISTS auto_create_resource_bookings;
DROP FUNCTION IF EXISTS cancel_resource_bookings_on_delete;

-- 마이그레이션 기록 삭제
DELETE FROM schema_migrations WHERE version = '006';
```

## 확인 방법

마이그레이션 성공 여부 확인:

```sql
-- 1. 마이그레이션 이력 확인
SELECT * FROM schema_migrations ORDER BY executed_at DESC;

-- 2. 새 테이블 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'resource_bookings';

-- 3. 새 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'course_sessions'
  AND column_name IN ('subject_id', 'classroom_id', 'resource_status');

-- 4. 함수 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%resource%';
```

## 문제 해결

### 오류: relation "schema_migrations" does not exist
→ 먼저 `000_schema_migrations_table.sql`을 실행하세요.

### 오류: column already exists
→ 이미 마이그레이션이 실행되었습니다. 확인 쿼리로 상태를 체크하세요.

### 오류: permission denied
→ 데이터베이스 관리자 권한이 필요합니다. Supabase Studio에서 실행하세요.

## 추가 정보

- 마이그레이션 버전: 006
- 작성일: 2025년
- Phase: 2 (커리큘럼-자원 통합)
- 의존성: Phase 1 완료 필요
