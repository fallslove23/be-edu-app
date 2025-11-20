-- 로그인 시스템을 위한 사용자 확인 스크립트

-- 1. 전체 사용자 확인
SELECT
  '=== 전체 사용자 목록 ===' as info,
  id,
  name,
  email,
  employee_id,
  role,
  status,
  password_hash IS NOT NULL as has_password,
  first_login,
  created_at::date as created_date
FROM users
WHERE status = 'active'
ORDER BY created_at;

-- 2. 사번이 있는 사용자 확인
SELECT
  '사번이 있는 사용자' as category,
  COUNT(*) as count
FROM users
WHERE employee_id IS NOT NULL AND employee_id != '';

-- 3. 비밀번호가 설정된 사용자 확인
SELECT
  '비밀번호 설정 상태' as category,
  COUNT(*) as count
FROM users
WHERE password_hash IS NOT NULL;

-- 4. 컬럼 존재 여부 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('password_hash', 'first_login', 'password_changed_at')
ORDER BY column_name;
