#!/usr/bin/env python3
"""
Admin 컴포넌트 버튼 스타일 최종 수정
모든 button 태그의 rounded를 rounded-full로 변경
"""

import os
import re
from pathlib import Path

def fix_all_button_rounded(content):
    """모든 버튼의 rounded를 rounded-full로 변경"""
    changes = []
    modified_content = content

    # 패턴: button 태그 내에서 rounded 관련 클래스를 모두 rounded-full로 변경
    # 단, rounded-full은 그대로 유지

    # 1. className 속성 내의 rounded 변경
    def replace_rounded_in_button(match):
        button_tag = match.group(0)

        # 이미 rounded-full이면 그대로 반환
        if 'rounded-full' in button_tag:
            return button_tag

        # rounded, rounded-sm, rounded-md, rounded-lg를 rounded-full로 변경
        # rounded-2xl, rounded-3xl 등은 카드용이므로 제외하지만 버튼에는 없어야 함
        result = button_tag
        result = re.sub(r'\brounded-lg\b', 'rounded-full', result)
        result = re.sub(r'\brounded-md\b', 'rounded-full', result)
        result = re.sub(r'\brounded-sm\b', 'rounded-full', result)
        result = re.sub(r'\brounded\b(?!\-)', 'rounded-full', result)  # rounded만 있는 경우

        if result != button_tag:
            return result
        return button_tag

    # button 태그 전체를 찾아서 처리
    pattern = r'<button[^>]*>.*?</button>'
    new_content = re.sub(pattern, replace_rounded_in_button, modified_content, flags=re.DOTALL)

    if new_content != modified_content:
        # 변경된 개수 카운트
        original_roundeds = len(re.findall(r'<button[^>]*className="[^"]*\brounded(?!\-full)\b', modified_content))
        changes.append(f"  - button rounded 수정: {original_roundeds}개")
        modified_content = new_content

    return modified_content, changes

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # Button.tsx 제외
        if 'Button.tsx' in filepath or 'button.tsx' in filepath:
            return None

        modified_content, changes = fix_all_button_rounded(original_content)

        if modified_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified_content)
            return changes

        return None
    except Exception as e:
        print(f"❌ 오류 발생 ({filepath}): {e}")
        return None

def main():
    """메인 함수"""
    # Admin 컴포넌트 파일들
    admin_files = [
        'src/components/admin/UserPermissionManager.tsx',
        'src/components/admin/ClassroomManagement.tsx',
        'src/components/admin/InstructorManagement.tsx',
        'src/components/admin/BackupRestoreSystem.tsx',
        'src/components/admin/SystemMonitor.tsx',
        'src/components/admin/CategoryManagement.tsx',
        'src/components/admin/ResourceManagement.tsx',
        'src/components/admin/SubjectManagement.tsx',
    ]

    project_root = Path('/Users/choihyodong/bs-learning-app-main')

    print("🔧 Admin 컴포넌트 버튼 스타일 최종 수정...")
    print("=" * 60)

    modified_files = []

    for rel_path in admin_files:
        filepath = project_root / rel_path

        if not filepath.exists():
            continue

        changes = process_file(str(filepath))

        if changes:
            modified_files.append(rel_path)
            print(f"\n✅ {rel_path}")
            for change in changes:
                print(change)

    print("\n" + "=" * 60)
    print(f"✨ 완료: {len(modified_files)}개 파일 수정됨")

    if modified_files:
        print("\n수정된 파일:")
        for filepath in modified_files:
            print(f"  - {filepath}")

if __name__ == '__main__':
    main()
