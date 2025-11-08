-- ========================================
-- 시험 관리 시스템: 시험-문제 연결 샘플 데이터
-- ========================================

-- ========================================
-- 1. 추가 샘플 문제 생성 (문제 다양성 확보)
-- ========================================

-- BS 영업 기초 문제은행에 추가 문제
INSERT INTO public.questions (
    bank_id, type, question_text, options, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'multiple_choice',
    '효과적인 영업 프레젠테이션의 핵심 요소는?',
    '{"options": [
        {"id": "a", "text": "화려한 슬라이드"},
        {"id": "b", "text": "고객 니즈 기반 솔루션 제시"},
        {"id": "c", "text": "장시간 설명"},
        {"id": "d", "text": "가격 할인 강조"}
    ]}'::jsonb,
    '["b"]'::jsonb,
    2.0,
    '고객의 니즈를 해결하는 솔루션 중심의 프레젠테이션이 가장 효과적입니다.',
    'medium',
    ARRAY['영업', '프레젠테이션']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.questions (
    bank_id, type, question_text, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'true_false',
    '영업 프로세스에서 사후 관리는 선택 사항이다.',
    'false'::jsonb,
    1.0,
    '사후 관리는 고객 만족과 재구매를 위한 필수 단계입니다.',
    'easy',
    ARRAY['기초', '사후관리']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.questions (
    bank_id, type, question_text, options, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'multiple_choice',
    '고객 이의 제기 대응 방법으로 적절하지 않은 것은?',
    '{"options": [
        {"id": "a", "text": "경청하고 공감하기"},
        {"id": "b", "text": "즉시 반박하기"},
        {"id": "c", "text": "질문으로 니즈 파악하기"},
        {"id": "d", "text": "해결책 제시하기"}
    ]}'::jsonb,
    '["b"]'::jsonb,
    2.0,
    '즉시 반박하는 것은 고객과의 관계를 해칠 수 있습니다. 경청과 공감이 우선입니다.',
    'medium',
    ARRAY['영업', '이의제기']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.questions (
    bank_id, type, question_text, options, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'multiple_choice',
    'BS 활동의 주요 목적은 무엇인가?',
    '{"options": [
        {"id": "a", "text": "단순 상품 판매"},
        {"id": "b", "text": "고객 관계 구축 및 니즈 파악"},
        {"id": "c", "text": "경쟁사 정보 수집"},
        {"id": "d", "text": "홍보 활동"}
    ]}'::jsonb,
    '["b"]'::jsonb,
    2.0,
    'BS 활동은 고객과의 장기적 관계 구축과 니즈 파악을 목적으로 합니다.',
    'easy',
    ARRAY['BS활동', '기초']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.questions (
    bank_id, type, question_text, correct_answer,
    points, explanation, difficulty, tags
)
SELECT
    qb.id,
    'true_false',
    '모든 고객에게 동일한 영업 전략을 사용하는 것이 효율적이다.',
    'false'::jsonb,
    1.0,
    '고객별 특성과 니즈에 맞는 맞춤형 전략이 필요합니다.',
    'easy',
    ARRAY['전략', '고객관리']
FROM public.question_banks qb
WHERE qb.name = 'BS 영업 기초 문제은행'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ========================================
-- 2. 시험-문제 연결 (exam_questions)
-- ========================================

-- 2.1 A반 Day 1 Quiz (15분, 10점) - 5문제
WITH a_class_quiz AS (
    SELECT e.id as exam_id
    FROM public.exams e
    INNER JOIN public.class_divisions cd ON e.division_id = cd.id
    WHERE cd.division_code = 'BS-SALES-101-2024-3-A'
    AND e.title = 'Day 1 Morning Quiz'
    LIMIT 1
),
selected_questions AS (
    SELECT
        q.id,
        q.points,
        ROW_NUMBER() OVER (ORDER BY q.difficulty, RANDOM()) as rn
    FROM public.questions q
    INNER JOIN public.question_banks qb ON q.bank_id = qb.id
    WHERE qb.name = 'BS 영업 기초 문제은행'
    AND q.is_active = true
    LIMIT 5
)
INSERT INTO public.exam_questions (exam_id, question_id, order_index, points)
SELECT
    (SELECT exam_id FROM a_class_quiz),
    sq.id,
    sq.rn,
    sq.points
FROM selected_questions sq
ON CONFLICT DO NOTHING;

-- 2.2 B반 Day 1 Quiz (15분, 10점) - 동일한 5문제
WITH b_class_quiz AS (
    SELECT e.id as exam_id
    FROM public.exams e
    INNER JOIN public.class_divisions cd ON e.division_id = cd.id
    WHERE cd.division_code = 'BS-SALES-101-2024-3-B'
    AND e.title = 'Day 1 Morning Quiz'
    LIMIT 1
),
selected_questions AS (
    SELECT
        q.id,
        q.points,
        ROW_NUMBER() OVER (ORDER BY q.difficulty, RANDOM()) as rn
    FROM public.questions q
    INNER JOIN public.question_banks qb ON q.bank_id = qb.id
    WHERE qb.name = 'BS 영업 기초 문제은행'
    AND q.is_active = true
    LIMIT 5
)
INSERT INTO public.exam_questions (exam_id, question_id, order_index, points)
SELECT
    (SELECT exam_id FROM b_class_quiz),
    sq.id,
    sq.rn,
    sq.points
FROM selected_questions sq
ON CONFLICT DO NOTHING;

-- 2.3 중간평가 (60분, 50점) - 모든 문제 (약 7개)
WITH midterm_exam AS (
    SELECT e.id as exam_id
    FROM public.exams e
    WHERE e.title = 'BS 영업 기초과정 중간평가'
    LIMIT 1
),
selected_questions AS (
    SELECT
        q.id,
        q.points,
        ROW_NUMBER() OVER (ORDER BY q.difficulty, q.created_at) as rn
    FROM public.questions q
    INNER JOIN public.question_banks qb ON q.bank_id = qb.id
    WHERE qb.name = 'BS 영업 기초 문제은행'
    AND q.is_active = true
)
INSERT INTO public.exam_questions (exam_id, question_id, order_index, points)
SELECT
    (SELECT exam_id FROM midterm_exam),
    sq.id,
    sq.rn,
    sq.points * 3  -- 중간평가는 배점 3배
FROM selected_questions sq
ON CONFLICT DO NOTHING;

-- 2.4 최종평가 (90분, 100점) - 모든 문제
WITH final_exam AS (
    SELECT e.id as exam_id
    FROM public.exams e
    WHERE e.title = 'BS 영업 기초과정 최종평가'
    LIMIT 1
),
selected_questions AS (
    SELECT
        q.id,
        q.points,
        ROW_NUMBER() OVER (ORDER BY q.difficulty DESC, RANDOM()) as rn
    FROM public.questions q
    INNER JOIN public.question_banks qb ON q.bank_id = qb.id
    WHERE qb.name = 'BS 영업 기초 문제은행'
    AND q.is_active = true
)
INSERT INTO public.exam_questions (exam_id, question_id, order_index, points)
SELECT
    (SELECT exam_id FROM final_exam),
    sq.id,
    sq.rn,
    sq.points * 5  -- 최종평가는 배점 5배
FROM selected_questions sq
ON CONFLICT DO NOTHING;

-- ========================================
-- 3. 시험별 총점 자동 계산 및 업데이트
-- ========================================

UPDATE public.exams e
SET total_points = (
    SELECT COALESCE(SUM(eq.points), 0)
    FROM public.exam_questions eq
    WHERE eq.exam_id = e.id
)
WHERE e.id IN (
    SELECT DISTINCT exam_id
    FROM public.exam_questions
);

-- ========================================
-- 4. 검증 쿼리
-- ========================================

-- 4.1 시험별 문제 구성 확인
SELECT
    e.title,
    e.exam_type,
    e.duration_minutes,
    e.total_points,
    COUNT(eq.id) as question_count,
    ROUND(AVG(q.points), 2) as avg_points_per_question
FROM public.exams e
LEFT JOIN public.exam_questions eq ON e.id = eq.exam_id
LEFT JOIN public.questions q ON eq.question_id = q.id
GROUP BY e.id, e.title, e.exam_type, e.duration_minutes, e.total_points
ORDER BY e.scheduled_at;

-- 4.2 특정 시험의 상세 문제 목록
SELECT
    e.title as exam_title,
    eq.order_index,
    q.type,
    q.question_text,
    q.difficulty,
    eq.points,
    q.tags
FROM public.exams e
INNER JOIN public.exam_questions eq ON e.id = eq.exam_id
INNER JOIN public.questions q ON eq.question_id = q.id
WHERE e.title LIKE '%Day 1%'
ORDER BY e.title, eq.order_index
LIMIT 10;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '시험-문제 연결 샘플 데이터 생성 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 데이터:';
    RAISE NOTICE '  - 추가 샘플 문제 5개';
    RAISE NOTICE '  - A반 Quiz 문제 5개 연결';
    RAISE NOTICE '  - B반 Quiz 문제 5개 연결';
    RAISE NOTICE '  - 중간평가 문제 연결';
    RAISE NOTICE '  - 최종평가 문제 연결';
    RAISE NOTICE '  - 시험별 총점 자동 계산';
    RAISE NOTICE '========================================';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. 서비스 레이어 구현';
    RAISE NOTICE '  2. UI 컴포넌트 업데이트';
    RAISE NOTICE '========================================';
END $$;
