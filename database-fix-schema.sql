-- 데이터베이스 스키마 수정 및 RLS 정책 설정
-- Supabase 대시보드의 SQL Editor에서 실행해야 합니다.

-- 1. courses 테이블에 누락된 컬럼들 추가
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS current_trainees INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS instructor_id UUID,
ADD COLUMN IF NOT EXISTS manager_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 다른 테이블들의 누락된 컬럼도 확인 및 추가
-- (이미 있을 수 있으니 IF NOT EXISTS 사용)

-- 3. RLS 정책 임시 비활성화 (개발용)
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. 테스트 데이터 삽입
INSERT INTO public.courses (name, description, start_date, end_date, max_trainees, status) 
VALUES 
('신입 영업사원 기초 교육', '신입 영업사원을 위한 기본 교육 과정입니다.', '2024-01-15', '2024-01-19', 20, 'active'),
('중급 영업 스킬 향상', '경력 영업사원을 위한 심화 교육 과정입니다.', '2024-02-01', '2024-02-05', 15, 'draft'),
('고객 관계 관리 전문', '고객 관계 관리 전문가 양성 과정입니다.', '2024-03-01', '2024-03-08', 25, 'active')
ON CONFLICT DO NOTHING;

-- 5. 테스트용 사용자 데이터 삽입
INSERT INTO public.users (id, name, email, role, department) 
VALUES 
('test-user-1', '홍길동', 'hong@example.com', 'trainee', '영업팀'),
('test-user-2', '김영희', 'kim@example.com', 'trainee', '마케팅팀'),
('test-admin-1', '관리자', 'admin@example.com', 'admin', '관리팀')
ON CONFLICT (id) DO NOTHING;

-- 6. 테스트용 과정 등록 데이터
INSERT INTO public.course_enrollments (course_id, trainee_id, status)
SELECT 
    c.id as course_id,
    u.id as trainee_id,
    'active' as status
FROM public.courses c
CROSS JOIN public.users u
WHERE c.name = '신입 영업사원 기초 교육' 
  AND u.role = 'trainee'
  AND u.id = 'test-user-1'
ON CONFLICT (course_id, trainee_id) DO NOTHING;

-- 7. 개발용 RLS 정책 설정 (나중에 적용할 때)
/*
-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON public.courses
FOR SELECT USING (true);

-- 인증된 사용자가 삽입 가능
CREATE POLICY "Enable insert for authenticated users only" ON public.courses
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 관리자만 수정/삭제 가능
CREATE POLICY "Enable update for admin users only" ON public.courses
FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable delete for admin users only" ON public.courses
FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
*/

-- 8. 확인 쿼리
SELECT 'courses' as table_name, COUNT(*) as count FROM public.courses
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'course_enrollments' as table_name, COUNT(*) as count FROM public.course_enrollments;