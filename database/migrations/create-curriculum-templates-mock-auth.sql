-- 커리큘럼 템플릿 시스템 테이블 생성 (Mock Auth 버전)
-- 자주 사용하는 시간표를 템플릿으로 저장하고 재사용할 수 있는 기능
-- Mock Auth 사용 시: RLS를 비활성화하고 애플리케이션 레벨에서 권한 관리

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

-- RLS (Row Level Security) 비활성화 - Mock Auth 사용 시
ALTER TABLE curriculum_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_template_sessions DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Everyone can view active templates" ON curriculum_templates;
DROP POLICY IF EXISTS "Admins and managers can create templates" ON curriculum_templates;
DROP POLICY IF EXISTS "Creators and admins can update templates" ON curriculum_templates;
DROP POLICY IF EXISTS "Creators and admins can delete templates" ON curriculum_templates;
DROP POLICY IF EXISTS "Everyone can view template sessions" ON curriculum_template_sessions;
DROP POLICY IF EXISTS "Template creators can manage sessions" ON curriculum_template_sessions;

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_curriculum_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS curriculum_template_updated_at ON curriculum_templates;
CREATE TRIGGER curriculum_template_updated_at
  BEFORE UPDATE ON curriculum_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_curriculum_template_updated_at();

COMMENT ON TABLE curriculum_templates IS '커리큘럼 템플릿 메타데이터';
COMMENT ON TABLE curriculum_template_sessions IS '커리큘럼 템플릿 세션 상세';
COMMENT ON COLUMN curriculum_templates.usage_count IS '템플릿이 사용된 횟수';
COMMENT ON COLUMN curriculum_templates.is_default IS '시스템 기본 템플릿 여부';
COMMENT ON COLUMN curriculum_template_sessions.session_type IS '세션 유형: lecture, practice, exam, discussion';
