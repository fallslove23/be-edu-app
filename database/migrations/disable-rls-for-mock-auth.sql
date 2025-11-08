-- RLS 비활성화 스크립트 (Mock Auth 사용)
-- Mock Authentication 시스템을 사용하므로 RLS를 비활성화합니다.

-- 1. 기존 정책 삭제 및 RLS 비활성화
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 모든 테이블의 RLS 비활성화
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS for table: %', r.tablename;
    END LOOP;

    -- 모든 정책 삭제
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- 2. 주요 테이블 확인 및 RLS 비활성화
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instructor_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instructor_subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.round_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trainees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personal_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.curriculum_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.curriculum_template_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instructor_teaching_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instructor_payment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scheduled_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;

-- 3. 확인 쿼리
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. 남아있는 정책 확인 (없어야 함)
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
