import type { UserRole } from '../types/auth.types';

export interface SubMenuItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  route?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  roles: UserRole[];
  section?: string;
  isCollapsible?: boolean;
  subItems?: SubMenuItem[];
  route?: string;
}

export const navigationItems: MenuItem[] = [
  // 대시보드 (모든 사용자)
  {
    id: 'dashboard',
    label: '대시보드',
    icon: '🏠',
    description: '전체 현황 및 요약 정보',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'dashboard',
    route: 'dashboard'
  },

  // 과정 관리 - 통합 관리 (탭 구조)
  {
    id: 'course-management',
    label: '과정 관리',
    icon: '📚',
    description: '과정, 템플릿, 차수, 출석 통합 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'education',
    route: 'course-management'
  },

  // 교육생 관리
  {
    id: 'trainees',
    label: '교육생 관리',
    icon: '👥',
    description: '교육생 등록 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'education',
    route: 'trainees'
  },

  // BS 활동 관리 (운영진 전용)
  {
    id: 'bs-activities-management',
    label: 'BS 활동 관리',
    icon: '🎯',
    description: '전체 교육생 BS 활동 일지 관리 및 피드백',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'bs-activities',
    route: 'bs-activities-management'
  },

  // 활동 일지 (교육생 전용)
  {
    id: 'activity-journal',
    label: '내 활동 일지',
    icon: '📝',
    description: '치과 방문 활동 일지 작성 및 관리',
    roles: ['trainee'],
    section: 'bs-activities',
    route: 'activity-journal'
  },

  // 평가 관리 - 서브메뉴 포함
  {
    id: 'assessment',
    label: '평가 관리',
    icon: '📝',
    description: '시험, 실습평가, 인증서',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'assessment',
    isCollapsible: true,
    subItems: [
      {
        id: 'exams',
        label: '시험 관리',
        icon: '📋',
        description: '시험 출제 및 채점',
        route: 'exams'
      },
      {
        id: 'practice',
        label: '실습 평가',
        icon: '🎯',
        description: '실습 과제 평가',
        route: 'practice'
      }
    ]
  },

  // 분석 및 보고서 - 서브메뉴 포함
  {
    id: 'analytics',
    label: '분석 및 보고서',
    icon: '📊',
    description: '성과분석, 고급분석, 보고서 생성 통합 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'analytics',
    isCollapsible: true,
    subItems: [
      {
        id: 'performance-tracking',
        label: '기본 성과 분석',
        icon: '📊',
        description: '기본 성과 추적',
        route: 'performance-tracking'
      },
      {
        id: 'advanced-analytics',
        label: '고급 분석',
        icon: '🔍',
        description: '상세 분석 도구',
        route: 'advanced-analytics'
      },
      {
        id: 'integrated-analytics',
        label: '통합 분석',
        icon: '📈',
        description: '종합 리포팅',
        route: 'integrated-analytics'
      },
      {
        id: 'personal-analytics',
        label: '개인 분석',
        icon: '👤',
        description: '개별 학습자 분석',
        route: 'personal-analytics'
      }
    ]
  },

  // 일정 관리
  {
    id: 'schedule-management',
    label: '일정 관리',
    icon: '📅',
    description: '강의 일정, 교실 배정, 캘린더 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'schedule',
    route: 'schedule-management'
  },

  // 교육생 리포트 (기존 중복 메뉴를 리포트 기능으로 변경)
  {
    id: 'student-reports',
    label: '교육생 리포트',
    icon: '📋',
    description: '교육생 수료이력, 성과, 인증서 리포트 조회',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'reports'
  },

  // 시스템 관리 (관리자만) - 서브메뉴 포함
  {
    id: 'system',
    label: '시스템 관리',
    icon: '⚙️',
    description: '시스템 사용자 및 공지사항 관리',
    roles: ['admin', 'manager'],
    section: 'system',
    isCollapsible: true,
    subItems: [
      {
        id: 'users',
        label: '사용자 관리',
        icon: '👥',
        description: '시스템 사용자 등록 및 관리',
        route: 'users'
      },
      {
        id: 'notices',
        label: '공지사항 관리',
        icon: '📢',
        description: '시스템 공지사항 작성 및 관리',
        route: 'notices'
      },
      {
        id: 'security-dashboard',
        label: '보안 대시보드',
        icon: '🛡️',
        description: '보안 상태 모니터링',
        route: 'security-dashboard'
      },
      {
        id: 'advanced-pwa',
        label: 'PWA 관리',
        icon: '📱',
        description: 'Progressive Web App 설정',
        route: 'advanced-pwa'
      },
      {
        id: 'advanced-file-manager',
        label: '파일 관리',
        icon: '📁',
        description: '파일 업로드 및 관리',
        route: 'advanced-file-manager'
      }
    ]
  },

  // 교육 자료 관리
  {
    id: 'educational-materials',
    label: '교육 자료 관리',
    icon: '📚',
    description: '교육 자료 업로드, 분류, 배포 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'materials',
    isCollapsible: true,
    subItems: [
      {
        id: 'materials-library',
        label: '자료 라이브러리',
        icon: '📖',
        description: '교육 자료 저장소',
        route: 'materials-library'
      },
      {
        id: 'materials-upload',
        label: '자료 업로드',
        icon: '📤',
        description: '새로운 교육 자료 업로드',
        route: 'materials-upload'
      },
      {
        id: 'materials-categories',
        label: '자료 분류',
        icon: '🗂️',
        description: '교육 자료 카테고리 관리',
        route: 'materials-categories'
      },
      {
        id: 'materials-distribution',
        label: '자료 배포',
        icon: '📬',
        description: '교육생별 자료 배포 관리',
        route: 'materials-distribution'
      }
    ]
  },

  // 학습자 메뉴 (교육생 전용)
  {
    id: 'my-learning',
    label: '나의 학습',
    icon: '🎒',
    description: '개인 학습 관련 메뉴',
    roles: ['trainee'],
    section: 'student'
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
  dashboard: '홈',
  education: '교육',
  'bs-activities': 'BS 활동',
  assessment: '평가',
  analytics: '분석',
  schedule: '일정',
  reports: '리포트',
  system: '시스템',
  materials: '교육 자료',
  student: '학습'
};