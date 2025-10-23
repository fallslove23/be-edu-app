import type { UserRole } from '../types/auth.types';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  roles: UserRole[];
  section?: string;
}

export const navigationItems: MenuItem[] = [
  // 공통 메뉴
  {
    id: 'dashboard',
    label: '대시보드',
    icon: '📊',
    description: '전체 현황 및 요약 정보',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'main'
  },

  // 관리자/조직장 전용 메뉴
  {
    id: 'users',
    label: '사용자 관리',
    icon: '👥',
    description: '시스템 사용자 및 권한 관리',
    roles: ['admin', 'manager'],
    section: 'management'
  },
  {
    id: 'courses',
    label: '과정 관리',
    icon: '📚',
    description: '교육 과정 생성 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'management'
  },
  {
    id: 'notices',
    label: '공지사항 관리',
    icon: '📢',
    description: '공지사항 작성 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'management'
  },
  {
    id: 'performance',
    label: '성과 분석',
    icon: '📈',
    description: '교육생 성과 추적 및 리포팅',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'analysis'
  },

  // 관리자/조직장/운영/강사 메뉴
  {
    id: 'exams',
    label: '이론 평가 관리',
    icon: '🎯',
    description: '시험 생성 및 채점 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment'
  },
  {
    id: 'practice',
    label: '실습 평가 관리',
    icon: '🎭',
    description: '실습 및 시뮬레이션 평가',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment'
  },
  {
    id: 'analytics',
    label: '고급 분석',
    icon: '📊',
    description: '종합 데이터 분석 및 시각화',
    roles: ['admin', 'manager', 'operator'],
    section: 'analysis'
  },
  {
    id: 'reports',
    label: '리포트 생성',
    icon: '📄',
    description: '커스텀 리포트 생성 및 내보내기',
    roles: ['admin', 'manager', 'operator'],
    section: 'analysis'
  },

  // 교육생 전용 메뉴
  {
    id: 'my-courses',
    label: '내 수강 과정',
    icon: '📖',
    description: '수강중인 과정 및 진도 확인',
    roles: ['trainee'],
    section: 'learning'
  },
  {
    id: 'my-exams',
    label: '시험 응시',
    icon: '✍️',
    description: '시험 응시 및 결과 확인',
    roles: ['trainee'],
    section: 'learning'
  },
  {
    id: 'my-practice',
    label: '실습 참여',
    icon: '🎪',
    description: '실습 및 시뮬레이션 참여',
    roles: ['trainee'],
    section: 'learning'
  },
  {
    id: 'my-progress',
    label: '학습 현황',
    icon: '📊',
    description: '개인 학습 진도 및 성과',
    roles: ['trainee'],
    section: 'learning'
  },
  {
    id: 'personal-analytics',
    label: '개인 분석',
    icon: '📈',
    description: '개인 성과 분석 및 학습 패턴',
    roles: ['trainee'],
    section: 'learning'
  },
  {
    id: 'notices-view',
    label: '공지사항',
    icon: '📣',
    description: '공지사항 확인',
    roles: ['trainee'],
    section: 'info'
  },
  {
    id: 'chat',
    label: '실시간 채팅',
    icon: '💬',
    description: '강사 및 동료와 실시간 소통',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'info'
  }
];

export const getMenuItemsForRole = (role: UserRole): MenuItem[] => {
  return navigationItems.filter(item => item.roles.includes(role));
};

export const getMenuSections = (role: UserRole): Record<string, MenuItem[]> => {
  const items = getMenuItemsForRole(role);
  return items.reduce((sections, item) => {
    const section = item.section || 'main';
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push(item);
    return sections;
  }, {} as Record<string, MenuItem[]>);
};

export const sectionLabels: Record<string, string> = {
  main: '메인',
  management: '관리',
  assessment: '평가',
  analysis: '분석',
  learning: '학습',
  info: '정보'
};