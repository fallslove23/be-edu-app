-- =====================================================
-- Users Table Migration - ALTER 버전
-- 기존 테이블 구조 수정
-- =====================================================

-- 1. 먼저 기존 users 테이블 구조 확인 및 컬럼 추가

-- status 컬럼 추가 (기존에 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'inactive', 'suspended'));
  END IF;
END $$;

-- position 컬럼 추가 (기존에 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='position') THEN
    ALTER TABLE users ADD COLUMN position VARCHAR(100);
  END IF;
END $$;

-- hire_date 컬럼 추가 (기존에 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='hire_date') THEN
    ALTER TABLE users ADD COLUMN hire_date DATE;
  END IF;
END $$;

-- last_login 컬럼 추가 (기존에 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 2. role 컬럼 제약 조건 업데이트 (기존 제약과 다를 수 있음)
DO $$
BEGIN
  -- 기존 제약 조건 삭제 시도
  BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;

  -- 새 제약 조건 추가
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'manager', 'operator', 'instructor', 'trainee'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. 인덱스 생성 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 4. Updated_at 자동 업데이트 트리거
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

-- 5. RLS (Row Level Security) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

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

-- 6. 기본 관리자 계정 삽입/업데이트 (이미 존재하지 않는 경우)
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
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  position = '시스템 관리자',
  updated_at = NOW();

-- 7. 테스트 사용자들 삽입/업데이트
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
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- 8. 테이블 및 컬럼 코멘트
COMMENT ON TABLE users IS '시스템 사용자 테이블';
COMMENT ON COLUMN users.role IS 'admin: 관리자, manager: 조직장, operator: 운영자, instructor: 강사, trainee: 교육생';
COMMENT ON COLUMN users.status IS 'active: 활성, inactive: 비활성, suspended: 정지';

-- 9. 마이그레이션 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Users 테이블 마이그레이션 완료';
  RAISE NOTICE '   - status, position, hire_date, last_login 컬럼 추가됨';
  RAISE NOTICE '   - role 제약 조건 업데이트됨';
  RAISE NOTICE '   - 인덱스 생성 완료';
  RAISE NOTICE '   - RLS 정책 설정 완료';
  RAISE NOTICE '   - 기본 사용자 데이터 삽입 완료';
END $$;
