-- Supabase PostgREST 스키마 캐시 새로고침
-- exams 테이블 스키마 변경 후 실행

-- PostgREST에게 스키마를 다시 로드하도록 알림
NOTIFY pgrst, 'reload schema';

-- 확인: 현재 exams 테이블 구조
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'exams'
ORDER BY ordinal_position;
