-- 평가 시스템 테스트용 샘플 데이터 생성
-- 이미 생성된 evaluation_templates와 evaluation_components를 활용

-- 1. 진행 중인 테스트 과정 회차 생성 (BS Basic 과정)
DO $$
DECLARE
  v_bs_basic_template_id UUID;
  v_test_round_id UUID;
  v_instructor_user_id UUID;
  v_trainee1_id UUID;
  v_trainee2_id UUID;
  v_trainee3_id UUID;
BEGIN
  -- BS Basic 템플릿 ID 가져오기
  SELECT id INTO v_bs_basic_template_id
  FROM course_templates
  WHERE name LIKE '%BS%Basic%' OR name LIKE '%기본%'
  LIMIT 1;

  -- 템플릿이 없으면 첫 번째 템플릿 사용
  IF v_bs_basic_template_id IS NULL THEN
    SELECT id INTO v_bs_basic_template_id
    FROM course_templates
    LIMIT 1;
  END IF;

  -- 강사 사용자 가져오기 (role이 instructor인 사용자)
  SELECT id INTO v_instructor_user_id
  FROM users
  WHERE role = 'instructor'
  LIMIT 1;

  -- 강사가 없으면 첫 번째 사용자를 강사로 사용
  IF v_instructor_user_id IS NULL THEN
    SELECT id INTO v_instructor_user_id
    FROM users
    LIMIT 1;
  END IF;

  -- 학생 사용자 3명 가져오기
  SELECT id INTO v_trainee1_id
  FROM users
  WHERE role = 'trainee' OR role = 'user'
  ORDER BY created_at
  OFFSET 0 LIMIT 1;

  SELECT id INTO v_trainee2_id
  FROM users
  WHERE role = 'trainee' OR role = 'user'
  ORDER BY created_at
  OFFSET 1 LIMIT 1;

  SELECT id INTO v_trainee3_id
  FROM users
  WHERE role = 'trainee' OR role = 'user'
  ORDER BY created_at
  OFFSET 2 LIMIT 1;

  -- 학생이 없으면 모든 사용자에서 가져오기
  IF v_trainee1_id IS NULL THEN
    SELECT id INTO v_trainee1_id FROM users OFFSET 1 LIMIT 1;
  END IF;
  IF v_trainee2_id IS NULL THEN
    SELECT id INTO v_trainee2_id FROM users OFFSET 2 LIMIT 1;
  END IF;
  IF v_trainee3_id IS NULL THEN
    SELECT id INTO v_trainee3_id FROM users OFFSET 3 LIMIT 1;
  END IF;

  -- 테스트 과정 회차 생성
  INSERT INTO course_rounds (
    id,
    template_id,
    round_number,
    status,
    start_date,
    end_date,
    max_participants,
    current_participants,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_bs_basic_template_id,
    1,
    'in_progress',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    30,
    3,
    NOW(),
    NOW()
  ) RETURNING id INTO v_test_round_id;

  RAISE NOTICE '✅ 테스트 과정 회차 생성: %', v_test_round_id;

  -- 강사를 회차에 배정
  IF v_instructor_user_id IS NOT NULL THEN
    INSERT INTO round_instructors (
      round_id,
      instructor_id,
      role,
      weight_percentage,
      created_at
    ) VALUES (
      v_test_round_id,
      v_instructor_user_id,
      'lead',
      100,
      NOW()
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 강사 배정: %', v_instructor_user_id;
  END IF;

  -- 학생 3명 등록
  IF v_trainee1_id IS NOT NULL THEN
    INSERT INTO round_enrollments (
      id,
      round_id,
      user_id,
      status,
      enrolled_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_test_round_id,
      v_trainee1_id,
      'enrolled',
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ 학생 1 등록: %', v_trainee1_id;
  END IF;

  IF v_trainee2_id IS NOT NULL THEN
    INSERT INTO round_enrollments (
      id,
      round_id,
      user_id,
      status,
      enrolled_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_test_round_id,
      v_trainee2_id,
      'enrolled',
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ 학생 2 등록: %', v_trainee2_id;
  END IF;

  IF v_trainee3_id IS NOT NULL THEN
    INSERT INTO round_enrollments (
      id,
      round_id,
      user_id,
      status,
      enrolled_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_test_round_id,
      v_trainee3_id,
      'enrolled',
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
    RAISE NOTICE '✅ 학생 3 등록: %', v_trainee3_id;
  END IF;

  -- 결과 출력
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 샘플 데이터 생성 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '과정 템플릿 ID: %', v_bs_basic_template_id;
  RAISE NOTICE '테스트 회차 ID: %', v_test_round_id;
  RAISE NOTICE '강사 ID: %', v_instructor_user_id;
  RAISE NOTICE '학생 1 ID: %', v_trainee1_id;
  RAISE NOTICE '학생 2 ID: %', v_trainee2_id;
  RAISE NOTICE '학생 3 ID: %', v_trainee3_id;
  RAISE NOTICE '========================================';

END $$;

-- 생성된 데이터 확인 쿼리
SELECT
  cr.id as round_id,
  ct.name as course_name,
  cr.round_number,
  cr.status,
  cr.start_date,
  cr.end_date,
  cr.current_participants,
  (SELECT COUNT(*) FROM round_enrollments WHERE round_id = cr.id) as actual_enrollments,
  (SELECT COUNT(*) FROM round_instructors WHERE round_id = cr.id) as instructor_count
FROM course_rounds cr
JOIN course_templates ct ON cr.template_id = ct.id
WHERE cr.status = 'in_progress'
ORDER BY cr.created_at DESC
LIMIT 5;
