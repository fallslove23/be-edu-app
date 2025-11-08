-- 강제로 PostgREST 캐시 새로고침
-- 여러 방법을 시도합니다

-- 방법 1: NOTIFY로 schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 방법 2: pg_notify 함수 사용
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 확인: exams 테이블의 외래 키 관계
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'exams';

-- 확인: course_sessions 테이블이 존재하는지 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'course_sessions'
) AS course_sessions_exists;

-- 확인: course_rounds 테이블이 존재하는지 확인
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'course_rounds'
) AS course_rounds_exists;
