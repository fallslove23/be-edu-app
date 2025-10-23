-- 강사 관리 시스템 테이블 생성
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. instructors 메인 테이블 생성
CREATE TABLE IF NOT EXISTS public.instructors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_image_url TEXT,
    bio TEXT DEFAULT '강사 소개를 입력해주세요.',
    specializations TEXT[] DEFAULT '{}',
    years_of_experience INTEGER DEFAULT 0,
    education_background TEXT DEFAULT '학력 정보를 입력해주세요.',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 방지를 위한 유니크 제약
    CONSTRAINT unique_instructor_user UNIQUE(user_id)
);

-- 2. instructor_certifications 테이블 생성 (자격증 정보)
CREATE TABLE IF NOT EXISTS public.instructor_certifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. instructor_teaching_subjects 테이블 생성 (담당 과목)
CREATE TABLE IF NOT EXISTS public.instructor_teaching_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_teaching INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON public.instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_is_active ON public.instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_instructor_certifications_instructor_id ON public.instructor_certifications(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_teaching_subjects_instructor_id ON public.instructor_teaching_subjects(instructor_id);

-- 5. updated_at 자동 업데이트 트리거 함수 (이미 있다면 스킵)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. instructors 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_instructors_updated_at ON public.instructors;
CREATE TRIGGER update_instructors_updated_at
    BEFORE UPDATE ON public.instructors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS) 설정
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_teaching_subjects ENABLE ROW LEVEL SECURITY;

-- 8. 기존 RLS 정책 삭제 (있다면)
DROP POLICY IF EXISTS "instructors_select_policy" ON public.instructors;
DROP POLICY IF EXISTS "instructors_insert_policy" ON public.instructors;
DROP POLICY IF EXISTS "instructors_update_policy" ON public.instructors;
DROP POLICY IF EXISTS "instructors_delete_policy" ON public.instructors;

DROP POLICY IF EXISTS "certifications_select_policy" ON public.instructor_certifications;
DROP POLICY IF EXISTS "certifications_insert_policy" ON public.instructor_certifications;
DROP POLICY IF EXISTS "certifications_update_policy" ON public.instructor_certifications;
DROP POLICY IF EXISTS "certifications_delete_policy" ON public.instructor_certifications;

DROP POLICY IF EXISTS "teaching_subjects_select_policy" ON public.instructor_teaching_subjects;
DROP POLICY IF EXISTS "teaching_subjects_insert_policy" ON public.instructor_teaching_subjects;
DROP POLICY IF EXISTS "teaching_subjects_update_policy" ON public.instructor_teaching_subjects;
DROP POLICY IF EXISTS "teaching_subjects_delete_policy" ON public.instructor_teaching_subjects;

-- 9. RLS 정책 새로 생성 (모든 인증된 사용자가 조회 가능)
CREATE POLICY "instructors_select_policy" ON public.instructors
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "instructors_insert_policy" ON public.instructors
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "instructors_update_policy" ON public.instructors
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "instructors_delete_policy" ON public.instructors
    FOR DELETE 
    TO authenticated 
    USING (true);

-- 자격증 테이블 정책
CREATE POLICY "certifications_select_policy" ON public.instructor_certifications
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "certifications_insert_policy" ON public.instructor_certifications
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "certifications_update_policy" ON public.instructor_certifications
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "certifications_delete_policy" ON public.instructor_certifications
    FOR DELETE 
    TO authenticated 
    USING (true);

-- 담당 과목 테이블 정책
CREATE POLICY "teaching_subjects_select_policy" ON public.instructor_teaching_subjects
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "teaching_subjects_insert_policy" ON public.instructor_teaching_subjects
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "teaching_subjects_update_policy" ON public.instructor_teaching_subjects
    FOR UPDATE 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "teaching_subjects_delete_policy" ON public.instructor_teaching_subjects
    FOR DELETE 
    TO authenticated 
    USING (true);

-- 10. 테이블 코멘트 추가
COMMENT ON TABLE public.instructors IS 'BS 학습 관리 시스템 강사 정보 테이블';
COMMENT ON TABLE public.instructor_certifications IS 'BS 강사 자격증 정보 테이블';
COMMENT ON TABLE public.instructor_teaching_subjects IS 'BS 강사 담당 과목 정보 테이블';

-- 11. 생성 결과 확인
SELECT 'instructors 테이블 생성 완료' as message;
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('instructors', 'instructor_certifications', 'instructor_teaching_subjects') 
ORDER BY table_name, ordinal_position;

-- 성공 메시지
SELECT '✅ 강사 관리 테이블들이 성공적으로 생성되었습니다!' as result;