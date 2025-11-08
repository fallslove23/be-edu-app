-- 카테고리와 과정 템플릿 연동 확인

-- 1. course_templates의 category 컬럼 확인
SELECT
  name as "템플릿명",
  code as "코드",
  category as "카테고리",
  difficulty_level as "난이도"
FROM course_templates
ORDER BY category, name;

-- 2. 자원 관리의 카테고리 테이블 확인 (있다면)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%categor%'
ORDER BY table_name;

-- 3. 자원 관리 관련 테이블 모두 찾기
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%resource%'
    OR table_name LIKE '%categor%'
    OR table_name LIKE '%course_type%'
  )
ORDER BY table_name;
