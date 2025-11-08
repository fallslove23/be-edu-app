-- 일정 관리 샘플 데이터만 삽입
-- 테이블이 이미 생성된 경우 이 파일만 실행하세요

-- 교실 샘플 데이터
INSERT INTO classrooms (name, capacity, location, equipment)
SELECT '강의실 101', 30, '본관 1층', '["프로젝터", "화이트보드", "컴퓨터 30대"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM classrooms WHERE name = '강의실 101');

INSERT INTO classrooms (name, capacity, location, equipment)
SELECT '강의실 102', 20, '본관 1층', '["프로젝터", "화이트보드"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM classrooms WHERE name = '강의실 102');

INSERT INTO classrooms (name, capacity, location, equipment)
SELECT '대강당', 100, '본관 2층', '["프로젝터", "화이트보드", "음향장비", "무대조명"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM classrooms WHERE name = '대강당');

-- 공휴일 샘플 데이터 (2025년)
DO $$
DECLARE
  v_admin_id UUID;
  v_count INTEGER;
BEGIN
  -- admin 계정 찾기
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Admin user not found. Skipping holiday data insertion.';
    RETURN;
  END IF;

  -- 각 공휴일 개별 삽입 (이미 있으면 건너뛰기)

  -- 설날 연휴
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '설날 연휴' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '설날 연휴', 'holiday', '2025-01-28'::date, '2025-01-30'::date, true, '#EF4444');
  END IF;

  -- 삼일절
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '삼일절' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '삼일절', 'holiday', '2025-03-01'::date, '2025-03-01'::date, true, '#EF4444');
  END IF;

  -- 어린이날
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '어린이날' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '어린이날', 'holiday', '2025-05-05'::date, '2025-05-05'::date, true, '#EF4444');
  END IF;

  -- 부처님 오신 날
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '부처님 오신 날' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '부처님 오신 날', 'holiday', '2025-05-05'::date, '2025-05-05'::date, true, '#EF4444');
  END IF;

  -- 현충일
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '현충일' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '현충일', 'holiday', '2025-06-06'::date, '2025-06-06'::date, true, '#EF4444');
  END IF;

  -- 광복절
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '광복절' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '광복절', 'holiday', '2025-08-15'::date, '2025-08-15'::date, true, '#EF4444');
  END IF;

  -- 추석 연휴
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '추석 연휴' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '추석 연휴', 'holiday', '2025-10-05'::date, '2025-10-07'::date, true, '#EF4444');
  END IF;

  -- 개천절
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '개천절' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '개천절', 'holiday', '2025-10-03'::date, '2025-10-03'::date, true, '#EF4444');
  END IF;

  -- 한글날
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '한글날' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '한글날', 'holiday', '2025-10-09'::date, '2025-10-09'::date, true, '#EF4444');
  END IF;

  -- 성탄절
  SELECT COUNT(*) INTO v_count FROM personal_events
  WHERE user_id = v_admin_id AND title = '성탄절' AND event_type = 'holiday';
  IF v_count = 0 THEN
    INSERT INTO personal_events (user_id, title, event_type, start_time, end_time, all_day, color)
    VALUES (v_admin_id, '성탄절', 'holiday', '2025-12-25'::date, '2025-12-25'::date, true, '#EF4444');
  END IF;

  RAISE NOTICE 'Holiday data insertion completed successfully.';
END $$;
