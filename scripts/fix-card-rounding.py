#!/usr/bin/env python3
"""
카드 컨테이너의 지나치게 둥근 모서리 수정
rounded-2xl, rounded-3xl -> rounded-lg 변경 (버튼 제외)
"""

import os
import re
from pathlib import Path

def should_process_file(filepath):
    """처리할 파일인지 확인"""
    return filepath.endswith(('.tsx', '.ts', '.jsx', '.js'))

def fix_card_rounding(content):
    """카드 컨테이너의 border radius 수정"""
    changes = []

    # 패턴: rounded-2xl 또는 rounded-3xl을 rounded-lg로 변경
    # 단, 버튼이 아닌 div, section, article 등의 컨테이너만 대상

    # 1. div, section, article 등의 className에서 rounded-2xl/3xl -> rounded-lg
    patterns = [
        # div className="... rounded-2xl ..."
        (r'(<div[^>]*className="[^"]*)\brounded-2xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
        (r'(<div[^>]*className="[^"]*)\brounded-3xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),

        # section, article, main 등
        (r'(<section[^>]*className="[^"]*)\brounded-2xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
        (r'(<section[^>]*className="[^"]*)\brounded-3xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
        (r'(<article[^>]*className="[^"]*)\brounded-2xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
        (r'(<article[^>]*className="[^"]*)\brounded-3xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
        (r'(<main[^>]*className="[^"]*)\brounded-2xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
        (r'(<main[^>]*className="[^"]*)\brounded-3xl\b([^"]*"[^>]*>)', r'\1rounded-lg\2'),
    ]

    modified_content = content
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, modified_content)
        if new_content != modified_content:
            count = len(re.findall(pattern, modified_content))
            changes.append(f"  - {pattern[:50]}... : {count}개 변경")
            modified_content = new_content

    return modified_content, changes

def process_file(filepath):
    """파일 처리"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()

        # 버튼 관련 파일은 스킵
        if 'Button.tsx' in filepath or 'button.tsx' in filepath:
            return None

        modified_content, changes = fix_card_rounding(original_content)

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
    # 타겟 파일들
    target_files = [
        'src/components/performance/PerformanceTracking.tsx',
        'src/components/materials/MaterialsLibrary.tsx',
        'src/components/bs-activities/BSActivityDashboard.tsx',
        'src/components/certificates/CertificateManagement.tsx',
        'src/components/notices/NoticeManagement.tsx',
        'src/components/courses/BSCourseManagement.tsx',
        'src/components/courses/CourseTemplateManagement.tsx',
        'src/components/users/UserManagement.tsx',
    ]

    project_root = Path('/Users/choihyodong/bs-learning-app-main')

    print("🔧 카드 border radius 수정 시작...")
    print("=" * 60)

    modified_files = []

    for rel_path in target_files:
        filepath = project_root / rel_path

        if not filepath.exists():
            print(f"⚠️  파일 없음: {rel_path}")
            continue

        if not should_process_file(str(filepath)):
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
        print("\n수정된 파일 목록:")
        for filepath in modified_files:
            print(f"  - {filepath}")

if __name__ == '__main__':
    main()
