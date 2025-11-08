-- ========================================
-- RLS 상태 확인 및 활성화
-- ========================================

-- 1단계: 현재 RLS 상태 확인
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'courses',
    'exams',
    'course_sessions',
    'class_divisions',
    'question_banks',
    'questions',
    'exam_questions',
    'course_templates',
    'users',
    'course_enrollments',
    'course_curriculum',
    'course_schedules',
    'trainees'
)
ORDER BY tablename;

-- 2단계: RLS가 비활성화된 테이블 활성화
DO $$
DECLARE
    table_name text;
    tables_to_enable text[] := ARRAY[
        'courses',
        'exams',
        'course_sessions',
        'class_divisions',
        'question_banks',
        'questions',
        'exam_questions',
        'course_templates',
        'users',
        'course_enrollments',
        'course_curriculum',
        'course_schedules',
        'trainees'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_enable
    LOOP
        -- RLS 활성화
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'RLS 활성화: %', table_name;
    END LOOP;
END $$;

-- 3단계: 다시 확인
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'courses',
    'exams',
    'course_sessions',
    'class_divisions',
    'question_banks',
    'questions',
    'exam_questions',
    'course_templates',
    'users',
    'course_enrollments',
    'course_curriculum',
    'course_schedules',
    'trainees'
)
ORDER BY tablename;
