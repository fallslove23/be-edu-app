# Exam 테이블 스키마 수정 가이드

## 문제 상황

```
Error: Could not find a relationship between 'exams' and 'course_sessions' in the schema cache
```

브라우저 콘솔에서 위 오류가 발생하는 이유:
- 데이터베이스의 `exams` 테이블이 아직 `session_id` 컬럼으로 `course_sessions` 테이블을 참조하고 있음
- 하지만 코드는 `round_id` 컬럼으로 `course_rounds` 테이블을 참조하도록 변경됨
- 스키마 불일치로 인한 오류 발생

## 해결 방법

### Option 1: Supabase Dashboard에서 직접 실행 (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New Query" 버튼 클릭

3. **마이그레이션 스크립트 실행**
   - 아래 파일의 내용을 복사하여 붙여넣기:
   ```
   database/migrations/fix-exams-table-schema.sql
   ```
   - "Run" 버튼 클릭하여 실행

4. **결과 확인**
   - 스크립트가 성공적으로 실행되면:
     - `session_id` 컬럼 삭제됨
     - `division_id` 컬럼 삭제됨
     - `round_id` 컬럼 추가됨 (course_rounds 참조)
   - 마지막 SELECT 쿼리 결과에서 `round_id` 컬럼만 있고 `session_id`, `division_id`는 없어야 함

### Option 2: psql 커맨드라인 사용

```bash
# DATABASE_URL 환경변수 설정 필요
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# 마이그레이션 실행
psql "$DATABASE_URL" -f database/migrations/fix-exams-table-schema.sql
```

### Option 3: 새로운 테이블 생성 (데이터가 없는 경우)

기존 `exams` 테이블에 데이터가 없다면, 테이블을 삭제하고 재생성하는 것이 더 간단합니다:

```sql
-- 1. 기존 테이블 삭제 (데이터도 함께 삭제됨!)
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS question_responses CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS question_banks CASCADE;

-- 2. 새 테이블 생성
-- database/migrations/create-simple-exam-tables.sql 파일 실행
```

## 마이그레이션 후 확인사항

### 1. 스키마 확인

Supabase Dashboard → Table Editor → exams 테이블 선택
- `round_id` 컬럼 존재 확인 (type: uuid, foreign key: course_rounds.id)
- `session_id` 컬럼 **없음** 확인
- `division_id` 컬럼 **없음** 확인

### 2. 애플리케이션 테스트

1. 브라우저 새로고침 (F5)
2. 시험 관리 페이지 이동
3. 콘솔 확인 (F12 → Console):
   - 이전 오류 사라짐
   - `[ExamService] ✅ 시험 목록 조회 성공: 0 개` 메시지 표시

## 마이그레이션 스크립트 상세 설명

### 주요 작업

1. **round_id 컬럼 추가**
   ```sql
   ALTER TABLE exams ADD COLUMN round_id UUID REFERENCES course_rounds(id);
   ```

2. **session_id 백업** (기존 데이터 보존)
   ```sql
   ALTER TABLE exams ADD COLUMN old_session_id UUID;
   UPDATE exams SET old_session_id = session_id WHERE session_id IS NOT NULL;
   ```

3. **외래 키 제약조건 제거**
   ```sql
   ALTER TABLE exams DROP CONSTRAINT [constraint_name];
   ```

4. **session_id, division_id 컬럼 제거**
   ```sql
   ALTER TABLE exams DROP COLUMN session_id;
   ALTER TABLE exams DROP COLUMN division_id;
   ```

5. **인덱스 생성** (성능 최적화)
   ```sql
   CREATE INDEX idx_exams_round_id ON exams(round_id);
   CREATE INDEX idx_exams_exam_type ON exams(exam_type);
   CREATE INDEX idx_exams_status ON exams(status);
   CREATE INDEX idx_exams_scheduled_at ON exams(scheduled_at);
   ```

### 안전 기능

- `IF EXISTS` / `IF NOT EXISTS`: 이미 변경된 스키마에 다시 실행해도 오류 없음
- `DO $$ ... END $$`: 조건부 실행으로 안전성 보장
- 기존 데이터 백업: `old_session_id` 컬럼에 원본 데이터 보존

## 데이터 마이그레이션 (필요한 경우)

기존에 `exams` 테이블에 데이터가 있고, `session_id`를 `round_id`로 매핑해야 하는 경우:

```sql
-- session_id가 실제로 course_rounds의 ID를 참조하고 있었다면
UPDATE exams
SET round_id = old_session_id
WHERE old_session_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM course_rounds WHERE id = old_session_id);

-- 백업 컬럼 제거
ALTER TABLE exams DROP COLUMN IF EXISTS old_session_id;
```

## 문제 해결

### 오류: "relation exams does not exist"

exams 테이블이 아직 생성되지 않았습니다:
```sql
-- database/migrations/create-simple-exam-tables.sql 실행
```

### 오류: "foreign key violation"

course_rounds 테이블에 해당 ID가 없습니다:
```sql
-- course_rounds에 데이터 먼저 추가
-- 또는 round_id를 NULL로 설정
UPDATE exams SET round_id = NULL WHERE round_id NOT IN (SELECT id FROM course_rounds);
```

### 오류: "permission denied"

Supabase RLS(Row Level Security) 정책 확인:
```sql
-- RLS 일시 비활성화 (개발 환경)
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;

-- 또는 적절한 정책 추가
CREATE POLICY "Enable all for authenticated users" ON exams
  FOR ALL TO authenticated USING (true);
```

## 완료 후 상태

### 최종 스키마
```
exams 테이블:
- id (uuid, primary key)
- round_id (uuid, foreign key → course_rounds.id)  ✅ 새로 추가
- title (text)
- description (text)
- exam_type (exam_type enum)
- duration_minutes (integer)
- passing_score (integer)
- max_attempts (integer)
- randomize_questions (boolean)
- show_correct_answers (boolean)
- scheduled_at (timestamptz)
- available_until (timestamptz)
- status (exam_status enum)
- created_by (uuid)
- created_at (timestamptz)
- updated_at (timestamptz)

❌ 제거된 컬럼:
- session_id
- division_id
```

### 데이터 흐름
```
CourseTemplate → CourseRound → Exam → ExamAttempt
     (템플릿)      (차수)      (시험)    (응시)
```

## 추가 정보

- [database/README-EXAM-FIX.md](./README-EXAM-FIX.md) - 전체 시험 시스템 수정 내역
- [database/migrations/create-simple-exam-tables.sql](./migrations/create-simple-exam-tables.sql) - 시험 테이블 초기 생성 스크립트
