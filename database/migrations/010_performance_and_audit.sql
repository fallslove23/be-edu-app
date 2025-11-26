/**
 * =================================================
 * Phase 3: 성능 최적화 및 감사 로그
 * =================================================
 * 작성일: 2025-01-24
 * 목적: Materialized View, 캐싱, 감사 로그
 * =================================================
 */

-- =============================================
-- 1. 통계 Materialized View 생성
-- =============================================

-- 1.1 차수별 통계 집계 뷰
DROP MATERIALIZED VIEW IF EXISTS mv_round_statistics CASCADE;
CREATE MATERIALIZED VIEW mv_round_statistics AS
SELECT
  cr.id as round_id,
  cr.round_name,
  cr.round_code,
  cr.template_id,
  cr.status as round_status,
  cr.start_date,
  cr.end_date,

  -- 등록 통계
  cr.max_trainees,
  cr.current_trainees,
  COALESCE(enroll_stats.total_enrolled, 0) as total_enrolled,
  COALESCE(enroll_stats.active_count, 0) as active_count,
  COALESCE(enroll_stats.completed_count, 0) as completed_count,
  COALESCE(enroll_stats.dropped_count, 0) as dropped_count,

  -- 커리큘럼 통계
  COALESCE(curr_stats.total_sessions, 0) as total_sessions,
  COALESCE(curr_stats.completed_sessions, 0) as completed_sessions,
  COALESCE(curr_stats.in_progress_sessions, 0) as in_progress_sessions,
  COALESCE(curr_stats.draft_sessions, 0) as draft_sessions,

  -- 계산된 비율
  CASE
    WHEN cr.max_trainees > 0 THEN
      ROUND((cr.current_trainees::NUMERIC / cr.max_trainees::NUMERIC) * 100, 2)
    ELSE 0
  END as enrollment_rate,

  CASE
    WHEN COALESCE(curr_stats.total_sessions, 0) > 0 THEN
      ROUND((COALESCE(curr_stats.completed_sessions, 0)::NUMERIC / curr_stats.total_sessions::NUMERIC) * 100, 2)
    ELSE 0
  END as session_completion_rate,

  -- 업데이트 시간
  NOW() as last_updated

FROM course_rounds cr

-- 등록 통계
LEFT JOIN (
  SELECT
    round_id,
    COUNT(*) as total_enrolled,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'dropped') as dropped_count
  FROM round_enrollments
  GROUP BY round_id
) enroll_stats ON cr.id = enroll_stats.round_id

-- 커리큘럼 통계
LEFT JOIN (
  SELECT
    round_id,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_sessions,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_sessions
  FROM curriculum_items
  GROUP BY round_id
) curr_stats ON cr.id = curr_stats.round_id

WHERE cr.status != 'cancelled';

-- 인덱스 추가
CREATE UNIQUE INDEX idx_mv_round_statistics_round_id ON mv_round_statistics(round_id);
CREATE INDEX idx_mv_round_statistics_status ON mv_round_statistics(round_status);
CREATE INDEX idx_mv_round_statistics_dates ON mv_round_statistics(start_date, end_date);

COMMENT ON MATERIALIZED VIEW mv_round_statistics IS '차수별 통계 집계 (성능 최적화용)';

-- 1.2 교육생별 통계 집계 뷰
DROP MATERIALIZED VIEW IF EXISTS mv_trainee_statistics CASCADE;
CREATE MATERIALIZED VIEW mv_trainee_statistics AS
SELECT
  u.id as trainee_id,
  u.name,
  u.email,
  u.department,

  -- 등록 과정 통계
  COALESCE(enroll_stats.total_courses, 0) as total_enrolled_courses,
  COALESCE(enroll_stats.active_courses, 0) as active_courses,
  COALESCE(enroll_stats.completed_courses, 0) as completed_courses,
  COALESCE(enroll_stats.dropped_courses, 0) as dropped_courses,

  -- 평균 점수
  COALESCE(enroll_stats.avg_final_score, 0) as average_final_score,

  -- 최근 활동
  enroll_stats.last_enrollment_date,
  enroll_stats.last_completion_date,

  NOW() as last_updated

FROM users u

LEFT JOIN (
  SELECT
    trainee_id,
    COUNT(*) as total_courses,
    COUNT(*) FILTER (WHERE status = 'active') as active_courses,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_courses,
    COUNT(*) FILTER (WHERE status = 'dropped') as dropped_courses,
    ROUND(AVG(final_score) FILTER (WHERE final_score IS NOT NULL), 2) as avg_final_score,
    MAX(enrolled_at) as last_enrollment_date,
    MAX(completion_date) as last_completion_date
  FROM round_enrollments
  GROUP BY trainee_id
) enroll_stats ON u.id = enroll_stats.trainee_id

WHERE u.role = 'trainee';

CREATE UNIQUE INDEX idx_mv_trainee_statistics_trainee_id ON mv_trainee_statistics(trainee_id);
CREATE INDEX idx_mv_trainee_statistics_department ON mv_trainee_statistics(department);

COMMENT ON MATERIALIZED VIEW mv_trainee_statistics IS '교육생별 통계 집계 (성능 최적화용)';

-- =============================================
-- 2. Materialized View 자동 갱신 함수
-- =============================================

-- 2.1 통계 갱신 함수
CREATE OR REPLACE FUNCTION refresh_statistics_views()
RETURNS void AS $$
BEGIN
  -- 차수 통계 갱신
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_round_statistics;
  RAISE NOTICE '✅ mv_round_statistics refreshed';

  -- 교육생 통계 갱신
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trainee_statistics;
  RAISE NOTICE '✅ mv_trainee_statistics refreshed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_statistics_views() IS '통계 뷰 수동 갱신 함수';

-- 2.2 자동 갱신 트리거 (선택적)
-- 주의: 너무 자주 갱신하면 성능 저하 가능성 있음
-- 대신 배치 작업이나 API 호출 시 수동 갱신 권장

-- =============================================
-- 3. 감사 로그 테이블 생성
-- =============================================

-- 3.1 통합 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 감사 대상
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

  -- 변경 내용
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],

  -- 변경자 정보
  user_id UUID,
  user_email TEXT,
  user_role TEXT,

  -- 메타데이터
  ip_address INET,
  user_agent TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 추가 정보
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- 인덱스
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_logged_at ON audit_logs(logged_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

COMMENT ON TABLE audit_logs IS '통합 감사 로그 - 모든 중요 데이터 변경 추적';

-- 3.2 중요 테이블 감사 트리거 함수
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields TEXT[];
BEGIN
  -- OLD 데이터 JSON 변환
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    v_old_data := row_to_json(OLD)::JSONB;
  END IF;

  -- NEW 데이터 JSON 변환
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_new_data := row_to_json(NEW)::JSONB;
  END IF;

  -- 변경된 필드 감지
  IF TG_OP = 'UPDATE' THEN
    SELECT ARRAY_AGG(key)
    INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE v_new_data->>key IS DISTINCT FROM v_old_data->>key;
  END IF;

  -- 감사 로그 삽입
  INSERT INTO audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    logged_at
  ) VALUES (
    TG_TABLE_NAME,
    CASE
      WHEN TG_OP = 'DELETE' THEN (v_old_data->>'id')::UUID
      ELSE (v_new_data->>'id')::UUID
    END,
    TG_OP,
    v_old_data,
    v_new_data,
    v_changed_fields,
    NOW()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3.3 중요 테이블에 감사 트리거 적용
DROP TRIGGER IF EXISTS audit_course_rounds ON course_rounds;
CREATE TRIGGER audit_course_rounds
  AFTER INSERT OR UPDATE OR DELETE ON course_rounds
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_round_enrollments ON round_enrollments;
CREATE TRIGGER audit_round_enrollments
  AFTER INSERT OR UPDATE OR DELETE ON round_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_curriculum_items ON curriculum_items;
CREATE TRIGGER audit_curriculum_items
  AFTER INSERT OR UPDATE OR DELETE ON curriculum_items
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_func();

-- =============================================
-- 4. 감사 로그 조회 함수
-- =============================================

-- 4.1 특정 레코드의 변경 이력 조회
CREATE OR REPLACE FUNCTION get_audit_history(
  p_table_name TEXT,
  p_record_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  operation TEXT,
  changed_fields TEXT[],
  old_data JSONB,
  new_data JSONB,
  user_email TEXT,
  logged_at TIMESTAMPTZ,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.operation,
    al.changed_fields,
    al.old_data,
    al.new_data,
    al.user_email,
    al.logged_at,
    al.description
  FROM audit_logs al
  WHERE al.table_name = p_table_name
    AND al.record_id = p_record_id
  ORDER BY al.logged_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4.2 최근 감사 로그 조회
CREATE OR REPLACE FUNCTION get_recent_audit_logs(
  p_hours INT DEFAULT 24,
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  table_name TEXT,
  record_id UUID,
  operation TEXT,
  user_email TEXT,
  logged_at TIMESTAMPTZ,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.table_name,
    al.record_id,
    al.operation,
    al.user_email,
    al.logged_at,
    al.severity
  FROM audit_logs al
  WHERE al.logged_at >= NOW() - (p_hours || ' hours')::INTERVAL
  ORDER BY al.logged_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. 성능 모니터링 뷰
-- =============================================

-- 5.1 느린 쿼리 감지를 위한 통계 뷰
CREATE OR REPLACE VIEW v_performance_metrics AS
SELECT
  'total_rounds' as metric_name,
  COUNT(*)::TEXT as metric_value,
  'count' as metric_type
FROM course_rounds
UNION ALL
SELECT
  'active_rounds',
  COUNT(*)::TEXT,
  'count'
FROM course_rounds
WHERE status = 'in_progress'
UNION ALL
SELECT
  'total_enrollments',
  COUNT(*)::TEXT,
  'count'
FROM round_enrollments
UNION ALL
SELECT
  'avg_trainees_per_round',
  ROUND(AVG(current_trainees), 2)::TEXT,
  'average'
FROM course_rounds
UNION ALL
SELECT
  'total_curriculum_items',
  COUNT(*)::TEXT,
  'count'
FROM curriculum_items;

COMMENT ON VIEW v_performance_metrics IS '시스템 성능 지표 모니터링';

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Phase 3: 성능 최적화 및 감사 로그 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 1. Materialized Views 생성';
  RAISE NOTICE '  - mv_round_statistics (차수별 통계)';
  RAISE NOTICE '  - mv_trainee_statistics (교육생별 통계)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 2. 통계 갱신 함수';
  RAISE NOTICE '  - refresh_statistics_views()';
  RAISE NOTICE '  사용법: SELECT refresh_statistics_views();';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 3. 감사 로그 시스템';
  RAISE NOTICE '  - audit_logs 테이블';
  RAISE NOTICE '  - course_rounds, round_enrollments, curriculum_items 추적';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 4. 감사 조회 함수';
  RAISE NOTICE '  - get_audit_history(table_name, record_id)';
  RAISE NOTICE '  - get_recent_audit_logs(hours, limit)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 5. 성능 모니터링';
  RAISE NOTICE '  - v_performance_metrics 뷰';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 권장 배치 작업:';
  RAISE NOTICE '  - 매일 자정: SELECT refresh_statistics_views();';
  RAISE NOTICE '  - 매주: 감사 로그 아카이빙 (90일 이상 데이터)';
  RAISE NOTICE '=================================================';
END $$;
