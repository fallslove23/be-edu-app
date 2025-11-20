# TODO: 강사 정보 동기화 구현

## 📋 작업 개요

학습 관리 시스템(SS Education Management)의 강사 정보를 평가 앱(BS Edu Feedback)으로 실시간 동기화

---

## 🎯 목표

- ✅ 강사 추가/수정/삭제 시 자동으로 평가 앱 DB에 반영
- ✅ 데이터 중복 제거 (Single Source of Truth)
- ✅ 강사 프로필 사진 포함 동기화

---

## 📝 구현 방법 (선택)

### 방법 1: Supabase Edge Functions ⭐ 추천
- **장점**: 서버 관리 불필요, 무료, Supabase 네이티브 통합
- **구현 가이드**: `SUPABASE-EDGE-FUNCTION-SYNC.md`
- **작업 시간**: 약 30분

**체크리스트**:
- [ ] Supabase CLI 설치
- [ ] Edge Function 생성 및 배포
- [ ] 평가 앱 DB에 `instructors` 테이블 생성
- [ ] 학습 관리 시스템에 `008_instructor_sync_setup.sql` 실행
- [ ] Webhook URL 및 API Key 설정
- [ ] 초기 데이터 동기화
- [ ] 테스트 및 검증

### 방법 2: Express.js 서버
- **장점**: 간단, 로컬 개발 편리
- **구현 가이드**: `VITE-SYNC-SERVER-SETUP.md`
- **작업 시간**: 약 20분

**체크리스트**:
- [ ] 평가 앱에 Express 서버 추가 (`server/index.js`)
- [ ] 평가 앱 DB에 `instructors` 테이블 생성
- [ ] 학습 관리 시스템에 `008_instructor_sync_setup.sql` 실행
- [ ] Webhook URL 및 API Key 설정
- [ ] Express 서버 실행 및 테스트
- [ ] 초기 데이터 동기화

---

## 📚 참고 문서

1. **INSTRUCTOR-PHOTO-AND-EVALUATION-INTEGRATION-PLAN.md**: 전체 계획
2. **INSTRUCTOR-SYNC-IMPLEMENTATION.md**: 상세 구현 가이드
3. **SUPABASE-EDGE-FUNCTION-SYNC.md**: Edge Functions 방식
4. **VITE-SYNC-SERVER-SETUP.md**: Express 서버 방식
5. **008_instructor_sync_setup.sql**: DB Trigger 설정

---

## 🔧 필수 설정 값

구현 시 반드시 변경해야 할 값들:

```bash
# 평가 앱
SYNC_API_KEY=your-super-secret-random-key-min-32-chars  # 강력한 랜덤 문자열 생성 필요
SUPABASE_SERVICE_ROLE_KEY=eyJ...                        # Supabase Dashboard에서 복사

# 학습 관리 시스템 (008_instructor_sync_setup.sql)
webhook_url = 'https://your-actual-url.com/api/sync/instructor'  # 평가 앱 실제 URL
api_key = 'your-super-secret-random-key-min-32-chars'            # 평가 앱과 동일한 키
```

---

## ⚠️ 주의사항

1. **API Key 보안**:
   - 최소 32자 이상 랜덤 문자열
   - 환경 변수로 관리
   - Git에 커밋 금지

2. **HTTPS 필수**:
   - 로컬 개발: `http://localhost` 가능
   - 프로덕션: 반드시 HTTPS

3. **초기 데이터 동기화**:
   - 기존 강사 데이터를 일괄 동기화하는 스크립트 실행 필요
   - `INSTRUCTOR-SYNC-IMPLEMENTATION.md` 6단계 참조

---

## 📊 우선순위

**우선순위**: 중간 (현재는 수동으로 관리 가능, 나중에 자동화하면 편의성 향상)

---

## 💡 구현 시 고려사항

- 동기화 실패 시 재시도 로직 (이미 SQL에 구현됨)
- 동기화 로그 모니터링 (`instructor_sync_log` 테이블)
- 네트워크 장애 시 대응 방안
