-- 통합 일정 관리 시스템
-- 과정 스케줄, 강사 일정, 교실 예약을 통합 관리

-- 1. 강사 가용 시간대 (instructor_availability)
CREATE TABLE IF NOT EXISTS instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=일요일, 6=토요일
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  is_available BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT true, -- 매주 반복 여부
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (end_time > start_time)
);

-- 2. 교실 관리 (classrooms)
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 30,
  location TEXT,

  equipment JSONB, -- ["프로젝터", "화이트보드", "컴퓨터"]
  is_active BOOLEAN DEFAULT true,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 일정 (schedules)
-- 과정 회차의 개별 세션/강의 일정
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE,

  title TEXT NOT NULL, -- "1일차 - OT 및 기본개념"
  subject TEXT, -- "비즈니스 스킬 소개"
  description TEXT,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  instructor_id UUID REFERENCES users(id),
  classroom_id UUID REFERENCES classrooms(id),

  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',    -- 예정
    'in_progress',  -- 진행중
    'completed',    -- 완료
    'cancelled'     -- 취소
  )),

  materials JSONB, -- 강의 자료 목록
  homework JSONB,  -- 과제 정보
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (end_time > start_time)
);

-- 4. 개인 일정/이벤트 (personal_events)
-- 휴일, 개인 일정 등
CREATE TABLE IF NOT EXISTS personal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'personal',  -- 개인 일정
    'holiday',   -- 공휴일/휴일
    'vacation',  -- 휴가
    'meeting',   -- 회의
    'other'      -- 기타
  )),

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,

  color TEXT, -- 캘린더 색상 (#hex)
  location TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 일정 충돌 로그 (schedule_conflicts)
CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'instructor',  -- 강사 중복
    'classroom',   -- 교실 중복
    'trainee'      -- 학생 중복
  )),

  resource_id UUID NOT NULL, -- instructor_id, classroom_id, user_id
  resource_name TEXT NOT NULL,

  schedule1_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  schedule2_id UUID REFERENCES schedules(id) ON DELETE CASCADE,

  conflict_date DATE NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),

  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructor_availability_instructor ON instructor_availability(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_availability_day ON instructor_availability(day_of_week);

CREATE INDEX IF NOT EXISTS idx_schedules_round ON schedules(course_round_id);
CREATE INDEX IF NOT EXISTS idx_schedules_instructor ON schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_classroom ON schedules(classroom_id);
CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

CREATE INDEX IF NOT EXISTS idx_personal_events_user ON personal_events(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_events_time ON personal_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_personal_events_type ON personal_events(event_type);

CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON schedule_conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_conflicts_date ON schedule_conflicts(conflict_date);

-- RLS 정책
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts ENABLE ROW LEVEL SECURITY;

-- instructor_availability 정책
CREATE POLICY "Instructors can view their own availability"
  ON instructor_availability FOR SELECT
  USING (auth.uid() = instructor_id OR auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

CREATE POLICY "Instructors can manage their own availability"
  ON instructor_availability FOR ALL
  USING (auth.uid() = instructor_id OR auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

-- classrooms 정책
CREATE POLICY "Everyone can view classrooms"
  ON classrooms FOR SELECT
  USING (true);

CREATE POLICY "Admin/Manager can manage classrooms"
  ON classrooms FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

-- schedules 정책
CREATE POLICY "Everyone can view schedules"
  ON schedules FOR SELECT
  USING (true);

CREATE POLICY "Instructors and admins can manage schedules"
  ON schedules FOR ALL
  USING (
    auth.uid() = instructor_id
    OR auth.jwt()->>'role' IN ('admin', 'manager', 'operator')
  );

-- personal_events 정책
CREATE POLICY "Users can view their own events"
  ON personal_events FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' IN ('admin', 'manager'));

CREATE POLICY "Users can manage their own events"
  ON personal_events FOR ALL
  USING (auth.uid() = user_id);

-- schedule_conflicts 정책
CREATE POLICY "Staff can view conflicts"
  ON schedule_conflicts FOR SELECT
  USING (auth.jwt()->>'role' IN ('admin', 'manager', 'operator', 'instructor'));

CREATE POLICY "Staff can manage conflicts"
  ON schedule_conflicts FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

-- 샘플 데이터
-- 교실 샘플
INSERT INTO classrooms (name, capacity, location, equipment) VALUES
  ('강의실 A', 30, '1층', '["프로젝터", "화이트보드", "컴퓨터 30대"]'::jsonb),
  ('강의실 B', 20, '1층', '["프로젝터", "화이트보드"]'::jsonb),
  ('강의실 C', 40, '2층', '["프로젝터", "화이트보드", "컴퓨터 40대", "음향장비"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 공휴일 샘플 (2025년)
DO $$
DECLARE
  v_admin_id UUID;
  v_event_count INTEGER;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  IF v_admin_id IS NOT NULL THEN
    -- 이미 공휴일 데이터가 있는지 확인
    SELECT COUNT(*) INTO v_event_count
    FROM personal_events
    WHERE user_id = v_admin_id AND event_type = 'holiday';

    -- 공휴일 데이터가 없을 때만 삽입
    IF v_event_count = 0 THEN
      INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color) VALUES
        (v_admin_id, '설날 연휴', 'holiday', '2025-01-28'::date, '2025-01-30'::date, true, '#EF4444'),
        (v_admin_id, '삼일절', 'holiday', '2025-03-01'::date, '2025-03-01'::date, true, '#EF4444'),
        (v_admin_id, '어린이날', 'holiday', '2025-05-05'::date, '2025-05-05'::date, true, '#EF4444'),
        (v_admin_id, '부처님 오신 날', 'holiday', '2025-05-05'::date, '2025-05-05'::date, true, '#EF4444'),
        (v_admin_id, '현충일', 'holiday', '2025-06-06'::date, '2025-06-06'::date, true, '#EF4444'),
        (v_admin_id, '광복절', 'holiday', '2025-08-15'::date, '2025-08-15'::date, true, '#EF4444'),
        (v_admin_id, '추석 연휴', 'holiday', '2025-10-05'::date, '2025-10-07'::date, true, '#EF4444'),
        (v_admin_id, '개천절', 'holiday', '2025-10-03'::date, '2025-10-03'::date, true, '#EF4444'),
        (v_admin_id, '한글날', 'holiday', '2025-10-09'::date, '2025-10-09'::date, true, '#EF4444'),
        (v_admin_id, '성탄절', 'holiday', '2025-12-25'::date, '2025-12-25'::date, true, '#EF4444');
    END IF;
  END IF;
END $$;
