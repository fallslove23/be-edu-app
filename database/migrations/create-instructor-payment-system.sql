-- 강사 강의 시간 집계 및 강사료 계산 시스템
-- Mock Auth 버전 (RLS 비활성화)

-- 1. 강사 세션 기록 테이블 (course_sessions 확장)
-- course_sessions 테이블에 필드 추가
ALTER TABLE course_sessions
ADD COLUMN IF NOT EXISTS session_category VARCHAR(20) DEFAULT 'lecture', -- 'lecture' (이론) 또는 'practice' (실기)
ADD COLUMN IF NOT EXISTS primary_instructor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 주강사
ADD COLUMN IF NOT EXISTS assistant_instructor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 보조강사
ADD COLUMN IF NOT EXISTS actual_duration_hours DECIMAL(4, 2), -- 실제 강의 시간 (시간 단위)
ADD COLUMN IF NOT EXISTS is_payment_confirmed BOOLEAN DEFAULT false, -- 강사료 지급 확정 여부
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE, -- 강사료 확정 시간
ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL; -- 확정한 관리자

-- 2. 강사 강의 집계 테이블
CREATE TABLE IF NOT EXISTS instructor_teaching_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE NOT NULL,
  instructor_type VARCHAR(20) NOT NULL, -- 'primary' (주강사) 또는 'assistant' (보조강사)

  -- 시간 집계
  total_lecture_hours DECIMAL(10, 2) DEFAULT 0, -- 이론 시간
  total_practice_hours DECIMAL(10, 2) DEFAULT 0, -- 실기 시간
  total_hours DECIMAL(10, 2) DEFAULT 0, -- 총 시간
  session_count INTEGER DEFAULT 0, -- 총 세션 수

  -- 강사료 계산
  hourly_rate DECIMAL(10, 2) NOT NULL, -- 시간당 강사료 (주강사: 10,000원, 보조강사: 5,000원)
  total_payment DECIMAL(12, 2) DEFAULT 0, -- 총 강사료

  -- 상태
  is_finalized BOOLEAN DEFAULT false, -- 집계 확정 여부
  finalized_at TIMESTAMP WITH TIME ZONE, -- 확정 시간
  finalized_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 확정한 관리자

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_instructor_course_type UNIQUE (instructor_id, course_round_id, instructor_type)
);

-- 3. 강사료 지급 이력 테이블
CREATE TABLE IF NOT EXISTS instructor_payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE NOT NULL,
  summary_id UUID REFERENCES instructor_teaching_summary(id) ON DELETE CASCADE,

  -- 지급 정보
  payment_amount DECIMAL(12, 2) NOT NULL, -- 지급 금액
  payment_date DATE NOT NULL, -- 지급일
  payment_method VARCHAR(50), -- 지급 방법 (계좌이체, 현금 등)
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'

  -- 세부 내역
  lecture_hours DECIMAL(10, 2), -- 이론 시간
  practice_hours DECIMAL(10, 2), -- 실기 시간
  total_hours DECIMAL(10, 2), -- 총 시간
  hourly_rate DECIMAL(10, 2), -- 시간당 단가

  -- 메타데이터
  notes TEXT, -- 비고
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- 생성자
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructor_teaching_summary_instructor ON instructor_teaching_summary(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_teaching_summary_course ON instructor_teaching_summary(course_round_id);
CREATE INDEX IF NOT EXISTS idx_instructor_teaching_summary_finalized ON instructor_teaching_summary(is_finalized);
CREATE INDEX IF NOT EXISTS idx_instructor_payment_history_instructor ON instructor_payment_history(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payment_history_course ON instructor_payment_history(course_round_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payment_history_status ON instructor_payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_instructor_payment_history_date ON instructor_payment_history(payment_date);

-- course_sessions 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_course_sessions_primary_instructor ON course_sessions(primary_instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_assistant_instructor ON course_sessions(assistant_instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_payment_confirmed ON course_sessions(is_payment_confirmed);

-- RLS 비활성화 (Mock Auth 사용)
ALTER TABLE instructor_teaching_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_payment_history DISABLE ROW LEVEL SECURITY;

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_instructor_teaching_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS instructor_teaching_summary_updated_at ON instructor_teaching_summary;
CREATE TRIGGER instructor_teaching_summary_updated_at
  BEFORE UPDATE ON instructor_teaching_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_teaching_summary_updated_at();

CREATE OR REPLACE FUNCTION update_instructor_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS instructor_payment_history_updated_at ON instructor_payment_history;
CREATE TRIGGER instructor_payment_history_updated_at
  BEFORE UPDATE ON instructor_payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_payment_history_updated_at();

-- 함수: 강사 강의 시간 집계 (특정 과정)
CREATE OR REPLACE FUNCTION calculate_instructor_hours(
  p_course_round_id UUID,
  p_instructor_id UUID,
  p_instructor_type VARCHAR
)
RETURNS TABLE(
  lecture_hours DECIMAL,
  practice_hours DECIMAL,
  total_hours DECIMAL,
  session_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN session_category = 'lecture' THEN COALESCE(actual_duration_hours, EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600) ELSE 0 END), 0)::DECIMAL(10,2) as lecture_hours,
    COALESCE(SUM(CASE WHEN session_category = 'practice' THEN COALESCE(actual_duration_hours, EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600) ELSE 0 END), 0)::DECIMAL(10,2) as practice_hours,
    COALESCE(SUM(COALESCE(actual_duration_hours, EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600)), 0)::DECIMAL(10,2) as total_hours,
    COUNT(*)::INTEGER as session_count
  FROM course_sessions
  WHERE round_id = p_course_round_id
  AND status = 'completed'
  AND (
    (p_instructor_type = 'primary' AND primary_instructor_id = p_instructor_id) OR
    (p_instructor_type = 'assistant' AND assistant_instructor_id = p_instructor_id)
  );
END;
$$ LANGUAGE plpgsql;

-- 함수: 강사료 계산
CREATE OR REPLACE FUNCTION calculate_instructor_payment(
  p_total_hours DECIMAL,
  p_instructor_type VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  hourly_rate DECIMAL;
BEGIN
  -- 주강사: 10,000원/시간, 보조강사: 5,000원/시간
  IF p_instructor_type = 'primary' THEN
    hourly_rate := 10000;
  ELSIF p_instructor_type = 'assistant' THEN
    hourly_rate := 5000;
  ELSE
    hourly_rate := 0;
  END IF;

  RETURN (p_total_hours * hourly_rate)::DECIMAL(12,2);
END;
$$ LANGUAGE plpgsql;

-- 함수: 강사 집계 업데이트 (특정 과정의 모든 강사)
CREATE OR REPLACE FUNCTION update_instructor_summaries(p_course_round_id UUID)
RETURNS INTEGER AS $$
DECLARE
  instructor_record RECORD;
  hours_record RECORD;
  hourly_rate DECIMAL;
  updated_count INTEGER := 0;
BEGIN
  -- 주강사 집계
  FOR instructor_record IN
    SELECT DISTINCT primary_instructor_id as instructor_id
    FROM course_sessions
    WHERE round_id = p_course_round_id
    AND primary_instructor_id IS NOT NULL
    AND status = 'completed'
  LOOP
    -- 시간 계산
    SELECT * INTO hours_record
    FROM calculate_instructor_hours(p_course_round_id, instructor_record.instructor_id, 'primary');

    hourly_rate := 10000; -- 주강사 시간당 10,000원

    -- INSERT or UPDATE
    INSERT INTO instructor_teaching_summary (
      instructor_id,
      course_round_id,
      instructor_type,
      total_lecture_hours,
      total_practice_hours,
      total_hours,
      session_count,
      hourly_rate,
      total_payment
    ) VALUES (
      instructor_record.instructor_id,
      p_course_round_id,
      'primary',
      hours_record.lecture_hours,
      hours_record.practice_hours,
      hours_record.total_hours,
      hours_record.session_count,
      hourly_rate,
      hours_record.total_hours * hourly_rate
    )
    ON CONFLICT (instructor_id, course_round_id, instructor_type)
    DO UPDATE SET
      total_lecture_hours = EXCLUDED.total_lecture_hours,
      total_practice_hours = EXCLUDED.total_practice_hours,
      total_hours = EXCLUDED.total_hours,
      session_count = EXCLUDED.session_count,
      total_payment = EXCLUDED.total_payment,
      updated_at = NOW();

    updated_count := updated_count + 1;
  END LOOP;

  -- 보조강사 집계
  FOR instructor_record IN
    SELECT DISTINCT assistant_instructor_id as instructor_id
    FROM course_sessions
    WHERE round_id = p_course_round_id
    AND assistant_instructor_id IS NOT NULL
    AND status = 'completed'
  LOOP
    -- 시간 계산
    SELECT * INTO hours_record
    FROM calculate_instructor_hours(p_course_round_id, instructor_record.instructor_id, 'assistant');

    hourly_rate := 5000; -- 보조강사 시간당 5,000원

    -- INSERT or UPDATE
    INSERT INTO instructor_teaching_summary (
      instructor_id,
      course_round_id,
      instructor_type,
      total_lecture_hours,
      total_practice_hours,
      total_hours,
      session_count,
      hourly_rate,
      total_payment
    ) VALUES (
      instructor_record.instructor_id,
      p_course_round_id,
      'assistant',
      hours_record.lecture_hours,
      hours_record.practice_hours,
      hours_record.total_hours,
      hours_record.session_count,
      hourly_rate,
      hours_record.total_hours * hourly_rate
    )
    ON CONFLICT (instructor_id, course_round_id, instructor_type)
    DO UPDATE SET
      total_lecture_hours = EXCLUDED.total_lecture_hours,
      total_practice_hours = EXCLUDED.total_practice_hours,
      total_hours = EXCLUDED.total_hours,
      session_count = EXCLUDED.session_count,
      total_payment = EXCLUDED.total_payment,
      updated_at = NOW();

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE instructor_teaching_summary IS '강사별 강의 시간 및 강사료 집계';
COMMENT ON TABLE instructor_payment_history IS '강사료 지급 이력';
COMMENT ON COLUMN course_sessions.session_category IS '세션 유형: lecture (이론), practice (실기)';
COMMENT ON COLUMN course_sessions.primary_instructor_id IS '주강사 (시간당 10,000원)';
COMMENT ON COLUMN course_sessions.assistant_instructor_id IS '보조강사 (시간당 5,000원)';
COMMENT ON COLUMN instructor_teaching_summary.instructor_type IS '강사 유형: primary (주강사), assistant (보조강사)';
