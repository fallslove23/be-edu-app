-- =====================================================
-- 자료 관리 시스템 테이블 생성
-- Created: 2025-01-26
-- =====================================================

-- 1. 자료 카테고리 테이블
CREATE TABLE IF NOT EXISTS material_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
    icon VARCHAR(10) DEFAULT '📁',
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 자료 테이블
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50),
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    tags TEXT[],
    metadata JSONB
);

-- 3. 자료 배포 테이블
CREATE TABLE IF NOT EXISTS material_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('all', 'course', 'round', 'group', 'individual')),
    target_ids UUID[],
    distributed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed')),
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    metadata JSONB
);

-- 4. 자료 다운로드 기록 테이블
CREATE TABLE IF NOT EXISTS material_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- 자료 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_material_categories_parent ON material_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_material_categories_created_by ON material_categories(created_by);

-- 자료 인덱스
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_at ON materials(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_is_public ON materials(is_public);
CREATE INDEX IF NOT EXISTS idx_materials_title ON materials USING gin(to_tsvector('korean', title));
CREATE INDEX IF NOT EXISTS idx_materials_tags ON materials USING gin(tags);

-- 자료 배포 인덱스
CREATE INDEX IF NOT EXISTS idx_material_distributions_material ON material_distributions(material_id);
CREATE INDEX IF NOT EXISTS idx_material_distributions_distributed_by ON material_distributions(distributed_by);
CREATE INDEX IF NOT EXISTS idx_material_distributions_status ON material_distributions(status);
CREATE INDEX IF NOT EXISTS idx_material_distributions_distributed_at ON material_distributions(distributed_at DESC);

-- 자료 다운로드 인덱스
CREATE INDEX IF NOT EXISTS idx_material_downloads_material ON material_downloads(material_id);
CREATE INDEX IF NOT EXISTS idx_material_downloads_user ON material_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_material_downloads_downloaded_at ON material_downloads(downloaded_at DESC);

-- =====================================================
-- 트리거 함수 생성
-- =====================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 자료 카테고리 updated_at 트리거
DROP TRIGGER IF EXISTS update_material_categories_updated_at ON material_categories;
CREATE TRIGGER update_material_categories_updated_at
    BEFORE UPDATE ON material_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 자료 updated_at 트리거
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_downloads ENABLE ROW LEVEL SECURITY;

-- 자료 카테고리 정책
CREATE POLICY "Anyone can view material categories" ON material_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage material categories" ON material_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- 자료 정책
CREATE POLICY "Anyone can view public materials" ON materials
    FOR SELECT USING (is_public = true OR uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can upload materials" ON materials
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own materials" ON materials
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own materials" ON materials
    FOR DELETE USING (uploaded_by = auth.uid());

-- 자료 배포 정책
CREATE POLICY "Users can view distributions they created or received" ON material_distributions
    FOR SELECT USING (
        distributed_by = auth.uid() OR
        auth.uid() = ANY(target_ids) OR
        target_type = 'all'
    );

CREATE POLICY "Authenticated users can create distributions" ON material_distributions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own distributions" ON material_distributions
    FOR UPDATE USING (distributed_by = auth.uid());

-- 자료 다운로드 정책
CREATE POLICY "Users can view their own download history" ON material_downloads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can record downloads" ON material_downloads
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 유틸리티 함수
-- =====================================================

-- 다운로드 카운트 증가 함수
CREATE OR REPLACE FUNCTION increment_download_count(material_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE materials
    SET download_count = download_count + 1
    WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 초기 데이터 삽입 (샘플 카테고리)
-- =====================================================

INSERT INTO material_categories (name, description, icon, color) VALUES
    ('강의자료', '수업 진행에 필요한 강의안 및 교재', '📚', '#3B82F6'),
    ('참고자료', '심화 학습을 위한 추가 자료', '📖', '#10B981'),
    ('과제', '실습 및 과제 제출 양식', '📝', '#F59E0B'),
    ('시험', '중간/기말 평가 및 퀴즈 자료', '📋', '#EF4444'),
    ('템플릿', '각종 보고서 및 문서 양식', '📊', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Supabase Storage 버킷 생성 (SQL로는 불가, 수동 또는 API 필요)
-- =====================================================
-- 아래 명령은 Supabase Dashboard 또는 JavaScript API로 실행해야 합니다:
--
-- 1. Supabase Dashboard > Storage > Create Bucket
-- 2. Bucket name: materials
-- 3. Public: true (공개 파일용) 또는 false (비공개 파일용)
-- 4. File size limit: 100MB
--
-- 또는 JavaScript:
-- await supabase.storage.createBucket('materials', {
--   public: true,
--   fileSizeLimit: 104857600 // 100MB
-- })

COMMENT ON TABLE material_categories IS '자료 카테고리 분류 테이블';
COMMENT ON TABLE materials IS '교육 자료 메타데이터 테이블';
COMMENT ON TABLE material_distributions IS '자료 배포 관리 테이블';
COMMENT ON TABLE material_downloads IS '자료 다운로드 기록 테이블';
