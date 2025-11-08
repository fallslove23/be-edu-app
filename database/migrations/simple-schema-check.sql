-- course_templates 테이블 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_templates'
ORDER BY ordinal_position;
