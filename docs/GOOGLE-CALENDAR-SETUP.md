# 구글 캘린더 연동 설정 가이드

BS 학습 관리 앱에서 구글 캘린더 연동 기능을 사용하기 위한 설정 가이드입니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단의 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름 입력 (예: BS Learning App)
5. "만들기" 클릭

### 1.2 Calendar API 활성화

1. 좌측 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. 검색창에 "Google Calendar API" 입력
3. "Google Calendar API" 선택
4. "사용" 버튼 클릭

### 1.3 OAuth 2.0 클라이언트 ID 생성

1. 좌측 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 선택
2. 상단의 "+ 사용자 인증 정보 만들기" 클릭
3. "OAuth 클라이언트 ID" 선택

#### 동의 화면 구성 (처음 한 번만)

1. "동의 화면 구성" 버튼 클릭
2. 사용자 유형: "외부" 선택
3. "만들기" 클릭
4. 앱 정보 입력:
   - 앱 이름: BS Learning App
   - 사용자 지원 이메일: 본인 이메일
   - 승인된 도메인: localhost:3000 (개발 시)
   - 개발자 연락처 정보: 본인 이메일
5. "저장 후 계속" 클릭
6. 범위 추가:
   - "범위 추가 또는 삭제" 클릭
   - "https://www.googleapis.com/auth/calendar.events" 검색 후 선택
   - "업데이트" 클릭
7. "저장 후 계속" 클릭
8. 테스트 사용자 추가 (선택사항)
9. "저장 후 계속" 클릭

#### OAuth 클라이언트 ID 생성

1. 애플리케이션 유형: "웹 애플리케이션" 선택
2. 이름: BS Learning App
3. 승인된 JavaScript 원본:
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://yourdomain.com`
4. 승인된 리디렉션 URI:
   - 개발: `http://localhost:3000/api/auth/google/callback`
   - 프로덕션: `https://yourdomain.com/api/auth/google/callback`
5. "만들기" 클릭
6. 클라이언트 ID와 클라이언트 보안 비밀번호 복사

## 2. 환경 변수 설정

`.env.local` 파일에 다음 내용 추가:

```env
# Google Calendar API 환경 변수
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

**중요**:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: 클라이언트 ID (공개 가능)
- `GOOGLE_CLIENT_SECRET`: 클라이언트 보안 비밀번호 (**절대 공개하지 마세요**)

## 3. 앱에서 연동하기

1. 앱 실행 후 "일정 관리" 메뉴 접속
2. "구글 캘린더 연동" 섹션에서 "구글 캘린더 연동" 버튼 클릭
3. 구글 로그인 팝업에서 계정 선택
4. 권한 허용
5. 연동 완료!

## 4. 기능

### 지원되는 기능

- ✅ 구글 캘린더에서 일정 가져오기
- ✅ 로컬 일정을 구글 캘린더로 내보내기
- ✅ 실시간 동기화
- ✅ 양방향 동기화

### 사용 방법

1. **수동 동기화**: "지금 동기화" 버튼 클릭
2. **자동 동기화**: 일정 생성/수정 시 자동으로 구글 캘린더에 반영
3. **연동 해제**: "연동 해제" 버튼으로 언제든 연동 해제 가능

## 5. 문제 해결

### 인증 오류

- 클라이언트 ID와 Secret이 올바른지 확인
- 리디렉션 URI가 정확히 일치하는지 확인
- Google Cloud Console에서 Calendar API가 활성화되어 있는지 확인

### 토큰 만료

- "다시 연동해주세요" 메시지가 나타나면 연동 해제 후 다시 연동

### 동기화 안됨

- 네트워크 연결 확인
- 구글 캘린더 권한 확인
- 브라우저 콘솔에서 에러 로그 확인

## 6. 보안 주의사항

1. **절대 공개하지 말 것**:
   - `GOOGLE_CLIENT_SECRET`
   - 액세스 토큰
   - 리프레시 토큰

2. **Git 커밋 시 주의**:
   - `.env.local` 파일은 `.gitignore`에 포함되어 있음
   - 실수로 커밋하지 않도록 주의

3. **프로덕션 배포 시**:
   - 환경 변수를 서버 환경에 안전하게 설정
   - HTTPS 사용 필수

## 7. API 사용량 제한

Google Calendar API 무료 할당량:
- 하루 100만 요청
- 사용자당 100초에 100요청

일반적인 사용에는 충분하지만, 대규모 동기화 시 주의 필요.

## 8. 참고 자료

- [Google Calendar API 문서](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
