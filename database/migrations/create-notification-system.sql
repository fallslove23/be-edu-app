-- 알림 시스템 테이블 생성
-- 과정 변경, 일정 충돌, 과정 시작 등의 알림을 관리

-- 1. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'course_start', 'course_updated', 'conflict_detected', 'course_confirmed', 'session_changed'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500), -- 알림 클릭 시 이동할 링크
  related_course_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE,
  related_session_id UUID REFERENCES course_sessions(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. 알림 설정 테이블 (사용자별 알림 선호도)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  course_start_enabled BOOLEAN DEFAULT true, -- 과정 시작 알림
  course_update_enabled BOOLEAN DEFAULT true, -- 과정 변경 알림
  conflict_enabled BOOLEAN DEFAULT true, -- 충돌 감지 알림
  course_confirmed_enabled BOOLEAN DEFAULT true, -- 과정 확정 알림
  session_change_enabled BOOLEAN DEFAULT true, -- 일정 변경 알림
  days_before_start INTEGER DEFAULT 3, -- 과정 시작 며칠 전에 알림 (3일 전)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 예정된 알림 테이블 (스케줄링)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_course ON notifications(related_course_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_date ON scheduled_notifications(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(is_sent);

-- RLS (Row Level Security) 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- 알림 조회: 본인의 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 알림 수정: 본인의 알림만 수정 가능 (읽음 표시)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 알림 생성: 시스템에서 생성 (관리자, 매니저, 운영자만)
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'operator')
    )
  );

-- 알림 설정 조회: 본인의 설정만 조회
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- 알림 설정 생성/수정: 본인의 설정만 생성/수정
CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- 예정된 알림: 관리자만 조회/수정
CREATE POLICY "Admins can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager', 'operator')
    )
  );

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- 함수: 읽지 않은 알림 개수 조회
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
    AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 알림 일괄 읽음 처리
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id
  AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 과정 관련자에게 알림 생성
CREATE OR REPLACE FUNCTION create_course_notification(
  p_course_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_priority VARCHAR DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
  course_record RECORD;
BEGIN
  -- 과정 정보 가져오기
  SELECT * INTO course_record
  FROM course_rounds
  WHERE id = p_course_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- 강사에게 알림
  IF course_record.instructor_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, related_course_id, priority)
    VALUES (course_record.instructor_id, p_type, p_title, p_message, p_course_id, p_priority);
    notification_count := notification_count + 1;
  END IF;

  -- 매니저에게 알림
  IF course_record.manager_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, related_course_id, priority)
    VALUES (course_record.manager_id, p_type, p_title, p_message, p_course_id, p_priority);
    notification_count := notification_count + 1;
  END IF;

  -- 등록된 교육생들에게 알림
  INSERT INTO notifications (user_id, type, title, message, related_course_id, priority)
  SELECT
    re.trainee_id,
    p_type,
    p_title,
    p_message,
    p_course_id,
    p_priority
  FROM round_enrollments re
  WHERE re.round_id = p_course_id
  AND re.status IN ('enrolled', 'completed');

  GET DIAGNOSTICS notification_count = ROW_COUNT;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS '사용자 알림';
COMMENT ON TABLE notification_preferences IS '사용자별 알림 설정';
COMMENT ON TABLE scheduled_notifications IS '예정된 알림 스케줄';
COMMENT ON COLUMN notifications.type IS '알림 유형: course_start, course_updated, conflict_detected, course_confirmed, session_changed';
COMMENT ON COLUMN notifications.priority IS '우선순위: low, normal, high, urgent';
