# 406 에러 해결 가이드

## 🔍 문제 원인

브라우저에서 Supabase API 호출 시 **406 (Not Acceptable)** 에러가 발생하는 이유:

1. **RLS(Row Level Security) 활성화**: 테이블에 RLS가 활성화되어 있지만 적절한 정책이 없음
2. **인증 상태 불일치**: 브라우저에서 인증되지 않은 상태로 요청
3. **정책 미설정**: RLS는 활성화되어 있지만 anon 키에 대한 정책이 없음

## ✅ 해결 방법

### 방법 1: Supabase Dashboard에서 RLS 비활성화 (권장 - 개발 환경)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **Table Editor 이동**
   - 왼쪽 메뉴에서 "Table Editor" 클릭

3. **각 테이블의 RLS 비활성화**

   다음 테이블들의 RLS를 비활성화하세요:
   - `users`
   - `instructors`
   - `instructor_certifications`
   - `instructor_teaching_subjects`
   - `courses`
   - `course_enrollments`
   - `course_schedules`
   - `course_attendance`

   **방법**:
   - 테이블 선택 → 상단의 "⚙️" (설정) 아이콘 클릭
   - "Enable Row Level Security (RLS)" 토글을 **OFF**로 변경
   - "Save" 클릭

### 방법 2: SQL Editor에서 일괄 비활성화

1. **SQL Editor 접속**
   - Supabase Dashboard → "SQL Editor" 클릭

2. **스크립트 실행**

   `database/disable-all-rls.sql` 파일의 내용을 복사하여 실행:

   ```sql
   -- 기존 RLS 정책 모두 삭제
   DO $$
   DECLARE
     r RECORD;
   BEGIN
     FOR r IN (
       SELECT schemaname, tablename, policyname
       FROM pg_policies
       WHERE schemaname = 'public'
     ) LOOP
       EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
         r.policyname, r.schemaname, r.tablename);
     END LOOP;
   END $$;

   -- 모든 테이블의 RLS 비활성화
   DO $$
   DECLARE
     r RECORD;
   BEGIN
     FOR r IN (
       SELECT schemaname, tablename
       FROM pg_tables
       WHERE schemaname = 'public'
         AND rowsecurity = true
     ) LOOP
       EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY',
         r.schemaname, r.tablename);
     END LOOP;
   END $$;
   ```

3. **"RUN" 버튼 클릭**

### 방법 3: CLI로 실행 (psql 사용 시)

터미널에서 다음 명령어 실행:

```bash
# 환경 변수 설정
export DATABASE_URL="your-supabase-connection-string"

# RLS 비활성화 스크립트 실행
psql "$DATABASE_URL" -f database/disable-all-rls.sql
```

## 🔄 확인 방법

### 1. SQL Editor에서 확인

```sql
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

모든 테이블의 `rls_enabled`가 `false`여야 합니다.

### 2. 브라우저에서 확인

1. 개발 서버 재시작:
   ```bash
   # Ctrl+C로 현재 서버 중지
   npm run dev
   ```

2. 브라우저에서 http://localhost:3000 접속

3. 개발자 도구(F12) → Console 탭 확인
   - 406 에러가 사라져야 함
   - 데이터가 정상적으로 로드되어야 함

## ⚠️ 주의사항

### 개발 환경
- ✅ RLS 비활성화 권장
- ✅ 빠른 개발과 테스트 가능
- ✅ Mock 인증 사용 가능

### 프로덕션 환경
- ❌ RLS 반드시 활성화 필요
- ❌ 비활성화 시 보안 위험
- ✅ 적절한 RLS 정책 설정 필요

## 🚀 다음 단계

RLS 비활성화 후:

1. **브라우저 새로고침** (Ctrl+Shift+R 또는 Cmd+Shift+R)
2. **캐시 클리어** (필요시)
3. **개발 서버 재시작** (필요시)
4. **테스트 진행**

## 📋 문제가 계속되는 경우

1. **Supabase 연결 확인**
   ```bash
   # 환경 변수 확인
   cat .env.local | grep SUPABASE
   ```

2. **네트워크 탭 확인**
   - 개발자 도구 → Network 탭
   - 실제 에러 메시지 확인

3. **Supabase Logs 확인**
   - Supabase Dashboard → "Logs" 메뉴
   - API 요청 로그 확인

## 📚 추가 정보

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 문서](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
