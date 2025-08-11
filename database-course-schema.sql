-- 과정 관리를 위한 데이터베이스 스키마

-- 1. courses 테이블 (교육 과정)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.users(id),
    manager_id UUID REFERENCES public.users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_trainees INTEGER DEFAULT 20,
    current_trainees INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. course_enrollments 테이블 (과정 등록/배정)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    completion_date DATE,
    final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
    UNIQUE(course_id, trainee_id)
);

-- 3. course_curriculum 테이블 (커리큘럼)
CREATE TABLE IF NOT EXISTS public.course_curriculum (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_hours INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. course_schedules 테이블 (수업 일정)
CREATE TABLE IF NOT EXISTS public.course_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    curriculum_id UUID REFERENCES public.course_curriculum(id),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    instructor_id UUID REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. course_attendance 테이블 (출석 관리)
CREATE TABLE IF NOT EXISTS public.course_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL REFERENCES public.course_schedules(id) ON DELETE CASCADE,
    trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES public.users(id),
    UNIQUE(schedule_id, trainee_id)
);

-- RLS 정책 설정
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance ENABLE ROW LEVEL SECURITY;

-- courses 테이블 정책
CREATE POLICY "courses_select_policy" ON public.courses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "courses_insert_policy" ON public.courses
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager')
        )
    );

CREATE POLICY "courses_update_policy" ON public.courses
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager')
        ) OR instructor_id = auth.uid() OR manager_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager')
        ) OR instructor_id = auth.uid() OR manager_id = auth.uid()
    );

-- course_enrollments 테이블 정책
CREATE POLICY "enrollments_select_policy" ON public.course_enrollments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "enrollments_insert_policy" ON public.course_enrollments
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager')
        )
    );

CREATE POLICY "enrollments_update_policy" ON public.course_enrollments
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        ) OR trainee_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        ) OR trainee_id = auth.uid()
    );

-- 나머지 테이블들도 동일한 패턴으로 정책 설정
CREATE POLICY "curriculum_select_policy" ON public.course_curriculum
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "curriculum_modify_policy" ON public.course_curriculum
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

CREATE POLICY "schedules_select_policy" ON public.course_schedules
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "schedules_modify_policy" ON public.course_schedules
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

CREATE POLICY "attendance_select_policy" ON public.course_attendance
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "attendance_modify_policy" ON public.course_attendance
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        ) OR trainee_id = auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_manager_id ON public.courses(manager_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_dates ON public.courses(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_trainee_id ON public.course_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.course_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_curriculum_course_id ON public.course_curriculum(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_order ON public.course_curriculum(course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON public.course_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.course_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_instructor ON public.course_schedules(instructor_id);

CREATE INDEX IF NOT EXISTS idx_attendance_schedule_id ON public.course_attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee_id ON public.course_attendance(trainee_id);

-- 트리거 생성 (updated_at 자동 업데이트)
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 과정 등록 시 current_trainees 업데이트 트리거
CREATE OR REPLACE FUNCTION update_course_trainee_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.courses 
        SET current_trainees = current_trainees + 1 
        WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.courses 
        SET current_trainees = current_trainees - 1 
        WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_enrollment_count_trigger
    AFTER INSERT OR DELETE ON public.course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_trainee_count();