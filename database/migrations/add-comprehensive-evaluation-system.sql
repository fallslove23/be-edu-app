-- =============================================
-- 종합 평가 시스템 추가 (실기, 태도, 활동일지 등)
-- 기존 exam 테이블과 함께 사용
-- =============================================

-- 1. 평가 템플릿 (과정별 평가 기준 정의)
CREATE TABLE IF NOT EXISTS evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_template_id UUID REFERENCES course_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- 수료 조건
  passing_total_score DECIMAL(5,2) DEFAULT 80.0,

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_template_id, version)
);

-- 2. 평가 구성 요소 (실기평가 50%, 이론평가 30% 등)
CREATE TABLE IF NOT EXISTS evaluation_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES evaluation_templates(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- "실기평가", "이론평가", "태도점수", "BS 활동일지"
  code TEXT NOT NULL, -- "practical", "theory", "attitude", "journal"
  description TEXT,

  -- 가중치 (%)
  weight_percentage DECIMAL(5,2) NOT NULL, -- 50, 30, 20, 10 등
  max_score DECIMAL(5,2) DEFAULT 100.0,

  -- 평가 방식
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN (
    'instructor_manual',  -- 강사가 수동으로 입력 (실기, 태도)
    'exam_auto',          -- 시험 자동 채점 (이론)
    'activity_auto',      -- 활동 자동 집계 (활동일지)
    'peer_review',        -- 동료 평가
    'self_assessment'     -- 자가 평가
  )),

  -- 강사 평가인 경우
  instructor_config JSONB, -- {
    -- "instructors": [
    --   {"instructor_id": "uuid", "name": "김경훈", "weight": 20},
    --   {"instructor_id": "uuid", "name": "이웅진", "weight": 20}
    -- ],
    -- "sub_items": [...] -- 아래 테이블로 대체
  -- }

  -- 자동 평가인 경우
  auto_calc_config JSONB, -- {
    --   "source": "exam_attempts",
    --   "calculation": "average",
    --   "filters": {"exam_type": "midterm"}
    -- }

  -- 순서
  order_index INTEGER,
  is_required BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, code)
);

-- 3. 세부 평가 항목 (기본지식 5점, 표현법 5점 등)
CREATE TABLE IF NOT EXISTS evaluation_sub_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES evaluation_components(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- "기본지식", "표현법", "논리력" 등
  code TEXT NOT NULL, -- "basic_knowledge", "expression" 등
  description TEXT,
  max_score DECIMAL(5,2) DEFAULT 5.0,

  order_index INTEGER,
  is_required BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(component_id, code)
);

-- 4. 강사 평가 점수 (실기평가, 태도점수 등)
CREATE TABLE IF NOT EXISTS instructor_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 어떤 과정의 어떤 학생을 평가하는가
  course_round_id UUID NOT NULL REFERENCES course_rounds(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 어떤 평가 항목인가
  component_id UUID NOT NULL REFERENCES evaluation_components(id) ON DELETE CASCADE,

  -- 누가 평가했는가
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_name TEXT NOT NULL,

  -- 강사의 가중치 (김경훈 20%, 이웅진 20% 등)
  weight_percentage DECIMAL(5,2) NOT NULL,

  -- 세부 항목별 점수
  sub_item_scores JSONB NOT NULL, -- [
    -- {"sub_item_id": "uuid", "name": "기본지식", "score": 3, "max_score": 5},
    -- {"sub_item_id": "uuid", "name": "표현법", "score": 5, "max_score": 5}
  -- ]

  -- 총점 (세부 항목 합산)
  total_score DECIMAL(5,2) NOT NULL,
  max_possible_score DECIMAL(5,2) NOT NULL,

  -- 피드백
  feedback TEXT,
  notes TEXT,

  -- 평가 일시
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_round_id, trainee_id, component_id, instructor_id)
);

-- 5. 최종 종합 성적 (모든 평가 항목 집계)
CREATE TABLE IF NOT EXISTS comprehensive_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  course_round_id UUID NOT NULL REFERENCES course_rounds(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES evaluation_templates(id),

  -- 구성 요소별 점수 (실기, 이론, 태도, 활동일지)
  component_scores JSONB NOT NULL, -- [
    -- {
    --   "component_id": "uuid",
    --   "name": "실기평가",
    --   "code": "practical",
    --   "weight": 50,
    --   "raw_score": 87.6,  -- 실제 받은 점수 (100점 만점)
    --   "weighted_score": 43.8,  -- 가중치 적용 (50%)
    --   "breakdown": {  -- 강사별 또는 세부 항목별
    --     "김경훈": {"score": 18, "weight": 20},
    --     "이웅진": {"score": 22, "weight": 20}
    --   }
    -- },
    -- {
    --   "component_id": "uuid",
    --   "name": "이론평가",
    --   "code": "theory",
    --   "weight": 30,
    --   "raw_score": 91.0,
    --   "weighted_score": 27.3,
    --   "breakdown": {
    --     "exam_id": "uuid",
    --     "exam_title": "중간고사"
    --   }
    -- }
  -- ]

  -- 최종 점수
  total_score DECIMAL(5,2) NOT NULL, -- 87.6
  total_weighted_score DECIMAL(5,2) NOT NULL, -- 87.6 (동일, 가중치 합이 100%이므로)

  -- 수료 여부
  passing_score DECIMAL(5,2), -- 80.0
  is_passed BOOLEAN,

  -- 등수 (과정 내)
  rank INTEGER,
  total_trainees INTEGER,

  -- 메타데이터
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_method TEXT, -- "auto", "manual_override"
  override_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(course_round_id, trainee_id)
);

-- 6. 평가 히스토리 (성적 변경 이력)
CREATE TABLE IF NOT EXISTS evaluation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  grade_id UUID REFERENCES comprehensive_grades(id) ON DELETE CASCADE,

  -- 변경 전/후
  old_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  old_passed BOOLEAN,
  new_passed BOOLEAN,

  -- 변경 사유
  change_reason TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성
-- =============================================

CREATE INDEX IF NOT EXISTS idx_eval_templates_course ON evaluation_templates(course_template_id);
CREATE INDEX IF NOT EXISTS idx_eval_components_template ON evaluation_components(template_id);
CREATE INDEX IF NOT EXISTS idx_eval_components_type ON evaluation_components(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_eval_sub_items_component ON evaluation_sub_items(component_id);

CREATE INDEX IF NOT EXISTS idx_instructor_eval_round ON instructor_evaluations(course_round_id);
CREATE INDEX IF NOT EXISTS idx_instructor_eval_trainee ON instructor_evaluations(trainee_id);
CREATE INDEX IF NOT EXISTS idx_instructor_eval_component ON instructor_evaluations(component_id);
CREATE INDEX IF NOT EXISTS idx_instructor_eval_instructor ON instructor_evaluations(instructor_id);

CREATE INDEX IF NOT EXISTS idx_comprehensive_grades_round ON comprehensive_grades(course_round_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_grades_trainee ON comprehensive_grades(trainee_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_grades_template ON comprehensive_grades(template_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_grades_passed ON comprehensive_grades(is_passed);

CREATE INDEX IF NOT EXISTS idx_eval_history_grade ON evaluation_history(grade_id);

-- =============================================
-- RLS 정책
-- =============================================

-- 평가 템플릿: 모든 인증 사용자 읽기
ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluation_templates_read_all" ON evaluation_templates FOR SELECT USING (true);
CREATE POLICY "evaluation_templates_write_admin" ON evaluation_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

-- 평가 구성 요소: 모든 인증 사용자 읽기
ALTER TABLE evaluation_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluation_components_read_all" ON evaluation_components FOR SELECT USING (true);
CREATE POLICY "evaluation_components_write_admin" ON evaluation_components FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

-- 세부 항목: 모든 인증 사용자 읽기
ALTER TABLE evaluation_sub_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluation_sub_items_read_all" ON evaluation_sub_items FOR SELECT USING (true);
CREATE POLICY "evaluation_sub_items_write_admin" ON evaluation_sub_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

-- 강사 평가: 강사와 관리자만 쓰기, 본인과 관리자만 읽기
ALTER TABLE instructor_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructor_evaluations_read" ON instructor_evaluations
  FOR SELECT
  USING (
    trainee_id = auth.uid() OR
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

CREATE POLICY "instructor_evaluations_write" ON instructor_evaluations
  FOR ALL
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

-- 종합 성적: 본인과 관리자만 읽기
ALTER TABLE comprehensive_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comprehensive_grades_read" ON comprehensive_grades
  FOR SELECT
  USING (
    trainee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

CREATE POLICY "comprehensive_grades_write_admin" ON comprehensive_grades
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

-- 평가 히스토리: 관리자만 접근
ALTER TABLE evaluation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluation_history_read_admin" ON evaluation_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

CREATE POLICY "evaluation_history_write_admin" ON evaluation_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

-- =============================================
-- 코멘트
-- =============================================

COMMENT ON TABLE evaluation_templates IS '평가 템플릿 (과정별 평가 기준)';
COMMENT ON TABLE evaluation_components IS '평가 구성 요소 (실기 50%, 이론 30% 등)';
COMMENT ON TABLE evaluation_sub_items IS '세부 평가 항목 (기본지식 5점, 표현법 5점 등)';
COMMENT ON TABLE instructor_evaluations IS '강사별 평가 점수';
COMMENT ON TABLE comprehensive_grades IS '최종 종합 성적';
COMMENT ON TABLE evaluation_history IS '평가 변경 이력';

-- =============================================
-- 샘플 데이터 (BS Basic 과정)
-- =============================================

-- BS Basic 평가 템플릿
INSERT INTO evaluation_templates (
  id,
  course_template_id,
  name,
  description,
  passing_total_score
)
SELECT
  gen_random_uuid(),
  ct.id,
  'BS Basic 표준 평가',
  '실기 50% + 이론 30% + 태도 20%',
  80.0
FROM course_templates ct
WHERE ct.name LIKE '%BS Basic%'
ON CONFLICT DO NOTHING;

-- BS Advanced 평가 템플릿
INSERT INTO evaluation_templates (
  id,
  course_template_id,
  name,
  description,
  passing_total_score
)
SELECT
  gen_random_uuid(),
  ct.id,
  'BS Advanced 표준 평가',
  '실기 50% + 이론 30% + 태도 10% + BS 활동일지 10%',
  80.0
FROM course_templates ct
WHERE ct.name LIKE '%BS Advanced%'
ON CONFLICT DO NOTHING;

-- 평가 구성 요소는 애플리케이션에서 UI를 통해 생성하도록 유도
-- (확장성을 위해 수동 샘플 데이터는 최소화)
