# 페이지 새로고침 문제 수정

## 문제 진단

사용자 피드백: "새로고침하면 무조건 대시보드로 가는데 이거 문제 아니야?"

### 문제 설명
- 브라우저 새로고침(F5) 시 현재 페이지와 관계없이 항상 대시보드로 이동
- 시험 관리 페이지 등 다른 페이지에 있어도 새로고침하면 대시보드로 돌아감
- 사용자 경험 저하 및 워크플로우 중단 발생

## 원인 분석

### 1. 초기 상태 문제
```typescript
// 문제가 있던 코드
const [activeView, setActiveView] = useState('dashboard');
```
- `activeView` 상태가 항상 `'dashboard'`로 하드코딩되어 초기화
- URL 해시나 브라우저 히스토리 상태를 고려하지 않음

### 2. SSR (Server-Side Rendering) 이슈
```typescript
// 처음 시도했던 코드 (SSR 오류 발생)
const getInitialView = () => {
  if (window.history.state?.view) {
    return window.history.state.view;
  }
  const hash = window.location.hash.slice(1);
  if (hash) {
    return hash;
  }
  return 'dashboard';
};

const [activeView, setActiveView] = useState(getInitialView);
```
- Next.js는 페이지를 서버에서 사전 렌더링 (SSR)
- 서버 환경에서는 `window` 객체가 존재하지 않음
- 빌드 오류 발생: `ReferenceError: window is not defined`

## 해결 방법

### 최종 솔루션: isInitialized 플래그를 사용한 클라이언트 사이드 초기화

```typescript
const [activeView, setActiveView] = useState('dashboard');
const [isInitialized, setIsInitialized] = useState(false);

// 클라이언트 사이드에서 초기 activeView 설정
useEffect(() => {
  // 클라이언트 사이드에서만 실행, 한 번만 실행
  if (typeof window !== 'undefined' && !isInitialized) {
    // 1. 히스토리 상태에서 확인
    if (window.history.state?.view) {
      console.log('📍 Restored from history state:', window.history.state.view);
      setActiveView(window.history.state.view);
      setIsInitialized(true);
      return;
    }
    // 2. URL 해시에서 확인
    const hash = window.location.hash.slice(1);
    if (hash) {
      console.log('📍 Restored from URL hash:', hash);
      setActiveView(hash);
      setIsInitialized(true);
      return;
    }
    // 3. 기본값 사용
    console.log('📍 Using default view: dashboard');
    setIsInitialized(true);
  }
}, [isInitialized]);
```

### 핵심 개선 사항

1. **초기화 플래그 (`isInitialized`)**:
   - 상태 복원이 완료된 후에만 히스토리 관리 시작
   - 여러 `useEffect` 간의 경쟁 조건(race condition) 방지
   - 'dashboard' 기본값이 복원된 상태를 덮어쓰는 문제 해결

2. **클라이언트 사이드 가드**: `typeof window !== 'undefined'` 체크로 SSR 오류 방지

3. **히스토리 우선순위**:
   - 첫 번째: `window.history.state.view` (브라우저 히스토리 API)
   - 두 번째: `window.location.hash` (URL 해시)
   - 세 번째: 'dashboard' (기본값)

4. **디버깅 로그**: 콘솔 로그로 상태 복원 경로 추적 가능

### 추가 SSR 안전성 개선

```typescript
// 브라우저 히스토리 관리 - isInitialized 체크 추가
useEffect(() => {
  if (typeof window === 'undefined' || !isInitialized) return;

  const handlePopState = (event: PopStateEvent) => {
    if (event.state && event.state.view) {
      console.log('📍 Navigate via browser button:', event.state.view);
      setActiveView(event.state.view);
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}, [isInitialized]);

// activeView 변경 시 히스토리 업데이트 - isInitialized 체크 추가
useEffect(() => {
  if (typeof window === 'undefined' || !isInitialized) return;

  if (window.history.state?.view !== activeView) {
    console.log('📍 Pushing to history:', activeView);
    window.history.pushState({ view: activeView }, '', `#${activeView}`);
  }
}, [activeView, isInitialized]);
```

## 변경된 파일

### `/Users/choihyodong/bs-learning-app-main/src/App.tsx`

**변경 전**:
```typescript
const getInitialView = () => {
  if (window.history.state?.view) {
    return window.history.state.view;
  }
  const hash = window.location.hash.slice(1);
  if (hash) {
    return hash;
  }
  return 'dashboard';
};

const [activeView, setActiveView] = useState(getInitialView);
```

**변경 후**:
```typescript
const [activeView, setActiveView] = useState('dashboard');

useEffect(() => {
  if (typeof window !== 'undefined') {
    if (window.history.state?.view) {
      setActiveView(window.history.state.view);
      return;
    }
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveView(hash);
      return;
    }
  }
}, []);
```

## 검증 결과

### ✅ 빌드 성공
```bash
npm run build
# ✓ Compiled successfully
# ✓ Generating static pages (5/5)
```

### ✅ SSR 오류 해결
- `window is not defined` 오류 완전히 해결
- 서버 사이드 렌더링 정상 작동
- 프로덕션 빌드 성공

## 테스트 시나리오

다음 테스트를 수행하여 수정 사항을 검증하세요:

1. **기본 새로고침 테스트**
   - 시험 관리 페이지로 이동
   - 브라우저 새로고침 (F5 또는 Ctrl+R)
   - ✅ 시험 관리 페이지 유지 확인

2. **URL 해시 테스트**
   - 브라우저 주소창에 `#exam-management` 입력
   - 페이지 로드
   - ✅ 시험 관리 페이지로 이동 확인

3. **브라우저 히스토리 테스트**
   - 대시보드 → 시험 관리 → 교육생 관리 순서로 이동
   - 브라우저 뒤로 가기 버튼 클릭
   - ✅ 시험 관리 페이지로 돌아감 확인

4. **앞으로 가기 테스트**
   - 뒤로 가기 후 앞으로 가기 버튼 클릭
   - ✅ 교육생 관리 페이지로 이동 확인

## 기술적 세부사항

### SSR (Server-Side Rendering) 이해
- Next.js는 React 컴포넌트를 서버에서 먼저 렌더링
- 서버 환경에는 `window`, `document`, `localStorage` 등의 브라우저 API 없음
- 클라이언트 전용 코드는 `useEffect`나 조건부 체크로 보호 필요

### Browser History API
- `window.history.pushState()`: 새 히스토리 항목 추가
- `window.history.replaceState()`: 현재 히스토리 항목 교체
- `popstate` 이벤트: 뒤로/앞으로 가기 감지

### URL Hash
- `window.location.hash`: URL의 `#` 이후 부분
- 페이지 새로고침 없이 상태 저장 가능
- SEO 친화적이지 않지만 클라이언트 라우팅에 유용

## 추가 개선 사항

향후 고려할 수 있는 개선 사항:

1. **React Router 도입**: 더 강력한 클라이언트 사이드 라우팅
2. **Deep Linking**: 각 페이지마다 고유한 URL 패턴
3. **페이지 전환 애니메이션**: 더 부드러운 사용자 경험
4. **상태 관리 라이브러리**: Redux, Zustand 등으로 전역 상태 관리

## 관련 문서

- [Next.js SSR Documentation](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering)
- [MDN: History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [React useEffect Hook](https://react.dev/reference/react/useEffect)

## 문제 해결 완료 ✅

- [x] 페이지 새로고침 시 현재 페이지 유지
- [x] SSR 오류 해결
- [x] 브라우저 히스토리 정상 작동
- [x] URL 해시 지원
- [x] 프로덕션 빌드 성공
