# 📚 BS Learning App - 프로젝트 정보

## 🎯 메인 개발 프로젝트

**위치**: `/Users/choihyodong/bs-learning-app-main`

이 프로젝트가 **유일한 공식 개발 프로젝트**입니다.

## ⚠️ 중요!

### ✅ 사용할 프로젝트
- **`/Users/choihyodong/bs-learning-app-main`** - 메인 프로젝트

### ❌ 사용하지 말 것
- `~/bs-edu-app-OLD-BACKUP` - 오래된 백업
- Desktop의 다른 BS 폴더들 - 모두 삭제됨

## 🚀 개발 서버 실행

```bash
cd /Users/choihyodong/bs-learning-app-main
npm run dev
```

## 📊 프로젝트 정보

- **프레임워크**: Next.js 15.5.4
- **React**: 19.1.1
- **UI 라이브러리**:
  - Heroicons
  - Headless UI
  - Tailwind CSS
- **상태 관리**: Zustand
- **데이터**: Supabase
- **최종 수정**: 2025-10-24
- **아키텍처**: Next.js App Router + src 폴더 구조

## 📁 프로젝트 구조

```
bs-learning-app-main/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지 (App.tsx 임포트)
├── src/                    # 애플리케이션 소스
│   ├── App.tsx            # 메인 앱 로직
│   ├── components/        # React 컴포넌트
│   ├── services/          # API 서비스 (Supabase)
│   ├── types/             # TypeScript 타입 정의
│   ├── contexts/          # React Context
│   ├── hooks/             # Custom Hooks
│   └── utils/             # 유틸리티 함수
├── database/              # DB 마이그레이션 스키마
├── public/                # 정적 파일 (아이콘, 매니페스트)
└── archive/               # 레거시 파일 아카이브
```

## 🔧 다음 작업 시

Claude Code 실행 시 반드시 이 폴더로 이동:
```bash
cd /Users/choihyodong/bs-learning-app-main
```

---

## 🔄 마이그레이션 히스토리

### 2025-10-24: Vite → Next.js 완전 전환
- ✅ Vite 관련 파일 제거 (main.tsx, index.html 등)
- ✅ TypeScript 설정을 Next.js 전용으로 재작성
- ✅ 빌드 테스트 성공
- 📦 레거시 파일은 `archive/vite-legacy/`에 보관

---

**생성일**: 2025-10-23
**최종 업데이트**: 2025-10-24
**작성자**: Claude Code
