#!/usr/bin/env python3
"""
최종 버튼 감사 - 모든 button 태그에서 rounded-full이 아닌 것 찾기
"""

import re
from pathlib import Path

def audit_button_styles(filepath):
    """버튼 스타일 감사"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Button.tsx 제외
        if 'Button.tsx' in str(filepath) or 'button.tsx' in str(filepath):
            return []

        issues = []
        lines = content.split('\n')

        for i, line in enumerate(lines, 1):
            # button 태그가 있는 라인
            if '<button' in line and 'className' in line:
                # rounded-full이 없고 다른 rounded가 있는 경우
                if 'rounded-full' not in line and re.search(r'\brounded(?:-(?:sm|md|lg|xl|2xl|3xl))?\b', line):
                    # className 속성 추출
                    class_match = re.search(r'className="([^"]*)"', line)
                    if class_match:
                        classes = class_match.group(1)
                        # rounded 관련 클래스만 추출
                        rounded_classes = re.findall(r'\brounded(?:-(?:sm|md|lg|xl|2xl|3xl))?\b', classes)
                        if rounded_classes:
                            issues.append({
                                'line': i,
                                'content': line.strip()[:100],
                                'rounded_class': rounded_classes
                            })

        return issues

    except Exception as e:
        return []

def main():
    """메인 함수"""
    project_root = Path('/Users/choihyodong/bs-learning-app-main/src')

    print("🔍 버튼 스타일 최종 감사...")
    print("=" * 80)

    all_issues = {}

    # 모든 tsx, jsx 파일 검사
    for filepath in project_root.rglob('*.tsx'):
        issues = audit_button_styles(filepath)
        if issues:
            rel_path = filepath.relative_to(project_root.parent)
            all_issues[str(rel_path)] = issues

    for filepath in project_root.rglob('*.jsx'):
        issues = audit_button_styles(filepath)
        if issues:
            rel_path = filepath.relative_to(project_root.parent)
            all_issues[str(rel_path)] = issues

    if all_issues:
        print(f"\n⚠️  {len(all_issues)}개 파일에서 문제 발견:\n")
        for filepath, issues in all_issues.items():
            print(f"\n📄 {filepath}")
            for issue in issues[:5]:  # 파일당 최대 5개만 표시
                print(f"  Line {issue['line']}: {issue['rounded_class']}")
                print(f"    {issue['content']}")
            if len(issues) > 5:
                print(f"  ... 외 {len(issues) - 5}개 더")
    else:
        print("\n✅ 모든 버튼이 rounded-full 스타일을 사용합니다!")

    print("\n" + "=" * 80)
    print(f"검사 완료")

if __name__ == '__main__':
    main()
