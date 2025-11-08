-- 진단 및 수정: exams 테이블 문제 완전 해결
-- 이 스크립트는 문제를 진단하고 근본적으로 해결합니다

-- ============================================
-- STEP 1: 현재 상황 진단
-- ============================================

-- 1.1 course_sessions 테이블 존재 여부 확인
SELECT
  'course_sessions 테이블 존재 여부' AS check_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'course_sessions'
  ) AS exists_flag;

-- 1.2 course_rounds 테이블 존재 여부 확인
SELECT
  'course_rounds 테이블 존재 여부' AS check_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'course_rounds'
  ) AS exists_flag;

-- 1.3 exams 테이블의 모든 외래 키 확인
SELECT
  'exams 테이블 외래 키' AS check_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'exams';

-- 1.4 exams 테이블의 모든 컬럼 확인
SELECT
  'exams 테이블 컬럼' AS check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'exams'
  AND column_name IN ('session_id', 'division_id', 'round_id', 'old_session_id')
ORDER BY column_name;

-- ============================================
-- STEP 2: 완전한 정리
-- ============================================

-- 2.1 exams 테이블의 모든 course_sessions 관련 외래 키 제거
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'exams'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%session%'
  LOOP
    EXECUTE format('ALTER TABLE exams DROP CONSTRAINT IF EXISTS %I CASCADE', r.constraint_name);
    RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
  END LOOP;
END $$;

-- 2.2 exams 테이블의 모든 division 관련 외래 키 제거
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_name = 'exams'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%division%'
  LOOP
    EXECUTE format('ALTER TABLE exams DROP CONSTRAINT IF EXISTS %I CASCADE', r.constraint_name);
    RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
  END LOOP;
END $$;

-- 2.3 문제가 되는 컬럼들 완전히 제거
ALTER TABLE exams DROP COLUMN IF EXISTS session_id CASCADE;
ALTER TABLE exams DROP COLUMN IF EXISTS division_id CASCADE;
ALTER TABLE exams DROP COLUMN IF EXISTS old_session_id CASCADE;

-- 2.4 round_id 컬럼 확인 및 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'round_id'
  ) THEN
    ALTER TABLE exams ADD COLUMN round_id UUID;
    RAISE NOTICE 'Added round_id column';
  END IF;
END $$;

-- 2.5 course_rounds 테이블이 있으면 외래 키 생성
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'course_rounds'
  ) THEN
    -- 기존 외래 키 제거
    ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_round_id_fkey;

    -- 새 외래 키 생성
    ALTER TABLE exams
      ADD CONSTRAINT exams_round_id_fkey
      FOREIGN KEY (round_id)
      REFERENCES course_rounds(id)
      ON DELETE SET NULL;

    RAISE NOTICE 'Created foreign key: exams_round_id_fkey';
  ELSE
    RAISE NOTICE 'course_rounds table does not exist, skipping foreign key creation';
  END IF;
END $$;

-- ============================================
-- STEP 3: 인덱스 및 최적화
-- ============================================

-- 3.1 round_id 인덱스 생성
DROP INDEX IF EXISTS idx_exams_round_id;
CREATE INDEX idx_exams_round_id ON exams(round_id) WHERE round_id IS NOT NULL;

-- 3.2 다른 유용한 인덱스들
DROP INDEX IF EXISTS idx_exams_exam_type;
CREATE INDEX idx_exams_exam_type ON exams(exam_type);

DROP INDEX IF EXISTS idx_exams_status;
CREATE INDEX idx_exams_status ON exams(status);

DROP INDEX IF EXISTS idx_exams_scheduled_at;
CREATE INDEX idx_exams_scheduled_at ON exams(scheduled_at);

-- ============================================
-- STEP 4: PostgREST 강제 새로고침
-- ============================================

-- 4.1 여러 방법으로 PostgREST에 알림
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- STEP 5: 최종 확인
-- ============================================

-- 5.1 exams 테이블 외래 키 최종 확인
SELECT
  '✅ 최종 외래 키 확인' AS check_result,
  tc.constraint_name,
  kcu.column_name AS exams_column,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'exams';

-- 5.2 exams 테이블 컬럼 최종 확인
SELECT
  '✅ 최종 컬럼 확인' AS check_result,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'exams'
  AND (column_name LIKE '%session%' OR column_name LIKE '%division%' OR column_name LIKE '%round%')
ORDER BY column_name;

-- 5.3 인덱스 확인
SELECT
  '✅ 인덱스 확인' AS check_result,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'exams'
  AND indexname LIKE '%round%' OR indexname LIKE '%session%';

COMMENT ON TABLE exams IS '시험 관리 테이블 - course_rounds(차수) 기반';
COMMENT ON COLUMN exams.round_id IS '과정 차수 ID (course_rounds 참조)';

-- 완료 메시지
SELECT '🎉 exams 테이블 정리 완료!' AS status,
       'PostgREST 캐시가 새로고침되었습니다. 브라우저를 새로고침하세요.' AS message;
