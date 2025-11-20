# Supabase Edge Functions를 사용한 강사 동기화 (서버 불필요)

평가 앱이 Vite + Supabase 구조라면, **Supabase Edge Functions**를 사용하여 별도 백엔드 서버 없이 동기화 가능합니다.

---

## 🎯 Supabase Edge Functions란?

- Supabase가 제공하는 **서버리스 함수** (Deno 기반)
- HTTP 요청을 받아 처리할 수 있음
- 별도 서버 관리 불필요
- 무료 플랜에서도 사용 가능 (월 500,000 호출)

---

## 🚀 구현 방법

### 1단계: Supabase CLI 설치

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 또는 NPM
npm install -g supabase
```

### 2단계: 평가 앱 프로젝트에서 Supabase 초기화

```bash
cd /path/to/feedback-app

# Supabase 프로젝트 연결
supabase login
supabase link --project-ref your-project-ref

# Edge Functions 폴더 생성
supabase functions new sync-instructor
```

**프로젝트 ref 확인**: Supabase Dashboard → Settings → General → Reference ID

### 3단계: Edge Function 코드 작성

**`supabase/functions/sync-instructor/index.ts`**:

```typescript
// supabase/functions/sync-instructor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYNC_API_KEY = Deno.env.get('SYNC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      },
    })
  }

  try {
    // 1. API Key 검증
    const apiKey = req.headers.get('X-API-Key')
    if (apiKey !== SYNC_API_KEY) {
      console.warn('❌ Unauthorized sync request')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Request Body 파싱
    const { action, instructor } = await req.json()

    if (!action || !instructor) {
      return new Response(
        JSON.stringify({ error: 'Missing action or instructor data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('📥 강사 동기화 요청:', {
      action,
      instructor_id: instructor.id,
      instructor_name: instructor.name,
    })

    // 3. Supabase 클라이언트 생성 (Service Role)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 4. 동기화 처리
    if (action === 'delete') {
      // 삭제 처리 (소프트 삭제)
      const { error } = await supabase
        .from('instructors')
        .update({
          is_active: false,
          synced_at: new Date().toISOString(),
        })
        .eq('id', instructor.id)

      if (error) throw error

      console.log('✅ 강사 삭제 동기화 성공:', instructor.id)
    } else {
      // 생성/수정 처리
      const { error } = await supabase.from('instructors').upsert(
        {
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          phone: instructor.phone,
          photo_url: instructor.photo_url,
          specializations: instructor.specializations,
          rating: instructor.rating,
          is_active: instructor.is_active !== undefined ? instructor.is_active : true,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

      if (error) throw error

      console.log('✅ 강사 동기화 성공:', instructor.id, '-', instructor.name)
    }

    // 5. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        instructor_id: instructor.id,
        synced_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ 강사 동기화 실패:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Sync failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
```

### 4단계: 환경 변수 설정

```bash
# 로컬 테스트용
supabase secrets set SYNC_API_KEY=your-super-secret-random-key-min-32-chars

# 프로덕션용 (Supabase Dashboard에서 설정)
# Dashboard → Edge Functions → sync-instructor → Secrets
```

**필요한 환경 변수**:
- `SYNC_API_KEY`: 동기화 인증 키 (직접 생성)
- `SUPABASE_URL`: 자동 제공 (평가 앱의 Supabase URL)
- `SUPABASE_SERVICE_ROLE_KEY`: 자동 제공 (Settings → API → service_role)

### 5단계: Edge Function 배포

```bash
# 배포
supabase functions deploy sync-instructor

# 로그 확인
supabase functions logs sync-instructor

# 삭제 (필요시)
supabase functions delete sync-instructor
```

### 6단계: Edge Function URL 확인

배포 후 URL:
```
https://your-project-ref.supabase.co/functions/v1/sync-instructor
```

**프로젝트 ref**: Supabase Dashboard → Settings → General → Reference ID

---

## 🔧 학습 관리 시스템 설정

**`008_instructor_sync_setup.sql`** 파일에서 Webhook URL 수정:

```sql
-- Edge Function URL로 변경
webhook_url TEXT := 'https://your-project-ref.supabase.co/functions/v1/sync-instructor';
api_key TEXT := 'your-super-secret-random-key-min-32-chars';
```

---

## 🧪 테스트

### 로컬 테스트

```bash
# Edge Function 로컬 실행
supabase functions serve sync-instructor

# 다른 터미널에서 테스트
curl -X POST http://localhost:54321/functions/v1/sync-instructor \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "action": "upsert",
    "instructor": {
      "id": "test-uuid",
      "name": "테스트 강사",
      "email": "test@example.com"
    }
  }'
```

### 프로덕션 테스트

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/sync-instructor \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "action": "upsert",
    "instructor": {
      "id": "test-uuid",
      "name": "테스트 강사",
      "email": "test@example.com"
    }
  }'
```

---

## 📊 모니터링

### Edge Function 로그 확인

```bash
# 실시간 로그
supabase functions logs sync-instructor --follow

# 최근 로그
supabase functions logs sync-instructor --limit 100
```

### Supabase Dashboard에서 확인
Dashboard → Edge Functions → sync-instructor → Logs

---

## 💰 비용

**무료 플랜**:
- 월 500,000 함수 호출
- 100만 함수 실행 시간 초 (초당 1회 = 1초)

**Pro 플랜**:
- 월 2,000,000 함수 호출
- 추가 요금: $2/100만 호출

대부분의 경우 무료 플랜으로 충분합니다!

---

## 🔐 보안

1. **API Key 검증**: 모든 요청에 `X-API-Key` 헤더 필수
2. **Service Role Key**: Edge Function에만 저장, 프론트엔드 노출 금지
3. **HTTPS**: 자동으로 HTTPS 적용
4. **CORS**: 필요한 오리진만 허용 가능

---

## ✅ 장점

1. ✅ **서버 관리 불필요**: 서버리스로 자동 스케일링
2. ✅ **비용 효율**: 무료 플랜으로 충분
3. ✅ **빠른 배포**: `supabase functions deploy` 한 줄로 배포
4. ✅ **Supabase 통합**: 같은 DB에 바로 접근 가능
5. ✅ **로그 확인**: 실시간 로그 모니터링

---

## 📁 폴더 구조

```
feedback-app/
├── supabase/
│   └── functions/
│       └── sync-instructor/
│           └── index.ts         # Edge Function
├── src/
│   └── ...                      # Vite 프론트엔드
├── .env
└── package.json
```

---

## 🆚 비교: Edge Functions vs Express

| 항목 | Supabase Edge Functions | Express 서버 |
|------|------------------------|--------------|
| 서버 관리 | 불필요 | 필요 (배포/유지보수) |
| 비용 | 무료 플랜 충분 | 서버 비용 발생 |
| 배포 | `supabase functions deploy` | Docker/Vercel 등 필요 |
| 스케일링 | 자동 | 수동 설정 필요 |
| Supabase 통합 | 네이티브 | SDK 사용 |
| 개발 복잡도 | 낮음 | 중간 |

---

## 🚀 최종 권장

**평가 앱이 Supabase를 사용한다면 → Supabase Edge Functions 사용!**

별도 서버 없이 깔끔하게 동기화 가능합니다. 🎉
