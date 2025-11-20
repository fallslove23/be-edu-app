-- =====================================================
-- Users Table Migration
-- 사용자 관리 시스템
-- =====================================================

-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  employee_id VARCHAR(50) UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'instructor', 'trainee')),
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,

  -- 인덱스
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_employee_id_key UNIQUE (employee_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 자신의 정보를 볼 수 있음
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (true);

-- 관리자만 사용자를 생성할 수 있음
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  WITH CHECK (true);

-- 관리자만 사용자를 수정할 수 있음
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  USING (true);

-- 관리자만 사용자를 삭제할 수 있음
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE
  USING (true);

-- 기본 관리자 계정 삽입 (이미 존재하지 않는 경우)
INSERT INTO users (id, name, email, phone, employee_id, role, department, position, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '시스템 관리자',
  'admin@bs-learning.com',
  '010-0000-0000',
  'ADMIN001',
  'admin',
  'IT팀',
  '시스템 관리자',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 테스트 사용자들 삽입
INSERT INTO users (id, name, email, phone, employee_id, role, department, position, status)
VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    '김교육',
    'trainee@test.com',
    '010-1111-1111',
    'EMP002',
    'trainee',
    '영업팀',
    '사원',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '박강사',
    'instructor@test.com',
    '010-2222-2222',
    'INST001',
    'instructor',
    '교육팀',
    '강사',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE users IS '시스템 사용자 테이블';
COMMENT ON COLUMN users.role IS 'admin: 관리자, manager: 조직장, operator: 운영자, instructor: 강사, trainee: 교육생';
COMMENT ON COLUMN users.status IS 'active: 활성, inactive: 비활성, suspended: 정지';
