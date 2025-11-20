-- 알림 시스템 빠른 생성 스크립트
-- Supabase SQL Editor에 이 내용을 복사하여 실행하세요

-- 1. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  related_course_id UUID,
  related_session_id UUID,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. notification_preferences 테이블 생성
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  course_start_enabled BOOLEAN DEFAULT true,
  course_update_enabled BOOLEAN DEFAULT true,
  conflict_enabled BOOLEAN DEFAULT true,
  course_confirmed_enabled BOOLEAN DEFAULT true,
  session_change_enabled BOOLEAN DEFAULT true,
  days_before_start INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. scheduled_notifications 테이블 생성
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_round_id UUID,
  notification_type VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 5. RLS 비활성화 (Mock Auth 사용)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications DISABLE ROW LEVEL SECURITY;

-- 6. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

-- 7. 테스트 알림 생성 (선택사항 - 첫 번째 사용자에게만)
-- INSERT INTO public.notifications (user_id, type, title, message, priority)
-- SELECT id, 'course_start', '알림 시스템 활성화', '알림 시스템이 정상적으로 작동합니다.', 'normal'
-- FROM public.users
-- LIMIT 1;

-- 완료 메시지
SELECT '알림 시스템 테이블 생성 완료!' as message;

-- 테이블 확인
SELECT
  tablename as table_name,
  'true' as exists
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'notification_preferences', 'scheduled_notifications');
