/**
 * 강사 대시보드 타입 정의
 */

import { User } from '../services/user.services';

// 강사 대시보드 메인 데이터
export interface InstructorDashboardData {
  instructor: User;
  teachingOverview: TeachingOverview;
  assignedCourses: InstructorCourse[];
  upcomingClasses: UpcomingClass[];
  recentActivities: InstructorActivity[];
  paymentSummary: PaymentSummary;
  notifications: DashboardNotification[];
}

// 강의 개요
export interface TeachingOverview {
  totalCourses: number;
  activeCourses: number;
  completedCourses: number;
  totalStudents: number;
  activeStudents: number;
  averageAttendanceRate: number;
  totalTeachingHours: number;
  upcomingPayment: number;
}

// 강사가 담당하는 과정
export interface InstructorCourse {
  courseId: string;
  courseName: string;
  courseCode: string;
  status: 'scheduled' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  totalStudents: number;
  averageAttendance: number;
  nextClass?: {
    date: string;
    time: string;
    location: string;
  };
}

// 다가오는 수업
export interface UpcomingClass {
  id: string;
  courseId: string;
  courseName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  location: string;
  topic: string;
  studentsEnrolled: number;
  isToday: boolean;
  isThisWeek: boolean;
}

// 강사 활동 기록
export interface InstructorActivity {
  id: string;
  type: 'class_completed' | 'evaluation_submitted' | 'material_uploaded' | 'feedback_received';
  title: string;
  description: string;
  courseId?: string;
  courseName?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// 급여 요약
export interface PaymentSummary {
  currentMonth: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    completedClasses: number;
    totalClasses: number;
  };
  upcomingPayment: {
    amount: number;
    paymentDate: string;
    status: 'pending' | 'processing' | 'scheduled';
  };
  paymentHistory: PaymentHistory[];
}

export interface PaymentHistory {
  id: string;
  month: string;
  amount: number;
  paidDate: string;
  status: 'paid' | 'pending' | 'cancelled';
}

// 알림
export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

// 출석 통계
export interface AttendanceStats {
  courseId: string;
  courseName: string;
  totalSessions: number;
  attendanceData: {
    date: string;
    present: number;
    absent: number;
    late: number;
  }[];
}

// 강의 평가 결과
export interface CourseEvaluation {
  courseId: string;
  courseName: string;
  averageRating: number;
  totalEvaluations: number;
  categories: {
    teaching: number;
    content: number;
    materials: number;
    communication: number;
  };
  recentFeedback: {
    rating: number;
    comment: string;
    date: string;
  }[];
}
