-- 알림 테이블 존재 여부 확인

-- 1. notifications 테이블 존재 확인
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) as notifications_exists;

-- 2. notification_preferences 테이블 존재 확인
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notification_preferences'
  ) as notification_preferences_exists;

-- 3. scheduled_notifications 테이블 존재 확인
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'scheduled_notifications'
  ) as scheduled_notifications_exists;

-- 4. notifications 테이블 구조 확인 (존재하는 경우)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 5. RLS 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'notification_preferences', 'scheduled_notifications');
