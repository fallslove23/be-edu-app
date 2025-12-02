#!/bin/bash

# BS Learning App 배포 스크립트

echo "📦 변경사항을 Git에 커밋하고 Vercel에 배포합니다..."
echo ""

# 커밋 메시지 입력
if [ -z "$1" ]; then
  echo "❌ 사용법: ./deploy.sh \"커밋 메시지\""
  echo "예시: ./deploy.sh \"버튼 스타일 수정\""
  exit 1
fi

COMMIT_MESSAGE="$1"

# Git 상태 확인
echo "📋 현재 변경사항:"
git status --short
echo ""

# Git에 커밋
echo "💾 Git 커밋 중..."
git add .
git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# GitHub에 푸시
echo "📤 GitHub에 푸시 중..."
git push origin main

# Vercel에 배포
echo "🚀 Vercel 프로덕션 배포 중..."
vercel --prod --yes

echo ""
echo "✅ 배포 완료!"
echo "🌐 배포 URL 확인: vercel ls"
