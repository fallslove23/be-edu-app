# 알림 시스템 오류 해결 가이드

## 문제 설명
- 콘솔 에러: "알림 로드 실패: {}"
- 원인: `notifications` 테이블이 데이터베이스에 없음

## 해결 방법

### 1단계: 테이블 존재 여부 확인

Supabase SQL Editor에서 다음 스크립트를 실행하세요:

```sql
-- database/check-notifications-table.sql 내용 실행
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
  ) as notifications_exists;
```

결과가 `false`라면 테이블을 생성해야 합니다.

### 2단계: 알림 시스템 테이블 생성

Supabase SQL Editor에서 다음 마이그레이션 스크립트를 실행하세요:

```sql
-- database/migrations/create-notification-system-mock-auth.sql 파일 전체 내용 복사하여 실행
```

이 스크립트는 다음을 생성합니다:
- `notifications` 테이블 (알림 저장)
- `notification_preferences` 테이블 (사용자별 알림 설정)
- `scheduled_notifications` 테이블 (예약 알림)
- 필요한 인덱스, 함수, 트리거

### 3단계: RLS 비활성화 확인

Mock Authentication을 사용하므로 RLS가 비활성화되어 있어야 합니다:

```sql
-- RLS 상태 확인
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'notification_preferences', 'scheduled_notifications');
```

모든 테이블의 `rls_enabled`가 `false`여야 합니다.

만약 `true`라면:

```sql
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications DISABLE ROW LEVEL SECURITY;
```

### 4단계: 테스트 데이터 생성 (선택사항)

```sql
-- 테스트 알림 생성
INSERT INTO notifications (user_id, type, title, message, priority)
SELECT
  id,
  'course_start',
  '테스트 알림',
  '알림 시스템이 정상적으로 작동합니다.',
  'normal'
FROM users
LIMIT 1;
```

### 5단계: 애플리케이션 확인

1. 브라우저 새로고침 (Ctrl+Shift+R / Cmd+Shift+R)
2. 개발자 도구 콘솔 확인
3. 알림 벨 아이콘 클릭하여 알림 센터 확인

## 개선 사항

### 에러 처리 개선
- NotificationCenter 컴포넌트에 상세한 에러 로깅 추가
- 테이블이 없어도 앱이 정상 작동하도록 fallback 처리

### 향후 작업
- 알림 시스템 초기화 체크 추가
- 마이그레이션 자동화
- 알림 기능 활성화/비활성화 토글

## 문제가 계속되는 경우

1. Supabase 프로젝트 설정 확인
2. 데이터베이스 연결 상태 확인
3. `.env.local` 파일의 Supabase URL/Key 확인
4. 네트워크 연결 확인

## 관련 파일
- `/src/components/notifications/NotificationCenter.tsx` - 알림 UI 컴포넌트
- `/src/services/notification-db.service.ts` - 알림 데이터베이스 서비스
- `/database/migrations/create-notification-system-mock-auth.sql` - 마이그레이션 스크립트
- `/database/check-notifications-table.sql` - 테이블 확인 스크립트
