# 데이터베이스 스키마 업데이트 가이드

## 📋 개요
과정 생성 폼에 새로운 필드들을 추가했습니다. 최적의 사용을 위해 데이터베이스에 해당 컬럼들을 추가해주세요.

## 🆕 추가된 필드
- **교육 연도** (`education_year`): 교육이 진행되는 연도
- **차수** (`cohort`): 동일 연도 내 과정 차수 (1차, 2차 등)
- **입과생 수** (`enrollment_count`): 실제 교육 시작 시 입과한 학생 수

## 🔧 Supabase 데이터베이스 컬럼 추가 방법

### 1단계: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (sdecinmapanpmohbtdbi)
3. 좌측 메뉴에서 **"SQL Editor"** 클릭

### 2단계: SQL 실행
아래 SQL을 SQL Editor에서 실행하세요:

```sql
-- 과정 테이블에 새 컬럼 추가
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS education_year INTEGER,
ADD COLUMN IF NOT EXISTS cohort INTEGER,
ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;

-- 기존 데이터에 기본값 설정
UPDATE public.courses 
SET 
  education_year = COALESCE(education_year, EXTRACT(YEAR FROM start_date)),
  cohort = COALESCE(cohort, 1),
  enrollment_count = COALESCE(enrollment_count, current_trainees)
WHERE education_year IS NULL OR cohort IS NULL OR enrollment_count IS NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.courses.education_year IS '교육 연도';
COMMENT ON COLUMN public.courses.cohort IS '차수';
COMMENT ON COLUMN public.courses.enrollment_count IS '입과생 수 (실제 수강생 수)';
```

### 3단계: 실행 결과 확인
SQL 실행 후 아래 쿼리로 확인:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND column_name IN ('education_year', 'cohort', 'enrollment_count')
ORDER BY column_name;
```

## 📝 현재 상태

### ✅ 완료된 작업
- 과정 생성 폼에 새 필드 추가
- UI/UX 개선 (교육 기본 정보 섹션)
- 폼 검증 로직 추가
- 임시 처리 로직 (description에 정보 포함)

### ⏳ 데이터베이스 컬럼 추가 전 동작
- 새 필드 정보가 `description` 필드에 포함되어 저장됩니다
- 예: "[교육정보] 2024년 1차 | 입과생: 20명"
- 기능은 정상 작동하지만 데이터 구조상 최적화되지 않은 상태

### ✨ 데이터베이스 컬럼 추가 후 동작
- 각 필드가 독립적인 컬럼에 저장
- 정확한 데이터 타입 및 검증
- 향후 통계 및 필터링 기능 구현 시 유리

## 🚀 사용 방법

### 새 과정 생성하기
1. 과정 관리 페이지에서 "새 과정 생성" 버튼 클릭
2. **교육 기본 정보** 섹션에서:
   - **교육 연도**: 2024 (현재 연도가 기본값)
   - **차수**: 1 (1차가 기본값)
   - **입과생 수**: 실제 입과한 학생 수 입력
3. 나머지 정보 입력 후 생성

### 예시
```
과정명: 신입사원 기초 교육
교육 연도: 2024
차수: 2
입과생 수: 25
시작일: 2024-09-01
종료일: 2025-02-28 (1.5년)
최대 수강 인원: 30
```

## 🔍 문제 해결

### 컬럼 추가 실패 시
1. **권한 확인**: Supabase 프로젝트의 소유자 권한이 있는지 확인
2. **SQL 오류**: 각 SQL 문을 하나씩 실행해보세요
3. **대안**: Table Editor에서 수동으로 컬럼 추가
   - Tables > courses 테이블 선택
   - "Add Column" 버튼으로 수동 추가

### 폼 오류 시
- 브라우저 캐시 삭제 후 새로고침
- 개발자 도구에서 콘솔 오류 확인
- 필수 필드가 모두 입력되었는지 확인

## 📞 지원
문제가 지속되면 개발팀에 문의하세요.