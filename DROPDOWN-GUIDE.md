# 드롭다운 메뉴 편집 가이드

이 가이드는 시스템의 드롭다운 메뉴를 쉽게 편집하는 방법을 설명합니다.

## 📋 목차

1. [기본 사용법](#기본-사용법)
2. [새로운 옵션 추가](#새로운-옵션-추가)
3. [기존 옵션 수정](#기존-옵션-수정)
4. [컴포넌트에서 사용](#컴포넌트에서-사용)
5. [관리자 UI (향후 추가 예정)](#관리자-ui)

---

## 기본 사용법

모든 드롭다운 옵션은 **한 곳**에서 관리됩니다:

📁 `/src/config/dropdown-options.ts`

이 파일만 수정하면 전체 시스템의 드롭다운이 업데이트됩니다!

---

## 새로운 옵션 추가

### 예시: 시험 유형에 "모의고사" 추가하기

1. `src/config/dropdown-options.ts` 파일 열기
2. `examTypeOptions` 배열 찾기
3. 새로운 옵션 추가:

```typescript
export const examTypeOptions: DropdownOption[] = [
  // ... 기존 옵션들 ...
  {
    value: 'mock_exam',        // 시스템에서 사용하는 값
    label: '모의고사',          // 사용자에게 표시되는 이름
    description: '실전 대비 모의고사',  // 옵션 설명 (선택사항)
    color: 'teal',             // 색상 (선택사항)
    icon: '📋'                 // 아이콘 (선택사항)
  }
];
```

### 새로운 드롭다운 카테고리 추가하기

```typescript
// 새로운 카테고리 정의
export const paymentStatusOptions: DropdownOption[] = [
  {
    value: 'pending',
    label: '대기중',
    description: '결제 대기',
    color: 'yellow',
    icon: '⏳'
  },
  {
    value: 'completed',
    label: '완료',
    description: '결제 완료',
    color: 'green',
    icon: '✅'
  },
  {
    value: 'failed',
    label: '실패',
    description: '결제 실패',
    color: 'red',
    icon: '❌'
  }
];

// allDropdownOptions에도 추가
export const allDropdownOptions = {
  // ... 기존 옵션들 ...
  paymentStatus: paymentStatusOptions  // 추가!
};
```

---

## 기존 옵션 수정

### 라벨 변경

```typescript
// AS-IS (수정 전)
{
  value: 'final',
  label: '최종평가',
  // ...
}

// TO-BE (수정 후)
{
  value: 'final',
  label: '기말고사',  // 이름만 변경
  // ...
}
```

### 아이콘 변경

```typescript
{
  value: 'quiz',
  label: '퀴즈',
  icon: '❓'  // 기존
}

// 변경
{
  value: 'quiz',
  label: '퀴즈',
  icon: '🧩'  // 새 아이콘
}
```

### 옵션 비활성화 (숨기기)

옵션을 완전히 삭제하지 않고 주석 처리:

```typescript
export const examTypeOptions: DropdownOption[] = [
  {
    value: 'final',
    label: '최종평가',
    // ...
  },
  // 임시로 비활성화
  // {
  //   value: 'daily_test',
  //   label: '일일평가',
  //   // ...
  // },
];
```

---

## 컴포넌트에서 사용

### 방법 1: 새로운 Select 컴포넌트 사용 (권장)

```tsx
import Select from '@/components/common/Select';
import { examTypeOptions } from '@/config/dropdown-options';

function MyComponent() {
  const [examType, setExamType] = useState('');

  return (
    <Select
      label="시험 유형"
      value={examType}
      onChange={setExamType}
      options={examTypeOptions}
      placeholder="시험 유형을 선택하세요"
      showIcons={true}
      showDescriptions={true}
      required
    />
  );
}
```

### 방법 2: 기존 코드 업데이트

기존의 하드코딩된 드롭다운을:

```tsx
// AS-IS (수정 전)
<select>
  <option value="final">최종평가</option>
  <option value="midterm">중간평가</option>
  <option value="quiz">퀴즈</option>
</select>
```

이렇게 변경:

```tsx
// TO-BE (수정 후)
import { examTypeOptions } from '@/config/dropdown-options';

<select>
  <option value="">선택하세요</option>
  {examTypeOptions.map(option => (
    <option key={option.value} value={option.value}>
      {option.icon} {option.label}
    </option>
  ))}
</select>
```

### 방법 3: 헬퍼 함수 사용

value로 label 가져오기:

```tsx
import { getLabel, getIcon, examTypeOptions } from '@/config/dropdown-options';

// "final" → "최종평가"
const label = getLabel(examTypeOptions, 'final');

// "final" → "🎯"
const icon = getIcon(examTypeOptions, 'final');

// 사용 예시
<div>
  {icon} {label}
</div>
```

---

## 관리자 UI

**향후 추가 예정** - 웹 인터페이스에서 직접 옵션 관리

계획된 기능:
- ✅ 옵션 추가/수정/삭제
- ✅ 순서 변경 (드래그 앤 드롭)
- ✅ 아이콘 선택기
- ✅ 색상 선택기
- ✅ 실시간 미리보기
- ✅ 변경 이력 관리

---

## 사용 가능한 드롭다운 목록

현재 시스템에서 관리되는 드롭다운:

### 시험 관련
- `examTypeOptions` - 시험 유형 (최종평가, 중간평가, 퀴즈 등)
- `examStatusOptions` - 시험 상태 (준비중, 발행됨, 진행중 등)
- `questionTypeOptions` - 문제 유형 (객관식, O/X, 단답형 등)
- `difficultyOptions` - 난이도 (쉬움, 보통, 어려움)

### 과정 관련
- `courseStatusOptions` - 과정 상태 (계획중, 모집중, 진행중 등)
- `categoryOptions` - 과정 카테고리 (BS Basic, BS Advanced)

### 출석 관련
- `attendanceStatusOptions` - 출석 상태 (출석, 지각, 결석, 공결)

### 사용자 관련
- `userRoleOptions` - 사용자 역할 (관리자, 매니저, 강사 등)

### 평가 관련
- `evaluationTypeOptions` - 평가 유형 (이론, 실습, 프로젝트 등)
- `gradeOptions` - 성적 등급 (A+, A, B+ 등)

---

## 주의사항

### ⚠️ value 변경 시 주의

`value`를 변경하면 데이터베이스의 기존 데이터와 호환성 문제가 발생할 수 있습니다.

**안전한 변경:**
- ✅ `label` 변경
- ✅ `description` 변경
- ✅ `icon` 변경
- ✅ `color` 변경

**주의가 필요한 변경:**
- ⚠️ `value` 변경 → 데이터베이스 마이그레이션 필요
- ⚠️ 옵션 삭제 → 기존 데이터에 영향

### 💡 베스트 프랙티스

1. **새로운 옵션 추가는 배열 끝에**
   ```typescript
   // Good
   export const options = [
     { value: 'old1', label: '기존1' },
     { value: 'old2', label: '기존2' },
     { value: 'new', label: '신규' }  // 끝에 추가
   ];
   ```

2. **옵션 삭제는 주석 처리로**
   ```typescript
   // 나중에 복구할 수 있도록
   // { value: 'deprecated', label: '사용안함' },
   ```

3. **설명(description) 활용**
   ```typescript
   {
     value: 'final',
     label: '최종평가',
     description: '과정 수료를 위한 최종 평가'  // 사용자에게 도움되는 정보
   }
   ```

---

## 문제 해결

### Q: 옵션을 추가했는데 화면에 안 보여요
A: 브라우저 캐시를 지우고 페이지를 새로고침하세요 (Ctrl+Shift+R)

### Q: 기존 데이터의 라벨이 안 바뀌어요
A: `value`는 그대로 두고 `label`만 변경했는지 확인하세요

### Q: 여러 컴포넌트에서 같은 옵션을 사용하려면?
A: `dropdown-options.ts`에 한 번만 정의하고 import해서 사용하세요

---

## 다음 단계

더 고급 기능이 필요하다면:

1. **데이터베이스 기반 옵션 관리**
   - 옵션을 DB에 저장
   - 관리자 UI에서 실시간 수정
   - 과정별로 다른 옵션 설정

2. **다국어 지원**
   - 언어별로 다른 라벨 표시
   - i18n 통합

3. **조건부 옵션**
   - 사용자 역할에 따라 다른 옵션 표시
   - 특정 조건에서만 표시되는 옵션

이런 기능이 필요하시면 말씀해 주세요!
