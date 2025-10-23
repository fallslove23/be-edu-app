-- ================================
-- BS Learning App 데이터베이스 완전 수정 SQL
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- ================================

-- 1. 필수 테이블 존재 확인 및 생성
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    role VARCHAR DEFAULT 'trainee',
    department VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id),
    manager_id UUID REFERENCES public.users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_trainees INTEGER DEFAULT 0,
    current_trainees INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'draft',
    schedule JSONB,
    trainer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR DEFAULT 'active',
    completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS public.course_curriculum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    order_index INTEGER DEFAULT 0,
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    curriculum_id UUID REFERENCES public.course_curriculum(id),
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR,
    status VARCHAR DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES public.course_schedules(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'absent',
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(schedule_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id),
    priority VARCHAR DEFAULT 'normal',
    target_role VARCHAR,
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 누락된 컬럼 추가 (있으면 무시)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_trainees INTEGER DEFAULT 0;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS department VARCHAR;

-- 3. RLS 정책 임시 비활성화 (개발 환경용)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;

-- 4. 기존 데이터 정리 (중복 제거)
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

-- 5. 테스트용 사용자 데이터 삽입
INSERT INTO public.users (id, name, email, role, department, phone) 
VALUES 
('11111111-1111-1111-1111-111111111111', '관리자', 'admin@bs-learning.com', 'admin', '관리팀', '010-1234-5678'),
('22222222-2222-2222-2222-222222222222', '김강사', 'instructor@bs-learning.com', 'instructor', '교육팀', '010-2345-6789'),
('33333333-3333-3333-3333-333333333333', '홍길동', 'trainee1@bs-learning.com', 'trainee', '영업팀', '010-3456-7890'),
('44444444-4444-4444-4444-444444444444', '김영희', 'trainee2@bs-learning.com', 'trainee', '마케팅팀', '010-4567-8901'),
('55555555-5555-5555-5555-555555555555', '박매니저', 'manager@bs-learning.com', 'manager', '관리팀', '010-5678-9012')
ON CONFLICT (email) DO NOTHING;

-- 6. 테스트용 과정 데이터 삽입 (기존 삭제 후)
DELETE FROM public.courses WHERE name IN ('신입 영업사원 기초 교육', '중급 영업 스킬 향상', '고객 관계 관리 전문');

INSERT INTO public.courses (id, name, description, instructor_id, manager_id, start_date, end_date, max_trainees, current_trainees, status) 
VALUES 
(
    '10000000-1000-1000-1000-100000000001',
    '신입 영업사원 기초 교육',
    '신입 영업사원을 위한 기본 교육 과정입니다. 영업 기초, 고객 응대, 제품 지식을 포함합니다.',
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    '2024-09-01',
    '2024-09-05',
    20,
    5,
    'active'
),
(
    '10000000-1000-1000-1000-100000000002',
    '중급 영업 스킬 향상',
    '경력 영업사원을 위한 심화 교육 과정입니다. 협상 기술, 고급 영업 전략을 다룹니다.',
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    '2024-09-15',
    '2024-09-19',
    15,
    3,
    'draft'
),
(
    '10000000-1000-1000-1000-100000000003',
    '고객 관계 관리 전문',
    'CRM 시스템 활용과 고객 관계 관리 전문가 양성 과정입니다.',
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    '2024-10-01',
    '2024-10-10',
    25,
    8,
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- 7. 테스트용 등록 데이터
INSERT INTO public.course_enrollments (course_id, trainee_id, status) 
VALUES 
('10000000-1000-1000-1000-100000000001', '33333333-3333-3333-3333-333333333333', 'active'),
('10000000-1000-1000-1000-100000000001', '44444444-4444-4444-4444-444444444444', 'active'),
('10000000-1000-1000-1000-100000000003', '33333333-3333-3333-3333-333333333333', 'active')
ON CONFLICT (course_id, trainee_id) DO NOTHING;

-- 8. 테스트용 공지사항
INSERT INTO public.notices (title, content, author_id, priority, target_role, is_active) 
VALUES 
('신입 교육 과정 안내', '9월 1일부터 시작하는 신입 영업사원 기초 교육 과정 안내입니다.', '11111111-1111-1111-1111-111111111111', 'high', 'trainee', true),
('시스템 점검 안내', '매주 일요일 오전 2시~4시 시스템 점검이 진행됩니다.', '11111111-1111-1111-1111-111111111111', 'normal', 'all', true)
ON CONFLICT DO NOTHING;

-- 9. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_trainee ON public.course_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 10. 결과 확인 쿼리
SELECT 'Database Setup Complete' as status;

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
    'enrollments' as table_name, 
    COUNT(*) as count,
    ARRAY_AGG(DISTINCT status) as statuses
FROM public.course_enrollments;

-- 예상 결과:
-- courses: 3개 (active, draft 상태)
-- users: 5개 (admin, instructor, trainee, manager 역할)
-- enrollments: 3개 (active 상태)