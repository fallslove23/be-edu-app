-- 커리큘럼 템플릿 시스템 테이블 생성
-- 자주 사용하는 시간표를 템플릿으로 저장하고 재사용할 수 있는 기능

-- 1. 커리큘럼 템플릿 메타데이터 테이블
CREATE TABLE IF NOT EXISTS curriculum_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 예: 'BS 영업', 'BS 관리', 'BS 교육' 등
  total_hours DECIMAL(10, 2), -- 총 교육 시간
  session_count INTEGER, -- 총 차시 수
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- 기본 템플릿 여부
  usage_count INTEGER DEFAULT 0 -- 사용 횟수
);

-- 2. 커리큘럼 템플릿 세션 테이블
CREATE TABLE IF NOT EXISTS curriculum_template_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES curriculum_templates(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- 차시 번호
  title VARCHAR(255) NOT NULL, -- 수업 제목
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL, -- 과목 (선택)
  duration_hours DECIMAL(4, 2) NOT NULL DEFAULT 1.0, -- 수업 시간 (시간)
  default_start_time TIME, -- 기본 시작 시간 (선택)
  default_end_time TIME, -- 기본 종료 시간 (선택)
  session_type VARCHAR(50) DEFAULT 'lecture', -- 'lecture', 'practice', 'exam', 'discussion'
  notes TEXT, -- 비고
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_template_session UNIQUE (template_id, day_number)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_category ON curriculum_templates(category);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_active ON curriculum_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_created_by ON curriculum_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_curriculum_template_sessions_template ON curriculum_template_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_template_sessions_day ON curriculum_template_sessions(template_id, day_number);

-- RLS (Row Level Security) 정책
ALTER TABLE curriculum_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_template_sessions ENABLE ROW LEVEL SECURITY;

-- 조회 정책: 모든 인증된 사용자는 활성화된 템플릿을 볼 수 있음
CREATE POLICY "Everyone can view active templates"
  ON curriculum_templates FOR SELECT
  USING (is_active = true OR auth.uid() = created_by);

-- 생성 정책: 관리자, 매니저, 운영자만 템플릿 생성 가능
CREATE POLICY "Admins and managers can create templates"
  ON curriculum_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'operator')
    )
  );

-- 수정 정책: 생성자 또는 관리자만 수정 가능
CREATE POLICY "Creators and admins can update templates"
  ON curriculum_templates FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 삭제 정책: 생성자 또는 관리자만 삭제 가능
CREATE POLICY "Creators and admins can delete templates"
  ON curriculum_templates FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 템플릿 세션 조회 정책
CREATE POLICY "Everyone can view template sessions"
  ON curriculum_template_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM curriculum_templates
      WHERE curriculum_templates.id = template_id
      AND (is_active = true OR created_by = auth.uid())
    )
  );

-- 템플릿 세션 생성/수정/삭제 정책: 템플릿 생성자 또는 관리자만 가능
CREATE POLICY "Template creators can manage sessions"
  ON curriculum_template_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM curriculum_templates
      WHERE curriculum_templates.id = template_id
      AND (
        curriculum_templates.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'admin'
        )
      )
    )
  );

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_curriculum_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER curriculum_template_updated_at
  BEFORE UPDATE ON curriculum_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_curriculum_template_updated_at();

-- 샘플 템플릿 데이터 (선택)
-- INSERT INTO curriculum_templates (name, description, category, total_hours, session_count, is_default)
-- VALUES
--   ('기본 BS 영업 과정', 'BS 영업 교육을 위한 기본 템플릿', 'BS 영업', 40.0, 20, true),
--   ('기본 BS 관리 과정', 'BS 관리 교육을 위한 기본 템플릿', 'BS 관리', 32.0, 16, true);

COMMENT ON TABLE curriculum_templates IS '커리큘럼 템플릿 메타데이터';
COMMENT ON TABLE curriculum_template_sessions IS '커리큘럼 템플릿 세션 상세';
COMMENT ON COLUMN curriculum_templates.usage_count IS '템플릿이 사용된 횟수';
COMMENT ON COLUMN curriculum_templates.is_default IS '시스템 기본 템플릿 여부';
COMMENT ON COLUMN curriculum_template_sessions.session_type IS '세션 유형: lecture, practice, exam, discussion';
