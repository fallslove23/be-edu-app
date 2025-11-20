# 🚀 통합 과정 관리 시스템 마이그레이션 가이드

## 📋 개요

이 가이드는 현재 혼재된 과정 관리 시스템을 통합 시스템으로 재설계하는 전체 과정을 안내합니다.

## ⚠️ 사전 준비사항

### 1. 데이터베이스 백업
```bash
# Supabase Dashboard에서 백업 생성
# 또는 pg_dump 사용
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 환경 변수 확인
```.env
DATABASE_URL=postgresql://...
```

### 3. 필요한 도구
- PostgreSQL Client (psql)
- Supabase CLI (선택사항)
- Node.js & npm

---

## 📝 Step 1: 데이터베이스 마이그레이션

### 1.1 스키마 생성 및 확장

**파일**: `database/migrations/unified-course-system.sql`

```bash
# Supabase SQL Editor에서 실행
# 또는 psql 명령어 사용
psql "$DATABASE_URL" -f database/migrations/unified-course-system.sql
```

**생성되는 것들**:
- ✅ `template_curriculum` 테이블
- ✅ `round_enrollments` 테이블
- ✅ `course_templates` 컬럼 추가 (duration_days, total_hours, requirements, objectives)
- ✅ `course_rounds` 컬럼 추가 (round_name, round_code, course_name)
- ✅ `curriculum_items` 컬럼 추가 (round_id, template_curriculum_id, title)
- ✅ `course_rounds_full` 뷰
- ✅ `curriculum_items_full` 뷰
- ✅ 자동 트리거: 차수 생성 시 curriculum_items 자동 생성

### 1.2 기존 데이터 마이그레이션

**파일**: `database/migrations/migrate-existing-data.sql`

```bash
psql "$DATABASE_URL" -f database/migrations/migrate-existing-data.sql
```

**마이그레이션되는 데이터**:
- ✅ BS Basic 템플릿 커리큘럼 (9개 항목, 3일, 24시간)
- ✅ BS Advanced 템플릿 커리큘럼 (10개 항목, 5일, 40시간)
- ✅ 기존 course_rounds 데이터 정리

### 1.3 검증

```sql
-- 템플릿 확인
SELECT * FROM course_templates;

-- 템플릿 커리큘럼 확인
SELECT
  tc.*,
  ct.name as template_name
FROM template_curriculum tc
JOIN course_templates ct ON tc.template_id = ct.id
ORDER BY ct.name, tc.day, tc.order_index;

-- 차수 전체 정보 확인
SELECT * FROM course_rounds_full;

-- 커리큘럼 항목 전체 정보 확인
SELECT * FROM curriculum_items_full;
```

---

## 💻 Step 2: TypeScript 타입 정의 업데이트

### 2.1 새 타입 파일 확인

**파일**: `src/types/unified-course.types.ts`

이미 생성되어 있습니다. 주요 타입:
- `CourseTemplate`
- `TemplateCurriculum`
- `CourseRound`
- `CurriculumItem`
- `RoundEnrollment`

### 2.2 기존 타입 파일 마이그레이션 계획

기존 `src/types/course-template.types.ts`는 유지하되, 새로운 파일을 우선 사용합니다.

---

## 🔧 Step 3: 서비스 레이어 리팩토링

### 3.1 새 서비스 파일 생성

다음 파일들을 생성해야 합니다:

1. **`src/services/unified-course.service.ts`** - 통합 과정 관리 서비스
2. **`src/services/template-curriculum.service.ts`** - 템플릿 커리큘럼 서비스
3. **`src/services/round-enrollment.service.ts`** - 등록 관리 서비스

### 3.2 기존 서비스 점진적 마이그레이션

현재 `CourseTemplateService`를 유지하면서 새로운 메서드를 추가합니다.

---

## 🎨 Step 4: UI 컴포넌트 업데이트

### 4.1 우선순위 컴포넌트

1. **과정 템플릿 관리** (`BSCourseManagement.tsx`)
   - 템플릿 생성 시 커리큘럼도 함께 입력
   - 템플릿 수정 기능 강화

2. **차수 생성 마법사** (새로 생성)
   - 템플릿 선택
   - 차수 정보 입력 (강사, 날짜, 장소)
   - 자동으로 curriculum_items 생성
   - 강의실 및 시간 조정 가능

3. **통합 일정 관리** (`IntegratedScheduleManager`)
   - 월/주/일 뷰
   - 과정별/강사별 필터
   - curriculum_items 기반 표시

4. **출석 관리** (`IntegratedAttendanceManagement`)
   - 이미 curriculum_items 기반으로 작동 중
   - 유지

---

## 🧪 Step 5: 테스트 시나리오

### 5.1 기본 시나리오

#### Scenario 1: 새 템플릿 생성
```typescript
// 1. 템플릿 생성
const template = await UnifiedCourseService.createTemplate({
  code: 'TEST-001',
  name: 'Test Course',
  category: 'basic',
  difficulty_level: 'beginner',
  duration_days: 2,
  total_hours: 16,
  requirements: ['없음'],
  objectives: ['테스트'],
  curriculum: [
    {
      day: 1,
      order_index: 1,
      subject: '테스트 과목',
      subject_type: 'lecture',
      duration_hours: 8,
      learning_objectives: ['목표1']
    },
    {
      day: 2,
      order_index: 1,
      subject: '테스트 실습',
      subject_type: 'practice',
      duration_hours: 8,
      learning_objectives: ['목표2']
    }
  ]
});

// 2. 템플릿 커리큘럼 확인
const curriculum = await TemplateCurriculumService.getByTemplateId(template.id);
console.log(curriculum); // 2개 항목 확인
```

#### Scenario 2: 차수 생성 (자동 curriculum_items 생성)
```typescript
// 1. 차수 생성
const round = await UnifiedCourseService.createRound({
  template_id: template.id,
  instructor_id: 'instructor-001',
  start_date: '2025-02-01',
  location: '본사 교육센터',
  max_trainees: 20
});

// 2. curriculum_items 자동 생성 확인
const curriculumItems = await UnifiedCourseService.getCurriculumItems(round.id);
console.log(curriculumItems); // 2개 항목 자동 생성됨

// 3. 날짜와 시간 확인
// Day 1: 2025-02-01 09:00-17:00 "테스트 과목"
// Day 2: 2025-02-02 09:00-17:00 "테스트 실습"
```

#### Scenario 3: 교육생 등록
```typescript
// 1. 여러 명 동시 등록
await RoundEnrollmentService.enroll({
  round_id: round.id,
  trainee_ids: ['trainee-001', 'trainee-002', 'trainee-003']
});

// 2. 등록 확인
const enrollments = await RoundEnrollmentService.getByRound(round.id);
console.log(enrollments.length); // 3명
```

#### Scenario 4: 출석 체크
```typescript
// 1. curriculum_items 조회
const items = await UnifiedCourseService.getCurriculumItems(round.id);
const firstItem = items[0];

// 2. 출석 체크
await AttendanceService.checkAttendance({
  curriculum_item_id: firstItem.id,
  trainee_id: 'trainee-001',
  status: 'present'
});

// 3. 출석 통계 확인
const stats = await AttendanceService.getStatistics(round.id);
```

---

## 📊 Step 6: 데이터 검증

### 6.1 데이터 무결성 검사

```sql
-- 1. 모든 템플릿에 커리큘럼이 있는지 확인
SELECT
  ct.name,
  COUNT(tc.id) as curriculum_count
FROM course_templates ct
LEFT JOIN template_curriculum tc ON ct.id = tc.template_id
WHERE ct.is_active = true
GROUP BY ct.id, ct.name;

-- 2. 모든 차수에 curriculum_items가 있는지 확인
SELECT
  cr.round_name,
  COUNT(ci.id) as curriculum_items_count
FROM course_rounds cr
LEFT JOIN curriculum_items ci ON cr.id = ci.round_id
WHERE cr.status != 'cancelled'
GROUP BY cr.id, cr.round_name;

-- 3. 등록 인원과 실제 enrollments 일치 확인
SELECT
  cr.round_name,
  cr.current_trainees as registered_count,
  COUNT(re.id) as enrollment_count
FROM course_rounds cr
LEFT JOIN round_enrollments re ON cr.id = re.round_id AND re.status = 'active'
GROUP BY cr.id, cr.round_name, cr.current_trainees
HAVING cr.current_trainees != COUNT(re.id);
```

---

## 🔄 Step 7: 롤백 계획

만약 문제가 발생하면 다음과 같이 롤백합니다:

### 7.1 데이터베이스 롤백
```sql
-- 새로 생성된 테이블 삭제
DROP TABLE IF EXISTS round_enrollments CASCADE;
DROP TABLE IF EXISTS template_curriculum CASCADE;

-- 추가된 컬럼 제거 (선택적)
ALTER TABLE course_templates
  DROP COLUMN IF EXISTS duration_days,
  DROP COLUMN IF EXISTS total_hours,
  DROP COLUMN IF EXISTS requirements,
  DROP COLUMN IF EXISTS objectives;

ALTER TABLE course_rounds
  DROP COLUMN IF EXISTS round_name,
  DROP COLUMN IF EXISTS round_code,
  DROP COLUMN IF EXISTS course_name;

ALTER TABLE curriculum_items
  DROP COLUMN IF EXISTS round_id,
  DROP COLUMN IF EXISTS template_curriculum_id,
  DROP COLUMN IF EXISTS title;

-- 뷰 삭제
DROP VIEW IF EXISTS course_rounds_full;
DROP VIEW IF EXISTS curriculum_items_full;

-- 트리거 삭제
DROP TRIGGER IF EXISTS trigger_auto_create_curriculum_items ON course_rounds;
DROP FUNCTION IF EXISTS auto_create_curriculum_items();
```

### 7.2 백업 복원
```bash
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql
```

---

## ✅ 완료 체크리스트

### 데이터베이스
- [ ] `unified-course-system.sql` 실행 완료
- [ ] `migrate-existing-data.sql` 실행 완료
- [ ] 데이터 무결성 검증 완료

### 코드
- [ ] TypeScript 타입 정의 확인
- [ ] 서비스 레이어 리팩토링 완료
- [ ] UI 컴포넌트 업데이트 완료

### 테스트
- [ ] 템플릿 생성 테스트
- [ ] 차수 생성 테스트 (자동 curriculum_items 생성 확인)
- [ ] 등록 및 출석 테스트
- [ ] 일정 조회 테스트

### 배포
- [ ] 개발 환경 테스트 완료
- [ ] 스테이징 환경 배포
- [ ] 프로덕션 배포 준비

---

## 📞 다음 단계

1. **즉시 실행 가능**: 데이터베이스 마이그레이션 (Step 1)
2. **개발 필요**: 서비스 레이어 및 UI 컴포넌트 (Step 3-4)
3. **검증 및 테스트**: 전체 시스템 테스트 (Step 5-6)

어떤 단계부터 시작하시겠습니까?
