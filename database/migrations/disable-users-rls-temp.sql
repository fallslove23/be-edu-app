-- 임시로 users 테이블 RLS 비활성화 (테스트용)
-- 주의: 이것은 보안상 위험하므로 테스트 후 다시 활성화해야 합니다

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;