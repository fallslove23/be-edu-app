# BS 활동 관리 시스템

BS(Best Salesperson) 활동 관리 시스템은 교육생들의 현장 영업 활동을 체계적으로 기록, 관리, 발표하는 통합 플랫폼입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [주요 기능](#주요-기능)
3. [기술 스택](#기술-스택)
4. [설치 및 설정](#설치-및-설정)
5. [데이터베이스 스키마](#데이터베이스-스키마)
6. [컴포넌트 구조](#컴포넌트-구조)
7. [사용 가이드](#사용-가이드)

---

## 🎯 시스템 개요

### 핵심 목표
- 📱 **모바일 우선**: 현장에서 즉시 활동 기록
- 📊 **실시간 관리**: 강사가 교육생 활동 모니터링 및 피드백
- 🎤 **효과적인 발표**: 발표일에 교육생 개인별 활동 프레젠테이션

### 사용자 역할
- **교육생(Trainee)**: 활동 기록 및 발표
- **강사(Instructor)**: 활동 관리 및 피드백
- **관리자(Manager)**: 전체 통계 및 관리

---

## ✨ 주요 기능

### 1. 모바일 활동 일지 작성 (교육생용)

#### 기능 상세
- **📸 다중 이미지 업로드**
  - 최대 5장까지 업로드 가능
  - 자동 압축 및 썸네일 생성
  - 네이티브 카메라 연동

- **📝 구조화된 양식**
  - 활동 날짜 선택
  - 7가지 카테고리 분류
    - 🆕 신규 방문
    - 🔄 재방문
    - 📝 계약
    - 📊 제안/프레젠테이션
    - 💬 고객 피드백
    - 🤝 네트워킹
    - 📌 기타
  - 제목 및 상세 내용 작성

- **📍 위치 정보**
  - GPS 자동 수집
  - 주소 역지오코딩

- **💾 임시 저장 & 제출**
  - 작성 중 임시 저장
  - 완료 후 제출

#### 사용 예시
```typescript
import { BSActivityForm } from '@/components/bs-activities';

<BSActivityForm
  courseId="course-123"
  onSuccess={() => console.log('제출 완료')}
  onCancel={() => console.log('취소')}
/>
```

---

### 2. 활동 일지 관리 대시보드 (강사/관리자용)

#### 기능 상세

**📊 실시간 통계**
- 전체 활동 건수
- 제출 완료/임시저장 현황
- 평균 평가 점수
- 우수 사례 수
- 카테고리별 활동 분포

**🔍 필터링 & 검색**
- 교육생별 필터
- 카테고리별 필터
- 날짜 범위 필터
- 제출 상태 필터
- 키워드 검색 (제목, 내용)

**👁️ 활동 상세 보기**
- 이미지 갤러리
- 활동 내용 전문
- 위치 정보 (지도)
- 제출 이력

**✍️ 피드백 시스템**
- 1-5점 평가
- 코멘트 작성
- 우수 사례 마킹

#### 사용 예시
```typescript
import { BSActivityDashboard } from '@/components/bs-activities';

<BSActivityDashboard courseId="course-123" />
```

---

### 3. 개인별 발표 모드 (발표일 사용)

#### 기능 상세

**🎬 프레젠테이션 인터페이스**
- 전체화면 슬라이드 쇼
- 교육생별 순차 발표
- 이미지 중심 시각화

**📋 발표 순서 관리**
- 강사가 발표 순서 설정
- 현재 발표자 표시
- 다음 발표자 대기 알림

**📝 발표 노트**
- 활동 내용 요약
- 강사 피드백 표시
- 주요 성과 하이라이트

**⌨️ 키보드 단축키**
- `← →` : 이미지 이동
- `↑ ↓` : 활동 이동
- `[ ]` : 발표자 이동
- `F` : 전체화면 토글
- `ESC` : 발표 모드 종료

#### 사용 예시
```typescript
import { BSPresentationMode } from '@/components/bs-activities';

<BSPresentationMode
  courseId="course-123"
  presentationDate="2024-08-15"
  onClose={() => console.log('발표 종료')}
/>
```

---

## 🛠 기술 스택

### Frontend
- **React 19.1.1** - UI 프레임워크
- **Next.js 15.5.4** - 서버 사이드 렌더링
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Heroicons** - 아이콘

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL 데이터베이스
  - Realtime subscriptions
  - Storage (이미지)
  - Row Level Security (RLS)

### 주요 라이브러리
- **@supabase/supabase-js** - Supabase 클라이언트
- **react-hot-toast** - 토스트 알림

---

## 📦 설치 및 설정

### 1. 데이터베이스 스키마 생성

Supabase SQL Editor에서 다음 파일 실행:

```bash
database/bs-activities-schema.sql
```

### 2. 스토리지 버킷 생성

Supabase Dashboard에서:

1. **Storage** 메뉴 이동
2. **New Bucket** 클릭
3. 버킷 설정:
   - Name: `bs-activity-images`
   - Public: `false` (RLS 사용)
   - File size limit: `5MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

### 3. 환경 변수 설정

`.env.local` 파일에 Supabase 설정 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. 의존성 설치

```bash
npm install
```

### 5. 개발 서버 실행

```bash
npm run dev
```

---

## 🗄️ 데이터베이스 스키마

### 1. bs_activities (활동 일지)

```sql
CREATE TABLE bs_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainee_id UUID NOT NULL REFERENCES users(id),
    course_id UUID NOT NULL REFERENCES courses(id),

    -- 활동 정보
    activity_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    -- 미디어
    images JSONB DEFAULT '[]'::jsonb,
    location JSONB,

    -- 상태
    submission_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,

    -- 피드백
    feedback JSONB,
    is_best_practice BOOLEAN DEFAULT false,

    -- 발표
    presentation_order INTEGER,
    presentation_score INTEGER,

    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. bs_activity_deadlines (제출 기한)

```sql
CREATE TABLE bs_activity_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id),
    week_number INTEGER NOT NULL,
    deadline_date DATE NOT NULL,
    required_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(course_id, week_number)
);
```

### 3. bs_presentation_orders (발표 순서)

```sql
CREATE TABLE bs_presentation_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id),
    presentation_date DATE NOT NULL,
    trainee_id UUID NOT NULL REFERENCES users(id),
    order_index INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(course_id, presentation_date, order_index)
);
```

---

## 🏗️ 컴포넌트 구조

```
src/
├── components/
│   └── bs-activities/
│       ├── BSActivityForm.tsx          # 활동 일지 작성 폼
│       ├── BSActivityDashboard.tsx     # 관리 대시보드
│       ├── BSPresentationMode.tsx      # 발표 모드
│       ├── BSActivityManagement.tsx    # 메인 컴포넌트
│       └── index.ts                    # Export
│
├── services/
│   └── bs-activity.service.ts          # API 서비스 레이어
│
├── types/
│   └── bs-activity.types.ts            # TypeScript 타입 정의
│
└── database/
    └── bs-activities-schema.sql        # 데이터베이스 스키마
```

---

## 📚 사용 가이드

### 교육생 워크플로우

1. **활동 기록**
   ```
   로그인 → BS 활동 관리 → 활동 작성 버튼 클릭
   → 사진 촬영 → 내용 작성 → 임시저장 또는 제출
   ```

2. **임시 저장 활동 완성**
   ```
   내 활동 목록 → 임시저장 항목 선택 → 수정 → 제출
   ```

3. **발표 준비**
   ```
   발표 모드 진입 → 본인 차례 대기 → 활동 발표
   ```

### 강사 워크플로우

1. **활동 모니터링**
   ```
   관리 대시보드 → 제출 현황 확인 → 필터/검색
   ```

2. **피드백 작성**
   ```
   활동 선택 → 피드백 버튼 클릭 → 평가 및 코멘트 작성
   ```

3. **우수 사례 선정**
   ```
   활동 상세보기 → ⭐ 버튼 클릭
   ```

4. **발표 순서 설정**
   ```
   발표 관리 → 교육생 순서 배정 → 저장
   ```

5. **발표일 진행**
   ```
   발표 모드 진입 → 교육생별 활동 발표 진행
   ```

---

## 🔐 권한 관리 (RLS)

### 교육생 권한
- ✅ 본인 활동 조회/생성/수정/삭제
- ❌ 타인 활동 접근 불가
- ❌ 피드백 작성 불가

### 강사/관리자 권한
- ✅ 담당 과정의 모든 활동 조회
- ✅ 피드백 작성/수정
- ✅ 우수 사례 마킹
- ✅ 발표 순서 관리
- ❌ 교육생 활동 수정/삭제 불가

---

## 📊 API 사용 예시

### 활동 조회

```typescript
import { BSActivityService } from '@/services/bs-activity.service';

// 전체 활동 조회
const activities = await BSActivityService.getActivities({
  course_id: 'course-123'
});

// 필터링
const filteredActivities = await BSActivityService.getActivities({
  course_id: 'course-123',
  trainee_id: 'user-456',
  category: 'contract',
  submission_status: 'submitted'
});
```

### 활동 생성

```typescript
const newActivity = await BSActivityService.createActivity({
  trainee_id: 'user-456',
  course_id: 'course-123',
  activity_date: '2024-08-15',
  category: 'new_visit',
  title: '○○병원 신규 방문',
  content: '병원장님과 첫 미팅...',
  images: [
    {
      url: 'https://...',
      file_name: 'photo1.jpg',
      file_size: 123456,
      uploaded_at: '2024-08-15T10:00:00Z'
    }
  ],
  submission_status: 'submitted'
});
```

### 피드백 작성

```typescript
await BSActivityService.addFeedback(
  'activity-789',
  '훌륭한 활동입니다. 고객과의 라포 형성이 잘 되었습니다.',
  5,
  'instructor-123',
  '김강사'
);
```

### 이미지 업로드

```typescript
const image = await BSActivityService.uploadImage(
  file,  // File 객체
  'user-456'
);

console.log(image.url); // https://...
```

---

## 🎨 UI 커스터마이징

### 카테고리 추가

`src/types/bs-activity.types.ts`:

```typescript
export type ActivityCategory =
  | 'new_visit'
  | 'follow_up'
  | 'contract'
  | 'presentation'
  | 'feedback'
  | 'networking'
  | 'your_new_category'  // 추가
  | 'other';

export const activityCategoryLabels: Record<ActivityCategory, string> = {
  // ...
  your_new_category: '새 카테고리',
  // ...
};

export const activityCategoryIcons: Record<ActivityCategory, string> = {
  // ...
  your_new_category: '🎯',
  // ...
};
```

---

## 🚀 배포

### Vercel 배포

```bash
npm run build
vercel --prod
```

### 환경 변수 설정
Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🐛 문제 해결

### 이미지 업로드 실패
1. Supabase Storage 버킷 생성 확인
2. RLS 정책 확인
3. 파일 크기 제한 확인 (5MB)

### 활동 목록 조회 실패
1. RLS 정책 확인
2. 사용자 권한 확인
3. course_id 유효성 확인

### 발표 모드 진입 실패
1. 발표 순서 설정 확인
2. presentation_date 유효성 확인

---

## 📄 라이선스

MIT License

---

## 👥 기여

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 문의

프로젝트 관련 문의: [이메일 주소]

---

**BS 활동 관리 시스템** - 교육생 성장을 위한 체계적인 활동 관리 플랫폼 🚀
