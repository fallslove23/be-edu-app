/**
 * =================================================
 * 출석 관리 뷰 스키마 수정
 * =================================================
 * 작성일: 2025-01-24
 * 목적: 현재 스키마에 맞게 뷰 수정
 * 참고: attendance_records 테이블은 session_id와 schedule_id 사용
 * =================================================
 */

-- =============================================
-- 1. trainee_attendance_summary 뷰 재생성
-- =============================================

DROP VIEW IF EXISTS public.trainee_attendance_summary CASCADE;

CREATE OR REPLACE VIEW public.trainee_attendance_summary AS
SELECT
  u.id as trainee_id,
  u.name as trainee_name,
  u.email,
  re.round_id as session_id,
  cr.round_name as session_name,
  cr.round_code as session_code,

  -- 출석 통계 (attendance_date 기준으로 집계)
  COUNT(DISTINCT ar.attendance_date) as total_sessions,
  COUNT(DISTINCT ar.id) as attended_sessions,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'absent') as absent_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'excused') as excused_count,
  0 as early_leave_count,

  -- 미출석 세션 수 (현재 스키마에서는 정확한 계산 불가, 0으로 설정)
  0 as not_attended_count,

  -- 출석률
  CASE
    WHEN COUNT(DISTINCT ar.attendance_date) > 0
    THEN ROUND((COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT ar.attendance_date)) * 100, 2)
    ELSE 0
  END as attendance_rate,

  -- 수료 가능 여부 (출석률 80% 이상)
  CASE
    WHEN COUNT(DISTINCT ar.attendance_date) > 0
    THEN (COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT ar.attendance_date)) >= 0.8
    ELSE false
  END as can_complete

FROM public.users u
INNER JOIN public.round_enrollments re ON u.id = re.trainee_id AND re.status = 'active'
INNER JOIN public.course_rounds cr ON re.round_id = cr.id
LEFT JOIN public.attendance_records ar ON u.id = ar.trainee_id
WHERE u.role = 'trainee'
GROUP BY u.id, u.name, u.email, re.round_id, cr.round_name, cr.round_code;

COMMENT ON VIEW public.trainee_attendance_summary IS '교육생별 출석 통계 요약';

-- =============================================
-- 2. daily_attendance_overview 뷰 재생성
-- =============================================

DROP VIEW IF EXISTS public.daily_attendance_overview CASCADE;

CREATE OR REPLACE VIEW public.daily_attendance_overview AS
SELECT
  ar.attendance_date as date,
  cr.id as session_id,
  cr.round_name as session_name,
  cr.round_code as session_code,
  EXTRACT(DOW FROM ar.attendance_date)::INTEGER as day,

  -- 일별 통합 통계
  COUNT(DISTINCT ar.id) as total_sessions,
  COUNT(DISTINCT ar.trainee_id) as total_attendances,
  COUNT(DISTINCT re.trainee_id) as total_enrolled,

  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'absent') as absent_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'excused') as excused_count,

  -- 전체 출석률
  CASE
    WHEN COUNT(DISTINCT re.trainee_id) > 0
    THEN ROUND((COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT re.trainee_id)) * 100, 2)
    ELSE 0
  END as daily_attendance_rate

FROM public.attendance_records ar
LEFT JOIN public.users u ON ar.trainee_id = u.id
LEFT JOIN public.round_enrollments re ON u.id = re.trainee_id AND re.status = 'active'
LEFT JOIN public.course_rounds cr ON re.round_id = cr.id
WHERE u.role = 'trainee'
GROUP BY ar.attendance_date, cr.id, cr.round_name, cr.round_code
ORDER BY ar.attendance_date DESC;

COMMENT ON VIEW public.daily_attendance_overview IS '일별 출석 현황 통계';

-- =============================================
-- 3. attendance_statistics 뷰 재생성
-- =============================================

DROP VIEW IF EXISTS public.attendance_statistics CASCADE;

CREATE OR REPLACE VIEW public.attendance_statistics AS
SELECT
  cr.id as session_id,
  NULL::UUID as curriculum_item_id,
  ar.attendance_date as date,
  EXTRACT(DOW FROM ar.attendance_date)::INTEGER as day,
  0 as order_index,
  cr.round_name as session_title,

  -- 출석 통계
  COUNT(DISTINCT ar.id) as total_checked,
  COUNT(DISTINCT re.trainee_id) as total_enrolled,

  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present') as present_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'late') as late_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'absent') as absent_count,
  COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'excused') as excused_count,
  0 as early_leave_count,

  -- 미체크 인원
  COUNT(DISTINCT re.trainee_id) - COUNT(DISTINCT ar.id) as not_checked_count,

  -- 출석률
  CASE
    WHEN COUNT(DISTINCT re.trainee_id) > 0
    THEN ROUND((COUNT(DISTINCT ar.id) FILTER (WHERE ar.status = 'present')::NUMERIC / COUNT(DISTINCT re.trainee_id)) * 100, 2)
    ELSE 0
  END as attendance_rate

FROM public.attendance_records ar
LEFT JOIN public.users u ON ar.trainee_id = u.id
LEFT JOIN public.round_enrollments re ON u.id = re.trainee_id AND re.status = 'active'
LEFT JOIN public.course_rounds cr ON re.round_id = cr.id
WHERE u.role = 'trainee'
GROUP BY cr.id, cr.round_name, ar.attendance_date
ORDER BY ar.attendance_date, cr.round_name;

COMMENT ON VIEW public.attendance_statistics IS '일별 차수별 출석 통계';

-- =============================================
-- 완료 메시지
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 출석 관리 뷰 스키마 수정 완료';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '  - trainee_attendance_summary (현재 스키마 반영)';
  RAISE NOTICE '  - daily_attendance_overview (현재 스키마 반영)';
  RAISE NOTICE '  - attendance_statistics (현재 스키마 반영)';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  참고: 현재 attendance_records 테이블은';
  RAISE NOTICE '   session_id와 attendance_date를 사용합니다.';
  RAISE NOTICE '   curriculum_item_id 컬럼은 존재하지 않습니다.';
  RAISE NOTICE '=================================================';
END $$;
