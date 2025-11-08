-- =============================================
-- Course Rounds (차수) 테이블 생성
-- =============================================

-- course_rounds 테이블 생성
CREATE TABLE IF NOT EXISTS course_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  instructor_name TEXT NOT NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  manager_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_trainees INTEGER NOT NULL DEFAULT 20,
  current_trainees INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'recruiting', 'in_progress', 'completed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 제약 조건
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_trainees CHECK (current_trainees >= 0 AND current_trainees <= max_trainees),
  CONSTRAINT valid_round_number CHECK (round_number > 0)
);

-- course_sessions 테이블 생성
CREATE TABLE IF NOT EXISTS course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES course_rounds(id) ON DELETE CASCADE,
  template_curriculum_id UUID,
  day_number INTEGER NOT NULL,
  title TEXT,
  session_date DATE NOT NULL,
  scheduled_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom TEXT NOT NULL,
  actual_instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  attendance_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 제약 조건
  CONSTRAINT valid_day_number CHECK (day_number > 0),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_course_rounds_template_id ON course_rounds(template_id);
CREATE INDEX IF NOT EXISTS idx_course_rounds_status ON course_rounds(status);
CREATE INDEX IF NOT EXISTS idx_course_rounds_start_date ON course_rounds(start_date);
CREATE INDEX IF NOT EXISTS idx_course_rounds_end_date ON course_rounds(end_date);
CREATE INDEX IF NOT EXISTS idx_course_rounds_instructor_id ON course_rounds(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_rounds_manager_id ON course_rounds(manager_id);

CREATE INDEX IF NOT EXISTS idx_course_sessions_round_id ON course_sessions(round_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_session_date ON course_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON course_sessions(status);

-- RLS (Row Level Security) 활성화
ALTER TABLE course_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "course_rounds_read_all" ON course_rounds;
DROP POLICY IF EXISTS "course_sessions_read_all" ON course_sessions;
DROP POLICY IF EXISTS "course_rounds_write_admin" ON course_rounds;
DROP POLICY IF EXISTS "course_sessions_write_admin" ON course_sessions;

-- RLS 정책: 모든 사용자가 읽기 가능
CREATE POLICY "course_rounds_read_all" ON course_rounds
  FOR SELECT USING (true);

CREATE POLICY "course_sessions_read_all" ON course_sessions
  FOR SELECT USING (true);

-- RLS 정책: 관리자와 운영자만 쓰기 가능
CREATE POLICY "course_rounds_write_admin" ON course_rounds
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('app_admin', 'course_manager')
    )
  );

CREATE POLICY "course_sessions_write_admin" ON course_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

-- 코멘트 추가
COMMENT ON TABLE course_rounds IS '과정 차수 정보 (BS Basic 1차, BS Advanced 2차 등)';
COMMENT ON TABLE course_sessions IS '차수별 개별 세션 정보 (1일차, 2일차 등)';

COMMENT ON COLUMN course_rounds.template_id IS '과정 템플릿 ID (BS Basic, BS Advanced 등)';
COMMENT ON COLUMN course_rounds.round_number IS '차수 번호 (1차, 2차, 3차...)';
COMMENT ON COLUMN course_rounds.manager_id IS '운영 담당자 ID';
COMMENT ON COLUMN course_rounds.manager_name IS '운영 담당자 이름';
COMMENT ON COLUMN course_rounds.status IS '차수 상태: planning(기획중), recruiting(모집중), in_progress(진행중), completed(완료), cancelled(취소)';

COMMENT ON COLUMN course_sessions.day_number IS '일차 번호 (1일차, 2일차...)';
COMMENT ON COLUMN course_sessions.scheduled_date IS '예정일 (session_date와 동일하거나 별칭)';
COMMENT ON COLUMN course_sessions.actual_instructor_id IS '실제 강사 ID (해당 세션만 다른 강사가 진행할 경우)';
