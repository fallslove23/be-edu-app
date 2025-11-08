-- ========================================
-- RLS 정책 설정: 전체 시스템 (완전판)
-- ========================================
-- 목적: anon 키로 모든 필요한 테이블 읽기 가능하도록 설정

-- ========================================
-- 1. courses 테이블 RLS 정책 (누락되었던 부분!)
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.courses;

CREATE POLICY "Enable read access for all users"
ON public.courses
FOR SELECT
USING (true);

-- ========================================
-- 2. exams 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.exams;

CREATE POLICY "Enable read access for all users"
ON public.exams
FOR SELECT
USING (true);

-- ========================================
-- 3. course_sessions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_sessions;

CREATE POLICY "Enable read access for all users"
ON public.course_sessions
FOR SELECT
USING (true);

-- ========================================
-- 4. class_divisions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.class_divisions;

CREATE POLICY "Enable read access for all users"
ON public.class_divisions
FOR SELECT
USING (true);

-- ========================================
-- 5. question_banks 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.question_banks;

CREATE POLICY "Enable read access for all users"
ON public.question_banks
FOR SELECT
USING (true);

-- ========================================
-- 6. questions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;

CREATE POLICY "Enable read access for all users"
ON public.questions
FOR SELECT
USING (true);

-- ========================================
-- 7. exam_questions 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.exam_questions;

CREATE POLICY "Enable read access for all users"
ON public.exam_questions
FOR SELECT
USING (true);

-- ========================================
-- 8. course_templates 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_templates;

CREATE POLICY "Enable read access for all users"
ON public.course_templates
FOR SELECT
USING (true);

-- ========================================
-- 9. users 테이블 RLS 정책 (조심!)
-- ========================================

DROP POLICY IF EXISTS "Enable read access for trainees" ON public.users;

CREATE POLICY "Enable read access for trainees"
ON public.users
FOR SELECT
USING (role = 'trainee' OR role = 'instructor' OR role = 'admin');

-- ========================================
-- 10. course_enrollments 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_enrollments;

CREATE POLICY "Enable read access for all users"
ON public.course_enrollments
FOR SELECT
USING (true);

-- ========================================
-- 11. course_curriculum 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_curriculum;

CREATE POLICY "Enable read access for all users"
ON public.course_curriculum
FOR SELECT
USING (true);

-- ========================================
-- 12. course_schedules 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.course_schedules;

CREATE POLICY "Enable read access for all users"
ON public.course_schedules
FOR SELECT
USING (true);

-- ========================================
-- 13. trainees 테이블 RLS 정책
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.trainees;

CREATE POLICY "Enable read access for all users"
ON public.trainees
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
ORDER BY tablename, policyname;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS 정책 설정 완료! (완전판)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '설정된 정책:';
    RAISE NOTICE '  - courses: 모든 사용자 읽기 가능 ⭐ NEW!';
    RAISE NOTICE '  - exams: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - course_sessions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - class_divisions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - question_banks: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - questions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - exam_questions: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - course_templates: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - users: trainee/instructor/admin만 읽기 가능';
    RAISE NOTICE '  - course_enrollments: 모든 사용자 읽기 가능';
    RAISE NOTICE '  - course_curriculum: 모든 사용자 읽기 가능 ⭐ NEW!';
    RAISE NOTICE '  - course_schedules: 모든 사용자 읽기 가능 ⭐ NEW!';
    RAISE NOTICE '  - trainees: 모든 사용자 읽기 가능 ⭐ NEW!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. 브라우저 새로고침 (Cmd+R)';
    RAISE NOTICE '  2. 콘솔에서 401 오류 사라진 것 확인';
    RAISE NOTICE '  3. 시험 관리 페이지에서 데이터 확인';
    RAISE NOTICE '========================================';
END $$;
