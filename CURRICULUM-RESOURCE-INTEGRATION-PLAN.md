# 커리큘럼-과정-자원 관리 통합 개선 방안

## 현재 문제점 분석

### 1. 분리된 관리 구조
- **커리큘럼 관리** (`CurriculumManager.tsx`): 템플릿 기반 일정 생성
- **과정 관리** (여러 컴포넌트): 과정 생성 및 운영
- **자원 관리** (`ResourceManagement.tsx`): 카테고리, 강의실만 관리
- **문제**: 과목(Subject), 강사 정보가 자원 관리에서 분리되어 있음

### 2. 약한 데이터 연계
```typescript
// 현재 구조
interface Session {
  subject_id: string | null;  // 선택적 연결
  instructor_id: string | null; // 선택적 연결
  classroom_id?: string;       // 연결 없음
}
```
- 자원 가용성 체크 없음
- 충돌 감지 기능 부재
- 실시간 업데이트 연동 부족

### 3. 누락된 통합 기능
- ❌ 강사 스케줄 충돌 체크
- ❌ 강의실 중복 예약 방지
- ❌ 과목-강사 매칭 추천
- ❌ 자원 가용성 실시간 조회
- ❌ 일괄 자원 배정

---

## 개선 방안

### Phase 1: 자원 관리 확장 (1-2주)

#### 1.1 자원 관리에 과목/강사 추가
```typescript
// ResourceManagement.tsx 확장
export default function ResourceManagementPage() {
  const tabs = [
    'categories',    // 카테고리
    'subjects',      // ✨ 과목 (신규)
    'instructors',   // ✨ 강사 (신규)
    'classrooms'     // 강의실
  ];
}
```

**구현 파일**:
- `src/components/admin/SubjectManagement.tsx` → 자원 관리로 이동
- `src/components/admin/InstructorManagement.tsx` → 자원 관리로 통합

#### 1.2 통합 자원 서비스 생성
```typescript
// src/services/integrated-resource.service.ts
export class IntegratedResourceService {
  // 자원 가용성 체크
  async checkResourceAvailability(
    date: string,
    startTime: string,
    endTime: string,
    resourceType: 'instructor' | 'classroom'
  ): Promise<Resource[]>;

  // 충돌 감지
  async detectConflicts(
    sessionId: string,
    resources: SessionResource[]
  ): Promise<Conflict[]>;

  // 자원 추천
  async recommendResources(
    subject: string,
    datetime: DateTime
  ): Promise<ResourceRecommendation>;
}
```

### Phase 2: 커리큘럼 관리 강화 (2-3주)

#### 2.1 자원 연동 UI 추가
```typescript
// CurriculumManager.tsx 개선
interface SessionFormData {
  // 기존
  title: string;
  day_number: number;

  // ✨ 신규: 자원 선택 UI
  subject_id: string;          // 드롭다운: 활성 과목 목록
  instructor_id: string;       // 드롭다운: 가용 강사 (충돌 체크)
  classroom_id: string;        // 드롭다운: 가용 강의실 (충돌 체크)

  // ✨ 실시간 검증
  resourceConflicts: Conflict[]; // 충돌 경고 표시
  alternatives: Resource[];      // 대체 자원 추천
}
```

**UI 개선사항**:
1. **실시간 가용성 표시**
   - ✅ 녹색: 사용 가능
   - ⚠️ 노란색: 다른 일정 있음 (조정 가능)
   - ❌ 빨간색: 사용 불가

2. **스마트 추천**
   - 과목 선택 → 해당 과목 담당 강사 자동 필터링
   - 날짜/시간 선택 → 가용한 강의실만 표시
   - 충돌 발생 → 대체 시간/자원 추천

3. **일괄 배정 기능**
   ```
   [전체 세션 자원 배정]
   - 자동 배정: AI 기반 최적 자원 할당
   - 수동 배정: 관리자가 직접 선택
   - 충돌 해결: 대화형 충돌 해결 마법사
   ```

#### 2.2 데이터베이스 스키마 개선
```sql
-- course_sessions 테이블 강화
ALTER TABLE course_sessions
ADD COLUMN subject_id UUID REFERENCES subjects(id),
ADD COLUMN instructor_id UUID REFERENCES instructors(id),
ADD COLUMN classroom_id UUID REFERENCES classrooms(id),
ADD COLUMN resource_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN conflict_notes TEXT,
ADD CONSTRAINT check_resource_availability
  CHECK (resource_status IN ('pending', 'confirmed', 'conflict', 'cancelled'));

-- 자원 예약 로그 테이블 생성
CREATE TABLE resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  session_id UUID REFERENCES course_sessions(id),
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_double_booking
    UNIQUE (resource_type, resource_id, start_datetime, end_datetime)
);

-- 충돌 감지 인덱스
CREATE INDEX idx_bookings_time ON resource_bookings(
  resource_type, resource_id, start_datetime, end_datetime
);
```

### Phase 3: 통합 대시보드 (3-4주)

#### 3.1 자원 사용 현황 대시보드
```typescript
// src/components/dashboard/ResourceUtilizationDashboard.tsx
export function ResourceUtilizationDashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* 강사 가동률 */}
      <Card>
        <h3>강사 활용도</h3>
        <PieChart data={instructorUtilization} />
        <List>
          {instructors.map(i => (
            <Item>
              {i.name}: {i.utilization}%
              <Badge color={getUtilizationColor(i.utilization)}>
                {i.hoursPerWeek}시간/주
              </Badge>
            </Item>
          ))}
        </List>
      </Card>

      {/* 강의실 사용률 */}
      <Card>
        <h3>강의실 사용률</h3>
        <BarChart data={classroomUsage} />
        <HeatMap
          data={weeklySchedule}
          xAxis="time"
          yAxis="classroom"
        />
      </Card>

      {/* 과목별 분포 */}
      <Card>
        <h3>과목 개설 현황</h3>
        <DonutChart data={subjectDistribution} />
        <Timeline data={upcomingSessions} />
      </Card>
    </div>
  );
}
```

#### 3.2 통합 관리 워크플로우
```
[과정 생성 워크플로우]
1. 기본 정보 입력
   ↓
2. 커리큘럼 템플릿 선택
   ↓
3. 자동 자원 배정 (AI)
   - 과목별 추천 강사
   - 가용한 강의실 자동 배정
   - 충돌 자동 감지 및 해결
   ↓
4. 수동 조정 (선택)
   - 드래그앤드롭으로 일정 이동
   - 자원 재배정
   ↓
5. 최종 확인 및 생성
   - 모든 자원 예약 확정
   - 알림 발송 (강사, 수강생)
```

### Phase 4: 고급 기능 (4-5주)

#### 4.1 충돌 해결 마법사
```typescript
// src/components/curriculum/ConflictResolutionWizard.tsx
export function ConflictResolutionWizard({ conflicts }: Props) {
  return (
    <Wizard>
      <Step title="충돌 확인">
        <ConflictList conflicts={conflicts} />
      </Step>

      <Step title="해결 방안 선택">
        <ResolutionOptions>
          <Option>시간 변경</Option>
          <Option>강사 교체</Option>
          <Option>강의실 변경</Option>
          <Option>세션 분할</Option>
        </ResolutionOptions>
      </Step>

      <Step title="대체 자원 선택">
        <AlternativeResources
          type={selectedOption}
          availability={availableResources}
        />
      </Step>

      <Step title="최종 확인">
        <ReviewChanges changes={proposedChanges} />
      </Step>
    </Wizard>
  );
}
```

#### 4.2 자원 최적화 AI
```typescript
// src/services/resource-optimization.service.ts
export class ResourceOptimizationService {
  // 최적 자원 배정 알고리즘
  async optimizeResourceAllocation(
    sessions: Session[],
    constraints: Constraint[]
  ): Promise<OptimizedSchedule> {
    // 1. 제약 조건 파싱
    const hardConstraints = this.parseHardConstraints(constraints);
    const softConstraints = this.parseSoftConstraints(constraints);

    // 2. 초기 배정 (Greedy)
    let schedule = this.greedyAllocation(sessions, hardConstraints);

    // 3. 최적화 (Local Search)
    schedule = this.localSearchOptimization(schedule, softConstraints);

    // 4. 검증
    const conflicts = this.validateSchedule(schedule);

    return {
      schedule,
      conflicts,
      utilization: this.calculateUtilization(schedule),
      score: this.calculateScore(schedule, softConstraints)
    };
  }

  // 제약 조건 예시
  // - 강사 최대 근무 시간
  // - 강의실 우선순위
  // - 연속 수업 최소/최대 시간
  // - 특정 강사-과목 매칭 우선순위
}
```

---

## 구현 우선순위

### 🔥 긴급 (1주 이내)
1. **자원 관리 통합**
   - [ ] SubjectManagement를 ResourceManagement에 통합
   - [ ] InstructorManagement를 ResourceManagement에 통합
   - [ ] 통합 탭 UI 구현

2. **기본 충돌 체크**
   - [ ] 강의실 중복 예약 방지
   - [ ] 강사 스케줄 충돌 경고

### ⚡ 중요 (2-3주)
3. **커리큘럼 자원 연동**
   - [ ] 세션 생성 시 자원 선택 UI
   - [ ] 실시간 가용성 체크
   - [ ] 드롭다운 필터링 (가용 자원만 표시)

4. **데이터베이스 개선**
   - [ ] resource_bookings 테이블 생성
   - [ ] 충돌 감지 트리거 추가
   - [ ] 외래키 제약조건 강화

### 📈 개선 (3-4주)
5. **자원 사용 현황 대시보드**
   - [ ] 강사/강의실 활용도 차트
   - [ ] 주간/월간 스케줄 히트맵
   - [ ] 과목별 분포 분석

6. **일괄 배정 기능**
   - [ ] 자동 자원 배정 알고리즘
   - [ ] 충돌 해결 마법사
   - [ ] 대체 자원 추천

### 🚀 고급 (4주 이후)
7. **AI 기반 최적화**
   - [ ] 자원 최적 배치 알고리즘
   - [ ] 강사-과목 매칭 학습
   - [ ] 스케줄 품질 점수

---

## 기대 효과

### 운영 효율성
- ⏰ **일정 생성 시간 70% 단축**: 자동 자원 배정
- 🎯 **충돌 발생 90% 감소**: 실시간 검증
- 📊 **자원 활용도 30% 향상**: 최적화 알고리즘

### 사용자 경험
- ✅ 통합된 인터페이스로 관리 편의성 향상
- ⚡ 실시간 피드백으로 즉각적인 문제 해결
- 🤖 AI 추천으로 의사결정 지원

### 데이터 품질
- 🔗 강화된 데이터 무결성
- 📈 정확한 자원 사용 분석
- 🎓 개선된 교육 품질 관리

---

## 다음 단계

1. **즉시 시작 가능한 작업**:
   ```bash
   # 1. 자원 관리 통합
   cp src/components/admin/SubjectManagement.tsx src/components/resources/
   cp src/components/admin/InstructorManagement.tsx src/components/resources/

   # 2. ResourceManagement.tsx 업데이트
   # 4개 탭: 카테고리, 과목, 강사, 강의실
   ```

2. **데이터베이스 마이그레이션**:
   ```bash
   # database/migrations/006_resource_integration.sql 생성
   ```

3. **서비스 레이어 구현**:
   ```bash
   # src/services/integrated-resource.service.ts 생성
   ```

진행하시겠습니까? 어느 단계부터 시작할까요?
