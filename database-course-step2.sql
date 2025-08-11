-- 2단계: RLS 활성화 및 기본 정책

-- RLS 활성화
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance ENABLE ROW LEVEL SECURITY;

-- 기본 정책 (모든 인증된 사용자가 조회 가능)
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "courses_delete_policy" ON public.courses
    FOR DELETE TO authenticated USING (true);

-- course_enrollments 정책
CREATE POLICY "enrollments_select_policy" ON public.course_enrollments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "enrollments_insert_policy" ON public.course_enrollments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "enrollments_update_policy" ON public.course_enrollments
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "enrollments_delete_policy" ON public.course_enrollments
    FOR DELETE TO authenticated USING (true);

-- 나머지 테이블들도 동일한 패턴
CREATE POLICY "curriculum_all_policy" ON public.course_curriculum
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "schedules_all_policy" ON public.course_schedules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "attendance_all_policy" ON public.course_attendance
    FOR ALL TO authenticated USING (true) WITH CHECK (true);