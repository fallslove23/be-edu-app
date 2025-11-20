-- =====================================================
-- 통합 과정 관리 시스템 재설계
-- =====================================================
-- 목적: course_templates, course_rounds, curriculum_items 통합
-- 작성일: 2025-01-19
-- =====================================================

-- =====================================================
-- STEP 0: 기존 뷰 삭제 (재생성 준비)
-- =====================================================

DROP VIEW IF EXISTS curriculum_items_full CASCADE;
DROP VIEW IF EXISTS course_rounds_full CASCADE;

-- =====================================================
-- STEP 1: 기존 테이블 정리 및 새 구조 생성
-- =====================================================

-- 1.1 course_templates 테이블 확장
-- 기존 컬럼 유지하면서 필요한 컬럼 추가
DO $$
BEGIN
  -- duration_days 컬럼 추가 (기존 duration_weeks와 병행)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_templates' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE course_templates ADD COLUMN duration_days INTEGER;
  END IF;

  -- total_hours 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_templates' AND column_name = 'total_hours'
  ) THEN
    ALTER TABLE course_templates ADD COLUMN total_hours DECIMAL(5,2);
  END IF;

  -- requirements 컬럼 추가 (TEXT[] 형식)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_templates' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE course_templates ADD COLUMN requirements TEXT[];
  END IF;

  -- objectives 컬럼 추가 (TEXT[] 형식)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_templates' AND column_name = 'objectives'
  ) THEN
    ALTER TABLE course_templates ADD COLUMN objectives TEXT[];
  END IF;
END $$;

-- 1.2 template_curriculum 테이블 생성 (새로 추가)
-- 과정 템플릿의 표준 커리큘럼 저장

-- 기존 제약조건 삭제 (테이블이 이미 존재하는 경우 대비)
DO $$
BEGIN
  -- 기존 제약조건 제거
  ALTER TABLE IF EXISTS template_curriculum DROP CONSTRAINT IF EXISTS template_curriculum_unique CASCADE;
  ALTER TABLE IF EXISTS template_curriculum DROP CONSTRAINT IF EXISTS template_curriculum_day_check CASCADE;
  ALTER TABLE IF EXISTS template_curriculum DROP CONSTRAINT IF EXISTS template_curriculum_order_check CASCADE;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS template_curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,

  -- 일차 및 순서
  day INTEGER NOT NULL,                            -- 1일차, 2일차, 3일차...
  order_index INTEGER NOT NULL DEFAULT 1,          -- 같은 날 여러 과목 (1교시, 2교시...)

  -- 과목 정보
  subject VARCHAR(200) NOT NULL,                   -- 과목명 (예: "영업 기초 이론")
  subject_code VARCHAR(50),                        -- 과목 코드 (선택)
  subject_type VARCHAR(50) DEFAULT 'lecture',      -- lecture, practice, evaluation, discussion, presentation
  description TEXT,                                -- 과목 상세 설명

  -- 시간 정보
  duration_hours DECIMAL(4,2) NOT NULL,            -- 교육 시간 (예: 3.0, 1.5)
  recommended_start_time TIME,                     -- 권장 시작 시간 (예: 09:00)
  recommended_end_time TIME,                       -- 권장 종료 시간

  -- 교육 내용
  learning_objectives TEXT[],                      -- 학습 목표 배열
  topics TEXT[],                                   -- 주요 주제 배열
  materials_needed TEXT[],                         -- 필요 자료 배열

  -- 강사 요구사항
  instructor_requirements TEXT,                    -- 강사 자격 요건
  preparation_notes TEXT,                          -- 준비사항

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 제약조건 추가 (DROP IF EXISTS 사용)
DO $$
BEGIN
  -- UNIQUE 제약조건
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'template_curriculum_unique'
  ) THEN
    ALTER TABLE template_curriculum ADD CONSTRAINT template_curriculum_unique UNIQUE (template_id, day, order_index);
  END IF;

  -- day CHECK 제약조건
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'template_curriculum_day_check'
  ) THEN
    ALTER TABLE template_curriculum ADD CONSTRAINT template_curriculum_day_check CHECK (day >= 1 AND day <= 365);
  END IF;

  -- order_index CHECK 제약조건
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'template_curriculum_order_check'
  ) THEN
    ALTER TABLE template_curriculum ADD CONSTRAINT template_curriculum_order_check CHECK (order_index >= 1 AND order_index <= 20);
  END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_template_curriculum_template_id ON template_curriculum(template_id);
CREATE INDEX IF NOT EXISTS idx_template_curriculum_day ON template_curriculum(day);
CREATE INDEX IF NOT EXISTS idx_template_curriculum_subject_type ON template_curriculum(subject_type);

-- =====================================================
-- STEP 2: course_rounds 테이블 확장 (이미 존재)
-- =====================================================
-- course_rounds는 이미 올바른 구조를 가지고 있음
-- 추가 필요한 컬럼만 확인

DO $$
BEGIN
  -- round_name 컬럼 추가 (title과 별칭)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_rounds' AND column_name = 'round_name'
  ) THEN
    ALTER TABLE course_rounds ADD COLUMN round_name TEXT;
    -- 기존 title을 round_name에 복사
    UPDATE course_rounds SET round_name = title WHERE round_name IS NULL;
  END IF;

  -- round_code 컬럼 추가 (고유 식별 코드)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_rounds' AND column_name = 'round_code'
  ) THEN
    ALTER TABLE course_rounds ADD COLUMN round_code VARCHAR(50) UNIQUE;
  END IF;

  -- course_name 컬럼 추가 (과정명 중복 저장)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_rounds' AND column_name = 'course_name'
  ) THEN
    ALTER TABLE course_rounds ADD COLUMN course_name TEXT;
  END IF;
END $$;

-- =====================================================
-- STEP 3: curriculum_items 테이블 생성 또는 확장
-- =====================================================
-- 실제 운영 일정을 저장하는 핵심 테이블

-- 3.1 curriculum_items 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS curriculum_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 과정 연결 (새로운 통합 구조)
  round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE,
  template_curriculum_id UUID REFERENCES template_curriculum(id) ON DELETE SET NULL,

  -- 레거시 연결 (기존 시스템과 호환성)
  session_id UUID,  -- 기존 course_sessions FK (nullable)
  division_id UUID, -- 기존 class_divisions FK (nullable)

  -- 일차 및 순서
  day INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,

  -- 일정 정보
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ) STORED,

  -- 과목 정보
  subject VARCHAR(200) NOT NULL,
  title TEXT,  -- subject 별칭
  subject_type VARCHAR(50) DEFAULT 'lecture',
  description TEXT,

  -- 강사 및 강의실
  instructor_id UUID,
  classroom_id UUID,

  -- 상태 관리
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  needs_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID,

  -- 교육 자료
  materials JSONB,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- 3.2 기존 테이블이 있는 경우 컬럼 추가
DO $$
BEGIN
  -- round_id 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'curriculum_items' AND column_name = 'round_id'
  ) THEN
    ALTER TABLE curriculum_items ADD COLUMN round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE;
  END IF;

  -- template_curriculum_id 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'curriculum_items' AND column_name = 'template_curriculum_id'
  ) THEN
    ALTER TABLE curriculum_items ADD COLUMN template_curriculum_id UUID REFERENCES template_curriculum(id) ON DELETE SET NULL;
  END IF;

  -- title 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'curriculum_items' AND column_name = 'title'
  ) THEN
    ALTER TABLE curriculum_items ADD COLUMN title TEXT;
  END IF;
END $$;

-- curriculum_items 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_curriculum_items_round_id ON curriculum_items(round_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_template_curriculum_id ON curriculum_items(template_curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_date ON curriculum_items(date);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_day ON curriculum_items(day);

-- =====================================================
-- STEP 4: round_enrollments 테이블 확장
-- =====================================================

CREATE TABLE IF NOT EXISTS round_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 차수 및 교육생 연결
  round_id UUID NOT NULL REFERENCES course_rounds(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,

  -- 등록 정보
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'pending')),

  -- 수료 정보
  completion_date DATE,
  final_score DECIMAL(5,2),
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number VARCHAR(100),

  -- 추가 정보
  notes TEXT,
  enrollment_source VARCHAR(50), -- web, admin, import, etc.

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건: 같은 차수에 같은 교육생은 한 번만 등록
  CONSTRAINT unique_round_trainee UNIQUE (round_id, trainee_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_round_enrollments_round_id ON round_enrollments(round_id);
CREATE INDEX IF NOT EXISTS idx_round_enrollments_trainee_id ON round_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_round_enrollments_status ON round_enrollments(status);

-- =====================================================
-- STEP 5: 통합 뷰 생성
-- =====================================================

-- 5.1 과정 차수 전체 정보 뷰
CREATE OR REPLACE VIEW course_rounds_full AS
SELECT
  cr.*,
  ct.name as template_name,
  ct.category,
  ct.duration_days as template_duration_days,
  ct.total_hours as template_total_hours,

  -- 등록 교육생 수 계산
  COUNT(DISTINCT re.id) FILTER (WHERE re.status = 'active') as enrolled_count,
  COUNT(DISTINCT re.id) FILTER (WHERE re.status = 'completed') as completed_count,

  -- 커리큘럼 항목 수 계산
  COUNT(DISTINCT ci.id) as curriculum_items_count,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'completed') as completed_sessions_count,

  -- 출석률 계산 (간단 버전)
  CASE
    WHEN COUNT(DISTINCT ci.id) > 0
    THEN ROUND((COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'completed')::NUMERIC / COUNT(DISTINCT ci.id)) * 100, 2)
    ELSE 0
  END as session_completion_rate

FROM course_rounds cr
LEFT JOIN course_templates ct ON cr.template_id = ct.id
LEFT JOIN round_enrollments re ON cr.id = re.round_id
LEFT JOIN curriculum_items ci ON cr.id = ci.round_id
GROUP BY cr.id, ct.name, ct.category, ct.duration_days, ct.total_hours;

-- 5.2 커리큘럼 항목 상세 뷰
CREATE OR REPLACE VIEW curriculum_items_full AS
SELECT
  ci.*,
  cr.round_name,
  cr.round_number,
  cr.status as round_status,
  tc.subject as template_subject,
  tc.subject_type as template_subject_type,
  tc.learning_objectives as template_learning_objectives,

  -- 강사 정보
  u.name as instructor_name,
  u.email as instructor_email,

  -- 강의실 정보
  cls.name as classroom_name,
  cls.capacity as classroom_capacity

FROM curriculum_items ci
LEFT JOIN course_rounds cr ON ci.round_id = cr.id
LEFT JOIN template_curriculum tc ON ci.template_curriculum_id = tc.id
LEFT JOIN users u ON ci.instructor_id = u.id
LEFT JOIN classrooms cls ON ci.classroom_id = cls.id;

-- =====================================================
-- STEP 6: 트리거 함수 생성
-- =====================================================

-- 6.1 course_rounds 생성 시 자동으로 curriculum_items 생성
CREATE OR REPLACE FUNCTION auto_create_curriculum_items()
RETURNS TRIGGER AS $$
DECLARE
  template_curr RECORD;
  curr_date DATE;
  start_time TIME;
  end_time TIME;
BEGIN
  -- template_curriculum 조회
  FOR template_curr IN
    SELECT * FROM template_curriculum
    WHERE template_id = NEW.template_id
    ORDER BY day, order_index
  LOOP
    -- 날짜 계산 (start_date + day - 1)
    curr_date := NEW.start_date + (template_curr.day - 1);

    -- 시간 설정 (권장 시간이 있으면 사용, 없으면 기본값)
    start_time := COALESCE(template_curr.recommended_start_time, '09:00'::TIME);

    -- 종료 시간 계산 (시작 시간 + 교육 시간)
    end_time := start_time + (template_curr.duration_hours || ' hours')::INTERVAL;

    -- curriculum_items 생성
    INSERT INTO curriculum_items (
      round_id,
      template_curriculum_id,
      session_id,  -- NULL (session_id는 legacy)
      division_id, -- NULL
      day,
      order_index,
      date,
      start_time,
      end_time,
      subject,
      subject_type,
      description,
      instructor_id,
      status,
      needs_approval,
      created_by
    ) VALUES (
      NEW.id,
      template_curr.id,
      NULL,
      NULL,
      template_curr.day,
      template_curr.order_index,
      curr_date,
      start_time,
      end_time,
      template_curr.subject,
      template_curr.subject_type,
      template_curr.description,
      NEW.instructor_id,
      'draft',
      true,
      NEW.instructor_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (course_rounds INSERT 후 실행)
DROP TRIGGER IF EXISTS trigger_auto_create_curriculum_items ON course_rounds;
CREATE TRIGGER trigger_auto_create_curriculum_items
  AFTER INSERT ON course_rounds
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_curriculum_items();

-- 6.2 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- template_curriculum updated_at 트리거
DROP TRIGGER IF EXISTS trigger_template_curriculum_updated_at ON template_curriculum;
CREATE TRIGGER trigger_template_curriculum_updated_at
  BEFORE UPDATE ON template_curriculum
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- round_enrollments updated_at 트리거
DROP TRIGGER IF EXISTS trigger_round_enrollments_updated_at ON round_enrollments;
CREATE TRIGGER trigger_round_enrollments_updated_at
  BEFORE UPDATE ON round_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: RLS (Row Level Security) 정책
-- =====================================================

-- template_curriculum RLS
ALTER TABLE template_curriculum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "template_curriculum_read_all" ON template_curriculum;
CREATE POLICY "template_curriculum_read_all" ON template_curriculum
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "template_curriculum_write_admin" ON template_curriculum;
CREATE POLICY "template_curriculum_write_admin" ON template_curriculum
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'course_manager')
    )
  );

-- round_enrollments RLS
ALTER TABLE round_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "round_enrollments_read_all" ON round_enrollments;
CREATE POLICY "round_enrollments_read_all" ON round_enrollments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "round_enrollments_write_admin" ON round_enrollments;
CREATE POLICY "round_enrollments_write_admin" ON round_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'course_manager', 'instructor')
    )
  );

-- =====================================================
-- STEP 8: 코멘트 추가
-- =====================================================

COMMENT ON TABLE template_curriculum IS '과정 템플릿의 표준 커리큘럼 (일차별, 과목별)';
COMMENT ON COLUMN template_curriculum.template_id IS '과정 템플릿 ID (FK)';
COMMENT ON COLUMN template_curriculum.day IS '일차 (1일차, 2일차...)';
COMMENT ON COLUMN template_curriculum.order_index IS '같은 날 과목 순서 (1교시, 2교시...)';
COMMENT ON COLUMN template_curriculum.subject IS '과목명';
COMMENT ON COLUMN template_curriculum.subject_type IS '과목 유형: lecture, practice, evaluation, discussion, presentation';
COMMENT ON COLUMN template_curriculum.duration_hours IS '교육 시간 (예: 3.0, 1.5)';

COMMENT ON TABLE round_enrollments IS '차수별 교육생 등록 정보';
COMMENT ON COLUMN round_enrollments.round_id IS '과정 차수 ID (FK)';
COMMENT ON COLUMN round_enrollments.trainee_id IS '교육생 ID (FK)';
COMMENT ON COLUMN round_enrollments.status IS '등록 상태: active, completed, dropped, pending';

COMMENT ON VIEW course_rounds_full IS '과정 차수 전체 정보 (등록 수, 진행률 포함)';
COMMENT ON VIEW curriculum_items_full IS '커리큘럼 항목 상세 정보 (강사, 강의실, 출석 통계 포함)';

-- =====================================================
-- 완료 메시지
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 통합 과정 관리 시스템 스키마가 성공적으로 생성되었습니다.';
  RAISE NOTICE '';
  RAISE NOTICE '📋 생성된 테이블:';
  RAISE NOTICE '  - template_curriculum (과정 템플릿 커리큘럼)';
  RAISE NOTICE '  - round_enrollments (차수 교육생 등록)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 확장된 테이블:';
  RAISE NOTICE '  - course_templates (duration_days, total_hours, requirements, objectives 추가)';
  RAISE NOTICE '  - course_rounds (round_name, round_code, course_name 추가)';
  RAISE NOTICE '  - curriculum_items (round_id, template_curriculum_id, title 추가)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 생성된 트리거:';
  RAISE NOTICE '  - auto_create_curriculum_items (차수 생성 시 커리큘럼 자동 생성)';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ 생성된 뷰:';
  RAISE NOTICE '  - course_rounds_full';
  RAISE NOTICE '  - curriculum_items_full';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ 다음 단계:';
  RAISE NOTICE '  1. 기존 데이터를 template_curriculum으로 마이그레이션';
  RAISE NOTICE '  2. TypeScript 타입 정의 업데이트';
  RAISE NOTICE '  3. 서비스 레이어 리팩토링';
END $$;
