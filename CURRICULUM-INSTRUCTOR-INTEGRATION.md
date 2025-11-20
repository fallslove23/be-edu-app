# 커리큘럼-과목-강사 연동 가이드

## 🔄 시스템 연동 흐름

### 1단계: 과목 등록 (자원 관리)
먼저 **자원 관리** 메뉴에서 과목을 등록합니다.

```
자원 관리 → 과목 관리 → 과목 등록
- 과목명: "BS 영업 기초"
- 카테고리: "영업"
- 설명: "영업의 기본 원칙과 고객 응대 기법"
```

### 2단계: 강사-과목 매핑 (강사 관리)
**강사 관리**에서 각 강사가 가르칠 수 있는 과목을 지정합니다.

```
강사 관리 → 프로필 수정 → 강의 가능 과목 선택
- 검색/카테고리로 과목 필터링
- 과목 클릭하여 선택
- 숙련도 설정 (초급/중급/전문가)
```

**데이터베이스 관계:**
```sql
instructor_subjects 테이블:
- instructor_id (강사 ID)
- subject_id (과목 ID)
- proficiency_level (숙련도: beginner/intermediate/expert)
```

### 3단계: 커리큘럼 작성 (일정 관리)
**일정 관리** 또는 **과정 관리**에서 커리큘럼을 작성합니다.

```
과정 관리 → 커리큘럼 작성 → 과목 선택
```

**자동 연동 시나리오:**

#### 시나리오 A: 과목 선택 → 강사 자동 필터링
```typescript
// 1. 과목을 선택하면
const selectedSubject = "BS 영업 기초";

// 2. 해당 과목을 가르칠 수 있는 강사만 표시
const availableInstructors = await getInstructorsBySubject(selectedSubjectId);

// 3. 숙련도 순으로 정렬 (전문가 → 중급 → 초급)
const sortedInstructors = availableInstructors.sort((a, b) => {
  const proficiencyOrder = { expert: 3, intermediate: 2, beginner: 1 };
  return proficiencyOrder[b.proficiency] - proficiencyOrder[a.proficiency];
});
```

#### 시나리오 B: 강사 선택 → 담당 가능 과목 표시
```typescript
// 1. 강사를 먼저 선택하면
const selectedInstructor = "김영수 강사";

// 2. 해당 강사가 가르칠 수 있는 과목만 표시
const availableSubjects = await getSubjectsByInstructor(selectedInstructorId);
```

### 4단계: 일정 등록
과목과 강사가 매핑되면 실제 수업 일정을 등록합니다.

```sql
course_schedules 테이블:
- course_id (과정 ID)
- subject_id (과목 ID)
- instructor_id (강사 ID)
- scheduled_date (수업 날짜)
- start_time, end_time (시간)
- location (강의실)
```

## 📊 데이터 구조

### 과목 (subjects)
```typescript
interface Subject {
  id: string;
  name: string;              // 과목명
  code?: string;             // 과목 코드
  category?: string;         // 카테고리
  description?: string;      // 설명
  credits?: number;          // 학점
  duration_hours?: number;   // 시수
  is_active: boolean;        // 활성화 여부
}
```

### 강사-과목 매핑 (instructor_subjects)
```typescript
interface InstructorSubject {
  id: string;
  instructor_id: string;                              // 강사 ID
  subject_id: string;                                 // 과목 ID
  proficiency_level: 'beginner' | 'intermediate' | 'expert';  // 숙련도
  assigned_at: string;                                // 배정 일시
}
```

### 커리큘럼 일정 (course_schedules)
```typescript
interface CourseSchedule {
  id: string;
  course_id: string;         // 과정 ID
  subject_id?: string;       // 과목 ID (선택)
  instructor_id?: string;    // 강사 ID (선택)
  title: string;             // 일정 제목
  scheduled_date: string;    // 수업 날짜
  start_time: string;        // 시작 시간
  end_time: string;          // 종료 시간
  location?: string;         // 강의실
  status: ScheduleStatus;    // 상태
}
```

## 🔍 쿼리 예제

### 1. 과목으로 강사 검색
```sql
SELECT
  u.id,
  u.name,
  u.email,
  is.proficiency_level,
  COUNT(cs.id) as total_classes
FROM users u
JOIN instructor_subjects is ON u.id = is.instructor_id
LEFT JOIN course_schedules cs ON u.id = cs.instructor_id
WHERE is.subject_id = :subjectId
  AND u.role = 'instructor'
  AND u.status = 'active'
GROUP BY u.id, u.name, u.email, is.proficiency_level
ORDER BY
  CASE is.proficiency_level
    WHEN 'expert' THEN 3
    WHEN 'intermediate' THEN 2
    WHEN 'beginner' THEN 1
  END DESC,
  total_classes DESC;
```

### 2. 강사로 과목 검색
```sql
SELECT
  s.id,
  s.name,
  s.category,
  is.proficiency_level,
  COUNT(cs.id) as times_taught
FROM subjects s
JOIN instructor_subjects is ON s.id = is.subject_id
LEFT JOIN course_schedules cs ON s.id = cs.subject_id AND cs.instructor_id = :instructorId
WHERE is.instructor_id = :instructorId
  AND s.is_active = true
GROUP BY s.id, s.name, s.category, is.proficiency_level
ORDER BY times_taught DESC, s.name;
```

### 3. 특정 날짜/시간에 가능한 강사 검색
```sql
SELECT u.id, u.name
FROM users u
JOIN instructor_subjects is ON u.id = is.instructor_id
WHERE is.subject_id = :subjectId
  AND u.id NOT IN (
    -- 해당 시간에 이미 스케줄이 있는 강사 제외
    SELECT instructor_id
    FROM course_schedules
    WHERE scheduled_date = :targetDate
      AND (
        (start_time <= :targetStartTime AND end_time > :targetStartTime)
        OR (start_time < :targetEndTime AND end_time >= :targetEndTime)
        OR (start_time >= :targetStartTime AND end_time <= :targetEndTime)
      )
  );
```

## 🎯 구현 예제

### 서비스 함수

```typescript
// instructor-subject.service.ts
export class InstructorSubjectService {
  // 과목으로 강사 검색
  static async getInstructorsBySubject(
    subjectId: string,
    options?: {
      minProficiency?: 'beginner' | 'intermediate' | 'expert';
      excludeInstructorIds?: string[];
    }
  ) {
    let query = supabase
      .from('instructor_subjects')
      .select(`
        *,
        instructor:users!instructor_id(
          id, name, email, phone
        )
      `)
      .eq('subject_id', subjectId);

    if (options?.minProficiency) {
      const proficiencyOrder = { beginner: 1, intermediate: 2, expert: 3 };
      // 필터링 로직...
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(item => ({
      ...item.instructor,
      proficiency_level: item.proficiency_level,
    }));
  }

  // 강사로 과목 검색
  static async getSubjectsByInstructor(instructorId: string) {
    const { data, error } = await supabase
      .from('instructor_subjects')
      .select(`
        *,
        subject:subjects!subject_id(*)
      `)
      .eq('instructor_id', instructorId);

    if (error) throw error;

    return data.map(item => ({
      ...item.subject,
      proficiency_level: item.proficiency_level,
    }));
  }

  // 특정 날짜/시간에 가능한 강사 검색
  static async getAvailableInstructors(
    subjectId: string,
    targetDate: string,
    startTime: string,
    endTime: string
  ) {
    // 1. 해당 과목을 가르칠 수 있는 모든 강사
    const instructorsForSubject = await this.getInstructorsBySubject(subjectId);

    // 2. 해당 시간에 스케줄이 있는 강사 조회
    const { data: busyInstructors } = await supabase
      .from('course_schedules')
      .select('instructor_id')
      .eq('scheduled_date', targetDate)
      .or(`
        and(start_time.lte.${startTime},end_time.gt.${startTime}),
        and(start_time.lt.${endTime},end_time.gte.${endTime}),
        and(start_time.gte.${startTime},end_time.lte.${endTime})
      `);

    const busyIds = new Set(busyInstructors?.map(b => b.instructor_id) || []);

    // 3. 가능한 강사만 필터링
    return instructorsForSubject.filter(inst => !busyIds.has(inst.id));
  }
}
```

### UI 컴포넌트 예제

```typescript
// ScheduleForm.tsx
function ScheduleForm() {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [availableInstructors, setAvailableInstructors] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // 과목 선택 시 강사 목록 업데이트
  useEffect(() => {
    if (selectedSubject && selectedDate && startTime && endTime) {
      loadAvailableInstructors();
    }
  }, [selectedSubject, selectedDate, startTime, endTime]);

  const loadAvailableInstructors = async () => {
    const instructors = await InstructorSubjectService.getAvailableInstructors(
      selectedSubject,
      selectedDate,
      startTime,
      endTime
    );
    setAvailableInstructors(instructors);
  };

  return (
    <div>
      {/* 과목 선택 */}
      <select onChange={(e) => setSelectedSubject(e.target.value)}>
        <option value="">과목 선택</option>
        {subjects.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {/* 날짜/시간 선택 */}
      <input type="date" onChange={(e) => setSelectedDate(e.target.value)} />
      <input type="time" onChange={(e) => setStartTime(e.target.value)} />
      <input type="time" onChange={(e) => setEndTime(e.target.value)} />

      {/* 강사 선택 (자동 필터링됨) */}
      <select disabled={!selectedSubject}>
        <option value="">강사 선택</option>
        {availableInstructors.map(inst => (
          <option key={inst.id} value={inst.id}>
            {inst.name} ({inst.proficiency_level === 'expert' ? '⭐⭐⭐' :
                        inst.proficiency_level === 'intermediate' ? '⭐⭐' : '⭐'})
          </option>
        ))}
      </select>
    </div>
  );
}
```

## ✅ 체크리스트

### 시스템 설정
- [ ] 과목 등록 (자원 관리)
- [ ] 강사 계정 생성 (강사 관리)
- [ ] 강사-과목 매핑 (강사 프로필 수정)

### 기능 구현
- [ ] 과목 선택 → 강사 자동 필터링
- [ ] 강사 선택 → 과목 자동 필터링
- [ ] 시간 충돌 검사
- [ ] 숙련도 기반 정렬

### 데이터 무결성
- [ ] 과목 삭제 시 instructor_subjects 연동 삭제
- [ ] 강사 삭제 시 course_schedules 처리
- [ ] 과목 비활성화 시 신규 배정 차단

## 🚨 주의사항

1. **과목 삭제**: 이미 스케줄에 사용 중인 과목은 삭제하지 말고 비활성화
2. **강사 퇴사**: 강사 퇴사 시 미래 스케줄을 다른 강사에게 재배정 필요
3. **시간 충돌**: 같은 강사가 같은 시간에 여러 수업을 담당할 수 없음
4. **숙련도 관리**: 강사의 숙련도는 정기적으로 업데이트 필요

## 📚 참고

- **데이터베이스 스키마**: `/database/migrations/create-subjects-table.sql`
- **서비스 파일**: `/src/services/subject.service.ts`
- **강사 관리**: `/src/components/admin/InstructorManagement.tsx`
- **일정 관리**: `/src/components/schedule/IntegratedScheduleManager.tsx`
