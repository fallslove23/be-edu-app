-- ========================================
-- API 키 테스트 쿼리
-- ========================================

-- 1. 간단한 테스트 데이터 조회
SELECT
    'API 접근 테스트 성공!' as message,
    COUNT(*) as exam_count
FROM public.exams;

-- 2. courses 테이블 조회
SELECT
    'courses 테이블' as table_name,
    COUNT(*) as record_count
FROM public.courses;

-- 3. 모든 시험 목록
SELECT
    id,
    title,
    exam_type,
    status,
    scheduled_at
FROM public.exams
ORDER BY scheduled_at DESC
LIMIT 5;
