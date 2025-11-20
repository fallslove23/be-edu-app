#!/usr/bin/env python3
"""
모든 버튼에 rounded-full 적용 - 최종 버전
- button 태그에 rounded가 없으면 추가
- button 태그의 rounded-*, rounded를 rounded-full로 변경
"""

import re
from pathlib import Path

def fix_button_styles(content, filepath):
    """버튼 스타일 수정"""
    # Button.tsx 제외
    if 'Button.tsx' in filepath or 'button.tsx' in filepath:
        return content, []

    changes = []
    lines = content.split('\n')
    modified_lines = []

    i = 0
    while i < len(lines):
        line = lines[i]
        original_line = line

        # button 태그가 있는 라인 처리
        if '<button' in line and 'className' in line:
            # 이미 rounded-full이 있으면 그대로
            if 'rounded-full' in line:
                modified_lines.append(line)
                i += 1
                continue

            # className 속성 찾기
            class_match = re.search(r'className="([^"]*)"', line)
            if class_match:
                classes = class_match.group(1)

                # rounded-* 패턴이 있으면 rounded-full로 변경
                if re.search(r'\brounded(-\w+)?\b', classes):
                    # rounded, rounded-sm, rounded-md, rounded-lg 등을 rounded-full로
                    new_classes = re.sub(r'\brounded(-(?:sm|md|lg|xl))?\b', 'rounded-full', classes)
                    line = line.replace(f'className="{classes}"', f'className="{new_classes}"')
                    if line != original_line:
                        changes.append('rounded 변경')
                else:
                    # rounded가 전혀 없으면 추가
                    # className의 끝에 rounded-full 추가
                    new_classes = classes.strip() + ' rounded-full' if classes.strip() else 'rounded-full'
                    line = line.replace(f'className="{classes}"', f'className="{new_classes}"')
                    if line != original_line:
                        changes.append('rounded 추가')

        modified_lines.append(line)
        i += 1

    return '\n'.join(modified_lines), changes

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        modified_content, changes = fix_button_styles(original_content, str(filepath))

        if modified_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            return len(changes)

        return 0
    except Exception as e:
        print(f"❌ 오류 ({filepath}): {e}")
        return 0

def main():
    """메인 함수"""
    project_root = Path('/Users/choihyodong/bs-learning-app-main')
    src_path = project_root / 'src'

    print("🔧 모든 버튼에 rounded-full 적용...")
    print("=" * 80)

    # 모든 tsx, jsx 파일 찾기
    all_files = list(src_path.rglob('*.tsx')) + list(src_path.rglob('*.jsx'))
    all_files = [f for f in all_files if 'node_modules' not in str(f) and '.next' not in str(f)]

    print(f"\n📁 {len(all_files)}개 파일 검사 중...\n")

    modified_files = []
    total_changes = 0

    for filepath in all_files:
        changes_count = process_file(filepath)
        if changes_count > 0:
            rel_path = filepath.relative_to(project_root)
            modified_files.append((str(rel_path), changes_count))
            total_changes += changes_count

    print("\n" + "=" * 80)
    print(f"✨ 완료: {len(modified_files)}개 파일, 총 {total_changes}개 버튼 수정")

    if modified_files:
        print(f"\n수정된 파일:")
        for filepath, count in modified_files[:50]:
            print(f"  ✅ {filepath} ({count}개 버튼)")
        if len(modified_files) > 50:
            print(f"  ... 외 {len(modified_files) - 50}개 파일")

if __name__ == '__main__':
    main()
