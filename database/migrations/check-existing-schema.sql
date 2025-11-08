-- ============================================
-- 현재 데이터베이스 스키마 확인
-- ============================================

-- 1. 모든 테이블 목록 확인
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. course_templates 테이블 컬럼 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'course_templates'
ORDER BY ordinal_position;

-- 3. course_sessions 테이블 컬럼 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'course_sessions'
ORDER BY ordinal_position;

-- 4. course_enrollments 테이블 컬럼 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'course_enrollments'
ORDER BY ordinal_position;

-- 5. users 테이블 컬럼 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 6. exams 테이블 컬럼 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exams'
ORDER BY ordinal_position;
