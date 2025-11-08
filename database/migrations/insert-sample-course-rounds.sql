-- =============================================
-- Course Rounds 샘플 데이터 생성
-- =============================================

-- 먼저 기존 데이터 확인
DO $$
BEGIN
  RAISE NOTICE '현재 course_rounds 데이터 개수: %', (SELECT COUNT(*) FROM course_rounds);
END $$;

-- BS Basic 과정 템플릿 ID 조회
DO $$
DECLARE
  v_bs_basic_id UUID;
  v_bs_advanced_id UUID;
  v_instructor_id UUID;
  v_manager_id UUID;
BEGIN
  -- BS Basic 템플릿 ID 가져오기
  SELECT id INTO v_bs_basic_id
  FROM course_templates
  WHERE name LIKE '%BS%Basic%' OR code = 'BS-BASIC'
  LIMIT 1;

  -- BS Advanced 템플릿 ID 가져오기
  SELECT id INTO v_bs_advanced_id
  FROM course_templates
  WHERE name LIKE '%BS%Advanced%' OR code = 'BS-ADVANCED'
  LIMIT 1;

  -- 강사 사용자 가져오기
  SELECT id INTO v_instructor_id
  FROM users
  WHERE role = 'instructor'
  LIMIT 1;

  -- 운영 담당자 가져오기
  SELECT id INTO v_manager_id
  FROM users
  WHERE role = 'course_manager'
  LIMIT 1;

  IF v_bs_basic_id IS NULL THEN
    RAISE NOTICE 'BS Basic 템플릿을 찾을 수 없습니다. 먼저 course_templates 데이터를 생성하세요.';
    RETURN;
  END IF;

  -- BS Basic 1차 (완료)
  INSERT INTO course_rounds (
    id,
    template_id,
    round_number,
    title,
    instructor_id,
    instructor_name,
    manager_id,
    manager_name,
    start_date,
    end_date,
    max_trainees,
    current_trainees,
    location,
    status,
    description
  ) VALUES (
    gen_random_uuid(),
    v_bs_basic_id,
    1,
    'BS Basic 1차',
    v_instructor_id,
    '김영업 강사',
    v_manager_id,
    '이운영 매니저',
    '2025-01-13',
    '2025-01-15',
    20,
    18,
    '본사 교육센터',
    'completed',
    'BS Basic 과정 1차 교육입니다.'
  ) ON CONFLICT DO NOTHING;

  -- BS Basic 2차 (진행중)
  INSERT INTO course_rounds (
    id,
    template_id,
    round_number,
    title,
    instructor_id,
    instructor_name,
    manager_id,
    manager_name,
    start_date,
    end_date,
    max_trainees,
    current_trainees,
    location,
    status,
    description
  ) VALUES (
    gen_random_uuid(),
    v_bs_basic_id,
    2,
    'BS Basic 2차',
    v_instructor_id,
    '김영업 강사',
    v_manager_id,
    '이운영 매니저',
    '2025-01-20',
    '2025-01-22',
    20,
    15,
    '본사 교육센터',
    'in_progress',
    'BS Basic 과정 2차 교육입니다.'
  ) ON CONFLICT DO NOTHING;

  -- BS Basic 3차 (모집중)
  INSERT INTO course_rounds (
    id,
    template_id,
    round_number,
    title,
    instructor_id,
    instructor_name,
    manager_id,
    manager_name,
    start_date,
    end_date,
    max_trainees,
    current_trainees,
    location,
    status,
    description
  ) VALUES (
    gen_random_uuid(),
    v_bs_basic_id,
    3,
    'BS Basic 3차',
    v_instructor_id,
    '김영업 강사',
    v_manager_id,
    '이운영 매니저',
    '2025-02-03',
    '2025-02-05',
    20,
    0,
    '본사 교육센터',
    'recruiting',
    'BS Basic 과정 3차 교육입니다. 현재 모집 중입니다.'
  ) ON CONFLICT DO NOTHING;

  -- BS Basic 4차 (기획중)
  INSERT INTO course_rounds (
    id,
    template_id,
    round_number,
    title,
    instructor_id,
    instructor_name,
    manager_id,
    manager_name,
    start_date,
    end_date,
    max_trainees,
    current_trainees,
    location,
    status,
    description
  ) VALUES (
    gen_random_uuid(),
    v_bs_basic_id,
    4,
    'BS Basic 4차',
    v_instructor_id,
    '김영업 강사',
    v_manager_id,
    '이운영 매니저',
    '2025-02-17',
    '2025-02-19',
    20,
    0,
    '본사 교육센터',
    'planning',
    'BS Basic 과정 4차 교육 기획 중입니다.'
  ) ON CONFLICT DO NOTHING;

  -- BS Advanced가 있으면 추가
  IF v_bs_advanced_id IS NOT NULL THEN
    -- BS Advanced 1차 (진행중)
    INSERT INTO course_rounds (
      id,
      template_id,
      round_number,
      title,
      instructor_id,
      instructor_name,
      manager_id,
      manager_name,
      start_date,
      end_date,
      max_trainees,
      current_trainees,
      location,
      status,
      description
    ) VALUES (
      gen_random_uuid(),
      v_bs_advanced_id,
      1,
      'BS Advanced 1차',
      v_instructor_id,
      '박전문 강사',
      v_manager_id,
      '이운영 매니저',
      '2025-01-27',
      '2025-01-31',
      15,
      12,
      '본사 교육센터',
      'in_progress',
      'BS Advanced 과정 1차 교육입니다.'
    ) ON CONFLICT DO NOTHING;

    -- BS Advanced 2차 (모집중)
    INSERT INTO course_rounds (
      id,
      template_id,
      round_number,
      title,
      instructor_id,
      instructor_name,
      manager_id,
      manager_name,
      start_date,
      end_date,
      max_trainees,
      current_trainees,
      location,
      status,
      description
    ) VALUES (
      gen_random_uuid(),
      v_bs_advanced_id,
      2,
      'BS Advanced 2차',
      v_instructor_id,
      '박전문 강사',
      v_manager_id,
      '이운영 매니저',
      '2025-02-10',
      '2025-02-14',
      15,
      0,
      '본사 교육센터',
      'recruiting',
      'BS Advanced 과정 2차 교육입니다. 현재 모집 중입니다.'
    ) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Course rounds 샘플 데이터가 성공적으로 생성되었습니다.';
  RAISE NOTICE '생성된 course_rounds 데이터 개수: %', (SELECT COUNT(*) FROM course_rounds);
END $$;
