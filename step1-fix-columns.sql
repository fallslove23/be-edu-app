-- STEP 1: 누락된 컬럼들 추가
-- Supabase SQL Editor에서 실행

-- courses 테이블 구조 확인 먼저
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'courses'
ORDER BY ordinal_position;

-- 누락된 컬럼들 하나씩 추가 (오류 방지)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 20;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS current_trainees INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 결과 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'courses'
ORDER BY ordinal_position;