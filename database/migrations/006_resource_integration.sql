-- ============================================================
-- Phase 2: 커리큘럼-자원 통합 데이터베이스 마이그레이션
-- ============================================================

-- 1. course_sessions 테이블에 자원 관련 컬럼 추가
ALTER TABLE course_sessions
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id),
ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES classrooms(id),
ADD COLUMN IF NOT EXISTS resource_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS conflict_notes TEXT;

-- resource_status 값 검증 제약조건
ALTER TABLE course_sessions
DROP CONSTRAINT IF EXISTS check_resource_status;

ALTER TABLE course_sessions
ADD CONSTRAINT check_resource_status
  CHECK (resource_status IN ('pending', 'confirmed', 'conflict', 'cancelled'));

-- 기존 classroom 컬럼의 데이터를 classroom_id로 마이그레이션
-- (나중에 classroom 컬럼은 삭제할 수 있음)

COMMENT ON COLUMN course_sessions.subject_id IS '세션 과목 (subjects 테이블 참조)';
COMMENT ON COLUMN course_sessions.classroom_id IS '세션 강의실 (classrooms 테이블 참조)';
COMMENT ON COLUMN course_sessions.resource_status IS '자원 배정 상태: pending(대기), confirmed(확정), conflict(충돌), cancelled(취소)';
COMMENT ON COLUMN course_sessions.conflict_notes IS '자원 충돌 관련 메모';

-- ============================================================
-- 2. 자원 예약 로그 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  session_id UUID REFERENCES course_sessions(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 중복 예약 방지를 위한 유니크 인덱스 (GiST 대신 btree 사용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_double_booking
  ON resource_bookings (resource_type, resource_id, start_datetime, end_datetime)
  WHERE status = 'active';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookings_resource ON resource_bookings(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON resource_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON resource_bookings(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON resource_bookings(status);

COMMENT ON TABLE resource_bookings IS '자원 예약 로그 및 충돌 방지';
COMMENT ON COLUMN resource_bookings.resource_type IS '자원 타입: instructor, classroom';
COMMENT ON COLUMN resource_bookings.resource_id IS '자원 ID (instructors.id 또는 classrooms.id)';
COMMENT ON COLUMN resource_bookings.status IS '예약 상태: active(활성), cancelled(취소), completed(완료)';

-- ============================================================
-- 3. 자원 예약 자동 생성 트리거
-- ============================================================

-- 트리거 함수: course_sessions 생성/수정 시 resource_bookings 자동 생성
CREATE OR REPLACE FUNCTION auto_create_resource_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- 기존 예약 취소
  IF TG_OP = 'UPDATE' THEN
    UPDATE resource_bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE session_id = OLD.id AND status = 'active';
  END IF;

  -- 새 예약 생성
  IF NEW.actual_instructor_id IS NOT NULL THEN
    INSERT INTO resource_bookings (
      resource_type,
      resource_id,
      session_id,
      start_datetime,
      end_datetime,
      status
    ) VALUES (
      'instructor',
      NEW.actual_instructor_id,
      NEW.id,
      (NEW.session_date || ' ' || NEW.start_time)::TIMESTAMP,
      (NEW.session_date || ' ' || NEW.end_time)::TIMESTAMP,
      'active'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.classroom_id IS NOT NULL THEN
    INSERT INTO resource_bookings (
      resource_type,
      resource_id,
      session_id,
      start_datetime,
      end_datetime,
      status
    ) VALUES (
      'classroom',
      NEW.classroom_id,
      NEW.id,
      (NEW.session_date || ' ' || NEW.start_time)::TIMESTAMP,
      (NEW.session_date || ' ' || NEW.end_time)::TIMESTAMP,
      'active'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_create_resource_bookings ON course_sessions;
CREATE TRIGGER trigger_auto_create_resource_bookings
  AFTER INSERT OR UPDATE ON course_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_resource_bookings();

-- ============================================================
-- 4. 세션 삭제 시 예약 취소 트리거
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_resource_bookings_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE resource_bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE session_id = OLD.id AND status = 'active';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cancel_bookings_on_delete ON course_sessions;
CREATE TRIGGER trigger_cancel_bookings_on_delete
  BEFORE DELETE ON course_sessions
  FOR EACH ROW
  EXECUTE FUNCTION cancel_resource_bookings_on_delete();

-- ============================================================
-- 5. 충돌 감지 함수
-- ============================================================

CREATE OR REPLACE FUNCTION detect_resource_conflicts(
  p_session_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_instructor_id UUID DEFAULT NULL,
  p_classroom_id UUID DEFAULT NULL,
  p_exclude_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conflict_type VARCHAR(50),
  resource_id UUID,
  resource_name VARCHAR(255),
  conflicting_session_id UUID,
  conflicting_course VARCHAR(255),
  conflict_time_range TEXT
) AS $$
BEGIN
  -- 강사 충돌 체크
  IF p_instructor_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      'instructor'::VARCHAR(50),
      p_instructor_id,
      u.name,
      cs.id,
      cr.title,
      (cs.start_time || ' - ' || cs.end_time)::TEXT
    FROM course_sessions cs
    JOIN course_rounds cr ON cs.round_id = cr.id
    JOIN users u ON cs.actual_instructor_id = u.id
    WHERE cs.actual_instructor_id = p_instructor_id
      AND cs.session_date = p_session_date
      AND cs.id != COALESCE(p_exclude_session_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND cr.status != 'cancelled'
      AND (
        (p_start_time >= cs.start_time AND p_start_time < cs.end_time) OR
        (p_end_time > cs.start_time AND p_end_time <= cs.end_time) OR
        (p_start_time <= cs.start_time AND p_end_time >= cs.end_time)
      );
  END IF;

  -- 강의실 충돌 체크
  IF p_classroom_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      'classroom'::VARCHAR(50),
      p_classroom_id,
      cl.name,
      cs.id,
      cr.title,
      (cs.start_time || ' - ' || cs.end_time)::TEXT
    FROM course_sessions cs
    JOIN course_rounds cr ON cs.round_id = cr.id
    JOIN classrooms cl ON cs.classroom_id = cl.id
    WHERE cs.classroom_id = p_classroom_id
      AND cs.session_date = p_session_date
      AND cs.id != COALESCE(p_exclude_session_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND cr.status != 'cancelled'
      AND (
        (p_start_time >= cs.start_time AND p_start_time < cs.end_time) OR
        (p_end_time > cs.start_time AND p_end_time <= cs.end_time) OR
        (p_start_time <= cs.start_time AND p_end_time >= cs.end_time)
      );
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_resource_conflicts IS '자원 충돌 감지 함수';

-- ============================================================
-- 6. 자원 활용도 통계 뷰
-- ============================================================

CREATE OR REPLACE VIEW resource_utilization_stats AS
SELECT
  'instructor' AS resource_type,
  u.id AS resource_id,
  u.name AS resource_name,
  COUNT(cs.id) AS total_sessions,
  SUM(
    EXTRACT(EPOCH FROM (cs.end_time::TIME - cs.start_time::TIME)) / 3600
  )::NUMERIC(10,2) AS total_hours,
  COUNT(DISTINCT cs.session_date) AS days_utilized,
  MIN(cs.session_date) AS first_session_date,
  MAX(cs.session_date) AS last_session_date
FROM users u
LEFT JOIN course_sessions cs ON u.id = cs.actual_instructor_id
WHERE u.role = 'instructor'
GROUP BY u.id, u.name

UNION ALL

SELECT
  'classroom' AS resource_type,
  cl.id AS resource_id,
  cl.name AS resource_name,
  COUNT(cs.id) AS total_sessions,
  SUM(
    EXTRACT(EPOCH FROM (cs.end_time::TIME - cs.start_time::TIME)) / 3600
  )::NUMERIC(10,2) AS total_hours,
  COUNT(DISTINCT cs.session_date) AS days_utilized,
  MIN(cs.session_date) AS first_session_date,
  MAX(cs.session_date) AS last_session_date
FROM classrooms cl
LEFT JOIN course_sessions cs ON cl.id = cs.classroom_id
WHERE cl.is_available = true
GROUP BY cl.id, cl.name;

COMMENT ON VIEW resource_utilization_stats IS '자원 활용도 통계 뷰';

-- ============================================================
-- 7. RLS 정책 업데이트
-- ============================================================

-- resource_bookings 테이블 RLS 활성화
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽을 수 있음
DROP POLICY IF EXISTS "resource_bookings_select_policy" ON resource_bookings;
CREATE POLICY "resource_bookings_select_policy"
  ON resource_bookings FOR SELECT
  TO authenticated
  USING (true);

-- admin과 course_manager만 수정 가능
DROP POLICY IF EXISTS "resource_bookings_modify_policy" ON resource_bookings;
CREATE POLICY "resource_bookings_modify_policy"
  ON resource_bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'course_manager')
    )
  );

-- ============================================================
-- 8. 데이터 마이그레이션
-- ============================================================

-- 기존 classroom (text) 데이터를 classroom_id (UUID)로 마이그레이션
UPDATE course_sessions cs
SET classroom_id = cl.id
FROM classrooms cl
WHERE cs.classroom = cl.name
  AND cs.classroom_id IS NULL;

-- 기존 세션들의 resource_status 업데이트
UPDATE course_sessions
SET resource_status = 'confirmed'
WHERE resource_status = 'pending'
  AND actual_instructor_id IS NOT NULL
  AND (classroom_id IS NOT NULL OR classroom IS NOT NULL);

-- ============================================================
-- 완료
-- ============================================================

-- 마이그레이션 버전 기록
INSERT INTO schema_migrations (version, description, executed_at)
VALUES (
  '006',
  'Resource Integration: course_sessions enhancement, resource_bookings table, conflict detection',
  NOW()
)
ON CONFLICT (version) DO UPDATE
SET executed_at = NOW();

-- 마이그레이션 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2 마이그레이션 완료: 커리큘럼-자원 통합';
  RAISE NOTICE '   - course_sessions 테이블 강화';
  RAISE NOTICE '   - resource_bookings 테이블 생성';
  RAISE NOTICE '   - 충돌 감지 함수 및 트리거 생성';
  RAISE NOTICE '   - 자원 활용도 통계 뷰 생성';
END $$;
