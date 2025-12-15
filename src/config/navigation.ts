import type { UserRole } from '../types/auth.types';

export interface SubMenuItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  route?: string;
  isExternal?: boolean;
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
  isExternal?: boolean;
  isCategory?: boolean;
}

export const navigationItems: MenuItem[] = [
  // 대시보드 (모든 사용자)
  {
    id: 'dashboard',
    label: '대시보드',
    icon: 'squares-2x2',
    description: '전체 현황 및 요약 정보',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'dashboard',
    route: 'dashboard'
  },

  // 과정 관리 - 통합 관리 (탭 구조)
  {
    id: 'course-management',
    label: '과정 관리',
    icon: 'academic-cap',
    description: '과정, 템플릿, 차수, 출석 통합 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'education',
    route: 'course-management'
  },

  // 인적자원 관리 - 평탄화
  {
    id: 'users',
    label: '사용자 관리',
    icon: 'user-circle',
    description: '시스템 사용자 계정 관리',
    roles: ['admin', 'manager'],
    section: 'hr',
    route: 'users'
  },
  {
    id: 'trainees',
    label: '교육생 관리',
    icon: 'user-group',
    description: '교육생 등록 및 관리',
    roles: ['admin', 'manager'],
    section: 'hr',
    route: 'trainees'
  },
  {
    id: 'instructor-management',
    label: '강사 관리',
    icon: 'identification',
    description: '강사 계정 및 프로필 통합 관리',
    roles: ['admin', 'manager'],
    section: 'hr',
    route: 'instructor-management'
  },

  // BS 활동 관리 (운영진 전용)
  {
    id: 'bs-activities-management',
    label: 'BS 활동 관리',
    icon: 'target',
    description: '전체 교육생 BS 활동 일지 관리 및 피드백',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'bs-activities',
    route: 'bs-activities-management'
  },

  // 활동 일지 (교육생 전용)
  {
    id: 'activity-journal',
    label: '내 활동 일지',
    icon: 'pencil-square',
    description: '치과 방문 활동 일지 작성 및 관리',
    roles: ['trainee'],
    section: 'bs-activities',
    route: 'activity-journal'
  },

  // 출석 관리
  {
    id: 'attendance',
    label: '출석 관리',
    icon: 'clipboard-document-check',
    description: '커리큘럼 기반 실시간 출석 체크 및 통계',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'operations',
    route: 'attendance'
  },

  // 평가 관리 - 평탄화
  {
    id: 'exams',
    label: '시험 관리',
    icon: 'clipboard-document-list',
    description: '시험 출제 및 채점',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment',
    route: 'exams'
  },
  {
    id: 'exam-taking',
    label: '시험 응시',
    icon: 'pencil-square',
    description: '시험 보기',
    roles: ['trainee'],
    section: 'assessment',
    route: 'exams'
  },
  {
    id: 'practice',
    label: '실습 평가 관리',
    icon: 'beaker',
    description: '실습 과제 평가',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment',
    route: 'practice'
  },
  {
    id: 'my-practice',
    label: '내 실습 평가',
    icon: 'beaker',
    description: '내 실습 과제 및 평가 확인',
    roles: ['trainee'],
    section: 'assessment',
    route: 'practice'
  },
  {
    id: 'evaluation-templates',
    label: '평가 템플릿',
    icon: 'document-duplicate',
    description: '평가 기준 설정',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment',
    route: 'evaluation-templates'
  },
  {
    id: 'instructor-evaluation',
    label: '강사 평가',
    icon: 'pencil-square',
    description: '학생 평가 입력',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment',
    route: 'instructor-evaluation'
  },
  {
    id: 'comprehensive-grades',
    label: '종합 성적 관리',
    icon: 'trophy',
    description: '최종 성적표 조회 및 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'assessment',
    route: 'comprehensive-grades'
  },
  {
    id: 'my-grades',
    label: '내 성적',
    icon: 'trophy',
    description: '내 시험 및 실습 성적 확인',
    roles: ['trainee'],
    section: 'assessment',
    route: 'comprehensive-grades'
  },

  // 분석 및 보고서 - 통합된 단일 페이지
  {
    id: 'analytics',
    label: '분석 및 보고서',
    icon: 'chart-pie',
    description: '통합 대시보드, 교육생 리포트, 성과 분석 통합 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'analytics',
    route: 'analytics'
  },

  // 일정 관리 - 평탄화
  {
    id: 'curriculum-management',
    label: '커리큘럼 관리',
    icon: 'clipboard-document-list',
    description: '과정 시간표 생성 및 관리 (관리자 전용)',
    roles: ['admin', 'manager', 'operator'],
    section: 'schedule',
    route: 'curriculum-management'
  },
  {
    id: 'schedule-management',
    label: '통합 캘린더',
    icon: 'calendar-days',
    description: '주간/월간/일간 시간표 조회 및 필터링 (권한별 편집 가능)',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'schedule',
    route: 'schedule-management'
  },

  // 자원 관리 - 평탄화
  {
    id: 'category-management',
    label: '카테고리 관리',
    icon: 'tag',
    description: '과정 카테고리 관리',
    roles: ['admin', 'manager'],
    section: 'resources',
    route: 'category-management'
  },
  {
    id: 'subject-management',
    label: '과목 관리',
    icon: 'bookmark',
    description: '강의 과목 관리',
    roles: ['admin', 'manager'],
    section: 'resources',
    route: 'subject-management'
  },
  {
    id: 'classroom-management',
    label: '강의실 관리',
    icon: 'building-office-2',
    description: '강의실 및 시설 관리',
    roles: ['admin', 'manager'],
    section: 'resources',
    route: 'classroom-management'
  },
  {
    id: 'instructor-payment',
    label: '강사료 계산',
    icon: 'currency-dollar',
    description: '강사 강의 시간 집계 및 강사료 계산',
    roles: ['admin', 'manager'],
    section: 'resources',
    route: 'instructor-payment'
  },

  // 시스템 관리 - 평탄화
  {
    id: 'notices',
    label: '공지사항 관리',
    icon: 'megaphone',
    description: '시스템 공지사항 작성 및 관리',
    roles: ['admin', 'manager'],
    section: 'system',
    route: 'notices'
  },
  {
    id: 'security-dashboard',
    label: '보안 대시보드',
    icon: 'shield-check',
    description: '보안 상태 모니터링',
    roles: ['admin', 'manager'],
    section: 'system',
    route: 'security-dashboard'
  },
  {
    id: 'advanced-pwa',
    label: 'PWA 관리',
    icon: 'device-phone-mobile',
    description: 'Progressive Web App 설정',
    roles: ['admin', 'manager'],
    section: 'system',
    route: 'advanced-pwa'
  },
  {
    id: 'advanced-file-manager',
    label: '파일 관리',
    icon: 'folder-open',
    description: '파일 업로드 및 관리',
    roles: ['admin', 'manager'],
    section: 'system',
    route: 'advanced-file-manager'
  },
  {
    id: 'dropdown-options-management',
    label: '드롭다운 옵션 관리',
    icon: 'adjustments-horizontal',
    description: '시스템 드롭다운 메뉴 옵션 관리',
    roles: ['admin', 'manager'],
    section: 'system',
    route: 'dropdown-options-management'
  },

  // 교육 자료 관리 - 평탄화
  {
    id: 'materials-library',
    label: '자료 라이브러리',
    icon: 'archive-box',
    description: '교육 자료 저장소',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'materials',
    route: 'materials-library'
  },
  {
    id: 'materials-upload',
    label: '자료 업로드',
    icon: 'arrow-up-tray',
    description: '새로운 교육 자료 업로드',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'materials',
    route: 'materials-upload'
  },
  {
    id: 'materials-categories',
    label: '자료 분류',
    icon: 'squares-plus',
    description: '교육 자료 카테고리 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'materials',
    route: 'materials-categories'
  },
  {
    id: 'materials-distribution',
    label: '자료 배포',
    icon: 'paper-airplane',
    description: '교육생별 자료 배포 관리',
    roles: ['admin', 'manager', 'operator', 'instructor'],
    section: 'materials',
    route: 'materials-distribution'
  },

  // 학습자 메뉴 (교육생 전용)
  {
    id: 'my-learning',
    label: '나의 학습',
    icon: 'backpack',
    description: '개인 학습 관련 메뉴',
    roles: ['trainee'],
    section: 'student'
  },

  // 외부 연계 시스템 - 평탄화
  {
    id: 'feedback-system',
    label: '만족도 평가',
    icon: 'star',
    description: '과정/강사/운영 만족도 평가 시스템',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'external',
    route: 'https://sseducationfeedback.info/dashboard',
    isExternal: true
  },
  {
    id: 'course-planner',
    label: '과정 플래너',
    icon: 'clipboard-document-check',
    description: '외부 과정 기획 시스템',
    roles: ['admin', 'manager', 'operator', 'instructor', 'trainee'],
    section: 'external',
    route: process.env.NEXT_PUBLIC_FIREBASE_PLANNER_URL || 'https://studio--eduscheduler-nrx9o.us-central1.hosted.app',
    isExternal: true
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
  hr: '인적자원',
  'bs-activities': 'BS 활동',
  operations: '운영',
  assessment: '평가',
  analytics: '분석',
  schedule: '일정',
  resources: '자원',
  system: '시스템',
  materials: '교육 자료',
  student: '학습',
  external: '연계 시스템'
};