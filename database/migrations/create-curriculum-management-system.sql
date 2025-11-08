-- ============================================
-- 커리큘럼 관리 시스템 마이그레이션
-- ============================================
-- 설명: SS교육연구소 교육 일정 및 커리큘럼 관리
-- 작성일: 2025-10-27
-- ============================================

-- 1. 커리큘럼 항목 테이블
CREATE TABLE IF NOT EXISTS public.curriculum_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 과정 정보
  session_id UUID REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  division_id UUID REFERENCES public.class_divisions(id) ON DELETE CASCADE,

  -- 일정 정보
  day INTEGER NOT NULL CHECK (day > 0),
  order_index INTEGER NOT NULL DEFAULT 1,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ) STORED,

  -- 과목 정보
  subject VARCHAR(200) NOT NULL,
  subject_type VARCHAR(50) DEFAULT 'lecture', -- lecture, practice, evaluation, discussion
  description TEXT,

  -- 강사 및 강의실 배정
  instructor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,

  -- 상태 관리
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),

  -- 승인 관련
  needs_approval BOOLEAN DEFAULT true,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- 교육 자료
  materials JSONB DEFAULT '[]'::jsonb,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),

  -- 제약조건
  CONSTRAINT curriculum_items_day_check CHECK (day >= 1 AND day <= 365),
  CONSTRAINT curriculum_items_order_check CHECK (order_index >= 1 AND order_index <= 100),
  CONSTRAINT curriculum_items_time_check CHECK (end_time > start_time)
);

-- 2. 강사 일정 테이블 (강사 가용성 및 일정 관리)
CREATE TABLE IF NOT EXISTS public.instructor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 강사 정보
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 일정 정보
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- 일정 타입
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN (
    'lecture', 'evaluation', 'meeting', 'admin', 'blocked', 'other'
  )),

  -- 관련 커리큘럼 (선택사항)
  curriculum_item_id UUID REFERENCES public.curriculum_items(id) ON DELETE CASCADE,

  -- 상세 정보
  title VARCHAR(200),
  description TEXT,
  location VARCHAR(200),

  -- 가용성
  availability VARCHAR(20) DEFAULT 'busy' CHECK (availability IN ('available', 'busy', 'tentative')),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT instructor_schedules_time_check CHECK (end_time > start_time)
);

-- 3. 부재 신청 테이블
CREATE TABLE IF NOT EXISTS public.absence_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 정보
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 부재 기간
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 부재 타입
  absence_type VARCHAR(50) NOT NULL CHECK (absence_type IN (
    'vacation', 'sick_leave', 'business_trip', 'training', 'personal', 'other'
  )),

  -- 상세 정보
  reason TEXT,
  contact_info VARCHAR(200),

  -- 승인 프로세스
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approval_comments TEXT,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT absence_requests_date_check CHECK (end_date >= start_date)
);

-- 4. 커리큘럼 승인 테이블
CREATE TABLE IF NOT EXISTS public.curriculum_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 커리큘럼 정보
  curriculum_item_id UUID NOT NULL REFERENCES public.curriculum_items(id) ON DELETE CASCADE,

  -- 승인자 정보
  approver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approver_role VARCHAR(50) NOT NULL, -- manager, admin, director

  -- 승인 정보
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  comments TEXT,
  approved_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT curriculum_approvals_unique UNIQUE (curriculum_item_id, approver_id)
);

-- 5. 강사료 정산 테이블
CREATE TABLE IF NOT EXISTS public.instructor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 강사 정보
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 정산 기간
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM period_start)) STORED,
  period_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM period_start)) STORED,

  -- 강의 시간
  lecture_hours DECIMAL(6,2) DEFAULT 0,
  evaluation_hours DECIMAL(6,2) DEFAULT 0,
  admin_hours DECIMAL(6,2) DEFAULT 0,
  total_hours DECIMAL(6,2) GENERATED ALWAYS AS (
    lecture_hours + evaluation_hours + admin_hours
  ) STORED,

  -- 금액 정보
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  lecture_amount DECIMAL(12,2) GENERATED ALWAYS AS (lecture_hours * hourly_rate) STORED,
  evaluation_amount DECIMAL(12,2) GENERATED ALWAYS AS (evaluation_hours * hourly_rate) STORED,
  admin_amount DECIMAL(12,2) GENERATED ALWAYS AS (admin_hours * hourly_rate) STORED,
  bonus_amount DECIMAL(12,2) DEFAULT 0,
  deduction_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (
    (lecture_hours + evaluation_hours + admin_hours) * hourly_rate + bonus_amount - deduction_amount
  ) STORED,

  -- 상태 관리
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'checking', 'approved', 'paid', 'cancelled'
  )),

  -- 기안 관련
  pdf_url TEXT,
  approval_document_url TEXT,
  paid_at TIMESTAMPTZ,

  -- 메모
  notes TEXT,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  checked_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),

  -- 제약조건
  CONSTRAINT instructor_payments_period_check CHECK (period_end >= period_start),
  CONSTRAINT instructor_payments_hours_check CHECK (
    lecture_hours >= 0 AND evaluation_hours >= 0 AND admin_hours >= 0
  ),
  CONSTRAINT instructor_payments_unique UNIQUE (instructor_id, period_start, period_end)
);

-- 6. 강사료 상세 내역 테이블
CREATE TABLE IF NOT EXISTS public.payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 정산 정보
  payment_id UUID NOT NULL REFERENCES public.instructor_payments(id) ON DELETE CASCADE,

  -- 커리큘럼 항목
  curriculum_item_id UUID NOT NULL REFERENCES public.curriculum_items(id) ON DELETE CASCADE,

  -- 상세 정보
  date DATE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  hour_type VARCHAR(50) NOT NULL CHECK (hour_type IN ('lecture', 'evaluation', 'admin')),
  amount DECIMAL(10,2) NOT NULL,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT payment_details_hours_check CHECK (hours > 0),
  CONSTRAINT payment_details_amount_check CHECK (amount >= 0)
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- curriculum_items 인덱스
CREATE INDEX IF NOT EXISTS idx_curriculum_items_session ON public.curriculum_items(session_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_division ON public.curriculum_items(division_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_instructor ON public.curriculum_items(instructor_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_classroom ON public.curriculum_items(classroom_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_date ON public.curriculum_items(date);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_status ON public.curriculum_items(status);
CREATE INDEX IF NOT EXISTS idx_curriculum_items_day_order ON public.curriculum_items(session_id, day, order_index);

-- instructor_schedules 인덱스
CREATE INDEX IF NOT EXISTS idx_instructor_schedules_instructor ON public.instructor_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_schedules_date ON public.instructor_schedules(date);
CREATE INDEX IF NOT EXISTS idx_instructor_schedules_curriculum ON public.instructor_schedules(curriculum_item_id);
CREATE INDEX IF NOT EXISTS idx_instructor_schedules_instructor_date ON public.instructor_schedules(instructor_id, date);

-- absence_requests 인덱스
CREATE INDEX IF NOT EXISTS idx_absence_requests_user ON public.absence_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_dates ON public.absence_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_absence_requests_status ON public.absence_requests(status);

-- curriculum_approvals 인덱스
CREATE INDEX IF NOT EXISTS idx_curriculum_approvals_curriculum ON public.curriculum_approvals(curriculum_item_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_approvals_approver ON public.curriculum_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_approvals_status ON public.curriculum_approvals(status);

-- instructor_payments 인덱스
CREATE INDEX IF NOT EXISTS idx_instructor_payments_instructor ON public.instructor_payments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payments_period ON public.instructor_payments(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_instructor_payments_status ON public.instructor_payments(status);
CREATE INDEX IF NOT EXISTS idx_instructor_payments_month_year ON public.instructor_payments(period_year, period_month);

-- payment_details 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_details_payment ON public.payment_details(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_details_curriculum ON public.payment_details(curriculum_item_id);

-- ============================================
-- 트리거 생성 (updated_at 자동 업데이트)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- curriculum_items 트리거
DROP TRIGGER IF EXISTS update_curriculum_items_updated_at ON public.curriculum_items;
CREATE TRIGGER update_curriculum_items_updated_at
    BEFORE UPDATE ON public.curriculum_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- instructor_schedules 트리거
DROP TRIGGER IF EXISTS update_instructor_schedules_updated_at ON public.instructor_schedules;
CREATE TRIGGER update_instructor_schedules_updated_at
    BEFORE UPDATE ON public.instructor_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- absence_requests 트리거
DROP TRIGGER IF EXISTS update_absence_requests_updated_at ON public.absence_requests;
CREATE TRIGGER update_absence_requests_updated_at
    BEFORE UPDATE ON public.absence_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- curriculum_approvals 트리거
DROP TRIGGER IF EXISTS update_curriculum_approvals_updated_at ON public.curriculum_approvals;
CREATE TRIGGER update_curriculum_approvals_updated_at
    BEFORE UPDATE ON public.curriculum_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- instructor_payments 트리거
DROP TRIGGER IF EXISTS update_instructor_payments_updated_at ON public.instructor_payments;
CREATE TRIGGER update_instructor_payments_updated_at
    BEFORE UPDATE ON public.instructor_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS 정책 (개발 중에는 비활성화, 추후 활성화)
-- ============================================

-- 현재는 RLS 비활성화
ALTER TABLE public.curriculum_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_details DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ 커리큘럼 관리 시스템 마이그레이션 완료';
    RAISE NOTICE '📋 생성된 테이블:';
    RAISE NOTICE '  - curriculum_items (커리큘럼 항목)';
    RAISE NOTICE '  - instructor_schedules (강사 일정)';
    RAISE NOTICE '  - absence_requests (부재 신청)';
    RAISE NOTICE '  - curriculum_approvals (커리큘럼 승인)';
    RAISE NOTICE '  - instructor_payments (강사료 정산)';
    RAISE NOTICE '  - payment_details (정산 상세 내역)';
END $$;
