-- ============================================================
-- 스키마 마이그레이션 추적 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  description TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE schema_migrations IS '데이터베이스 마이그레이션 이력';

-- 초기 마이그레이션 기록
INSERT INTO schema_migrations (version, description, executed_at)
VALUES ('000', 'Initial schema migrations table', NOW())
ON CONFLICT (version) DO NOTHING;
