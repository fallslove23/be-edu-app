/**
 * 강사 대시보드 서비스
 */

import { supabase } from './supabase';
import { CourseService } from './course.services';
import { UserService } from './user.services';
import { User } from './user.services';
import {
  InstructorDashboardData,
  TeachingOverview,
  InstructorCourse,
  UpcomingClass,
  InstructorActivity,
  PaymentSummary,
  DashboardNotification,
  PaymentHistory
} from '../types/instructor-dashboard.types';
import { format, isToday, isThisWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

export class InstructorDashboardService {
  // 강사 대시보드 메인 데이터 조회
  static async getInstructorDashboard(instructorId: string): Promise<InstructorDashboardData> {
    try {
      const [
        instructor,
        teachingOverview,
        assignedCourses,
        upcomingClasses,
        recentActivities,
        paymentSummary,
        notifications
      ] = await Promise.all([
        this.getInstructorProfile(instructorId),
        this.getTeachingOverview(instructorId),
        this.getAssignedCourses(instructorId),
        this.getUpcomingClasses(instructorId),
        this.getRecentActivities(instructorId),
        this.getPaymentSummary(instructorId),
        this.getNotifications(instructorId)
      ]);

      return {
        instructor,
        teachingOverview,
        assignedCourses,
        upcomingClasses,
        recentActivities,
        paymentSummary,
        notifications
      };
    } catch (error) {
      console.error('InstructorDashboardService.getInstructorDashboard error:', error);
      throw error;
    }
  }

  // 강사 프로필 조회
  static async getInstructorProfile(instructorId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', instructorId)
      .eq('role', 'instructor')
      .single();

    if (error) throw error;

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

  // 강의 개요 조회
  static async getTeachingOverview(instructorId: string): Promise<TeachingOverview> {
    // 강사가 담당하는 과정 조회
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, status')
      .eq('instructor_id', instructorId);

    if (error) throw error;

    const totalCourses = courses?.length || 0;
    const activeCourses = courses?.filter(c => c.status === 'active').length || 0;
    const completedCourses = courses?.filter(c => c.status === 'completed').length || 0;

    // 수강생 수 계산 (활성 과정 기준)
    const activeCourseIds = courses?.filter(c => c.status === 'active').map(c => c.id) || [];
    let totalStudents = 0;
    let activeStudents = 0;

    if (activeCourseIds.length > 0) {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .in('course_id', activeCourseIds);

      totalStudents = enrollments?.length || 0;
      activeStudents = enrollments?.filter(e => e.status === 'active').length || 0;
    }

    // TODO: 실제 출석률, 강의 시간, 급여 계산 로직 구현
    const averageAttendanceRate = 88; // 임시값
    const totalTeachingHours = activeCourses * 40; // 임시값
    const upcomingPayment = activeCourses * 500000; // 임시값

    return {
      totalCourses,
      activeCourses,
      completedCourses,
      totalStudents,
      activeStudents,
      averageAttendanceRate,
      totalTeachingHours,
      upcomingPayment
    };
  }

  // 담당 과정 목록 조회
  static async getAssignedCourses(instructorId: string): Promise<InstructorCourse[]> {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('start_date', { ascending: false });

    if (error) throw error;

    const courseList: InstructorCourse[] = [];

    for (const course of courses || []) {
      // 과정 일정 조회
      const schedules = await CourseService.getCourseSchedules(course.id);
      const totalSessions = schedules.length;
      const completedSessions = schedules.filter(s => s.status === 'completed').length;

      // 수강생 수 조회
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', course.id);

      const totalStudents = enrollments?.length || 0;

      // 다음 수업 일정
      const nextSchedule = schedules
        .filter(s => new Date(s.scheduled_date) >= new Date() && s.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];

      courseList.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.course_code || '',
        status: course.status,
        startDate: course.start_date,
        endDate: course.end_date,
        totalSessions,
        completedSessions,
        totalStudents,
        averageAttendance: 85, // TODO: 실제 출석률 계산
        nextClass: nextSchedule ? {
          date: nextSchedule.scheduled_date,
          time: `${nextSchedule.start_time} - ${nextSchedule.end_time}`,
          location: nextSchedule.location || '미정'
        } : undefined
      });
    }

    return courseList;
  }

  // 다가오는 수업 조회
  static async getUpcomingClasses(instructorId: string, days: number = 14): Promise<UpcomingClass[]> {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, name')
      .eq('instructor_id', instructorId)
      .eq('status', 'active');

    if (error) throw error;

    const courseIds = courses?.map(c => c.id) || [];
    if (courseIds.length === 0) return [];

    // 향후 일정 조회
    const allSchedules = await Promise.all(
      courseIds.map(courseId => CourseService.getCourseSchedules(courseId))
    );

    const flatSchedules = allSchedules.flat();
    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + days);

    const upcomingClasses = flatSchedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.scheduled_date);
        return scheduleDate >= today && scheduleDate <= futureLimit && schedule.status === 'scheduled';
      })
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .map(schedule => ({
        id: schedule.id,
        courseId: schedule.course_id,
        courseName: schedule.course_name,
        scheduledDate: schedule.scheduled_date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        location: schedule.location || '미정',
        topic: schedule.title,
        studentsEnrolled: 0, // TODO: 수강생 수 계산
        isToday: isToday(new Date(schedule.scheduled_date)),
        isThisWeek: isThisWeek(new Date(schedule.scheduled_date))
      }));

    return upcomingClasses;
  }

  // 최근 활동 조회
  static async getRecentActivities(instructorId: string): Promise<InstructorActivity[]> {
    // TODO: 실제 활동 기록 시스템 구현 시 연동
    const activities: InstructorActivity[] = [
      {
        id: 'act_1',
        type: 'class_completed',
        title: '수업 완료',
        description: 'BS Basic 과정 5주차 수업을 완료했습니다.',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act_2',
        type: 'material_uploaded',
        title: '강의 자료 업로드',
        description: 'Week 6 강의 자료를 업로드했습니다.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'act_3',
        type: 'evaluation_submitted',
        title: '평가 제출',
        description: '중간 평가 결과를 제출했습니다.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    return activities;
  }

  // 급여 요약 조회
  static async getPaymentSummary(instructorId: string): Promise<PaymentSummary> {
    // TODO: 실제 급여 시스템 구현 시 연동
    const currentMonth = {
      totalAmount: 3000000,
      paidAmount: 1500000,
      pendingAmount: 1500000,
      completedClasses: 12,
      totalClasses: 24
    };

    const upcomingPayment = {
      amount: 1500000,
      paymentDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      status: 'pending' as const
    };

    const paymentHistory: PaymentHistory[] = [
      {
        id: 'pay_1',
        month: '2024-11',
        amount: 3000000,
        paidDate: '2024-11-30',
        status: 'paid'
      },
      {
        id: 'pay_2',
        month: '2024-10',
        amount: 2800000,
        paidDate: '2024-10-31',
        status: 'paid'
      }
    ];

    return {
      currentMonth,
      upcomingPayment,
      paymentHistory
    };
  }

  // 알림 조회
  static async getNotifications(instructorId: string): Promise<DashboardNotification[]> {
    // TODO: 알림 시스템 구현
    return [
      {
        id: 'notif_1',
        type: 'info',
        title: '새로운 수강생 등록',
        message: 'BS Advanced 과정에 3명의 새로운 수강생이 등록되었습니다.',
        createdAt: new Date().toISOString(),
        isRead: false,
        priority: 'medium'
      },
      {
        id: 'notif_2',
        type: 'warning',
        title: '평가 제출 기한',
        message: '중간 평가 결과 제출 기한이 3일 남았습니다.',
        createdAt: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      }
    ];
  }

  // 대시보드 데이터 새로고침
  static async refreshDashboard(instructorId: string): Promise<InstructorDashboardData> {
    return this.getInstructorDashboard(instructorId);
  }
}
