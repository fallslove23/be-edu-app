# 과정 관리 ↔ 통합 캘린더 연동 가이드

## 🎉 완료된 기능

### 1️⃣ 과정 상세 정보 표시 ✅
- 과정 관리에서 "상세보기" 버튼 클릭 시 완전한 정보 표시
- 기본 정보, 일정 정보, 교육생 정보, 담당 인력, 메타 정보 모두 표시

### 2️⃣ 일정 추가 시 제목 자동 완성 ✅
- 과목 선택 → 강사 선택하면 자동으로 "과목명 - 강사명" 형식으로 제목 생성
- 수동 수정도 가능

### 3️⃣ 자동 동기화 시스템 ✅
- 과정 차수(`course_rounds`) 정보가 변경되면 통합 캘린더(`schedules`)에 자동 반영
- 양방향 동기화 지원

---

## 📦 생성된 서비스 & 스크립트

### 1. `course-rounds.service.ts`
과정 차수(BS Basic 1차, BS Advanced 2차 등) 관리 서비스

**주요 기능**:
- `getAll()`: 모든 과정 차수 조회
- `getById(id)`: 특정 차수 조회
- `create(data)`: 새 차수 생성
- `update(id, data)`: 차수 정보 수정
- `delete(id)`: 차수 삭제
- `getByTemplate(templateId)`: 템플릿별 차수 목록
- `getNextRoundNumber(templateId)`: 다음 차수 번호 자동 계산

### 2. `course-schedule-sync.service.ts`
과정 관리와 통합 캘린더 간 자동 동기화 서비스

**주요 기능**:
- `syncCourseSchedule(params)`: 특정 과정의 일정 동기화
- `deleteCourseSchedules(courseRoundId)`: 과정 삭제 시 관련 일정 삭제
- `syncAllCoursesInPeriod(start, end)`: 특정 기간의 모든 과정 동기화

### 3. `scripts/sync-course-schedules.ts`
일괄 동기화 실행 스크립트

---

## 🚀 사용 방법

### A. 새 과정 차수 생성 시

```typescript
import { CourseRoundsService } from '@/services/course-rounds.service';
import { CourseScheduleSyncService } from '@/services/course-schedule-sync.service';

// 1. 과정 차수 생성
const newRound = await CourseRoundsService.create({
  template_id: 'template-uuid',
  round_number: 1,
  title: 'BS Basic 1차',
  instructor_id: 'instructor-uuid',
  instructor_name: '김강사',
  start_date: '2025-01-15',
  end_date: '2025-03-15',
  max_trainees: 30,
  location: '본사 교육장',
});

// 2. 통합 캘린더에 자동 반영
const syncParams = CourseScheduleSyncService.createSyncParams(newRound);
await CourseScheduleSyncService.syncCourseSchedule(syncParams);
```

### B. 기존 과정 차수 수정 시

```typescript
// 1. 과정 정보 수정
const updated = await CourseRoundsService.update('course-round-id', {
  start_date: '2025-02-01',  // 날짜 변경
  end_date: '2025-04-01',
  location: '지사 교육장',   // 장소 변경
});

// 2. 통합 캘린더에 자동 반영
const syncParams = CourseScheduleSyncService.createSyncParams(updated);
await CourseScheduleSyncService.syncCourseSchedule(syncParams);
```

### C. 과정 차수 삭제 시

```typescript
// 1. 관련 일정 먼저 삭제
await CourseScheduleSyncService.deleteCourseSchedules('course-round-id');

// 2. 과정 차수 삭제
await CourseRoundsService.delete('course-round-id');
```

### D. 전체 일괄 동기화 (관리자용)

```bash
# 터미널에서 실행
npx tsx scripts/sync-course-schedules.ts
```

현재부터 1년 후까지의 모든 과정을 통합 캘린더와 동기화합니다.

---

## 📊 데이터 구조

```
course_templates (과정 템플릿)
  ↓
course_rounds (과정 차수)
  ↓
schedules (통합 캘린더 일정)
```

### 관계 설명

1. **course_templates**: BS Basic, BS Advanced 등의 과정 템플릿
2. **course_rounds**: 각 템플릿의 1차, 2차, 3차 등의 차수
3. **schedules**: 통합 캘린더에 표시되는 실제 일정

**핵심**: `course_rounds`의 일정 정보(시작일, 종료일, 강사 등)가 변경되면 자동으로 `schedules`에 반영됩니다.

---

## ⚠️ 주의사항

### 1. 자동 동기화 시점
- 과정 차수 생성/수정 후 **반드시** `syncCourseSchedule()` 호출 필요
- 자동 트리거는 아직 구현되지 않음 (수동 호출 필요)

### 2. 기존 데이터 마이그레이션
현재 `course_rounds` 테이블에 데이터가 없는 경우:

```sql
-- 샘플 데이터 삽입 예시
INSERT INTO course_rounds (
  template_id, round_number, title,
  instructor_id, instructor_name,
  start_date, end_date, max_trainees, location
) VALUES (
  'your-template-id', 1, 'BS Basic 1차',
  'instructor-id', '김강사',
  '2025-01-15', '2025-03-15', 30, '본사 교육장'
);
```

### 3. CourseManagement 컴포넌트
현재 CourseManagement는 **샘플 데이터**를 사용하고 있습니다.
실제 DB와 연동하려면:

```typescript
// CourseManagement.tsx에서
import { CourseRoundsService } from '@/services/course-rounds.service';

// useEffect에서 실제 데이터 로드
useEffect(() => {
  const loadRealData = async () => {
    const rounds = await CourseRoundsService.getAll();
    // rounds를 courses 형식으로 변환
    setCourses(convertToCourses(rounds));
  };
  loadRealData();
}, []);
```

---

## 🔄 향후 개선 사항

- [ ] 데이터베이스 트리거로 자동 동기화 (수동 호출 불필요)
- [ ] CourseManagement를 실제 DB와 완전 연동
- [ ] 과정 차수 생성/수정 UI 개선
- [ ] 일정 충돌 자동 감지 및 알림
- [ ] 과정 복제 기능
- [ ] 일괄 일정 생성 마법사

---

## 🆘 문제 해결

### Q: 과정을 수정했는데 캘린더에 반영이 안 돼요
**A**: 수정 후 동기화 함수를 수동으로 호출해야 합니다.
```typescript
await CourseScheduleSyncService.syncCourseSchedule(syncParams);
```

### Q: 동기화 스크립트 실행 시 "동기화할 과정이 없습니다"
**A**: `course_rounds` 테이블에 데이터가 없습니다. 먼저 과정 차수를 생성하세요.

### Q: 특정 날짜 범위만 동기화하고 싶어요
**A**:
```typescript
await CourseScheduleSyncService.syncAllCoursesInPeriod('2025-01-01', '2025-12-31');
```

---

## 📚 관련 문서

- [DROPDOWN-ADMIN-GUIDE.md](DROPDOWN-ADMIN-GUIDE.md) - 드롭다운 옵션 관리 가이드
- [DROPDOWN-QUICK-START.md](DROPDOWN-QUICK-START.md) - 빠른 시작 가이드
