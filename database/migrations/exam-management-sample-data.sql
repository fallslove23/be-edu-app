-- ========================================
-- 시험 관리 시스템 샘플 데이터 및 사용 예제
-- ========================================

-- ========================================
-- 1. 샘플 데이터 삽입
-- ========================================

-- 1.1 과정 템플릿 생성
INSERT INTO public.course_templates (code, name, description, duration_weeks, category, difficulty_level, tags) VALUES
('BS-SALES-101', 'BS 영업 기초과정', '영업의 기본 개념과 프로세스를 학습하는 과정', 2, '영업', 'beginner', ARRAY['영업', '기초', 'BS활동']),
('BS-SALES-201', 'BS 고급 영업 전략', '고급 영업 전략과 실무 적용', 3, '영업', 'advanced', ARRAY['영업', '고급', '전략']),
('BS-CRM-101', 'BS 고객 관리 시스템', 'CRM 시스템 활용과 고객 관리 전략', 2, '영업', 'intermediate', ARRAY['CRM', '고객관리'])
ON CONFLICT (code) DO NOTHING;

-- 1.2 과정 차수 생성
-- BS 영업 기초과정 2024년 3차 (분반 운영)
INSERT INTO public.course_sessions (
    template_id, session_code, session_name, session_number, session_year,
    start_date, end_date, total_capacity, has_divisions, status
)
SELECT
    id, 'BS-SALES-101-2024-3', '2024년 3차', 3, 2024,
    '2024-10-01', '2024-10-15', 60, true, 'in_progress'
FROM public.course_templates WHERE code = 'BS-SALES-101'
ON CONFLICT (session_code) DO NOTHING;

-- BS 고급 영업 전략 2024년 1차
INSERT INTO public.course_sessions (
    template_id, session_code, session_name, session_number, session_year,
    start_date, end_date, total_capacity, has_divisions, status
)
SELECT
    id, 'BS-SALES-201-2024-1', '2024년 1차', 1, 2024,
    '2024-08-20', '2024-09-05', 40, false, 'in_progress'
FROM public.course_templates WHERE code = 'BS-SALES-201'
ON CONFLICT (session_code) DO NOTHING;

-- 1.3 분반 생성 (BS 영업 기초과정 3차)
INSERT INTO public.class_divisions (
    session_id, division_code, division_name, division_number,
    max_trainees, classroom, schedule_info
)
SELECT
    cs.id,
    'BS-SALES-101-2024-3-A',
    'A반',
    1,
    30,
    '본사 3층 301호',
    '{"mon": "09:00-12:00", "wed": "09:00-12:00", "fri": "09:00-12:00"}'::jsonb
FROM public.course_sessions cs
WHERE cs.session_code = 'BS-SALES-101-2024-3'
ON CONFLICT (session_id, division_number) DO NOTHING;

INSERT INTO public.class_divisions (
    session_id, division_code, division_name, division_number,
    max_trainees, classroom, schedule_info
)
SELECT
    cs.id,
    'BS-SALES-101-2024-3-B',
    'B반',
    2,
    30,
    '본사 3층 302호',
    '{"tue": "14:00-17:00", "thu": "14:00-17:00", "fri": "14:00-17:00"}'::jsonb
FROM public.course_sessions cs
WHERE cs.session_code = 'BS-SALES-101-2024-3'
ON CONFLICT (session_id, division_number) DO NOTHING;

-- 1.4 문제은행 생성
INSERT INTO public.question_banks (name, description, template_id, category) VALUES
(
    'BS 영업 기초 문제은행',
    '영업의 기본 개념과 프로세스에 대한 문제들',
    (SELECT id FROM public.course_templates WHERE code = 'BS-SALES-101'),
    '이론'
),
(
    '고급 영업 전략 문제은행',
    '고급 영업 전략과 실무 적용 문제들',
    (SELECT id FROM public.course_templates WHERE code = 'BS-SALES-201'),
    '실무'
);

-- 1.5 샘플 문제 생성
INSERT INTO public.questions (
    bank_id, type, question_text, options, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'multiple_choice',
    '영업의 기본 단계 중 첫 번째는 무엇인가요?',
    '{"options": [
        {"id": "a", "text": "고객 발굴"},
        {"id": "b", "text": "상품 소개"},
        {"id": "c", "text": "계약 체결"},
        {"id": "d", "text": "사후 관리"}
    ]}'::jsonb,
    '["a"]'::jsonb,
    2.0,
    '영업 프로세스의 첫 번째 단계는 잠재 고객을 발굴하는 것입니다.',
    'easy',
    ARRAY['기초', '프로세스']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1;

INSERT INTO public.questions (
    bank_id, type, question_text, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'true_false',
    '고객의 니즈를 파악하지 않고도 성공적인 영업이 가능하다.',
    'false'::jsonb,
    1.0,
    '고객의 니즈 파악은 성공적인 영업의 핵심 요소입니다.',
    'easy',
    ARRAY['기초', '고객 니즈']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1;

INSERT INTO public.questions (
    bank_id, type, question_text, options, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'multiple_choice',
    'SPIN 영업 기법에서 "S"는 무엇을 의미하나요?',
    '{"options": [
        {"id": "a", "text": "Situation"},
        {"id": "b", "text": "Solution"},
        {"id": "c", "text": "Strategy"},
        {"id": "d", "text": "Success"}
    ]}'::jsonb,
    '["a"]'::jsonb,
    2.0,
    'SPIN에서 S는 Situation(상황)을 의미합니다.',
    'medium',
    ARRAY['고급', 'SPIN', '전략']
FROM public.question_banks qb
WHERE qb.name = '고급 영업 전략 문제은행'
LIMIT 1;

-- ========================================
-- 2. 시험 생성 시나리오
-- ========================================

-- 2.1 시나리오 1: 분반별 일일 퀴즈
-- A반 Day 1 Quiz (오전 10시)
INSERT INTO public.exams (
    title, description, exam_type, division_id, bank_id,
    scheduled_at, duration_minutes, passing_score, total_points,
    max_attempts, status
)
SELECT
    'Day 1 Morning Quiz',
    'BS 영업 기초과정 첫날 오전 퀴즈',
    'quiz',
    cd.id,
    qb.id,
    '2024-10-01 10:00:00',
    15,
    70.0,
    10.0,
    2,
    'published'
FROM public.class_divisions cd
CROSS JOIN public.question_banks qb
WHERE cd.division_code = 'BS-SALES-101-2024-3-A'
AND qb.name = 'BS 영업 기초 문제은행';

-- B반 Day 1 Quiz (오전 11시)
INSERT INTO public.exams (
    title, description, exam_type, division_id, bank_id,
    scheduled_at, duration_minutes, passing_score, total_points,
    max_attempts, status
)
SELECT
    'Day 1 Morning Quiz',
    'BS 영업 기초과정 첫날 오전 퀴즈',
    'quiz',
    cd.id,
    qb.id,
    '2024-10-01 11:00:00',
    15,
    70.0,
    10.0,
    2,
    'published'
FROM public.class_divisions cd
CROSS JOIN public.question_banks qb
WHERE cd.division_code = 'BS-SALES-101-2024-3-B'
AND qb.name = 'BS 영업 기초 문제은행';

-- 2.2 시나리오 2: 차수 전체 최종평가 (A+B반 통합)
INSERT INTO public.exams (
    title, description, exam_type, session_id, bank_id,
    scheduled_at, duration_minutes, passing_score, total_points,
    max_attempts, randomize_questions, status
)
SELECT
    'BS 영업 기초과정 최종평가',
    '2024년 3차 전체 교육생 대상 종합평가',
    'final',
    cs.id,
    qb.id,
    '2024-10-15 10:00:00',
    90,
    70.0,
    100.0,
    1,
    true,
    'published'
FROM public.course_sessions cs
CROSS JOIN public.question_banks qb
WHERE cs.session_code = 'BS-SALES-101-2024-3'
AND qb.name = 'BS 영업 기초 문제은행';

-- 2.3 시나리오 3: 다중 분반 공유 시험 (중간평가)
INSERT INTO public.exams (
    title, description, exam_type,
    is_shared_exam, target_divisions, bank_id,
    scheduled_at, duration_minutes, passing_score, total_points,
    status
)
SELECT
    'BS 영업 기초과정 중간평가',
    'A반, B반 공동 중간평가 (같은 문제, 다른 시간)',
    'midterm',
    true,
    ARRAY(SELECT id FROM public.class_divisions WHERE division_code IN ('BS-SALES-101-2024-3-A', 'BS-SALES-101-2024-3-B')),
    qb.id,
    '2024-10-08 10:00:00',
    60,
    70.0,
    50.0,
    'published'
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행';

-- ========================================
-- 3. 유용한 쿼리 예제
-- ========================================

-- 3.1 특정 시험의 응시 대상자 조회
-- 사용법: :exam_id를 실제 시험 ID로 변경
/*
WITH exam_targets AS (
    SELECT
        e.id as exam_id,
        CASE
            -- Case 1: 특정 분반 시험
            WHEN e.division_id IS NOT NULL THEN
                ARRAY[e.division_id]

            -- Case 2: 차수 전체 시험
            WHEN e.session_id IS NOT NULL THEN
                (SELECT array_agg(id) FROM public.class_divisions WHERE session_id = e.session_id)

            -- Case 3: 다중 분반 공유 시험
            WHEN e.is_shared_exam AND e.target_divisions IS NOT NULL THEN
                e.target_divisions

            ELSE ARRAY[]::UUID[]
        END as target_division_ids
    FROM public.exams e
    WHERE e.id = :exam_id
)
SELECT DISTINCT
    u.id,
    u.name,
    u.email,
    u.department,
    cs.session_name,
    cd.division_name,
    ce.enrolled_at
FROM public.users u
INNER JOIN public.course_enrollments ce ON u.id = ce.trainee_id
INNER JOIN public.course_sessions cs ON ce.session_id = cs.id
LEFT JOIN public.class_divisions cd ON ce.division_id = cd.id
CROSS JOIN exam_targets et
WHERE
    ce.status = 'active'
    AND u.role = 'trainee'
    AND (
        -- 분반 배정된 경우
        (ce.division_id IS NOT NULL AND ce.division_id = ANY(et.target_division_ids))
        -- 또는 차수만 배정된 경우 (분반 미배정)
        OR (ce.division_id IS NULL AND cs.id = (SELECT session_id FROM public.exams WHERE id = :exam_id))
    )
ORDER BY cd.division_name NULLS FIRST, u.name;
*/

-- 3.2 분반별 시험 성적 통계
/*
SELECT
    cd.division_name,
    COUNT(DISTINCT ea.trainee_id) as total_takers,
    ROUND(AVG(ea.score), 2) as avg_score,
    MIN(ea.score) as min_score,
    MAX(ea.score) as max_score,
    COUNT(CASE WHEN ea.passed = true THEN 1 END) as pass_count,
    ROUND(
        COUNT(CASE WHEN ea.passed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100,
        2
    ) as pass_rate
FROM public.exams e
LEFT JOIN public.exam_attempts ea ON e.id = ea.exam_id AND ea.status = 'graded'
LEFT JOIN public.course_enrollments ce ON ea.trainee_id = ce.trainee_id
LEFT JOIN public.class_divisions cd ON ce.division_id = cd.id
WHERE e.id = :exam_id
GROUP BY cd.id, cd.division_name
ORDER BY cd.division_name;
*/

-- 3.3 교육생별 시험 이력 조회
/*
SELECT
    e.title,
    e.exam_type,
    cs.session_name,
    cd.division_name,
    ea.attempt_number,
    ea.score,
    ea.score_percentage,
    ea.passed,
    ea.submitted_at,
    EXTRACT(EPOCH FROM (ea.submitted_at - ea.started_at)) / 60 as time_spent_minutes
FROM public.exam_attempts ea
INNER JOIN public.exams e ON ea.exam_id = e.id
LEFT JOIN public.course_sessions cs ON e.session_id = cs.id
LEFT JOIN public.class_divisions cd ON e.division_id = cd.id
WHERE ea.trainee_id = :trainee_id
ORDER BY ea.submitted_at DESC;
*/

-- 3.4 문제은행에서 시험 생성 (문제 자동 연결)
/*
-- Step 1: 시험 생성
INSERT INTO public.exams (
    title, exam_type, division_id, bank_id,
    scheduled_at, duration_minutes, passing_score
) VALUES (
    'Day 2 Quiz',
    'quiz',
    :division_id,
    :bank_id,
    '2024-10-02 10:00:00',
    15,
    70.0
) RETURNING id;

-- Step 2: 문제은행에서 난이도별 문제 자동 선택
WITH selected_questions AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY difficulty ORDER BY RANDOM()) as rn
    FROM public.questions
    WHERE bank_id = :bank_id
    AND is_active = true
)
INSERT INTO public.exam_questions (exam_id, question_id, order_index, points)
SELECT
    :exam_id,
    id,
    ROW_NUMBER() OVER (ORDER BY difficulty, rn),
    points
FROM selected_questions
WHERE rn <= 5  -- 난이도별 5문제씩
ORDER BY difficulty, rn;
*/

-- 3.5 시험 응시 (교육생)
/*
-- Step 1: 응시 기록 생성
INSERT INTO public.exam_attempts (
    exam_id, trainee_id, attempt_number, started_at, status
) VALUES (
    :exam_id,
    :trainee_id,
    1,
    NOW(),
    'in_progress'
) RETURNING id;

-- Step 2: 답안 제출
UPDATE public.exam_attempts
SET
    submitted_at = NOW(),
    answers = :answers_jsonb,  -- {"q1": "a", "q2": ["a", "b"], ...}
    status = 'submitted'
WHERE id = :attempt_id;

-- Step 3: 자동 채점 (객관식/O/X만)
WITH grading AS (
    SELECT
        qr.id as response_id,
        qr.answer,
        q.correct_answer,
        CASE
            WHEN q.type IN ('multiple_choice', 'true_false') THEN
                qr.answer = q.correct_answer
            ELSE
                NULL  -- 주관식은 수동 채점 필요
        END as is_correct,
        CASE
            WHEN q.type IN ('multiple_choice', 'true_false') AND qr.answer = q.correct_answer THEN
                eq.points
            WHEN q.type IN ('short_answer', 'essay') THEN
                NULL  -- 주관식은 수동 채점 필요
            ELSE
                0
        END as points_earned
    FROM public.question_responses qr
    INNER JOIN public.questions q ON qr.question_id = q.id
    INNER JOIN public.exam_questions eq ON eq.question_id = q.id
    WHERE qr.attempt_id = :attempt_id
)
UPDATE public.question_responses qr
SET
    is_correct = g.is_correct,
    points_earned = g.points_earned,
    needs_manual_grading = (g.is_correct IS NULL)
FROM grading g
WHERE qr.id = g.response_id;

-- Step 4: 점수 계산 및 합격 여부 판정
UPDATE public.exam_attempts ea
SET
    score = (
        SELECT COALESCE(SUM(points_earned), 0)
        FROM public.question_responses
        WHERE attempt_id = ea.id
    ),
    score_percentage = (
        SELECT ROUND(
            COALESCE(SUM(points_earned), 0) / NULLIF(e.total_points, 0) * 100,
            2
        )
        FROM public.question_responses qr
        CROSS JOIN public.exams e
        WHERE qr.attempt_id = ea.id
        AND e.id = ea.exam_id
    ),
    passed = (
        SELECT (COALESCE(SUM(points_earned), 0) / NULLIF(e.total_points, 0) * 100) >= e.passing_score
        FROM public.question_responses qr
        CROSS JOIN public.exams e
        WHERE qr.attempt_id = ea.id
        AND e.id = ea.exam_id
    ),
    status = 'graded'
WHERE ea.id = :attempt_id
AND NOT EXISTS (
    SELECT 1 FROM public.question_responses
    WHERE attempt_id = ea.id
    AND needs_manual_grading = true
);
*/

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '시험 관리 시스템 샘플 데이터 생성 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 데이터:';
    RAISE NOTICE '  - 과정 템플릿 3개';
    RAISE NOTICE '  - 과정 차수 2개 (3차는 분반 운영)';
    RAISE NOTICE '  - 분반 2개 (A반, B반)';
    RAISE NOTICE '  - 문제은행 2개';
    RAISE NOTICE '  - 샘플 문제 3개';
    RAISE NOTICE '  - 시험 4개 (분반별, 차수 전체, 공유 시험)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. 교육생 등록 (course_enrollments)';
    RAISE NOTICE '  2. 시험-문제 연결 (exam_questions)';
    RAISE NOTICE '  3. 서비스 레이어 구현';
    RAISE NOTICE '========================================';
END $$;
