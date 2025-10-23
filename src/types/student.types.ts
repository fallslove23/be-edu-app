export interface StudentProfile {
  // 기본 정보
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  joinDate: string;
  employeeId: string;
  
  // 프로필 이미지
  avatar?: string;
  
  // 수강 이력
  enrollmentHistory: CourseEnrollment[];
  currentCourses: CourseEnrollment[];
  completedCourses: CourseEnrollment[];
  
  // 성과 지표
  overallGrade: number; // 전체 평균 성적
  attendanceRate: number; // 출석률 (%)
  satisfactionScore: number; // 만족도 (1-5)
  completionRate: number; // 수료율 (%)
  
  // 활동 기록
  totalJournals: number;
  totalPresentations: number;
  totalStudyHours: number;
  
  
  // 메타 정보
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  courseCode: string; // BS-2025-01
  courseName: string;
  session: number; // 차수
  enrollmentDate: string;
  completionDate?: string;
  status: 'enrolled' | 'completed' | 'dropped' | 'waiting' | 'suspended';
  
  // 성적 정보
  attendance: number; // 출석 횟수
  totalSessions: number; // 전체 세션 수
  attendanceRate: number; // 출석률 (%)
  examScores: ExamScore[];
  finalGrade: string; // A+, A, B+, B, C+, C, D+, D, F
  gradePoint: number; // 4.5 만점
  
  // 활동 기록
  journalCount: number;
  presentationCount: number;
  studyHours: number;
  
  // 피드백
  instructorFeedback?: string;
  studentFeedback?: string;
  satisfactionScore?: number; // 1-5
  
  // 수료 정보
  certificateIssued: boolean;
  certificateNumber?: string;
  
  // 메타 정보
  createdAt: string;
  updatedAt: string;
}

export interface ExamScore {
  examId: string;
  examName: string;
  examType: 'midterm' | 'final' | 'quiz' | 'assignment' | 'presentation';
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  examDate: string;
}


export interface LearningGoal {
  id: string;
  studentId: string;
  title: string;
  description: string;
  category: 'skill' | 'knowledge' | 'behavior' | 'performance';
  priority: 'high' | 'medium' | 'low';
  
  // 목표 설정
  targetDate: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string; // 점수, %, 시간 등
  
  // 진행 상황
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number; // 0-100%
  
  // 관련 과정
  relatedCourses: string[];
  
  // 메타 정보
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  
  // 성과 통계
  averageGrade: number;
  averageAttendance: number;
  averageSatisfaction: number;
  
  // 과정별 통계
  courseStatistics: {
    courseCode: string;
    courseName: string;
    totalEnrolled: number;
    completed: number;
    dropped: number;
    averageGrade: number;
    completionRate: number;
  }[];
  
  // 기간별 통계
  monthlyEnrollments: {
    month: string;
    count: number;
  }[];
  
  monthlyCompletions: {
    month: string;
    count: number;
  }[];
}

export interface StudentSearchFilters {
  name?: string;
  department?: string;
  position?: string;
  courseCode?: string;
  status?: string;
  enrollmentDateFrom?: string;
  enrollmentDateTo?: string;
  gradeRange?: {
    min: number;
    max: number;
  };
  attendanceRange?: {
    min: number;
    max: number;
  };
}

export interface StudentListItem {
  id: string;
  name: string;
  department: string;
  position: string;
  currentCourses: {
    courseCode: string;
    courseName: string;
    progress: number;
  }[];
  overallGrade: number;
  attendanceRate: number;
  lastActiveAt: string;
}

// 점수 관리를 위한 새로운 인터페이스들
export interface ScoreCategory {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  isActive: boolean;
  description?: string;
}

export interface StudentScore {
  id: string;
  studentId: string;
  studentName: string;
  round: number;
  courseId: string;
  courseDisplayName: string;
  companyId: string;
  companyName: string;
  
  // 점수 항목들
  theoryScore: number;
  practicalScore: number;
  bsActivityScore: number; // BS Advanced 과정만 해당
  attitudeScore: number;
  
  // 계산된 점수들
  overallScore: number;
  tScore: number; // Theory Score
  pScore: number; // Practical Score
  
  // 합격/불합격
  passFail: 'PASS' | 'FAIL' | 'PENDING';
  
  // 기타
  remarks: string;
  lastUpdated: string;
  updatedBy: string;
}

// 수강생 등록 관리를 위한 추가 타입들
export interface EnrollmentManagement {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_department?: string;
  student_position?: string;
  enrolled_at: string;
  status: 'enrolled' | 'completed' | 'dropped' | 'pending' | 'waitlisted';
  enrollment_type: 'individual' | 'bulk' | 'self' | 'admin';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface EnrollmentRequest {
  id: string;
  course_id: string;
  student_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  request_reason?: string;
  rejection_reason?: string;
  processed_by?: string;
  processed_at?: string;
}

export interface BulkEnrollmentData {
  course_id: string;
  student_ids: string[];
  enrollment_type: 'bulk';
  notes?: string;
  notify_students?: boolean;
}

export interface EnrollmentFilters {
  status?: string[];
  course_id?: string;
  department?: string[];
  position?: string[];
  enrolled_after?: string;
  enrolled_before?: string;
  search?: string;
}

export interface EnrollmentStats {
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  dropped_enrollments: number;
  pending_enrollments: number;
  completion_rate: number;
  dropout_rate: number;
  by_status: Record<string, number>;
  by_department: Record<string, number>;
  by_course: Record<string, number>;
}

export const enrollmentStatusLabels: { [key: string]: string } = {
  enrolled: '수강중',
  completed: '수료',
  dropped: '중도포기',
  pending: '승인대기',
  waitlisted: '대기목록'
};

export const enrollmentTypeLabels: { [key: string]: string } = {
  individual: '개별등록',
  bulk: '일괄등록',
  self: '자가신청',
  admin: '관리자등록'
};