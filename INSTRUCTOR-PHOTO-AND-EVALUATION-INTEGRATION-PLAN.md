# 강사 사진 및 실시간 평가 시스템 연동 계획

## 📋 목차
1. [강사 사진 기능 구현](#1-강사-사진-기능-구현)
2. [실시간 평가 시스템 연동 방안](#2-실시간-평가-시스템-연동-방안)
3. [데이터 중복 해결 전략](#3-데이터-중복-해결-전략)

---

## 1. 강사 사진 기능 구현

### 1.1 현재 상태
- ✅ DB: `instructor_profiles.profile_photo_url` 필드 존재
- ❌ UI: 사진 업로드 및 표시 기능 없음
- ❌ Storage: Supabase Storage 버킷 미설정

### 1.2 구현 계획

#### A. Supabase Storage 설정
```sql
-- Storage 버킷 생성 (Supabase Dashboard 또는 SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-photos', 'instructor-photos', true);

-- 정책 설정: 인증된 사용자만 업로드 가능
CREATE POLICY "Instructors can upload own photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'instructor-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 정책: 모든 사용자가 조회 가능 (public)
CREATE POLICY "Anyone can view instructor photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'instructor-photos');
```

#### B. UI 컴포넌트 구현
1. **강사 관리 페이지 (InstructorManagement.tsx)**
   - 프로필 수정 모달에 사진 업로드 추가
   - 강사 목록에 프로필 사진 표시

2. **개인 프로필 페이지 (MyProfile.tsx)**
   - 강사 본인이 사진 업로드/변경 가능
   - 미리보기 기능

3. **컴포넌트 구조**
   ```
   InstructorPhotoUpload.tsx (공통)
   ├─ 파일 선택 (image/* 제한)
   ├─ 이미지 크롭/리사이즈 (400x400)
   ├─ Supabase Storage 업로드
   └─ URL 저장 (instructor_profiles 업데이트)
   ```

#### C. 서비스 함수
```typescript
// src/services/instructor-photo.service.ts
export const instructorPhotoService = {
  async uploadPhoto(userId: string, file: File): Promise<string> {
    // 1. 파일 검증 (크기, 형식)
    // 2. 리사이즈 (400x400)
    // 3. Supabase Storage 업로드
    // 4. Public URL 반환
  },

  async updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    // instructor_profiles.profile_photo_url 업데이트
  },

  async deletePhoto(userId: string): Promise<void> {
    // Storage에서 삭제 + DB URL null 처리
  }
};
```

---

## 2. 실시간 평가 시스템 연동 방안

### 2.1 문제 정의
- **현재 상황**: BS 학습 관리 시스템과 실시간 평가 시스템이 별도 DB 사용
- **문제점**: 강사 리스트가 두 시스템에 중복 존재
- **목표**: 단일 진실 공급원(Single Source of Truth) 확보

### 2.2 해결 방안 3가지

#### ✅ **방안 1: 마스터-슬레이브 동기화 (추천)**

**개념**: BS 학습 관리 시스템을 마스터로, 평가 시스템을 슬레이브로 설정

**장점**:
- ✅ 데이터 정합성 보장
- ✅ 기존 시스템 최소 수정
- ✅ 실시간 동기화 가능

**구현**:
```typescript
// 1. Database Trigger (PostgreSQL)
CREATE OR REPLACE FUNCTION sync_instructor_to_evaluation_system()
RETURNS TRIGGER AS $$
BEGIN
  -- 평가 시스템 DB에 INSERT/UPDATE
  PERFORM http_post(
    'https://evaluation-api.example.com/api/instructors/sync',
    json_build_object(
      'id', NEW.user_id,
      'name', (SELECT name FROM users WHERE id = NEW.user_id),
      'email', (SELECT email FROM users WHERE id = NEW.user_id),
      'photo_url', NEW.profile_photo_url,
      'specializations', NEW.specializations,
      'rating', NEW.rating
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_instructor
AFTER INSERT OR UPDATE ON instructor_profiles
FOR EACH ROW EXECUTE FUNCTION sync_instructor_to_evaluation_system();
```

```typescript
// 2. API Endpoint (평가 시스템)
// POST /api/instructors/sync
export async function syncInstructor(req: Request) {
  const instructor = req.body;

  await evaluationDB.query(`
    INSERT INTO instructors (id, name, email, photo_url, specializations, rating)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      photo_url = EXCLUDED.photo_url,
      specializations = EXCLUDED.specializations,
      rating = EXCLUDED.rating,
      updated_at = NOW()
  `, [instructor.id, instructor.name, ...]);
}
```

**데이터 흐름**:
```
BS 학습 관리 (Master)
  ↓ Trigger
평가 시스템 (Slave) - 읽기 전용
```

---

#### 방안 2: Shared Database View

**개념**: 두 시스템이 동일한 강사 테이블/뷰를 공유

**장점**:
- ✅ 완벽한 데이터 일관성
- ✅ 실시간 반영

**단점**:
- ❌ DB 결합도 높음
- ❌ 시스템 독립성 상실

**구현**:
```sql
-- 공유 뷰 생성
CREATE VIEW shared_instructors AS
SELECT
  ip.user_id as id,
  u.name,
  u.email,
  ip.profile_photo_url,
  ip.specializations,
  ip.rating,
  ip.is_active
FROM instructor_profiles ip
JOIN users u ON ip.user_id = u.id
WHERE ip.is_active = true;

-- 평가 시스템에서 이 뷰를 사용
GRANT SELECT ON shared_instructors TO evaluation_system_user;
```

---

#### 방안 3: Event-Driven 동기화

**개념**: 메시지 큐(RabbitMQ, Kafka)를 통한 이벤트 기반 동기화

**장점**:
- ✅ 시스템 완전 분리
- ✅ 확장성 우수
- ✅ 장애 복구 용이

**단점**:
- ❌ 인프라 복잡도 증가
- ❌ Eventually Consistent (일시적 불일치 가능)

**구현**:
```typescript
// BS 학습 관리 - Publisher
class InstructorEventPublisher {
  async publishInstructorUpdated(instructor: InstructorProfile) {
    await messageQueue.publish('instructor.updated', {
      id: instructor.user_id,
      name: instructor.name,
      photo_url: instructor.profile_photo_url,
      // ...
    });
  }
}

// 평가 시스템 - Subscriber
class InstructorEventSubscriber {
  async handleInstructorUpdated(event: InstructorUpdatedEvent) {
    await this.updateLocalInstructor(event.data);
  }
}
```

---

## 3. 데이터 중복 해결 전략

### 3.1 최종 추천 아키텍처

```
┌─────────────────────────────────────────┐
│   BS 학습 관리 시스템 (Master)          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ instructor_profiles (Source)    │   │
│  │ - user_id (PK)                  │   │
│  │ - profile_photo_url ✨          │   │
│  │ - specializations               │   │
│  │ - rating                        │   │
│  └─────────────────────────────────┘   │
│           ↓ DB Trigger                 │
└───────────┼─────────────────────────────┘
            │
            │ HTTP POST (Webhook)
            ↓
┌───────────┼─────────────────────────────┐
│           ↓                             │
│  ┌─────────────────────────────────┐   │
│  │ API: /sync/instructors          │   │
│  └─────────────────────────────────┘   │
│           ↓                             │
│  ┌─────────────────────────────────┐   │
│  │ instructors (Replica)           │   │
│  │ - id (PK)                       │   │
│  │ - name                          │   │
│  │ - photo_url ✨                  │   │
│  │ - last_synced_at               │   │
│  └─────────────────────────────────┘   │
│                                         │
│   실시간 평가 시스템 (Slave)            │
└─────────────────────────────────────────┘
```

### 3.2 구현 우선순위

**Phase 1: 강사 사진 기능** (1-2일)
1. ✅ Supabase Storage 버킷 생성
2. ✅ 사진 업로드 컴포넌트 개발
3. ✅ 강사 관리 페이지에 사진 표시
4. ✅ 개인 프로필 페이지에 사진 업로드

**Phase 2: 동기화 기반 구축** (2-3일)
1. ✅ 평가 시스템 API 엔드포인트 구현
2. ✅ Webhook 방식 동기화 구현
3. ✅ 실패 시 재시도 로직

**Phase 3: 평가 시스템 연동** (3-4일)
1. ✅ 강사 평가 데이터 수집 API
2. ✅ 평가 결과 BS 시스템 반영
3. ✅ 양방향 동기화 검증

### 3.3 데이터 정합성 보장

**A. 동기화 로그 테이블**
```sql
CREATE TABLE instructor_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  sync_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  payload JSONB,
  status TEXT NOT NULL, -- 'pending', 'success', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**B. 재시도 메커니즘**
```typescript
// Exponential Backoff
async function syncWithRetry(instructorId: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncToEvaluationSystem(instructorId);
      return;
    } catch (error) {
      await delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }

  // 최종 실패 시 로그 저장
  await logSyncFailure(instructorId);
}
```

**C. 정기 동기화 검증**
```typescript
// Cron Job: 매일 새벽 2시 실행
async function validateSync() {
  const bsInstructors = await getBSInstructors();
  const evalInstructors = await getEvaluationInstructors();

  const diff = findDifferences(bsInstructors, evalInstructors);

  if (diff.length > 0) {
    await resyncInstructors(diff);
    await sendAlertToAdmin(diff);
  }
}
```

---

## 4. 구현 가이드

### 4.1 Supabase Storage 설정 (SQL)

```bash
# Supabase Dashboard → Storage → Create Bucket
# Bucket Name: instructor-photos
# Public: Yes
```

### 4.2 강사 사진 업로드 플로우

```typescript
// 1. 파일 선택
<input type="file" accept="image/*" onChange={handleFileSelect} />

// 2. 이미지 크롭/리사이즈
const resizedImage = await resizeImage(file, 400, 400);

// 3. Supabase Storage 업로드
const { data } = await supabase.storage
  .from('instructor-photos')
  .upload(`${userId}/profile.jpg`, resizedImage);

// 4. Public URL 획득
const photoUrl = supabase.storage
  .from('instructor-photos')
  .getPublicUrl(`${userId}/profile.jpg`).data.publicUrl;

// 5. DB 업데이트
await instructorProfileService.update(userId, { profile_photo_url: photoUrl });
```

### 4.3 평가 시스템 연동 체크리스트

- [ ] 평가 시스템 API 문서 확인
- [ ] 강사 ID 매핑 규칙 정의
- [ ] Webhook 엔드포인트 구현
- [ ] 인증/권한 설정 (API Key 등)
- [ ] 동기화 로그 모니터링
- [ ] 실패 알림 설정

---

## 5. 보안 고려사항

### 5.1 사진 업로드
- ✅ 파일 크기 제한 (5MB)
- ✅ 이미지 형식 검증 (JPEG, PNG만)
- ✅ 사용자 인증 필수
- ✅ 본인 사진만 수정 가능

### 5.2 데이터 동기화
- ✅ API Key 인증
- ✅ HTTPS 필수
- ✅ Rate Limiting
- ✅ 민감 정보 제외 (비밀번호 등)

---

## 6. 예상 일정

| Phase | 작업 | 소요 시간 |
|-------|------|----------|
| 1 | Supabase Storage 설정 | 0.5일 |
| 2 | 사진 업로드 컴포넌트 개발 | 1일 |
| 3 | 강사 관리/프로필 페이지 연동 | 1일 |
| 4 | 평가 시스템 API 개발 | 2일 |
| 5 | Webhook 동기화 구현 | 1.5일 |
| 6 | 테스트 및 검증 | 1일 |
| **총계** | | **7일** |

---

## 7. 다음 단계

1. ✅ 이 계획서 검토 및 승인
2. ✅ Supabase Storage 버킷 생성
3. ✅ 강사 사진 업로드 기능 구현
4. ✅ 평가 시스템 담당자와 API 스펙 협의
5. ✅ 동기화 메커니즘 구현
