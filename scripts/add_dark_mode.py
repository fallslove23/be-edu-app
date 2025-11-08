#!/usr/bin/env python3
"""
다크모드 클래스 자동 추가 스크립트
주요 컴포넌트에 다크모드 Tailwind 클래스를 추가합니다.
"""

import os
import re
from pathlib import Path

# 다크모드 매핑
DARK_MODE_MAP = {
    # 배경색
    r'bg-white(?![a-z-])': 'bg-white dark:bg-gray-800',
    r'bg-gray-50(?![a-z0-9-])': 'bg-gray-50 dark:bg-gray-900',
    r'bg-gray-100(?![a-z0-9-])': 'bg-gray-100 dark:bg-gray-800',

    # 텍스트 색상
    r'text-gray-900(?![a-z0-9-])': 'text-gray-900 dark:text-gray-100',
    r'text-gray-800(?![a-z0-9-])': 'text-gray-800 dark:text-gray-200',
    r'text-gray-700(?![a-z0-9-])': 'text-gray-700 dark:text-gray-300',
    r'text-gray-600(?![a-z0-9-])': 'text-gray-600 dark:text-gray-400',
    r'text-gray-500(?![a-z0-9-])': 'text-gray-500 dark:text-gray-400',

    # 보더
    r'border-gray-200(?![a-z0-9-])': 'border-gray-200 dark:border-gray-700',
    r'border-gray-300(?![a-z0-9-])': 'border-gray-300 dark:border-gray-600',
}

def add_dark_mode_to_file(filepath):
    """파일에 다크모드 클래스 추가"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        modified = False

        # 각 패턴에 대해 변경
        for pattern, replacement in DARK_MODE_MAP.items():
            # 이미 dark: 클래스가 있는 경우 스킵
            if 'dark:' in pattern:
                continue

            # 패턴 찾기
            matches = list(re.finditer(pattern, content))
            if not matches:
                continue

            # 이미 dark 모드가 적용된 경우 스킵
            for match in matches:
                start, end = match.span()
                # 앞뒤 50자 확인
                context = content[max(0, start-50):min(len(content), end+50)]
                if 'dark:' in context and pattern.split('(?')[0] in context:
                    continue

                # 변경
                content = content[:start] + replacement + content[end:]
                modified = True
                # 오프셋 조정
                offset = len(replacement) - (end - start)
                for i in range(len(matches)):
                    if matches[i].start() > start:
                        matches[i] = re.search(pattern, content[matches[i].start() + offset:])

        # 변경사항이 있으면 파일 저장
        if modified and content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")

    return False

def main():
    """메인 함수"""
    components_dir = Path("/Users/choihyodong/bs-learning-app-main/src/components")

    print("🌙 다크모드 클래스 자동 추가 시작...")
    print(f"📁 디렉토리: {components_dir}")
    print()

    total = 0
    modified = 0

    # 모든 .tsx 파일 찾기
    for tsx_file in components_dir.rglob("*.tsx"):
        total += 1
        if add_dark_mode_to_file(tsx_file):
            modified += 1
            print(f"✅ {tsx_file.name}")

    print()
    print("📊 완료!")
    print(f"   총 파일: {total}")
    print(f"   수정됨: {modified}")
    print()
    print("⚠️  주의: 일부 파일은 수동 검토가 필요할 수 있습니다.")

if __name__ == "__main__":
    main()
