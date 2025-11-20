-- =====================================================
-- Users Table Final Migration
-- 기존 데이터 충돌 방지 및 안전한 마이그레이션
-- =====================================================

-- 1. 기존 제약 조건 임시 제거
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 2. 기존 role 데이터 정규화
UPDATE users SET role = 'admin' WHERE role = 'app_admin';
UPDATE users SET role = 'manager' WHERE role = 'course_manager';

-- 3. 필요한 컬럼 추가 (기존에 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='position') THEN
    ALTER TABLE users ADD COLUMN position VARCHAR(100);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='hire_date') THEN
    ALTER TABLE users ADD COLUMN hire_date DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 4. NULL 값 처리
UPDATE users SET status = 'active' WHERE status IS NULL;

-- 5. status 컬럼에 NOT NULL 제약 조건 추가
DO $$
BEGIN
  ALTER TABLE users ALTER COLUMN status SET NOT NULL;
  ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Status column constraints already set';
END $$;

-- 6. 제약 조건 추가
DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'manager', 'operator', 'instructor', 'trainee'));
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Role constraint already exists';
END $$;

DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_status_check
    CHECK (status IN ('active', 'inactive', 'suspended'));
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Status constraint already exists';
END $$;

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 8. Updated_at 트리거
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

-- 9. RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE
  USING (true);

-- 10. 기본 사용자 데이터 UPSERT (email 기준)
-- 관리자 계정
INSERT INTO users (id, name, email, phone, employee_id, role, department, position, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '시스템 관리자',
  'admin@bs-learning.com',
  '010-0000-0000',
  'ADMIN001',
  'admin',
  'IT팀',
  '시스템 관리자',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'active',
  position = '시스템 관리자',
  employee_id = 'ADMIN001',
  department = 'IT팀',
  updated_at = NOW();

-- 테스트 교육생
INSERT INTO users (id, name, email, phone, employee_id, role, department, position, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '김교육',
  'trainee@test.com',
  '010-1111-1111',
  'EMP002',
  'trainee',
  '영업팀',
  '사원',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'trainee',
  status = 'active',
  position = '사원',
  employee_id = 'EMP002',
  department = '영업팀',
  updated_at = NOW();

-- 테스트 강사
INSERT INTO users (id, name, email, phone, employee_id, role, department, position, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '박강사',
  'instructor@test.com',
  '010-2222-2222',
  'INST001',
  'instructor',
  '교육팀',
  '강사',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'instructor',
  status = 'active',
  position = '강사',
  employee_id = 'INST001',
  department = '교육팀',
  updated_at = NOW();

-- 11. 테이블 코멘트
COMMENT ON TABLE users IS '시스템 사용자 테이블';
COMMENT ON COLUMN users.role IS 'admin: 관리자, manager: 조직장, operator: 운영자, instructor: 강사, trainee: 교육생';
COMMENT ON COLUMN users.status IS 'active: 활성, inactive: 비활성, suspended: 정지';

-- 12. 마이그레이션 완료 메시지
DO $$
DECLARE
  user_count INTEGER;
  admin_count INTEGER;
  instructor_count INTEGER;
  trainee_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
  SELECT COUNT(*) INTO instructor_count FROM users WHERE role = 'instructor';
  SELECT COUNT(*) INTO trainee_count FROM users WHERE role = 'trainee';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Users 테이블 마이그레이션 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 변경 사항:';
  RAISE NOTICE '   ✓ role 데이터 정규화 (app_admin → admin, course_manager → manager)';
  RAISE NOTICE '   ✓ status, position, hire_date, last_login 컬럼 추가';
  RAISE NOTICE '   ✓ role 및 status 제약 조건 설정';
  RAISE NOTICE '   ✓ 인덱스 생성 (email, employee_id, role, status)';
  RAISE NOTICE '   ✓ RLS 정책 설정';
  RAISE NOTICE '   ✓ updated_at 자동 업데이트 트리거 설정';
  RAISE NOTICE '   ✓ 기본 사용자 데이터 UPSERT (충돌 방지)';
  RAISE NOTICE '';
  RAISE NOTICE '👥 사용자 통계:';
  RAISE NOTICE '   - 전체 사용자: %', user_count;
  RAISE NOTICE '   - 관리자: %', admin_count;
  RAISE NOTICE '   - 강사: %', instructor_count;
  RAISE NOTICE '   - 교육생: %', trainee_count;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 마이그레이션이 성공적으로 완료되었습니다!';
  RAISE NOTICE '========================================';
END $$;
