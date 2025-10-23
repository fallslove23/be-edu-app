-- 테이블 존재 여부 및 구조 확인
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bs_activities'
ORDER BY ordinal_position;

-- 또는 간단한 조회
SELECT * FROM public.bs_activities LIMIT 0;