-- course_enrollments 테이블의 제약조건 확인
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.course_enrollments'::regclass
ORDER BY contype, conname;
