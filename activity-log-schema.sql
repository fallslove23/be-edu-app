-- 활동일지 시스템 데이터베이스 스키마

-- 1. 활동일지 메인 테이블 생성
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    activity_date DATE NOT NULL,
    hours_spent DECIMAL(4,2) NOT NULL CHECK (hours_spent > 0),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 활동일지 첨부파일 테이블 생성
CREATE TABLE IF NOT EXISTS activity_log_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_log_id UUID NOT NULL REFERENCES activity_logs(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (쿼리 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_activity_logs_student_id ON activity_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_date ON activity_logs(activity_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_attachments_log_id ON activity_log_attachments(activity_log_id);

-- 4. 자동 updated_at 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. activity_logs 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON activity_logs;
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) 정책 활성화
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log_attachments ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 생성

-- 활동일지 정책: 교육생은 자신의 일지만, 강사/관리자는 모든 일지 조회 가능
CREATE POLICY "activity_logs_select_policy" ON activity_logs
    FOR SELECT USING (
        auth.uid() = student_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('instructor', 'admin')
        )
    );

-- 활동일지 생성: 교육생만 자신의 일지 생성 가능
CREATE POLICY "activity_logs_insert_policy" ON activity_logs
    FOR INSERT WITH CHECK (
        auth.uid() = student_id AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'trainee'
        )
    );

-- 활동일지 수정: 교육생은 자신의 일지만, 강사/관리자는 검토 관련 필드 수정 가능
CREATE POLICY "activity_logs_update_policy" ON activity_logs
    FOR UPDATE USING (
        auth.uid() = student_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('instructor', 'admin')
        )
    );

-- 활동일지 삭제: 교육생은 자신의 일지만 삭제 가능
CREATE POLICY "activity_logs_delete_policy" ON activity_logs
    FOR DELETE USING (
        auth.uid() = student_id AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'trainee'
        )
    );

-- 첨부파일 정책: 해당 활동일지의 소유자이거나 강사/관리자
CREATE POLICY "attachments_select_policy" ON activity_log_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activity_logs 
            WHERE activity_logs.id = activity_log_id 
            AND (
                activity_logs.student_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('instructor', 'admin')
                )
            )
        )
    );

-- 첨부파일 생성: 해당 활동일지의 소유자만
CREATE POLICY "attachments_insert_policy" ON activity_log_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM activity_logs 
            WHERE activity_logs.id = activity_log_id 
            AND activity_logs.student_id = auth.uid()
        )
    );

-- 첨부파일 삭제: 해당 활동일지의 소유자만
CREATE POLICY "attachments_delete_policy" ON activity_log_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM activity_logs 
            WHERE activity_logs.id = activity_log_id 
            AND activity_logs.student_id = auth.uid()
        )
    );

-- 8. 샘플 데이터 (선택사항 - 테스트용)
-- INSERT INTO activity_logs (student_id, title, content, activity_date, hours_spent, status)
-- SELECT 
--     id, 
--     '샘플 활동일지', 
--     '오늘은 React 컴포넌트 개발을 학습했습니다. useState와 useEffect 훅의 사용법을 익혔고, 실제 프로젝트에 적용해보았습니다.',
--     CURRENT_DATE,
--     3.5,
--     'draft'
-- FROM users 
-- WHERE role = 'trainee' 
-- LIMIT 1;

-- 스키마 생성 완료
COMMENT ON TABLE activity_logs IS 'BS 교육생 활동일지 관리 테이블';
COMMENT ON TABLE activity_log_attachments IS 'BS 활동일지 첨부파일 테이블';