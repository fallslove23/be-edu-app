# 데이터베이스 문제 해결 가이드

## 현재 문제 상황
1. **RLS (Row Level Security) 정책으로 인한 데이터 접근 차단**
2. **`courses` 테이블에 `description` 컬럼 누락**
3. **테스트 데이터 부족으로 인한 빈 목록**

## 해결 방법

### 1단계: Supabase 대시보드에서 SQL 실행

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택: `sdecinmapanpmohbtdbi`

2. **SQL Editor로 이동**
   - 좌측 메뉴에서 "SQL Editor" 클릭

3. **스키마 수정 SQL 실행**
   - `database-fix-schema.sql` 파일 내용을 복사하여 실행
   - 또는 아래 핵심 명령어들을 순차적으로 실행:

```sql
-- 누락된 컬럼 추가
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS description TEXT;

-- RLS 임시 비활성화 (개발용)
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 테스트 데이터 삽입
INSERT INTO public.courses (name, description, start_date, end_date, max_trainees, status) 
VALUES 
('신입 영업사원 기초 교육', '신입 영업사원을 위한 기본 교육 과정입니다.', '2024-01-15', '2024-01-19', 20, 'active'),
('중급 영업 스킬 향상', '경력 영업사원을 위한 심화 교육 과정입니다.', '2024-02-01', '2024-02-05', 15, 'draft'),
('고객 관계 관리 전문', '고객 관계 관리 전문가 양성 과정입니다.', '2024-03-01', '2024-03-08', 25, 'active')
ON CONFLICT DO NOTHING;
```

### 2단계: 애플리케이션 테스트

스키마 수정 후 애플리케이션을 다시 실행하여 확인:

```bash
npm run dev
```

### 3단계: 데이터 확인

터미널에서 연결 테스트:

```bash
node test-db-connection.js
```

## 예상 결과

✅ **성공 시 확인되는 사항:**
- courses 테이블에 3개의 테스트 과정 데이터
- description 컬럼 접근 가능
- JOIN 쿼리 정상 작동
- 과정 목록 페이지에서 데이터 표시

❌ **여전히 문제가 있다면:**
1. Supabase 대시보드에서 테이블 구조 직접 확인
2. RLS 정책이 여전히 활성화되어 있는지 확인
3. 환경 변수(.env) 파일의 연결 정보 재확인

## 운영 환경 준비

개발이 완료되면 다음 작업 필요:
1. **RLS 정책 재활성화**
2. **적절한 권한 정책 설정**
3. **실제 사용자 인증 시스템 연동**

## 문의

문제가 계속되면 Supabase 대시보드의 Logs를 확인하거나 다음 명령어로 추가 진단:

```bash
node check-table-structure.js
```