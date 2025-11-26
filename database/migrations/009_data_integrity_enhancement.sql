/**
 * =================================================
 * Phase 2: 데이터 무결성 강화
 * =================================================
 * 작성일: 2025-01-24
 * 목적: 통계 자동 계산, Cascade 규칙, 데이터 제약조건
 * =================================================
 */

-- =============================================
-- 1. course_rounds 통계 자동 업데이트 트리거
-- =============================================

-- 1.1 current_trainees 자동 업데이트 함수 (이미 존재, 개선)
CREATE OR REPLACE FUNCTION update_round_trainee_count()
RETURNS TRIGGER AS $$
BEGIN
  -- round_enrollments 변경 시 course_rounds.current_trainees 자동 업데이트
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE course_rounds
    SET current_trainees = (
      SELECT COUNT(*)
      FROM round_enrollments
      WHERE round_id = NEW.round_id
        AND status = 'active'
    ),
    updated_at = NOW()
    WHERE id = NEW.round_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE course_rounds
    SET current_trainees = (
      SELECT COUNT(*)
      FROM round_enrollments
      WHERE round_id = OLD.round_id
        AND status = 'active'
    ),
    updated_at = NOW()
    WHERE id = OLD.round_id;

    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성
DROP TRIGGER IF EXISTS trigger_update_round_trainee_count ON round_enrollments;
CREATE TRIGGER trigger_update_round_trainee_count
  AFTER INSERT OR UPDATE OR DELETE ON round_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_round_trainee_count();

-- 1.2 차수 상태 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_round_status()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_start_date := NEW.start_date;
    v_end_date := NEW.end_date;

    -- 날짜에 따라 자동으로 상태 변경
    IF v_current_date < v_start_date THEN
      -- 시작 전: planning 또는 recruiting
      IF NEW.status NOT IN ('planning', 'recruiting', 'cancelled') THEN
        NEW.status := 'planning';
      END IF;
    ELSIF v_current_date >= v_start_date AND v_current_date <= v_end_date THEN
      -- 진행 중
      IF NEW.status NOT IN ('in_progress', 'cancelled') THEN
        NEW.status := 'in_progress';
      END IF;
    ELSIF v_current_date > v_end_date THEN
      -- 종료: completed (수동으로 완료 처리해야 하는 경우 제외)
      IF NEW.status NOT IN ('completed', 'cancelled') THEN
        -- 자동으로 완료 처리하지 않고 알림만 (선택적)
        -- NEW.status := 'completed';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_round_status ON course_rounds;
CREATE TRIGGER trigger_update_round_status
  BEFORE INSERT OR UPDATE ON course_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_round_status();

-- =============================================
-- 2. Cascade 삭제 규칙 정의
-- =============================================

-- 2.1 course_rounds 삭제 시 관련 데이터 처리
COMMENT ON TABLE course_rounds IS '과정 차수 - 삭제 시 curriculum_items, round_enrollments는 CASCADE DELETE';
COMMENT ON TABLE curriculum_items IS '커리큘럼 항목 - round_id는 CASCADE DELETE';
COMMENT ON TABLE round_enrollments IS '차수 등록 - round_id는 CASCADE DELETE';

-- 이미 존재하는 FK 제약조건 확인
DO $$
BEGIN
  -- curriculum_items.round_id FK 확인 및 재생성 (CASCADE)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'curriculum_items_round_id_fkey'
      AND table_name = 'curriculum_items'
  ) THEN
    -- 기존 제약조건 삭제 후 재생성
    ALTER TABLE curriculum_items
      DROP CONSTRAINT IF EXISTS curriculum_items_round_id_fkey;
  END IF;

  ALTER TABLE curriculum_items
    ADD CONSTRAINT curriculum_items_round_id_fkey
    FOREIGN KEY (round_id)
    REFERENCES course_rounds(id)
    ON DELETE CASCADE;

  RAISE NOTICE '✅ curriculum_items.round_id CASCADE DELETE 설정 완료';

  -- round_enrollments.round_id FK 확인 및 재생성 (CASCADE)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'round_enrollments_round_id_fkey'
      AND table_name = 'round_enrollments'
  ) THEN
    ALTER TABLE round_enrollments
      DROP CONSTRAINT IF EXISTS round_enrollments_round_id_fkey;
  END IF;

  ALTER TABLE round_enrollments
    ADD CONSTRAINT round_enrollments_round_id_fkey
    FOREIGN KEY (round_id)
    REFERENCES course_rounds(id)
    ON DELETE CASCADE;

  RAISE NOTICE '✅ round_enrollments.round_id CASCADE DELETE 설정 완료';
END $$;

-- 2.2 template_curriculum 삭제 시 처리 (SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'curriculum_items_template_curriculum_id_fkey'
      AND table_name = 'curriculum_items'
  ) THEN
    ALTER TABLE curriculum_items
      DROP CONSTRAINT IF EXISTS curriculum_items_template_curriculum_id_fkey;
  END IF;

  ALTER TABLE curriculum_items
    ADD CONSTRAINT curriculum_items_template_curriculum_id_fkey
    FOREIGN KEY (template_curriculum_id)
    REFERENCES template_curriculum(id)
    ON DELETE SET NULL;

  RAISE NOTICE '✅ curriculum_items.template_curriculum_id SET NULL 설정 완료';
END $$;

-- =============================================
-- 3. 데이터 제약조건 추가
-- =============================================

-- 3.1 course_rounds 제약조건
DO $$
BEGIN
  -- check_round_dates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_round_dates'
      AND table_name = 'course_rounds'
  ) THEN
    ALTER TABLE course_rounds
      ADD CONSTRAINT check_round_dates
      CHECK (end_date >= start_date);
    RAISE NOTICE '✅ check_round_dates 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_round_dates 이미 존재';
  END IF;

  -- check_max_trainees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_max_trainees'
      AND table_name = 'course_rounds'
  ) THEN
    ALTER TABLE course_rounds
      ADD CONSTRAINT check_max_trainees
      CHECK (max_trainees > 0);
    RAISE NOTICE '✅ check_max_trainees 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_max_trainees 이미 존재';
  END IF;

  -- check_current_trainees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_current_trainees'
      AND table_name = 'course_rounds'
  ) THEN
    ALTER TABLE course_rounds
      ADD CONSTRAINT check_current_trainees
      CHECK (current_trainees >= 0 AND current_trainees <= max_trainees);
    RAISE NOTICE '✅ check_current_trainees 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_current_trainees 이미 존재';
  END IF;
END $$;

-- 3.2 curriculum_items 제약조건
DO $$
BEGIN
  -- check_curriculum_times
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_curriculum_times'
      AND table_name = 'curriculum_items'
  ) THEN
    ALTER TABLE curriculum_items
      ADD CONSTRAINT check_curriculum_times
      CHECK (end_time > start_time);
    RAISE NOTICE '✅ check_curriculum_times 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_curriculum_times 이미 존재';
  END IF;

  -- check_curriculum_day
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_curriculum_day'
      AND table_name = 'curriculum_items'
  ) THEN
    ALTER TABLE curriculum_items
      ADD CONSTRAINT check_curriculum_day
      CHECK (day > 0);
    RAISE NOTICE '✅ check_curriculum_day 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_curriculum_day 이미 존재';
  END IF;

  -- check_curriculum_order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_curriculum_order'
      AND table_name = 'curriculum_items'
  ) THEN
    ALTER TABLE curriculum_items
      ADD CONSTRAINT check_curriculum_order
      CHECK (order_index > 0);
    RAISE NOTICE '✅ check_curriculum_order 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_curriculum_order 이미 존재';
  END IF;
END $$;

-- 3.3 round_enrollments 제약조건
DO $$
BEGIN
  -- check_final_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_final_score'
      AND table_name = 'round_enrollments'
  ) THEN
    ALTER TABLE round_enrollments
      ADD CONSTRAINT check_final_score
      CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 100));
    RAISE NOTICE '✅ check_final_score 제약조건 추가';
  ELSE
    RAISE NOTICE '⚠️  check_final_score 이미 존재';
  END IF;
END $$;

-- =============================================
-- 4. 인덱스 최적화
-- =============================================

-- 4.1 자주 조회되는 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_course_rounds_status ON course_rounds(status);
CREATE INDEX IF NOT EXISTS idx_course_rounds_dates ON course_rounds(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_course_rounds_instructor ON course_rounds(instructor_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_items_round_date ON curriculum_items(round_id, date);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_classroom ON curriculum_items(classroom_id) WHERE classroom_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_round_enrollments_status ON round_enrollments(round_id, status);
CREATE INDEX IF NOT EXISTS idx_round_enrollments_trainee ON round_enrollments(trainee_id);

-- =============================================
-- 5. 데이터 검증 함수
-- =============================================

-- 5.1 차수 데이터 무결성 검증
CREATE OR REPLACE FUNCTION validate_round_integrity(p_round_id UUID)
RETURNS TABLE(
  check_name TEXT,
  is_valid BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- 1. 날짜 검증
  RETURN QUERY
  SELECT
    'date_validation'::TEXT,
    (SELECT end_date >= start_date FROM course_rounds WHERE id = p_round_id),
    '종료일이 시작일보다 빠릅니다.'::TEXT;

  -- 2. 등록 인원 검증
  RETURN QUERY
  SELECT
    'enrollment_count'::TEXT,
    (SELECT current_trainees <= max_trainees FROM course_rounds WHERE id = p_round_id),
    '현재 등록 인원이 정원을 초과했습니다.'::TEXT;

  -- 3. 커리큘럼 항목 검증
  RETURN QUERY
  SELECT
    'curriculum_items'::TEXT,
    EXISTS(SELECT 1 FROM curriculum_items WHERE round_id = p_round_id),
    '커리큘럼 항목이 없습니다.'::TEXT;

  -- 4. 강사 할당 검증
  RETURN QUERY
  SELECT
    'instructor_assignment'::TEXT,
    (SELECT instructor_id IS NOT NULL FROM course_rounds WHERE id = p_round_id),
    '강사가 할당되지 않았습니다.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Phase 2: 데이터 무결성 강화 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 1. 통계 자동 업데이트 트리거 설정';
  RAISE NOTICE '  - update_round_trainee_count()';
  RAISE NOTICE '  - update_round_status()';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 2. Cascade 삭제 규칙 설정';
  RAISE NOTICE '  - curriculum_items.round_id: CASCADE DELETE';
  RAISE NOTICE '  - round_enrollments.round_id: CASCADE DELETE';
  RAISE NOTICE '  - curriculum_items.template_curriculum_id: SET NULL';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 3. 데이터 제약조건 추가';
  RAISE NOTICE '  - 날짜, 시간, 인원, 점수 유효성 검증';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 4. 인덱스 최적화';
  RAISE NOTICE '  - 상태, 날짜, 강사, 강의실 인덱스 추가';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 5. 데이터 검증 함수';
  RAISE NOTICE '  - validate_round_integrity(round_id)';
  RAISE NOTICE '=================================================';
END $$;
