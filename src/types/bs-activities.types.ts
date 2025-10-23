// BS 활동 관리 시스템 타입 정의 (치과 방문 기반)

export interface BSActivity {
  id: string;
  trainee_id: string;
  trainee_name: string;
  visit_date: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone?: string;
  visit_purpose: string; // 방문 목적
  activities: ActivityDetail[];
  photos: ActivityPhoto[];
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  instructor_feedback?: InstructorFeedback;
  submission_deadline?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export interface ActivityDetail {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  participants: string[]; // 참여자 (의사, 환자, 스태프 등)
  learning_objectives: string[];
  what_learned: string; // 배운 내용
  challenges_faced: string; // 어려웠던 점
  how_handled: string; // 대처 방법
  reflection: string; // 성찰
  improvement_areas: string; // 개선할 점
  questions_for_instructor: string[]; // 강사에게 질문할 내용
  photos: string[]; // photo IDs
}

export type ActivityType = 
  | 'patient_consultation' // 환자 상담
  | 'treatment_observation' // 치료 관찰
  | 'reception_work' // 접수 업무
  | 'patient_education' // 환자 교육
  | 'clinic_tour' // 병원 견학
  | 'staff_meeting' // 스태프 미팅 참관
  | 'marketing_activity' // 마케팅 활동
  | 'follow_up_call' // 사후 관리 전화
  | 'other'; // 기타

export interface ActivityPhoto {
  id: string;
  activity_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  description: string;
  taken_at: string;
  uploaded_at: string;
  thumbnail_path?: string;
}

export interface InstructorFeedback {
  id: string;
  activity_id: string;
  instructor_id: string;
  instructor_name: string;
  overall_rating: number; // 1-5점
  detailed_feedback: ActivityFeedback[];
  strengths: string[];
  areas_for_improvement: string[];
  suggestions: string[];
  next_goals: string[];
  reviewed_at: string;
}

export interface ActivityFeedback {
  activity_detail_id: string;
  rating: number; // 1-5점
  comment: string;
  specific_suggestions: string[];
}

// 활동 유형별 설정
export const ACTIVITY_TYPE_CONFIG = {
  patient_consultation: {
    label: '환자 상담',
    icon: '💬',
    color: 'blue',
    description: '환자와의 상담 업무'
  },
  treatment_observation: {
    label: '치료 관찰',
    icon: '👁️',
    color: 'green',
    description: '치료 과정 관찰 및 학습'
  },
  reception_work: {
    label: '접수 업무',
    icon: '📋',
    color: 'purple',
    description: '접수, 예약, 안내 업무'
  },
  patient_education: {
    label: '환자 교육',
    icon: '📚',
    color: 'indigo',
    description: '환자 교육 및 안내'
  },
  clinic_tour: {
    label: '병원 견학',
    icon: '🏥',
    color: 'cyan',
    description: '병원 시설 및 운영 견학'
  },
  staff_meeting: {
    label: '스태프 미팅',
    icon: '👥',
    color: 'orange',
    description: '직원 회의 참관'
  },
  marketing_activity: {
    label: '마케팅 활동',
    icon: '📢',
    color: 'pink',
    description: '홍보 및 마케팅 활동'
  },
  follow_up_call: {
    label: '사후 관리',
    icon: '📞',
    color: 'yellow',
    description: '치료 후 사후 관리'
  },
  other: {
    label: '기타 활동',
    icon: '📝',
    color: 'gray',
    description: '기타 활동'
  }
} as const;

// 상태별 라벨
export const ACTIVITY_STATUS_LABELS = {
  draft: '작성 중',
  submitted: '제출 완료',
  reviewed: '검토 완료',
  approved: '승인 완료'
} as const;

// 통계 인터페이스
export interface BSActivityStats {
  trainee_id: string;
  total_activities: number;
  total_clinics_visited: number;
  total_hours: number;
  activity_type_breakdown: Record<ActivityType, number>;
  monthly_activities: Record<string, number>;
  average_rating: number;
  completion_rate: number;
  pending_feedback: number;
}

// 필터 옵션
export interface BSActivityFilter {
  trainee_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string[];
  activity_types?: ActivityType[];
  clinic_name?: string;
  has_photos?: boolean;
  has_feedback?: boolean;
}

// 검색 옵션
export interface BSActivitySearch {
  query: string;
  filters: BSActivityFilter;
  sort_by: 'visit_date' | 'created_at' | 'clinic_name' | 'status';
  sort_order: 'asc' | 'desc';
  page: number;
  per_page: number;
}

// 모의 데이터
export const MOCK_BS_ACTIVITIES: BSActivity[] = [
  {
    id: 'bs-activity-001',
    trainee_id: 'trainee-001',
    trainee_name: '김영업',
    visit_date: '2025-01-15',
    clinic_name: '서울스마일치과의원',
    clinic_address: '서울시 강남구 역삼동 123-45',
    clinic_phone: '02-1234-5678',
    visit_purpose: 'BS 영업 실습 및 치과 운영 시스템 학습',
    activities: [
      {
        id: 'activity-detail-001',
        type: 'patient_consultation',
        title: '임플란트 상담',
        description: '50대 여성 환자 임플란트 상담 진행',
        start_time: '09:30',
        end_time: '10:15',
        duration_minutes: 45,
        participants: ['김영업', '박환자', '이원장'],
        learning_objectives: [
          '환자 니즈 파악 기법 학습',
          '임플란트 치료 과정 설명법 습득',
          '환자 불안감 해소 방법 이해'
        ],
        what_learned: '환자의 심리적 상태를 파악하고 적절한 설명으로 신뢰를 구축하는 것이 중요함을 배웠습니다.',
        challenges_faced: '환자가 임플란트에 대한 막연한 두려움을 가지고 있어 설득에 어려움이 있었습니다.',
        how_handled: '다른 환자의 성공 사례를 보여드리고, 단계별 치료 과정을 자세히 설명하여 두려움을 해소했습니다.',
        reflection: '환자의 입장에서 생각하고 공감하는 것이 성공적인 상담의 핵심이라는 것을 깨달았습니다.',
        improvement_areas: '임플란트 관련 전문 지식을 더 쌓아서 환자의 질문에 더 자신 있게 답변할 수 있도록 해야겠습니다.',
        questions_for_instructor: [
          '어려운 환자를 설득할 때의 효과적인 접근법은?',
          '환자의 경제적 부담을 줄여주는 방안 제시법은?'
        ],
        photos: ['photo-001']
      },
      {
        id: 'activity-detail-002',
        type: 'reception_work',
        title: '신환 접수 업무',
        description: '신규 환자 접수 및 초진 안내 업무',
        start_time: '11:00',
        end_time: '12:00',
        duration_minutes: 60,
        participants: ['김영업', '최접수', '신환 3명'],
        learning_objectives: [
          '첫인상의 중요성 이해',
          '효율적인 접수 시스템 학습',
          '환자 대기 관리법 습득'
        ],
        what_learned: '첫 방문 환자에게 병원의 첫인상을 심어주는 중요한 역할임을 알게 되었습니다.',
        challenges_faced: '동시에 여러 환자가 방문하여 대기 시간이 길어지는 상황이 발생했습니다.',
        how_handled: '대기 환자들에게 예상 대기 시간을 안내하고, 병원 시설 안내로 지루함을 달래드렸습니다.',
        reflection: '체계적인 예약 관리와 환자 소통이 병원 운영의 기본이라는 것을 배웠습니다.',
        improvement_areas: '예약 시스템을 더 효율적으로 활용하는 방법을 배워야겠습니다.',
        questions_for_instructor: [
          '예약이 집중되는 시간대 관리법은?',
          '불만 환자 응대 시 주의사항은?'
        ],
        photos: []
      }
    ],
    photos: [
      {
        id: 'photo-001',
        activity_id: 'activity-detail-001',
        file_path: '/uploads/bs-activities/bs-activity-001/photo-001.jpg',
        file_name: 'consultation_room.jpg',
        file_size: 2456789,
        mime_type: 'image/jpeg',
        description: '상담실에서 환자와 상담하는 모습',
        taken_at: '2025-01-15T09:45:00Z',
        uploaded_at: '2025-01-15T18:30:00Z',
        thumbnail_path: '/uploads/bs-activities/bs-activity-001/thumbnails/photo-001_thumb.jpg'
      }
    ],
    status: 'submitted',
    instructor_feedback: {
      id: 'feedback-001',
      activity_id: 'bs-activity-001',
      instructor_id: 'instructor-001',
      instructor_name: '김영업 강사',
      overall_rating: 4,
      detailed_feedback: [
        {
          activity_detail_id: 'activity-detail-001',
          rating: 4,
          comment: '환자와의 소통 능력이 우수하고 학습 의지가 돋보입니다.',
          specific_suggestions: [
            '임플란트 관련 기술적 지식 보강',
            '다양한 상담 기법 연습'
          ]
        },
        {
          activity_detail_id: 'activity-detail-002',
          rating: 4,
          comment: '접수 업무에 대한 이해도가 높고 환자 서비스 마인드가 좋습니다.',
          specific_suggestions: [
            '예약 시스템 활용 능력 향상',
            '멀티태스킹 스킬 개발'
          ]
        }
      ],
      strengths: [
        '환자와의 소통 능력',
        '성실한 학습 태도',
        '상황 대처 능력'
      ],
      areas_for_improvement: [
        '전문 지식 보강',
        '업무 효율성 개선'
      ],
      suggestions: [
        '치과 관련 전문 서적 읽기',
        '선배들의 상담 과정 더 많이 관찰하기',
        '고객 서비스 관련 교육 참여'
      ],
      next_goals: [
        '독립적인 신환 상담 진행',
        '효율적인 예약 관리 시스템 구축',
        '환자 만족도 향상 방안 개발'
      ],
      reviewed_at: '2025-01-16T15:30:00Z'
    },
    submission_deadline: '2025-01-17T23:59:59Z',
    created_at: '2025-01-15T18:00:00Z',
    updated_at: '2025-01-16T15:30:00Z',
    submitted_at: '2025-01-15T18:30:00Z'
  }
];