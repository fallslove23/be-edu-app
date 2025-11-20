-- 공통 코드 마스터 데이터 테이블 생성
-- 부서, 직급, 관계 등 시스템 전반에서 사용되는 코드 값 관리

-- 공통 코드 그룹 테이블
CREATE TABLE IF NOT EXISTS common_code_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- 예: DEPARTMENT, POSITION, RELATIONSHIP
  name VARCHAR(100) NOT NULL,        -- 예: 부서, 직급, 관계
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,   -- 시스템 필수 코드 여부 (삭제 불가)
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 공통 코드 상세 테이블
CREATE TABLE IF NOT EXISTS common_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES common_code_groups(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,         -- 예: SALES_TEAM, MANAGER, PARENT
  name VARCHAR(100) NOT NULL,        -- 예: 영업팀, 부장, 부모
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,   -- 시스템 필수 코드 여부 (삭제 불가)
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  extra_data JSONB,                  -- 추가 데이터 저장용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, code)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_common_code_groups_code ON common_code_groups(code);
CREATE INDEX IF NOT EXISTS idx_common_code_groups_active ON common_code_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_common_codes_group_id ON common_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_common_codes_code ON common_codes(code);
CREATE INDEX IF NOT EXISTS idx_common_codes_active ON common_codes(is_active);

-- 기본 공통 코드 그룹 삽입
INSERT INTO common_code_groups (code, name, description, is_system, sort_order) VALUES
('DEPARTMENT', '부서', '조직 부서 목록', TRUE, 1),
('POSITION', '직급', '직급 목록', TRUE, 2),
('RELATIONSHIP', '관계', '비상연락처 관계', TRUE, 3),
('CLASSROOM_TYPE', '강의실 유형', '강의실 종류', TRUE, 4),
('SUBJECT_CATEGORY', '과목 카테고리', '과목 분류', TRUE, 5)
ON CONFLICT (code) DO NOTHING;

-- 부서 코드 삽입
INSERT INTO common_codes (group_id, code, name, is_system, sort_order)
SELECT
  id,
  UNNEST(ARRAY['IT_TEAM', 'SALES_HQ', 'SALES_TEAM_1', 'SALES_TEAM_2', 'MARKETING_TEAM',
                'CS_TEAM', 'EDU_TEAM', 'EDU_OPS_TEAM', 'HR_TEAM', 'FINANCE_TEAM', 'PLANNING_TEAM']),
  UNNEST(ARRAY['IT팀', '영업본부', '영업1팀', '영업2팀', '마케팅팀',
                '고객서비스팀', '교육팀', '교육운영팀', '인사팀', '재무팀', '기획팀']),
  FALSE,
  generate_series(1, 11)
FROM common_code_groups WHERE code = 'DEPARTMENT'
ON CONFLICT (group_id, code) DO NOTHING;

-- 직급 코드 삽입
INSERT INTO common_codes (group_id, code, name, is_system, sort_order)
SELECT
  id,
  UNNEST(ARRAY['STAFF', 'ASSOCIATE', 'ASSISTANT_MANAGER', 'MANAGER',
                'DEPUTY_GENERAL_MANAGER', 'GENERAL_MANAGER', 'TEAM_LEADER',
                'DIVISION_HEAD', 'DIRECTOR']),
  UNNEST(ARRAY['사원', '주임', '대리', '과장', '차장', '부장', '팀장', '본부장', '이사']),
  FALSE,
  generate_series(1, 9)
FROM common_code_groups WHERE code = 'POSITION'
ON CONFLICT (group_id, code) DO NOTHING;

-- 관계 코드 삽입
INSERT INTO common_codes (group_id, code, name, is_system, sort_order)
SELECT
  id,
  UNNEST(ARRAY['PARENT', 'SPOUSE', 'SIBLING', 'CHILD', 'FRIEND', 'COLLEAGUE', 'OTHER']),
  UNNEST(ARRAY['부모', '배우자', '형제/자매', '자녀', '친구', '동료', '기타']),
  FALSE,
  generate_series(1, 7)
FROM common_code_groups WHERE code = 'RELATIONSHIP'
ON CONFLICT (group_id, code) DO NOTHING;

-- 강의실 유형 코드 삽입
INSERT INTO common_codes (group_id, code, name, is_system, sort_order)
SELECT
  id,
  UNNEST(ARRAY['GENERAL', 'LECTURE', 'LAB', 'SEMINAR', 'CONFERENCE']),
  UNNEST(ARRAY['범용', '강의실', '실습실', '세미나실', '회의실']),
  FALSE,
  generate_series(1, 5)
FROM common_code_groups WHERE code = 'CLASSROOM_TYPE'
ON CONFLICT (group_id, code) DO NOTHING;

-- 과목 카테고리 코드 삽입
INSERT INTO common_codes (group_id, code, name, is_system, sort_order)
SELECT
  id,
  UNNEST(ARRAY['THEORY', 'PRACTICE', 'PROJECT', 'SEMINAR', 'EXAM']),
  UNNEST(ARRAY['이론', '실습', '프로젝트', '세미나', '시험']),
  FALSE,
  generate_series(1, 5)
FROM common_code_groups WHERE code = 'SUBJECT_CATEGORY'
ON CONFLICT (group_id, code) DO NOTHING;

-- 업데이트 타임스탬프 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_common_code_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_common_code_groups_updated_at ON common_code_groups;
CREATE TRIGGER trigger_common_code_groups_updated_at
  BEFORE UPDATE ON common_code_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_common_code_updated_at();

DROP TRIGGER IF EXISTS trigger_common_codes_updated_at ON common_codes;
CREATE TRIGGER trigger_common_codes_updated_at
  BEFORE UPDATE ON common_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_common_code_updated_at();

-- Row Level Security 활성화
ALTER TABLE common_code_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_codes ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 인증된 사용자가 조회 가능
CREATE POLICY "Common code groups are viewable by authenticated users"
  ON common_code_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Common codes are viewable by authenticated users"
  ON common_codes FOR SELECT
  TO authenticated
  USING (true);

-- 쓰기 정책: 관리자만 수정 가능 (추후 역할 기반으로 변경 가능)
CREATE POLICY "Common code groups are editable by admins"
  ON common_code_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Common codes are editable by admins"
  ON common_codes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 코멘트 추가
COMMENT ON TABLE common_code_groups IS '공통 코드 그룹 마스터 테이블';
COMMENT ON TABLE common_codes IS '공통 코드 상세 테이블';
COMMENT ON COLUMN common_code_groups.is_system IS '시스템 필수 코드 (삭제 불가)';
COMMENT ON COLUMN common_codes.is_system IS '시스템 필수 코드 (삭제 불가)';
COMMENT ON COLUMN common_codes.extra_data IS '추가 데이터 (JSON 형식)';
