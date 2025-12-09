import { supabase } from './supabase';
import { CourseService } from './course.services';
import { UserService } from './user.services';
import { User } from './user.services';
import {
  TraineeDashboardData,
  LearningOverview,
  CourseProgress,
  UpcomingSchedule,
  WeeklyTasks,
  DashboardNotification,
  BSActivityTask,
  AssignmentTask,
  ExamTask,
  LearningStats,
  TraineeAchievement,
  TraineeProfileSummary
} from '../types/trainee-dashboard.types';
import { format, isToday, isThisWeek, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

export class TraineeDashboardService {
  // 교육생 대시보드 메인 데이터 조회
  static async getTraineeDashboard(traineeId: string): Promise<TraineeDashboardData> {
    try {
      const [
        student,
        learningOverview,
        currentCourses,
        upcomingSchedules,
        weeklyTasks,
        notifications
      ] = await Promise.all([
        this.getTraineeProfile(traineeId),
        this.getLearningOverview(traineeId),
        this.getCurrentCourses(traineeId),
        this.getUpcomingSchedules(traineeId),
        this.getWeeklyTasks(traineeId),
        this.getNotifications(traineeId)
      ]);

      return {
        student,
        learningOverview,
        currentCourses,
        upcomingSchedules,
        weeklyTasks,
        notifications
      };
    } catch (error) {
      console.error('TraineeDashboardService.getTraineeDashboard error:', error);
      throw error;
    }
  }

  // 교육생 프로필 조회
  static async getTraineeProfile(traineeId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', traineeId)
      .eq('role', 'trainee')
      .single();

    if (error) {
      console.error('교육생 프로필 조회 실패:', error);
      // 목업 데이터 반환
      return {
        id: traineeId,
        name: '교육생',
        email: 'trainee@example.com',
        phone: '010-0000-0000',
        employee_id: 'T000',
        role: 'trainee',
        department: '교육팀',
        position: '교육생',
        hire_date: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // 현재 레벨 계산 (과정 기반)
    const enrollments = await CourseService.getTraineeEnrollments(traineeId);
    let currentLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
    
    if (enrollments.some(e => e.course_name?.includes('Advanced') && e.status === 'completed')) {
      currentLevel = 'advanced';
    } else if (enrollments.some(e => e.course_name?.includes('Basic') && e.status === 'completed')) {
      currentLevel = 'intermediate';
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      first_login: data.first_login || false,
      department: data.department,
      employee_id: data.employee_id,
      is_active: data.is_active || true,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // 학습 개요 조회
  static async getLearningOverview(traineeId: string): Promise<LearningOverview> {
    const enrollments = await CourseService.getTraineeEnrollments(traineeId);
    
    const totalCoursesEnrolled = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'active').length;

    // TODO: 실제 학습 시간 계산 로직 구현
    const totalLearningHours = activeCourses * 40; // 임시값
    
    // TODO: 평균 점수 계산 로직 구현
    const averageScore = enrollments
      .filter(e => e.final_score)
      .reduce((sum, e) => sum + (e.final_score || 0), 0) / 
      enrollments.filter(e => e.final_score).length || 0;

    // TODO: 출석률 계산 (정부 시스템 연동 시 구현)
    const attendanceRate = 85; // 임시값

    return {
      totalCoursesEnrolled,
      completedCourses,
      activeCourses,
      totalLearningHours,
      averageScore: Math.round(averageScore),
      attendanceRate,
      bsActivitiesSubmitted: 0, // TODO: BS 활동 시스템 구현 시 연동
      bsActivitiesRequired: 10
    };
  }

  // 현재 수강 과정 진행 상황
  static async getCurrentCourses(traineeId: string): Promise<CourseProgress[]> {
    const enrollments = await CourseService.getTraineeEnrollments(traineeId);
    
    const progressList: CourseProgress[] = [];
    
    for (const enrollment of enrollments.filter(e => e.status === 'active')) {
      // 과정 상세 정보 조회
      const course = await CourseService.getCourseById(enrollment.course_id);
      
      // 다음 일정 조회
      const schedules = await CourseService.getCourseSchedules(enrollment.course_id);
      const nextSchedule = schedules
        .filter(s => new Date(s.scheduled_date) >= new Date())
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];

      // 진도율 계산 (전체 일정 대비 완료된 일정)
      const totalSessions = schedules.length;
      const completedSessions = schedules.filter(s => s.status === 'completed').length;
      const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      progressList.push({
        enrollment,
        course,
        progressPercentage,
        totalSessions,
        attendedSessions: completedSessions, // TODO: 실제 출석 데이터 연동
        currentScore: enrollment.final_score,
        nextSchedule: nextSchedule ? {
          id: nextSchedule.id,
          courseId: nextSchedule.course_id,
          courseName: nextSchedule.course_name,
          title: nextSchedule.title,
          scheduledDate: nextSchedule.scheduled_date,
          startTime: nextSchedule.start_time,
          endTime: nextSchedule.end_time,
          location: nextSchedule.location,
          instructorName: nextSchedule.instructor_name,
          type: 'class',
          status: nextSchedule.status,
          isToday: isToday(new Date(nextSchedule.scheduled_date)),
          isThisWeek: isThisWeek(new Date(nextSchedule.scheduled_date))
        } : undefined,
        isBasicCourse: course.name.toLowerCase().includes('basic'),
        isAdvancedCourse: course.name.toLowerCase().includes('advanced')
      });
    }

    return progressList;
  }

  // 다가오는 일정 조회
  static async getUpcomingSchedules(traineeId: string, days: number = 14): Promise<UpcomingSchedule[]> {
    const enrollments = await CourseService.getTraineeEnrollments(traineeId);
    const enrolledCourseIds = enrollments.map(e => e.course_id);
    
    if (enrolledCourseIds.length === 0) return [];

    // 등록된 과정들의 일정 조회
    const allSchedules = await Promise.all(
      enrolledCourseIds.map(courseId => CourseService.getCourseSchedules(courseId))
    );

    const flatSchedules = allSchedules.flat();
    
    // 향후 일정만 필터링
    const upcomingSchedules = flatSchedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.scheduled_date);
        const today = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(today.getDate() + days);
        
        return scheduleDate >= today && scheduleDate <= futureLimit;
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .map(schedule => ({
        id: schedule.id,
        courseId: schedule.course_id,
        courseName: schedule.course_name,
        title: schedule.title,
        scheduledDate: schedule.scheduled_date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        location: schedule.location,
        instructorName: schedule.instructor_name,
        type: 'class' as const,
        status: schedule.status,
        isToday: isToday(new Date(schedule.scheduled_date)),
        isThisWeek: isThisWeek(new Date(schedule.scheduled_date))
      }));

    return upcomingSchedules;
  }

  // 이번 주 할 일 조회
  static async getWeeklyTasks(traineeId: string): Promise<WeeklyTasks> {
    const weekStart = startOfWeek(new Date(), { locale: ko });
    const weekEnd = endOfWeek(new Date(), { locale: ko });

    const [upcomingSchedules, bsActivities, assignments, exams] = await Promise.all([
      this.getUpcomingSchedules(traineeId, 7),
      this.getBSActivityTasks(traineeId),
      this.getAssignmentTasks(traineeId), // TODO: 구현
      this.getExamTasks(traineeId) // TODO: 구현
    ]);

    const classesAttendanceRequired = upcomingSchedules.filter(s => 
      s.isThisWeek && s.status === 'scheduled'
    );

    const bsActivitiesDue = bsActivities.filter(activity => {
      const dueDate = new Date(activity.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd && activity.status === 'pending';
    });

    return {
      classesAttendanceRequired,
      bsActivitiesDue,
      assignmentsDue: assignments,
      examsDue: exams
    };
  }

  // BS 활동 과제 조회 (스텁 구현)
  static async getBSActivityTasks(traineeId: string): Promise<BSActivityTask[]> {
    // TODO: BS 활동 시스템 구현 시 실제 로직 추가
    const enrollments = await CourseService.getTraineeEnrollments(traineeId);
    
    // 임시 데이터
    return enrollments.map(enrollment => ({
      id: `bs_${enrollment.id}`,
      courseId: enrollment.course_id,
      courseName: enrollment.course_name,
      title: `${enrollment.course_name} BS 활동 제출`,
      description: '이번 주 현장 활동 내용을 사진과 함께 제출해주세요.',
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'pending' as const
    })).slice(0, 2); // 임시로 2개만 반환
  }

  // 과제 조회 (스텁 구현)
  static async getAssignmentTasks(traineeId: string): Promise<AssignmentTask[]> {
    // TODO: 과제 시스템 구현 시 실제 로직 추가
    return [];
  }

  // 시험 일정 조회 (스텁 구현)
  static async getExamTasks(traineeId: string): Promise<ExamTask[]> {
    // TODO: 시험 시스템 구현 시 실제 로직 추가
    return [];
  }

  // 알림 조회
  static async getNotifications(traineeId: string): Promise<DashboardNotification[]> {
    // TODO: 알림 시스템 구현
    return [
      {
        id: 'notif_1',
        type: 'info',
        title: '새로운 강의 자료',
        message: 'BS Basic 과정에 새로운 동영상 자료가 추가되었습니다.',
        createdAt: new Date().toISOString(),
        isRead: false,
        priority: 'medium'
      },
      {
        id: 'notif_2',
        type: 'warning',
        title: 'BS 활동 제출 마감',
        message: '이번 주 BS 활동 제출 마감이 2일 남았습니다.',
        createdAt: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      }
    ];
  }

  // 학습 통계 조회 (스텁 구현)
  static async getLearningStats(traineeId: string): Promise<LearningStats> {
    // TODO: 상세 통계 구현
    return {
      weeklyProgress: [],
      courseCompletion: [],
      attendanceHistory: [],
      scoreHistory: []
    };
  }

  // 성취도 조회 (스텁 구현)
  static async getTraineeAchievements(traineeId: string): Promise<TraineeAchievement[]> {
    // TODO: 성취도 시스템 구현
    return [];
  }

  // 알림 읽음 처리
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    // TODO: 알림 시스템 구현 시 실제 로직 추가
    console.log('Marking notification as read:', notificationId);
  }

  // 대시보드 데이터 새로고침
  static async refreshDashboard(traineeId: string): Promise<TraineeDashboardData> {
    // 캐시 클리어 후 재조회
    return this.getTraineeDashboard(traineeId);
  }
}