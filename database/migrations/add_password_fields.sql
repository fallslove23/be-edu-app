-- 비밀번호 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- 기존 사용자들의 초기 비밀번호를 'osstem'의 해시값으로 설정
-- bcrypt 해시: $2b$10$YourBcryptHashHere
-- 실제로는 애플리케이션에서 bcrypt를 사용하여 해시를 생성해야 합니다

-- password_change_logs 테이블 생성 (이미 존재할 수 있음)
CREATE TABLE IF NOT EXISTS password_change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_password_change_logs_user_id ON password_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_logs_changed_at ON password_change_logs(changed_at);

-- RLS 비활성화 (테스트용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_change_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN users.password_hash IS '비밀번호 해시 (bcrypt)';
COMMENT ON COLUMN users.first_login IS '최초 로그인 여부 (true일 경우 비밀번호 변경 필요)';
COMMENT ON COLUMN users.password_changed_at IS '마지막 비밀번호 변경 시각';
