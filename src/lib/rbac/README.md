# RBAC (Role-Based Access Control) System

권한 기반 접근 제어 시스템으로, 하드코딩된 역할 체크를 중앙화된 권한 관리로 대체합니다.

## 주요 기능

- ✅ **중앙화된 권한 정의**: 모든 권한을 한 곳에서 관리
- ✅ **타입 안전성**: TypeScript enum으로 권한 정의
- ✅ **React 훅**: 컴포넌트에서 쉽게 사용할 수 있는 훅 제공
- ✅ **보호된 컴포넌트**: 조건부 렌더링을 위한 래퍼 컴포넌트
- ✅ **유연한 권한 체크**: 단일/다중/모든 권한 체크 지원

## 설치 및 설정

```typescript
// 이미 설치되어 있습니다. import만 하면 됩니다.
import { Permission, usePermission, ProtectedComponent } from '@/lib/rbac';
```

## 사용법

### 1. 권한 체크 (Hooks)

#### 단일 권한 체크

```typescript
import { Permission, usePermission } from '@/lib/rbac';

function CreateCourseButton() {
  const canCreate = usePermission(Permission.COURSE_CREATE);

  if (!canCreate) return null;

  return <button>과정 생성</button>;
}
```

#### 여러 권한 중 하나라도 있는지 체크

```typescript
import { Permission, useAnyPermission } from '@/lib/rbac';

function CourseActions() {
  const canManage = useAnyPermission([
    Permission.COURSE_UPDATE,
    Permission.COURSE_DELETE,
  ]);

  if (!canManage) return null;

  return (
    <div>
      <button>수정</button>
      <button>삭제</button>
    </div>
  );
}
```

#### 모든 권한이 있는지 체크

```typescript
import { Permission, useAllPermissions } from '@/lib/rbac';

function AdminUserPanel() {
  const hasFullAccess = useAllPermissions([
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,
  ]);

  if (!hasFullAccess) return <p>권한이 부족합니다.</p>;

  return <div>전체 사용자 관리</div>;
}
```

### 2. 역할 체크 (Role Checks)

```typescript
import { useIsAdmin, useIsManager, useIsInstructor } from '@/lib/rbac';

function AdminOnlySection() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) return null;

  return <div>관리자 전용 섹션</div>;
}

function ManagerSection() {
  const isManager = useIsManager(); // manager OR admin

  if (!isManager) return null;

  return <div>매니저 이상 섹션</div>;
}

function InstructorSection() {
  const isInstructor = useIsInstructor(); // instructor OR manager OR admin

  if (!isInstructor) return null;

  return <div>강사 이상 섹션</div>;
}
```

### 3. 보호된 컴포넌트 (Protected Component)

#### 단일 권한

```typescript
import { Permission, ProtectedComponent } from '@/lib/rbac';

function CourseManagement() {
  return (
    <div>
      <h1>과정 관리</h1>

      <ProtectedComponent permission={Permission.COURSE_CREATE}>
        <CreateCourseButton />
      </ProtectedComponent>

      <ProtectedComponent permission={Permission.COURSE_UPDATE}>
        <EditCourseButton />
      </ProtectedComponent>
    </div>
  );
}
```

#### 여러 권한 (OR 조건)

```typescript
<ProtectedComponent
  anyPermissions={[
    Permission.COURSE_UPDATE,
    Permission.COURSE_DELETE,
  ]}
>
  <CourseActionsMenu />
</ProtectedComponent>
```

#### 모든 권한 (AND 조건)

```typescript
<ProtectedComponent
  allPermissions={[
    Permission.USER_CREATE,
    Permission.USER_MANAGE_ROLES,
  ]}
>
  <CreateAdminUserButton />
</ProtectedComponent>
```

#### 대체 컨텐츠 (Fallback)

```typescript
<ProtectedComponent
  permission={Permission.ADMIN_SETTINGS}
  fallback={<p>관리자 권한이 필요합니다.</p>}
>
  <AdminSettings />
</ProtectedComponent>
```

### 4. 함수에서 권한 체크

```typescript
import { hasPermission, isAdmin } from '@/lib/rbac';

async function deleteCourse(courseId: string, userRole: Role) {
  // 권한 체크
  if (!hasPermission(userRole, Permission.COURSE_DELETE)) {
    throw new Error('삭제 권한이 없습니다.');
  }

  // 또는 관리자만
  if (!isAdmin(userRole)) {
    throw new Error('관리자만 삭제할 수 있습니다.');
  }

  // 삭제 로직...
}
```

## 권한 목록

### 사용자 관리 (User Management)

- `USER_VIEW` - 사용자 조회
- `USER_CREATE` - 사용자 생성
- `USER_UPDATE` - 사용자 수정
- `USER_DELETE` - 사용자 삭제
- `USER_MANAGE_ROLES` - 역할 관리

### 과정 관리 (Course Management)

- `COURSE_VIEW` - 과정 조회
- `COURSE_CREATE` - 과정 생성
- `COURSE_UPDATE` - 과정 수정
- `COURSE_DELETE` - 과정 삭제
- `COURSE_MANAGE` - 과정 전체 관리

### 일정 관리 (Schedule Management)

- `SCHEDULE_VIEW` - 일정 조회
- `SCHEDULE_CREATE` - 일정 생성
- `SCHEDULE_UPDATE` - 일정 수정
- `SCHEDULE_DELETE` - 일정 삭제

### 교육생 관리 (Trainee Management)

- `TRAINEE_VIEW` - 교육생 조회
- `TRAINEE_CREATE` - 교육생 생성
- `TRAINEE_UPDATE` - 교육생 수정
- `TRAINEE_DELETE` - 교육생 삭제
- `TRAINEE_MANAGE_ATTENDANCE` - 출결 관리
- `TRAINEE_MANAGE_GRADES` - 성적 관리

### 강사 관리 (Instructor Management)

- `INSTRUCTOR_VIEW` - 강사 조회
- `INSTRUCTOR_CREATE` - 강사 생성
- `INSTRUCTOR_UPDATE` - 강사 수정
- `INSTRUCTOR_DELETE` - 강사 삭제
- `INSTRUCTOR_MANAGE_PAYMENT` - 급여 관리

### 평가 관리 (Evaluation Management)

- `EVALUATION_VIEW` - 평가 조회
- `EVALUATION_CREATE` - 평가 생성
- `EVALUATION_UPDATE` - 평가 수정
- `EVALUATION_DELETE` - 평가 삭제
- `EVALUATION_SUBMIT` - 평가 제출

### 시험 관리 (Exam Management)

- `EXAM_VIEW` - 시험 조회
- `EXAM_CREATE` - 시험 생성
- `EXAM_UPDATE` - 시험 수정
- `EXAM_DELETE` - 시험 삭제
- `EXAM_TAKE` - 시험 응시
- `EXAM_GRADE` - 시험 채점

### 리소스 관리 (Resource Management)

- `RESOURCE_VIEW` - 리소스 조회
- `RESOURCE_CREATE` - 리소스 생성
- `RESOURCE_UPDATE` - 리소스 수정
- `RESOURCE_DELETE` - 리소스 삭제
- `RESOURCE_RESERVE` - 리소스 예약

### 분석 및 리포트 (Analytics & Reports)

- `ANALYTICS_VIEW` - 분석 조회
- `ANALYTICS_EXPORT` - 분석 내보내기
- `REPORT_VIEW` - 리포트 조회
- `REPORT_CREATE` - 리포트 생성

### 시스템 관리 (System Management)

- `SYSTEM_SETTINGS` - 시스템 설정
- `SYSTEM_MONITOR` - 시스템 모니터링
- `SYSTEM_BACKUP` - 백업 관리

### 출결 관리 (Attendance)

- `ATTENDANCE_VIEW` - 출결 조회
- `ATTENDANCE_RECORD` - 출결 기록
- `ATTENDANCE_UPDATE` - 출결 수정

### 카테고리 및 과목 (Category & Subject)

- `CATEGORY_MANAGE` - 카테고리 관리
- `SUBJECT_MANAGE` - 과목 관리
- `COMMON_CODE_MANAGE` - 공통 코드 관리

## 역할별 권한

### Admin (관리자)

- 모든 권한 보유

### Manager (매니저)

- 사용자 관리 (역할 관리 제외)
- 과정, 일정, 교육생, 강사 전체 관리
- 평가, 시험 전체 관리
- 리소스 관리
- 분석 및 리포트
- 카테고리, 과목, 공통 코드 관리

### Instructor (강사)

- 과정 및 일정 조회
- 교육생 조회, 출결/성적 관리
- 평가 제출
- 시험 생성, 수정, 채점
- 리소스 조회 및 예약
- 출결 기록
- 분석 조회 (본인 수업만)

### Trainee (교육생)

- 과정 및 일정 조회
- 평가 제출
- 시험 응시
- 리소스 조회
- 본인 출결 조회

### Guest (게스트)

- 과정 조회만 가능

## 기존 코드 마이그레이션

### Before (하드코딩)

```typescript
// ❌ 하드코딩된 역할 체크
function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return null;
  }

  return <div>관리자 패널</div>;
}
```

### After (RBAC)

```typescript
// ✅ RBAC 사용
import { useIsAdmin } from '@/lib/rbac';

function AdminPanel() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return <div>관리자 패널</div>;
}

// 또는 ProtectedComponent 사용
import { ProtectedComponent } from '@/lib/rbac';

function App() {
  return (
    <ProtectedComponent permission={Permission.SYSTEM_SETTINGS}>
      <AdminPanel />
    </ProtectedComponent>
  );
}
```

## 모범 사례

1. **권한 우선**: 가능한 한 역할 체크보다 권한 체크를 사용하세요.
2. **컴포넌트 레벨 보호**: UI 컴포넌트는 `ProtectedComponent`를 사용하세요.
3. **함수 레벨 보호**: 비즈니스 로직은 `hasPermission()` 함수를 사용하세요.
4. **명확한 fallback**: 권한이 없을 때 사용자에게 명확한 피드백을 제공하세요.
5. **최소 권한 원칙**: 필요한 최소한의 권한만 요구하세요.

## 새 권한 추가하기

1. `src/lib/rbac/permissions.ts`의 `Permission` enum에 새 권한 추가
2. `ROLE_PERMISSIONS`에서 각 역할에 대한 권한 매핑 업데이트
3. 필요한 경우 새로운 헬퍼 함수 추가
4. README 업데이트

```typescript
// 1. Permission enum 업데이트
export enum Permission {
  // ... 기존 권한들
  NEW_FEATURE_VIEW = 'new_feature:view',
  NEW_FEATURE_MANAGE = 'new_feature:manage',
}

// 2. 역할별 권한 매핑 업데이트
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...allExisting, Permission.NEW_FEATURE_MANAGE],
  manager: [...existing, Permission.NEW_FEATURE_VIEW],
  // ...
};
```

## 문제 해결

### Q: 권한이 제대로 체크되지 않아요

A: `useAuth()`가 올바른 `user.role`을 반환하는지 확인하세요.

### Q: 새 권한을 추가했는데 작동하지 않아요

A: `ROLE_PERMISSIONS` 매핑에 해당 역할에 권한을 추가했는지 확인하세요.

### Q: TypeScript 에러가 발생해요

A: `Permission` enum을 import했는지, 타입 정의가 올바른지 확인하세요.
