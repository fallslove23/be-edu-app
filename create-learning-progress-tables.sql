-- 학습 진도 추적 시스템 테이블 생성
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. learning_progress 메인 테이블 생성
CREATE TABLE IF NOT EXISTS public.learning_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL, -- courses 테이블과 연결 (필요시 FK 추가)
    activity_id UUID, -- activities 테이블과 연결 (필요시 FK 추가)
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_time_spent INTEGER DEFAULT 0, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약: 사용자당 코스별로 하나의 진도만 존재
    CONSTRAINT unique_user_course_progress UNIQUE(user_id, course_id)
);

-- 2. learning_activities 세부 활동 기록 테이블
CREATE TABLE IF NOT EXISTS public.learning_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    progress_id UUID NOT NULL REFERENCES public.learning_progress(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'video_watch', 'quiz_attempt', 'assignment_submit' 등
    activity_data JSONB DEFAULT '{}', -- 활동별 세부 데이터
    duration_minutes INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. assessments 평가 관리 테이블
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    progress_id UUID NOT NULL REFERENCES public.learning_progress(id) ON DELETE CASCADE,
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('quiz', 'assignment', 'exam', 'project', 'participation')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_score DECIMAL(5,2) NOT NULL,
    passing_score DECIMAL(5,2) NOT NULL,
    attempts_allowed INTEGER DEFAULT 1,
    time_limit_minutes INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. assessment_attempts 평가 응답/결과 테이블
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    time_spent_minutes INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES public.users(id),
    
    -- 유니크 제약: 사용자별 평가별 시도번호는 유일
    CONSTRAINT unique_user_assessment_attempt UNIQUE(assessment_id, user_id, attempt_number)
);

-- 5. learning_goals 학습 목표 및 마일스톤 테이블
CREATE TABLE IF NOT EXISTS public.learning_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    progress_id UUID NOT NULL REFERENCES public.learning_progress(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_criteria JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    completed_date TIMESTAMP WITH TIME ZONE,
    weight DECIMAL(3,2) DEFAULT 0.1 CHECK (weight >= 0 AND weight <= 1), -- 0-1 범위
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. learning_stats 학습 통계 테이블
CREATE TABLE IF NOT EXISTS public.learning_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    total_courses INTEGER DEFAULT 0,
    completed_courses INTEGER DEFAULT 0,
    in_progress_courses INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- minutes
    average_completion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    strengths TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON public.learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_course_id ON public.learning_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_status ON public.learning_progress(status);
CREATE INDEX IF NOT EXISTS idx_learning_progress_last_activity ON public.learning_progress(last_activity_date);

CREATE INDEX IF NOT EXISTS idx_learning_activities_progress_id ON public.learning_activities(progress_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_type ON public.learning_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_activities_created_at ON public.learning_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_assessments_progress_id ON public.assessments(progress_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessments_due_date ON public.assessments(due_date);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_submitted_at ON public.assessment_attempts(submitted_at);

CREATE INDEX IF NOT EXISTS idx_learning_goals_progress_id ON public.learning_goals(progress_id);
CREATE INDEX IF NOT EXISTS idx_learning_goals_target_date ON public.learning_goals(target_date);

-- 8. updated_at 자동 업데이트 트리거 적용
CREATE TRIGGER update_learning_progress_updated_at
    BEFORE UPDATE ON public.learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_goals_updated_at
    BEFORE UPDATE ON public.learning_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_stats_updated_at
    BEFORE UPDATE ON public.learning_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Row Level Security (RLS) 설정
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_stats ENABLE ROW LEVEL SECURITY;

-- 10. RLS 정책 생성 (모든 인증된 사용자가 조회/수정 가능)
-- learning_progress 정책
CREATE POLICY "learning_progress_select_policy" ON public.learning_progress
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "learning_progress_insert_policy" ON public.learning_progress
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "learning_progress_update_policy" ON public.learning_progress
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "learning_progress_delete_policy" ON public.learning_progress
    FOR DELETE TO authenticated USING (true);

-- learning_activities 정책
CREATE POLICY "learning_activities_select_policy" ON public.learning_activities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "learning_activities_insert_policy" ON public.learning_activities
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "learning_activities_update_policy" ON public.learning_activities
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "learning_activities_delete_policy" ON public.learning_activities
    FOR DELETE TO authenticated USING (true);

-- assessments 정책
CREATE POLICY "assessments_select_policy" ON public.assessments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "assessments_insert_policy" ON public.assessments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assessments_update_policy" ON public.assessments
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "assessments_delete_policy" ON public.assessments
    FOR DELETE TO authenticated USING (true);

-- assessment_attempts 정책
CREATE POLICY "assessment_attempts_select_policy" ON public.assessment_attempts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "assessment_attempts_insert_policy" ON public.assessment_attempts
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assessment_attempts_update_policy" ON public.assessment_attempts
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "assessment_attempts_delete_policy" ON public.assessment_attempts
    FOR DELETE TO authenticated USING (true);

-- learning_goals 정책
CREATE POLICY "learning_goals_select_policy" ON public.learning_goals
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "learning_goals_insert_policy" ON public.learning_goals
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "learning_goals_update_policy" ON public.learning_goals
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "learning_goals_delete_policy" ON public.learning_goals
    FOR DELETE TO authenticated USING (true);

-- learning_stats 정책
CREATE POLICY "learning_stats_select_policy" ON public.learning_stats
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "learning_stats_insert_policy" ON public.learning_stats
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "learning_stats_update_policy" ON public.learning_stats
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "learning_stats_delete_policy" ON public.learning_stats
    FOR DELETE TO authenticated USING (true);

-- 11. 테이블 코멘트 추가
COMMENT ON TABLE public.learning_progress IS 'BS 학습 관리 시스템 - 학습 진도 추적 메인 테이블';
COMMENT ON TABLE public.learning_activities IS 'BS 학습 관리 시스템 - 세부 학습 활동 기록 테이블';
COMMENT ON TABLE public.assessments IS 'BS 학습 관리 시스템 - 평가 관리 테이블';
COMMENT ON TABLE public.assessment_attempts IS 'BS 학습 관리 시스템 - 평가 응답/결과 테이블';
COMMENT ON TABLE public.learning_goals IS 'BS 학습 관리 시스템 - 학습 목표 및 마일스톤 테이블';
COMMENT ON TABLE public.learning_stats IS 'BS 학습 관리 시스템 - 학습 통계 테이블';

-- 12. 초기 데이터 및 함수 생성
-- 학습 통계 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_learning_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 사용자의 학습 통계 업데이트
    INSERT INTO learning_stats (
        user_id,
        total_courses,
        completed_courses,
        in_progress_courses,
        total_time_spent,
        average_completion_rate,
        last_activity_date,
        updated_at
    )
    SELECT 
        NEW.user_id,
        COUNT(*) as total_courses,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_courses,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_courses,
        COALESCE(SUM(total_time_spent), 0) as total_time_spent,
        COALESCE(AVG(progress_percentage), 0) as average_completion_rate,
        MAX(last_activity_date) as last_activity_date,
        NOW() as updated_at
    FROM learning_progress 
    WHERE user_id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        total_courses = EXCLUDED.total_courses,
        completed_courses = EXCLUDED.completed_courses,
        in_progress_courses = EXCLUDED.in_progress_courses,
        total_time_spent = EXCLUDED.total_time_spent,
        average_completion_rate = EXCLUDED.average_completion_rate,
        last_activity_date = EXCLUDED.last_activity_date,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 학습 진도 업데이트 시 통계 자동 업데이트 트리거
CREATE TRIGGER update_stats_on_progress_change
    AFTER INSERT OR UPDATE OR DELETE ON learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_stats();

-- 13. 생성 결과 확인
SELECT 'learning_progress 테이블 생성 완료' as message;
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('learning_progress', 'learning_activities', 'assessments', 'assessment_attempts', 'learning_goals', 'learning_stats')
ORDER BY table_name, ordinal_position;

-- 성공 메시지
SELECT '✅ 학습 진도 추적 테이블들이 성공적으로 생성되었습니다!' as result;