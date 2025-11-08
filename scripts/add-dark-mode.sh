#!/bin/bash

# 다크모드 클래스 자동 추가 스크립트
# 주의: 이 스크립트는 자동으로 파일을 수정합니다. 백업을 권장합니다.

COMPONENTS_DIR="/Users/choihyodong/bs-learning-app-main/src/components"

echo "🌙 다크모드 클래스 자동 추가 시작..."

# 파일 카운터
total=0
modified=0

# 모든 .tsx 파일 찾기
while IFS= read -r file; do
  ((total++))

  # 임시 파일 생성
  tmp_file="${file}.tmp"

  # 변경 사항이 있는지 확인
  changed=false

  # 1. bg-white → bg-white dark:bg-gray-800
  if grep -q 'className="[^"]*bg-white[^"]*"' "$file" 2>/dev/null; then
    sed -i '' 's/className="\([^"]*\)bg-white\([^"]*\)"/className="\1bg-white dark:bg-gray-800\2"/g' "$file"
    changed=true
  fi

  # 2. text-gray-900 → text-gray-900 dark:text-gray-100
  if grep -q 'text-gray-900' "$file" 2>/dev/null; then
    sed -i '' 's/text-gray-900\([^-]\)/text-gray-900 dark:text-gray-100\1/g' "$file"
    changed=true
  fi

  # 3. text-gray-800 → text-gray-800 dark:text-gray-200
  if grep -q 'text-gray-800' "$file" 2>/dev/null; then
    sed -i '' 's/text-gray-800\([^-]\)/text-gray-800 dark:text-gray-200\1/g' "$file"
    changed=true
  fi

  # 4. text-gray-700 → text-gray-700 dark:text-gray-300
  if grep -q 'text-gray-700' "$file" 2>/dev/null; then
    sed -i '' 's/text-gray-700\([^-]\)/text-gray-700 dark:text-gray-300\1/g' "$file"
    changed=true
  fi

  # 5. text-gray-600 → text-gray-600 dark:text-gray-400
  if grep -q 'text-gray-600' "$file" 2>/dev/null; then
    sed -i '' 's/text-gray-600\([^-]\)/text-gray-600 dark:text-gray-400\1/g' "$file"
    changed=true
  fi

  # 6. border-gray-200 → border-gray-200 dark:border-gray-700
  if grep -q 'border-gray-200' "$file" 2>/dev/null; then
    sed -i '' 's/border-gray-200\([^-]\)/border-gray-200 dark:border-gray-700\1/g' "$file"
    changed=true
  fi

  # 7. border-gray-300 → border-gray-300 dark:border-gray-600
  if grep -q 'border-gray-300' "$file" 2>/dev/null; then
    sed -i '' 's/border-gray-300\([^-]\)/border-gray-300 dark:border-gray-600\1/g' "$file"
    changed=true
  fi

  # 8. bg-gray-50 → bg-gray-50 dark:bg-gray-900
  if grep -q 'bg-gray-50' "$file" 2>/dev/null; then
    sed -i '' 's/bg-gray-50\([^-]\)/bg-gray-50 dark:bg-gray-900\1/g' "$file"
    changed=true
  fi

  # 9. bg-gray-100 → bg-gray-100 dark:bg-gray-800
  if grep -q 'bg-gray-100' "$file" 2>/dev/null; then
    sed -i '' 's/bg-gray-100\([^-]\)/bg-gray-100 dark:bg-gray-800\1/g' "$file"
    changed=true
  fi

  if [ "$changed" = true ]; then
    ((modified++))
    echo "✅ Modified: $(basename "$file")"
  fi

done < <(find "$COMPONENTS_DIR" -name "*.tsx" -type f)

echo ""
echo "📊 완료!"
echo "   총 파일: $total"
echo "   수정됨: $modified"
echo ""
echo "⚠️  주의: 일부 파일은 수동 검토가 필요할 수 있습니다."
echo "   특히 그라데이션, 커스텀 색상 등은 수동으로 확인하세요."
