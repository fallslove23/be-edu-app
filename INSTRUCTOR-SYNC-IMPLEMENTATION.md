# 강사 정보 동기화 구현 가이드 (Webhook 방식)

## 📋 개요

학습 관리 시스템(SS Education Management)의 강사 정보를 평가 앱(BS Edu Feedback)으로 실시간 동기화합니다.

---

## 🎯 1단계: 평가 앱에 동기화 API 추가

### API 엔드포인트 스펙

**URL**: `POST /api/sync/instructor`

**Headers**:
```
Content-Type: application/json
X-API-Key: your-secret-api-key
```

**Request Body**:
```json
{
  "action": "upsert" | "delete",
  "instructor": {
    "id": "uuid",
    "name": "강사명",
    "email": "email@example.com",
    "phone": "010-1234-5678",
    "photo_url": "https://...",
    "specializations": ["영업", "마케팅"],
    "rating": 4.5,
    "is_active": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "instructor_id": "uuid",
  "synced_at": "2025-11-12T12:00:00Z"
}
```

### Next.js API Route 구현 예시

```typescript
// 평가 앱: /app/api/sync/instructor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SYNC_API_KEY = process.env.SYNC_API_KEY!;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. API Key 검증
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== SYNC_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Request Body 파싱
    const { action, instructor } = await req.json();

    console.log('📥 강사 동기화 요청:', { action, instructor_id: instructor.id });

    // 3. 동기화 처리
    if (action === 'delete') {
      // 삭제 처리 (소프트 삭제 권장)
      const { error } = await supabase
        .from('instructors')
        .update({ is_active: false, synced_at: new Date().toISOString() })
        .eq('id', instructor.id);

      if (error) throw error;
    } else {
      // 생성/수정 처리
      const { error } = await supabase
        .from('instructors')
        .upsert({
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          phone: instructor.phone,
          photo_url: instructor.photo_url,
          specializations: instructor.specializations,
          rating: instructor.rating,
          is_active: instructor.is_active,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;
    }

    console.log('✅ 강사 동기화 성공:', instructor.id);

    return NextResponse.json({
      success: true,
      instructor_id: instructor.id,
      synced_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ 강사 동기화 실패:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 환경 변수 설정

평가 앱의 `.env.local`에 추가:
```bash
# 동기화 API 인증 키 (강력한 랜덤 문자열)
SYNC_API_KEY=your-super-secret-key-here-generate-random-string

# Supabase Service Role Key (Admin 권한)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🗄️ 2단계: 평가 앱 DB에 instructors 테이블 생성/수정

```sql
-- 평가 앱 DB에서 실행

-- instructors 테이블 생성 (이미 있다면 ALTER로 컬럼 추가)
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  specializations TEXT[],
  rating NUMERIC(3,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 테이블이 있다면 컬럼 추가
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_is_active ON instructors(is_active);

COMMENT ON TABLE instructors IS '강사 정보 (학습 관리 시스템에서 동기화)';
```

---

## 🔄 3단계: 학습 관리 시스템에 Database Trigger 설정

### 3-1. HTTP Extension 활성화

```sql
-- SS Education Management DB에서 실행

-- pg_net extension 활성화 (Supabase에서 제공)
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 3-2. 동기화 함수 생성

```sql
-- SS Education Management DB에서 실행

CREATE OR REPLACE FUNCTION sync_instructor_to_feedback()
RETURNS TRIGGER AS $$
DECLARE
  instructor_data JSONB;
  webhook_url TEXT := 'https://your-feedback-app-url.com/api/sync/instructor';
  api_key TEXT := 'your-super-secret-key-here-generate-random-string';
  action_type TEXT;
BEGIN
  -- 1. Action 타입 결정
  IF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    instructor_data := jsonb_build_object(
      'id', OLD.user_id
    );
  ELSE
    action_type := 'upsert';

    -- 2. 강사 데이터 수집
    SELECT jsonb_build_object(
      'id', NEW.user_id,
      'name', u.name,
      'email', u.email,
      'phone', u.phone,
      'photo_url', NEW.profile_photo_url,
      'specializations', NEW.specializations,
      'rating', NEW.rating,
      'is_active', NEW.is_active
    ) INTO instructor_data
    FROM users u
    WHERE u.id = NEW.user_id;
  END IF;

  -- 3. Webhook 호출 (비동기)
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', api_key
    ),
    body := jsonb_build_object(
      'action', action_type,
      'instructor', instructor_data
    )
  );

  -- 4. 동기화 로그 저장
  INSERT INTO instructor_sync_log (
    instructor_id,
    action,
    payload,
    status,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    instructor_data,
    'pending',
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 3-3. Trigger 생성

```sql
-- SS Education Management DB에서 실행

-- 기존 Trigger 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_sync_instructor_to_feedback ON instructor_profiles;

-- 새 Trigger 생성
CREATE TRIGGER trigger_sync_instructor_to_feedback
AFTER INSERT OR UPDATE OR DELETE ON instructor_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_instructor_to_feedback();
```

---

## 📊 4단계: 동기화 로그 테이블 생성

```sql
-- SS Education Management DB에서 실행

CREATE TABLE IF NOT EXISTS instructor_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sync_log_instructor ON instructor_sync_log(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON instructor_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON instructor_sync_log(created_at DESC);

COMMENT ON TABLE instructor_sync_log IS '강사 정보 동기화 로그';
```

---

## 🔁 5단계: 재시도 로직 (선택 사항)

### Cron Job으로 실패한 동기화 재시도

```sql
-- SS Education Management DB에서 실행

CREATE OR REPLACE FUNCTION retry_failed_sync()
RETURNS void AS $$
DECLARE
  log_record RECORD;
  webhook_url TEXT := 'https://your-feedback-app-url.com/api/sync/instructor';
  api_key TEXT := 'your-super-secret-key-here-generate-random-string';
BEGIN
  -- 1. 실패한 동기화 레코드 조회 (최대 3번 재시도)
  FOR log_record IN
    SELECT *
    FROM instructor_sync_log
    WHERE status = 'failed'
      AND retry_count < 3
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at
    LIMIT 10
  LOOP
    -- 2. 재시도
    BEGIN
      PERFORM net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-API-Key', api_key
        ),
        body := jsonb_build_object(
          'action', log_record.action,
          'instructor', log_record.payload
        )
      );

      -- 3. 성공 시 로그 업데이트
      UPDATE instructor_sync_log
      SET
        status = 'success',
        completed_at = NOW(),
        retry_count = retry_count + 1
      WHERE id = log_record.id;

    EXCEPTION WHEN OTHERS THEN
      -- 4. 실패 시 재시도 카운트 증가
      UPDATE instructor_sync_log
      SET
        retry_count = retry_count + 1,
        error_message = SQLERRM
      WHERE id = log_record.id;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- pg_cron으로 매 10분마다 실행 (Supabase에서 지원)
-- Supabase Dashboard → Database → Cron Jobs에서 설정
-- 또는 수동으로 호출: SELECT retry_failed_sync();
```

---

## ✅ 6단계: 초기 데이터 동기화

```sql
-- SS Education Management DB에서 실행
-- 기존 강사 데이터를 평가 앱으로 일괄 동기화

DO $$
DECLARE
  instructor_rec RECORD;
  webhook_url TEXT := 'https://your-feedback-app-url.com/api/sync/instructor';
  api_key TEXT := 'your-super-secret-key-here-generate-random-string';
  instructor_data JSONB;
BEGIN
  FOR instructor_rec IN
    SELECT
      ip.user_id,
      u.name,
      u.email,
      u.phone,
      ip.profile_photo_url,
      ip.specializations,
      ip.rating,
      ip.is_active
    FROM instructor_profiles ip
    JOIN users u ON ip.user_id = u.id
    WHERE ip.is_active = true
  LOOP
    instructor_data := jsonb_build_object(
      'id', instructor_rec.user_id,
      'name', instructor_rec.name,
      'email', instructor_rec.email,
      'phone', instructor_rec.phone,
      'photo_url', instructor_rec.profile_photo_url,
      'specializations', instructor_rec.specializations,
      'rating', instructor_rec.rating,
      'is_active', instructor_rec.is_active
    );

    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-API-Key', api_key
      ),
      body := jsonb_build_object(
        'action', 'upsert',
        'instructor', instructor_data
      )
    );

    RAISE NOTICE '동기화: % (%)', instructor_rec.name, instructor_rec.user_id;
  END LOOP;
END $$;
```

---

## 🔐 보안 고려사항

1. **API Key 관리**
   - 강력한 랜덤 문자열 사용 (최소 32자)
   - 환경 변수로 관리 (.env에 저장, Git에 커밋 금지)
   - 정기적으로 변경

2. **HTTPS 필수**
   - 평가 앱은 반드시 HTTPS 사용

3. **Rate Limiting**
   - 평가 앱 API에 Rate Limiting 추가 권장

4. **IP 화이트리스트** (선택)
   - Supabase IP에서만 요청 허용

---

## 📝 설정 체크리스트

### 평가 앱 (BS Edu Feedback)
- [ ] `/api/sync/instructor` 엔드포인트 구현
- [ ] `SYNC_API_KEY` 환경 변수 설정
- [ ] `instructors` 테이블 생성/수정
- [ ] API 테스트 (Postman 등)

### 학습 관리 시스템 (SS Education Management)
- [ ] `pg_net` extension 활성화
- [ ] `sync_instructor_to_feedback()` 함수 생성
- [ ] Trigger 생성
- [ ] `instructor_sync_log` 테이블 생성
- [ ] Webhook URL 및 API Key 설정
- [ ] 초기 데이터 동기화 실행

---

## 🧪 테스트 방법

### 1. 수동 테스트

```sql
-- 강사 정보 수정하여 Trigger 발동
UPDATE instructor_profiles
SET profile_photo_url = 'https://new-url.com/photo.jpg'
WHERE user_id = 'some-uuid';

-- 동기화 로그 확인
SELECT * FROM instructor_sync_log ORDER BY created_at DESC LIMIT 10;
```

### 2. 평가 앱에서 확인

```sql
-- 평가 앱 DB에서 확인
SELECT * FROM instructors WHERE id = 'some-uuid';
```

---

## 🔍 모니터링

```sql
-- 동기화 실패 건수 확인
SELECT
  status,
  COUNT(*) as count
FROM instructor_sync_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- 최근 실패 로그 확인
SELECT
  instructor_id,
  action,
  error_message,
  retry_count,
  created_at
FROM instructor_sync_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📞 문의 및 문제 해결

동기화가 작동하지 않는 경우:

1. **평가 앱 API 확인**: 직접 curl로 테스트
   ```bash
   curl -X POST https://your-feedback-app.com/api/sync/instructor \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{"action":"upsert","instructor":{"id":"test","name":"테스트"}}'
   ```

2. **Supabase Logs 확인**: Dashboard → Logs → Database

3. **동기화 로그 확인**: `instructor_sync_log` 테이블

4. **네트워크 연결**: Webhook URL 접근 가능한지 확인
