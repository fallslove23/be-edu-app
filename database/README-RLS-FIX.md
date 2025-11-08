# RLS(Row Level Security) 비활성화 가이드

Mock Authentication을 사용하는 경우 Supabase의 Row Level Security(RLS)가 데이터 입력을 차단할 수 있습니다.

## 문제 증상

- "new row violates row-level security policy" 에러 발생
- 데이터 생성, 수정, 삭제 실패
- 특히 `classrooms`, `instructor_profiles`, `subjects` 등에서 발생

## 원인

Supabase는 기본적으로 Supabase Auth를 사용하도록 설계되었으며, RLS 정책이 활성화되어 있습니다.
하지만 이 프로젝트는 **Mock Auth**(커스텀 인증)를 사용하므로 RLS 정책이 요청을 차단합니다.

## 해결 방법

### 방법 1: 모든 테이블의 RLS 비활성화 (권장)

**장점**: 간단하고 확실한 해결
**단점**: 보안 정책 없음 (개발/테스트 환경에 적합)

#### 실행 단계:

1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 다음 파일의 내용 복사:
   ```
   database/migrations/disable-rls-for-mock-auth.sql
   ```
5. 붙여넣기 후 **RUN** 버튼 클릭

#### 실행 결과:

```
NOTICE: Disabled RLS for table: users
NOTICE: Disabled RLS for table: classrooms
NOTICE: Disabled RLS for table: instructor_profiles
...
```

모든 테이블에서 `rls_enabled = false`가 표시되어야 합니다.

### 방법 2: 개별 테이블 수동 비활성화

특정 테이블에서만 문제가 발생하는 경우:

```sql
-- 강의실 테이블
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;

-- 강사 프로필 테이블
ALTER TABLE public.instructor_profiles DISABLE ROW LEVEL SECURITY;

-- 과목 테이블
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;

-- 강사-과목 매핑 테이블
ALTER TABLE public.instructor_subjects DISABLE ROW LEVEL SECURITY;
```

### 방법 3: 허용 정책 추가 (권장하지 않음)

RLS를 유지하면서 모든 작업 허용:

```sql
-- 모든 사용자에게 모든 작업 허용
CREATE POLICY "Allow all operations" ON public.classrooms
FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

**주의**: 이 방법은 RLS를 우회하는 것이므로 보안상 권장하지 않습니다.

## 확인 방법

### 1. RLS 상태 확인

```sql
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

모든 테이블에서 `rls_enabled = false`여야 합니다.

### 2. 정책 확인

```sql
SELECT
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

결과가 없어야 합니다 (정책이 모두 삭제됨).

### 3. 데이터 입력 테스트

```sql
-- 강의실 생성 테스트
INSERT INTO public.classrooms (name, location, capacity)
VALUES ('테스트 강의실', '1층', 30);

-- 성공 시 데이터 확인
SELECT * FROM public.classrooms WHERE name = '테스트 강의실';

-- 테스트 데이터 삭제
DELETE FROM public.classrooms WHERE name = '테스트 강의실';
```

## 프로덕션 환경 주의사항

**중요**: 이 설정은 개발 및 테스트 환경에만 적합합니다.

프로덕션 환경에서는:
1. Supabase Auth로 마이그레이션하거나
2. 적절한 RLS 정책을 구현해야 합니다

## 자주 발생하는 테이블

다음 테이블에서 RLS 문제가 자주 발생합니다:

- `classrooms` (강의실)
- `instructor_profiles` (강사 프로필)
- `subjects` (과목)
- `instructor_subjects` (강사-과목 매핑)
- `resources` (리소스)
- `categories` (카테고리)
- `curriculum_templates` (커리큘럼 템플릿)
- `instructor_teaching_summary` (강사 강의 집계)
- `instructor_payment_history` (강사료 지급 이력)

## 문제 해결

### 여전히 에러가 발생하는 경우:

1. **브라우저 캐시 삭제**
   - 개발자 도구(F12) → Application → Clear storage

2. **애플리케이션 재시작**
   ```bash
   # 개발 서버 재시작
   npm run dev
   ```

3. **Supabase 연결 확인**
   - `.env.local` 파일의 Supabase URL과 Key 확인
   - Supabase 대시보드에서 프로젝트 활성 상태 확인

4. **로그 확인**
   - 브라우저 콘솔(F12)에서 에러 메시지 확인
   - Supabase 대시보드 → Logs에서 데이터베이스 로그 확인

## 참고 문서

- [Supabase Row Level Security 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Mock Auth 구현 가이드](../src/contexts/AuthContext.tsx)
