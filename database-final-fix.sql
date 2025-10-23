-- ================================
-- BS Learning App 데이터베이스 최종 수정 SQL
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- ================================

-- 1. 누락된 컬럼 추가
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_trainees INTEGER DEFAULT 0;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS department VARCHAR;

-- notices 테이블에 필요한 컬럼 추가 (있으면 무시)
ALTER TABLE public.notices
ADD COLUMN IF NOT EXISTS priority VARCHAR DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS target_role VARCHAR DEFAULT 'all',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. RLS 정책 임시 비활성화 (개발 환경용)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;

-- 3. 기존 중복 데이터 정리
DELETE FROM public.courses 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY name, start_date, end_date 
            ORDER BY created_at DESC
        ) as rn
        FROM public.courses
    ) t WHERE rn > 1
);

-- 4. 기존 허용되는 role 값으로 테스트 사용자 생성
INSERT INTO public.users (name, email, role, department, phone) 
VALUES 
('시스템 관리자', 'admin@bs-learning.com', 'app_admin', '관리팀', '010-1234-5678'),
('김강사', 'instructor1@bs-learning.com', 'instructor', '교육팀', '010-2345-6789'),
('박강사', 'instructor2@bs-learning.com', 'instructor', '교육팀', '010-3456-7890'),
('과정매니저', 'manager@bs-learning.com', 'course_manager', '관리팀', '010-4567-8901'),
('이과정매니저', 'manager2@bs-learning.com', 'course_manager', '교육팀', '010-5678-9012')
ON CONFLICT (email) DO NOTHING;

-- 5. 기존 과정 데이터 정리 및 새로운 테스트 과정 생성
DELETE FROM public.courses WHERE name IN ('신입 영업사원 기초 교육', '중급 영업 스킬 향상', '고객 관계 관리 전문');

-- 강사와 매니저 ID를 동적으로 가져와서 과정 생성
DO $$
DECLARE
    instructor_id_1 UUID;
    instructor_id_2 UUID;
    manager_id_1 UUID;
    manager_id_2 UUID;
BEGIN
    -- 첫 번째 강사 ID 가져오기
    SELECT id INTO instructor_id_1 
    FROM public.users 
    WHERE role = 'instructor' AND email = 'instructor1@bs-learning.com' 
    LIMIT 1;
    
    -- 두 번째 강사 ID 가져오기
    SELECT id INTO instructor_id_2 
    FROM public.users 
    WHERE role = 'instructor' AND email = 'instructor2@bs-learning.com' 
    LIMIT 1;
    
    -- 첫 번째 매니저 ID 가져오기
    SELECT id INTO manager_id_1 
    FROM public.users 
    WHERE role = 'course_manager' AND email = 'manager@bs-learning.com' 
    LIMIT 1;
    
    -- 두 번째 매니저 ID 가져오기
    SELECT id INTO manager_id_2 
    FROM public.users 
    WHERE role = 'course_manager' AND email = 'manager2@bs-learning.com' 
    LIMIT 1;

    -- 과정 데이터 삽입
    INSERT INTO public.courses (name, description, instructor_id, manager_id, start_date, end_date, max_trainees, current_trainees, status) 
    VALUES 
    (
        '신입 영업사원 기초 교육',
        '신입 영업사원을 위한 기본 교육 과정입니다. 영업 기초, 고객 응대, 제품 지식을 포함합니다.',
        instructor_id_1,
        manager_id_1,
        '2024-09-01',
        '2024-09-05',
        20,
        5,
        'active'
    ),
    (
        '중급 영업 스킬 향상',
        '경력 영업사원을 위한 심화 교육 과정입니다. 협상 기술, 고급 영업 전략을 다룹니다.',
        instructor_id_2,
        manager_id_1,
        '2024-09-15',
        '2024-09-19',
        15,
        3,
        'draft'
    ),
    (
        '고객 관계 관리 전문',
        'CRM 시스템 활용과 고객 관계 관리 전문가 양성 과정입니다.',
        instructor_id_1,
        manager_id_2,
        '2024-10-01',
        '2024-10-10',
        25,
        8,
        'active'
    );
END $$;

-- 6. 테스트용 공지사항 (기존 notices 테이블 구조에 맞춤)
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id 
    FROM public.users 
    WHERE role = 'app_admin' 
    LIMIT 1;
    
    -- 기존 컬럼 구조에 맞춰 삽입
    INSERT INTO public.notices (title, content, author_id, category, is_pinned) 
    VALUES 
    ('신입 교육 과정 안내', '9월 1일부터 시작하는 신입 영업사원 기초 교육 과정 안내입니다.', admin_id, 'announcement', true),
    ('시스템 점검 안내', '매주 일요일 오전 2시~4시 시스템 점검이 진행됩니다.', admin_id, 'maintenance', false)
    ON CONFLICT DO NOTHING;
    
    -- 새로 추가된 컬럼이 있다면 업데이트
    UPDATE public.notices 
    SET 
        priority = CASE 
            WHEN title LIKE '%교육%' THEN 'high'
            ELSE 'normal'
        END,
        target_role = 'all',
        is_active = true
    WHERE author_id = admin_id;
END $$;

-- 7. 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_trainee ON public.course_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_notices_category ON public.notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_is_pinned ON public.notices(is_pinned);

-- 8. 결과 확인
SELECT 'Database Setup Complete' as status;

-- 테이블별 데이터 개수 확인
SELECT 
    'courses' as table_name, 
    COUNT(*) as count,
    ARRAY_AGG(DISTINCT status) as statuses
FROM public.courses
UNION ALL
SELECT 
    'users' as table_name, 
    COUNT(*) as count,
    ARRAY_AGG(DISTINCT role) as roles
FROM public.users
UNION ALL
SELECT 
    'notices' as table_name, 
    COUNT(*) as count,
    ARRAY_AGG(DISTINCT category) as categories
FROM public.notices;

-- 최종 사용자 정보 확인
SELECT 
    'User List' as info,
    u.name,
    u.email,
    u.role,
    u.department
FROM public.users u
WHERE u.role IN ('app_admin', 'instructor', 'course_manager')
ORDER BY u.role, u.name;

-- 최종 과정 정보 확인
SELECT 
    'Course List' as info,
    c.name as course_name,
    c.description,
    i.name as instructor_name,
    m.name as manager_name,
    c.status,
    c.start_date,
    c.end_date,
    c.max_trainees,
    c.current_trainees
FROM public.courses c
LEFT JOIN public.users i ON c.instructor_id = i.id
LEFT JOIN public.users m ON c.manager_id = m.id
ORDER BY c.start_date;

-- 공지사항 확인
SELECT 
    'Notice List' as info,
    n.title,
    n.content,
    u.name as author_name,
    n.category,
    n.is_pinned,
    n.created_at
FROM public.notices n
LEFT JOIN public.users u ON n.author_id = u.id
ORDER BY n.is_pinned DESC, n.created_at DESC;