export type UserRole = 'admin' | 'manager' | 'operator' | 'instructor' | 'trainee' | 'course_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  employee_id: string;
  role: UserRole;
  department: string;
  position: string;
  hire_date: string;
  status: UserStatus;
  avatar?: string;
  permissions?: string[];
  last_login?: string;
  password_hash?: string;
  first_login?: boolean;
  password_changed_at?: string;
  created_at: string;
  updated_at: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const roleLabels: Record<UserRole, string> = {
  admin: '관리자',
  manager: '조직장',
  operator: '운영',
  instructor: '강사',
  trainee: '교육생',
  course_manager: '과정 담당자'
};

export const userStatusLabels: Record<UserStatus, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '정지',
  pending: '승인대기'
};