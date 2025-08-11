-- 공지사항 관련 테이블의 RLS 비활성화 (개발용)
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_images DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('notices', 'notice_files', 'notice_images');