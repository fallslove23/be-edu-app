# 🎨 Handoff to Google Antigravity - Design Tasks

## 📋 최근 작업 요약 (Claude Code)

### 완료된 기능 개발
1. ✅ 모바일 네비게이션 텍스트 크기 개선
2. ✅ 시스템 관리 페이지 카드 형태 변경 (캡슐형 → 둥근 사각형)
3. ✅ 분석/보고서 탭 메뉴 모바일 최적화
4. ✅ 분석/보고서 페이지 공간 최적화 (중복 제거)
5. ✅ 모바일 가로 스크롤 시스템 구현

---

## 🎯 디자인 수정이 필요한 파일들

### 1. 모바일 하단 네비게이션
**파일**: `src/components/navigation/MobileBottomNav.tsx`

**현재 상태**:
- 텍스트: `text-xs` (12px)
- 아이콘: `w-6 h-6` (24px)
- 패딩: `py-3`, `p-2.5`, `mb-1.5`

**디자인 조정 포인트**:
- 아이콘 색상 조정
- 활성 상태 배경색 (`bg-primary/10`)
- 애니메이션 효과 (`animate-pulse`)
- 간격 및 여백

---

### 2. 대시보드 빠른 작업 카드
**파일**: `src/components/dashboard/DashboardWrapper.tsx` (Line 31-87)

**현재 구조**:
```tsx
<div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2
                sm:overflow-x-visible sm:pb-0 snap-x snap-mandatory">
  <button className="... min-w-[160px] sm:min-w-0 snap-start flex-shrink-0">
```

**디자인 조정 포인트**:
- 카드 크기 (`min-w-[160px]`) 조정
- 카드 배경색 및 호버 효과
- 아이콘 컨테이너 스타일 (`bg-primary rounded-lg`)
- 그림자 및 border 효과
- 스크롤바 스타일

---

### 3. 대시보드 통계 카드
**파일**: `src/components/dashboard/EnhancedDashboard.tsx` (Line 335-369)

**현재 구조**:
```tsx
<StaggerContainer className="flex gap-4 overflow-x-auto pb-2 md:grid
                             md:grid-cols-2 lg:grid-cols-4 md:overflow-x-visible
                             md:pb-0 snap-x snap-mandatory">
  <div className="... min-w-[280px] md:min-w-0 snap-start flex-shrink-0">
```

**디자인 조정 포인트**:
- 카드 최소 너비 (`min-w-[280px]`) 조정
- 카드 배경 (`bg-white rounded-2xl`)
- 트렌드 배지 색상 (`bg-green-50`, `bg-red-50`)
- 아이콘 배경 (`bg-indigo-50 text-indigo-600`)
- 스크롤 스냅 포인트 조정

---

### 4. 분석/보고서 페이지 헤더
**파일**: `src/components/analytics/IntegratedAnalyticsManagement.tsx` (Line 107-138)

**현재 구조**:
```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
```

**디자인 조정 포인트**:
- 헤더 패딩 (`p-4 sm:p-6`)
- 제목 크기 (`text-xl sm:text-2xl`)
- 필터 버튼 스타일 (`btn-primary`)
- 간격 조정 (`gap-3`)

---

### 5. 분석/보고서 탭 네비게이션
**파일**: `src/components/analytics/IntegratedAnalyticsManagement.tsx` (Line 140-164)

**현재 구조**:
```tsx
<div className="border-b border-gray-200 overflow-x-auto">
  <nav className="flex px-4 sm:px-6">
    <button className="... text-xs sm:text-sm whitespace-nowrap">
```

**디자인 조정 포인트**:
- 탭 패딩 (`py-3 sm:py-4 px-3 sm:px-4`)
- 활성 탭 색상 (`border-blue-500 text-blue-600`)
- 아이콘 크기 (`h-4 w-4 sm:h-5 sm:w-5`)
- 호버 효과

---

### 6. 성과 추적 탭 메뉴
**파일**: `src/components/performance/PerformanceTracking.tsx` (Line 240-325)

**현재 구조**:
```tsx
<div className="border-b border-gray-200 overflow-x-auto">
  <nav className="-mb-px flex">
    <button className="px-4 sm:px-6 py-3 ... min-w-[120px]">
```

**디자인 조정 포인트**:
- 탭 최소 너비 (`min-w-[120px]`)
- 텍스트 크기 (`text-xs sm:text-sm`)
- 활성 탭 border (`border-gray-600`)
- 아이콘-텍스트 간격 (`mr-1.5 sm:mr-2`)

---

### 7. 시스템 관리 페이지
**파일**: `src/components/admin/SystemMonitor.tsx`

**변경 사항**: 모든 `rounded-full` → `rounded-lg` 변경 완료
- Line 373: 모니터 버튼
- Line 457: 상태 배지
- Line 473: 진행률 바
- Line 514: 알림 아이콘 컨테이너

**디자인 조정 포인트**:
- `rounded-lg` 반경 조정 원할 경우
- 버튼 색상 및 그림자
- 배지 스타일

---

## 🎨 전역 CSS 스타일
**파일**: `src/index.css` (Line 284-306)

**새로 추가된 모바일 스크롤 스타일**:
```css
@media (max-width: 768px) {
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  }

  .snap-x {
    scroll-padding: 1rem;
  }
}
```

**디자인 조정 포인트**:
- 스크롤바 색상 (`scrollbar-color`)
- 스냅 패딩 (`scroll-padding`)
- 스크롤 애니메이션

---

## 🔧 주요 Tailwind 클래스

### 가로 스크롤 시스템
- `overflow-x-auto`: 가로 스크롤 활성화
- `snap-x snap-mandatory`: 스냅 스크롤
- `snap-start`: 스냅 포인트
- `flex-shrink-0`: 축소 방지
- `min-w-[Npx]`: 최소 너비
- `pb-2`: 스크롤바 공간 (모바일)

### 반응형 패턴
- `sm:grid sm:grid-cols-2`: 태블릿 이상 그리드
- `sm:overflow-x-visible`: 태블릿 이상 스크롤 숨김
- `sm:min-w-0`: 태블릿 이상 최소 너비 제거

---

## 📝 작업 가이드

### 1. 색상 조정
모든 색상 값은 Tailwind CSS 기준:
- Primary: `bg-primary`, `text-primary`
- Border: `border-border`, `border-gray-200`
- Background: `bg-card`, `bg-white`

### 2. 간격 조정
- 패딩: `p-{n}`, `px-{n}`, `py-{n}`
- 마진: `m-{n}`, `mx-{n}`, `my-{n}`
- 갭: `gap-{n}`, `space-x-{n}`, `space-y-{n}`

### 3. 크기 조정
- 텍스트: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- 아이콘: `w-{n} h-{n}` (예: `w-4 h-4`, `w-6 h-6`)
- 최소 너비: `min-w-[{n}px]` (예: `min-w-[160px]`)

### 4. 반응형 조정
- `sm:`: ≥640px (모바일 landscape, 태블릿)
- `md:`: ≥768px (태블릿)
- `lg:`: ≥1024px (데스크톱)

---

## ⚠️ 주의사항

### 변경하지 말아야 할 것
- ❌ 기능 로직 (onClick, useState 등)
- ❌ 데이터 구조 (props, interfaces)
- ❌ 컴포넌트 구조 (JSX 계층)
- ❌ 라우팅 및 네비게이션 로직

### 자유롭게 변경해도 되는 것
- ✅ 색상 (color, background, border)
- ✅ 크기 (width, height, padding, margin)
- ✅ 폰트 (size, weight, family)
- ✅ 애니메이션 (transition, animation)
- ✅ 그림자 (shadow)
- ✅ 둥근 모서리 (rounded)
- ✅ 호버 효과 (hover:)

---

## 🚀 배포 프로세스

### 디자인 수정 후 배포
```bash
# 변경사항 확인
git status

# 스크립트로 배포 (커밋 + 푸시 + Vercel)
./deploy.sh "디자인 수정 내용 설명"
```

---

## 📞 역할 분담

### Claude Code (전반적 코딩)
- 새 기능 구현
- 비즈니스 로직
- API 연동
- 상태 관리
- 컴포넌트 구조

### Google Antigravity (디자인 수정)
- UI/UX 개선
- 스타일링
- 반응형 조정
- 색상/폰트/간격
- 애니메이션
- 모바일 최적화

---

## 📍 현재 상태

### 최근 배포 URL
https://bs-learning-app-main-cz2ti16cn-ss-educations-projects.vercel.app

### Git 브랜치
- `main` (프로덕션)

### 개발 서버
```bash
npm run dev
# http://localhost:3000
```

---

## 🎯 우선순위 디자인 작업

1. **모바일 가로 스크롤 카드 스타일링**
   - 스크롤바 디자인 개선
   - 카드 간격 및 크기 미세 조정
   - 스냅 효과 부드럽게

2. **통계 카드 시각적 개선**
   - 아이콘 배경색 조정
   - 트렌드 배지 색상 통일
   - 그림자 효과 개선

3. **탭 메뉴 일관성**
   - 모든 탭 메뉴 스타일 통일
   - 활성/비활성 상태 명확히
   - 호버 효과 부드럽게

---

## 💡 팁

### Tailwind CSS 빠른 참조
- [Tailwind 공식 문서](https://tailwindcss.com/docs)
- 프로젝트 내 `tailwind.config.js`에 커스텀 색상 정의됨
- `src/index.css`에 전역 스타일 정의됨

### 개발자 도구 활용
- Chrome DevTools의 모바일 시뮬레이터 사용
- Responsive 모드로 다양한 화면 크기 테스트
- CSS 변경사항 실시간 확인

---

작성일: 2025-12-02
작성자: Claude Code
다음 작업자: Google Antigravity
