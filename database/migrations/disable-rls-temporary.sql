-- ========================================
-- 임시 해결책: RLS 비활성화
-- ========================================
-- 주의: 개발 환경에서만 사용!
-- 프로덕션에서는 절대 사용하지 마세요!

-- 모든 테이블에서 RLS 비활성화
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainees DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'courses',
    'exams',
    'course_sessions',
    'class_divisions',
    'question_banks',
    'questions',
    'exam_questions',
    'course_templates',
    'users',
    'course_enrollments',
    'course_curriculum',
    'course_schedules',
    'trainees'
)
ORDER BY tablename;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️  RLS 비활성화 완료 (개발 환경 전용)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '모든 테이블에서 RLS가 비활성화되었습니다.';
    RAISE NOTICE '이제 anon 키로 모든 데이터에 접근할 수 있습니다.';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  주의사항:';
    RAISE NOTICE '  - 개발 환경에서만 사용하세요';
    RAISE NOTICE '  - 프로덕션 배포 전에 RLS를 다시 활성화하세요';
    RAISE NOTICE '========================================';
END $$;
