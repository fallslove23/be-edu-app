-- ============================================
-- 실제 데이터 입력 (ON CONFLICT 제거 버전)
-- 기존 데이터가 있으면 먼저 삭제 후 삽입
-- ============================================

-- ============================================
-- STEP 1: attendance_records 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  schedule_id UUID,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trainee_id, attendance_date, session_id)
);

COMMENT ON TABLE public.attendance_records IS '교육생 출석 기록';

CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON public.attendance_records(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance_records(session_id);

-- ============================================
-- STEP 2: class_divisions 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  division_name TEXT NOT NULL,
  division_code TEXT,
  max_trainees INTEGER DEFAULT 15,
  instructor_id UUID REFERENCES public.users(id),
  room TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, division_name)
);

COMMENT ON TABLE public.class_divisions IS '과정 운영 분반';

-- ============================================
-- STEP 3: exam_submissions 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  answers JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_minutes INTEGER,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES public.users(id),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, trainee_id)
);

COMMENT ON TABLE public.exam_submissions IS '시험 제출 기록';

-- ============================================
-- STEP 4: RLS 비활성화
-- ============================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_divisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: 기존 샘플 데이터 삭제 (Foreign Key 순서 고려)
-- ============================================
-- 1. 가장 하위 테이블부터 삭제
DELETE FROM public.attendance_records
WHERE session_id IN (
  SELECT id FROM public.course_sessions WHERE session_code IN ('BS-2024-01', 'BS-2024-02')
);

DELETE FROM public.exam_submissions
WHERE exam_id IN (
  SELECT id FROM public.exams WHERE session_id IN (
    SELECT id FROM public.course_sessions WHERE session_code IN ('BS-2024-01', 'BS-2024-02')
  )
);

-- 2. exams 삭제 (session_id 조건으로)
DELETE FROM public.exams
WHERE session_id IN (
  SELECT id FROM public.course_sessions WHERE session_code IN ('BS-2024-01', 'BS-2024-02')
);

-- 3. course_enrollments와 class_divisions 삭제
DELETE FROM public.course_enrollments
WHERE session_id IN (
  SELECT id FROM public.course_sessions WHERE session_code IN ('BS-2024-01', 'BS-2024-02')
);

DELETE FROM public.class_divisions
WHERE session_id IN (
  SELECT id FROM public.course_sessions WHERE session_code IN ('BS-2024-01', 'BS-2024-02')
);

-- 4. 상위 테이블 삭제
DELETE FROM public.course_sessions WHERE session_code IN ('BS-2024-01', 'BS-2024-02');
DELETE FROM public.course_templates WHERE code IN ('BS-BASIC', 'BS-ADVANCED');
DELETE FROM public.users WHERE email LIKE '%@company.com' OR email LIKE '%@example.com';

-- ============================================
-- STEP 6: 과정 템플릿 생성
-- ============================================
INSERT INTO public.course_templates (id, code, name, description, duration_weeks, category, difficulty_level, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'BS-BASIC', 'BS Basic', 'BS 기초 과정', 8, 'basic', 'beginner', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'BS-ADVANCED', 'BS Advanced', 'BS 심화 과정', 12, 'advanced', 'advanced', true);

-- ============================================
-- STEP 7: 운영 차수 생성
-- ============================================
INSERT INTO public.course_sessions (
  id, template_id, session_name, session_code, session_number, session_year,
  start_date, end_date, status, total_capacity
)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid,
   'BS Basic 1차', 'BS-2024-01', 1, 2024, '2024-01-01', '2024-03-31', 'completed', 50),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-2222-2222-222222222222'::uuid,
   'BS Advanced 1차', 'BS-2024-02', 1, 2024, '2024-04-01', '2024-06-30', 'in_progress', 50);

-- ============================================
-- STEP 8: 분반 생성
-- ============================================
INSERT INTO public.class_divisions (id, session_id, division_name, division_code, max_trainees)
VALUES
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'A반', 'BS-2024-01-A', 25),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'B반', 'BS-2024-01-B', 25),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'A반', 'BS-2024-02-A', 25),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'B반', 'BS-2024-02-B', 25);

-- ============================================
-- STEP 9: 교육생 데이터 입력
-- ============================================
INSERT INTO public.users (
  id, name, email, role, phone, department, employee_id, is_active, created_at
)
VALUES
  ('c1111111-1111-1111-1111-111111111111'::uuid, '김철수', 'kim.cs@company.com', 'trainee', '010-1234-5678', '영업본부', 'EMP001', true, '2024-01-01'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, '이영희', 'lee.yh@company.com', 'trainee', '010-2345-6789', '마케팅팀', 'EMP002', true, '2024-01-01'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, '박민수', 'park.ms@company.com', 'trainee', '010-3456-7890', '기획팀', 'EMP003', true, '2024-01-01'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, '정수진', 'jung.sj@company.com', 'trainee', '010-4567-8901', '인사팀', 'EMP004', true, '2024-01-01'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, '최동욱', 'choi.dw@company.com', 'trainee', '010-5678-9012', 'IT팀', 'EMP005', true, '2024-01-01');

-- ============================================
-- STEP 10: 과정 등록 데이터
-- ============================================
-- course_id는 NULL로 설정 (courses 테이블이 별도로 존재하는 것으로 보임)
INSERT INTO public.course_enrollments (
  id, trainee_id, session_id, division_id, status, enrolled_at, completion_date
)
VALUES
  -- BS Basic 1차 (완료) - 5명
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e4444444-4444-4444-4444-444444444444'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e5555555-5555-5555-5555-555555555555'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  -- BS Advanced 1차 (진행중) - 3명
  ('e6666666-6666-6666-6666-666666666666'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'd3333333-3333-3333-3333-333333333333'::uuid, 'active', '2024-04-01', NULL),
  ('e7777777-7777-7777-7777-777777777777'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'd3333333-3333-3333-3333-333333333333'::uuid, 'active', '2024-04-01', NULL),
  ('e8888888-8888-8888-8888-888888888888'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'd4444444-4444-4444-4444-444444444444'::uuid, 'active', '2024-04-01', NULL);

-- ============================================
-- STEP 11: 시험 데이터
-- ============================================
INSERT INTO public.exams (
  id, session_id, title, description, exam_type, total_points, passing_score, duration_minutes, status
)
VALUES
  ('f1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'BS Basic 최종 시험', 'BS Basic 과정 이론 평가', 'final', 100, 60, 90, 'published'),
  ('f2222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'BS Advanced 중간고사', 'BS Advanced 과정 중간 평가', 'midterm', 100, 60, 120, 'published');

-- ============================================
-- STEP 12: 시험 제출 데이터
-- ============================================
INSERT INTO public.exam_submissions (exam_id, trainee_id, score, submitted_at, time_spent_minutes, status)
VALUES
  ('f1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 85, '2024-03-15 14:30:00', 90, 'graded'),
  ('f1111111-1111-1111-1111-111111111111'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 88, '2024-03-15 14:30:00', 85, 'graded'),
  ('f1111111-1111-1111-1111-111111111111'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 91, '2024-03-15 14:30:00', 80, 'graded'),
  ('f1111111-1111-1111-1111-111111111111'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, 94, '2024-03-15 14:30:00', 75, 'graded'),
  ('f1111111-1111-1111-1111-111111111111'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid, 97, '2024-03-15 14:30:00', 70, 'graded');

-- ============================================
-- STEP 13: 출석 데이터 생성
-- ============================================
DO $$
DECLARE
  v_trainee_ids UUID[] := ARRAY[
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'c5555555-5555-5555-5555-555555555555'::uuid
  ];
  v_trainee_id UUID;
  v_absent_count INTEGER;
  v_iter_date DATE;
BEGIN
  FOREACH v_trainee_id IN ARRAY v_trainee_ids
  LOOP
    v_absent_count := 0;
    v_iter_date := '2024-01-01'::date;

    WHILE v_iter_date <= '2024-03-31'::date LOOP
      -- 주말 제외 (0=일요일, 6=토요일)
      IF EXTRACT(DOW FROM v_iter_date) NOT IN (0, 6) THEN
        IF random() < 0.92 THEN
          INSERT INTO public.attendance_records (trainee_id, session_id, attendance_date, status, check_in_time)
          VALUES (v_trainee_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, v_iter_date, 'present', v_iter_date + TIME '09:00:00')
          ON CONFLICT (trainee_id, attendance_date, session_id) DO NOTHING;
        ELSIF random() < 0.5 THEN
          INSERT INTO public.attendance_records (trainee_id, session_id, attendance_date, status, check_in_time)
          VALUES (v_trainee_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, v_iter_date, 'late', v_iter_date + TIME '09:15:00')
          ON CONFLICT (trainee_id, attendance_date, session_id) DO NOTHING;
        ELSE
          v_absent_count := v_absent_count + 1;
          IF v_absent_count <= 3 THEN
            INSERT INTO public.attendance_records (trainee_id, session_id, attendance_date, status)
            VALUES (v_trainee_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, v_iter_date, 'absent')
            ON CONFLICT (trainee_id, attendance_date, session_id) DO NOTHING;
          END IF;
        END IF;
      END IF;

      v_iter_date := v_iter_date + INTERVAL '1 day';
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- STEP 14: 데이터 확인
-- ============================================
SELECT 'users (trainees)' as table_name, COUNT(*) as count FROM public.users WHERE role = 'trainee'
UNION ALL SELECT 'course_templates', COUNT(*) FROM public.course_templates
UNION ALL SELECT 'course_sessions', COUNT(*) FROM public.course_sessions
UNION ALL SELECT 'course_enrollments', COUNT(*) FROM public.course_enrollments
UNION ALL SELECT 'class_divisions', COUNT(*) FROM public.class_divisions
UNION ALL SELECT 'exams', COUNT(*) FROM public.exams
UNION ALL SELECT 'exam_submissions', COUNT(*) FROM public.exam_submissions
UNION ALL SELECT 'attendance_records', COUNT(*) FROM public.attendance_records;
