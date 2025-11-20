# 📋 통합 과정 관리 시스템 테스트 가이드

## 🎯 테스트 목표

통합 시스템이 정상적으로 작동하는지 확인:
1. ✅ 템플릿 수정 시 template_curriculum에 저장
2. ✅ 템플릿 생성 시 template_curriculum에 저장
3. ✅ 차수 생성 시 curriculum_items 자동 생성 (트리거)

---

## 📝 Test Case 1: 기존 템플릿 수정

**목적**: 템플릿 수정 시 커리큘럼이 template_curriculum 테이블에 저장되는지 확인

### 1.1 브라우저 테스트

1. **과정 관리 페이지 접속**
   - URL: `http://localhost:3000/dashboard` (또는 개발 서버 주소)
   - 좌측 메뉴에서 "과정 관리" 클릭

2. **템플릿 편집**
   - BS Basic 또는 BS Advanced 템플릿의 "편집" 버튼 클릭
   - 과정명, 설명, 학습 목표 등 수정
   - **커리큘럼 섹션 확인**:
     - 기존 일차별 커리큘럼이 표시되는지 확인
     - 새로운 일차 추가 또는 기존 일차 수정
   - "저장" 버튼 클릭

3. **성공 메시지 확인**
   - Toast 메시지: "✅ 템플릿이 성공적으로 수정되었습니다."

### 1.2 Supabase 데이터 확인

```sql
-- 1. 수정된 템플릿 확인
SELECT id, name, duration_days, total_hours, objectives
FROM course_templates
WHERE name LIKE 'BS%'
ORDER BY name;

-- 2. template_curriculum 데이터 확인
SELECT
  tc.day,
  tc.order_index,
  tc.subject,
  tc.duration_hours,
  tc.learning_objectives,
  ct.name as template_name
FROM template_curriculum tc
JOIN course_templates ct ON tc.template_id = ct.id
WHERE ct.name LIKE 'BS%'
ORDER BY ct.name, tc.day, tc.order_index;

-- 예상 결과: 수정한 커리큘럼 내용이 정확히 반영되어 있어야 함
```

### 1.3 콘솔 로그 확인

브라우저 DevTools Console에서:
```
[BSCourseManagement] Updating template with UnifiedCourseService: {...}
[UnifiedCourseService] Template updated: {template_id}
```

---

## 📝 Test Case 2: 새 템플릿 생성

**목적**: 새 템플릿 생성 시 커리큘럼이 함께 저장되는지 확인

### 2.1 브라우저 테스트

1. **새 템플릿 생성**
   - "새 템플릿 생성" 버튼 클릭
   - 기본 정보 입력:
     - 과정명: "테스트 과정"
     - 카테고리: Basic 또는 Advanced
     - 설명: "테스트용 과정입니다"

2. **커리큘럼 작성**
   - "일차 추가" 버튼으로 2-3개 일차 추가
   - 각 일차별로:
     - 제목: "1일차 과정" 등
     - 시간: 7-8시간
     - 학습 목표: 최소 1개 이상 입력

3. **저장 및 확인**
   - "생성" 버튼 클릭
   - Toast 메시지: "✅ 새로운 템플릿이 성공적으로 생성되었습니다."

### 2.2 Supabase 데이터 확인

```sql
-- 1. 새로 생성된 템플릿 확인
SELECT *
FROM course_templates
WHERE name = '테스트 과정'
ORDER BY created_at DESC
LIMIT 1;

-- 2. 템플릿의 커리큘럼 확인
SELECT
  tc.*,
  ct.name as template_name
FROM template_curriculum tc
JOIN course_templates ct ON tc.template_id = ct.id
WHERE ct.name = '테스트 과정'
ORDER BY tc.day, tc.order_index;

-- 예상 결과: 입력한 일차 수만큼 커리큘럼 항목이 생성되어야 함
```

---

## 📝 Test Case 3: 차수 생성 및 자동 curriculum_items 생성

**목적**: 차수 생성 시 트리거가 template_curriculum 기반으로 curriculum_items를 자동 생성하는지 확인

### 3.1 브라우저 테스트

1. **차수 생성**
   - BS Basic 또는 BS Advanced 템플릿에서 "차수 생성" 버튼 클릭
   - 차수 정보 입력:
     - 차수 번호: 자동 생성 또는 직접 입력
     - 강사: 선택
     - 시작일: 예) 2025-02-01
     - 장소: "본사 교육센터"
     - 정원: 20명

2. **저장**
   - "생성" 버튼 클릭
   - Toast 메시지: "✅ 새로운 차수가 성공적으로 생성되었습니다."

### 3.2 Supabase 데이터 확인

```sql
-- 1. 생성된 차수 확인
SELECT *
FROM course_rounds
WHERE round_name LIKE 'BS%'
ORDER BY created_at DESC
LIMIT 1;

-- 2. 자동 생성된 curriculum_items 확인
SELECT
  ci.day,
  ci.date,
  ci.start_time,
  ci.end_time,
  ci.subject,
  ci.subject_type,
  ci.status,
  cr.round_name
FROM curriculum_items ci
JOIN course_rounds cr ON ci.round_id = cr.id
WHERE cr.round_name LIKE 'BS%'
ORDER BY cr.created_at DESC, ci.day, ci.start_time
LIMIT 10;

-- 예상 결과:
-- - BS Basic: 9개 curriculum_items (3일 x 3과목)
-- - BS Advanced: 10개 curriculum_items (5일 x 2과목)
-- - 날짜가 start_date부터 순차적으로 배정됨
-- - start_time, end_time이 template의 recommended_time 기반으로 설정됨
```

### 3.3 상세 검증 쿼리

```sql
-- 3. curriculum_items와 template_curriculum 연결 확인
SELECT
  ci.day,
  ci.subject as actual_subject,
  ci.date,
  ci.start_time,
  ci.end_time,
  tc.subject as template_subject,
  tc.duration_hours as template_hours,
  cr.round_name
FROM curriculum_items ci
JOIN course_rounds cr ON ci.round_id = cr.id
LEFT JOIN template_curriculum tc ON ci.template_curriculum_id = tc.id
WHERE cr.round_name LIKE 'BS%'
ORDER BY cr.created_at DESC, ci.day, ci.start_time
LIMIT 10;

-- 예상 결과:
-- - actual_subject = template_subject (과목명 일치)
-- - template_curriculum_id가 NULL이 아님 (연결됨)
```

---

## 🔍 트러블슈팅

### 문제 1: 템플릿 수정 시 오류 발생

**증상**: "템플릿 수정 중 오류가 발생했습니다." 메시지

**해결 방법**:
1. 브라우저 콘솔에서 에러 메시지 확인
2. Supabase 로그 확인
3. 필수 필드 누락 여부 확인 (name, description, category)

### 문제 2: curriculum_items가 자동 생성되지 않음

**증상**: 차수는 생성되었지만 curriculum_items가 비어있음

**원인 분석**:
```sql
-- 1. 트리거 존재 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_create_curriculum_items';

-- 2. template_curriculum 데이터 존재 확인
SELECT COUNT(*) as curriculum_count
FROM template_curriculum tc
JOIN course_templates ct ON tc.template_id = ct.id
WHERE ct.name LIKE 'BS%';
```

**해결 방법**:
- 트리거가 없으면: `unified-course-system.sql` 재실행
- template_curriculum이 비어있으면: `migrate-existing-data.sql` 재실행

### 문제 3: 날짜/시간 계산 오류

**증상**: curriculum_items의 날짜나 시간이 이상함

**확인 쿼리**:
```sql
SELECT
  ci.day,
  ci.date,
  cr.start_date,
  ci.date - cr.start_date as day_offset
FROM curriculum_items ci
JOIN course_rounds cr ON ci.round_id = cr.id
ORDER BY ci.created_at DESC
LIMIT 5;

-- 예상: day_offset = (day - 1)
-- 즉, 1일차 = start_date, 2일차 = start_date + 1, ...
```

---

## ✅ 성공 기준

모든 테스트 케이스가 통과하면:

1. ✅ **템플릿 수정**: template_curriculum에 커리큘럼 저장됨
2. ✅ **템플릿 생성**: template_curriculum에 커리큘럼 저장됨
3. ✅ **차수 생성**: curriculum_items 자동 생성됨
4. ✅ **데이터 연결**: template_curriculum ↔ curriculum_items 정상 연결
5. ✅ **날짜 계산**: 차수 시작일 기준으로 일차별 날짜 정확히 계산됨

---

## 📊 최종 검증 쿼리

```sql
-- 전체 시스템 상태 확인
SELECT
  '템플릿' as category,
  COUNT(*) as count
FROM course_templates
WHERE is_active = true

UNION ALL

SELECT
  '템플릿 커리큘럼' as category,
  COUNT(*) as count
FROM template_curriculum

UNION ALL

SELECT
  '차수' as category,
  COUNT(*) as count
FROM course_rounds
WHERE status != 'cancelled'

UNION ALL

SELECT
  '커리큘럼 항목' as category,
  COUNT(*) as count
FROM curriculum_items

UNION ALL

SELECT
  '등록' as category,
  COUNT(*) as count
FROM round_enrollments
WHERE status = 'active';
```

---

## 🎉 마이그레이션 완료 확인

모든 테스트가 통과하면 **통합 과정 관리 시스템 마이그레이션 완료**입니다!

다음 단계:
1. 프로덕션 배포 준비
2. 사용자 교육 자료 작성
3. 기존 데이터 마이그레이션 계획 수립
