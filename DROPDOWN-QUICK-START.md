# 드롭다운 메뉴 빠른 편집 가이드 ⚡

## 🎯 가장 빠른 방법 (3단계)

### 1️⃣ 파일 열기
```bash
src/config/dropdown-options.ts
```

### 2️⃣ 옵션 찾아서 수정
```typescript
// 예: 시험 유형에서 "퀴즈"를 "소시험"으로 변경
{
  value: 'quiz',
  label: '소시험',  // 여기만 수정!
  description: '간단한 이해도 확인',
  icon: '❓'
}
```

### 3️⃣ 저장 → 끝!
브라우저에서 자동으로 업데이트됩니다.

---

## 📝 자주 하는 작업들

### 새 옵션 추가
```typescript
export const examTypeOptions: DropdownOption[] = [
  // ... 기존 옵션들 ...
  {
    value: 'mock_exam',      // 시스템 내부값 (영어로)
    label: '모의고사',        // 화면에 표시될 이름
    description: '실전 대비 모의고사',  // 옵션 설명
    color: 'teal',           // 색상
    icon: '📋'               // 이모지 아이콘
  }
];
```

### 옵션 이름만 변경
```typescript
{
  value: 'final',      // ⚠️ 이건 건드리지 마세요!
  label: '기말고사',    // ✅ 이것만 바꾸세요
  // ...
}
```

### 옵션 아이콘 변경
```typescript
{
  value: 'quiz',
  label: '퀴즈',
  icon: '🧩'  // ✅ 원하는 이모지로 변경
}
```

### 옵션 숨기기 (삭제하지 않고)
```typescript
export const examTypeOptions: DropdownOption[] = [
  { value: 'final', label: '최종평가', ... },
  // 임시로 숨김
  // { value: 'quiz', label: '퀴즈', ... },
];
```

---

## 🎨 사용 가능한 드롭다운 목록

| 드롭다운 이름 | 파일 위치 | 설명 |
|-------------|----------|------|
| `examTypeOptions` | line 28 | 시험 유형 |
| `examStatusOptions` | line 54 | 시험 상태 |
| `questionTypeOptions` | line 89 | 문제 유형 |
| `difficultyOptions` | line 121 | 난이도 |
| `courseStatusOptions` | line 143 | 과정 상태 |
| `attendanceStatusOptions` | line 176 | 출석 상태 |
| `userRoleOptions` | line 202 | 사용자 역할 |
| `evaluationTypeOptions` | line 237 | 평가 유형 |
| `gradeOptions` | line 263 | 성적 등급 |

---

## ⚠️ 주의사항

### ✅ 안전하게 바꿀 수 있는 것
- `label` (화면에 표시되는 이름)
- `description` (설명)
- `icon` (아이콘)
- `color` (색상)

### ❌ 함부로 바꾸면 안 되는 것
- `value` (시스템 내부값) → 데이터베이스 영향!

---

## 💡 실전 예시

### 예시 1: "최종평가"를 "기말고사"로 변경

**Before:**
```typescript
{
  value: 'final',
  label: '최종평가',
  description: '과정 수료를 위한 최종 평가',
  icon: '🎯'
}
```

**After:**
```typescript
{
  value: 'final',        // 그대로
  label: '기말고사',      // 변경!
  description: '과정 수료를 위한 기말 평가',  // 변경!
  icon: '📝'             // 변경!
}
```

### 예시 2: 새로운 시험 유형 추가

```typescript
export const examTypeOptions: DropdownOption[] = [
  // ... 기존 옵션들 (최종평가, 중간평가 등) ...

  // 새로 추가!
  {
    value: 'surprise_quiz',
    label: '깜짝 퀴즈',
    description: '예고 없이 진행되는 퀴즈',
    color: 'orange',
    icon: '⚡'
  }
];
```

---

## 🚀 더 알아보기

상세한 가이드는 `DROPDOWN-GUIDE.md` 파일을 참고하세요.

- 컴포넌트에서 사용하는 방법
- 고급 기능
- 문제 해결
- 관리자 UI (향후 추가 예정)
