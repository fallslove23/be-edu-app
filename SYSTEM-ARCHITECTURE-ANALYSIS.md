# 🏗️ BS 학습관리시스템 아키텍처 분석 및 재설계 제안

## 📊 현재 시스템 구조 분석

### 1. 발견된 데이터 구조 (중복 및 혼재)

현재 시스템에는 **두 가지 서로 다른 과정 관리 체계**가 혼재되어 있습니다:

#### 🔴 **체계 A: 시험 관리 중심 (exam-management-migration.sql)**
```
course_templates (템플릿)
  ↓
course_sessions (차수) - session_number, session_year 기반
  ↓
class_divisions (분반)
  ↓
course_enrollments (수강신청)
```

**특징:**
- `course_templates`: code, duration_weeks, difficulty_level, tags, prerequisites
- `course_sessions`: session_number, session_year, enrollment_start/end, has_divisions
- **시험 관리에 최적화된 구조**
- 분반 개념이 포함됨
- 수강신청 기간이 명확함

#### 🔵 **체계 B: 차수 관리 중심 (course-rounds-table-fixed.sql)**
```
course_templates (템플릿) - DEFAULT_COURSE_TEMPLATES 사용
  ↓
course_rounds (차수) - round_number 기반
  ↓
course_sessions (세션/일차) - day_number 기반
  ↓
round_enrollments (등록)
```

**특징:**
- TypeScript interface: duration_days, total_hours, curriculum[], requirements[], objectives[]
- `course_rounds`: round_number, instructor_id, manager_id, location, status
- `course_sessions`: round_id, day_number, session_date, classroom
- **실제 BS 과정 운영에 최적화**
- 일차별 세션 관리
- 강사/운영자 명시적 지정

#### 🟢 **체계 C: 커리큘럼 중심 (curriculum-management-system.sql)**
```
course_sessions (차수)
  ↓
curriculum_items (커리큘럼 항목) - 과목별, 시간별 상세 일정
  ↓
instructor_schedules (강사 일정)
attendance_records (출석)
```

**특징:**
- **과목(subject) 중심**의 세밀한 일정 관리
- day, order_index, date, start_time, end_time
- subject_type: lecture, practice, evaluation, discussion
- instructor_id, classroom_id 배정
- 승인 프로세스 (needs_approval, approved_by)
- 출석 관리와 연동

---

## ⚠️ 현재 시스템의 문제점

### 1. **데이터베이스 스키마 불일치**
- `course_templates` 테이블 컬럼: code, duration_weeks, category, difficulty_level
- TypeScript 인터페이스: duration_days, total_hours, curriculum[], category_data
- **결과**: 템플릿 수정 시 Supabase 오류 발생 ❌

### 2. **과정-일정 연결 구조 중복**
- `course_sessions` (체계 A)와 `course_rounds` (체계 B)가 동시에 존재
- 둘 다 차수 개념이지만 구조가 다름
- `course_sessions` (체계 A)와 `course_sessions` (체계 B)가 이름은 같지만 역할이 다름

### 3. **일정 관리 체계 혼란**
현재 질문하신 것처럼 **두 가지 방향의 일정 구조**가 섞여있습니다:

**📚 과정 중심 흐름 (현재 주로 사용):**
```
과정 템플릿 (BS Basic/Advanced)
  → 차수 (1차, 2차, 3차...)
    → 일차 (1일차, 2일차, 3일차...)
      → 시간표 (09:00-12:00, 13:00-17:00...)
```

**📖 과목 중심 흐름 (curriculum_items 기반):**
```
과목 (영업 기초, 고급 협상법...)
  → 시간 단위 (09:00-12:00)
    → 일자 배정 (2025-01-15)
      → 차수 배정 (BS Basic 3차)
```

### 4. **템플릿 커리큘럼 vs 실제 커리큘럼 불일치**
- 템플릿에 `curriculum[]` 배열로 교육 내용 저장 (TypeScript)
- 실제 일정은 `curriculum_items` 테이블에 별도 저장 (DB)
- **연결 고리 없음**: 템플릿 수정이 실제 차수에 자동 반영 안됨

### 5. **출석 관리 연동 불명확**
- `attendance_records` → `curriculum_items` → `course_sessions` (체계 A)
- 하지만 `course_rounds` (체계 B)를 주로 사용 중
- **현재 출석 관리는 curriculum_items 기반인데, 과정 관리는 course_rounds 기반**

---

## 💡 제안: 통합 데이터 아키텍처

### 원칙
1. **단일 진실 공급원 (Single Source of Truth)**
2. **명확한 계층 구조**
3. **확장 가능한 설계**

### 제안하는 구조

```
┌─────────────────────────────────────────────────────────┐
│                  course_templates                        │
│  (과정 템플릿: BS Basic, BS Advanced)                    │
│  - 과정 기본 정보, 카테고리, 난이도                        │
└─────────────────────┬───────────────────────────────────┘
                      │ 1:N
                      ↓
┌─────────────────────────────────────────────────────────┐
│              template_curriculum                         │
│  (템플릿 커리큘럼: 과정의 표준 교육 내용)                  │
│  - 일차별 주제, 과목, 학습 목표                           │
│  - 순서, 시간, 과목 타입                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Referenced by
                      ↓
┌─────────────────────────────────────────────────────────┐
│                  course_rounds                           │
│  (과정 차수: BS Basic 1차, BS Advanced 2차)              │
│  - 실제 운영 차수                                        │
│  - 강사, 운영자, 장소, 기간                               │
│  - 정원, 상태 (모집중/진행중/완료)                        │
└─────────────────────┬───────────────────────────────────┘
                      │ 1:N
                      ↓
┌─────────────────────────────────────────────────────────┐
│               curriculum_items                           │
│  (실제 수업 일정: 과목별 시간표)                          │
│  - 날짜, 시간 (start_time, end_time)                     │
│  - 과목, 강사, 강의실                                    │
│  - 상태, 승인, 자료                                      │
│  - template_curriculum_id (템플릿 참조)                  │
└─────────────────────┬───────────────────────────────────┘
                      │ 1:N
                      ↓
┌─────────────────────────────────────────────────────────┐
│              attendance_records                          │
│  (출석 기록)                                             │
│  - curriculum_item_id 기준 출석 체크                     │
└─────────────────────────────────────────────────────────┘
```

### 데이터 흐름

#### 📝 **1단계: 템플릿 생성/수정**
```
관리자가 course_templates 생성
  → template_curriculum 작성 (일차별 표준 커리큘럼)
  → "BS Basic: 3일, 24시간, 영업기초/실전협상/프레젠테이션"
```

#### 📅 **2단계: 차수 생성**
```
관리자가 course_rounds 생성 (BS Basic 3차)
  → 자동으로 template_curriculum 기반으로 curriculum_items 생성
  → 실제 날짜/시간/강의실 배정
  → 강사 배정
```

#### ✅ **3단계: 일정 확정 및 운영**
```
curriculum_items 승인 완료
  → 출석 관리 가능 (attendance_records 생성)
  → 강사에게 일정 노출
  → 교육생에게 시간표 노출
```

#### 📊 **4단계: 일정 조회**
```
주간/일간 뷰:
  curriculum_items 기준으로 필터링
    → WHERE date BETWEEN start_date AND end_date
    → GROUP BY date, instructor_id
    → 강사별/날짜별/과정별 보기
```

---

## 🔧 구체적 해결 방안

### Phase 1: 스키마 통합 (우선순위 높음)

#### 1.1 course_templates 테이블 수정
```sql
ALTER TABLE course_templates
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS requirements TEXT[],
  ADD COLUMN IF NOT EXISTS objectives TEXT[];
```

#### 1.2 template_curriculum 테이블 생성 (새로 생성)
```sql
CREATE TABLE template_curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES course_templates(id) ON DELETE CASCADE,

  day INTEGER NOT NULL,           -- 1일차, 2일차...
  order_index INTEGER DEFAULT 1,  -- 같은 날 여러 과목

  subject VARCHAR(200) NOT NULL,  -- 과목명
  subject_type VARCHAR(50) DEFAULT 'lecture',
  description TEXT,

  duration_hours DECIMAL(4,2) NOT NULL,
  learning_objectives TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 curriculum_items 확장
```sql
ALTER TABLE curriculum_items
  ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES course_rounds(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS template_curriculum_id UUID REFERENCES template_curriculum(id);
```

### Phase 2: 서비스 레이어 수정

#### 2.1 CourseTemplateService 리팩토링
```typescript
// 템플릿 생성 시 template_curriculum도 함께 저장
static async createTemplate(data: CourseTemplateData) {
  // 1. course_templates에 기본 정보 저장
  const template = await supabase.from('course_templates').insert({
    code, name, description, duration_days, total_hours,
    category_id, requirements, objectives
  });

  // 2. template_curriculum에 커리큘럼 저장
  const curriculumItems = data.curriculum.map(c => ({
    template_id: template.id,
    day: c.day,
    subject: c.title,
    duration_hours: c.duration_hours,
    learning_objectives: c.learning_objectives
  }));

  await supabase.from('template_curriculum').insert(curriculumItems);
}

// 차수 생성 시 curriculum_items 자동 생성
static async createRound(roundData: CreateRoundData) {
  // 1. course_rounds 생성
  const round = await supabase.from('course_rounds').insert(roundData);

  // 2. template_curriculum 조회
  const { data: templateCurriculum } = await supabase
    .from('template_curriculum')
    .select('*')
    .eq('template_id', roundData.template_id);

  // 3. curriculum_items 생성 (날짜/시간 배정)
  const curriculumItems = templateCurriculum.map((tc, index) => {
    const date = addDays(roundData.start_date, tc.day - 1);
    return {
      round_id: round.id,
      template_curriculum_id: tc.id,
      day: tc.day,
      date: date,
      start_time: '09:00',
      end_time: addHours('09:00', tc.duration_hours),
      subject: tc.subject,
      subject_type: tc.subject_type,
      instructor_id: roundData.instructor_id,
      status: 'draft'
    };
  });

  await supabase.from('curriculum_items').insert(curriculumItems);
}
```

### Phase 3: UI 레이어 정리

#### 3.1 일정 관리 통합
```
현재: 과정 관리 / 일정 관리 / 출석 관리 분리
제안: 통합 일정 관리 뷰

📅 통합 일정 관리
  ├── 월간 뷰 (curriculum_items group by month)
  ├── 주간 뷰 (curriculum_items group by week)
  ├── 일간 뷰 (curriculum_items by date)
  └── 과정별 뷰 (curriculum_items by round_id)
```

#### 3.2 컴포넌트 구조
```typescript
// 통합 스케줄 컴포넌트
<IntegratedScheduleManager>
  <ScheduleViewSelector /> // 월/주/일/과정별
  <ScheduleCalendar
    dataSource="curriculum_items"  // 단일 데이터 소스
    groupBy={viewMode}             // 동적 그룹핑
  />
  <ScheduleDetail />
  <AttendanceQuickCheck />         // 출석 빠른 체크
</IntegratedScheduleManager>
```

---

## 📋 마이그레이션 계획

### Step 1: 데이터베이스 스키마 추가
1. `template_curriculum` 테이블 생성
2. `course_templates` 컬럼 추가
3. `curriculum_items`에 `round_id` 추가

### Step 2: 기존 데이터 마이그레이션
1. DEFAULT_COURSE_TEMPLATES 데이터를 `template_curriculum`으로 이동
2. 기존 `course_sessions` (체계 A) 데이터 확인 및 정리

### Step 3: 서비스 레이어 업데이트
1. `CourseTemplateService` 리팩토링
2. `AttendanceService`는 그대로 유지 (curriculum_items 기반)

### Step 4: UI 컴포넌트 통합
1. `IntegratedScheduleManager` 구현
2. 기존 개별 뷰 점진적 통합

---

## ✅ 기대 효과

1. **데이터 일관성**: 단일 데이터 소스로 충돌 제거
2. **템플릿-실제 연동**: 템플릿 수정이 차수 생성에 자동 반영
3. **일정 관리 명확화**: curriculum_items 중심의 통합 일정 관리
4. **출석 연동 자동화**: curriculum_items → attendance_records 자연스러운 흐름
5. **확장성**: 분반, 강사 교체, 보강 등 쉽게 처리 가능

---

## 🚀 다음 단계

이 분석을 바탕으로 어떻게 진행할까요?

**A. 즉시 적용 (Quick Fix)**
- 현재 구조 유지하면서 최소한의 수정
- template 수정 버그만 수정
- 문서화로 현재 구조 명확화

**B. 점진적 개선 (Recommended)**
- Phase 1만 먼저 적용 (스키마 통합)
- 서비스 레이어 순차 업데이트
- 기존 기능 유지하면서 개선

**C. 전면 재설계**
- 완전한 구조 재설계
- 데이터 마이그레이션
- 모든 컴포넌트 리팩토링

어떤 방향으로 진행하시겠습니까?
