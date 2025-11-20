-- =====================================================
-- RLS(Row Level Security) 상태 확인
-- =====================================================

-- 1. 모든 테이블의 RLS 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '🔒 RLS 활성화'
    ELSE '🔓 RLS 비활성화'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'instructors',
    'instructor_certifications',
    'instructor_teaching_subjects',
    'courses',
    'course_enrollments',
    'course_schedules',
    'course_attendance'
  )
ORDER BY tablename;

-- 2. RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. 권장사항 출력
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  📋 RLS 상태 점검 완료                                    ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 권장사항:';
  RAISE NOTICE '   1. Mock 인증 환경에서는 RLS를 비활성화하는 것이 좋습니다';
  RAISE NOTICE '   2. 프로덕션 환경에서는 반드시 RLS를 활성화해야 합니다';
  RAISE NOTICE '   3. 현재 환경에 맞는 RLS 정책을 설정하세요';
  RAISE NOTICE '';
END $$;
