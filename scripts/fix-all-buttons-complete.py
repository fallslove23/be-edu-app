#!/usr/bin/env python3
"""
전체 프로젝트 버튼 스타일 완전 수정
- 모든 button 태그의 className에서 rounded 관련 클래스를 rounded-full로 변경
- onClick이 있는 div, span 등도 버튼처럼 동작하면 처리
"""

import os
import re
from pathlib import Path

def fix_button_rounded(content, filepath):
    """버튼의 rounded 클래스를 rounded-full로 변경"""
    changes = []
    modified_content = content

    # Button.tsx는 제외
    if 'Button.tsx' in filepath or 'button.tsx' in filepath:
        return content, changes

    # 패턴 1: <button ... className="..." > 형태에서 rounded 변경
    # rounded, rounded-sm, rounded-md, rounded-lg -> rounded-full
    # 단, rounded-full은 그대로 유지, rounded-2xl/3xl은 카드용이므로 제외

    patterns = [
        # button 태그에서 rounded-lg -> rounded-full
        (r'(<button\s+[^>]*className="[^"]*?)rounded-lg\b', r'\1rounded-full'),
        # button 태그에서 rounded-md -> rounded-full
        (r'(<button\s+[^>]*className="[^"]*?)rounded-md\b', r'\1rounded-full'),
        # button 태그에서 rounded-sm -> rounded-full
        (r'(<button\s+[^>]*className="[^"]*?)rounded-sm\b', r'\1rounded-full'),
        # button 태그에서 rounded만 있는 경우 -> rounded-full
        (r'(<button\s+[^>]*className="[^"]*?)rounded\b(?!-)', r'\1rounded-full'),
    ]

    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, modified_content, flags=re.MULTILINE)
        if new_content != modified_content:
            count = len(re.findall(pattern, modified_content, flags=re.MULTILINE))
            changes.append(f"  - {pattern.split('rounded')[1][:10]}: {count}개 변경")
            modified_content = new_content

    return modified_content, changes

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        modified_content, changes = fix_button_rounded(original_content, str(filepath))

        if modified_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            return changes

        return None
    except Exception as e:
        print(f"❌ 오류 ({filepath}): {e}")
        return None

def find_all_files(base_path):
    """모든 tsx, jsx, ts, js 파일 찾기"""
    files = []
    for ext in ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js']:
        files.extend(Path(base_path).glob(ext))

    # node_modules, .next 등 제외
    filtered = []
    for f in files:
        path_str = str(f)
        if 'node_modules' not in path_str and '.next' not in path_str:
            filtered.append(f)

    return filtered

def main():
    """메인 함수"""
    project_root = Path('/Users/choihyodong/bs-learning-app-main')
    src_path = project_root / 'src'

    print("🔧 전체 프로젝트 버튼 스타일 완전 수정...")
    print("=" * 80)

    all_files = find_all_files(src_path)
    modified_files = []

    print(f"\n📁 {len(all_files)}개 파일 검사 중...\n")

    for filepath in all_files:
        changes = process_file(filepath)
        if changes:
            rel_path = filepath.relative_to(project_root)
            modified_files.append(str(rel_path))
            print(f"✅ {rel_path}")
            for change in changes:
                print(change)

    print("\n" + "=" * 80)
    print(f"✨ 완료: {len(modified_files)}개 파일 수정됨")

    if modified_files:
        print(f"\n수정된 파일 ({len(modified_files)}개):")
        for i, filepath in enumerate(modified_files[:30], 1):
            print(f"  {i}. {filepath}")
        if len(modified_files) > 30:
            print(f"  ... 외 {len(modified_files) - 30}개 파일")

if __name__ == '__main__':
    main()
