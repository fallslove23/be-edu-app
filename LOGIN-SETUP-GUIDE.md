# 로그인 시스템 설정 가이드

## 개요
사번 기반 로그인 시스템이 구현되었습니다. 초기 비밀번호는 `osstem`이며, 최초 로그인 시 비밀번호 변경이 필수입니다.

## 데이터베이스 마이그레이션

### 1. 필요한 컬럼 추가
다음 SQL을 Supabase SQL Editor에서 실행하세요:

```sql
-- database/migrations/add_password_fields.sql 파일 실행
```

또는 직접 실행:

```sql
-- 비밀번호 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- password_change_logs 테이블 생성
CREATE TABLE IF NOT EXISTS password_change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_password_change_logs_user_id ON password_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_password_change_logs_changed_at ON password_change_logs(changed_at);

-- RLS 비활성화 (테스트용)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_change_logs DISABLE ROW LEVEL SECURITY;
```

## 주요 기능

### 1. 사번 기반 로그인
- 사번 형식: `20031409` (국내), `A20031409` (해외, 알파벳 접두사)
- 초기 비밀번호: `osstem`

### 2. 최초 로그인 처리
- 로그인 성공 후 `first_login` 플래그 확인
- `first_login=true`인 경우 자동으로 `/change-password`로 리다이렉트
- 비밀번호 변경 완료 시 `first_login=false`로 업데이트

### 3. 비밀번호 요구사항
- 최소 8자 이상
- 영문자 포함 필수
- 숫자 포함 필수

### 4. 보안 기능
- bcrypt 해시 사용 (salt rounds: 10)
- 로그인 시도 5회 실패 시 30초 잠금
- 비밀번호 변경 이력 로깅

## 파일 구조

```
src/
├── services/
│   └── auth.service.ts          # 인증 서비스 (로그인, 비밀번호 변경)
├── components/
│   └── auth/
│       └── SecureLogin.tsx      # 로그인 컴포넌트 (사번 기반)
├── contexts/
│   └── AuthContext.tsx          # 인증 컨텍스트 (실제 인증 로직)
├── app/
│   ├── login/
│   │   └── page.tsx             # 로그인 페이지
│   └── change-password/
│       └── page.tsx             # 비밀번호 변경 페이지
└── types/
    └── auth.types.ts            # 타입 정의 (password 필드 추가)

database/
└── migrations/
    └── add_password_fields.sql  # 비밀번호 필드 마이그레이션
```

## 사용 방법

### 관리자: 새 사용자 추가
사용자를 추가할 때 `first_login=true`로 설정하세요. 비밀번호는 자동으로 초기 비밀번호(`osstem`)로 설정됩니다.

```typescript
// 예시: UserService에서 사용자 생성
await UserService.createUser({
  name: '홍길동',
  employee_id: '20031409',
  // ... 기타 정보
});

// 초기 비밀번호 설정
await AuthService.setInitialPassword(userId);
```

### 사용자: 로그인 및 비밀번호 변경
1. `/login` 페이지 접속
2. 사번과 초기 비밀번호(`osstem`) 입력
3. 로그인 성공 → 자동으로 비밀번호 변경 페이지로 이동
4. 새 비밀번호 입력 (8자 이상, 영문/숫자 포함)
5. 변경 완료 → 대시보드로 이동

## 테스트 계정

```
관리자 - 홍길동
사번: 20031409
비밀번호: osstem (최초 로그인 시 변경 필요)

강사 - 김강사
사번: 20041510
비밀번호: osstem (최초 로그인 시 변경 필요)

매니저 - John Smith (해외)
사번: A20051611
비밀번호: osstem (최초 로그인 시 변경 필요)

교육생 - 이교육
사번: 20061712
비밀번호: osstem (최초 로그인 시 변경 필요)
```

## 보안 권장사항

### 프로덕션 배포 전
1. **RLS 활성화**: Row Level Security 정책 설정
2. **비밀번호 정책 강화**: 특수문자 포함, 최소 길이 증가 등
3. **세션 관리**: JWT 또는 세션 토큰 구현
4. **HTTPS 필수**: 모든 통신을 암호화
5. **로그인 시도 제한**: IP 기반 제한 추가
6. **비밀번호 만료**: 정기적 비밀번호 변경 정책

### 추가 개선사항
- 2FA (이중 인증) 구현
- 비밀번호 복구 기능
- 계정 잠금 해제 기능
- 로그인 알림 (이메일/SMS)
- 감사 로그 강화

## 문제 해결

### 로그인이 안 되는 경우
1. 사번이 정확한지 확인 (대소문자 구분)
2. users 테이블에 해당 사번이 있는지 확인
3. status가 'active'인지 확인
4. password_hash 필드가 있는지 확인

### 비밀번호 변경이 안 되는 경우
1. 기존 비밀번호가 맞는지 확인
2. 새 비밀번호가 요구사항을 만족하는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 최초 로그인 플래그가 리셋되지 않는 경우
```sql
-- 수동으로 first_login 플래그 업데이트
UPDATE users
SET first_login = false
WHERE employee_id = '20031409';
```

## API 참조

### AuthService

```typescript
// 로그인
await AuthService.loginWithEmployeeId(employeeId, password);

// 비밀번호 변경
await AuthService.changePassword(userId, oldPassword, newPassword);

// 최초 로그인 확인
await AuthService.checkFirstLogin(userId);

// 초기 비밀번호 설정 (관리자용)
await AuthService.setInitialPassword(userId, 'osstem');

// 로그아웃
await AuthService.logout();
```

### AuthContext

```typescript
const { login, logout, user, loading, error } = useAuth();

// 로그인
await login(employeeId, password);

// 로그아웃
await logout();

// 사용자 정보 업데이트
updateUser(updatedUser);
```

## 다음 단계

1. ✅ 데이터베이스 마이그레이션 실행
2. ✅ 테스트 사용자 추가
3. ✅ 로그인 테스트
4. ✅ 비밀번호 변경 테스트
5. 🔲 관리자 페이지에서 사용자 추가 기능 확인
6. 🔲 프로덕션 보안 설정 적용

## 참고사항

- 이 시스템은 개발/테스트 환경을 위해 설계되었습니다.
- 프로덕션 배포 전 보안 검토가 필요합니다.
- 비밀번호는 절대 평문으로 저장되지 않습니다 (bcrypt 해시만 저장).
