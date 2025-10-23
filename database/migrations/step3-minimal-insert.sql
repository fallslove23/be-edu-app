-- STEP 3 최소: 과정 데이터만 삽입 (가장 안전)
-- Supabase SQL Editor에서 실행

-- 현재 데이터 개수 확인
SELECT COUNT(*) as courses_count FROM public.courses;

-- 테스트용 과정 데이터만 삽입
INSERT INTO public.courses (name, description, start_date, end_date, max_trainees, status) 
VALUES 
('신입 영업사원 기초 교육', '신입 영업사원을 위한 기본 교육 과정입니다.', '2024-01-15', '2024-01-19', 20, 'active'),
('중급 영업 스킬 향상', '경력 영업사원을 위한 심화 교육 과정입니다.', '2024-02-01', '2024-02-05', 15, 'draft'),
('고객 관계 관리 전문', '고객 관계 관리 전문가 양성 과정입니다.', '2024-03-01', '2024-03-08', 25, 'active');

-- 삽입된 과정 데이터 확인
SELECT id, name, description, start_date, end_date, max_trainees, status, created_at 
FROM public.courses 
ORDER BY created_at DESC;