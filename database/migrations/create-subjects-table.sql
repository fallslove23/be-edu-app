-- 과목(subjects) 테이블 생성
-- 강사가 담당할 수 있는 과목 관리

-- 1. 과목 테이블 생성
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- 예: 이론, 실습, 세미나 등
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_subjects_name ON public.subjects(name);
CREATE INDEX IF NOT EXISTS idx_subjects_category ON public.subjects(category);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON public.subjects(is_active);

-- 3. 강사-과목 매핑 테이블 생성 (다대다 관계)
CREATE TABLE IF NOT EXISTS public.instructor_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  proficiency_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, expert
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instructor_id, subject_id)
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructor_subjects_instructor ON public.instructor_subjects(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_subjects_subject ON public.instructor_subjects(subject_id);

-- 5. RLS 정책 설정
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_subjects ENABLE ROW LEVEL SECURITY;

-- 과목 조회 정책 (모든 인증된 사용자)
CREATE POLICY "subjects_select_policy" ON public.subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- 과목 생성/수정/삭제 정책 (관리자, 매니저)
CREATE POLICY "subjects_insert_policy" ON public.subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "subjects_update_policy" ON public.subjects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "subjects_delete_policy" ON public.subjects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- 강사-과목 조회 정책 (모든 인증된 사용자)
CREATE POLICY "instructor_subjects_select_policy" ON public.instructor_subjects
  FOR SELECT
  TO authenticated
  USING (true);

-- 강사-과목 생성/수정/삭제 정책 (관리자, 매니저)
CREATE POLICY "instructor_subjects_insert_policy" ON public.instructor_subjects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "instructor_subjects_update_policy" ON public.instructor_subjects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "instructor_subjects_delete_policy" ON public.instructor_subjects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- 6. 샘플 데이터 추가
INSERT INTO public.subjects (name, description, category) VALUES
  ('BS 영업', 'BS(Brushing Sales) 영업 이론 및 실습', '이론'),
  ('리더십', '리더십 개발 및 팀 관리', '이론'),
  ('커뮤니케이션', '효과적인 커뮤니케이션 스킬', '실습'),
  ('제품 지식', '치과 제품에 대한 전문 지식', '이론'),
  ('고객 관리', '고객 관계 관리 및 유지', '실습'),
  ('영업 전략', '전략적 영업 계획 수립', '이론'),
  ('프레젠테이션', '효과적인 프레젠테이션 기술', '실습'),
  ('협상 기술', '성공적인 협상 전략', '실습')
ON CONFLICT (name) DO NOTHING;

-- 7. instructor_profiles 테이블 수정 (specializations 컬럼 제거는 별도 마이그레이션에서)
-- 참고: 기존 specializations, certifications, contract_type 컬럼은 이후 단계에서 제거

COMMENT ON TABLE public.subjects IS '강의 과목 관리 테이블';
COMMENT ON TABLE public.instructor_subjects IS '강사-과목 매핑 테이블 (다대다 관계)';
COMMENT ON COLUMN public.instructor_subjects.proficiency_level IS '과목 숙련도: beginner, intermediate, expert';
