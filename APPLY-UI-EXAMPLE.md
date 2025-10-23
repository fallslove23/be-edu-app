# UI 컴포넌트 적용 예시

## 적용된 페이지

### 1. 과정 운영 관리 (CourseOperationManager)
**경로:** `src/components/operations/CourseOperationManager.tsx`
**위치:** 독립 페이지 (라우팅 추가 필요)

**적용된 컴포넌트:**
- ✅ Button (primary, secondary, success, danger, warning)
- ✅ Card, CardHeader, CardTitle, CardContent
- ✅ Badge (success, info, warning, danger, default)

**Before:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
  새로고침
</button>
```

**After:**
```tsx
<Button
  variant="primary"
  leftIcon={<ArrowPathIcon className="h-5 w-5" />}
  onClick={loadData}
>
  새로고침
</Button>
```

---

## 다음 적용 대상

### 교육 운영 > 과정 관리 (CourseList)
**경로:** `src/components/courses/CourseList.tsx`
**현재 상태:** 기존 스타일 사용 중

**적용 계획:**
1. 검색/필터 영역 → `FilterGroup` 컴포넌트
2. 버튼들 → `Button` 컴포넌트
3. 카드 → `Card` 컴포넌트
4. 상태 뱃지 → `Badge` 컴포넌트

---

## 적용 가이드

### 1. Button 컴포넌트 교체

**기존:**
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  과정 생성
</button>
```

**개선:**
```tsx
import { Button } from '@/components/ui';

<Button
  variant="primary"
  leftIcon={<PlusIcon className="h-5 w-5" />}
>
  과정 생성
</Button>
```

### 2. 검색/필터 영역 교체

**기존:**
```tsx
<div className="bg-white rounded-lg p-6">
  <input type="text" className="border px-4 py-2..." />
  <select className="border px-4 py-2...">
    {/* options */}
  </select>
</div>
```

**개선:**
```tsx
import { FilterGroup } from '@/components/ui';

<FilterGroup
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  filters={[
    {
      name: 'status',
      label: '상태',
      options: statusOptions,
      value: statusFilter,
      onChange: setStatusFilter
    }
  ]}
  actions={
    <Button leftIcon={<PlusIcon />}>추가</Button>
  }
/>
```

### 3. 상태 뱃지 교체

**기존:**
```tsx
<span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
  진행중
</span>
```

**개선:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">진행중</Badge>
```

---

## 색상 매핑 가이드

### 과정 상태
- `draft` → `default` (회색)
- `active` → `success` (초록)
- `completed` → `info` (파랑)
- `cancelled` → `danger` (빨강)

### 수강 상태
- `active` → `success`
- `completed` → `info`
- `dropped` → `danger`

### 출석 상태
- `present` → `success`
- `absent` → `danger`
- `late` → `warning`
- `excused` → `info`

---

## 체크리스트

적용 시 확인사항:
- [ ] `import { Button, Card, Badge } from '@/components/ui';` 추가
- [ ] 기존 className 기반 버튼을 Button 컴포넌트로 교체
- [ ] 검색/필터 영역을 FilterGroup으로 교체
- [ ] 상태 표시를 Badge 컴포넌트로 교체
- [ ] 카드 레이아웃을 Card 컴포넌트로 교체
- [ ] 브라우저에서 동작 확인
- [ ] 반응형 동작 확인 (모바일, 태블릿, 데스크톱)

---

## 참고

전체 UI 가이드: `UI-DESIGN-SYSTEM.md`
