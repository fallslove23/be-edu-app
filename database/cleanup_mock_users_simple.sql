-- Mock 사용자 삭제 스크립트 (간단 버전)
-- CASCADE를 사용하여 관련 데이터 자동 삭제

-- 주의: 이 스크립트는 mock, test, example, demo 이메일 사용자를 삭제합니다.
-- 실행 전 preview_mock_users_simple.sql로 확인하세요!

DO $$
DECLARE
  deleted_count INTEGER;
  mock_users_list TEXT;
BEGIN
  -- 삭제 전 Mock 사용자 목록 로그
  SELECT STRING_AGG(name || ' (' || email || ')', ', ')
  INTO mock_users_list
  FROM users
  WHERE email LIKE '%mock%'
     OR email LIKE '%test%'
     OR email LIKE '%example%'
     OR email LIKE '%demo%';

  IF mock_users_list IS NOT NULL THEN
    RAISE NOTICE '=================================';
    RAISE NOTICE '삭제 대상 사용자: %', mock_users_list;
    RAISE NOTICE '=================================';

    -- instructors 테이블에서 먼저 삭제 (있는 경우)
    BEGIN
      DELETE FROM instructors
      WHERE user_id IN (
        SELECT id FROM users
        WHERE email LIKE '%mock%'
           OR email LIKE '%test%'
           OR email LIKE '%example%'
           OR email LIKE '%demo%'
      );
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RAISE NOTICE '강사 정보 삭제: % 건', deleted_count;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE '강사 테이블이 없습니다. 건너뜁니다.';
      WHEN OTHERS THEN
        RAISE NOTICE '강사 삭제 중 오류 (무시): %', SQLERRM;
    END;

    -- course_sessions에서 강사 배정 해제 (있는 경우)
    BEGIN
      UPDATE course_sessions
      SET actual_instructor_id = NULL
      WHERE actual_instructor_id IN (
        SELECT id FROM users
        WHERE email LIKE '%mock%'
           OR email LIKE '%test%'
           OR email LIKE '%example%'
           OR email LIKE '%demo%'
      );
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RAISE NOTICE '세션 강사 배정 해제: % 건', deleted_count;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE '세션 테이블이 없습니다. 건너뜁니다.';
      WHEN undefined_column THEN
        RAISE NOTICE '세션 테이블에 actual_instructor_id 컬럼이 없습니다. 건너뜁니다.';
      WHEN OTHERS THEN
        RAISE NOTICE '세션 업데이트 중 오류 (무시): %', SQLERRM;
    END;

    -- round_trainees에서 교육생 삭제 (있는 경우)
    BEGIN
      DELETE FROM round_trainees
      WHERE trainee_id IN (
        SELECT id FROM users
        WHERE email LIKE '%mock%'
           OR email LIKE '%test%'
           OR email LIKE '%example%'
           OR email LIKE '%demo%'
      );
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RAISE NOTICE '차수 교육생 삭제: % 건', deleted_count;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE '차수 교육생 테이블이 없습니다. 건너뜁니다.';
      WHEN OTHERS THEN
        RAISE NOTICE '차수 교육생 삭제 중 오류 (무시): %', SQLERRM;
    END;

    -- notifications 삭제 (있는 경우)
    BEGIN
      DELETE FROM notifications
      WHERE user_id IN (
        SELECT id FROM users
        WHERE email LIKE '%mock%'
           OR email LIKE '%test%'
           OR email LIKE '%example%'
           OR email LIKE '%demo%'
      );
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RAISE NOTICE '알림 삭제: % 건', deleted_count;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE '알림 테이블이 없습니다. 건너뜁니다.';
      WHEN OTHERS THEN
        RAISE NOTICE '알림 삭제 중 오류 (무시): %', SQLERRM;
    END;

    -- notices 삭제 (있는 경우)
    BEGIN
      DELETE FROM notices
      WHERE author_id IN (
        SELECT id FROM users
        WHERE email LIKE '%mock%'
           OR email LIKE '%test%'
           OR email LIKE '%example%'
           OR email LIKE '%demo%'
      );
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      RAISE NOTICE '공지사항 삭제: % 건', deleted_count;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE '공지사항 테이블이 없습니다. 건너뜁니다.';
      WHEN OTHERS THEN
        RAISE NOTICE '공지사항 삭제 중 오류 (무시): %', SQLERRM;
    END;

    -- 최종: users 삭제
    DELETE FROM users
    WHERE email LIKE '%mock%'
       OR email LIKE '%test%'
       OR email LIKE '%example%'
       OR email LIKE '%demo%';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE '=================================';
    RAISE NOTICE '사용자 삭제 완료: % 명', deleted_count;
    RAISE NOTICE '=================================';
  ELSE
    RAISE NOTICE '삭제할 Mock 사용자가 없습니다.';
  END IF;
END $$;

-- 결과 확인
SELECT
  '작업 완료' as status,
  COUNT(*) as "남은 전체 사용자",
  (SELECT COUNT(*) FROM users WHERE email LIKE '%mock%' OR email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%demo%') as "남은 Mock 사용자"
FROM users;
