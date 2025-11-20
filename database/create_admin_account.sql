-- 관리자 계정 생성 (최효동)
-- 사번: 20031409, 초기 비밀번호: osstem

-- 1. 기존 계정과 관련 데이터 삭제
DO $$ 
DECLARE
  user_uuid UUID;
BEGIN
  -- 사용자 UUID 조회
  SELECT id INTO user_uuid FROM users WHERE employee_id = '20031409';
  
  IF user_uuid IS NOT NULL THEN
    -- 관련 데이터 삭제
    DELETE FROM notices WHERE author_id = user_uuid;
    DELETE FROM password_change_logs WHERE user_id = user_uuid;
    -- 다른 관련 테이블들도 필요시 추가
    
    -- 사용자 삭제
    DELETE FROM users WHERE id = user_uuid;
  END IF;
END $$;

-- 2. 관리자 계정 생성
INSERT INTO users (
  id,
  employee_id,
  name,
  email,
  phone,
  role,
  department,
  position,
  hire_date,
  status,
  password_hash,
  first_login,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '20031409',
  '최효동',
  'sethetrend87@osstem.com',
  '010-6557-3282',
  'admin',
  '교육운영팀',
  '과장',
  '2020-03-14',
  'active',
  '$2b$10$4fHFxAsSSCs.lunW5g/W8uJ3.0NHr5yCd4AtEqQ1tw4q08ItyIaBS',
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 3. 확인
SELECT
  employee_id,
  name,
  email,
  role,
  department,
  position,
  status,
  first_login
FROM users
WHERE employee_id = '20031409';
