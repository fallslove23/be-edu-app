# 🤖 AI 협업 가이드 (Claude Code & Antigravity)

이 문서는 **Claude Code**와 **Antigravity** 두 AI 에이전트를 함께 사용하여 "바이브 코딩"을 안전하고 효율적으로 수행하기 위한 가이드라인입니다.

## 🎯 역할 분담 (Role Definition)

| 에이전트 | 주요 역할 | 강점 | 권장 작업 |
| :--- | :--- | :--- | :--- |
| **Claude Code** | **Creative & Drafting** | 빠른 속도, 창의적 제안, 자연어 이해 | • UI/UX 초기 디자인 및 프로토타이핑<br>• 새로운 기능의 초안 작성<br>• 간단한 스크립트 작성<br>• "이런 느낌으로 만들어줘" 식의 요청 |
| **Antigravity** | **Engineering & Verification** | 정밀함, 복잡한 로직, 검증, 도구 사용 | • Claude Code 사용 제한 시 **작업 이어받기**<br>• 작성된 코드의 리팩토링 및 구조 개선<br>• 복잡한 버그 디버깅 및 수정<br>• 테스트 코드 작성 및 검증 |

---

## 🏃 릴레이 워크플로우 (Relay Workflow)

사용자가 **Claude Code 사용 제한** 등으로 인해 작업을 Antigravity로 넘기는 경우의 시나리오입니다. **동시 편집만 하지 않는다면 이 방식은 매우 안전하고 효율적입니다.**

### ✅ 핵심 규칙: "바통 터치"
1.  **Claude Code 중단 시**:
    *   작업하던 내용을 반드시 저장합니다.
    *   `git commit`으로 현재 상태를 박제합니다. (예: `git commit -m "save: Claude 작업 중단 (사용량 제한)"`)
2.  **Antigravity 시작 시**:
    *   제가 최신 파일을 읽을 수 있도록 "마지막으로 Claude가 어디까지 했는지" 알려주세요.
    *   예: "Claude가 `ExamForm.tsx` 만들다가 멈췄어. 이어서 완성해줘."
3.  **다시 Claude로 돌아갈 때**:
    *   저(Antigravity)의 작업이 끝나면 제가 커밋을 요청하거나 직접 커밋합니다.
    *   그 후 Claude에게 "Antigravity가 수정했으니 파일 다시 읽어봐"라고 하면 됩니다.

---

## 🤝 핸드오버 프로토콜 (Handover Protocol)

두 에이전트 간 작업을 전환할 때는 반드시 다음 절차를 따르세요.

### 1. 작업 완료 선언 (Checkpoint)
한 에이전트의 작업이 끝나면 반드시 **저장**하고 **커밋**하세요.
```bash
git add .
git commit -m "feat: Claude Code가 로그인 페이지 초안 작성"
```

### 2. 상태 동기화 (Sync)
다른 에이전트에게 작업을 넘길 때, 이전 에이전트가 무엇을 했는지 명확히 알려주세요.

**Antigravity에게 넘길 때:**
> "Claude Code가 `src/components/Login.tsx`를 수정했어. 이 파일을 읽어서 로직에 문제가 없는지 확인하고, 에러 처리를 추가해줘."

**Claude Code에게 넘길 때:**
> "Antigravity가 DB 스키마를 변경했어. `CURRENT-STATUS.md`를 참고해서 UI에 반영해줘."

### 3. 파일 재로딩 (Reload)
에이전트는 작업을 시작하기 전에 항상 최신 파일 상태를 읽어야 합니다.
*   **Antigravity**: 자동으로 파일을 읽지만, 명시적으로 `view_file`을 요청할 수 있습니다.
*   **Claude Code**: `/read` 명령어나 문맥을 통해 파일을 다시 읽도록 유도하세요.

---

## ⚠️ 충돌 방지 수칙 (Conflict Prevention)

1.  **동시 편집 절대 금지**: **가장 중요합니다.** Claude가 답을 쓰고 있는 도중에 저에게 명령을 내리거나, 그 반대의 경우만 피하면 됩니다. 한 번에 한 명의 AI만 "쓰기(Write)" 권한을 가져야 합니다.
2.  **커밋(Commit) 생활화**: AI를 교체하는 시점(Switching Point)에는 무조건 커밋을 하세요. 이것이 "세이브 포인트"가 됩니다.

---

## 📝 협업 워크플로우 예시

1.  **사용자**: "Claude, 새로운 대시보드 디자인 아이디어 3개만 제안해줘."
2.  **Claude Code**: 디자인 시안 3개 코드 생성 (`Dashboard_v1.tsx`, `v2`, `v3`)
3.  **사용자**: (마음에 드는 v2 선택) "좋아, v2로 가자. 저장해."
4.  **사용자**: `git commit -m "design: 대시보드 시안 v2 저장"`
5.  **사용자**: "Antigravity, `Dashboard_v2.tsx`를 `Dashboard.tsx`로 적용하고, 실제 데이터 연동해줘."
6.  **Antigravity**: 코드 분석, 데이터 페칭 로직 추가, 타입 정의, 에러 처리 구현.
7.  **사용자**: "완벽해. 테스트 돌려봐."

---

## 🚨 비상 복구

만약 파일이 꼬이거나 내용이 유실되었다면:
1.  즉시 작업을 중단하세요.
2.  `git status`로 현재 상태를 확인하세요.
3.  `git checkout .` 또는 `git restore <file>`로 마지막 커밋 상태로 되돌리세요.
