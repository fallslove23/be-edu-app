-- =====================================================
-- 직급 공통 코드 업데이트
-- =====================================================
-- 설명: 직급 목록을 한국 기업 표준 직급 체계로 업데이트
-- 사원, 주임, 대리, 과장, 차장, 부장, 이사, 상무 등
-- =====================================================

-- 1. POSITION 그룹 ID 조회
DO $$
DECLARE
  v_group_id uuid;
BEGIN
  -- POSITION 그룹 ID 가져오기
  SELECT id INTO v_group_id
  FROM common_code_groups
  WHERE code = 'POSITION';

  -- 그룹이 없으면 생성
  IF v_group_id IS NULL THEN
    INSERT INTO common_code_groups (code, name, description, is_system, is_active, sort_order)
    VALUES ('POSITION', '직급', '조직 내 직급 체계', true, true, 2)
    RETURNING id INTO v_group_id;

    RAISE NOTICE '직급 그룹 생성 완료: %', v_group_id;
  END IF;

  -- 2. 기존 직급 데이터 비활성화 (삭제 대신)
  UPDATE common_codes
  SET is_active = false, updated_at = now()
  WHERE group_id = v_group_id;

  RAISE NOTICE '기존 직급 데이터 비활성화 완료';

  -- 3. 새로운 직급 데이터 삽입
  INSERT INTO common_codes (group_id, code, name, description, is_system, is_active, sort_order)
  VALUES
    (v_group_id, 'STAFF', '사원', '일반 사원', true, true, 1),
    (v_group_id, 'ASSISTANT', '주임', '주임', true, true, 2),
    (v_group_id, 'ASSOCIATE', '대리', '대리', true, true, 3),
    (v_group_id, 'MANAGER', '과장', '과장', true, true, 4),
    (v_group_id, 'DEPUTY_GM', '차장', '차장', true, true, 5),
    (v_group_id, 'GENERAL_MANAGER', '부장', '부장', true, true, 6),
    (v_group_id, 'DIRECTOR', '이사', '이사', true, true, 7),
    (v_group_id, 'SENIOR_DIRECTOR', '상무', '상무이사', true, true, 8),
    (v_group_id, 'EXECUTIVE_DIRECTOR', '전무', '전무이사', true, true, 9),
    (v_group_id, 'VICE_PRESIDENT', '부사장', '부사장', true, true, 10),
    (v_group_id, 'PRESIDENT', '사장', '사장', true, true, 11),
    (v_group_id, 'CEO', '대표이사', '최고경영자', true, true, 12)
  ON CONFLICT (group_id, code)
  DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

  RAISE NOTICE '직급 데이터 업데이트 완료';

END $$;

-- 4. 결과 확인
SELECT
  cg.name as group_name,
  cc.code,
  cc.name,
  cc.description,
  cc.sort_order,
  cc.is_active
FROM common_codes cc
JOIN common_code_groups cg ON cc.group_id = cg.id
WHERE cg.code = 'POSITION' AND cc.is_active = true
ORDER BY cc.sort_order;
