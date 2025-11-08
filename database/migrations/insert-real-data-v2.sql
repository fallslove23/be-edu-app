-- ============================================
-- 실제 데이터 입력 (스키마 맞춤 버전)
-- 실행 순서대로 진행하세요
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
COMMENT ON COLUMN public.attendance_records.status IS 'present: 출석, late: 지각, absent: 결석, excused: 공결';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON public.attendance_records(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance_records(session_id);

-- ============================================
-- STEP 2: class_divisions 테이블 생성 (필요시)
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

COMMENT ON TABLE public.class_divisions IS '과정 운영 분반 (A반, B반 등)';

-- ============================================
-- STEP 3: exam_submissions 테이블 생성 (필요시)
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
-- STEP 4: RLS 비활성화 (개발용)
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
-- STEP 5: 기본 과정 템플릿 생성
-- ============================================
INSERT INTO public.course_templates (id, code, name, description, duration_weeks, category, difficulty_level, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'BS-BASIC', 'BS Basic', 'BS 기초 과정', 8, 'basic', 'beginner', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'BS-ADVANCED', 'BS Advanced', 'BS 심화 과정', 12, 'advanced', 'advanced', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_weeks = EXCLUDED.duration_weeks;

-- ============================================
-- STEP 6: 2024년 운영 차수 생성
-- ============================================
INSERT INTO public.course_sessions (
  id,
  template_id,
  session_name,
  session_code,
  session_number,
  session_year,
  start_date,
  end_date,
  status,
  total_capacity
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'BS Basic 1차',
    'BS-2024-01',
    1,
    2024,
    '2024-01-01',
    '2024-03-31',
    'completed',
    50
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'BS Advanced 1차',
    'BS-2024-02',
    1,
    2024,
    '2024-04-01',
    '2024-06-30',
    'in_progress',
    50
  )
ON CONFLICT (session_code) DO UPDATE
SET session_name = EXCLUDED.session_name,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status;

-- ============================================
-- STEP 7: 분반 생성
-- ============================================
INSERT INTO public.class_divisions (id, session_id, division_name, division_code, max_trainees)
VALUES
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'A반', 'BS-2024-01-A', 25),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'B반', 'BS-2024-01-B', 25),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'A반', 'BS-2024-02-A', 25),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'B반', 'BS-2024-02-B', 25)
ON CONFLICT (session_id, division_name) DO NOTHING;

-- ============================================
-- STEP 8: 실제 교육생 데이터 입력
-- ============================================
-- 기존 테스트 데이터 삭제
DELETE FROM public.users WHERE role = 'trainee' AND email LIKE '%@example.com';

-- 실제 교육생 데이터 입력 (5명)
INSERT INTO public.users (
  id,
  name,
  email,
  role,
  phone,
  department,
  employee_id,
  is_active,
  created_at
)
VALUES
  ('c1111111-1111-1111-1111-111111111111'::uuid, '김철수', 'kim.cs@company.com', 'trainee', '010-1234-5678', '영업본부', 'EMP001', true, '2024-01-01'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, '이영희', 'lee.yh@company.com', 'trainee', '010-2345-6789', '마케팅팀', 'EMP002', true, '2024-01-01'),
  ('c3333333-3333-3333-3333-333333333333'::uuid, '박민수', 'park.ms@company.com', 'trainee', '010-3456-7890', '기획팀', 'EMP003', true, '2024-01-01'),
  ('c4444444-4444-4444-4444-444444444444'::uuid, '정수진', 'jung.sj@company.com', 'trainee', '010-4567-8901', '인사팀', 'EMP004', true, '2024-01-01'),
  ('c5555555-5555-5555-5555-555555555555'::uuid, '최동욱', 'choi.dw@company.com', 'trainee', '010-5678-9012', 'IT팀', 'EMP005', true, '2024-01-01')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    employee_id = EXCLUDED.employee_id,
    is_active = EXCLUDED.is_active;

-- ============================================
-- STEP 9: 과정 등록 데이터
-- ============================================
-- 주의: course_enrollments 테이블은 course_id 사용 (session_id 아님!)
-- course_id는 실제로 session_id를 가리키는 것으로 보임
INSERT INTO public.course_enrollments (
  id,
  course_id,
  trainee_id,
  session_id,
  division_id,
  status,
  enrolled_at,
  completion_date
)
VALUES
  -- BS Basic 1차 (완료) - 5명 전원
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e3333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e4444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, 'completed', '2024-01-01', '2024-03-31'),
  ('e5555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 'completed', '2024-01-01', '2024-03-31'),

  -- BS Advanced 1차 (진행중) - 3명
  ('e6666666-6666-6666-6666-666666666666'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'd3333333-3333-3333-3333-333333333333'::uuid, 'active', '2024-04-01', NULL),
  ('e7777777-7777-7777-7777-777777777777'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'd3333333-3333-3333-3333-333333333333'::uuid, 'active', '2024-04-01', NULL),
  ('e8888888-8888-8888-8888-888888888888'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'd4444444-4444-4444-4444-444444444444'::uuid, 'active', '2024-04-01', NULL)
ON CONFLICT (id) DO UPDATE
SET status = EXCLUDED.status,
    completion_date = EXCLUDED.completion_date;

-- ============================================
-- STEP 10: 시험 데이터 생성
-- ============================================
INSERT INTO public.exams (
  id,
  session_id,
  title,
  description,
  exam_type,
  total_points,
  passing_score,
  duration_minutes,
  status
)
VALUES
  ('x1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'BS Basic 최종 시험', 'BS Basic 과정 이론 평가', 'final', 100, 60, 90, 'published'),
  ('x2222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'BS Advanced 중간고사', 'BS Advanced 과정 중간 평가', 'midterm', 100, 60, 120, 'published')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 11: 시험 제출 데이터
-- ============================================
INSERT INTO public.exam_submissions (exam_id, trainee_id, score, submitted_at, time_spent_minutes, status)
VALUES
  ('x1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 85, '2024-03-15 14:30:00', 90, 'graded'),
  ('x1111111-1111-1111-1111-111111111111'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 88, '2024-03-15 14:30:00', 85, 'graded'),
  ('x1111111-1111-1111-1111-111111111111'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 91, '2024-03-15 14:30:00', 80, 'graded'),
  ('x1111111-1111-1111-1111-111111111111'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, 94, '2024-03-15 14:30:00', 75, 'graded'),
  ('x1111111-1111-1111-1111-111111111111'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid, 97, '2024-03-15 14:30:00', 70, 'graded')
ON CONFLICT (exam_id, trainee_id) DO UPDATE
SET score = EXCLUDED.score,
    submitted_at = EXCLUDED.submitted_at,
    status = EXCLUDED.status;

-- ============================================
-- STEP 12: 출석 데이터 생성 (60일간)
-- ============================================
DO $$
DECLARE
  trainee_ids UUID[] := ARRAY[
    'c1111111-1111-1111-1111-111111111111'::uuid,
    'c2222222-2222-2222-2222-222222222222'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'c4444444-4444-4444-4444-444444444444'::uuid,
    'c5555555-5555-5555-5555-555555555555'::uuid
  ];
  trainee_id UUID;
  attendance_date DATE;
  day_count INTEGER := 0;
  absent_count INTEGER;
BEGIN
  FOREACH trainee_id IN ARRAY trainee_ids
  LOOP
    absent_count := 0;
    FOR attendance_date IN
      SELECT generate_series(
        '2024-01-01'::date,
        '2024-03-31'::date,
        '1 day'::interval
      )::date
      WHERE EXTRACT(DOW FROM generate_series) NOT IN (0, 6) -- 주말 제외
    LOOP
      -- 교육생마다 다른 출석률 (90~95%)
      IF random() < 0.92 THEN
        INSERT INTO public.attendance_records (trainee_id, session_id, attendance_date, status, check_in_time)
        VALUES (trainee_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, attendance_date, 'present', attendance_date + TIME '09:00:00')
        ON CONFLICT (trainee_id, attendance_date, session_id) DO NOTHING;
      ELSIF random() < 0.5 THEN
        INSERT INTO public.attendance_records (trainee_id, session_id, attendance_date, status, check_in_time)
        VALUES (trainee_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, attendance_date, 'late', attendance_date + TIME '09:15:00')
        ON CONFLICT (trainee_id, attendance_date, session_id) DO NOTHING;
      ELSE
        absent_count := absent_count + 1;
        IF absent_count <= 3 THEN -- 최대 3일까지만 결석
          INSERT INTO public.attendance_records (trainee_id, session_id, attendance_date, status)
          VALUES (trainee_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, attendance_date, 'absent')
          ON CONFLICT (trainee_id, attendance_date, session_id) DO NOTHING;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- STEP 13: 데이터 확인
-- ============================================
SELECT 'users (trainees)' as table_name, COUNT(*) as count
FROM public.users WHERE role = 'trainee'
UNION ALL
SELECT 'course_templates' as table_name, COUNT(*) as count
FROM public.course_templates
UNION ALL
SELECT 'course_sessions' as table_name, COUNT(*) as count
FROM public.course_sessions
UNION ALL
SELECT 'course_enrollments' as table_name, COUNT(*) as count
FROM public.course_enrollments
UNION ALL
SELECT 'class_divisions' as table_name, COUNT(*) as count
FROM public.class_divisions
UNION ALL
SELECT 'exams' as table_name, COUNT(*) as count
FROM public.exams
UNION ALL
SELECT 'exam_submissions' as table_name, COUNT(*) as count
FROM public.exam_submissions
UNION ALL
SELECT 'attendance_records' as table_name, COUNT(*) as count
FROM public.attendance_records;

-- ============================================
-- 완료!
-- 예상 결과:
-- - trainees: 5명
-- - course_templates: 2개
-- - course_sessions: 2개
-- - course_enrollments: 8개
-- - class_divisions: 4개
-- - exams: 2개
-- - exam_submissions: 5개
-- - attendance_records: 약 300개 (60일 * 5명)
-- ============================================
