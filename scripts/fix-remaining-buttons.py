#!/usr/bin/env python3
"""
누락된 버튼 스타일 완전 수정
- button 태그의 rounded, rounded-md, rounded-lg -> rounded-full
- 모든 버튼 요소 완벽하게 처리
"""

import os
import re
from pathlib import Path

def fix_button_styles(content):
    """버튼의 border radius를 rounded-full로 변경"""
    changes = []
    modified_content = content

    # 패턴 1: button 태그에서 rounded, rounded-md, rounded-lg -> rounded-full
    # className="... rounded ..." 형태
    patterns = [
        # rounded만 있는 경우 (가장 많이 누락됨)
        (r'(<button[^>]*className="[^"]*)\brounded\b(?!\-)', r'\1rounded-full'),
        # rounded-md
        (r'(<button[^>]*className="[^"]*)\brounded-md\b', r'\1rounded-full'),
        # rounded-lg
        (r'(<button[^>]*className="[^"]*)\brounded-lg\b', r'\1rounded-full'),
        # rounded-sm
        (r'(<button[^>]*className="[^"]*)\brounded-sm\b', r'\1rounded-full'),
    ]

    for pattern, replacement in patterns:
        before = modified_content
        modified_content = re.sub(pattern, replacement, modified_content)
        if modified_content != before:
            count = len(re.findall(pattern, before))
            pattern_name = pattern.split(r'\b')[1] if r'\b' in pattern else 'rounded'
            changes.append(f"  - {pattern_name}: {count}개 변경")

    return modified_content, changes

def should_process_file(filepath):
    """처리할 파일인지 확인"""
    # Button.tsx는 제외 (이미 올바르게 설정됨)
    if 'Button.tsx' in filepath or 'button.tsx' in filepath:
        return False
    return filepath.endswith(('.tsx', '.ts', '.jsx', '.js'))

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        modified_content, changes = fix_button_styles(original_content)

        if modified_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            return changes

        return None
    except Exception as e:
        print(f"❌ 오류 발생 ({filepath}): {e}")
        return None

def find_all_component_files(base_path):
    """모든 컴포넌트 파일 찾기"""
    files = []
    for ext in ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']:
        files.extend(Path(base_path).glob(ext))
    return [str(f) for f in files if should_process_file(str(f))]

def main():
    """메인 함수"""
    project_root = Path('/Users/choihyodong/bs-learning-app-main')
    src_path = project_root / 'src'

    print("🔧 누락된 버튼 스타일 수정 시작...")
    print("=" * 60)

    all_files = find_all_component_files(src_path)
    modified_files = []

    for filepath in all_files:
        changes = process_file(filepath)
        if changes:
            rel_path = Path(filepath).relative_to(project_root)
            modified_files.append(str(rel_path))
            print(f"\n✅ {rel_path}")
            for change in changes:
                print(change)

    print("\n" + "=" * 60)
    print(f"✨ 완료: {len(modified_files)}개 파일 수정됨")

    if modified_files:
        print("\n수정된 파일 목록:")
        for filepath in modified_files[:20]:  # 처음 20개만 표시
            print(f"  - {filepath}")
        if len(modified_files) > 20:
            print(f"  ... 외 {len(modified_files) - 20}개 파일")

if __name__ == '__main__':
    main()
