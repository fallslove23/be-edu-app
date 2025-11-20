# 알림 시스템 설정 가이드

## 현재 상태

✅ 코드 수정 완료
⚠️ 데이터베이스 테이블 생성 필요

## 알림 에러 상황

**에러 메시지**:
```
Failed to load resource: the server responded with a status of 400 (notifications)
알림 로드 실패
```

**원인**: `notifications` 및 `notification_preferences` 테이블이 Supabase에 생성되지 않음

**영향**:
- 알림 기능을 제외한 모든 기능은 정상 작동
- 페이지 로딩 및 사용자 관리 등 핵심 기능은 문제없음

## 해결 방법

### 옵션 1: Supabase Studio에서 마이그레이션 실행 (권장)

1. **Supabase Studio 접속**:
   ```
   https://supabase.com/dashboard
   프로젝트: sdecinmapanpmohbtdbi
   ```

2. **SQL Editor 열기**:
   - 왼쪽 메뉴에서 "SQL Editor" 클릭

3. **마이그레이션 파일 실행**:
   ```sql
   -- 다음 파일 중 하나를 선택하여 실행
   -- 파일 경로: database/migrations/create-notification-system-mock-auth.sql
   ```

4. **실행 확인**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('notifications', 'notification_preferences');
   ```

### 옵션 2: 알림 기능 비활성화 (임시)

알림이 필수가 아니라면 일단 비활성화할 수 있습니다:

1. **NotificationCenter 제거** (`src/App.tsx`):
   ```tsx
   // NotificationCenter import 주석 처리
   // const NotificationCenter = lazy(() => import('./components/notifications/NotificationCenter'));

   // 사용하는 곳도 주석 처리
   // <NotificationCenter onNavigate={setCurrentView} />
   ```

2. **빌드 후 확인**:
   - 알림 관련 에러가 사라짐
   - 다른 모든 기능은 정상 작동

## 마이그레이션 파일 내용

**생성되는 테이블**:

### 1. `notifications` 테이블
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  related_course_id UUID,
  related_session_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);
```

### 2. `notification_preferences` 테이블
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  course_start_enabled BOOLEAN DEFAULT TRUE,
  course_update_enabled BOOLEAN DEFAULT TRUE,
  conflict_enabled BOOLEAN DEFAULT TRUE,
  course_confirmed_enabled BOOLEAN DEFAULT TRUE,
  session_change_enabled BOOLEAN DEFAULT TRUE,
  days_before_start INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 테스트 방법

### 마이그레이션 성공 확인

```sql
-- 1. 테이블 존재 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'notification%';

-- 2. 테스트 알림 생성
INSERT INTO notifications (user_id, type, title, message, priority)
VALUES (
  '사용자ID',  -- 실제 users 테이블의 id 사용
  'course_start',
  '테스트 알림',
  '알림 시스템 테스트입니다.',
  'normal'
);

-- 3. 알림 조회
SELECT * FROM notifications WHERE user_id = '사용자ID';
```

### 브라우저에서 확인

1. 페이지 새로고침 (Ctrl+Shift+R)
2. 브라우저 콘솔 확인
3. "알림 로드 실패" 에러가 사라지면 성공

## 현재 해결된 에러 목록

✅ **Module not found: '../../lib/supabase'** → 경로 수정
✅ **lazy() Expected dynamic import()** → async 함수로 수정
✅ **'Notification' is not exported** → type export로 변경
✅ **InstructorManagement lazy loading** → async 함수로 수정
⚠️ **알림 로드 실패 (400)** → 테이블 생성 필요 (선택사항)

## 권장 사항

**단기**: 알림 기능을 사용하지 않는다면 비활성화 (옵션 2)
**장기**: 마이그레이션 실행하여 완전한 기능 활성화 (옵션 1)

---

**마지막 업데이트**: 2025년
**상태**: ✅ 핵심 기능 정상, ⚠️ 알림 테이블 생성 대기
