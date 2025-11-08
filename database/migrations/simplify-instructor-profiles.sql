-- 강사 프로필 테이블 단순화
-- specializations, certifications, contract_type, hourly_rate 컬럼 제거
-- 과목은 instructor_subjects 테이블로 관리
-- 강의 시간은 schedules 테이블에서 자동 집계

-- 1. 기존 데이터 백업 (필요시)
-- CREATE TABLE IF NOT EXISTS instructor_profiles_backup AS SELECT * FROM instructor_profiles;

-- 2. 불필요한 컬럼 제거
ALTER TABLE public.instructor_profiles
  DROP COLUMN IF EXISTS specializations,
  DROP COLUMN IF EXISTS certifications,
  DROP COLUMN IF EXISTS contract_type,
  DROP COLUMN IF EXISTS hourly_rate;

-- 3. max_hours_per_week 컬럼을 주석으로 변경 (실제 강의 시간은 자동 집계)
COMMENT ON COLUMN public.instructor_profiles.max_hours_per_week IS '(사용 안함) 실제 강의 시간은 schedules 테이블에서 자동 집계됨';

-- 4. 주당 강의 시간 집계 뷰 생성
CREATE OR REPLACE VIEW public.instructor_weekly_hours AS
SELECT
  s.instructor_id,
  u.name AS instructor_name,
  DATE_TRUNC('week', s.start_time) AS week_start,
  COUNT(DISTINCT s.id) AS session_count,
  SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) AS total_hours,
  AVG(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) AS avg_hours_per_session
FROM public.schedules s
JOIN public.users u ON s.instructor_id = u.id
WHERE s.start_time >= NOW() - INTERVAL '12 weeks' -- 최근 12주
GROUP BY s.instructor_id, u.name, DATE_TRUNC('week', s.start_time)
ORDER BY week_start DESC, instructor_name;

-- 5. 강사별 총 강의 통계 뷰 생성
CREATE OR REPLACE VIEW public.instructor_teaching_stats AS
SELECT
  s.instructor_id,
  u.name AS instructor_name,
  u.email,
  COUNT(DISTINCT s.id) AS total_sessions,
  SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) AS total_hours,
  AVG(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) AS avg_session_duration,
  MIN(s.start_time) AS first_session,
  MAX(s.start_time) AS last_session,
  COUNT(DISTINCT DATE_TRUNC('week', s.start_time)) AS weeks_taught,
  -- 주당 평균 강의 시간
  SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600) /
    NULLIF(COUNT(DISTINCT DATE_TRUNC('week', s.start_time)), 0) AS avg_hours_per_week
FROM public.schedules s
JOIN public.users u ON s.instructor_id = u.id
WHERE s.start_time >= NOW() - INTERVAL '12 weeks'
GROUP BY s.instructor_id, u.name, u.email
ORDER BY total_hours DESC;

-- 6. 강사-과목별 강의 통계 뷰 생성
CREATE OR REPLACE VIEW public.instructor_subject_stats AS
SELECT
  s.instructor_id,
  u.name AS instructor_name,
  s.subject,
  COUNT(DISTINCT s.id) AS session_count,
  SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
  ) AS total_hours,
  MIN(s.start_time) AS first_taught,
  MAX(s.start_time) AS last_taught
FROM public.schedules s
JOIN public.users u ON s.instructor_id = u.id
WHERE s.subject IS NOT NULL
GROUP BY s.instructor_id, u.name, s.subject
ORDER BY instructor_name, total_hours DESC;

-- 7. RLS 정책 설정 (뷰는 기본 테이블의 정책을 따름)
COMMENT ON VIEW public.instructor_weekly_hours IS '강사별 주간 강의 시간 집계';
COMMENT ON VIEW public.instructor_teaching_stats IS '강사별 총 강의 통계 (최근 12주)';
COMMENT ON VIEW public.instructor_subject_stats IS '강사-과목별 강의 통계';

-- 8. 기존 total_sessions 업데이트 함수 생성 (트리거용)
CREATE OR REPLACE FUNCTION update_instructor_total_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.instructor_profiles
    SET total_sessions = (
      SELECT COUNT(*)
      FROM public.schedules
      WHERE instructor_id = NEW.instructor_id
      AND start_time < NOW()
    )
    WHERE user_id = NEW.instructor_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.instructor_profiles
    SET total_sessions = (
      SELECT COUNT(*)
      FROM public.schedules
      WHERE instructor_id = OLD.instructor_id
      AND start_time < NOW()
    )
    WHERE user_id = OLD.instructor_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_instructor_sessions ON public.schedules;
CREATE TRIGGER trigger_update_instructor_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_total_sessions();

COMMENT ON FUNCTION update_instructor_total_sessions() IS '강사 프로필의 총 강의 횟수 자동 업데이트';
