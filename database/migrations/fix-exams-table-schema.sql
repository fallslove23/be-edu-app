-- Fix exams table schema: session_id → round_id
-- 이 스크립트는 exams 테이블의 course_sessions 참조를 course_rounds로 변경합니다.

-- Step 1: exams 테이블에 round_id 컬럼 추가 (아직 없다면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'round_id'
  ) THEN
    ALTER TABLE exams ADD COLUMN round_id UUID REFERENCES course_rounds(id);
    COMMENT ON COLUMN exams.round_id IS '과정 차수 ID (course_rounds 참조)';
  END IF;
END $$;

-- Step 2: 기존 session_id 데이터가 있다면 백업
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'session_id'
  ) THEN
    -- session_id가 있다면 임시로 백업 컬럼 생성
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exams' AND column_name = 'old_session_id'
    ) THEN
      ALTER TABLE exams ADD COLUMN old_session_id UUID;
      UPDATE exams SET old_session_id = session_id WHERE session_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Step 3: session_id 컬럼의 외래 키 제약조건 제거
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- session_id와 관련된 외래 키 찾기
  SELECT constraint_name INTO constraint_name_var
  FROM information_schema.constraint_column_usage
  WHERE table_name = 'exams' AND column_name = 'session_id'
  LIMIT 1;

  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE exams DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
  END IF;
END $$;

-- Step 4: session_id 컬럼 제거
ALTER TABLE exams DROP COLUMN IF EXISTS session_id;

-- Step 5: division_id 컬럼도 제거 (사용하지 않음)
ALTER TABLE exams DROP COLUMN IF EXISTS division_id;

-- Step 6: round_id를 NOT NULL로 설정하려면 기본값이 필요
-- 실제 운영 환경에서는 데이터 마이그레이션 필요
-- ALTER TABLE exams ALTER COLUMN round_id SET NOT NULL;

-- Step 7: 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_exams_round_id ON exams(round_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON exams(exam_type);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_scheduled_at ON exams(scheduled_at);

-- Step 8: 결과 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'exams'
  AND column_name IN ('round_id', 'session_id', 'division_id')
ORDER BY column_name;

-- Step 9: 외래 키 확인
SELECT
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
  AND tc.table_name = 'exams'
  AND kcu.column_name IN ('round_id', 'session_id', 'division_id');

COMMENT ON TABLE exams IS '시험 정보 - course_rounds(차수) 기반으로 시험 관리';
