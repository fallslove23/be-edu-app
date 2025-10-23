-- 과정 관리 테이블 존재 확인 및 기본 데이터 삽입

-- 1. 테스트용 과정 데이터 삽입
INSERT INTO public.courses (name, description, start_date, end_date, max_trainees, status) 
VALUES 
('신입 영업사원 기초 교육', '신입 영업사원을 위한 기본 교육 과정입니다.', '2024-01-15', '2024-01-19', 20, 'active'),
('중급 영업 스킬 향상', '경력 영업사원을 위한 심화 교육 과정입니다.', '2024-02-01', '2024-02-05', 15, 'draft'),
('고객 관계 관리 전문', '고객 관계 관리 전문가 양성 과정입니다.', '2024-03-01', '2024-03-08', 25, 'active')
ON CONFLICT DO NOTHING;

-- 2. 현재 과정 목록 확인
SELECT id, name, description, start_date, end_date, status, created_at FROM public.courses;