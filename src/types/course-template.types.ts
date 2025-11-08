// BS 과정 템플릿 시스템 타입 정의

export interface CourseTemplate {
  id: string;
  name: string; // 'BS Basic', 'BS Advanced'
  description: string;
  category: 'basic' | 'advanced'; // Deprecated: use category_id
  category_id?: string; // FK to categories table
  category_data?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    parent_id?: string;
    parent_name?: string;
  };
  duration_days: number; // 전체 일수
  total_hours: number;
  curriculum: TemplateCurriculum[];
  requirements?: string[];
  objectives: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCurriculum {
  id: string;
  day: number; // 1일차, 2일차, 3일차...
  title: string;
  description: string;
  duration_hours: number;
  learning_objectives: string[];
  activities: string[];
  materials?: string[];
  assessment?: string;
}

export interface CourseRound {
  id: string;
  template_id: string;
  round_number: number; // 1차, 2차, 3차...
  title: string; // "BS Basic 3차"
  instructor_id: string;
  instructor_name: string;
  manager_id?: string; // 운영 담당자 ID
  manager_name?: string; // 운영 담당자 이름
  start_date: string;
  end_date: string;
  max_trainees: number;
  current_trainees: number;
  location: string;
  status: 'planning' | 'recruiting' | 'in_progress' | 'completed' | 'cancelled';
  description?: string; // 차수 설명
  sessions: CourseSession[];
  created_at: string;
  updated_at: string;
}

export interface CourseSession {
  id: string;
  round_id: string;
  template_curriculum_id: string;
  day_number: number; // 1일차, 2일차...
  title?: string; // 세션 제목
  session_date: string;
  scheduled_date?: string; // 예정일 (session_date와 동일하거나 별칭)
  start_time: string;
  end_time: string;
  classroom: string;
  actual_instructor_id?: string; // 해당 세션만 다른 강사가 진행할 경우
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  attendance_count?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  round_id: string;
  trainee_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped' | 'transferred';
  completion_rate: number;
  attendance_rate: number;
  final_score?: number;
  certificate_issued?: boolean;
  notes?: string;
}

// 통계용 인터페이스
export interface RoundStats {
  round_id: string;
  round_title: string;
  total_sessions: number;
  completed_sessions: number;
  total_trainees: number;
  active_trainees: number;
  completion_rate: number;
  average_attendance: number;
  next_session?: {
    date: string;
    time: string;
    day_number: number;
    title: string;
  };
}

// 대시보드용 요약 정보
export interface BSCourseSummary {
  template_name: string;
  active_rounds: number;
  total_trainees: number;
  this_month_sessions: number;
  upcoming_sessions: CourseSession[];
  completion_stats: {
    completed_rounds: number;
    total_graduates: number;
    average_satisfaction: number;
  };
}

// 템플릿 기본 데이터
export const DEFAULT_COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: 'bs-basic',
    name: 'BS Basic',
    description: 'BS 영업의 기초를 다지는 필수 과정',
    category: 'basic',
    duration_days: 3,
    total_hours: 21,
    objectives: [
      'BS 영업의 기본 개념 이해',
      '고객 접근 기법 습득',
      '기초 상담 스킬 개발',
      '영업 마인드셋 구축'
    ],
    requirements: [
      '신입 영업사원',
      'BS 영업 경험 6개월 미만'
    ],
    curriculum: [
      {
        id: 'bs-basic-day1',
        day: 1,
        title: 'BS 영업 기초 이론',
        description: 'BS 영업의 개념과 기본 원리 학습',
        duration_hours: 7,
        learning_objectives: [
          'BS 영업의 정의와 특징 이해',
          '영업 프로세스 전체 흐름 파악',
          '고객 유형별 접근법 학습'
        ],
        activities: [
          '이론 강의 (3시간)',
          '사례 연구 (2시간)',
          '토론 및 Q&A (1시간)',
          '실습 과제 (1시간)'
        ],
        materials: ['BS 영업 매뉴얼', '사례집', '실습 워크시트'],
        assessment: '이해도 체크 퀴즈'
      },
      {
        id: 'bs-basic-day2',
        day: 2,
        title: '고객 상담 기법',
        description: '효과적인 고객 상담 스킬 실습',
        duration_hours: 7,
        learning_objectives: [
          '고객 니즈 파악 기법 습득',
          '상담 시나리오별 대응법 학습',
          '거절 상황 극복 방법 이해'
        ],
        activities: [
          '상담 기법 강의 (2시간)',
          '롤플레이 실습 (3시간)',
          '피드백 세션 (1시간)',
          '개선 계획 수립 (1시간)'
        ],
        materials: ['상담 스크립트', '롤플레이 시나리오', '평가지'],
        assessment: '상담 실습 평가'
      },
      {
        id: 'bs-basic-day3',
        day: 3,
        title: '영업 실무 및 마무리',
        description: '실제 영업 상황 적용 및 과정 정리',
        duration_hours: 7,
        learning_objectives: [
          '학습 내용 실무 적용',
          '개인별 액션 플랜 수립',
          '지속적 개선 방안 모색'
        ],
        activities: [
          '종합 실습 (3시간)',
          '개인별 코칭 (2시간)',
          '액션 플랜 발표 (1시간)',
          '수료식 및 네트워킹 (1시간)'
        ],
        materials: ['종합 실습 자료', '액션 플랜 템플릿', '수료증'],
        assessment: '최종 프레젠테이션'
      }
    ],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'bs-advanced',
    name: 'BS Advanced',
    description: 'BS 영업 고급 전략과 리더십 개발',
    category: 'advanced',
    duration_days: 5,
    total_hours: 35,
    objectives: [
      '고급 영업 전략 수립 능력',
      '팀 리더십 및 코칭 스킬',
      '데이터 기반 의사결정',
      '혁신적 영업 기법 적용'
    ],
    requirements: [
      'BS Basic 과정 수료',
      'BS 영업 경험 1년 이상',
      '팀장급 이상 또는 리더 후보'
    ],
    curriculum: [
      {
        id: 'bs-advanced-day1',
        day: 1,
        title: '전략적 영업 기획',
        description: '데이터 기반 영업 전략 수립',
        duration_hours: 7,
        learning_objectives: [
          '시장 분석 및 전략 수립',
          '영업 데이터 활용법',
          '목표 설정 및 KPI 관리'
        ],
        activities: [
          '전략 기획 이론 (2시간)',
          '데이터 분석 실습 (3시간)',
          '전략 수립 워크숍 (2시간)'
        ],
        materials: ['전략 기획 가이드', '데이터 분석 도구', 'KPI 템플릿']
      },
      {
        id: 'bs-advanced-day2',
        day: 2,
        title: '고급 협상 기법',
        description: '복잡한 협상 상황에서의 전략적 접근',
        duration_hours: 7,
        learning_objectives: [
          '협상 심리학 이해',
          'Win-Win 협상 전략',
          '어려운 고객 대응법'
        ],
        activities: [
          '협상 이론 (2시간)',
          '협상 시뮬레이션 (4시간)',
          '사례 분석 (1시간)'
        ],
        materials: ['협상 매뉴얼', '시뮬레이션 자료', '사례집']
      },
      {
        id: 'bs-advanced-day3',
        day: 3,
        title: '팀 리더십 개발',
        description: '영업팀 리더로서의 역량 개발',
        duration_hours: 7,
        learning_objectives: [
          '팀 관리 및 동기부여',
          '코칭 및 피드백 스킬',
          '갈등 관리 및 해결'
        ],
        activities: [
          '리더십 이론 (2시간)',
          '코칭 실습 (3시간)',
          '리더십 진단 (2시간)'
        ],
        materials: ['리더십 진단 도구', '코칭 가이드', '사례 연구']
      },
      {
        id: 'bs-advanced-day4',
        day: 4,
        title: '디지털 영업 혁신',
        description: '최신 디지털 도구와 기법 활용',
        duration_hours: 7,
        learning_objectives: [
          'CRM 시스템 고급 활용',
          '소셜 셀링 전략',
          '온라인 고객 관리'
        ],
        activities: [
          '디지털 도구 교육 (3시간)',
          '실제 시스템 실습 (3시간)',
          '혁신 사례 연구 (1시간)'
        ],
        materials: ['CRM 가이드', '소셜 미디어 전략서', '실습용 계정']
      },
      {
        id: 'bs-advanced-day5',
        day: 5,
        title: '종합 프로젝트 및 발표',
        description: '학습 내용을 종합한 프로젝트 수행',
        duration_hours: 7,
        learning_objectives: [
          '학습 내용 통합 적용',
          '실무 개선 계획 수립',
          '지속적 발전 방안 도출'
        ],
        activities: [
          '프로젝트 수행 (4시간)',
          '발표 및 피드백 (2시간)',
          '수료식 및 네트워킹 (1시간)'
        ],
        materials: ['프로젝트 가이드', '발표 템플릿', '수료증']
      }
    ],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];