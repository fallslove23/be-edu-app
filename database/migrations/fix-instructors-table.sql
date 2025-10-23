-- instructors 테이블 생성 및 RLS 비활성화
-- Supabase 대시보드 SQL Editor에서 실행

-- 1. instructors 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  specializations TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_courses INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  career_history TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. instructor_certifications 테이블 생성
CREATE TABLE IF NOT EXISTS public.instructor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  issuer VARCHAR(200),
  issue_date DATE,
  expiry_date DATE,
  credential_id VARCHAR(100),
  credential_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. instructor_teaching_subjects 테이블 생성
CREATE TABLE IF NOT EXISTS public.instructor_teaching_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE CASCADE,
  subject_name VARCHAR(200) NOT NULL,
  proficiency_level VARCHAR(50) DEFAULT 'intermediate',
  years_taught INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS 비활성화 (개발 중)
ALTER TABLE public.instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_certifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_teaching_subjects DISABLE ROW LEVEL SECURITY;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON public.instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_active ON public.instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_instructor_certifications_instructor_id ON public.instructor_certifications(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_teaching_subjects_instructor_id ON public.instructor_teaching_subjects(instructor_id);

-- 6. user_id에 UNIQUE 제약 조건 명시적 추가 (테이블이 이미 있고 제약 조건이 없는 경우)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'instructors_user_id_key'
    AND conrelid = 'public.instructors'::regclass
  ) THEN
    ALTER TABLE public.instructors ADD CONSTRAINT instructors_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 7. 기존 instructor 역할을 가진 사용자에 대해 instructors 레코드 생성
INSERT INTO public.instructors (user_id, bio, specializations, is_active)
SELECT
  id,
  '강사 소개를 입력해주세요.',
  ARRAY['일반'],
  true
FROM public.users
WHERE role = 'instructor'
AND id NOT IN (SELECT COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid) FROM public.instructors)
ON CONFLICT (user_id) DO NOTHING;

-- 8. 결과 확인
SELECT '=== instructors 테이블 ===' as info;
SELECT
  i.id,
  u.name,
  u.email,
  u.role,
  i.bio,
  i.specializations,
  i.is_active
FROM public.instructors i
LEFT JOIN public.users u ON i.user_id = u.id
ORDER BY i.created_at DESC;

SELECT '✅ instructors 테이블 설정 완료!' as result;