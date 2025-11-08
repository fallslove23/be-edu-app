-- ========================================
-- 시험 관리 시스템: 교육생 등록 샘플 데이터
-- ========================================

-- ========================================
-- 1. 샘플 교육생 생성 (users 테이블)
-- ========================================

-- 샘플 교육생 10명 생성 (A반 5명, B반 5명)
INSERT INTO public.users (email, name, role, department, phone, is_active) VALUES
-- A반 교육생
('trainee.a1@example.com', '김철수', 'trainee', '영업1팀', '010-1111-0001', true),
('trainee.a2@example.com', '이영희', 'trainee', '영업2팀', '010-1111-0002', true),
('trainee.a3@example.com', '박민수', 'trainee', '영업3팀', '010-1111-0003', true),
('trainee.a4@example.com', '최지은', 'trainee', '마케팅팀', '010-1111-0004', true),
('trainee.a5@example.com', '정대호', 'trainee', '기획팀', '010-1111-0005', true),

-- B반 교육생
('trainee.b1@example.com', '강민재', 'trainee', '영업1팀', '010-2222-0001', true),
('trainee.b2@example.com', '윤서연', 'trainee', '영업2팀', '010-2222-0002', true),
('trainee.b3@example.com', '임동현', 'trainee', '영업3팀', '010-2222-0003', true),
('trainee.b4@example.com', '한소희', 'trainee', '마케팅팀', '010-2222-0004', true),
('trainee.b5@example.com', '조준호', 'trainee', '기획팀', '010-2222-0005', true)
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- 2. 교육생 등록 (course_enrollments)
-- ========================================

-- A반 교육생 등록
INSERT INTO public.course_enrollments (
    trainee_id,
    course_id,
    session_id,
    division_id,
    enrolled_at,
    status
)
SELECT
    u.id as trainee_id,
    cs.legacy_course_id as course_id,  -- legacy_course_id 사용 (NOT NULL 제약 조건 해결)
    cs.id as session_id,
    cd.id as division_id,
    '2024-09-25 09:00:00' as enrolled_at,
    'active' as status
FROM public.users u
CROSS JOIN public.course_sessions cs
CROSS JOIN public.class_divisions cd
WHERE u.email IN (
    'trainee.a1@example.com',
    'trainee.a2@example.com',
    'trainee.a3@example.com',
    'trainee.a4@example.com',
    'trainee.a5@example.com'
)
AND cs.session_code = 'BS-SALES-101-2024-3'
AND cd.division_code = 'BS-SALES-101-2024-3-A'
ON CONFLICT DO NOTHING;

-- B반 교육생 등록
INSERT INTO public.course_enrollments (
    trainee_id,
    course_id,
    session_id,
    division_id,
    enrolled_at,
    status
)
SELECT
    u.id as trainee_id,
    cs.legacy_course_id as course_id,  -- legacy_course_id 사용 (NOT NULL 제약 조건 해결)
    cs.id as session_id,
    cd.id as division_id,
    '2024-09-25 14:00:00' as enrolled_at,
    'active' as status
FROM public.users u
CROSS JOIN public.course_sessions cs
CROSS JOIN public.class_divisions cd
WHERE u.email IN (
    'trainee.b1@example.com',
    'trainee.b2@example.com',
    'trainee.b3@example.com',
    'trainee.b4@example.com',
    'trainee.b5@example.com'
)
AND cs.session_code = 'BS-SALES-101-2024-3'
AND cd.division_code = 'BS-SALES-101-2024-3-B'
ON CONFLICT DO NOTHING;

-- ========================================
-- 3. 분반 교육생 수 업데이트
-- ========================================

-- A반 교육생 수 업데이트
UPDATE public.class_divisions
SET current_trainees = (
    SELECT COUNT(*)
    FROM public.course_enrollments ce
    WHERE ce.division_id = class_divisions.id
    AND ce.status = 'active'
)
WHERE division_code = 'BS-SALES-101-2024-3-A';

-- B반 교육생 수 업데이트
UPDATE public.class_divisions
SET current_trainees = (
    SELECT COUNT(*)
    FROM public.course_enrollments ce
    WHERE ce.division_id = class_divisions.id
    AND ce.status = 'active'
)
WHERE division_code = 'BS-SALES-101-2024-3-B';

-- ========================================
-- 4. 검증 쿼리
-- ========================================

-- 4.1 등록된 교육생 확인
SELECT
    cs.session_name,
    cd.division_name,
    u.name as trainee_name,
    u.email,
    u.department,
    ce.enrolled_at,
    ce.status
FROM public.course_enrollments ce
INNER JOIN public.users u ON ce.trainee_id = u.id
INNER JOIN public.course_sessions cs ON ce.session_id = cs.id
LEFT JOIN public.class_divisions cd ON ce.division_id = cd.id
WHERE cs.session_code = 'BS-SALES-101-2024-3'
ORDER BY cd.division_name, u.name;

-- 4.2 분반별 교육생 수
SELECT
    cd.division_name,
    cd.current_trainees,
    cd.max_trainees,
    ROUND(cd.current_trainees::numeric / cd.max_trainees * 100, 1) as fill_rate
FROM public.class_divisions cd
INNER JOIN public.course_sessions cs ON cd.session_id = cs.id
WHERE cs.session_code = 'BS-SALES-101-2024-3'
ORDER BY cd.division_number;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '교육생 등록 샘플 데이터 생성 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 데이터:';
    RAISE NOTICE '  - 샘플 교육생 10명 (A반 5명, B반 5명)';
    RAISE NOTICE '  - 과정 등록 10건';
    RAISE NOTICE '  - 분반 교육생 수 자동 업데이트';
    RAISE NOTICE '========================================';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. 시험-문제 연결 (exam_questions)';
    RAISE NOTICE '  2. (선택) 시험 응시 샘플 데이터';
    RAISE NOTICE '========================================';
END $$;
