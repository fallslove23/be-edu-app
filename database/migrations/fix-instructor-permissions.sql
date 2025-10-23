-- 강사 테이블 권한 문제 빠른 해결
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 방법 1: RLS 임시 비활성화 (개발/테스트용)
ALTER TABLE public.instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_teaching_subjects DISABLE ROW LEVEL SECURITY;

SELECT '✅ 강사 테이블 RLS가 비활성화되었습니다. 이제 강사 연동을 시도해보세요!' as result;

-- 참고: 나중에 보안이 필요한 경우 다시 활성화
-- ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.instructor_certifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.instructor_teaching_subjects ENABLE ROW LEVEL SECURITY;