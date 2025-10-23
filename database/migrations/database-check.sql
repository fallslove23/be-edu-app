-- 과정 관리 테이블 존재 확인

-- 1. 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('courses', 'course_enrollments', 'course_curriculum', 'course_schedules', 'course_attendance');

-- 2. courses 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'courses'
ORDER BY ordinal_position;

-- 3. course_enrollments 테이블 구조 확인  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_enrollments'
ORDER BY ordinal_position;

-- 4. 현재 데이터 개수 확인
SELECT 
  (SELECT COUNT(*) FROM public.courses) as courses_count,
  (SELECT COUNT(*) FROM public.course_enrollments) as enrollments_count,
  (SELECT COUNT(*) FROM public.course_curriculum) as curriculum_count,
  (SELECT COUNT(*) FROM public.course_schedules) as schedules_count,
  (SELECT COUNT(*) FROM public.course_attendance) as attendance_count;

-- 5. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('courses', 'course_enrollments', 'course_curriculum', 'course_schedules', 'course_attendance');