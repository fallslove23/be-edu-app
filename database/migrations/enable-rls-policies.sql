-- ========================================
-- RLS 정책 설정: 시험 관리 시스템
-- ========================================
-- 목적: anon 키로 읽기 가능하도록 설정

-- ========================================
-- 1. exams 테이블 RLS 정책
-- ========================================

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON public.exams;

-- 모든 사용자가 시험 조회 가능
CREATE POLICY "Enable read access for all users"
ON public.exams
FOR SELECT
USING (true);

-- ========================================
-- 2. course_sessions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_sessions;

CREATE POLICY "Enable read access for all users"
ON public.course_sessions
FOR SELECT
USING (true);

-- ========================================
-- 3. class_divisions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.class_divisions;

CREATE POLICY "Enable read access for all users"
ON public.class_divisions
FOR SELECT
USING (true);

-- ========================================
-- 4. question_banks 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.question_banks;

CREATE POLICY "Enable read access for all users"
ON public.question_banks
FOR SELECT
USING (true);

-- ========================================
-- 5. questions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;

CREATE POLICY "Enable read access for all users"
ON public.questions
FOR SELECT
USING (true);

-- ========================================
-- 6. exam_questions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.exam_questions;

CREATE POLICY "Enable read access for all users"
ON public.exam_questions
FOR SELECT
USING (true);

-- ========================================
-- 7. course_templates 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_templates;

CREATE POLICY "Enable read access for all users"
ON public.course_templates
FOR SELECT
USING (true);

-- ========================================
-- 8. users 테이블 RLS 정책 (조심!)
-- ========================================

-- users 테이블은 민감 정보가 있을 수 있으므로 제한적으로 설정
DROP POLICY IF EXISTS "Enable read access for trainees" ON public.users;

CREATE POLICY "Enable read access for trainees"
ON public.users
FOR SELECT
USING (role = 'trainee' OR role = 'instructor' OR role = 'admin');

-- ========================================
-- 9. course_enrollments 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_enrollments;

CREATE POLICY "Enable read access for all users"
ON public.course_enrollments
FOR SELECT
USING (true);

-- ========================================
-- 검증 쿼리
-- ========================================

-- RLS 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'exams',
    'course_sessions',
    'class_divisions',
    'question_banks',
    'questions',
    'exam_questions',
    'course_templates',
    'users',
    'course_enrollments'
)
ORDER BY tablename, policyname;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS 정책 설정 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '설정된 정책:';
    RAISE NOTICE '  - exams: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - course_sessions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - class_divisions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - question_banks: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - questions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - exam_questions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - course_templates: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - users: trainee/instructor/admin만 읽기 가능';
    RAISE NOTICE '  - course_enrollments: 모든 사용자 읽기 가능';
    RAISE NOTICE '========================================';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. 브라우저 새로고침';
    RAISE NOTICE '  2. 시험 관리 페이지에서 데이터 확인';
    RAISE NOTICE '========================================';
END $$;
