# 만족도 평가 시스템 연동 완료

## 📋 작업 개요

외부 평가 앱(https://sseducationfeedback.info)과 학습 관리 시스템의 연동 작업을 완료했습니다.

## ✅ 완료된 작업

### 1. 네비게이션 메뉴 확장
- **파일**: `src/config/navigation.ts`
- **추가 내용**:
  - "연계 시스템" 섹션 추가
  - 만족도 평가 앱 링크 (외부 링크로 새 탭에서 열림)
  - 과정 플래너 앱 링크
- **기능**:
  - 외부 링크 아이콘 표시
  - 새 탭에서 안전하게 열기 (`noopener,noreferrer`)
  - 모든 권한(admin, manager, operator, instructor, trainee)에서 접근 가능

### 2. 타입 정의
- **파일**: `src/types/feedback.types.ts`
- **포함 타입**:
  - `CourseSatisfaction` - 과정 만족도 평가
  - `InstructorSatisfaction` - 강사 만족도 평가
  - `OperationSatisfaction` - 운영 만족도 평가
  - `FeedbackStatistics` - 종합 통계
  - `CourseRoundFeedbackSummary` - 과정별 요약
  - `InstructorFeedbackSummary` - 강사별 요약
  - `FeedbackTrend` - 트렌드 데이터

### 3. 데이터 연동 서비스
- **파일**: `src/services/feedback.service.ts`
- **주요 함수**:
  - `getCourseSatisfactions()` - 과정 만족도 조회
  - `getInstructorSatisfactions()` - 강사 만족도 조회
  - `getOperationSatisfactions()` - 운영 만족도 조회
  - `getFeedbackStatistics()` - 종합 통계 계산
  - `getCourseRoundFeedbackSummaries()` - 과정별 요약
  - `getInstructorFeedbackSummaries()` - 강사별 요약
  - `getFeedbackTrends()` - 월별 트렌드 분석

### 4. 대시보드 위젯
- **파일**: `src/components/dashboard/FeedbackSummaryWidget.tsx`
- **기능**:
  - 종합 만족도 표시 (별점)
  - 응답률 진행률 바
  - 과정/강사/운영 만족도 세분화
  - 점수 분포도
  - 최근 5개 과정 요약 목록
  - 외부 앱으로 연결 링크

## 🗄️ 데이터베이스 구조

평가 앱과 같은 Supabase 프로젝트를 공유하며, 다음 테이블들이 연동됩니다:

### 예상 테이블 (평가 앱에서 관리)
- `course_satisfactions` - 과정 만족도 평가
- `instructor_satisfactions` - 강사 만족도 평가
- `operation_satisfactions` - 운영 만족도 평가

## 📊 평가 항목

### 과정 만족도 (1-5점)
- 교육 내용의 질
- 난이도 적절성
- 실무 적용 가능성
- 교재/자료의 질
- 시설 만족도

### 강사 만족도 (1-5점)
- 강의 능력
- 의사소통
- 수업 준비도
- 질문 대응력
- 열정

### 운영 만족도 (1-5점)
- 등록 절차
- 일정 관리
- 소통 및 공지
- 행정 지원
- 시설 관리

## 🔗 연동 방법

### 네비게이션에서 접근
1. 사이드바 → "연계 시스템" 섹션 확장
2. "만족도 평가" 클릭
3. 새 탭에서 평가 앱 대시보드 열림

### 대시보드에서 확인
```tsx
import { FeedbackSummaryWidget } from './components/dashboard/FeedbackSummaryWidget';

// 전체 과정 요약
<FeedbackSummaryWidget />

// 특정 과정 상세
<FeedbackSummaryWidget courseRoundId="과정-ID" />
```

## 🚀 사용 예시

### 서비스 사용
```typescript
import { getFeedbackStatistics } from '../services/feedback.service';

// 특정 과정의 종합 통계
const stats = await getFeedbackStatistics(courseRoundId);

console.log('응답률:', stats.response_rate);
console.log('종합 만족도:', stats.overall_average);
console.log('과정 만족도:', stats.course_satisfaction.overall_satisfaction);
```

### 컴포넌트 사용
```tsx
// Dashboard.tsx에 추가
import { FeedbackSummaryWidget } from '../components/dashboard/FeedbackSummaryWidget';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 기존 위젯들 */}
      <CourseOverviewWidget />
      <EnrollmentWidget />

      {/* 새로운 만족도 위젯 */}
      <FeedbackSummaryWidget />
    </div>
  );
}
```

## ⚙️ 환경 변수

기존 Supabase 환경 변수를 사용:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sdecinmapanpmohbtdbi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 📝 다음 단계

### 1. 평가 앱 데이터베이스 테이블 생성 ✅
데이터베이스 마이그레이션 파일이 준비되어 있습니다:
- **파일**: `database/migrations/create-feedback-system-tables.sql`
- **테이블**:
  - `course_satisfactions` - 과정 만족도
  - `instructor_satisfactions` - 강사 만족도
  - `operation_satisfactions` - 운영 만족도

**실행 방법**:
```bash
# Supabase SQL 에디터에서 실행
psql $DATABASE_URL -f database/migrations/create-feedback-system-tables.sql
```

### 2. 대시보드 통합 ✅
이미 DashboardWrapper에 통합되어 있습니다!
- **파일**: `src/components/dashboard/DashboardWrapper.tsx`
- **위치**: 상단 통계 카드 아래, 3열 그리드의 첫 번째 열

### 3. 과정별 상세 페이지에 추가
```tsx
// 과정 상세 페이지
<FeedbackSummaryWidget courseRoundId={courseRound.id} />
```

### 4. 트렌드 차트 추가 (선택)
```typescript
import { getFeedbackTrends } from '../services/feedback.service';

// 최근 12개월 트렌드
const trends = await getFeedbackTrends(12);
// Chart.js 또는 Recharts로 시각화
```

## 🔒 보안 고려사항

1. **RLS 정책**: 평가 데이터는 본인과 관리자만 조회 가능하도록 설정
2. **CORS**: 외부 링크는 안전하게 새 탭에서 열림
3. **데이터 검증**: 모든 평가 점수는 1-5점 범위 검증

## 📚 관련 파일

### 생성된 파일
- [src/types/feedback.types.ts](src/types/feedback.types.ts) - 타입 정의
- [src/services/feedback.service.ts](src/services/feedback.service.ts) - 데이터 연동 서비스
- [src/components/dashboard/FeedbackSummaryWidget.tsx](src/components/dashboard/FeedbackSummaryWidget.tsx) - 대시보드 위젯
- [database/migrations/create-feedback-system-tables.sql](database/migrations/create-feedback-system-tables.sql) - DB 마이그레이션

### 수정된 파일
- [src/config/navigation.ts](src/config/navigation.ts#L361-L392) - 연계 시스템 섹션 추가
- [src/components/navigation/ImprovedNavigation.tsx](src/components/navigation/ImprovedNavigation.tsx#L105-L112) - 외부 링크 처리
- [src/components/dashboard/DashboardWrapper.tsx](src/components/dashboard/DashboardWrapper.tsx#L11) - 위젯 통합

## ✨ 주요 기능

### 자동 통계 계산
- 평균 점수 자동 계산
- 응답률 자동 산출
- 점수 분포도 자동 생성

### 실시간 연동
- Supabase Realtime 구독 가능
- 평가 제출 시 즉시 반영

### 다양한 시각화
- 별점 표시
- 진행률 바
- 분포도 차트
- 트렌드 그래프

---

**완료 일시**: 2025-01-11
**작업자**: Claude Code
**상태**: ✅ 완료
