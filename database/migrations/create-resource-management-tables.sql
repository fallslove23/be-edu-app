-- ========================================
-- 리소스 관리 테이블 생성
-- ========================================
-- Phase 1: 카테고리 & 강의실 관리
-- 작성일: 2025-10-27
-- ========================================

-- ========================================
-- 1. 카테고리 관리 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'FolderIcon',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),

  -- 인덱스
  CONSTRAINT categories_name_check CHECK (length(name) >= 2),
  CONSTRAINT categories_order_check CHECK (display_order >= 0)
);

-- 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);

-- 카테고리 업데이트 트리거
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- ========================================
-- 2. 강의실 관리 테이블
-- ========================================

CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE,  -- 강의실 코드 (예: 'ROOM-301')
  location VARCHAR(200) NOT NULL,
  building VARCHAR(100),
  floor INTEGER,
  capacity INTEGER NOT NULL,
  facilities JSONB DEFAULT '[]'::jsonb,  -- ['빔프로젝터', '화이트보드', '음향장비']
  equipment JSONB DEFAULT '[]'::jsonb,   -- ['노트북 20대', '마이크 2개']
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),

  -- 제약조건
  CONSTRAINT classrooms_name_check CHECK (length(name) >= 2),
  CONSTRAINT classrooms_capacity_check CHECK (capacity > 0 AND capacity <= 1000)
);

-- 강의실 인덱스
CREATE INDEX IF NOT EXISTS idx_classrooms_location ON public.classrooms(location);
CREATE INDEX IF NOT EXISTS idx_classrooms_capacity ON public.classrooms(capacity);
CREATE INDEX IF NOT EXISTS idx_classrooms_available ON public.classrooms(is_available);
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON public.classrooms(code);

-- 강의실 업데이트 트리거
CREATE TRIGGER trigger_classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- ========================================
-- 3. 초기 데이터 삽입
-- ========================================

-- 카테고리 초기 데이터
INSERT INTO public.categories (name, description, color, icon, display_order) VALUES
('BS 영업', 'BS 영업 교육 과정 전체', '#3B82F6', 'ChartBarIcon', 1),
('BS 리더십', 'BS 리더십 교육 과정', '#10B981', 'AcademicCapIcon', 2),
('BS 전문가', 'BS 전문가 양성 과정', '#8B5CF6', 'StarIcon', 3),
('온라인 과정', '온라인 교육 과정', '#F59E0B', 'ComputerDesktopIcon', 4),
('오프라인 과정', '대면 교육 과정', '#EF4444', 'BuildingOfficeIcon', 5)
ON CONFLICT (name) DO NOTHING;

-- 하위 카테고리 추가
WITH parent_category AS (
  SELECT id FROM public.categories WHERE name = 'BS 영업' LIMIT 1
)
INSERT INTO public.categories (name, parent_id, description, color, icon, display_order)
SELECT
  '기초과정',
  parent_category.id,
  'BS 영업 기초 교육',
  '#60A5FA',
  'BookOpenIcon',
  1
FROM parent_category
ON CONFLICT (name) DO NOTHING;

WITH parent_category AS (
  SELECT id FROM public.categories WHERE name = 'BS 영업' LIMIT 1
)
INSERT INTO public.categories (name, parent_id, description, color, icon, display_order)
SELECT
  '심화과정',
  parent_category.id,
  'BS 영업 심화 교육',
  '#2563EB',
  'RocketLaunchIcon',
  2
FROM parent_category
ON CONFLICT (name) DO NOTHING;

-- 강의실 초기 데이터
INSERT INTO public.classrooms (name, code, location, building, floor, capacity, facilities, equipment, description, is_available) VALUES
(
  '대강당',
  'ROOM-101',
  '서울 본사 3층',
  '본사',
  3,
  100,
  '["빔프로젝터", "음향장비", "화이트보드", "무선마이크"]'::jsonb,
  '["노트북 50대", "마이크 4개", "레이저포인터"]'::jsonb,
  '대규모 교육 및 세미나용 공간',
  true
),
(
  '중강의실 A',
  'ROOM-201',
  '서울 본사 2층',
  '본사',
  2,
  50,
  '["빔프로젝터", "화이트보드", "에어컨"]'::jsonb,
  '["노트북 30대", "마이크 2개"]'::jsonb,
  '중규모 그룹 교육용',
  true
),
(
  '중강의실 B',
  'ROOM-202',
  '서울 본사 2층',
  '본사',
  2,
  50,
  '["빔프로젝터", "화이트보드", "에어컨"]'::jsonb,
  '["노트북 30대", "마이크 2개"]'::jsonb,
  '중규모 그룹 교육용',
  true
),
(
  '소강의실 A',
  'ROOM-301',
  '서울 본사 3층',
  '본사',
  3,
  20,
  '["TV 모니터", "화이트보드"]'::jsonb,
  '["노트북 10대"]'::jsonb,
  '소규모 워크샵 및 팀 활동용',
  true
),
(
  '소강의실 B',
  'ROOM-302',
  '서울 본사 3층',
  '본사',
  3,
  20,
  '["TV 모니터", "화이트보드"]'::jsonb,
  '["노트북 10대"]'::jsonb,
  '소규모 워크샵 및 팀 활동용',
  true
),
(
  '세미나실',
  'ROOM-401',
  '서울 본사 4층',
  '본사',
  4,
  30,
  '["빔프로젝터", "화이트보드", "원형 테이블"]'::jsonb,
  '["마이크 2개", "녹화장비"]'::jsonb,
  '토론 및 세미나용',
  true
)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 4. RLS 정책 설정 (개발 환경에서는 비활성화)
-- ========================================

-- 카테고리 RLS 비활성화 (개발용)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 강의실 RLS 비활성화 (개발용)
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. 검증 쿼리
-- ========================================

-- 카테고리 확인
SELECT
  c.name,
  COALESCE(p.name, '(최상위)') as parent_name,
  c.color,
  c.icon,
  c.is_active
FROM public.categories c
LEFT JOIN public.categories p ON c.parent_id = p.id
ORDER BY c.display_order;

-- 강의실 확인
SELECT
  name,
  code,
  location,
  capacity,
  jsonb_array_length(facilities) as facilities_count,
  is_available
FROM public.classrooms
ORDER BY capacity DESC;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 리소스 관리 테이블 생성 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - categories: 카테고리 관리';
  RAISE NOTICE '  - classrooms: 강의실 관리';
  RAISE NOTICE '';
  RAISE NOTICE '초기 데이터:';
  RAISE NOTICE '  - 카테고리: 5개 (하위 카테고리 2개 포함)';
  RAISE NOTICE '  - 강의실: 6개';
  RAISE NOTICE '========================================';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '  1. CategoryManagement UI 구현';
  RAISE NOTICE '  2. ClassroomManagement UI 구현';
  RAISE NOTICE '  3. 기존 course_templates 마이그레이션';
  RAISE NOTICE '========================================';
END $$;
