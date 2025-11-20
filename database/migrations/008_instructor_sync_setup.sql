-- ====================================================================
-- 강사 정보 동기화 시스템 설정
-- ====================================================================
-- 학습 관리 시스템 → 평가 앱 Webhook 동기화
-- ====================================================================

-- 1. pg_net Extension 활성화 (Supabase 제공)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. 동기화 로그 테이블 생성
CREATE TABLE IF NOT EXISTS instructor_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sync_log_instructor ON instructor_sync_log(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON instructor_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON instructor_sync_log(created_at DESC);

COMMENT ON TABLE instructor_sync_log IS '강사 정보 동기화 로그 (학습 관리 → 평가 앱)';

-- 3. 동기화 함수 생성
CREATE OR REPLACE FUNCTION sync_instructor_to_feedback()
RETURNS TRIGGER AS $$
DECLARE
  instructor_data JSONB;
  webhook_url TEXT := 'https://your-feedback-app-url.com/api/sync/instructor'; -- ⚠️ 실제 URL로 변경 필요
  api_key TEXT := 'your-super-secret-key-here'; -- ⚠️ 실제 API Key로 변경 필요
  action_type TEXT;
  response_id BIGINT;
BEGIN
  -- 1. Action 타입 결정
  IF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    instructor_data := jsonb_build_object(
      'id', OLD.user_id
    );
  ELSE
    action_type := 'upsert';

    -- 2. 강사 데이터 수집
    SELECT jsonb_build_object(
      'id', NEW.user_id,
      'name', u.name,
      'email', u.email,
      'phone', u.phone,
      'photo_url', NEW.profile_photo_url,
      'specializations', NEW.specializations,
      'rating', NEW.rating,
      'is_active', NEW.is_active
    ) INTO instructor_data
    FROM users u
    WHERE u.id = NEW.user_id;
  END IF;

  -- 3. Webhook 호출 (비동기)
  SELECT net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', api_key
    ),
    body := jsonb_build_object(
      'action', action_type,
      'instructor', instructor_data
    )
  ) INTO response_id;

  -- 4. 동기화 로그 저장
  INSERT INTO instructor_sync_log (
    instructor_id,
    action,
    payload,
    status,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    instructor_data,
    'pending',
    NOW()
  );

  RAISE NOTICE '강사 동기화 요청: % (%, response_id: %)',
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    response_id;

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- 에러 발생 시 로그 저장
  INSERT INTO instructor_sync_log (
    instructor_id,
    action,
    payload,
    status,
    error_message,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    instructor_data,
    'failed',
    SQLERRM,
    NOW()
  );

  RAISE WARNING '강사 동기화 실패: % - %', COALESCE(NEW.user_id, OLD.user_id), SQLERRM;

  -- Trigger는 성공으로 처리 (동기화 실패가 원본 작업을 막지 않도록)
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger 생성
DROP TRIGGER IF EXISTS trigger_sync_instructor_to_feedback ON instructor_profiles;

CREATE TRIGGER trigger_sync_instructor_to_feedback
AFTER INSERT OR UPDATE OR DELETE ON instructor_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_instructor_to_feedback();

COMMENT ON FUNCTION sync_instructor_to_feedback() IS '강사 정보를 평가 앱으로 동기화 (Webhook)';

-- 5. 재시도 함수 (실패한 동기화 재시도)
CREATE OR REPLACE FUNCTION retry_failed_sync()
RETURNS TABLE(
  retried_count INTEGER,
  success_count INTEGER,
  failed_count INTEGER
) AS $$
DECLARE
  log_record RECORD;
  webhook_url TEXT := 'https://your-feedback-app-url.com/api/sync/instructor'; -- ⚠️ 실제 URL로 변경 필요
  api_key TEXT := 'your-super-secret-key-here'; -- ⚠️ 실제 API Key로 변경 필요
  total_retried INTEGER := 0;
  total_success INTEGER := 0;
  total_failed INTEGER := 0;
  response_id BIGINT;
BEGIN
  -- 실패한 동기화 레코드 조회 (최대 3번 재시도, 24시간 이내)
  FOR log_record IN
    SELECT *
    FROM instructor_sync_log
    WHERE status = 'failed'
      AND retry_count < 3
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at
    LIMIT 10
  LOOP
    total_retried := total_retried + 1;

    -- 재시도
    BEGIN
      SELECT net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-API-Key', api_key
        ),
        body := jsonb_build_object(
          'action', log_record.action,
          'instructor', log_record.payload
        )
      ) INTO response_id;

      -- 성공 시 로그 업데이트
      UPDATE instructor_sync_log
      SET
        status = 'success',
        completed_at = NOW(),
        retry_count = retry_count + 1
      WHERE id = log_record.id;

      total_success := total_success + 1;

      RAISE NOTICE '재시도 성공: % (retry: %)', log_record.instructor_id, log_record.retry_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- 실패 시 재시도 카운트 증가
      UPDATE instructor_sync_log
      SET
        retry_count = retry_count + 1,
        error_message = SQLERRM
      WHERE id = log_record.id;

      total_failed := total_failed + 1;

      RAISE WARNING '재시도 실패: % - %', log_record.instructor_id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT total_retried, total_success, total_failed;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION retry_failed_sync() IS '실패한 강사 동기화 재시도 (최대 3회, 24시간 이내)';

-- 6. 동기화 상태 조회 뷰
CREATE OR REPLACE VIEW instructor_sync_status AS
SELECT
  DATE(created_at) as sync_date,
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retry_count
FROM instructor_sync_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), status
ORDER BY sync_date DESC, status;

COMMENT ON VIEW instructor_sync_status IS '최근 7일 강사 동기화 상태';

-- ====================================================================
-- 설정 안내
-- ====================================================================

-- ⚠️ 필수 설정:
-- 1. webhook_url 변경: 'https://your-feedback-app-url.com/api/sync/instructor'
-- 2. api_key 변경: 강력한 랜덤 문자열 (최소 32자)
-- 3. 평가 앱에 동기화 API 엔드포인트 구현 필요

-- 📝 사용 방법:
-- 1. 초기 데이터 동기화: INSTRUCTOR-SYNC-IMPLEMENTATION.md 참조
-- 2. 실패 건 재시도: SELECT * FROM retry_failed_sync();
-- 3. 동기화 상태 확인: SELECT * FROM instructor_sync_status;
-- 4. 로그 확인: SELECT * FROM instructor_sync_log ORDER BY created_at DESC LIMIT 20;
