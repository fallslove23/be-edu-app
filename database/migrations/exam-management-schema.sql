-- ========================================
-- 시험 관리 시스템 완전판 스키마
-- BS Learning Management System
-- ========================================
--
-- 지원 시나리오:
-- 1. 차수당 1개 시험 (종합평가)
-- 2. 하루 여러 시험 (일일 퀴즈)
-- 3. 합반 시험 (여러 차수 통합)
-- 4. 분반 시험 (같은 차수, 다른 반)
-- 5. 통합 시험 (분반 무시, 차수 전체)
--
-- 계층 구조:
-- Course Template → Course Session → Class Division → Enrollment
--                          ↓              ↓
--                        Exam (Session)  Exam (Division)
-- ========================================

-- ========================================
-- 1. 과정 계층 구조 확장
-- ========================================

-- 1.1 과정 템플릿 (기존 courses 테이블 확장)
-- 기존 테이블이 있다면 컬럼 추가, 없다면 새로 생성
DO $$
BEGIN
    -- course_templates 테이블이 없으면 생성
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'course_templates') THEN
        CREATE TABLE public.course_templates (
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
    END IF;
END $$;

-- 1.2 과정 차수 (Course Session)
CREATE TABLE IF NOT EXISTS public.course_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.course_templates(id) ON DELETE CASCADE,

    -- 차수 식별
    session_code TEXT UNIQUE NOT NULL,
    session_name TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    session_year INTEGER NOT NULL,

    -- 운영 기간
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    enrollment_start DATE,
    enrollment_end DATE,

    -- 정원 관리
    total_capacity INTEGER DEFAULT 50,
    current_enrollment INTEGER DEFAULT 0,

    -- 분반 여부
    has_divisions BOOLEAN DEFAULT false,

    -- 담당자
    manager_id UUID REFERENCES public.users(id),

    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 분반 (Class Division) ⭐ 핵심!
CREATE TABLE IF NOT EXISTS public.class_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE,

    -- 분반 식별
    division_code TEXT UNIQUE NOT NULL,
    division_name TEXT NOT NULL,
    division_number INTEGER,

    -- 분반 정보
    instructor_id UUID REFERENCES public.users(id),
    teaching_assistant_id UUID REFERENCES public.users(id),

    -- 정원
    max_trainees INTEGER DEFAULT 30,
    current_trainees INTEGER DEFAULT 0,

    -- 시간표
    schedule_info JSONB,
    classroom TEXT,

    notes TEXT,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(session_id, division_number)
);

-- 1.4 기존 course_enrollments 테이블에 division_id 컬럼 추가
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
-- 2. 시험 관리 시스템
-- ========================================

-- 2.1 문제은행 (Question Bank)
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

-- 2.2 문제 (Questions)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID REFERENCES public.question_banks(id) ON DELETE CASCADE,

    -- 문제 유형
    type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'ordering')),
    question_text TEXT NOT NULL,
    question_html TEXT,

    -- 선택지 및 정답 (JSONB 형식)
    -- multiple_choice: {"options": [{"id": "a", "text": "선택지1"}, ...], "correct": ["a"]}
    -- true_false: {"correct": true}
    -- short_answer: {"keywords": ["키워드1", "키워드2"], "exact_match": false}
    options JSONB,
    correct_answer JSONB,

    -- 채점 정보
    points DECIMAL(5,2) DEFAULT 1.0,
    explanation TEXT,
    explanation_html TEXT,

    -- 메타데이터
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[],
    estimated_time_seconds INTEGER,

    -- 사용 통계
    usage_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),

    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.3 시험 (Exams) ⭐ 확장성 핵심!
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 기본 정보
    title TEXT NOT NULL,
    description TEXT,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('final', 'midterm', 'quiz', 'daily_test', 'practice', 'assignment')),

    -- 연결 구조 (유연한 3-level 연결) ⭐⭐⭐
    template_id UUID REFERENCES public.course_templates(id),      -- 과정 템플릿 수준 (재사용)
    session_id UUID REFERENCES public.course_sessions(id),        -- 차수 수준 (차수 전체)
    division_id UUID REFERENCES public.class_divisions(id),       -- 분반 수준 (특정 분반만)

    -- 문제 출처
    bank_id UUID REFERENCES public.question_banks(id),

    -- 일정
    scheduled_at TIMESTAMP WITH TIME ZONE,
    available_from TIMESTAMP WITH TIME ZONE,
    available_until TIMESTAMP WITH TIME ZONE,

    -- 시험 설정
    duration_minutes INTEGER NOT NULL,
    passing_score DECIMAL(5,2) DEFAULT 70.0,
    total_points DECIMAL(5,2) DEFAULT 100.0,

    -- 응시 설정
    max_attempts INTEGER DEFAULT 1,
    allow_review BOOLEAN DEFAULT true,
    show_correct_answers BOOLEAN DEFAULT false,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,

    -- 다중 대상 시험 (합반/통합 시험) ⭐
    is_shared_exam BOOLEAN DEFAULT false,
    target_sessions UUID[],              -- 여러 차수 대상
    target_divisions UUID[],             -- 여러 분반 대상

    -- 상태
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived')),

    -- 메타데이터
    instructions TEXT,
    proctoring_required BOOLEAN DEFAULT false,

    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약 조건: 최소 하나의 연결은 있어야 함
    CHECK (
        template_id IS NOT NULL OR
        session_id IS NOT NULL OR
        division_id IS NOT NULL OR
        (is_shared_exam = true AND (target_sessions IS NOT NULL OR target_divisions IS NOT NULL))
    )
);

-- 2.4 시험-문제 연결 (Exam Questions)
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

-- 2.5 시험 응시 기록 (Exam Attempts)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    trainee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    attempt_number INTEGER NOT NULL,

    -- 응시 시간
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,

    -- 채점 결과
    score DECIMAL(5,2),
    score_percentage DECIMAL(5,2),
    passed BOOLEAN,
    grade TEXT,

    -- 응시 데이터 (JSONB 형식)
    -- {"q1": "a", "q2": ["a", "b"], "q3": "주관식 답변"}
    answers JSONB,

    -- 상태
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded', 'needs_grading')),

    -- 채점 정보
    graded_by UUID REFERENCES public.users(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(exam_id, trainee_id, attempt_number)
);

-- 2.6 개별 문제 응답 (Question Responses)
CREATE TABLE IF NOT EXISTS public.question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id),

    -- 응답 데이터
    answer JSONB,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),

    -- 주관식 채점
    needs_manual_grading BOOLEAN DEFAULT false,
    grader_feedback TEXT,

    answered_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(attempt_id, question_id)
);

-- ========================================
-- 3. 인덱스 (Performance Optimization)
-- ========================================

-- Course hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_course_templates_code ON public.course_templates(code);
CREATE INDEX IF NOT EXISTS idx_course_templates_category ON public.course_templates(category);

CREATE INDEX IF NOT EXISTS idx_sessions_template ON public.course_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON public.course_sessions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.course_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_year_number ON public.course_sessions(session_year, session_number);

CREATE INDEX IF NOT EXISTS idx_divisions_session ON public.class_divisions(session_id);
CREATE INDEX IF NOT EXISTS idx_divisions_instructor ON public.class_divisions(instructor_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_session ON public.course_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_division ON public.course_enrollments(division_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_trainee ON public.course_enrollments(trainee_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.course_enrollments(status);

-- Exam system indexes
CREATE INDEX IF NOT EXISTS idx_question_banks_template ON public.question_banks(template_id);

CREATE INDEX IF NOT EXISTS idx_questions_bank ON public.questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(type);

CREATE INDEX IF NOT EXISTS idx_exams_template ON public.exams(template_id);
CREATE INDEX IF NOT EXISTS idx_exams_session ON public.exams(session_id);
CREATE INDEX IF NOT EXISTS idx_exams_division ON public.exams(division_id);
CREATE INDEX IF NOT EXISTS idx_exams_bank ON public.exams(bank_id);
CREATE INDEX IF NOT EXISTS idx_exams_scheduled ON public.exams(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_type ON public.exams(exam_type);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question ON public.exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON public.exam_questions(exam_id, order_index);

CREATE INDEX IF NOT EXISTS idx_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_attempts_trainee ON public.exam_attempts(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted ON public.exam_attempts(submitted_at);

CREATE INDEX IF NOT EXISTS idx_responses_attempt ON public.question_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON public.question_responses(question_id);

-- ========================================
-- 4. 트리거 함수 (Auto-update Logic)
-- ========================================

-- 4.1 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
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

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.course_enrollments;
CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON public.course_enrollments
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

-- 4.2 등록 인원 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_enrollment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 차수 인원 증가
        UPDATE public.course_sessions
        SET current_enrollment = current_enrollment + 1
        WHERE id = NEW.session_id;

        -- 분반 인원 증가
        IF NEW.division_id IS NOT NULL THEN
            UPDATE public.class_divisions
            SET current_trainees = current_trainees + 1
            WHERE id = NEW.division_id;
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        -- 차수 인원 감소
        UPDATE public.course_sessions
        SET current_enrollment = current_enrollment - 1
        WHERE id = OLD.session_id;

        -- 분반 인원 감소
        IF OLD.division_id IS NOT NULL THEN
            UPDATE public.class_divisions
            SET current_trainees = current_trainees - 1
            WHERE id = OLD.division_id;
        END IF;

    ELSIF TG_OP = 'UPDATE' AND OLD.division_id IS DISTINCT FROM NEW.division_id THEN
        -- 분반 변경시
        IF OLD.division_id IS NOT NULL THEN
            UPDATE public.class_divisions
            SET current_trainees = current_trainees - 1
            WHERE id = OLD.division_id;
        END IF;

        IF NEW.division_id IS NOT NULL THEN
            UPDATE public.class_divisions
            SET current_trainees = current_trainees + 1
            WHERE id = NEW.division_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_count_trigger ON public.course_enrollments;
CREATE TRIGGER enrollment_count_trigger
    AFTER INSERT OR DELETE OR UPDATE ON public.course_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_enrollment_counts();

-- 4.3 문제 사용 횟수 자동 업데이트
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
-- 5. RLS (Row Level Security) 정책
-- ========================================

-- RLS 활성화
ALTER TABLE public.course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- 기본 조회 정책 (모든 인증된 사용자)
CREATE POLICY "course_templates_select" ON public.course_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "course_sessions_select" ON public.course_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "class_divisions_select" ON public.class_divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "question_banks_select" ON public.question_banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_select" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_select" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exam_questions_select" ON public.exam_questions FOR SELECT TO authenticated USING (true);

-- 시험 응시 기록 조회 (본인 또는 관리자/강사)
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

CREATE POLICY "question_responses_select" ON public.question_responses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = attempt_id
            AND (
                ea.trainee_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users
                    WHERE id = auth.uid()
                    AND role IN ('app_admin', 'course_manager', 'instructor')
                )
            )
        )
    );

-- 관리자/강사 수정 정책
CREATE POLICY "exams_modify" ON public.exams
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('app_admin', 'course_manager', 'instructor')
        )
    );

-- 교육생 시험 응시 정책
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
-- 6. 유용한 뷰 (Convenience Views)
-- ========================================

-- 6.1 시험 응시 대상자 조회 뷰
CREATE OR REPLACE VIEW public.v_exam_eligible_trainees AS
SELECT DISTINCT
    e.id as exam_id,
    e.title as exam_title,
    u.id as trainee_id,
    u.name as trainee_name,
    u.email as trainee_email,
    u.department,
    cs.id as session_id,
    cs.session_name,
    cd.id as division_id,
    cd.division_name,
    ce.enrolled_at
FROM public.exams e
LEFT JOIN public.course_sessions cs ON (
    e.session_id = cs.id OR
    (e.is_shared_exam AND cs.id = ANY(e.target_sessions))
)
LEFT JOIN public.class_divisions cd ON (
    e.division_id = cd.id OR
    (e.is_shared_exam AND cd.id = ANY(e.target_divisions)) OR
    (e.session_id IS NOT NULL AND cd.session_id = cs.id)
)
INNER JOIN public.course_enrollments ce ON (
    ce.session_id = cs.id AND
    (ce.division_id = cd.id OR (e.division_id IS NULL AND e.session_id IS NOT NULL))
)
INNER JOIN public.users u ON ce.trainee_id = u.id
WHERE
    ce.status = 'active' AND
    u.role = 'trainee';

-- 6.2 시험 통계 뷰
CREATE OR REPLACE VIEW public.v_exam_statistics AS
SELECT
    e.id as exam_id,
    e.title,
    e.exam_type,
    cs.session_name,
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
LEFT JOIN public.class_divisions cd ON e.division_id = cd.id
LEFT JOIN public.exam_attempts ea ON e.id = ea.exam_id AND ea.status = 'graded'
GROUP BY e.id, e.title, e.exam_type, cs.session_name, cd.division_name;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '시험 관리 시스템 스키마 생성 완료!';
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
    RAISE NOTICE '생성된 뷰:';
    RAISE NOTICE '  - v_exam_eligible_trainees (시험 대상자)';
    RAISE NOTICE '  - v_exam_statistics (시험 통계)';
    RAISE NOTICE '========================================';
END $$;
