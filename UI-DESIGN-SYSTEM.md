# BS 학습 관리 앱 - UI 디자인 시스템

## 📐 개요

전체 앱에서 일관된 UI/UX를 유지하기 위한 디자인 시스템입니다.

## 🎨 디자인 토큰

### 색상 팔레트

```typescript
// Primary (메인 색상)
primary: #6366f1 (Indigo 500)

// Success (성공/활성)
success: #22c55e (Green 500)

// Warning (경고)
warning: #eab308 (Yellow 500)

// Danger (위험/삭제)
danger: #ef4444 (Red 500)

// Info (정보)
info: #3b82f6 (Blue 500)

// Gray (중립)
gray: #6b7280 (Gray 500)
```

### 상태별 색상 매핑

```typescript
// 과정 상태
draft → gray (준비중)
active → success (진행중)
completed → info (완료)
cancelled → danger (취소)

// 수강 상태
active → success (수강중)
completed → info (수료)
dropped → danger (중도포기)

// 출석 상태
present → success (출석)
absent → danger (결석)
late → warning (지각)
excused → info (정당한 사유)

// 시험 상태
draft → gray (준비중)
scheduled → warning (예정)
active → success (진행중)
completed → info (완료)
cancelled → danger (취소)
```

## 🧩 공통 컴포넌트

### Button

```tsx
import { Button } from '@/components/ui';

// 기본 사용
<Button>저장</Button>

// 변형
<Button variant="primary">저장</Button>
<Button variant="secondary">취소</Button>
<Button variant="success">완료</Button>
<Button variant="danger">삭제</Button>
<Button variant="outline">더보기</Button>
<Button variant="ghost">닫기</Button>

// 크기
<Button size="sm">작은 버튼</Button>
<Button size="md">중간 버튼</Button>
<Button size="lg">큰 버튼</Button>

// 아이콘
<Button leftIcon={<PlusIcon className="h-5 w-5" />}>추가</Button>
<Button rightIcon={<ArrowRightIcon className="h-5 w-5" />}>다음</Button>

// 로딩
<Button isLoading>처리 중...</Button>

// 전체 너비
<Button fullWidth>전체 너비 버튼</Button>
```

### Input

```tsx
import { Input } from '@/components/ui';

// 기본 사용
<Input
  label="이름"
  placeholder="이름을 입력하세요"
/>

// 필수 입력
<Input
  label="이메일"
  required
/>

// 에러
<Input
  label="비밀번호"
  error="비밀번호가 일치하지 않습니다"
/>

// 도움말
<Input
  label="전화번호"
  helperText="하이픈(-) 없이 입력하세요"
/>

// 아이콘
<Input
  leftIcon={<EnvelopeIcon className="h-5 w-5" />}
  placeholder="이메일"
/>
```

### Select

```tsx
import { Select } from '@/components/ui';

// 기본 사용
<Select
  label="과정 선택"
  options={[
    { value: '1', label: 'BS 영업 기초과정' },
    { value: '2', label: 'BS 고급 영업 전략' },
  ]}
/>

// 에러
<Select
  label="과정 선택"
  error="과정을 선택해주세요"
  options={...}
/>
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>시험 목록</CardTitle>
    <CardDescription>진행 중인 시험 목록입니다</CardDescription>
  </CardHeader>

  <CardContent>
    {/* 카드 내용 */}
  </CardContent>

  <CardFooter>
    <Button variant="outline">닫기</Button>
    <Button>저장</Button>
  </CardFooter>
</Card>
```

### Badge

```tsx
import { Badge } from '@/components/ui';

// 기본 사용
<Badge>새 기능</Badge>

// 변형
<Badge variant="success">진행중</Badge>
<Badge variant="warning">예정</Badge>
<Badge variant="danger">취소</Badge>

// 아이콘
<Badge
  variant="success"
  icon={<CheckIcon className="h-3 w-3" />}
>
  완료
</Badge>
```

### SearchInput

```tsx
import { SearchInput } from '@/components/ui';

<SearchInput
  value={searchTerm}
  onValueChange={setSearchTerm}
  placeholder="검색어를 입력하세요"
/>
```

### FilterGroup

```tsx
import { FilterGroup } from '@/components/ui';

<FilterGroup
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="시험 검색..."
  filters={[
    {
      name: 'status',
      label: '상태',
      options: [
        { value: 'all', label: '전체' },
        { value: 'active', label: '진행중' },
        { value: 'completed', label: '완료' },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      name: 'course',
      label: '과정',
      options: courseOptions,
      value: courseFilter,
      onChange: setCourseFilter,
    },
  ]}
  actions={
    <Button
      leftIcon={<PlusIcon className="h-5 w-5" />}
      onClick={() => setShowForm(true)}
    >
      시험 추가
    </Button>
  }
/>
```

## 📝 사용 가이드

### 1. 기존 페이지 마이그레이션

```tsx
// Before
<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
  저장
</button>

// After
import { Button } from '@/components/ui';

<Button variant="primary">저장</Button>
```

### 2. 일관된 레이아웃

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { FilterGroup, Button } from '@/components/ui';

function MyPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">시험 관리</h1>
        <p className="text-gray-600">시험을 생성하고 관리합니다</p>
      </div>

      {/* 필터 및 검색 */}
      <FilterGroup
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        actions={actions}
      />

      {/* 메인 콘텐츠 */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>시험 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 콘텐츠 */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. 상태 표시

```tsx
import { Badge } from '@/components/ui';
import { getStatusColor } from '@/styles/design-tokens';

// 상태 뱃지 표시
function StatusBadge({ status }: { status: string }) {
  const variants = {
    draft: 'default',
    active: 'success',
    completed: 'info',
    cancelled: 'danger',
  };

  const labels = {
    draft: '준비중',
    active: '진행중',
    completed: '완료',
    cancelled: '취소',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
```

## 🔧 커스터마이징

### 디자인 토큰 수정

`src/styles/design-tokens.ts` 파일에서 색상, 간격 등을 수정할 수 있습니다.

```typescript
export const colors = {
  primary: {
    500: '#6366f1', // 메인 색상 변경
  },
};
```

### 컴포넌트 스타일 확장

```tsx
// 기본 스타일에 추가 클래스 적용
<Button className="shadow-xl">
  커스텀 스타일
</Button>

// Tailwind 클래스와 함께 사용
<Card className="hover:shadow-2xl transition-shadow">
  {/* ... */}
</Card>
```

## 📚 참고 자료

- [Tailwind CSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
- [Class Variance Authority](https://cva.style/)

## 🎨 Tailwind CSS 디자인 토큰 (필수 사용)

프로젝트 전체에서 **반드시 사용해야 하는** Tailwind CSS 커스텀 클래스입니다.

### 색상 시스템

```tsx
// 텍스트 색상
text-foreground         // 기본 텍스트 (검은색/흰색)
text-muted-foreground   // 보조 텍스트 (회색)
text-primary            // 강조 텍스트 (파란색)
text-primary-foreground // Primary 배경 위의 텍스트 (흰색)
text-secondary          // 보조 강조
text-destructive        // 위험/삭제 (빨간색)

// 배경 색상
bg-background           // 기본 배경 (흰색/검은색)
bg-muted                // 비활성화/보조 배경 (회색)
bg-primary              // 메인 버튼/강조 배경 (파란색)
bg-secondary            // 보조 버튼 배경
bg-destructive          // 삭제 버튼 배경 (빨간색)

// 테두리 색상
border-border           // 기본 테두리 (회색)
border-primary          // 강조 테두리 (파란색)
```

### 필수 CSS 클래스 패턴

#### 1. Input / Textarea / Select 필드

```tsx
// ✅ 올바른 예시
<input
  type="text"
  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
/>

<textarea
  className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground resize-none"
  rows={4}
/>

<select
  className="w-full border border-border rounded-lg px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
>
  <option value="">선택하세요</option>
</select>

// ❌ 잘못된 예시 (사용 금지)
<input className="border border-gray-300 focus:ring-blue-500" />
<textarea className="border-gray-200 focus:border-blue-600" />
```

#### 2. 버튼

```tsx
// Primary 버튼 (메인 액션)
<button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
  저장
</button>

// Secondary 버튼 (보조 액션)
<button className="px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
  취소
</button>

// Destructive 버튼 (삭제 등 위험한 작업)
<button className="bg-destructive text-destructive-foreground px-4 py-2.5 rounded-lg hover:bg-destructive/90 transition-colors font-medium">
  삭제
</button>

// ❌ 잘못된 예시 (사용 금지)
<button className="bg-blue-600 text-white hover:bg-blue-700">저장</button>
<button className="bg-red-500 text-white">삭제</button>
```

#### 3. 라벨

```tsx
// ✅ 올바른 예시
<label className="block text-sm font-medium text-foreground mb-2">
  이름
</label>

// ❌ 잘못된 예시
<label className="text-gray-700 font-medium">이름</label>
```

#### 4. 카드 / 섹션 구분선

```tsx
// ✅ 올바른 예시
<div className="border-t border-border pt-6">
  {/* 섹션 내용 */}
</div>

// ❌ 잘못된 예시
<div className="border-t border-gray-200 pt-6">
```

#### 5. 제목

```tsx
// ✅ 올바른 예시
<h3 className="text-lg font-semibold text-foreground mb-4">
  BS 활동 입력
</h3>

// ❌ 잘못된 예시
<h3 className="text-lg font-semibold text-gray-900 mb-4">
```

### 실제 적용 예시

```tsx
// BSActivityJournal.tsx 예시
function ActivityForm() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
      {/* 교육 과정 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          교육 과정
        </label>
        <select className="w-full border border-border rounded-lg px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground">
          <option value="">교육 과정을 선택하세요</option>
        </select>
      </div>

      {/* 사진 업로드 버튼 */}
      <button className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center font-medium shadow-sm">
        <CameraIcon className="w-5 h-5 mr-2" />
        사진 촬영/업로드
      </button>

      {/* BS 교육생 정보 섹션 */}
      <div className="border-t border-border pt-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">BS 교육생 회복</h3>

        <input
          type="text"
          placeholder="사번을 입력하세요"
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted disabled:text-muted-foreground"
        />
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-end space-x-3">
        <button className="px-6 py-2.5 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
          임시 저장
        </button>
        <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center font-medium shadow-sm">
          제출하기
        </button>
      </div>
    </div>
  );
}
```

### 🚨 중요 규칙

1. **절대 사용 금지**: `gray-*`, `blue-*`, `red-*`, `green-*` 등의 직접적인 색상 클래스
2. **필수 사용**: `foreground`, `background`, `muted`, `primary`, `border` 등의 디자인 토큰
3. **일관성 유지**: 모든 새 컴포넌트는 위 패턴을 **반드시** 따를 것
4. **Focus 상태**: `focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`
5. **Disabled 상태**: `disabled:bg-muted disabled:text-muted-foreground`

## 🎯 체크리스트

새로운 페이지/컴포넌트를 만들 때:
- [ ] 모든 input/textarea/select에 디자인 토큰 클래스 적용
- [ ] 모든 버튼에 표준 버튼 스타일 적용 (primary/secondary/destructive)
- [ ] 모든 label에 `text-foreground` 사용
- [ ] 모든 border에 `border-border` 사용
- [ ] 모든 제목(heading)에 `text-foreground` 사용
- [ ] gray-*, blue-* 등 직접 색상 클래스 사용하지 않음
- [ ] `Card` 컴포넌트로 콘텐츠 그룹화
- [ ] `FilterGroup`으로 검색/필터 구현
- [ ] `Badge`로 상태 표시
- [ ] 일관된 간격(spacing) 사용

## 🚀 다음 단계

1. 모든 기존 페이지에 디자인 토큰 적용 (진행 중)
2. 공통 컴포넌트 라이브러리 확장
3. 추가 컴포넌트 개발 (Modal, Toast, Dropdown 등)
4. 다크 모드 지원
5. 애니메이션 추가
