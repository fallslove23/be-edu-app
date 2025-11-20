-- Mock 사용자 데이터 정리 스크립트
-- 주의: 이 스크립트는 mock, test, example이 포함된 이메일의 사용자와 관련 데이터를 모두 삭제합니다.

-- 1단계: Mock 사용자 ID 확인
DO $$
DECLARE
  mock_user_ids UUID[];
  user_count INTEGER;
BEGIN
  -- Mock 사용자 ID 목록 가져오기
  SELECT ARRAY_AGG(id) INTO mock_user_ids
  FROM users
  WHERE email LIKE '%mock%'
     OR email LIKE '%test%'
     OR email LIKE '%example%'
     OR email LIKE '%demo%';

  user_count := COALESCE(array_length(mock_user_ids, 1), 0);
  RAISE NOTICE '삭제 대상 사용자 수: %', user_count;

  IF user_count > 0 THEN
    -- 2단계: 관련 데이터 삭제 (외래 키 순서대로)

    -- 출석 기록 삭제
    DELETE FROM attendance
    WHERE user_id = ANY(mock_user_ids);
    RAISE NOTICE '출석 기록 삭제 완료';

    -- BS 활동 삭제
    DELETE FROM bs_activities
    WHERE trainee_id = ANY(mock_user_ids);
    RAISE NOTICE 'BS 활동 삭제 완료';

    -- 피드백 삭제 (강사가 작성한 피드백)
    DELETE FROM feedbacks
    WHERE instructor_id = ANY(mock_user_ids);
    RAISE NOTICE '피드백 삭제 완료';

    -- 강사로 배정된 세션 업데이트 (NULL로 설정)
    UPDATE course_sessions
    SET actual_instructor_id = NULL
    WHERE actual_instructor_id = ANY(mock_user_ids);
    RAISE NOTICE '세션 강사 배정 해제 완료';

    -- 차수 교육생 삭제
    DELETE FROM round_trainees
    WHERE trainee_id = ANY(mock_user_ids);
    RAISE NOTICE '차수 교육생 삭제 완료';

    -- 평가 기록 삭제
    DELETE FROM evaluations
    WHERE trainee_id = ANY(mock_user_ids)
       OR instructor_id = ANY(mock_user_ids);
    RAISE NOTICE '평가 기록 삭제 완료';

    -- 강사 테이블에서 삭제
    DELETE FROM instructors
    WHERE user_id = ANY(mock_user_ids);
    RAISE NOTICE '강사 정보 삭제 완료';

    -- 알림 삭제
    DELETE FROM notifications
    WHERE user_id = ANY(mock_user_ids);
    RAISE NOTICE '알림 삭제 완료';

    -- 3단계: 사용자 삭제
    DELETE FROM users
    WHERE id = ANY(mock_user_ids);
    RAISE NOTICE '사용자 삭제 완료';

    RAISE NOTICE '=================================';
    RAISE NOTICE 'Mock 사용자 정리 완료: % 명', user_count;
    RAISE NOTICE '=================================';
  ELSE
    RAISE NOTICE 'Mock 사용자가 없습니다.';
  END IF;
END $$;

-- 결과 확인
SELECT
  '남은 사용자' as category,
  COUNT(*) as count
FROM users
UNION ALL
SELECT
  'Mock 사용자',
  COUNT(*)
FROM users
WHERE email LIKE '%mock%'
   OR email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%';
