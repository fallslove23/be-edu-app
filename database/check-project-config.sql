-- ========================================
-- Supabase 프로젝트 설정 확인
-- ========================================

-- 1. exams 테이블 데이터 확인
SELECT COUNT(*) as exam_count FROM public.exams;

-- 2. courses 테이블 데이터 확인
SELECT COUNT(*) as course_count FROM public.courses;

-- 3. RLS 상태 확인
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('courses', 'exams')
ORDER BY tablename;

-- 4. API 설정에서 확인할 것들
-- Supabase Dashboard > Settings > API에서 확인:
-- - Project URL이 맞는지
-- - anon/public 키가 유효한지
-- - JWT Secret이 변경되지 않았는지
