#!/bin/bash

# 데이터베이스 마이그레이션 실행 스크립트

set -e

echo "🚀 데이터베이스 마이그레이션 시작..."
echo ""

# .env.local에서 DATABASE_URL 읽기
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL이 설정되지 않았습니다."
  echo "   .env.local 파일에 DATABASE_URL을 설정해주세요."
  exit 1
fi

echo "📊 연결: $DATABASE_URL"
echo ""

# 마이그레이션 파일 목록
MIGRATION_FILES=(
  "000_schema_migrations_table.sql"
  "006_resource_integration.sql"
)

# 각 마이그레이션 실행
for file in "${MIGRATION_FILES[@]}"; do
  filepath="database/migrations/$file"

  if [ -f "$filepath" ]; then
    echo "▶️  실행 중: $file"
    psql "$DATABASE_URL" -f "$filepath"

    if [ $? -eq 0 ]; then
      echo "✅ 완료: $file"
      echo ""
    else
      echo "❌ 실패: $file"
      exit 1
    fi
  else
    echo "⚠️  파일 없음: $filepath"
  fi
done

echo "🎉 모든 마이그레이션이 완료되었습니다!"
