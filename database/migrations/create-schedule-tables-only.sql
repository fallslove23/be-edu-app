-- 통합 일정 관리 시스템 - 테이블만 생성 (샘플 데이터 제외)
-- 깔끔하게 테이블만 생성하려면 이 파일을 사용하세요

-- 1. 강사 가용 시간대 (instructor_availability)
CREATE TABLE IF NOT EXISTS instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT true,
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
  equipment JSONB,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 일정 (schedules)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  instructor_id UUID REFERENCES users(id),
  classroom_id UUID REFERENCES classrooms(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  materials JSONB,
  homework JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- 4. 개인 일정/이벤트 (personal_events)
CREATE TABLE IF NOT EXISTS personal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('personal', 'holiday', 'vacation', 'meeting', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  color TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 일정 충돌 로그 (schedule_conflicts)
CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('instructor', 'classroom', 'trainee')),
  resource_id UUID NOT NULL,
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

-- RLS 정책: instructor_availability
DROP POLICY IF EXISTS "Instructors can view their own availability" ON instructor_availability;
CREATE POLICY "Instructors can view their own availability"
  ON instructor_availability FOR SELECT
  USING (auth.uid() = instructor_id OR auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

DROP POLICY IF EXISTS "Instructors can manage their own availability" ON instructor_availability;
CREATE POLICY "Instructors can manage their own availability"
  ON instructor_availability FOR ALL
  USING (auth.uid() = instructor_id OR auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

-- RLS 정책: classrooms
DROP POLICY IF EXISTS "Everyone can view classrooms" ON classrooms;
CREATE POLICY "Everyone can view classrooms"
  ON classrooms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin/Manager can manage classrooms" ON classrooms;
CREATE POLICY "Admin/Manager can manage classrooms"
  ON classrooms FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

-- RLS 정책: schedules
DROP POLICY IF EXISTS "Everyone can view schedules" ON schedules;
CREATE POLICY "Everyone can view schedules"
  ON schedules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Instructors and admins can manage schedules" ON schedules;
CREATE POLICY "Instructors and admins can manage schedules"
  ON schedules FOR ALL
  USING (auth.uid() = instructor_id OR auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));

-- RLS 정책: personal_events
DROP POLICY IF EXISTS "Users can view their own events" ON personal_events;
CREATE POLICY "Users can view their own events"
  ON personal_events FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Users can manage their own events" ON personal_events;
CREATE POLICY "Users can manage their own events"
  ON personal_events FOR ALL
  USING (auth.uid() = user_id);

-- RLS 정책: schedule_conflicts
DROP POLICY IF EXISTS "Staff can view conflicts" ON schedule_conflicts;
CREATE POLICY "Staff can view conflicts"
  ON schedule_conflicts FOR SELECT
  USING (auth.jwt()->>'role' IN ('admin', 'manager', 'operator', 'instructor'));

DROP POLICY IF EXISTS "Staff can manage conflicts" ON schedule_conflicts;
CREATE POLICY "Staff can manage conflicts"
  ON schedule_conflicts FOR ALL
  USING (auth.jwt()->>'role' IN ('admin', 'manager', 'operator'));
