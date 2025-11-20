# 버튼 디자인 시스템

BS 학습 관리 시스템의 통일된 버튼 스타일 가이드입니다.

## 🎨 커스텀 버튼 클래스

### 기본 구조
모든 버튼은 `btn-base` 클래스를 기본으로 사용하고, 크기와 스타일을 조합합니다.

```html
<button className="btn-base btn-lg btn-primary">버튼</button>
```

## 📏 크기 (Size)

### `btn-base` (기본 크기)
- 패딩: `px-4 py-2`
- 사용처: 일반적인 버튼

### `btn-lg` (큰 크기)
- 패딩: `px-5 py-2.5`
- 사용처: 헤더, 주요 액션 버튼

### `btn-sm` (작은 크기)
- 패딩: `px-3 py-1.5`
- 텍스트: `text-sm`
- 사용처: 테이블 액션, 인라인 버튼

## 🎨 색상 스타일 (Color Variants)

### Primary (파랑)
```html
<button className="btn-base btn-primary">상세보기</button>
```
- 배경: `bg-blue-600`
- Hover: `hover:bg-blue-700`
- Active: `active:bg-blue-800`
- 용도: 주요 액션, 조회

### Secondary (회색)
```html
<button className="btn-base btn-secondary">수정</button>
```
- 배경: `bg-gray-600`
- Hover: `hover:bg-gray-700`
- Active: `active:bg-gray-800`
- 용도: 보조 액션, 수정

### Success (초록)
```html
<button className="btn-base btn-success">일괄 불러오기</button>
```
- 배경: `bg-emerald-600`
- Hover: `hover:bg-emerald-700`
- Active: `active:bg-emerald-800`
- 용도: 생성, 성공, 추가

### Danger (빨강)
```html
<button className="btn-base btn-danger">
  <TrashIcon className="h-4 w-4" />
</button>
```
- 배경: `bg-red-600`
- Hover: `hover:bg-red-700`
- Active: `active:bg-red-800`
- 용도: 삭제, 위험한 액션

### Warning (노랑)
```html
<button className="btn-base btn-warning">경고</button>
```
- 배경: `bg-yellow-500`
- Hover: `hover:bg-yellow-600`
- Active: `active:bg-yellow-700`
- 용도: 경고, 주의 필요

### Dark (다크)
```html
<button className="btn-base btn-dark">사용자 추가</button>
```
- 배경: `bg-slate-800`
- Hover: `hover:bg-slate-900`
- Active: `active:bg-slate-950`
- 용도: 중요한 생성 액션

### Outline (아웃라인)
```html
<button className="btn-base btn-outline">엑셀 내보내기</button>
```
- 배경: `bg-white`
- 테두리: `border border-gray-300`
- Hover: `hover:bg-gray-50`
- Active: `active:bg-gray-100`
- 용도: 보조 액션, 내보내기

## 🔧 공통 속성

모든 버튼 클래스는 다음 속성을 포함합니다:
- `rounded-full`: 캡슐 모양
- `font-medium`: 적절한 글꼴 굵기
- `shadow-sm`: 부드러운 그림자
- `transition-colors duration-200`: 부드러운 색상 전환
- `flex items-center gap-2`: 아이콘과 텍스트 정렬

## 📋 사용 예제

### 헤더 액션 버튼
```tsx
<div className="flex items-center space-x-3">
  <button className="btn-base btn-lg btn-success">
    <ArrowUpTrayIcon className="h-4 w-4" />
    일괄 불러오기
  </button>
  <button className="btn-base btn-lg btn-dark">
    <PlusIcon className="h-5 w-5" />
    사용자 추가
  </button>
</div>
```

### 테이블 액션 버튼
```tsx
<div className="flex items-center space-x-2">
  <button className="btn-base btn-sm btn-primary">
    상세보기
  </button>
  <button className="btn-base btn-sm btn-secondary">
    수정
  </button>
  <button className="btn-base btn-sm btn-danger">
    <TrashIcon className="h-4 w-4" />
  </button>
</div>
```

### 아이콘 전용 버튼
```tsx
<button
  className="btn-base btn-sm btn-danger"
  title="삭제"
>
  <TrashIcon className="h-4 w-4" />
</button>
```

## 🎯 사용 지침

1. **일관성 유지**: 같은 용도의 버튼은 항상 같은 스타일 사용
2. **크기 선택**:
   - 헤더/주요 액션: `btn-lg`
   - 테이블/인라인: `btn-sm`
   - 기타: `btn-base`
3. **색상 선택**:
   - 조회/확인: `btn-primary`
   - 수정: `btn-secondary`
   - 생성/추가: `btn-success` 또는 `btn-dark`
   - 삭제: `btn-danger`
   - 내보내기/보조: `btn-outline`
4. **아이콘**: 항상 Heroicons 사용, 크기는 `h-4 w-4` 또는 `h-5 w-5`

## 📦 Tailwind Config

버튼 스타일은 [tailwind.config.js](tailwind.config.js)의 `plugins` 섹션에 정의되어 있습니다.

```javascript
const buttonComponents = {
  '.btn-base': {
    '@apply px-4 py-2 rounded-full font-medium shadow-sm transition-colors duration-200 flex items-center gap-2': {},
  },
  '.btn-lg': {
    '@apply px-5 py-2.5': {},
  },
  // ... 기타 스타일
}
```

## 🔄 업데이트 방법

1. [tailwind.config.js](tailwind.config.js) 수정
2. 개발 서버 재시작 (변경사항 자동 반영)
3. 이 문서 업데이트

## ✅ 적용된 컴포넌트

- ✅ [UserManagement.tsx](src/components/users/UserManagement.tsx)
- 🔄 다른 컴포넌트 작업 진행 중...
