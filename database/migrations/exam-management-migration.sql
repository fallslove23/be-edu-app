-- ========================================
-- 시험 관리 시스템 마이그레이션 스크립트
-- 기존 데이터 유지하면서 점진적 업그레이드
-- ========================================

-- ========================================
-- Step 1: 새 테이블 생성 (기존 테이블과 독립적)
-- ========================================

-- 1.1 과정 템플릿 생성
CREATE TABLE IF NOT EXISTS public.course_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    category TEXT,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    tags TEXT[],
    prerequisites TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 과정 차수 생성
CREATE TABLE IF NOT EXISTS public.course_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.course_templates(id) ON DELETE CASCADE,

    -- 기존 course_id와의 호환성을 위한 컬럼
    legacy_course_id UUID REFERENCES public.courses(id),

    session_code TEXT UNIQUE NOT NULL,
    session_name TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    session_year INTEGER NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    enrollment_start DATE,
    enrollment_end DATE,

    total_capacity INTEGER DEFAULT 50,
    current_enrollment INTEGER DEFAULT 0,
    has_divisions BOOLEAN DEFAULT false,

    manager_id UUID REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 분반 생성
CREATE TABLE IF NOT EXISTS public.class_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE,

    division_code TEXT UNIQUE NOT NULL,
    division_name TEXT NOT NULL,
    division_number INTEGER,

    instructor_id UUID REFERENCES public.users(id),
    teaching_assistant_id UUID REFERENCES public.users(id),

    max_trainees INTEGER DEFAULT 30,
    current_trainees INTEGER DEFAULT 0,

    schedule_info JSONB,
    classroom TEXT,
    notes TEXT,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(session_id, division_number)
);

-- ========================================
-- Step 2: course_enrollments 테이블 확장
-- ========================================

-- 2.1 session_id 컬럼 추가 (기존 course_id 유지)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'course_enrollments'
        AND column_name = 'session_id'
    ) THEN
        ALTER TABLE public.course_enrollments
        ADD COLUMN session_id UUID REFERENCES public.course_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2.2 division_id 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'course_enrollments'
        AND column_name = 'division_id'
    ) THEN
        ALTER TABLE public.course_enrollments
        ADD COLUMN division_id UUID REFERENCES public.class_divisions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ========================================
-- Step 3: 시험 관리 테이블 생성
-- ========================================

-- 3.1 문제은행
CREATE TABLE IF NOT EXISTS public.question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES public.course_templates(id),
    category TEXT,

    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 문제
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID REFERENCES public.question_banks(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'ordering')),
    question_text TEXT NOT NULL,
    question_html TEXT,

    options JSONB,
    correct_answer JSONB,

    points DECIMAL(5,2) DEFAULT 1.0,
    explanation TEXT,
    explanation_html TEXT,

    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[],
    estimated_time_seconds INTEGER,

    usage_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),

    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 시험
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    description TEXT,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('final', 'midterm', 'quiz', 'daily_test', 'practice', 'assignment')),

    -- 유연한 3-level 연결
    template_id UUID REFERENCES public.course_templates(id),
    session_id UUID REFERENCES public.course_sessions(id),
    division_id UUID REFERENCES public.class_divisions(id),

    -- 기존 호환성을 위한 컬럼
    legacy_course_id UUID REFERENCES public.courses(id),

    bank_id UUID REFERENCES public.question_banks(id),

    scheduled_at TIMESTAMP WITH TIME ZONE,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,

    duration_minutes INTEGER NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    total_points DECIMAL(5,2) DEFAULT 100.0,

    max_attempts INTEGER DEFAULT 1,
    allow_review BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT false,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,

    is_shared_exam BOOLEAN DEFAULT false,
    target_sessions UUID[],
    target_divisions UUID[],

    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived')),

    instructions TEXT,
    proctoring_required BOOLEAN DEFAULT false,

    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.4 시험-문제 연결
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,

    order_index INTEGER NOT NULL,
    points DECIMAL(5,2) NOT NULL,
    is_required BOOLEAN DEFAULT true,

    UNIQUE(exam_id, question_id),
    UNIQUE(exam_id, order_index)
);

-- 3.5 시험 응시 기록
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    attempt_number INTEGER NOT NULL,

    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,

    score DECIMAL(5,2),
    score_percentage DECIMAL(5,2),
    passed BOOLEAN,
    grade TEXT,

    answers JSONB,

    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'needs_grading')),

    graded_by UUID REFERENCES public.users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(exam_id, trainee_id, attempt_number)
);

-- 3.6 문제 응답
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id),

    answer JSONB,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),

    needs_manual_grading BOOLEAN DEFAULT false,
    grader_feedback TEXT,

    answered_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(attempt_id, question_id)
);

-- ========================================
-- Step 4: 인덱스 생성
-- ========================================

CREATE INDEX IF NOT EXISTS idx_course_templates_code ON public.course_templates(code);
CREATE INDEX IF NOT EXISTS idx_course_templates_category ON public.course_templates(category);

CREATE INDEX IF NOT EXISTS idx_sessions_template ON public.course_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_legacy_course ON public.course_sessions(legacy_course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON public.course_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.course_sessions(status);

CREATE INDEX IF NOT EXISTS idx_divisions_session ON public.class_divisions(session_id);
CREATE INDEX IF NOT EXISTS idx_divisions_instructor ON public.class_divisions(instructor_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_session ON public.course_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_division ON public.course_enrollments(division_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_question_banks_template ON public.question_banks(template_id);

CREATE INDEX IF NOT EXISTS idx_questions_bank ON public.questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_exams_template ON public.exams(template_id);
CREATE INDEX IF NOT EXISTS idx_exams_session ON public.exams(session_id);
CREATE INDEX IF NOT EXISTS idx_exams_division ON public.exams(division_id);
CREATE INDEX IF NOT EXISTS idx_exams_legacy_course ON public.exams(legacy_course_id);
CREATE INDEX IF NOT EXISTS idx_exams_scheduled ON public.exams(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question ON public.exam_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_trainee ON public.exam_attempts(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.exam_attempts(status);

CREATE INDEX IF NOT EXISTS idx_responses_attempt ON public.question_responses(attempt_id);

-- ========================================
-- Step 5: 트리거 함수
-- ========================================

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용
DROP TRIGGER IF EXISTS update_course_templates_updated_at ON public.course_templates;
CREATE TRIGGER update_course_templates_updated_at
    BEFORE UPDATE ON public.course_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_sessions_updated_at ON public.course_sessions;
CREATE TRIGGER update_course_sessions_updated_at
    BEFORE UPDATE ON public.course_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_divisions_updated_at ON public.class_divisions;
CREATE TRIGGER update_class_divisions_updated_at
    BEFORE UPDATE ON public.class_divisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_question_banks_updated_at ON public.question_banks;
CREATE TRIGGER update_question_banks_updated_at
    BEFORE UPDATE ON public.question_banks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_attempts_updated_at ON public.exam_attempts;
CREATE TRIGGER update_exam_attempts_updated_at
    BEFORE UPDATE ON public.exam_attempts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 문제 사용 횟수 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_question_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.questions
        SET usage_count = usage_count + 1
        WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.questions
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE id = OLD.question_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_usage_trigger ON public.exam_questions;
CREATE TRIGGER question_usage_trigger
    AFTER INSERT OR DELETE ON public.exam_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_question_usage();

-- ========================================
-- Step 6: RLS 정책
-- ========================================

ALTER TABLE public.course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- 기본 조회 정책
CREATE POLICY "course_templates_select" ON public.course_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_sessions_select" ON public.course_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "class_divisions_select" ON public.class_divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "question_banks_select" ON public.question_banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_select" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_select" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exam_questions_select" ON public.exam_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_attempts_select" ON public.exam_attempts
    FOR SELECT TO authenticated
    USING (
        trainee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

CREATE POLICY "exams_modify" ON public.exams
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

CREATE POLICY "exam_attempts_insert" ON public.exam_attempts
    FOR INSERT TO authenticated
    WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "exam_attempts_update" ON public.exam_attempts
    FOR UPDATE TO authenticated
    USING (
        trainee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

-- ========================================
-- Step 7: 유용한 뷰
-- ========================================

-- 시험 응시 대상자 조회 (호환성 뷰)
CREATE OR REPLACE VIEW public.v_exam_eligible_trainees AS
SELECT DISTINCT
    e.id as exam_id,
    e.title as exam_title,
    u.id as trainee_id,
    u.name as trainee_name,
    u.email as trainee_email,
    u.department,
    COALESCE(cs.id, e.legacy_course_id) as session_id,
    COALESCE(cs.session_name, c.name) as session_name,
    cd.id as division_id,
    cd.division_name,
    ce.enrolled_at
FROM public.exams e
LEFT JOIN public.course_sessions cs ON (
    e.session_id = cs.id OR
    (e.is_shared_exam AND cs.id = ANY(e.target_sessions))
)
LEFT JOIN public.courses c ON e.legacy_course_id = c.id
LEFT JOIN public.class_divisions cd ON (
    e.division_id = cd.id OR
    (e.is_shared_exam AND cd.id = ANY(e.target_divisions)) OR
    (e.session_id IS NOT NULL AND cd.session_id = cs.id)
)
INNER JOIN public.course_enrollments ce ON (
    (ce.session_id = cs.id AND (ce.division_id = cd.id OR (e.division_id IS NULL AND e.session_id IS NOT NULL)))
    OR (ce.course_id = e.legacy_course_id AND e.legacy_course_id IS NOT NULL)
)
INNER JOIN public.users u ON ce.trainee_id = u.id
WHERE
    ce.status = 'active' AND
    u.role = 'trainee';

-- 시험 통계 뷰
CREATE OR REPLACE VIEW public.v_exam_statistics AS
SELECT
    e.id as exam_id,
    e.title,
    e.exam_type,
    COALESCE(cs.session_name, c.name) as session_name,
    cd.division_name,
    COUNT(DISTINCT ea.trainee_id) as total_takers,
    ROUND(AVG(ea.score), 2) as avg_score,
    MIN(ea.score) as min_score,
    MAX(ea.score) as max_score,
    COUNT(CASE WHEN ea.passed = true THEN 1 END) as pass_count,
    ROUND(
        CASE
            WHEN COUNT(*) > 0 THEN
                COUNT(CASE WHEN ea.passed = true THEN 1 END)::numeric / COUNT(*)::numeric * 100
            ELSE 0
        END,
        2
    ) as pass_rate
FROM public.exams e
LEFT JOIN public.course_sessions cs ON e.session_id = cs.id
LEFT JOIN public.courses c ON e.legacy_course_id = c.id
LEFT JOIN public.class_divisions cd ON e.division_id = cd.id
LEFT JOIN public.exam_attempts ea ON e.id = ea.exam_id AND ea.status = 'graded'
GROUP BY e.id, e.title, e.exam_type, cs.session_name, c.name, cd.division_name;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '시험 관리 시스템 마이그레이션 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '생성된 테이블:';
    RAISE NOTICE '  - course_templates (과정 템플릿)';
    RAISE NOTICE '  - course_sessions (과정 차수)';
    RAISE NOTICE '  - class_divisions (분반) ⭐';
    RAISE NOTICE '  - question_banks (문제은행)';
    RAISE NOTICE '  - questions (문제)';
    RAISE NOTICE '  - exams (시험) ⭐';
    RAISE NOTICE '  - exam_questions (시험-문제 연결)';
    RAISE NOTICE '  - exam_attempts (시험 응시 기록)';
    RAISE NOTICE '  - question_responses (문제 응답)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '확장된 테이블:';
    RAISE NOTICE '  - course_enrollments (+session_id, +division_id)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '호환성:';
    RAISE NOTICE '  - 기존 course_id 유지 (legacy_course_id로 호환)';
    RAISE NOTICE '  - 기존 enrollments 데이터 보존';
    RAISE NOTICE '========================================';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '  1. 기존 courses → course_sessions 데이터 마이그레이션';
    RAISE NOTICE '  2. course_enrollments.course_id → session_id 매핑';
    RAISE NOTICE '========================================';
END $$;
