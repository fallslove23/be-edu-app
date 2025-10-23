-- STEP 3: 테스트 데이터 삽입
-- Supabase SQL Editor에서 실행

-- 현재 데이터 개수 확인
SELECT 
  (SELECT COUNT(*) FROM public.courses) as courses_count,
  (SELECT COUNT(*) FROM public.users) as users_count;

-- 테스트용 과정 데이터 삽입
INSERT INTO public.courses (name, description, start_date, end_date, max_trainees, status) 
VALUES 
('신입 영업사원 기초 교육', '신입 영업사원을 위한 기본 교육 과정입니다.', '2024-01-15', '2024-01-19', 20, 'active'),
('중급 영업 스킬 향상', '경력 영업사원을 위한 심화 교육 과정입니다.', '2024-02-01', '2024-02-05', 15, 'draft'),
('고객 관계 관리 전문', '고객 관계 관리 전문가 양성 과정입니다.', '2024-03-01', '2024-03-08', 25, 'active')
ON CONFLICT DO NOTHING;

-- 테스트용 사용자 데이터 삽입 (UUID 자동 생성)
INSERT INTO public.users (name, email, role, department) 
VALUES 
('홍길동', 'hong@example.com', 'trainee', '영업팀'),
('김영희', 'kim@example.com', 'trainee', '마케팅팀'),
('관리자', 'admin@example.com', 'admin', '관리팀')
ON CONFLICT (email) DO NOTHING;

-- 결과 확인
SELECT 
  (SELECT COUNT(*) FROM public.courses) as courses_count,
  (SELECT COUNT(*) FROM public.users) as users_count;

-- 삽입된 데이터 확인
SELECT id, name, description, start_date, end_date, max_trainees, status FROM public.courses;
SELECT id, name, email, role, department FROM public.users;