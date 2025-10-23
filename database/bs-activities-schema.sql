-- BS 활동 관리 데이터베이스 스키마

-- 1. BS 활동 일지 테이블
CREATE TABLE IF NOT EXISTS bs_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- 활동 기본 정보
    activity_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('new_visit', 'follow_up', 'contract', 'presentation', 'feedback', 'networking', 'other')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    -- 이미지 정보 (JSON 배열)
    images JSONB DEFAULT '[]'::jsonb,

    -- 위치 정보 (선택적)
    location JSONB,

    -- 제출 상태
    submission_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted')),
    submitted_at TIMESTAMPTZ,

    -- 피드백 정보
    feedback JSONB,

    -- 우수 사례 마킹
    is_best_practice BOOLEAN DEFAULT false,

    -- 발표 관련
    presentation_order INTEGER,
    presentation_score INTEGER CHECK (presentation_score >= 1 AND presentation_score <= 5),

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BS 활동 제출 기한 테이블
CREATE TABLE IF NOT EXISTS bs_activity_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    deadline_date DATE NOT NULL,
    required_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(course_id, week_number)
);

-- 3. 발표 순서 관리 테이블
CREATE TABLE IF NOT EXISTS bs_presentation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    presentation_date DATE NOT NULL,
    trainee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'presenting', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(course_id, presentation_date, order_index)
);

-- 인덱스 생성
CREATE INDEX idx_bs_activities_trainee ON bs_activities(trainee_id);
CREATE INDEX idx_bs_activities_course ON bs_activities(course_id);
CREATE INDEX idx_bs_activities_date ON bs_activities(activity_date);
CREATE INDEX idx_bs_activities_status ON bs_activities(submission_status);
CREATE INDEX idx_bs_activities_best_practice ON bs_activities(is_best_practice) WHERE is_best_practice = true;
CREATE INDEX idx_bs_deadlines_course ON bs_activity_deadlines(course_id);
CREATE INDEX idx_bs_presentation_course_date ON bs_presentation_orders(course_id, presentation_date);

-- Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bs_activities_updated_at BEFORE UPDATE ON bs_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책

-- bs_activities 테이블
ALTER TABLE bs_activities ENABLE ROW LEVEL SECURITY;

-- 교육생: 본인의 활동만 조회/생성/수정 가능
CREATE POLICY "교육생은 본인 활동만 조회" ON bs_activities
    FOR SELECT USING (
        auth.uid() = trainee_id
    );

CREATE POLICY "교육생은 본인 활동만 생성" ON bs_activities
    FOR INSERT WITH CHECK (
        auth.uid() = trainee_id
    );

CREATE POLICY "교육생은 본인 활동만 수정" ON bs_activities
    FOR UPDATE USING (
        auth.uid() = trainee_id
    );

CREATE POLICY "교육생은 본인 활동만 삭제" ON bs_activities
    FOR DELETE USING (
        auth.uid() = trainee_id
    );

-- 강사/관리자: 해당 과정의 모든 활동 조회 및 피드백 가능
CREATE POLICY "강사는 담당 과정 활동 조회" ON bs_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = bs_activities.course_id
            AND (courses.instructor_id = auth.uid() OR courses.manager_id = auth.uid())
        )
    );

CREATE POLICY "강사는 담당 과정 활동 피드백 수정" ON bs_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = bs_activities.course_id
            AND (courses.instructor_id = auth.uid() OR courses.manager_id = auth.uid())
        )
    );

-- bs_activity_deadlines 테이블
ALTER TABLE bs_activity_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자는 기한 조회 가능" ON bs_activity_deadlines
    FOR SELECT USING (true);

CREATE POLICY "강사는 담당 과정 기한 관리" ON bs_activity_deadlines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = bs_activity_deadlines.course_id
            AND (courses.instructor_id = auth.uid() OR courses.manager_id = auth.uid())
        )
    );

-- bs_presentation_orders 테이블
ALTER TABLE bs_presentation_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자는 발표 순서 조회 가능" ON bs_presentation_orders
    FOR SELECT USING (true);

CREATE POLICY "강사는 담당 과정 발표 순서 관리" ON bs_presentation_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = bs_presentation_orders.course_id
            AND (courses.instructor_id = auth.uid() OR courses.manager_id = auth.uid())
        )
    );

-- 스토리지 버킷 생성 (Supabase 콘솔에서 실행 필요)
-- Bucket name: bs-activity-images
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

COMMENT ON TABLE bs_activities IS 'BS 활동 일지 저장 테이블';
COMMENT ON TABLE bs_activity_deadlines IS 'BS 활동 제출 기한 관리 테이블';
COMMENT ON TABLE bs_presentation_orders IS 'BS 활동 발표 순서 관리 테이블';
