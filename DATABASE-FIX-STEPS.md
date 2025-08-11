# 데이터베이스 문제 해결 단계별 가이드

## 🚨 현재 오류
```
ERROR: 42703: column "max_trainees" of relation "courses" does not exist
```

## 📋 해결 순서

### 1단계: 컬럼 추가
**파일**: `step1-fix-columns.sql`

Supabase SQL Editor에서 실행:
```sql
-- courses 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'courses'
ORDER BY ordinal_position;

-- 누락된 컬럼들 추가
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 20;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS current_trainees INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### 2단계: RLS 비활성화
**파일**: `step2-disable-rls.sql`

```sql
-- RLS 비활성화
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_curriculum DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### 3단계: 테스트 데이터 삽입 (3가지 옵션)

#### 옵션 1: 기본 버전 `step3-insert-test-data.sql`
- 과정 + 사용자 데이터 (UUID 자동 생성)

#### 옵션 2: 대안 버전 `step3-alternative-insert.sql`  
- gen_random_uuid() 사용

#### 옵션 3: 최소 버전 `step3-minimal-insert.sql` ⭐ **추천**
- 과정 데이터만 삽입 (가장 안전)

**추천 방법**: `step3-minimal-insert.sql` 먼저 실행
```sql
INSERT INTO public.courses (name, description, start_date, end_date, max_trainees, status) 
VALUES 
('신입 영업사원 기초 교육', '신입 영업사원을 위한 기본 교육 과정입니다.', '2024-01-15', '2024-01-19', 20, 'active'),
('중급 영업 스킬 향상', '경력 영업사원을 위한 심화 교육 과정입니다.', '2024-02-01', '2024-02-05', 15, 'draft'),
('고객 관계 관리 전문', '고객 관계 관리 전문가 양성 과정입니다.', '2024-03-01', '2024-03-08', 25, 'active');
```

## ✅ 실행 방법

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: `sdecinmapanpmohbtdbi`
3. **SQL Editor 이동**: 좌측 메뉴 클릭
4. **단계별 실행**: 
   - `step1-fix-columns.sql` → `step2-disable-rls.sql` → `step3-insert-test-data.sql`

## 🔍 각 단계별 확인사항

### 1단계 완료 후
- `courses` 테이블에 6개 이상의 컬럼 존재 확인
- `description`, `max_trainees` 컬럼 추가 확인

### 2단계 완료 후  
- 모든 테이블의 `rowsecurity = false` 확인

### 3단계 완료 후
- `courses`: 3개 데이터
- `users`: 3개 데이터

## 🎯 최종 확인

모든 단계 완료 후 애플리케이션에서:
```bash
npm run dev
```

**예상 결과**:
- ✅ 과정 목록에 3개 과정 표시
- ✅ 오류 메시지 없음
- ✅ 커리큘럼/일정 관리 버튼 정상 작동

## 🆘 문제 발생 시

각 단계에서 오류가 발생하면:
1. 오류 메시지 전체 복사
2. 해당 단계의 확인 쿼리 실행
3. 결과와 함께 문의