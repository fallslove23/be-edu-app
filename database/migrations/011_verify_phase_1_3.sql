/**
 * =================================================
 * Phase 1-3 검증 스크립트
 * =================================================
 * 작성일: 2025-01-24
 * 목적: Phase 1-3 구현 내용 검증
 * =================================================
 */

-- =============================================
-- 1. Materialized Views 확인
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '📊 1. Materialized Views 검증';
  RAISE NOTICE '=================================================';
END $$;

-- 1.1 mv_round_statistics 존재 확인
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_matviews
      WHERE schemaname = 'public' AND matviewname = 'mv_round_statistics'
    ) THEN '✅ mv_round_statistics 존재'
    ELSE '❌ mv_round_statistics 없음'
  END as status;

-- 1.2 mv_trainee_statistics 존재 확인
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_matviews
      WHERE schemaname = 'public' AND matviewname = 'mv_trainee_statistics'
    ) THEN '✅ mv_trainee_statistics 존재'
    ELSE '❌ mv_trainee_statistics 없음'
  END as status;

-- 1.3 통계 데이터 샘플 조회
SELECT
  '차수 통계 레코드 수:' as info,
  COUNT(*)::TEXT as count
FROM mv_round_statistics
UNION ALL
SELECT
  '교육생 통계 레코드 수:',
  COUNT(*)::TEXT
FROM mv_trainee_statistics;

-- =============================================
-- 2. 감사 로그 시스템 확인
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '📝 2. 감사 로그 시스템 검증';
  RAISE NOTICE '=================================================';
END $$;

-- 2.1 audit_logs 테이블 확인
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
    ) THEN '✅ audit_logs 테이블 존재'
    ELSE '❌ audit_logs 테이블 없음'
  END as status;

-- 2.2 감사 트리거 확인
SELECT
  trigger_name,
  event_object_table,
  '✅ 트리거 설정됨' as status
FROM information_schema.triggers
WHERE trigger_name IN ('audit_course_rounds', 'audit_round_enrollments', 'audit_curriculum_items')
ORDER BY event_object_table;

-- 2.3 감사 로그 함수 확인
SELECT
  proname as function_name,
  '✅ 함수 존재' as status
FROM pg_proc
WHERE proname IN ('audit_trigger_func', 'get_audit_history', 'get_recent_audit_logs')
ORDER BY proname;

-- =============================================
-- 3. 데이터 무결성 제약조건 확인 (Phase 2)
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '🔒 3. 데이터 무결성 제약조건 검증';
  RAISE NOTICE '=================================================';
END $$;

-- 3.1 course_rounds 제약조건
SELECT
  constraint_name,
  '✅ 제약조건 존재' as status
FROM information_schema.table_constraints
WHERE table_name = 'course_rounds'
  AND constraint_name LIKE 'check_%'
ORDER BY constraint_name;

-- 3.2 curriculum_items 제약조건
SELECT
  constraint_name,
  '✅ 제약조건 존재' as status
FROM information_schema.table_constraints
WHERE table_name = 'curriculum_items'
  AND constraint_name LIKE 'check_%'
ORDER BY constraint_name;

-- 3.3 round_enrollments 제약조건
SELECT
  constraint_name,
  '✅ 제약조건 존재' as status
FROM information_schema.table_constraints
WHERE table_name = 'round_enrollments'
  AND constraint_name LIKE 'check_%'
ORDER BY constraint_name;

-- =============================================
-- 4. 인덱스 확인
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '⚡ 4. 인덱스 최적화 검증';
  RAISE NOTICE '=================================================';
END $$;

-- 4.1 주요 인덱스 확인
SELECT
  tablename,
  indexname,
  '✅ 인덱스 존재' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_course_rounds_%'
    OR indexname LIKE 'idx_curriculum_items_%'
    OR indexname LIKE 'idx_round_enrollments_%'
    OR indexname LIKE 'idx_audit_logs_%'
    OR indexname LIKE 'idx_mv_%'
  )
ORDER BY tablename, indexname;

-- =============================================
-- 5. 뷰 확인
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '👁️ 5. 뷰 시스템 검증';
  RAISE NOTICE '=================================================';
END $$;

-- 5.1 통합 뷰 확인
SELECT
  table_name as view_name,
  '✅ 뷰 존재' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name LIKE 'course_rounds_%'
    OR table_name LIKE 'curriculum_items_%'
    OR table_name = 'v_performance_metrics'
  )
ORDER BY table_name;

-- =============================================
-- 6. 함수 확인
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '⚙️ 6. 함수 및 프로시저 검증';
  RAISE NOTICE '=================================================';
END $$;

-- 6.1 주요 함수 확인
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  '✅ 함수 존재' as status
FROM pg_proc
WHERE proname IN (
  'refresh_statistics_views',
  'update_round_trainee_count',
  'update_round_status',
  'validate_round_integrity',
  'audit_trigger_func',
  'get_audit_history',
  'get_recent_audit_logs'
)
ORDER BY proname;

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ Phase 1-3 검증 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📌 다음 단계:';
  RAISE NOTICE '1. SELECT refresh_statistics_views(); 실행';
  RAISE NOTICE '2. 애플리케이션에서 새 기능 테스트';
  RAISE NOTICE '3. PHASE_1_3_USAGE_GUIDE.md 참조';
  RAISE NOTICE '=================================================';
END $$;
