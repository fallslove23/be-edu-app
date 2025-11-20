# 사용자 관리 ↔ 강사 관리 연동 가이드

## 문제 해결 완료 ✅

**이슈**: 사용자 관리와 강사 관리가 서로 연동되지 않았음
**원인**: UserManagement가 Mock 데이터를 사용하고, InstructorManagement는 실제 Supabase 데이터를 사용했음
**해결**: UserManagement를 Supabase와 완전히 연동

---

## 시스템 구조

### 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Database                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  users 테이블 (공통 데이터 소스)                     │    │
│  │  - id (UUID, PK)                                    │    │
│  │  - name, email, phone                               │    │
│  │  - role (admin, instructor, trainee, ...)          │    │
│  │  - department, position                             │    │
│  │  - status, created_at, updated_at                   │    │
│  └────────────────────────────────────────────────────┘    │
│         ▲                                        ▲           │
│         │                                        │           │
└─────────┼────────────────────────────────────────┼───────────┘
          │                                        │
          │                                        │
    ┌─────┴─────────┐                    ┌────────┴──────────┐
    │ UserManagement │                    │ InstructorManagement│
    │  (사용자 관리)   │                    │    (강사 관리)        │
    └───────────────┘                    └───────────────────┘
    - 전체 사용자 조회                      - role='instructor' 조회
    - 역할별 필터링                        - instructor_profiles 조인
    - CRUD 작업                           - instructor_subjects 조인
                                          - 교육 통계 조회
```

### 핵심 차이점

| 구분 | UserManagement | InstructorManagement |
|------|---------------|---------------------|
| **데이터 범위** | 모든 사용자 (전체 role) | role='instructor'만 |
| **추가 정보** | 기본 사용자 정보 | 프로필, 과목, 통계 |
| **테이블** | users | users + instructor_profiles + instructor_subjects |
| **목적** | 사용자 계정 관리 | 강사 상세 정보 관리 |

---

## 연동 작동 방식

### 1. 사용자 관리에서 강사 생성

**UserManagement에서 강사 역할 사용자 생성 시**:

```tsx
// UserManagement.tsx의 handleSaveUser()
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: userData.email,
  password: tempPassword,
});

await supabase.from('users').insert([{
  id: authData.user.id,
  name: userData.name,
  email: userData.email,
  role: 'instructor',  // ← 강사 역할로 생성
  ...
}]);
```

**결과**:
- ✅ users 테이블에 `role='instructor'` 레코드 생성됨
- ✅ InstructorManagement가 자동으로 이 사용자를 감지하고 목록에 표시
- ⚠️ instructor_profiles는 아직 없음 → InstructorManagement에서 프로필 추가 필요

### 2. 강사 관리에서 계정 생성

**InstructorManagement에서 계정 생성 시**:

```tsx
// InstructorManagement.tsx의 handleCreateAccount()
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: userForm.email,
  password: userForm.password,
});

await supabase.from('users').insert([{
  id: authData.user.id,
  email: userForm.email,
  name: userForm.name,
  phone: userForm.phone,
  role: 'instructor',  // ← 항상 강사 역할
}]);
```

**결과**:
- ✅ users 테이블에 `role='instructor'` 레코드 생성됨
- ✅ UserManagement에서도 이 사용자를 볼 수 있음 (강사 탭에서)
- ⚠️ 마찬가지로 instructor_profiles는 별도로 추가해야 함

---

## 사용 시나리오

### 시나리오 1: 새 강사 채용

**방법 A: 사용자 관리에서 시작**
1. UserManagement → 사용자 추가 버튼 클릭
2. 역할을 "강사"로 선택하고 정보 입력
3. 저장 → users 테이블에 role='instructor'로 생성됨
4. InstructorManagement로 이동 → 새 강사가 목록에 나타남
5. 해당 강사의 "프로필 수정" 버튼 클릭
6. 강의 과목과 숙련도 설정

**방법 B: 강사 관리에서 시작** (권장)
1. InstructorManagement → 계정 생성 버튼 클릭
2. 이메일, 이름, 전화번호 입력
3. 저장 → users 테이블에 자동으로 role='instructor'로 생성됨
4. 바로 프로필 수정하여 과목 설정

### 시나리오 2: 강사 정보 수정

**기본 정보 수정** (이름, 이메일, 전화번호):
- UserManagement 또는 InstructorManagement 둘 다 가능
- 변경사항이 users 테이블에 저장되어 양쪽에서 모두 반영됨

**강사 전문 정보 수정** (과목, 프로필):
- InstructorManagement에서만 가능
- instructor_profiles, instructor_subjects 테이블 사용

### 시나리오 3: 역할 변경

**강사 → 교육생 변경**:
```sql
UPDATE users
SET role = 'trainee'
WHERE id = '...';
```

**결과**:
- ✅ UserManagement: 교육생 탭으로 이동
- ✅ InstructorManagement: 목록에서 사라짐 (role='instructor'만 표시하므로)
- ⚠️ instructor_profiles와 instructor_subjects 데이터는 남아있음 (참고용)

---

## 데이터 동기화 확인 방법

### 1. 강사 생성 후 확인

```bash
# Supabase Studio에서 실행
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  ip.id as profile_id,
  COUNT(isu.id) as subject_count
FROM users u
LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
LEFT JOIN instructor_subjects isu ON u.id = isu.instructor_id
WHERE u.role = 'instructor'
GROUP BY u.id, ip.id
ORDER BY u.name;
```

**예상 결과**:
- UserManagement에서 생성한 강사: profile_id NULL, subject_count 0
- InstructorManagement에서 프로필 설정 후: profile_id 존재, subject_count > 0

### 2. 실시간 동기화 테스트

**단계**:
1. 브라우저 탭 2개 열기
   - 탭 1: `/admin/users` (UserManagement)
   - 탭 2: `/admin/instructors` (InstructorManagement)

2. 탭 2에서 새 강사 계정 생성
3. 탭 1에서 "강사" 탭 클릭 → 새 강사가 나타나는지 확인

4. 탭 1에서 강사 이름 수정
5. 탭 2 새로고침 → 수정된 이름이 반영되는지 확인

---

## 문제 해결

### 문제 1: 강사가 UserManagement에는 있는데 InstructorManagement에는 없음

**원인**: role이 'instructor'가 아닐 수 있음

**해결**:
```sql
-- Supabase Studio에서 확인
SELECT id, name, email, role
FROM users
WHERE email = '강사이메일@example.com';

-- role이 다르면 수정
UPDATE users
SET role = 'instructor'
WHERE id = '...';
```

### 문제 2: InstructorManagement에는 있는데 UserManagement에는 없음

**원인**: UserManagement가 여전히 Mock 데이터를 사용하고 있을 수 있음

**해결**:
- 브라우저 캐시 클리어
- 페이지 새로고침 (Ctrl+Shift+R)
- UserManagement.tsx가 올바르게 수정되었는지 확인

### 문제 3: 프로필 정보가 없는 강사

**원인**: users 테이블에는 있지만 instructor_profiles에는 없음

**해결**:
1. InstructorManagement로 이동
2. 해당 강사 찾기
3. "프로필 수정" 버튼 클릭
4. 과목과 프로필 정보 입력 후 저장

---

## 주요 변경 사항

### UserManagement.tsx 수정 내역

**변경 전** (Mock 데이터):
```tsx
useEffect(() => {
  const mockUsers: User[] = [ /* 하드코딩된 데이터 */ ];
  setUsers(mockUsers);
}, []);
```

**변경 후** (Supabase 연동):
```tsx
useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  setUsers(data || []);
};
```

**주요 함수 수정**:
- ✅ `loadUsers()`: Supabase에서 데이터 로드
- ✅ `handleSaveUser()`: Supabase Auth + users 테이블 삽입/수정
- ✅ `handleBulkImport()`: Supabase에 일괄 저장
- ✅ 로딩/에러 상태 추가

---

## 테스트 체크리스트

- [ ] UserManagement에서 강사 생성 → InstructorManagement에 나타남
- [ ] InstructorManagement에서 계정 생성 → UserManagement 강사 탭에 나타남
- [ ] UserManagement에서 강사 이름 수정 → InstructorManagement에 반영
- [ ] InstructorManagement에서 기본 정보 수정 → UserManagement에 반영
- [ ] InstructorManagement에서 프로필/과목 추가 → 정상 동작
- [ ] 역할 변경 시 올바른 탭으로 이동
- [ ] 삭제 시 양쪽에서 모두 사라짐

---

## 추가 개선 사항 (선택)

### 1. 실시간 업데이트 (Realtime Subscription)

현재는 페이지 새로고침 필요. 실시간 업데이트를 위해:

```tsx
// UserManagement.tsx에 추가
useEffect(() => {
  const subscription = supabase
    .channel('users-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      () => {
        loadUsers(); // 자동 새로고침
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 2. 강사 생성 시 자동 프로필 생성

```tsx
// InstructorManagement.tsx의 handleCreateAccount()에 추가
await instructorProfileService.create({
  user_id: authData.user.id,
  bio: '',
});
```

### 3. 역할 변경 시 경고

```tsx
// 강사 → 다른 역할 변경 시
if (oldRole === 'instructor' && newRole !== 'instructor') {
  alert('⚠️ 강사 프로필과 과목 정보는 유지됩니다.');
}
```

---

## 요약

✅ **완료된 작업**:
- UserManagement를 Mock 데이터에서 Supabase 실제 데이터로 변경
- 사용자 생성/수정/조회가 users 테이블과 완전히 연동됨
- InstructorManagement와 같은 데이터 소스 사용

✅ **연동 원리**:
- 양쪽 모두 `users` 테이블을 공통 데이터 소스로 사용
- InstructorManagement는 `role='instructor'` 필터 적용
- 추가 정보(프로필, 과목)는 InstructorManagement에서만 관리

✅ **사용 방법**:
- 새 강사: InstructorManagement에서 계정 생성 → 프로필 설정 (권장)
- 또는 UserManagement에서 강사 역할로 생성 → InstructorManagement에서 프로필 추가
- 기본 정보 수정: 양쪽 어디서나 가능, 자동 동기화됨

---

**마지막 업데이트**: 2025년
**상태**: ✅ 연동 완료
