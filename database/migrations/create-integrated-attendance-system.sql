-- =====================================================
-- 통합 출석 관리 시스템
-- =====================================================
-- 과정 차수 → 커리큘럼 → 출석 기록 통합 관리
-- =====================================================

-- 1. 출석 기록 테이블 생성/수정
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결 정보
  curriculum_item_id UUID NOT NULL REFERENCES public.curriculum_items(id) ON DELETE CASCADE,
  trainee_id UUID NOT NULL REFERENCES public.trainees(id) ON DELETE CASCADE,

  -- 출석 정보
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'early_leave')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,

  -- 추가 정보
  notes TEXT,
  location VARCHAR(100), -- 출석 위치 (QR/NFC 체크인 시)
  device_info VARCHAR(200), -- 디바이스 정보
  checked_by UUID REFERENCES public.users(id), -- 출석 확인자 (강사/관리자)

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약조건: 같은 커리큘럼에 같은 교육생은 한 번만
  CONSTRAINT unique_attendance_per_session UNIQUE (curriculum_item_id, trainee_id)
);

-- 2. 출석 통계 뷰 생성
CREATE OR REPLACE VIEW public.attendance_statistics AS
SELECT
  ci.session_id,
  ci.id as curriculum_item_id,
  ci.date,
  ci.day,
  ci.order_index,
  ci.title as session_title,

  -- 출석 통계
  COUNT(DISTINCT ar.trainee_id) as total_checked,
  COUNT(DISTINCT re.trainee_id) as total_enrolled,
  COUNT(DISTINCT ar.trainee_id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(DISTINCT ar.trainee_id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(DISTINCT ar.trainee_id) FILTER (WHERE ar.status = 'absent') as absent_count,
  COUNT(DISTINCT ar.trainee_id) FILTER (WHERE ar.status = 'excused') as excused_count,
  COUNT(DISTINCT ar.trainee_id) FILTER (WHERE ar.status = 'early_leave') as early_leave_count,

  -- 미체크 교육생
  COUNT(DISTINCT re.trainee_id) - COUNT(DISTINCT ar.trainee_id) as not_checked_count,

  -- 출석률
  CASE
    WHEN COUNT(DISTINCT re.trainee_id) > 0
    THEN ROUND((COUNT(DISTINCT ar.trainee_id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT re.trainee_id)) * 100, 2)
    ELSE 0
  END as attendance_rate

FROM public.curriculum_items ci
LEFT JOIN public.attendance_records ar ON ci.id = ar.curriculum_item_id
LEFT JOIN public.round_enrollments re ON ci.session_id = re.round_id AND re.status = 'active'
GROUP BY ci.session_id, ci.id, ci.date, ci.day, ci.order_index, ci.title;

-- 3. 교육생별 출석 현황 뷰
CREATE OR REPLACE VIEW public.trainee_attendance_summary AS
SELECT
  t.id as trainee_id,
  t.name as trainee_name,
  t.email,
  re.round_id as session_id,
  cs.session_name,
  cs.session_code,

  -- 출석 통계
  COUNT(DISTINCT ci.id) as total_sessions,
  COUNT(DISTINCT ar.id) as attended_sessions,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'absent') as absent_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'excused') as excused_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'early_leave') as early_leave_count,

  -- 미출석 세션 수
  COUNT(DISTINCT ci.id) - COUNT(DISTINCT ar.id) as not_attended_count,

  -- 출석률
  CASE
    WHEN COUNT(DISTINCT ci.id) > 0
    THEN ROUND((COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT ci.id)) * 100, 2)
    ELSE 0
  END as attendance_rate,

  -- 수료 가능 여부 (출석률 80% 이상)
  CASE
    WHEN COUNT(DISTINCT ci.id) > 0
    THEN (COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT ci.id)) >= 0.8
    ELSE false
  END as can_complete

FROM public.trainees t
INNER JOIN public.round_enrollments re ON t.id = re.trainee_id AND re.status = 'active'
INNER JOIN public.course_rounds cr ON re.round_id = cr.id
LEFT JOIN public.course_sessions cs ON cr.id = cs.id
LEFT JOIN public.curriculum_items ci ON cs.id = ci.session_id AND ci.status != 'cancelled'
LEFT JOIN public.attendance_records ar ON ci.id = ar.curriculum_item_id AND t.id = ar.trainee_id
GROUP BY t.id, t.name, t.email, re.round_id, cs.session_name, cs.session_code;

-- 4. 일별 출석 현황 뷰
CREATE OR REPLACE VIEW public.daily_attendance_overview AS
SELECT
  ci.date,
  ci.session_id,
  cs.session_name,
  cs.session_code,
  ci.day,

  -- 일별 통합 통계
  COUNT(DISTINCT ci.id) as total_sessions,
  COUNT(DISTINCT ar.trainee_id) as total_attendances,
  COUNT(DISTINCT re.trainee_id) as total_enrolled,

  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'absent') as absent_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'excused') as excused_count,

  -- 전체 출석률
  CASE
    WHEN COUNT(DISTINCT re.trainee_id) * COUNT(DISTINCT ci.id) > 0
    THEN ROUND((COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC /
                (COUNT(DISTINCT re.trainee_id) * COUNT(DISTINCT ci.id))) * 100, 2)
    ELSE 0
  END as daily_attendance_rate

FROM public.curriculum_items ci
LEFT JOIN public.course_sessions cs ON ci.session_id = cs.id
LEFT JOIN public.round_enrollments re ON ci.session_id = re.round_id AND re.status = 'active'
LEFT JOIN public.attendance_records ar ON ci.id = ar.curriculum_item_id
GROUP BY ci.date, ci.session_id, cs.session_name, cs.session_code, ci.day
ORDER BY ci.date DESC;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_curriculum ON public.attendance_records(curriculum_item_id);
CREATE INDEX IF NOT EXISTS idx_attendance_trainee ON public.attendance_records(trainee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_check_time ON public.attendance_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records((DATE(check_in_time)));

-- 6. 트리거 함수: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_attendance_updated_at ON public.attendance_records;
CREATE TRIGGER trigger_attendance_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- 7. 자동 결석 처리 함수 (커리큘럼 종료 후 미체크 교육생)
CREATE OR REPLACE FUNCTION auto_mark_absent_after_session()
RETURNS void AS $$
BEGIN
  -- 종료된 세션에서 출석 체크 안된 교육생을 자동 결석 처리
  INSERT INTO public.attendance_records (curriculum_item_id, trainee_id, status, notes, checked_by)
  SELECT
    ci.id,
    re.trainee_id,
    'absent',
    '자동 결석 처리',
    NULL
  FROM public.curriculum_items ci
  INNER JOIN public.round_enrollments re ON ci.session_id = re.round_id AND re.status = 'active'
  WHERE ci.status = 'completed'
    AND ci.date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.attendance_records ar
      WHERE ar.curriculum_item_id = ci.id
      AND ar.trainee_id = re.trainee_id
    )
  ON CONFLICT (curriculum_item_id, trainee_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS 정책
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자 읽기 가능
CREATE POLICY "attendance_select" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (true);

-- 관리자와 강사는 모든 출석 기록 수정 가능
CREATE POLICY "attendance_write_admin_instructor" ON public.attendance_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'instructor')
    )
  );

-- 9. 코멘트
COMMENT ON TABLE public.attendance_records IS '통합 출석 기록 - 커리큘럼 기반';
COMMENT ON COLUMN public.attendance_records.curriculum_item_id IS '커리큘럼 항목 ID';
COMMENT ON COLUMN public.attendance_records.trainee_id IS '교육생 ID';
COMMENT ON COLUMN public.attendance_records.status IS '출석 상태: present(출석), late(지각), absent(결석), excused(사유결석), early_leave(조퇴)';
COMMENT ON COLUMN public.attendance_records.location IS 'QR/NFC 체크인 위치';
COMMENT ON COLUMN public.attendance_records.device_info IS '체크인 디바이스 정보';
COMMENT ON COLUMN public.attendance_records.checked_by IS '출석 확인자 (강사/관리자)';

DO $$
BEGIN
  RAISE NOTICE '✅ 통합 출석 관리 시스템이 성공적으로 생성되었습니다.';
  RAISE NOTICE '';
  RAISE NOTICE '📊 생성된 테이블:';
  RAISE NOTICE '  - attendance_records (출석 기록)';
  RAISE NOTICE '';
  RAISE NOTICE '📈 생성된 뷰:';
  RAISE NOTICE '  - attendance_statistics (세션별 출석 통계)';
  RAISE NOTICE '  - trainee_attendance_summary (교육생별 출석 현황)';
  RAISE NOTICE '  - daily_attendance_overview (일별 출석 개요)';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ 기능:';
  RAISE NOTICE '  - 커리큘럼 기반 출석 관리';
  RAISE NOTICE '  - 실시간 출석률 계산';
  RAISE NOTICE '  - 자동 결석 처리';
  RAISE NOTICE '  - 수료 조건 체크 (출석률 80%)';
END $$;
