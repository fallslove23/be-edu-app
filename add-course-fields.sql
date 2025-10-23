-- 과정 테이블에 교육 연도, 차수, 입과생 수 컬럼 추가
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS education_year INTEGER,
ADD COLUMN IF NOT EXISTS cohort INTEGER,
ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;

-- 기존 데이터에 대한 기본값 설정
UPDATE public.courses 
SET 
  education_year = COALESCE(education_year, EXTRACT(YEAR FROM start_date)),
  cohort = COALESCE(cohort, 1),
  enrollment_count = COALESCE(enrollment_count, current_trainees)
WHERE education_year IS NULL OR cohort IS NULL OR enrollment_count IS NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.courses.education_year IS '교육 연도';
COMMENT ON COLUMN public.courses.cohort IS '차수';
COMMENT ON COLUMN public.courses.enrollment_count IS '입과생 수 (실제 수강생 수)';