-- Mock 사용자 미리보기 (간단 버전)
-- 실제 존재하는 테이블만 확인

-- 1. Mock 사용자 목록
SELECT
  '=== Mock 사용자 목록 ===' as info,
  id,
  name,
  email,
  role,
  status,
  created_at::date as created_date
FROM users
WHERE email LIKE '%mock%'
   OR email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%'
ORDER BY created_at;

-- 2. Mock 사용자 수 확인
SELECT
  COUNT(*) as "총 Mock 사용자 수"
FROM users
WHERE email LIKE '%mock%'
   OR email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%';

-- 3. 역할별 분류
SELECT
  role as "역할",
  COUNT(*) as "사용자 수"
FROM users
WHERE email LIKE '%mock%'
   OR email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%'
GROUP BY role
ORDER BY COUNT(*) DESC;
