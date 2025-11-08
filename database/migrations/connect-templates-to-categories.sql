-- ============================================
-- course_templates와 categories 연결
-- ============================================

-- STEP 1: course_templates에 category_id 컬럼 추가
ALTER TABLE course_templates
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- STEP 2: 기존 데이터 매핑 (텍스트 category → category_id)
-- BS Basic → BS Basic 과정
UPDATE course_templates
SET category_id = '9f065722-2f64-41ad-b468-aeff5f0b721c'
WHERE code = 'BS-BASIC';

-- BS Advanced → BS 장비심화과정 (가장 가까운 매핑)
UPDATE course_templates
SET category_id = 'f2df0bd3-d40b-427e-a238-23f048fc3bdd'
WHERE code = 'BS-ADVANCED';

-- STEP 3: 기존 category 컬럼은 유지 (하위 호환성)
-- 나중에 완전히 마이그레이션된 후 삭제 가능
COMMENT ON COLUMN course_templates.category IS '(Deprecated) Use category_id instead';
COMMENT ON COLUMN course_templates.category_id IS 'FK to categories table';

-- STEP 4: 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_course_templates_category_id
ON course_templates(category_id);

-- STEP 5: 확인 쿼리
SELECT
  ct.name as "템플릿명",
  ct.code as "코드",
  ct.category as "기존 카테고리(텍스트)",
  c.name as "새 카테고리명",
  parent_cat.name as "부모 카테고리"
FROM course_templates ct
LEFT JOIN categories c ON ct.category_id = c.id
LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
ORDER BY ct.created_at;
