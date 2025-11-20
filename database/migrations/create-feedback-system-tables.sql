-- =============================================
-- 만족도 평가 시스템 테이블 생성
-- 외부 평가 앱(sseducationfeedback.info)용
-- =============================================

-- 1. 과정 만족도 평가
CREATE TABLE IF NOT EXISTS course_satisfactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_round_id UUID NOT NULL,
  trainee_id UUID NOT NULL,

  -- 과정 정보
  course_name TEXT NOT NULL,
  course_period TEXT NOT NULL,

  -- 평가 항목 (1-5점)
  content_quality DECIMAL(3,1) NOT NULL CHECK (content_quality >= 1 AND content_quality <= 5),
  difficulty_level DECIMAL(3,1) NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  practical_applicability DECIMAL(3,1) NOT NULL CHECK (practical_applicability >= 1 AND practical_applicability <= 5),
  materials_quality DECIMAL(3,1) NOT NULL CHECK (materials_quality >= 1 AND materials_quality <= 5),
  facility_satisfaction DECIMAL(3,1) NOT NULL CHECK (facility_satisfaction >= 1 AND facility_satisfaction <= 5),

  -- 종합 만족도
  overall_satisfaction DECIMAL(3,1) NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),

  -- 주관식 피드백
  strengths TEXT,
  improvements TEXT,
  suggestions TEXT,

  -- 메타데이터
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 중복 방지 (1인 1회 평가)
  UNIQUE(course_round_id, trainee_id)
);

-- 2. 강사 만족도 평가
CREATE TABLE IF NOT EXISTS instructor_satisfactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_round_id UUID NOT NULL,
  trainee_id UUID NOT NULL,
  instructor_id UUID NOT NULL,

  -- 강사 정보
  instructor_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,

  -- 평가 항목 (1-5점)
  teaching_skill DECIMAL(3,1) NOT NULL CHECK (teaching_skill >= 1 AND teaching_skill <= 5),
  communication DECIMAL(3,1) NOT NULL CHECK (communication >= 1 AND communication <= 5),
  preparation DECIMAL(3,1) NOT NULL CHECK (preparation >= 1 AND preparation <= 5),
  response_to_questions DECIMAL(3,1) NOT NULL CHECK (response_to_questions >= 1 AND response_to_questions <= 5),
  enthusiasm DECIMAL(3,1) NOT NULL CHECK (enthusiasm >= 1 AND enthusiasm <= 5),

  -- 종합 만족도
  overall_satisfaction DECIMAL(3,1) NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),

  -- 주관식 피드백
  strengths TEXT,
  improvements TEXT,

  -- 메타데이터
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 중복 방지 (1인 1강사 1회 평가)
  UNIQUE(course_round_id, trainee_id, instructor_id)
);

-- 3. 운영 만족도 평가
CREATE TABLE IF NOT EXISTS operation_satisfactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_round_id UUID NOT NULL,
  trainee_id UUID NOT NULL,

  -- 평가 항목 (1-5점)
  registration_process DECIMAL(3,1) NOT NULL CHECK (registration_process >= 1 AND registration_process <= 5),
  schedule_management DECIMAL(3,1) NOT NULL CHECK (schedule_management >= 1 AND schedule_management <= 5),
  communication DECIMAL(3,1) NOT NULL CHECK (communication >= 1 AND communication <= 5),
  administrative_support DECIMAL(3,1) NOT NULL CHECK (administrative_support >= 1 AND administrative_support <= 5),
  facility_management DECIMAL(3,1) NOT NULL CHECK (facility_management >= 1 AND facility_management <= 5),

  -- 종합 만족도
  overall_satisfaction DECIMAL(3,1) NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),

  -- 주관식 피드백
  strengths TEXT,
  improvements TEXT,

  -- 메타데이터
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 중복 방지 (1인 1회 평가)
  UNIQUE(course_round_id, trainee_id)
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 과정 만족도
CREATE INDEX IF NOT EXISTS idx_course_satisfactions_round ON course_satisfactions(course_round_id);
CREATE INDEX IF NOT EXISTS idx_course_satisfactions_trainee ON course_satisfactions(trainee_id);
CREATE INDEX IF NOT EXISTS idx_course_satisfactions_submitted ON course_satisfactions(submitted_at);

-- 강사 만족도
CREATE INDEX IF NOT EXISTS idx_instructor_satisfactions_round ON instructor_satisfactions(course_round_id);
CREATE INDEX IF NOT EXISTS idx_instructor_satisfactions_trainee ON instructor_satisfactions(trainee_id);
CREATE INDEX IF NOT EXISTS idx_instructor_satisfactions_instructor ON instructor_satisfactions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_satisfactions_submitted ON instructor_satisfactions(submitted_at);

-- 운영 만족도
CREATE INDEX IF NOT EXISTS idx_operation_satisfactions_round ON operation_satisfactions(course_round_id);
CREATE INDEX IF NOT EXISTS idx_operation_satisfactions_trainee ON operation_satisfactions(trainee_id);
CREATE INDEX IF NOT EXISTS idx_operation_satisfactions_submitted ON operation_satisfactions(submitted_at);

-- =============================================
-- RLS 정책
-- =============================================

-- 과정 만족도: 본인과 관리자만 조회
ALTER TABLE course_satisfactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_satisfactions_read" ON course_satisfactions
  FOR SELECT
  USING (
    trainee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

CREATE POLICY "course_satisfactions_insert" ON course_satisfactions
  FOR INSERT
  WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "course_satisfactions_update" ON course_satisfactions
  FOR UPDATE
  USING (trainee_id = auth.uid())
  WITH CHECK (trainee_id = auth.uid());

-- 강사 만족도: 본인, 해당 강사, 관리자만 조회
ALTER TABLE instructor_satisfactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructor_satisfactions_read" ON instructor_satisfactions
  FOR SELECT
  USING (
    trainee_id = auth.uid() OR
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager')
    )
  );

CREATE POLICY "instructor_satisfactions_insert" ON instructor_satisfactions
  FOR INSERT
  WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "instructor_satisfactions_update" ON instructor_satisfactions
  FOR UPDATE
  USING (trainee_id = auth.uid())
  WITH CHECK (trainee_id = auth.uid());

-- 운영 만족도: 본인과 관리자만 조회
ALTER TABLE operation_satisfactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "operation_satisfactions_read" ON operation_satisfactions
  FOR SELECT
  USING (
    trainee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'operator')
    )
  );

CREATE POLICY "operation_satisfactions_insert" ON operation_satisfactions
  FOR INSERT
  WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "operation_satisfactions_update" ON operation_satisfactions
  FOR UPDATE
  USING (trainee_id = auth.uid())
  WITH CHECK (trainee_id = auth.uid());

-- =============================================
-- 코멘트
-- =============================================

COMMENT ON TABLE course_satisfactions IS '과정 만족도 평가 (교육 내용, 난이도, 자료 등)';
COMMENT ON TABLE instructor_satisfactions IS '강사 만족도 평가 (강의력, 소통, 준비도 등)';
COMMENT ON TABLE operation_satisfactions IS '운영 만족도 평가 (등록 절차, 일정 관리, 행정 지원 등)';

COMMENT ON COLUMN course_satisfactions.content_quality IS '교육 내용의 질 (1-5점)';
COMMENT ON COLUMN course_satisfactions.difficulty_level IS '난이도 적절성 (1-5점)';
COMMENT ON COLUMN course_satisfactions.practical_applicability IS '실무 적용 가능성 (1-5점)';
COMMENT ON COLUMN course_satisfactions.materials_quality IS '교재/자료의 질 (1-5점)';
COMMENT ON COLUMN course_satisfactions.facility_satisfaction IS '시설 만족도 (1-5점)';

COMMENT ON COLUMN instructor_satisfactions.teaching_skill IS '강의 능력 (1-5점)';
COMMENT ON COLUMN instructor_satisfactions.communication IS '의사소통 (1-5점)';
COMMENT ON COLUMN instructor_satisfactions.preparation IS '수업 준비도 (1-5점)';
COMMENT ON COLUMN instructor_satisfactions.response_to_questions IS '질문 대응력 (1-5점)';
COMMENT ON COLUMN instructor_satisfactions.enthusiasm IS '열정 (1-5점)';

COMMENT ON COLUMN operation_satisfactions.registration_process IS '등록 절차 (1-5점)';
COMMENT ON COLUMN operation_satisfactions.schedule_management IS '일정 관리 (1-5점)';
COMMENT ON COLUMN operation_satisfactions.communication IS '소통 및 공지 (1-5점)';
COMMENT ON COLUMN operation_satisfactions.administrative_support IS '행정 지원 (1-5점)';
COMMENT ON COLUMN operation_satisfactions.facility_management IS '시설 관리 (1-5점)';

-- =============================================
-- 샘플 데이터 (테스트용)
-- =============================================

-- 샘플 데이터는 평가 앱에서 직접 입력하도록 유도
-- 실제 운영에서는 교육생들이 평가 앱을 통해 데이터 입력
