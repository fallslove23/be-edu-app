-- =============================================
-- Course Round Enrollments (차수 수강생 등록) 테이블 생성
-- =============================================

-- round_enrollments 테이블 생성
CREATE TABLE IF NOT EXISTS round_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES course_rounds(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  completion_date DATE,
  final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 제약 조건: 한 차수에 같은 교육생 중복 등록 방지
  UNIQUE(round_id, trainee_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_round_enrollments_round_id ON round_enrollments(round_id);
CREATE INDEX IF NOT EXISTS idx_round_enrollments_trainee_id ON round_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_round_enrollments_status ON round_enrollments(status);

-- RLS (Row Level Security) 활성화
ALTER TABLE round_enrollments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "round_enrollments_read_all" ON round_enrollments;
DROP POLICY IF EXISTS "round_enrollments_write_admin" ON round_enrollments;

-- RLS 정책: 모든 사용자가 읽기 가능
CREATE POLICY "round_enrollments_read_all" ON round_enrollments
  FOR SELECT USING (true);

-- RLS 정책: 관리자와 운영자만 쓰기 가능
CREATE POLICY "round_enrollments_write_admin" ON round_enrollments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('app_admin', 'course_manager', 'instructor')
    )
  );

-- 코멘트 추가
COMMENT ON TABLE round_enrollments IS '차수별 수강생 등록 정보';
COMMENT ON COLUMN round_enrollments.round_id IS '차수 ID (FK to course_rounds)';
COMMENT ON COLUMN round_enrollments.trainee_id IS '교육생 ID (FK to users)';
COMMENT ON COLUMN round_enrollments.status IS '수강 상태: active(수강중), completed(완료), dropped(중단)';
COMMENT ON COLUMN round_enrollments.final_score IS '최종 점수 (0-100)';

-- 트리거: current_trainees 자동 업데이트
CREATE OR REPLACE FUNCTION update_round_trainee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 새 등록 시 current_trainees 증가
    UPDATE course_rounds
    SET current_trainees = current_trainees + 1,
        updated_at = NOW()
    WHERE id = NEW.round_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 등록 해제 시 current_trainees 감소
    UPDATE course_rounds
    SET current_trainees = GREATEST(0, current_trainees - 1),
        updated_at = NOW()
    WHERE id = OLD.round_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS round_enrollment_count_trigger ON round_enrollments;
CREATE TRIGGER round_enrollment_count_trigger
  AFTER INSERT OR DELETE ON round_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_round_trainee_count();

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_round_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_round_enrollments_updated_at_trigger ON round_enrollments;
CREATE TRIGGER update_round_enrollments_updated_at_trigger
  BEFORE UPDATE ON round_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_round_enrollments_updated_at();
