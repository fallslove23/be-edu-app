-- ============================================
-- 나머지 과정 템플릿들을 categories에 연결
-- ============================================

-- STEP 1: "영업" 관련 카테고리가 있는지 확인
SELECT id, name, parent_id
FROM categories
WHERE name LIKE '%영업%' OR name LIKE '%sales%' OR name LIKE '%CRM%';

-- STEP 2: 영업 카테고리가 없다면 생성
INSERT INTO categories (id, name, description, color, icon, display_order, is_active, parent_id)
VALUES
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'BS 영업 과정', '영업 직군 교육 과정', '#10B981', 'BriefcaseIcon', 3, true, NULL)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: 영업 하위 카테고리 생성
INSERT INTO categories (id, name, description, color, icon, display_order, is_active, parent_id)
VALUES
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'BS 영업 기초', '영업 기초 과정', '#34D399', 'AcademicCapIcon', 1, true, 'e1111111-1111-1111-1111-111111111111'::uuid),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'BS 영업 고급', '영업 고급 전략 과정', '#059669', 'ChartBarIcon', 2, true, 'e1111111-1111-1111-1111-111111111111'::uuid),
  ('e4444444-4444-4444-4444-444444444444'::uuid, 'BS CRM 시스템', 'CRM 시스템 활용 과정', '#047857', 'ComputerDesktopIcon', 3, true, 'e1111111-1111-1111-1111-111111111111'::uuid)
ON CONFLICT (id) DO NOTHING;

-- STEP 4: 과정 템플릿 매핑
UPDATE course_templates
SET category_id = 'e2222222-2222-2222-2222-222222222222'::uuid
WHERE code = 'BS-SALES-101';

UPDATE course_templates
SET category_id = 'e3333333-3333-3333-3333-333333333333'::uuid
WHERE code = 'BS-SALES-201';

UPDATE course_templates
SET category_id = 'e4444444-4444-4444-4444-444444444444'::uuid
WHERE code = 'BS-CRM-101';

-- STEP 5: 확인 쿼리
SELECT
  ct.name as "템플릿명",
  ct.code as "코드",
  ct.category as "기존 카테고리(텍스트)",
  c.name as "새 카테고리명",
  parent_cat.name as "부모 카테고리",
  c.color as "색상",
  c.icon as "아이콘"
FROM course_templates ct
LEFT JOIN categories c ON ct.category_id = c.id
LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
ORDER BY parent_cat.name NULLS LAST, c.display_order, ct.created_at;
