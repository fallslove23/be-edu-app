# 시험 관리 시스템 완전판

BS Learning Management System의 확장 가능한 시험 관리 시스템입니다.

## 📋 목차

- [개요](#개요)
- [지원 시나리오](#지원-시나리오)
- [데이터 구조](#데이터-구조)
- [설치 방법](#설치-방법)
- [사용 예제](#사용-예제)
- [API 가이드](#api-가이드)

## 🎯 개요

실제 교육 환경의 다양한 시나리오를 지원하는 LMS 표준 시험 관리 시스템입니다.

### 핵심 기능

- ✅ **과정 템플릿 재사용**: "BS 영업 기초과정" 같은 과정 설계 재사용
- ✅ **차수별 운영**: "2024년 1차", "2024년 2차" 등 차수 관리
- ✅ **분반 시스템**: 같은 차수 내 A반, B반 등 분반 운영
- ✅ **유연한 시험 배정**: 템플릿/차수/분반 수준의 3-level 시험 연결
- ✅ **다중 대상 시험**: 합반, 통합 시험 지원
- ✅ **문제은행**: 문제 재사용 및 체계적 관리
- ✅ **자동 채점**: 객관식/O/X 자동 채점, 주관식 수동 채점
- ✅ **통계 및 분석**: 분반별, 차수별 성적 통계

## 🏫 지원 시나리오

### 시나리오 1: 차수당 1개 시험 (종합평가)
```
BS 영업 기초과정 2024년 1차
└── 종합평가 시험 (2024-08-15, 1회)
    └── 응시자: 1차 등록 교육생 25명
```

### 시나리오 2: 하루 여러 시험 (일일 퀴즈)
```
BS 고급 전략과정 2024년 1차
├── Day 1 Quiz (08-20, 오전 10시)
├── Day 1 실습평가 (08-20, 오후 3시)
├── Day 2 Quiz (08-21, 오전 10시)
└── 최종평가 (09-05, 오전 10시)
```

### 시나리오 3: 분반 시험 (같은 차수, 다른 반)
```
BS 영업 기초과정 2024년 3차
├── 3차 A반 (강사: 김강사, 30명)
│   └── Day 1 Quiz (매일 오전 10시)
└── 3차 B반 (강사: 이강사, 28명)
    └── Day 1 Quiz (매일 오전 11시)
```

### 시나리오 4: 통합 시험 (A+B반 동일 시험)
```
BS 영업 기초과정 2024년 3차 (A+B반)
└── 최종평가 (10-15 오전 10시)
    └── 응시자: A반 30명 + B반 28명 = 58명
```

### 시나리오 5: 합반 시험 (여러 차수 통합)
```
BS 고급 전략과정
├── 2024년 1차 (25명)
└── 2024년 2차 (30명)
    └── 공동 최종평가
        └── 응시자: 1차+2차 합계 55명
```

## 🏗️ 데이터 구조

### 계층 구조
```
Course Template (과정 템플릿)
  └── Course Session (과정 차수)
        └── Class Division (분반)
              └── Enrollment (교육생 등록)
```

### 시험 연결 구조
```
Exam (시험)
  ├── template_id (템플릿 수준 - 재사용)
  ├── session_id (차수 수준 - 차수 전체)
  ├── division_id (분반 수준 - 특정 분반)
  └── is_shared_exam (다중 대상)
        ├── target_sessions[] (여러 차수)
        └── target_divisions[] (여러 분반)
```

### 핵심 테이블

1. **course_templates**: 과정 템플릿 (재사용 가능한 과정 설계)
2. **course_sessions**: 과정 차수 (실제 운영되는 기수)
3. **class_divisions**: 분반 (같은 차수 내 분반) ⭐
4. **course_enrollments**: 교육생 등록 (차수 + 분반)
5. **question_banks**: 문제은행
6. **questions**: 문제
7. **exams**: 시험 ⭐
8. **exam_questions**: 시험-문제 연결
9. **exam_attempts**: 시험 응시 기록
10. **question_responses**: 개별 문제 응답

## 🚀 설치 방법

### 1. 데이터베이스 스키마 적용

Supabase SQL Editor에서 실행:

```sql
-- 1. 메인 스키마 생성
\i database/migrations/exam-management-schema.sql

-- 2. (선택) 샘플 데이터 삽입
\i database/migrations/exam-management-sample-data.sql
```

### 2. TypeScript 타입 확인

```typescript
// src/types/exam.types.ts 확인
import type {
  Exam,
  CourseSession,
  ClassDivision,
  ExamEligibleTrainee
} from '@/types/exam.types';
```

## 📖 사용 예제

### 1. 분반별 일일 퀴즈 생성

```typescript
// A반 Quiz (오전 10시)
const createAClassQuiz = async () => {
  const { data: division } = await supabase
    .from('class_divisions')
    .select('id')
    .eq('division_code', 'BS-SALES-101-2024-3-A')
    .single();

  const { data: exam } = await supabase
    .from('exams')
    .insert({
      title: 'Day 1 Morning Quiz',
      exam_type: 'quiz',
      division_id: division.id,  // A반만 대상
      scheduled_at: '2024-10-01 10:00:00',
      duration_minutes: 15,
      passing_score: 70.0,
      total_points: 10.0,
      max_attempts: 2,
      status: 'published'
    })
    .select()
    .single();

  return exam;
};
```

### 2. 차수 전체 최종평가 (분반 통합)

```typescript
// 3차 전체 교육생 대상
const createFinalExam = async () => {
  const { data: session } = await supabase
    .from('course_sessions')
    .select('id')
    .eq('session_code', 'BS-SALES-101-2024-3')
    .single();

  const { data: exam } = await supabase
    .from('exams')
    .insert({
      title: 'BS 영업 기초과정 최종평가',
      exam_type: 'final',
      session_id: session.id,  // 3차 전체
      scheduled_at: '2024-10-15 10:00:00',
      duration_minutes: 90,
      passing_score: 70.0,
      total_points: 100.0,
      max_attempts: 1,
      randomize_questions: true,
      status: 'published'
    })
    .select()
    .single();

  return exam;
};
```

### 3. 시험 응시 대상자 조회

```sql
-- View 사용 (간단)
SELECT *
FROM v_exam_eligible_trainees
WHERE exam_id = :exam_id
ORDER BY division_name, trainee_name;

-- 또는 직접 쿼리 (상세 제어)
WITH exam_targets AS (
    SELECT
        e.id as exam_id,
        CASE
            WHEN e.division_id IS NOT NULL THEN ARRAY[e.division_id]
            WHEN e.session_id IS NOT NULL THEN
                (SELECT array_agg(id) FROM class_divisions WHERE session_id = e.session_id)
            WHEN e.is_shared_exam AND e.target_divisions IS NOT NULL THEN
                e.target_divisions
            ELSE ARRAY[]::UUID[]
        END as target_division_ids
    FROM exams e
    WHERE e.id = :exam_id
)
SELECT DISTINCT
    u.id,
    u.name,
    u.email,
    cs.session_name,
    cd.division_name
FROM users u
INNER JOIN course_enrollments ce ON u.id = ce.trainee_id
INNER JOIN course_sessions cs ON ce.session_id = cs.id
LEFT JOIN class_divisions cd ON ce.division_id = cd.id
CROSS JOIN exam_targets et
WHERE
    ce.status = 'active'
    AND u.role = 'trainee'
    AND (
        (ce.division_id IS NOT NULL AND ce.division_id = ANY(et.target_division_ids))
        OR (ce.division_id IS NULL AND cs.id = (SELECT session_id FROM exams WHERE id = :exam_id))
    );
```

### 4. 시험 응시 전체 플로우

```typescript
// Step 1: 응시 시작
const startExam = async (examId: string, traineeId: string) => {
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .insert({
      exam_id: examId,
      trainee_id: traineeId,
      attempt_number: 1,
      started_at: new Date().toISOString(),
      status: 'in_progress'
    })
    .select()
    .single();

  return attempt;
};

// Step 2: 답안 제출
const submitExam = async (attemptId: string, answers: Record<string, any>) => {
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .update({
      submitted_at: new Date().toISOString(),
      answers: answers,
      status: 'submitted'
    })
    .eq('id', attemptId)
    .select()
    .single();

  return attempt;
};

// Step 3: 자동 채점 (객관식/O/X)
const autoGrade = async (attemptId: string) => {
  // 1. 각 문제별 채점
  const { data: responses } = await supabase
    .from('question_responses')
    .select(`
      id,
      answer,
      question:questions(id, type, correct_answer, points)
    `)
    .eq('attempt_id', attemptId);

  for (const response of responses!) {
    if (response.question.type === 'multiple_choice' ||
        response.question.type === 'true_false') {
      const isCorrect = JSON.stringify(response.answer) ===
                        JSON.stringify(response.question.correct_answer);

      await supabase
        .from('question_responses')
        .update({
          is_correct: isCorrect,
          points_earned: isCorrect ? response.question.points : 0
        })
        .eq('id', response.id);
    }
  }

  // 2. 총점 계산
  const { data: totalPoints } = await supabase
    .rpc('calculate_attempt_score', { p_attempt_id: attemptId });

  // 3. 합격 여부 판정
  const { data: exam } = await supabase
    .from('exam_attempts')
    .select('exam:exams(passing_score, total_points)')
    .eq('id', attemptId)
    .single();

  const scorePercentage = (totalPoints / exam.exam.total_points) * 100;
  const passed = scorePercentage >= exam.exam.passing_score;

  await supabase
    .from('exam_attempts')
    .update({
      score: totalPoints,
      score_percentage: scorePercentage,
      passed: passed,
      status: 'graded'
    })
    .eq('id', attemptId);
};
```

### 5. 분반별 성적 통계 조회

```sql
-- View 사용
SELECT *
FROM v_exam_statistics
WHERE exam_id = :exam_id
ORDER BY division_name;

-- 또는 직접 쿼리
SELECT
    cd.division_name,
    COUNT(DISTINCT ea.trainee_id) as total_takers,
    ROUND(AVG(ea.score), 2) as avg_score,
    COUNT(CASE WHEN ea.passed THEN 1 END) as pass_count,
    ROUND(
        COUNT(CASE WHEN ea.passed THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100,
        2
    ) as pass_rate
FROM exams e
LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.status = 'graded'
LEFT JOIN course_enrollments ce ON ea.trainee_id = ce.trainee_id
LEFT JOIN class_divisions cd ON ce.division_id = cd.id
WHERE e.id = :exam_id
GROUP BY cd.division_name;
```

## 🔍 주요 쿼리 패턴

### 교육생이 응시 가능한 시험 목록

```typescript
const getAvailableExams = async (traineeId: string) => {
  const { data } = await supabase
    .from('v_exam_eligible_trainees')
    .select(`
      exam_id,
      exam_title,
      exams (
        exam_type,
        scheduled_at,
        duration_minutes,
        passing_score,
        status
      )
    `)
    .eq('trainee_id', traineeId)
    .eq('exams.status', 'published');

  return data;
};
```

### 교육생 시험 이력

```typescript
const getTraineeExamHistory = async (traineeId: string) => {
  const { data } = await supabase
    .from('exam_attempts')
    .select(`
      attempt_number,
      score,
      score_percentage,
      passed,
      submitted_at,
      exam:exams (
        title,
        exam_type,
        session:course_sessions (session_name),
        division:class_divisions (division_name)
      )
    `)
    .eq('trainee_id', traineeId)
    .eq('status', 'graded')
    .order('submitted_at', { ascending: false });

  return data;
};
```

## 🛠️ 서비스 레이어 예제

완전한 서비스 레이어는 `src/services/exam.services.ts`에 구현 예정입니다.

```typescript
// 예제 서비스 메서드
class ExamService {
  // 시험 생성
  async createExam(data: CreateExamData): Promise<Exam> { }

  // 시험 대상자 조회
  async getEligibleTrainees(examId: string): Promise<ExamEligibleTrainee[]> { }

  // 시험 응시
  async startAttempt(examId: string, traineeId: string): Promise<ExamAttempt> { }
  async submitAttempt(attemptId: string, answers: Record<string, any>): Promise<void> { }

  // 채점
  async autoGrade(attemptId: string): Promise<void> { }
  async manualGrade(data: GradeExamAttemptData): Promise<void> { }

  // 통계
  async getExamStatistics(examId: string): Promise<ExamStatistics[]> { }
  async getTraineeHistory(traineeId: string): Promise<TraineeExamHistory[]> { }
}
```

## 📊 데이터 마이그레이션

기존 시스템에서 마이그레이션하는 경우:

1. **course_templates 생성**: 기존 courses를 템플릿으로 변환
2. **course_sessions 생성**: 기존 courses를 차수로 변환 (1:1 또는 1:N)
3. **class_divisions 생성**: 필요시 분반 정보 추가
4. **course_enrollments 업데이트**: division_id 컬럼 추가 및 데이터 연결

## ⚠️ 주의사항

1. **RLS 정책**: Production 환경에서는 반드시 RLS 정책 검토 필요
2. **인덱스**: 대용량 데이터의 경우 추가 인덱스 고려
3. **트랜잭션**: 중요한 작업(채점, 등록 등)은 트랜잭션 처리 권장
4. **타임존**: 모든 시간은 UTC 기준, UI에서 로컬 시간으로 변환
5. **JSONB 검증**: answers, options 등 JSONB 필드는 애플리케이션에서 검증 필수

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL JSONB 문서](https://www.postgresql.org/docs/current/datatype-json.html)
- [LMS 데이터 모델 Best Practices](https://en.wikipedia.org/wiki/Learning_management_system)

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**생성일**: 2025-10-24
**버전**: 1.0.0
**작성자**: BS Learning Team
