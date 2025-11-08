-- course_sessions 테이블 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_sessions'
ORDER BY ordinal_position;

-- course_enrollments 테이블 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_enrollments'
ORDER BY ordinal_position;

-- users 테이블 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
