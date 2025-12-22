-- =============================================
-- 자료 관리 시스템 데이터베이스 스키마
-- Supabase 호환 버전 (Korean FTS 제거)
-- =============================================

-- 1. 자료 카테고리 테이블
CREATE TABLE IF NOT EXISTS material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 자료 메인 테이블
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. 자료 배포 테이블
CREATE TABLE IF NOT EXISTS material_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'course', 'round', 'group', 'individual')),
  target_ids UUID[],
  distributed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  distributed_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 자료 다운로드 기록 테이블
CREATE TABLE IF NOT EXISTS material_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- =============================================
-- 인덱스 생성
-- =============================================

-- 자료 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_material_categories_name ON material_categories(name);

-- 자료 메인 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_at ON materials(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_is_public ON materials(is_public);
CREATE INDEX IF NOT EXISTS idx_materials_file_type ON materials(file_type);

-- Full-text search 인덱스 (simple 설정 사용)
CREATE INDEX IF NOT EXISTS idx_materials_title ON materials USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_materials_description ON materials USING gin(to_tsvector('simple', COALESCE(description, '')));

-- JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_materials_metadata ON materials USING gin(metadata);

-- 배열 인덱스
CREATE INDEX IF NOT EXISTS idx_materials_tags ON materials USING gin(tags);

-- 자료 배포 인덱스
CREATE INDEX IF NOT EXISTS idx_distributions_material ON material_distributions(material_id);
CREATE INDEX IF NOT EXISTS idx_distributions_distributed_by ON material_distributions(distributed_by);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON material_distributions(status);
CREATE INDEX IF NOT EXISTS idx_distributions_distributed_at ON material_distributions(distributed_at DESC);
CREATE INDEX IF NOT EXISTS idx_distributions_scheduled_at ON material_distributions(scheduled_at);

-- 다운로드 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_downloads_material ON material_downloads(material_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON material_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON material_downloads(downloaded_at DESC);

-- =============================================
-- 트리거 생성
-- =============================================

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 카테고리 테이블 트리거
DROP TRIGGER IF EXISTS update_material_categories_updated_at ON material_categories;
CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON material_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 자료 테이블 트리거
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 배포 테이블 트리거
DROP TRIGGER IF EXISTS update_material_distributions_updated_at ON material_distributions;
CREATE TRIGGER update_material_distributions_updated_at
  BEFORE UPDATE ON material_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 자료 카테고리 RLS
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 카테고리 조회 가능"
  ON material_categories FOR SELECT
  USING (true);

CREATE POLICY "인증된 사용자만 카테고리 생성 가능"
  ON material_categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 카테고리 수정 가능"
  ON material_categories FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 카테고리 삭제 가능"
  ON material_categories FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 자료 메인 테이블 RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공개 자료는 모든 사용자가 조회 가능"
  ON materials FOR SELECT
  USING (is_public = true OR auth.uid() = uploaded_by);

CREATE POLICY "인증된 사용자만 자료 업로드 가능"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "업로드한 사용자만 자료 수정 가능"
  ON materials FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "업로드한 사용자만 자료 삭제 가능"
  ON materials FOR DELETE
  USING (auth.uid() = uploaded_by);

-- 자료 배포 RLS
ALTER TABLE material_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 배포 내역 조회 가능"
  ON material_distributions FOR SELECT
  USING (true);

CREATE POLICY "인증된 사용자만 배포 생성 가능"
  ON material_distributions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "배포 생성자만 배포 수정 가능"
  ON material_distributions FOR UPDATE
  USING (auth.uid() = distributed_by);

CREATE POLICY "배포 생성자만 배포 삭제 가능"
  ON material_distributions FOR DELETE
  USING (auth.uid() = distributed_by);

-- 다운로드 기록 RLS
ALTER TABLE material_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 다운로드 기록만 조회 가능"
  ON material_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "인증된 사용자만 다운로드 기록 생성 가능"
  ON material_downloads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 데이터베이스 함수
-- =============================================

-- 다운로드 카운트 증가 함수
CREATE OR REPLACE FUNCTION increment_download_count(material_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE materials
  SET download_count = download_count + 1
  WHERE id = material_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 기본 카테고리 데이터 추가
-- =============================================

INSERT INTO material_categories (name, description, icon, color)
VALUES
  ('교육 자료', '강의 자료, PPT, PDF 등', '📚', '#3b82f6'),
  ('영상 자료', '동영상 강의, 튜토리얼', '🎥', '#8b5cf6'),
  ('실습 자료', '예제 코드, 프로젝트 파일', '💻', '#10b981'),
  ('과제', '과제 파일, 제출물', '📝', '#f59e0b'),
  ('참고 자료', '참고 문서, 링크 모음', '🔗', '#ec4899'),
  ('기타', '기타 자료', '📦', '#6b7280')
ON CONFLICT DO NOTHING;

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 자료 관리 시스템 데이터베이스 스키마 생성 완료';
  RAISE NOTICE '📌 다음 단계: Supabase Storage에서 "materials" 버킷을 생성하세요';
END $$;
