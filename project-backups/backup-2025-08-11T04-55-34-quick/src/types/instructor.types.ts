// 강사 관련 타입 정의
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Instructor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
  bio?: string;
  specializations: string[];
  years_of_experience: number;
  education_background?: string;
  certifications?: Certification[];
  teaching_subjects?: TeachingSubject[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: string;
  instructor_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  created_at: string;
}

export interface TeachingSubject {
  id: string;
  instructor_id: string;
  subject_name: string;
  proficiency_level: ProficiencyLevel;
  years_teaching: number;
  description?: string;
  created_at: string;
}

export interface CreateInstructorData {
  user_id: string;
  bio?: string;
  specializations: string[];
  years_of_experience: number;
  education_background?: string;
}

export interface UpdateInstructorData {
  profile_image_url?: string;
  bio?: string;
  specializations?: string[];
  years_of_experience?: number;
  education_background?: string;
  is_active?: boolean;
}

export interface CreateCertificationData {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
}

export interface CreateTeachingSubjectData {
  subject_name: string;
  proficiency_level: ProficiencyLevel;
  years_teaching: number;
  description?: string;
}

export interface InstructorStats {
  total_instructors: number;
  active_instructors: number;
  total_courses_taught: number;
  average_experience: number;
  specializations_distribution: { [key: string]: number };
}

// 전문성 레벨 라벨
export const proficiencyLevelLabels: { [key in ProficiencyLevel]: string } = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
  expert: '전문가'
};