/**
 * 드롭다운 옵션 중앙 관리 시스템
 *
 * 이 파일에서 모든 드롭다운 메뉴 옵션들을 한 곳에서 관리합니다.
 * 새로운 옵션 추가나 수정이 필요하면 이 파일만 수정하면 됩니다.
 */

// ========================================
// 시험 관련 옵션
// ========================================

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
}

export const examTypeOptions: DropdownOption[] = [
  {
    value: 'final',
    label: '최종평가',
    description: '과정 수료를 위한 최종 평가',
    color: 'red',
    icon: '🎯'
  },
  {
    value: 'midterm',
    label: '중간평가',
    description: '과정 중간 진도 평가',
    color: 'blue',
    icon: '📊'
  },
  {
    value: 'quiz',
    label: '퀴즈',
    description: '간단한 이해도 확인 퀴즈',
    color: 'green',
    icon: '❓'
  },
  {
    value: 'daily_test',
    label: '일일평가',
    description: '매일 진행되는 간단한 평가',
    color: 'yellow',
    icon: '📝'
  },
  {
    value: 'practice',
    label: '연습문제',
    description: '실습 및 연습을 위한 문제',
    color: 'purple',
    icon: '💡'
  },
  {
    value: 'assignment',
    label: '과제',
    description: '집에서 수행하는 과제',
    color: 'orange',
    icon: '📚'
  }
];

export const examStatusOptions: DropdownOption[] = [
  {
    value: 'draft',
    label: '준비중',
    description: '시험 작성 중',
    color: 'gray',
    icon: '✏️'
  },
  {
    value: 'published',
    label: '발행됨',
    description: '시험이 발행되어 학생들에게 공개',
    color: 'blue',
    icon: '📢'
  },
  {
    value: 'scheduled',
    label: '예정됨',
    description: '시험 일정이 예약됨',
    color: 'yellow',
    icon: '📅'
  },
  {
    value: 'active',
    label: '진행중',
    description: '현재 시험 진행 중',
    color: 'green',
    icon: '▶️'
  },
  {
    value: 'completed',
    label: '완료',
    description: '시험이 종료됨',
    color: 'indigo',
    icon: '✅'
  },
  {
    value: 'archived',
    label: '보관됨',
    description: '시험이 보관됨',
    color: 'gray',
    icon: '📦'
  }
];

// ========================================
// 문제 유형 옵션
// ========================================

export const questionTypeOptions: DropdownOption[] = [
  {
    value: 'multiple_choice',
    label: '객관식',
    description: '여러 선택지 중 정답 선택',
    icon: '☑️'
  },
  {
    value: 'true_false',
    label: 'O/X',
    description: '참/거짓 판단',
    icon: '⭕'
  },
  {
    value: 'short_answer',
    label: '단답형',
    description: '짧은 답변 작성',
    icon: '✍️'
  },
  {
    value: 'essay',
    label: '서술형',
    description: '긴 형식의 답변 작성',
    icon: '📝'
  },
  {
    value: 'matching',
    label: '짝맞추기',
    description: '항목들을 짝지어 매칭',
    icon: '🔗'
  },
  {
    value: 'ordering',
    label: '순서배열',
    description: '항목들을 올바른 순서로 배치',
    icon: '🔢'
  }
];

export const difficultyOptions: DropdownOption[] = [
  {
    value: 'easy',
    label: '쉬움',
    description: '기초 수준',
    color: 'green',
    icon: '🟢'
  },
  {
    value: 'medium',
    label: '보통',
    description: '중급 수준',
    color: 'yellow',
    icon: '🟡'
  },
  {
    value: 'hard',
    label: '어려움',
    description: '고급 수준',
    color: 'red',
    icon: '🔴'
  }
];

// ========================================
// 과정 관련 옵션
// ========================================

export const courseStatusOptions: DropdownOption[] = [
  {
    value: 'planning',
    label: '계획중',
    description: '과정 계획 단계',
    color: 'gray',
    icon: '📋'
  },
  {
    value: 'recruiting',
    label: '모집중',
    description: '교육생 모집 중',
    color: 'blue',
    icon: '📢'
  },
  {
    value: 'in_progress',
    label: '진행중',
    description: '과정 진행 중',
    color: 'green',
    icon: '▶️'
  },
  {
    value: 'completed',
    label: '완료',
    description: '과정 완료',
    color: 'indigo',
    icon: '✅'
  },
  {
    value: 'cancelled',
    label: '취소됨',
    description: '과정 취소',
    color: 'red',
    icon: '❌'
  }
];

export const categoryOptions: DropdownOption[] = [
  {
    value: 'basic',
    label: 'BS Basic',
    description: '기초 과정',
    color: 'blue'
  },
  {
    value: 'advanced',
    label: 'BS Advanced',
    description: '심화 과정',
    color: 'purple'
  }
];

// ========================================
// 출석 관련 옵션
// ========================================

export const attendanceStatusOptions: DropdownOption[] = [
  {
    value: 'present',
    label: '출석',
    description: '정상 출석',
    color: 'green',
    icon: '✅'
  },
  {
    value: 'late',
    label: '지각',
    description: '늦게 출석',
    color: 'yellow',
    icon: '⏰'
  },
  {
    value: 'absent',
    label: '결석',
    description: '출석하지 않음',
    color: 'red',
    icon: '❌'
  },
  {
    value: 'excused',
    label: '공결',
    description: '공인된 결석',
    color: 'blue',
    icon: '📄'
  }
];

// ========================================
// 사용자 역할 옵션
// ========================================

export const userRoleOptions: DropdownOption[] = [
  {
    value: 'admin',
    label: '관리자',
    description: '시스템 전체 관리',
    color: 'red',
    icon: '👑'
  },
  {
    value: 'manager',
    label: '매니저',
    description: '과정 및 운영 관리',
    color: 'blue',
    icon: '👔'
  },
  {
    value: 'operator',
    label: '운영자',
    description: '일상 운영 담당',
    color: 'green',
    icon: '⚙️'
  },
  {
    value: 'instructor',
    label: '강사',
    description: '교육 담당',
    color: 'purple',
    icon: '👨‍🏫'
  },
  {
    value: 'trainee',
    label: '교육생',
    description: '교육 수강생',
    color: 'yellow',
    icon: '🎓'
  }
];

// ========================================
// 평가 관련 옵션
// ========================================

export const evaluationTypeOptions: DropdownOption[] = [
  {
    value: 'theory',
    label: '이론 평가',
    description: '이론 지식 평가',
    icon: '📚'
  },
  {
    value: 'practice',
    label: '실습 평가',
    description: '실기 및 실습 평가',
    icon: '🔧'
  },
  {
    value: 'project',
    label: '프로젝트',
    description: '종합 프로젝트 평가',
    icon: '🎯'
  },
  {
    value: 'presentation',
    label: '발표',
    description: '발표 평가',
    icon: '🎤'
  }
];

export const gradeOptions: DropdownOption[] = [
  {
    value: 'A+',
    label: 'A+',
    description: '최우수',
    color: 'red'
  },
  {
    value: 'A',
    label: 'A',
    description: '우수',
    color: 'red'
  },
  {
    value: 'B+',
    label: 'B+',
    description: '양호',
    color: 'blue'
  },
  {
    value: 'B',
    label: 'B',
    description: '보통',
    color: 'blue'
  },
  {
    value: 'C',
    label: 'C',
    description: '미흡',
    color: 'yellow'
  },
  {
    value: 'F',
    label: 'F',
    description: '불합격',
    color: 'red'
  }
];

// ========================================
// 헬퍼 함수
// ========================================

/**
 * value로 option 찾기
 */
export function findOption(options: DropdownOption[], value: string): DropdownOption | undefined {
  return options.find(opt => opt.value === value);
}

/**
 * value로 label 가져오기
 */
export function getLabel(options: DropdownOption[], value: string): string {
  return findOption(options, value)?.label || value;
}

/**
 * value로 icon 가져오기
 */
export function getIcon(options: DropdownOption[], value: string): string {
  return findOption(options, value)?.icon || '';
}

/**
 * value로 color 가져오기
 */
export function getColor(options: DropdownOption[], value: string): string {
  return findOption(options, value)?.color || 'gray';
}

// ========================================
// 모든 옵션 그룹 export
// ========================================

export const allDropdownOptions = {
  examType: examTypeOptions,
  examStatus: examStatusOptions,
  questionType: questionTypeOptions,
  difficulty: difficultyOptions,
  courseStatus: courseStatusOptions,
  category: categoryOptions,
  attendanceStatus: attendanceStatusOptions,
  userRole: userRoleOptions,
  evaluationType: evaluationTypeOptions,
  grade: gradeOptions
};
