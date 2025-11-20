-- =====================================================
-- 모든 테이블의 RLS 비활성화 (개발 환경용)
-- ⚠️ 주의: 프로덕션 환경에서는 사용하지 마세요!
-- =====================================================

-- 1. 기존 RLS 정책 모두 삭제
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE '✓ 정책 삭제: %.% - %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- 2. 모든 테이블의 RLS 비활성화
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = true
  ) LOOP
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY',
      r.schemaname, r.tablename);
    RAISE NOTICE '✓ RLS 비활성화: %.%', r.schemaname, r.tablename;
  END LOOP;
END $$;

-- 3. 확인
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '❌ RLS 여전히 활성화됨'
    ELSE '✅ RLS 비활성화됨'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ 모든 RLS 비활성화 완료                                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  주의사항:';
  RAISE NOTICE '   - 개발 환경에서만 사용하세요';
  RAISE NOTICE '   - 프로덕션 배포 전 RLS를 다시 활성화하세요';
  RAISE NOTICE '   - Supabase anon key로 모든 데이터 접근 가능';
  RAISE NOTICE '';
END $$;
