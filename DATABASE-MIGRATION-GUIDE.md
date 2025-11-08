# 데이터베이스 마이그레이션 가이드

## 현재 상태

코드는 이미 `course_rounds` 기반으로 수정되었지만, 데이터베이스 스키마가 아직 업데이트되지 않았습니다.

## 마이그레이션 순서

### 1단계: 시험 테이블 스키마 수정 (필수)

Supabase Dashboard → SQL Editor에서 다음 파일 실행:

```bash
database/migrations/fix-exams-table-schema.sql
```

이 스크립트는:
- `exams` 테이블의 `session_id` → `round_id`로 변경
- `division_id` 컬럼 제거 (미사용)
- 필요한 인덱스 생성

### 2단계: PostgREST 스키마 캐시 새로고침 (필수)

Supabase Dashboard → SQL Editor에서 실행:

```sql
NOTIFY pgrst, 'reload schema';
```

또는 Supabase Dashboard → Settings → Database → "Restart PostgREST" 버튼 클릭

### 3단계: 애플리케이션 테스트

브라우저에서:
1. F5로 페이지 새로고침
2. 시험 관리 페이지 이동
3. 콘솔 확인 (F12 → Console)
4. 이전 오류 메시지가 사라졌는지 확인

## 예상되는 결과

### 성공 시
```
[ExamService] ✅ 시험 목록 조회 성공: 0 개
```

### 실패 시 (마이그레이션 안 됨)
```
❌ Error: Could not find a relationship between 'exams' and 'course_sessions' in the schema cache
```

## 문제 해결

### 문제 1: "relation exams does not exist"
- 원인: exams 테이블이 아직 생성되지 않음
- 해결: `database/migrations/create-simple-exam-tables.sql` 먼저 실행

### 문제 2: "foreign key violation"
- 원인: course_rounds 테이블에 해당 ID가 없음
- 해결: 시험 생성 시 유효한 course_round를 선택하거나, course_rounds 데이터 먼저 추가

### 문제 3: 스키마 캐시가 업데이트 안 됨
- 해결: PostgREST 재시작 (Settings → Database → Restart PostgREST)

## 추가 문서

- [database/README-EXAM-SCHEMA-FIX.md](./database/README-EXAM-SCHEMA-FIX.md) - 상세 스키마 수정 가이드
- [database/README-EXAM-FIX.md](./database/README-EXAM-FIX.md) - 전체 시험 시스템 수정 내역
- [database/migrations/fix-exams-table-schema.sql](./database/migrations/fix-exams-table-schema.sql) - 마이그레이션 스크립트

## 주의사항

- 기존 `course_sessions` 테이블은 삭제하지 마세요 (다른 기능에서 사용 중)
- 프로덕션 환경이라면 백업 먼저 수행
- 마이그레이션 후 반드시 테스트 수행

## 완료 체크리스트

- [ ] fix-exams-table-schema.sql 실행
- [ ] PostgREST 스키마 캐시 새로고침
- [ ] 브라우저 새로고침 (F5)
- [ ] 시험 관리 페이지 테스트
- [ ] 콘솔 오류 메시지 확인
- [ ] 시험 생성/편집 테스트
