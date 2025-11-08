# 알림 시스템 설정 가이드

과정 변경, 일정 충돌, 과정 시작 등의 실시간 알림을 제공하는 시스템입니다.

## 📋 기능 개요

### 1. 알림 유형
- **과정 시작 알림**: 등록한 과정의 시작일이 다가오면 알림 (D-1, D-3, D-7 설정 가능)
- **과정 변경 알림**: 과정 정보 변경 시 알림
- **일정 충돌 감지**: 강의실/강사 일정 충돌 시 즉시 알림
- **과정 확정 알림**: 과정이 확정되면 알림
- **일정 변경 알림**: 세부 일정 변경 시 알림

### 2. 주요 기능
- **준실시간 알림** (30초 간격 폴링 방식 - Supabase Realtime 미지원)
- 브라우저 푸시 알림 지원
- 사용자별 알림 설정 (알림 유형별 on/off)
- 읽음/읽지 않음 상태 관리
- 우선순위별 알림 (low, normal, high, urgent)

> **참고**: 현재 Supabase Realtime 기능이 지원되지 않아 폴링 방식(30초 간격)으로 새 알림을 확인합니다. Realtime 기능이 활성화되면 즉시 알림을 받을 수 있습니다.

## 🛠️ 데이터베이스 설정

### 1. 마이그레이션 실행

**중요**: 현재 프로젝트는 Mock Auth를 사용하므로 RLS가 비활성화된 버전을 사용해야 합니다.

```bash
# Supabase SQL 에디터에서 다음 파일 실행
database/migrations/create-notification-system-mock-auth.sql
```

> **참고**: Supabase Auth를 사용하는 경우 `create-notification-system.sql` 파일을 대신 사용하세요.

### 2. 생성되는 테이블

#### `notifications` - 알림 데이터
- `id`: UUID (Primary Key)
- `user_id`: 알림 대상 사용자
- `type`: 알림 유형
- `title`: 알림 제목
- `message`: 알림 내용
- `link`: 클릭 시 이동할 링크
- `related_course_id`: 관련 과정 ID
- `related_session_id`: 관련 세션 ID
- `is_read`: 읽음 여부
- `priority`: 우선순위
- `created_at`: 생성 시간
- `read_at`: 읽은 시간

#### `notification_preferences` - 사용자별 알림 설정
- `id`: UUID (Primary Key)
- `user_id`: 사용자 ID (Unique)
- `course_start_enabled`: 과정 시작 알림 활성화
- `course_update_enabled`: 과정 변경 알림 활성화
- `conflict_enabled`: 충돌 감지 알림 활성화
- `course_confirmed_enabled`: 과정 확정 알림 활성화
- `session_change_enabled`: 일정 변경 알림 활성화
- `days_before_start`: 과정 시작 며칠 전 알림 (기본 3일)

#### `scheduled_notifications` - 예정된 알림 스케줄
- `id`: UUID (Primary Key)
- `course_round_id`: 과정 ID
- `notification_type`: 알림 유형
- `scheduled_date`: 예정 날짜
- `is_sent`: 전송 여부
- `sent_at`: 전송 시간

### 3. RLS (Row Level Security) 정책

#### 알림 테이블
- **조회**: 본인의 알림만 조회 가능
- **수정**: 본인의 알림만 수정 가능 (읽음 표시)
- **생성**: 관리자, 매니저, 운영자만 생성 가능

#### 알림 설정 테이블
- **조회/수정**: 본인의 설정만 조회/수정 가능

## 💻 코드 사용법

### 1. 알림 생성

```typescript
import { notificationDBService } from '@/services/notification-db.service';

// 과정 확정 알림
await notificationDBService.notifyCourseConfirmed(
  courseId,
  '치과 BS 영업 기초과정 1차',
  ['user-id-1', 'user-id-2']
);

// 일정 충돌 알림
await notificationDBService.notifyConflict(
  userId,
  'classroom',
  '2025-01-15 09:00-12:00, 강의실 A 중복 예약'
);
```

### 2. 알림 조회

```typescript
// 알림 목록 조회
const notifications = await notificationDBService.getNotifications(userId);

// 읽지 않은 알림 개수
const count = await notificationDBService.getUnreadCount(userId);
```

### 3. 새 알림 확인 (폴링 방식)

```typescript
// 마지막 확인 시간 이후의 새 알림 조회
const lastCheckTime = '2025-01-15T10:00:00.000Z';
const newNotifications = await notificationDBService.getNewNotifications(
  userId,
  lastCheckTime
);

console.log('새 알림:', newNotifications);
```

> **참고**: NotificationCenter 컴포넌트는 자동으로 30초마다 새 알림을 확인하여 UI를 업데이트합니다.

### 4. 알림 설정 관리

```typescript
// 알림 설정 조회
const preferences = await notificationDBService.getPreferences(userId);

// 알림 설정 저장
await notificationDBService.savePreferences(userId, {
  course_start_enabled: true,
  days_before_start: 7
});
```

## 🎯 헬퍼 함수 사용

프로젝트에는 과정 관리에서 쉽게 알림을 트리거할 수 있는 헬퍼 함수가 제공됩니다:

```typescript
import {
  notifyOnCourseConfirmed,
  notifyOnCourseUpdated,
  notifyOnSessionChanged,
  notifyOnConflictDetected,
  scheduleCourseStartNotification
} from '@/utils/notification-helpers';

// 과정 확정 시
await notifyOnCourseConfirmed(courseId, courseTitle, enrolledUserIds);

// 과정 변경 시
await notifyOnCourseUpdated(
  courseId,
  courseTitle,
  '시작일이 2025-01-15로 변경되었습니다.',
  enrolledUserIds
);

// 일정 변경 시
await notifyOnSessionChanged(
  courseId,
  courseTitle,
  '1차시',
  '시간이 09:00 → 10:00로 변경되었습니다.',
  enrolledUserIds
);

// 충돌 감지 시
await notifyOnConflictDetected(
  userId,
  'classroom',
  '2025-01-15 09:00-12:00, 강의실 A 중복 예약'
);
```

## 🔔 브라우저 알림 권한

사용자가 브라우저 알림을 받으려면 권한을 허용해야 합니다:

```typescript
// 브라우저 알림 권한 요청
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  // 권한 허용됨
  new Notification('알림 제목', {
    body: '알림 내용',
    icon: '/icon-192.png'
  });
}
```

## 📊 알림 통계 함수

데이터베이스에는 다음 헬퍼 함수들이 제공됩니다:

### `get_unread_notification_count(user_id UUID)`
읽지 않은 알림 개수를 반환합니다.

```sql
SELECT get_unread_notification_count('user-id');
```

### `mark_all_notifications_read(user_id UUID)`
해당 사용자의 모든 알림을 읽음 처리합니다.

```sql
SELECT mark_all_notifications_read('user-id');
```

### `create_course_notification(...)`
과정 관련자(강사, 매니저, 등록 교육생)에게 일괄 알림을 생성합니다.

```sql
SELECT create_course_notification(
  'course-id',
  'course_confirmed',
  '과정 확정',
  '치과 BS 영업 기초과정 1차가 확정되었습니다.',
  'high'
);
```

## 🎨 UI 컴포넌트

### 1. NotificationCenter
헤더에 표시되는 알림 벨 아이콘과 드롭다운

```tsx
import NotificationCenter from '@/components/notifications/NotificationCenter';

<NotificationCenter onNavigate={setActiveView} />
```

### 2. NotificationSettings
알림 설정 페이지

```tsx
import NotificationSettings from '@/components/notifications/NotificationSettings';

<NotificationSettings />
```

## 🚀 향후 개선 사항

1. **이메일/SMS 알림**: 브라우저 알림 외에 이메일, SMS 발송
2. **알림 그룹화**: 같은 과정의 알림을 그룹으로 표시
3. **알림 히스토리**: 과거 알림 검색 및 필터링
4. **알림 스케줄러**: 정해진 시간에 자동 알림 발송
5. **알림 템플릿**: 반복되는 알림을 템플릿으로 관리

## 🔍 문제 해결

### 알림이 표시되지 않는 경우

1. **데이터베이스 확인**
```sql
SELECT * FROM notifications WHERE user_id = 'your-user-id' ORDER BY created_at DESC LIMIT 10;
```

2. **RLS 정책 확인**
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

3. **브라우저 콘솔 확인**
- 폴링 주기(30초)가 정상 작동하는지 확인
- 에러 메시지 확인

### 폴링 주기 조정

알림 확인 주기를 변경하려면 `NotificationCenter.tsx`에서 다음 값을 수정하세요:

```typescript
// 30초 → 10초로 변경
const pollingInterval = setInterval(() => {
  checkNewNotifications();
}, 10000); // 10초
```

> **권장사항**: 서버 부하를 고려하여 10초 이하로 설정하지 않는 것을 권장합니다.

## 📞 지원

문의사항이나 버그 리포트는 프로젝트 이슈 트래커에 등록해주세요.
