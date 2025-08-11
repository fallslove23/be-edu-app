-- STEP 2: RLS 비활성화
-- Supabase SQL Editor에서 실행

-- RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('courses', 'course_enrollments', 'course_curriculum', 'course_schedules', 'course_attendance', 'users');

-- RLS 비활성화
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 결과 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('courses', 'course_enrollments', 'course_curriculum', 'course_schedules', 'course_attendance', 'users');