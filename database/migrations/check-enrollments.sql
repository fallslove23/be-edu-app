-- course_enrollments 테이블 컬럼만 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_enrollments'
ORDER BY ordinal_position;
