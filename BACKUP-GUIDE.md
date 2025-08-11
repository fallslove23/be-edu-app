# 🛡️ 백업 사용법 - 빠른 가이드

## 📱 상황별 백업 사용법

### 🔥 급하게 현재 상태 저장하고 싶을 때
```bash
npm run backup:quick
```

### 📦 완전한 백업 만들기
```bash
npm run backup
```

### ⭐ 중요한 작업 전 체크포인트 만들기
```bash
npm run create-checkpoint
```

## 🔄 복원하기

### 1️⃣ 백업 목록 보기
```bash
npm run restore
```

### 2️⃣ 특정 백업으로 돌아가기
```bash
npm run restore backup-이름
```

## 🚨 긴급 상황 대처법

### 프로젝트가 망가졌을 때
1. **현재 상태를 일단 백업** (혹시 모르니까)
   ```bash
   npm run backup:quick
   ```

2. **최근 백업으로 복원**
   ```bash
   npm run restore
   # 목록에서 원하는 백업명을 확인 후
   npm run restore backup-2024-XX-XX-XX-XX-XX
   ```

3. **복원 후 패키지 재설치** (필요시)
   ```bash
   npm install
   npm run dev
   ```

### 실수로 중요한 파일을 삭제했을 때
1. **즉시 백업부터 만들기**
   ```bash
   npm run backup:quick
   ```

2. **최근 백업에서 파일 복사**
   - `project-backups/` 폴더에서 최근 백업 확인
   - 삭제된 파일만 수동으로 복사

## 💡 백업 관리 팁

- **정기 백업**: 작업 시작 전에 `npm run create-checkpoint`
- **실험 전**: 새로운 기능 개발 전에 `npm run backup`
- **백업 확인**: `project-backups/` 폴더 정기 확인
- **자동 정리**: 시스템이 자동으로 최근 10개만 보관

## 📁 백업 파일 위치
```
project-backups/
├── backup-2024-01-15T10-30-00/     # 전체 백업
├── backup-2024-01-15T11-15-00-quick/ # 빠른 백업
└── README.md                        # 상세 설명
```

---
**🔔 기억하세요**: 백업은 자주 할수록 좋습니다. 의심스러운 작업 전에는 꼭 백업을 만드세요!