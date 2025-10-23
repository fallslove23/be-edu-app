-- BS 학습 관리 시스템 - 관리자 계정 확인 및 비밀번호 리셋
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 현재 시스템의 모든 관리자 계정 조회
SELECT 
    id,
    email,
    name,
    role,
    is_active,
    first_login,
    created_at,
    updated_at
FROM users 
WHERE role = 'app_admin'
ORDER BY created_at;

-- 2. 특정 관리자의 비밀번호를 'admin123'으로 리셋
-- 아래 쿼리 실행 전에 위 쿼리로 관리자 ID를 확인한 후 
-- '여기에-관리자-UUID-입력' 부분을 실제 UUID로 변경하세요
/*
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE id = '여기에-관리자-UUID-입력';

UPDATE users 
SET first_login = true, updated_at = NOW()
WHERE id = '여기에-관리자-UUID-입력';
*/

-- 3. 새 관리자 계정 생성용 쿼리 (필요시)
-- 먼저 Supabase 대시보드의 Authentication > Users에서 새 사용자를 생성한 후
-- 아래 쿼리로 관리자 권한을 부여하세요
/*
INSERT INTO users (
    id,
    email,
    name,
    role,
    first_login,
    is_active,
    created_at,
    updated_at
) VALUES (
    '새로-생성한-사용자-UUID',
    'newadmin@company.com',
    '새 시스템 관리자',
    'app_admin',
    true,
    true,
    NOW(),
    NOW()
);
*/

-- 4. 결과 확인
SELECT 
    '관리자 계정 확인 완료' as message,
    COUNT(*) as admin_count
FROM users 
WHERE role = 'app_admin' AND is_active = true;