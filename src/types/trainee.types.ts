export interface Trainee {
  id: string;
  name: string;
  email: string;
  phone: string;
  employee_id: string;
  division?: string; // 본부
  team?: string; // 팀
  department: string;
  position: string;
  workplace?: string; // 근무지(e-hr)
  hire_date: string;
  cohort?: string; // 입사 차수 (예: "25-6차" = 2025년 6번째 차수)
  enrolled_courses: string[]; // course IDs
  status: TraineeStatus;
  profile_image?: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

export type TraineeStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

export interface TraineeProgress {
  trainee_id: string;
  course_id: string;
  completion_rate: number; // 0-100
  exam_scores: {
    exam_id: string;
    score: number;
    attempt_count: number;
    completed_at: string;
  }[];
  practice_scores: {
    practice_id: string;
    score: number;
    feedback: string;
    completed_at: string;
  }[];
  overall_grade: string; // A, B, C, D, F
  notes: string;
  last_accessed: string;
}

export interface TraineeAssignment {
  id: string;
  trainee_id: string;
  course_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completion_date?: string;
}

export const traineeStatusLabels: Record<TraineeStatus, string> = {
  active: '활성',
  inactive: '비활성',
  graduated: '수료',
  suspended: '정지'
};

// 교육생 생성 데이터
export interface CreateTraineeData {
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  division?: string; // 본부
  team?: string; // 팀
  department: string;
  position?: string;
  workplace?: string; // 근무지(e-hr)
  hire_date?: string;
  cohort?: string; // 입사 차수
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  enrolled_courses?: string[];
}

// 대량 업로드 결과
export interface BulkUploadResult {
  success: Trainee[];
  failed: {
    trainee: Partial<Trainee>;
    error: string;
  }[];
  duplicates: {
    trainee: Partial<Trainee>;
    existingTrainee: {
      id: string;
      name: string;
      email: string;
      employee_id: string;
    };
    duplicateField: 'email' | 'employee_id';
  }[];
}

// 대량 업로드 옵션
export interface BulkUploadOptions {
  updateDuplicates: boolean; // 중복 데이터 업데이트 여부
  skipDuplicates: boolean;   // 중복 데이터 건너뛰기 여부
  validateOnly: boolean;     // 검증만 수행 여부
}