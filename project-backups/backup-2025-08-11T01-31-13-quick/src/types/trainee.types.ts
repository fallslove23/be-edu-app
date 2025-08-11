export interface Trainee {
  id: string;
  name: string;
  email: string;
  phone: string;
  employee_id: string;
  department: string;
  position: string;
  hire_date: string;
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