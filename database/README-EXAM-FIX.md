# 시험 관리 시스템 오류 수정

## 문제 진단

시험 관리 페이지에서 다음 오류가 발생했습니다:
```
Could not find a relationship between 'exams' and 'course_sessions' in the schema cache
```

## 원인

시험 관리 스키마(`exam-management-schema.sql`)는 `course_sessions`를 "과정 차수"로 사용하도록 설계되었지만, 기존 시스템에서는 `course_sessions`가 "1일차, 2일차 등의 개별 세션"으로 사용되고 있습니다.

**기존 시스템 구조**:
- `course_templates` (과정 템플릿)
- `course_rounds` (과정 차수: 1차, 2차 등)
- `course_sessions` (개별 세션: 1일차, 2일차 등)

## 해결 방법

### 1. 코드 수정 완료 ✅

다음 파일들을 `course_rounds` 기반으로 수정했습니다:

1. **src/services/exam.services.ts**
   - `course_sessions` → `course_rounds`로 변경
   - `session_id` → `round_id`로 변경
   - 모든 쿼리 업데이트

2. **src/types/exam.types.ts**
   - `CourseSession` → `CourseRound` 인터페이스로 변경
   - `ClassDivision` 인터페이스 제거 (사용하지 않음)
   - `Exam` 인터페이스 업데이트
   - `CreateExamData` 인터페이스 업데이트

### 2. 데이터베이스 마이그레이션 필요 ⏳

**다음 SQL 스크립트를 Supabase에서 실행하세요**:

```sql
-- database/migrations/create-simple-exam-tables.sql
```

이 스크립트는 다음 테이블을 생성합니다:
- `question_banks` (문제 은행)
- `questions` (문제)
- `exams` (시험 - course_rounds 기반)
- `exam_questions` (시험-문제 연결)
- `exam_attempts` (시험 응시 기록)
- `question_responses` (문제 응답)

### 3. Supabase 스키마 캐시 새로고침 방법

#### 방법 1: Supabase Dashboard 사용
1. [Supabase Dashboard](https://app.supabase.com) 로그인
2. 프로젝트 선택
3. Settings → Database → Connection Pooling
4. "Reset pooler" 버튼 클릭

#### 방법 2: SQL 명령어 사용
```sql
-- Supabase SQL Editor에서 실행
NOTIFY pgrst, 'reload schema';
```

#### 방법 3: PostgREST 재시작 (권장)
Supabase Dashboard:
1. Settings → Database
2. "Restart PostgREST" 버튼 클릭

### 4. 검증

시험 관리 페이지 재접속하여 다음 사항 확인:
1. 오류 메시지가 사라졌는지 확인
2. 시험 목록이 정상적으로 로드되는지 확인

## 변경 사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 차수 테이블 | `course_sessions` | `course_rounds` |
| 차수 ID 컬럼 | `session_id` | `round_id` |
| 분반 지원 | 있음 (`class_divisions`) | 제거 (현재 사용 안 함) |
| 다중 대상 시험 | 지원 | 제거 (단순화) |

## 주의사항

- 기존 `course_sessions` 테이블은 삭제하지 마세요 (다른 기능에서 사용 중)
- `course_rounds` 테이블이 이미 생성되어 있는지 확인하세요
- 데이터 마이그레이션이 필요한 경우 별도 작업 필요

## 다음 단계

1. ✅ 코드 수정 완료
2. ⏳ SQL 마이그레이션 스크립트 실행 (`create-simple-exam-tables.sql`)
3. ⏳ Supabase 스키마 캐시 새로고침
4. ⏳ 시험 관리 페이지 테스트
