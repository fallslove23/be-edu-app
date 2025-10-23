import { Course, CourseEnrollment, CourseSchedule } from './course.types';
import { User } from '../services/user.services';

// 교육생 대시보드 메인 데이터
export interface TraineeDashboardData {
  student: User;
  learningOverview: LearningOverview;
  currentCourses: CourseProgress[];
  upcomingSchedules: UpcomingSchedule[];
  weeklyTasks: WeeklyTasks;
  notifications: DashboardNotification[];
}

// 학습 개요
export interface LearningOverview {
  totalCoursesEnrolled: number;
  completedCourses: number;
  activeCourses: number;
  totalLearningHours: number;
  averageScore: number;
  attendanceRate: number;
  bsActivitiesSubmitted: number;
  bsActivitiesRequired: number;
}

// 과정별 진행 상황
export interface CourseProgress {
  enrollment: CourseEnrollment;
  course: Course;
  progressPercentage: number;
  totalSessions: number;
  attendedSessions: number;
  currentScore?: number;
  nextSchedule?: UpcomingSchedule;
  isBasicCourse: boolean;
  isAdvancedCourse: boolean;
}

// 다가오는 일정
export interface UpcomingSchedule {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  location?: string;
  instructorName?: string;
  type: 'class' | 'exam' | 'bs_activity' | 'assignment';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isToday: boolean;
  isThisWeek: boolean;
}

// 이번 주 할 일
export interface WeeklyTasks {
  classesAttendanceRequired: UpcomingSchedule[];
  bsActivitiesDue: BSActivityTask[];
  assignmentsDue: AssignmentTask[];
  examsDue: ExamTask[];
}

// BS 활동 과제
export interface BSActivityTask {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  feedback?: string;
  submittedAt?: string;
}

// 과제 (추후 확장용)
export interface AssignmentTask {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  submittedAt?: string;
}

// 시험 (추후 확장용)
export interface ExamTask {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  examDate: string;
  duration: number; // 분
  location?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  score?: number;
}

// 대시보드 알림
export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

// 학습 통계
export interface LearningStats {
  weeklyProgress: WeeklyProgressData[];
  courseCompletion: CourseCompletionData[];
  attendanceHistory: AttendanceHistoryData[];
  scoreHistory: ScoreHistoryData[];
}

export interface WeeklyProgressData {
  week: string;
  hoursStudied: number;
  classesAttended: number;
  bsActivitiesCompleted: number;
}

export interface CourseCompletionData {
  courseName: string;
  completionPercentage: number;
  totalSessions: number;
  completedSessions: number;
}

export interface AttendanceHistoryData {
  date: string;
  courseName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface ScoreHistoryData {
  date: string;
  courseName: string;
  examType: string;
  score: number;
  maxScore: number;
}

// 대시보드 설정
export interface DashboardSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  dashboard: {
    showDetailedStats: boolean;
    showUpcomingTasks: boolean;
    compactView: boolean;
  };
}

// 교육생별 성취도
export interface TraineeAchievement {
  id: string;
  traineeId: string;
  type: 'course_completion' | 'perfect_attendance' | 'top_performer' | 'bs_excellence';
  title: string;
  description: string;
  iconUrl?: string;
  earnedDate: string;
  courseId?: string;
}

// Quick Actions
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  enabled: boolean;
}

// 교육생 프로필 요약
export interface TraineeProfileSummary {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  department?: string;
  joinDate: string;
  profileImageUrl?: string;
  currentLevel: 'basic' | 'intermediate' | 'advanced';
  totalPoints: number;
  ranking?: number;
  totalStudents?: number;
}