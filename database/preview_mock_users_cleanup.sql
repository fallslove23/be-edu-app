-- Mock 사용자 정리 미리보기 스크립트
-- 실제로 삭제하지 않고 삭제될 데이터를 확인합니다.

-- Mock 사용자 목록
SELECT
  '=== Mock 사용자 목록 ===' as info,
  id,
  name,
  email,
  role,
  status,
  created_at
FROM users
WHERE email LIKE '%mock%'
   OR email LIKE '%test%'
   OR email LIKE '%example%'
   OR email LIKE '%demo%'
ORDER BY created_at;

-- Mock 사용자와 연결된 데이터 통계
WITH mock_users AS (
  SELECT id
  FROM users
  WHERE email LIKE '%mock%'
     OR email LIKE '%test%'
     OR email LIKE '%example%'
     OR email LIKE '%demo%'
)
SELECT
  '출석 기록' as data_type,
  COUNT(*) as count
FROM attendance
WHERE user_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  'BS 활동',
  COUNT(*)
FROM bs_activities
WHERE trainee_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '피드백',
  COUNT(*)
FROM feedbacks
WHERE instructor_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '세션 강사 배정',
  COUNT(*)
FROM course_sessions
WHERE actual_instructor_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '차수 교육생',
  COUNT(*)
FROM round_trainees
WHERE trainee_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '평가 기록',
  COUNT(*)
FROM evaluations
WHERE trainee_id IN (SELECT id FROM mock_users)
   OR instructor_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '강사 정보',
  COUNT(*)
FROM instructors
WHERE user_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '알림',
  COUNT(*)
FROM notifications
WHERE user_id IN (SELECT id FROM mock_users)
UNION ALL
SELECT
  '총 Mock 사용자',
  COUNT(*)
FROM mock_users
ORDER BY data_type;

-- 세부 정보: 강사로 배정된 세션
SELECT
  '=== 강사로 배정된 세션 ===' as info,
  cs.id as session_id,
  cs.title,
  cs.session_date,
  u.name as instructor_name,
  u.email as instructor_email
FROM course_sessions cs
JOIN users u ON cs.actual_instructor_id = u.id
WHERE u.email LIKE '%mock%'
   OR u.email LIKE '%test%'
   OR u.email LIKE '%example%'
   OR u.email LIKE '%demo%'
ORDER BY cs.session_date;
