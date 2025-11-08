-- =============================================
-- 간단한 시험 관리 테이블 생성 (기존 구조 호환)
-- =============================================

-- question_banks 테이블
CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES course_templates(id) ON DELETE CASCADE,
  category TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- questions 테이블
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'ordering')),
  question_text TEXT NOT NULL,
  question_html TEXT,
  options JSONB,
  correct_answer JSONB,
  points DECIMAL(5,2) DEFAULT 1.0,
  explanation TEXT,
  explanation_html TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  estimated_time_seconds INTEGER,
  usage_count INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- exams 테이블 (course_rounds 기반)
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('final', 'midterm', 'quiz', 'daily_test', 'practice', 'assignment')),

  -- 기존 구조에 맞춤: course_rounds 사용
  template_id UUID REFERENCES course_templates(id),
  round_id UUID REFERENCES course_rounds(id),
  bank_id UUID REFERENCES question_banks(id),

  -- 일정
  scheduled_at TIMESTAMPTZ,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,

  -- 시험 설정
  duration_minutes INTEGER NOT NULL,
  passing_score DECIMAL(5,2) DEFAULT 70.0,
  total_points DECIMAL(5,2) DEFAULT 100.0,

  -- 응시 설정
  max_attempts INTEGER DEFAULT 1,
  allow_review BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT false,
  randomize_questions BOOLEAN DEFAULT false,
  randomize_options BOOLEAN DEFAULT false,

  -- 상태
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived')),

  instructions TEXT,
  proctoring_required BOOLEAN DEFAULT false,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- exam_questions 테이블
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  points DECIMAL(5,2) NOT NULL,
  is_required BOOLEAN DEFAULT true,
  UNIQUE(exam_id, question_id),
  UNIQUE(exam_id, order_index)
);

-- exam_attempts 테이블
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,

  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,

  score DECIMAL(5,2),
  score_percentage DECIMAL(5,2),
  passed BOOLEAN,
  grade TEXT,

  answers JSONB,

  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'needs_grading')),

  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  feedback TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(exam_id, trainee_id, attempt_number)
);

-- question_responses 테이블
CREATE TABLE IF NOT EXISTS question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),

  answer JSONB,
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2),

  needs_manual_grading BOOLEAN DEFAULT false,
  grader_feedback TEXT,

  answered_at TIMESTAMPTZ,

  UNIQUE(attempt_id, question_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_question_banks_template ON question_banks(template_id);
CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);

CREATE INDEX IF NOT EXISTS idx_exams_template ON exams(template_id);
CREATE INDEX IF NOT EXISTS idx_exams_round ON exams(round_id);
CREATE INDEX IF NOT EXISTS idx_exams_bank ON exams(bank_id);
CREATE INDEX IF NOT EXISTS idx_exams_scheduled ON exams(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_type ON exams(exam_type);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question ON exam_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_trainee ON exam_attempts(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON exam_attempts(status);

CREATE INDEX IF NOT EXISTS idx_responses_attempt ON question_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON question_responses(question_id);

-- RLS 활성화
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;

-- 기본 읽기 정책 (모든 인증된 사용자)
DROP POLICY IF EXISTS "question_banks_read_all" ON question_banks;
DROP POLICY IF EXISTS "questions_read_all" ON questions;
DROP POLICY IF EXISTS "exams_read_all" ON exams;
DROP POLICY IF EXISTS "exam_questions_read_all" ON exam_questions;

CREATE POLICY "question_banks_read_all" ON question_banks FOR SELECT USING (true);
CREATE POLICY "questions_read_all" ON questions FOR SELECT USING (true);
CREATE POLICY "exams_read_all" ON exams FOR SELECT USING (true);
CREATE POLICY "exam_questions_read_all" ON exam_questions FOR SELECT USING (true);

-- 시험 응시 정책
DROP POLICY IF EXISTS "exam_attempts_read" ON exam_attempts;
DROP POLICY IF EXISTS "exam_attempts_write" ON exam_attempts;

CREATE POLICY "exam_attempts_read" ON exam_attempts
  FOR SELECT
  USING (
    trainee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

CREATE POLICY "exam_attempts_write" ON exam_attempts
  FOR ALL
  USING (
    trainee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

-- 문제 응답 정책
DROP POLICY IF EXISTS "question_responses_read" ON question_responses;
DROP POLICY IF EXISTS "question_responses_write" ON question_responses;

CREATE POLICY "question_responses_read" ON question_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      WHERE ea.id = attempt_id
      AND (
        ea.trainee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('app_admin', 'course_manager', 'instructor')
        )
      )
    )
  );

CREATE POLICY "question_responses_write" ON question_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts ea
      WHERE ea.id = attempt_id
      AND (
        ea.trainee_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('app_admin', 'course_manager', 'instructor')
        )
      )
    )
  );

-- 관리자/강사 수정 정책
DROP POLICY IF EXISTS "exams_write" ON exams;
CREATE POLICY "exams_write" ON exams
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

COMMENT ON TABLE exams IS '시험 정보 (course_rounds 기반)';
COMMENT ON COLUMN exams.round_id IS '과정 차수 ID (course_rounds 참조)';
