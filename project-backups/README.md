# 📦 프로젝트 백업 시스템

BS 학습 관리 앱의 백업 및 복원 시스템입니다.

## 🚀 빠른 시작

### 백업 생성

```bash
# 전체 백업 (src, public, scripts 디렉토리 포함)
npm run backup

# 빠른 백업 (중요 설정 파일 + 핵심 소스코드만)
npm run backup:quick

# Git 커밋과 함께 체크포인트 생성
npm run create-checkpoint
```

### 백업 복원

```bash
# 사용 가능한 백업 목록 보기
npm run restore

# 특정 백업 복원
npm run restore backup-2024-01-15T10-30-00
```

## 📋 백업 내용

### 전체 백업 (npm run backup)
- **설정 파일**: package.json, tsconfig.json, vite.config.ts 등
- **전체 소스코드**: src/ 디렉토리 전체
- **정적 파일**: public/ 디렉토리
- **스크립트**: scripts/ 디렉토리

### 빠른 백업 (npm run backup:quick)
- **설정 파일**: package.json, tsconfig.json, vite.config.ts 등
- **핵심 소스코드**:
  - src/components/ (모든 React 컴포넌트)
  - src/types/ (타입 정의)
  - src/contexts/ (React Context)
  - src/config/ (설정)
  - src/services/ (API 서비스)
  - src/hooks/ (커스텀 훅)

## 📁 백업 파일 구조

```
project-backups/
├── backup-2024-01-15T10-30-00/
│   ├── backup-info.json      # 백업 정보
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── types/
│   │   └── ...
│   └── ...
└── README.md
```

## 🔧 고급 사용법

### 1. 개발 전 체크포인트 생성
```bash
# 중요한 작업 시작 전에 실행
npm run create-checkpoint
```

### 2. 수동 Git 커밋
```bash
# 현재 상태를 Git에 저장
npm run save-progress
```

### 3. 백업 정보 확인
각 백업 디렉토리의 `backup-info.json`에서 백업 세부 정보를 확인할 수 있습니다:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "type": "quick",
  "files": ["package.json", "tsconfig.json", ...],
  "directories": ["src/components", "src/types", ...],
  "description": "빠른 백업 - 2024. 1. 15. 오후 7:30:00"
}
```

## 🗑️ 백업 관리

- **자동 정리**: 최근 10개 백업만 자동으로 보관
- **수동 삭제**: 필요시 `project-backups/` 디렉토리에서 직접 삭제 가능

## ⚠️ 주의사항

1. **복원 전 현재 상태 백업**: 복원 실행 시 자동으로 현재 상태를 백업합니다.
2. **node_modules 제외**: 백업에서 node_modules는 제외됩니다. 복원 후 `npm install` 실행이 필요할 수 있습니다.
3. **환경 변수**: .env 파일들은 백업되지 않으므로 별도로 관리해주세요.

## 🆘 문제 해결

### 백업이 실패하는 경우
```bash
# 권한 확인
ls -la project-backups/

# 디스크 용량 확인
df -h
```

### 복원이 실패하는 경우
```bash
# 백업 무결성 확인
ls -la project-backups/backup-이름/

# 수동 복원
cp -r project-backups/backup-이름/* .
```

## 📞 지원

백업 시스템 관련 문제가 발생하면 개발팀에 문의해주세요.