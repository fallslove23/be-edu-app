-- =================================================
-- Phase 3: 데이터 검증 쿼리
-- =================================================
-- 설명: unified-course-system.sql 및 migrate-existing-data.sql 실행 후 데이터 무결성 검증
-- 실행: Supabase SQL Editor에서 각 쿼리를 순차적으로 실행
-- =================================================

-- =================================================
-- 1. course_templates 새 컬럼 확인
-- =================================================
SELECT
  id,
  code,
  name,
  duration_days,
  total_hours,
  array_length(requirements, 1) as req_count,
  array_length(objectives, 1) as obj_count,
  is_active
FROM course_templates
WHERE code IN ('BS-BASIC', 'BS-ADVANCED')
ORDER BY code;

-- 예상 결과:
-- BS-BASIC: duration_days=3, total_hours=24, req_count=1, obj_count=3
-- BS-ADVANCED: duration_days=5, total_hours=40, req_count=1, obj_count=4


-- =================================================
-- 2. template_curriculum 데이터 확인
-- =================================================
SELECT
  tc.day,
  tc.order_index,
  tc.subject,
  tc.subject_type,
  tc.duration_hours,
  array_length(tc.learning_objectives, 1) as objectives_count,
  ct.name as template_name
FROM template_curriculum tc
JOIN course_templates ct ON tc.template_id = ct.id
ORDER BY ct.name, tc.day, tc.order_index;

-- 예상 결과:
-- 총 19개 행 (BS-BASIC 9개 + BS-ADVANCED 10개)
-- BS-BASIC: 3일간, 각 일차별 3개 과목
-- BS-ADVANCED: 5일간, 각 일차별 2개 과목


-- =================================================
-- 3. template_curriculum 일차별 시간 합계 확인
-- =================================================
SELECT
  ct.name as template_name,
  tc.day,
  COUNT(*) as subject_count,
  SUM(tc.duration_hours) as total_hours_per_day
FROM template_curriculum tc
JOIN course_templates ct ON tc.template_id = ct.id
GROUP BY ct.id, ct.name, tc.day
ORDER BY ct.name, tc.day;

-- 예상 결과:
-- BS-BASIC Day 1-3: 각 8시간
-- BS-ADVANCED Day 1-5: 각 8시간


-- =================================================
-- 4. 트리거 설정 확인
-- =================================================
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_curriculum_items';

-- 예상 결과:
-- trigger_name: trigger_auto_create_curriculum_items
-- event_manipulation: INSERT
-- event_object_table: course_rounds


-- =================================================
-- 5. 뷰 생성 확인
-- =================================================
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN ('course_rounds_full', 'curriculum_items_full')
ORDER BY table_name;

-- 예상 결과:
-- course_rounds_full: VIEW
-- curriculum_items_full: VIEW


-- =================================================
-- 6. curriculum_items 테이블 구조 확인
-- =================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'curriculum_items'
  AND column_name IN ('id', 'round_id', 'template_curriculum_id', 'day', 'date', 'start_time', 'end_time', 'subject', 'title', 'subject_type', 'status')
ORDER BY ordinal_position;

-- 예상 결과:
-- round_id: uuid, nullable
-- template_curriculum_id: uuid, nullable
-- day: integer, not null
-- subject: character varying, not null
-- title: character varying, nullable


-- =================================================
-- 7. 외래 키 제약조건 확인
-- =================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('template_curriculum', 'curriculum_items', 'round_enrollments')
ORDER BY tc.table_name, tc.constraint_name;

-- 예상 결과:
-- template_curriculum → course_templates
-- curriculum_items → course_rounds
-- curriculum_items → template_curriculum
-- round_enrollments → course_rounds
-- round_enrollments → trainees


-- =================================================
-- 8. 데이터 무결성 종합 검사
-- =================================================

-- 8.1 모든 템플릿에 커리큘럼이 있는지 확인
SELECT
  ct.name,
  ct.duration_days,
  ct.total_hours,
  COUNT(tc.id) as curriculum_count,
  SUM(tc.duration_hours) as total_curriculum_hours
FROM course_templates ct
LEFT JOIN template_curriculum tc ON ct.id = tc.template_id
WHERE ct.is_active = true
GROUP BY ct.id, ct.name, ct.duration_days, ct.total_hours
ORDER BY ct.name;

-- 예상 결과:
-- BS-BASIC: curriculum_count=9, total_curriculum_hours=24
-- BS-ADVANCED: curriculum_count=10, total_curriculum_hours=40


-- 8.2 모든 차수에 curriculum_items가 있는지 확인 (있는 차수만)
SELECT
  cr.round_name,
  cr.status,
  COUNT(ci.id) as curriculum_items_count
FROM course_rounds cr
LEFT JOIN curriculum_items ci ON cr.id = ci.round_id
WHERE cr.status != 'cancelled'
GROUP BY cr.id, cr.round_name, cr.status
HAVING COUNT(ci.id) > 0
ORDER BY cr.created_at DESC
LIMIT 10;

-- 예상 결과:
-- 기존 차수가 있다면 curriculum_items 개수가 표시됨


-- =================================================
-- 9. 성공 확인 메시지
-- =================================================
SELECT
  '✅ Phase 3 검증 완료' as status,
  'All validation queries executed successfully' as message,
  NOW() as validated_at;
