# Vite 평가 앱을 위한 동기화 서버 설정

평가 앱이 Vite로 개발되어 백엔드가 없으므로, 간단한 Express 서버를 추가하여 Webhook을 처리합니다.

---

## 🚀 방법 1: Express.js 백엔드 추가 (추천)

### 1단계: Express 서버 설치

```bash
cd /path/to/feedback-app
npm install express cors dotenv @supabase/supabase-js
npm install -D @types/express @types/cors nodemon
```

### 2단계: Express 서버 파일 생성

**`server/index.js`** 또는 **`server/index.ts`** (TypeScript 사용 시):

```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase 클라이언트
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key 필요
);

// 동기화 API Key
const SYNC_API_KEY = process.env.SYNC_API_KEY;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 강사 동기화 엔드포인트
app.post('/api/sync/instructor', async (req, res) => {
  try {
    // 1. API Key 검증
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== SYNC_API_KEY) {
      console.warn('❌ Unauthorized sync request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Request Body 파싱
    const { action, instructor } = req.body;

    if (!action || !instructor) {
      return res.status(400).json({ error: 'Missing action or instructor data' });
    }

    console.log('📥 강사 동기화 요청:', {
      action,
      instructor_id: instructor.id,
      instructor_name: instructor.name
    });

    // 3. 동기화 처리
    if (action === 'delete') {
      // 삭제 처리 (소프트 삭제)
      const { error } = await supabase
        .from('instructors')
        .update({
          is_active: false,
          synced_at: new Date().toISOString()
        })
        .eq('id', instructor.id);

      if (error) throw error;

      console.log('✅ 강사 삭제 동기화 성공:', instructor.id);

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
          is_active: instructor.is_active !== undefined ? instructor.is_active : true,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      console.log('✅ 강사 동기화 성공:', instructor.id, '-', instructor.name);
    }

    // 4. 성공 응답
    res.json({
      success: true,
      instructor_id: instructor.id,
      synced_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ 강사 동기화 실패:', error);
    res.status(500).json({
      error: error.message || 'Sync failed'
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 동기화 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/sync/instructor`);
});

module.exports = app;
```

### 3단계: 환경 변수 설정

**`.env`** 파일에 추가:

```bash
# 기존 Vite 환경 변수
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# 동기화 서버용 추가 환경 변수
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Supabase Dashboard → Settings → API → service_role
SYNC_API_KEY=your-super-secret-random-key-min-32-chars-here
PORT=3001
```

**⚠️ 보안 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 프론트엔드에 노출되면 안 됩니다!

### 4단계: package.json 스크립트 추가

```json
{
  "scripts": {
    "dev": "vite",
    "server": "nodemon server/index.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run server\"",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**concurrently 설치** (선택):
```bash
npm install -D concurrently
```

### 5단계: 서버 실행

```bash
# 개발 환경: Vite + Express 동시 실행
npm run dev:all

# 또는 각각 실행
npm run dev      # Vite (포트 5173)
npm run server   # Express (포트 3001)
```

### 6단계: 학습 관리 시스템 Webhook URL 설정

**`008_instructor_sync_setup.sql`** 파일에서 URL 수정:

```sql
-- 개발 환경
webhook_url TEXT := 'http://localhost:3001/api/sync/instructor';

-- 프로덕션 환경 (배포 후)
webhook_url TEXT := 'https://your-feedback-app.com/api/sync/instructor';
```

---

## 🌐 방법 2: Vercel Serverless Functions (프로덕션 권장)

Vite 앱을 Vercel에 배포한다면 Serverless Function 사용 가능합니다.

### 1단계: Vercel Functions 폴더 생성

**`api/sync-instructor.js`**:

```javascript
// api/sync-instructor.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYNC_API_KEY = process.env.SYNC_API_KEY;

module.exports = async (req, res) => {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // API Key 검증
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== SYNC_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, instructor } = req.body;

    if (action === 'delete') {
      const { error } = await supabase
        .from('instructors')
        .update({ is_active: false, synced_at: new Date().toISOString() })
        .eq('id', instructor.id);

      if (error) throw error;
    } else {
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
          is_active: instructor.is_active !== undefined ? instructor.is_active : true,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;
    }

    res.json({
      success: true,
      instructor_id: instructor.id,
      synced_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

### 2단계: Vercel 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SYNC_API_KEY`

### 3단계: Webhook URL

```
https://your-feedback-app.vercel.app/api/sync-instructor
```

---

## 🐳 방법 3: Docker로 통합 (선택)

Express 서버와 Vite를 Docker Compose로 통합 실행:

**`docker-compose.yml`**:

```yaml
version: '3.8'

services:
  vite:
    build:
      context: .
      dockerfile: Dockerfile.vite
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules

  sync-server:
    build:
      context: .
      dockerfile: Dockerfile.server
    ports:
      - "3001:3001"
    env_file:
      - .env
    depends_on:
      - vite
```

---

## ✅ 권장 사항

**개발 환경**: **방법 1 (Express 서버)** ← 가장 간단
**프로덕션**: **방법 2 (Vercel Functions)** ← 서버리스, 관리 편함

---

## 🧪 테스트

### Express 서버 테스트

```bash
# Health check
curl http://localhost:3001/api/health

# 동기화 테스트
curl -X POST http://localhost:3001/api/sync/instructor \
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

### 학습 관리 시스템에서 테스트

```sql
-- 강사 정보 수정
UPDATE instructor_profiles
SET profile_photo_url = 'https://new-url.com/photo.jpg'
WHERE user_id = 'some-uuid';

-- 로그 확인
SELECT * FROM instructor_sync_log ORDER BY created_at DESC LIMIT 5;
```

---

## 📦 최종 폴더 구조

```
feedback-app/
├── server/
│   └── index.js          # Express 동기화 서버
├── src/
│   └── ...               # Vite 프론트엔드
├── .env
├── package.json
└── ...
```

---

## 🔧 Troubleshooting

### 포트 충돌
Express 서버가 3001 포트를 사용합니다. 충돌 시 `.env`의 `PORT` 변경.

### CORS 에러
Express 서버에 `cors` 미들웨어가 적용되어 있습니다.

### Webhook 연결 실패
- Express 서버가 실행 중인지 확인
- `webhook_url`이 올바른지 확인 (localhost:3001)
- 네트워크 방화벽 확인

---

어떤 방법으로 진행하시겠어요? 개발 환경이라면 **방법 1 (Express)**을 추천합니다! 🚀
