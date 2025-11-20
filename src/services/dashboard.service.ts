import { supabase } from './supabase';
import { CourseService } from './course.services';
import { TraineeService } from './trainee.services';
import { CourseEnrollmentService } from './course-enrollment.service';

export interface DashboardStats {
  totalTrainees: number;
  traineeGrowth: number;
  activeCourses: number;
  courseGrowth: number;
  averageAttendance: number;
  attendanceGrowth: number;
  completionRate: number;
  completionGrowth: number;
}

export interface AttendanceTrendData {
  date: string;
  rate: number;
}

export interface CourseDistribution {
  courseType: string;
  count: number;
  percentage: number;
}

export interface InstructorWorkload {
  instructorName: string;
  activeCourses: number;
  totalTrainees: number;
}

export interface MonthlyComparison {
  month: string;
  trainees: number;
  courses: number;
  attendance: number;
}

export class DashboardService {
  /**
   * 대시보드 메인 통계 조회
   */
  static async getMainStats(): Promise<DashboardStats> {
    try {
      // 현재 날짜 기준
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // 1. 전체 교육생 수 및 증가율
      const { count: totalTrainees } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'trainee')
        .eq('is_active', true);

      const { count: lastMonthTrainees } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'trainee')
        .eq('is_active', true)
        .lt('created_at', currentMonth.toISOString());

      const traineeGrowth = lastMonthTrainees && lastMonthTrainees > 0
        ? ((totalTrainees || 0) - lastMonthTrainees) / lastMonthTrainees * 100
        : 0;

      // 2. 진행 중인 과정 수 및 증가율
      const { count: activeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: lastMonthCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('created_at', currentMonth.toISOString());

      const courseGrowth = lastMonthCourses && lastMonthCourses > 0
        ? ((activeCourses || 0) - lastMonthCourses) / lastMonthCourses * 100
        : 0;

      // 3. 평균 출석률 계산
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select('status')
        .gte('attendance_date', thirtyDaysAgo.toISOString());

      let averageAttendance = 94.5; // 기본값
      if (recentAttendance && recentAttendance.length > 0) {
        const presentCount = recentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        averageAttendance = (presentCount / recentAttendance.length) * 100;
      }

      // 이전 30일 출석률
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const { data: previousAttendance } = await supabase
        .from('attendance')
        .select('status')
        .gte('attendance_date', sixtyDaysAgo.toISOString())
        .lt('attendance_date', thirtyDaysAgo.toISOString());

      let previousAttendanceRate = averageAttendance;
      if (previousAttendance && previousAttendance.length > 0) {
        const previousPresent = previousAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        previousAttendanceRate = (previousPresent / previousAttendance.length) * 100;
      }

      const attendanceGrowth = previousAttendanceRate > 0
        ? ((averageAttendance - previousAttendanceRate) / previousAttendanceRate) * 100
        : 0;

      // 4. 완료율 계산
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('status, completion_date')
        .gte('created_at', currentMonth.toISOString());

      let completionRate = 87; // 기본값
      if (enrollments && enrollments.length > 0) {
        const completedCount = enrollments.filter(e => e.status === 'completed').length;
        completionRate = (completedCount / enrollments.length) * 100;
      }

      // 이전 달 완료율
      const { data: lastMonthEnrollments } = await supabase
        .from('course_enrollments')
        .select('status')
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', currentMonth.toISOString());

      let lastCompletionRate = completionRate;
      if (lastMonthEnrollments && lastMonthEnrollments.length > 0) {
        const lastCompleted = lastMonthEnrollments.filter(e => e.status === 'completed').length;
        lastCompletionRate = (lastCompleted / lastMonthEnrollments.length) * 100;
      }

      const completionGrowth = lastCompletionRate > 0
        ? ((completionRate - lastCompletionRate) / lastCompletionRate) * 100
        : 0;

      return {
        totalTrainees: totalTrainees || 0,
        traineeGrowth: Math.round(traineeGrowth * 10) / 10,
        activeCourses: activeCourses || 0,
        courseGrowth: Math.round(courseGrowth * 10) / 10,
        averageAttendance: Math.round(averageAttendance * 10) / 10,
        attendanceGrowth: Math.round(attendanceGrowth * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        completionGrowth: Math.round(completionGrowth * 10) / 10,
      };
    } catch (error) {
      console.error('대시보드 통계 조회 실패:', error);
      // 에러 시 기본 통계 반환
      return {
        totalTrainees: 0,
        traineeGrowth: 0,
        activeCourses: 0,
        courseGrowth: 0,
        averageAttendance: 0,
        attendanceGrowth: 0,
        completionRate: 0,
        completionGrowth: 0,
      };
    }
  }

  /**
   * 출석률 추이 데이터 조회 (최근 30일)
   */
  static async getAttendanceTrend(days: number = 30): Promise<AttendanceTrendData[]> {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const { data: attendance } = await supabase
        .from('attendance')
        .select('attendance_date, status')
        .gte('attendance_date', startDate.toISOString())
        .order('attendance_date', { ascending: true });

      if (!attendance || attendance.length === 0) {
        // 목업 데이터 생성
        return Array.from({ length: days }, (_, i) => {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return {
            date: date.toISOString().split('T')[0],
            rate: 90 + Math.random() * 10,
          };
        });
      }

      // 날짜별 출석률 계산
      const dailyStats: { [key: string]: { total: number; present: number } } = {};

      attendance.forEach(record => {
        const date = record.attendance_date.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { total: 0, present: 0 };
        }
        dailyStats[date].total++;
        if (record.status === 'present' || record.status === 'late') {
          dailyStats[date].present++;
        }
      });

      return Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        rate: (stats.present / stats.total) * 100,
      }));
    } catch (error) {
      console.error('출석률 추이 조회 실패:', error);
      return [];
    }
  }

  /**
   * 과정 유형별 분포 조회
   */
  static async getCourseDistribution(): Promise<CourseDistribution[]> {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select('category, status')
        .eq('status', 'active');

      if (!courses || courses.length === 0) {
        return [
          { courseType: 'BS Basic', count: 5, percentage: 35 },
          { courseType: 'BS Advanced', count: 3, percentage: 21 },
          { courseType: '심화 과정', count: 2, percentage: 14 },
          { courseType: '실습', count: 2, percentage: 14 },
          { courseType: '기초 과정', count: 1, percentage: 7 },
          { courseType: '리더십', count: 1, percentage: 7 },
        ];
      }

      // 카테고리별 집계
      const distribution: { [key: string]: number } = {};
      courses.forEach(course => {
        const category = course.category || '기타';
        distribution[category] = (distribution[category] || 0) + 1;
      });

      const total = courses.length;
      return Object.entries(distribution).map(([courseType, count]) => ({
        courseType,
        count,
        percentage: Math.round((count / total) * 100),
      }));
    } catch (error) {
      console.error('과정 분포 조회 실패:', error);
      return [];
    }
  }

  /**
   * 강사별 강의 부하 현황 조회
   */
  static async getInstructorWorkload(): Promise<InstructorWorkload[]> {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          instructor_id,
          current_trainees,
          users!courses_instructor_id_fkey(name)
        `)
        .eq('status', 'active')
        .not('instructor_id', 'is', null);

      if (!courses || courses.length === 0) {
        return [
          { instructorName: '김민수', activeCourses: 3, totalTrainees: 72 },
          { instructorName: '이영희', activeCourses: 2, totalTrainees: 48 },
          { instructorName: '박지훈', activeCourses: 2, totalTrainees: 42 },
          { instructorName: '최수진', activeCourses: 1, totalTrainees: 22 },
          { instructorName: '정다은', activeCourses: 1, totalTrainees: 26 },
        ];
      }

      // 강사별 집계
      const workload: { [key: string]: { count: number; trainees: number; name: string } } = {};

      courses.forEach(course => {
        const instructorId = course.instructor_id;
        const instructorName = course.users?.name || '미배정';

        if (!workload[instructorId]) {
          workload[instructorId] = { count: 0, trainees: 0, name: instructorName };
        }
        workload[instructorId].count++;
        workload[instructorId].trainees += course.current_trainees || 0;
      });

      return Object.values(workload)
        .map(w => ({
          instructorName: w.name,
          activeCourses: w.count,
          totalTrainees: w.trainees,
        }))
        .sort((a, b) => b.totalTrainees - a.totalTrainees);
    } catch (error) {
      console.error('강사 부하 조회 실패:', error);
      return [];
    }
  }

  /**
   * 월별 통계 비교 (최근 6개월)
   */
  static async getMonthlyComparison(): Promise<MonthlyComparison[]> {
    try {
      const now = new Date();
      const months: MonthlyComparison[] = [];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = monthDate.toLocaleDateString('ko-KR', { month: 'short' });

        // 해당 월의 교육생 수
        const { count: trainees } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'trainee')
          .lt('created_at', nextMonth.toISOString());

        // 해당 월의 과정 수
        const { count: courses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .gte('start_date', monthDate.toISOString())
          .lt('start_date', nextMonth.toISOString());

        // 해당 월의 출석률
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .gte('attendance_date', monthDate.toISOString())
          .lt('attendance_date', nextMonth.toISOString());

        let attendanceRate = 0;
        if (attendance && attendance.length > 0) {
          const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
          attendanceRate = (present / attendance.length) * 100;
        }

        months.push({
          month: monthName,
          trainees: trainees || 0,
          courses: courses || 0,
          attendance: Math.round(attendanceRate),
        });
      }

      return months;
    } catch (error) {
      console.error('월별 비교 조회 실패:', error);
      return [];
    }
  }

  /**
   * 활발한 과정 목록 조회 (테이블용)
   */
  static async getActiveCourses() {
    try {
      const { data: courses } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          category,
          current_trainees,
          max_trainees,
          users!courses_instructor_id_fkey(name)
        `)
        .eq('status', 'active')
        .order('current_trainees', { ascending: false })
        .limit(10);

      if (!courses || courses.length === 0) {
        return [];
      }

      return courses.map(course => ({
        name: course.name,
        type: course.category || '기타',
        trainees: course.current_trainees || 0,
        progress: Math.round(((course.current_trainees || 0) / (course.max_trainees || 1)) * 100),
        instructor: course.users?.name || '미배정',
      }));
    } catch (error) {
      console.error('활발한 과정 조회 실패:', error);
      return [];
    }
  }
}
