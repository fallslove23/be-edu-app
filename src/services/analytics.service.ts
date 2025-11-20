import { supabase } from './supabase';
import type {
  AnalyticsSummary,
  CoursePerformance,
  StudentPerformance,
  DepartmentStats,
  TimeSeriesData,
  InstructorStats,
  ActivityHeatmap,
  AchievementTrend,
  AnalyticsFilter,
  ComparisonAnalysis,
  CustomDateRange,
  ScoreDistribution
} from '../types/analytics.types';

/**
 * 통합 분석 서비스
 */
export class AnalyticsService {
  /**
   * 전체 통계 요약 조회
   */
  static async getSummary(filter?: AnalyticsFilter): Promise<AnalyticsSummary> {
    try {
      const dateFilter = this.getDateFilter(filter);

      // 현재 기간 통계
      const [
        totalStudents,
        activeStudents,
        totalCourses,
        activeCourses,
        completionData,
        scoreData,
        attendanceData,
        certificates
      ] = await Promise.all([
        this.getTotalStudents(dateFilter),
        this.getActiveStudents(dateFilter),
        this.getTotalCourses(dateFilter),
        this.getActiveCourses(dateFilter),
        this.getCompletionRate(dateFilter),
        this.getAverageScore(dateFilter),
        this.getAverageAttendance(dateFilter),
        this.getTotalCertificates(dateFilter)
      ]);

      // 이전 기간 통계 (성장률 계산용)
      const previousDateFilter = this.getPreviousPeriodFilter(filter);
      const [
        prevTotalStudents,
        prevActiveCourses,
        prevCompletionRate,
        prevAverageScore
      ] = await Promise.all([
        this.getTotalStudents(previousDateFilter),
        this.getActiveCourses(previousDateFilter),
        this.getCompletionRate(previousDateFilter),
        this.getAverageScore(previousDateFilter)
      ]);

      return {
        total_students: totalStudents,
        active_students: activeStudents,
        total_courses: totalCourses,
        active_courses: activeCourses,
        completion_rate: completionData,
        average_score: scoreData,
        average_attendance: attendanceData,
        total_certificates: certificates,

        // 성장률 계산
        student_growth: this.calculateGrowth(totalStudents, prevTotalStudents),
        course_growth: this.calculateGrowth(activeCourses, prevActiveCourses),
        completion_growth: this.calculateGrowth(completionData, prevCompletionRate),
        score_growth: this.calculateGrowth(scoreData, prevAverageScore)
      };
    } catch (error) {
      console.error('통계 요약 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 과정별 성과 분석
   */
  static async getCoursePerformance(
    courseId?: string,
    filter?: AnalyticsFilter
  ): Promise<CoursePerformance[]> {
    try {
      let query = supabase
        .from('courses')
        .select(`
          id,
          name,
          category,
          course_enrollments (
            status,
            final_score,
            enrolled_at,
            completion_date
          )
        `);

      if (courseId) {
        query = query.eq('id', courseId);
      }

      const { data: courses, error } = await query;

      if (error) throw error;

      const performanceData: CoursePerformance[] = await Promise.all(
        (courses || []).map(async (course: any) => {
          const enrollments = course.course_enrollments || [];
          const totalEnrolled = enrollments.length;
          const completed = enrollments.filter((e: any) => e.status === 'completed');
          const totalCompleted = completed.length;

          // 점수 분포 계산
          const scores = enrollments
            .filter((e: any) => e.final_score !== null)
            .map((e: any) => e.final_score);

          const scoreDistribution = this.calculateScoreDistribution(scores);

          // 출석률 계산
          const attendanceRate = await this.getCourseAttendanceRate(course.id);

          // 완료 시간 계산
          const completionTimes = completed
            .filter((e: any) => e.enrolled_at && e.completion_date)
            .map((e: any) => {
              const start = new Date(e.enrolled_at);
              const end = new Date(e.completion_date);
              return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            });

          return {
            course_id: course.id,
            course_name: course.name,
            category: course.category || '미분류',
            total_enrolled: totalEnrolled,
            total_completed: totalCompleted,
            completion_rate: totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : 0,
            dropout_rate: totalEnrolled > 0
              ? (enrollments.filter((e: any) => e.status === 'dropped').length / totalEnrolled) * 100
              : 0,
            average_score: scores.length > 0
              ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
              : 0,
            median_score: this.calculateMedian(scores),
            score_distribution: scoreDistribution,
            average_attendance: attendanceRate,
            perfect_attendance_count: await this.getPerfectAttendanceCount(course.id),
            assignment_submission_rate: await this.getAssignmentSubmissionRate(course.id),
            exam_pass_rate: await this.getExamPassRate(course.id),
            average_completion_time: completionTimes.length > 0
              ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
              : 0,
            fastest_completion: completionTimes.length > 0 ? Math.min(...completionTimes) : 0,
            slowest_completion: completionTimes.length > 0 ? Math.max(...completionTimes) : 0
          };
        })
      );

      return performanceData;
    } catch (error) {
      console.error('과정별 성과 조회 실패:', error);
      return [];
    }
  }

  /**
   * 교육생별 성과 분석
   */
  static async getStudentPerformance(
    filter?: AnalyticsFilter
  ): Promise<StudentPerformance[]> {
    try {
      const { data: students, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          department,
          course_enrollments (
            status,
            final_score,
            updated_at
          )
        `)
        .eq('role', 'trainee');

      if (error) throw error;

      const performanceData = (students || []).map((student: any) => {
        const enrollments = student.course_enrollments || [];
        const scores = enrollments
          .filter((e: any) => e.final_score !== null)
          .map((e: any) => e.final_score);

        const lastActivity = enrollments.length > 0
          ? enrollments.reduce((latest: any, e: any) => {
              return new Date(e.updated_at) > new Date(latest.updated_at) ? e : latest;
            }).updated_at
          : null;

        return {
          student_id: student.id,
          student_name: student.name,
          department: student.department || '미배정',
          enrolled_courses: enrollments.length,
          completed_courses: enrollments.filter((e: any) => e.status === 'completed').length,
          in_progress_courses: enrollments.filter((e: any) => e.status === 'active').length,
          overall_average: scores.length > 0
            ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
            : 0,
          highest_score: scores.length > 0 ? Math.max(...scores) : 0,
          lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
          attendance_rate: 0, // TODO: 출석 데이터 연동
          total_absences: 0, // TODO: 출석 데이터 연동
          last_activity_date: lastActivity || '',
          total_study_hours: 0, // TODO: 학습 시간 데이터 연동
          rank: 0, // 나중에 계산
          percentile: 0 // 나중에 계산
        };
      });

      // 순위 계산 (평균 점수 기준)
      const sorted = [...performanceData].sort((a, b) => b.overall_average - a.overall_average);
      sorted.forEach((student, index) => {
        const original = performanceData.find(s => s.student_id === student.student_id);
        if (original) {
          original.rank = index + 1;
          original.percentile = ((performanceData.length - index) / performanceData.length) * 100;
        }
      });

      return performanceData;
    } catch (error) {
      console.error('교육생별 성과 조회 실패:', error);
      return [];
    }
  }

  /**
   * 부서별 통계
   */
  static async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const { data: students, error } = await supabase
        .from('users')
        .select(`
          department,
          id,
          is_active,
          course_enrollments (
            status,
            final_score
          )
        `)
        .eq('role', 'trainee');

      if (error) throw error;

      // 부서별 그룹화
      const departmentMap = new Map<string, any[]>();
      (students || []).forEach((student: any) => {
        const dept = student.department || '미배정';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, []);
        }
        departmentMap.get(dept)!.push(student);
      });

      const stats: DepartmentStats[] = [];
      for (const [department, deptStudents] of departmentMap.entries()) {
        const allEnrollments = deptStudents.flatMap(s => s.course_enrollments || []);
        const scores = allEnrollments
          .filter(e => e.final_score !== null)
          .map(e => e.final_score);

        stats.push({
          department,
          total_students: deptStudents.length,
          active_students: deptStudents.filter((s: any) => s.is_active).length,
          average_score: scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : 0,
          average_attendance: 0, // TODO
          completion_rate: allEnrollments.length > 0
            ? (allEnrollments.filter(e => e.status === 'completed').length / allEnrollments.length) * 100
            : 0,
          total_courses_enrolled: allEnrollments.length,
          total_certificates: 0 // TODO
        });
      }

      return stats.sort((a, b) => b.total_students - a.total_students);
    } catch (error) {
      console.error('부서별 통계 조회 실패:', error);
      return [];
    }
  }

  /**
   * 시계열 데이터 조회
   */
  static async getTimeSeriesData(
    days: number = 30,
    filter?: AnalyticsFilter
  ): Promise<TimeSeriesData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const timeSeriesData: TimeSeriesData[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // 해당 날짜의 등록 수
        const { count: enrollments } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .gte('enrolled_at', dateStr)
          .lt('enrolled_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

        // 해당 날짜의 완료 수
        const { count: completions } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completion_date', dateStr)
          .lt('completion_date', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);

        timeSeriesData.push({
          date: dateStr,
          new_enrollments: enrollments || 0,
          completions: completions || 0,
          dropouts: 0, // TODO
          active_users: 0, // TODO
          total_study_hours: 0, // TODO
          average_score: 0, // TODO
          attendance_rate: 0 // TODO
        });
      }

      return timeSeriesData;
    } catch (error) {
      console.error('시계열 데이터 조회 실패:', error);
      return [];
    }
  }

  // ========== Helper Methods ==========

  private static getDateFilter(filter?: AnalyticsFilter): CustomDateRange {
    if (filter?.custom_range) {
      return filter.custom_range;
    }

    const endDate = new Date().toISOString().split('T')[0];
    let startDate = new Date();

    switch (filter?.date_range) {
      case 'today':
        startDate = new Date();
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate
    };
  }

  private static getPreviousPeriodFilter(filter?: AnalyticsFilter): CustomDateRange {
    const current = this.getDateFilter(filter);
    const currentStart = new Date(current.start_date);
    const currentEnd = new Date(current.end_date);
    const periodLength = currentEnd.getTime() - currentStart.getTime();

    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - periodLength);

    return {
      start_date: previousStart.toISOString().split('T')[0],
      end_date: previousEnd.toISOString().split('T')[0]
    };
  }

  private static calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private static calculateScoreDistribution(scores: number[]): ScoreDistribution {
    const distribution: ScoreDistribution = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0,
      'C+': 0, 'C': 0, 'D': 0, 'F': 0
    };

    scores.forEach(score => {
      if (score >= 95) distribution['A+']++;
      else if (score >= 90) distribution['A']++;
      else if (score >= 85) distribution['B+']++;
      else if (score >= 80) distribution['B']++;
      else if (score >= 75) distribution['C+']++;
      else if (score >= 70) distribution['C']++;
      else if (score >= 60) distribution['D']++;
      else distribution['F']++;
    });

    return distribution;
  }

  private static async getTotalStudents(dateFilter: CustomDateRange): Promise<number> {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'trainee');
    return count || 0;
  }

  private static async getActiveStudents(dateFilter: CustomDateRange): Promise<number> {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'trainee')
      .eq('is_active', true);
    return count || 0;
  }

  private static async getTotalCourses(dateFilter: CustomDateRange): Promise<number> {
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  private static async getActiveCourses(dateFilter: CustomDateRange): Promise<number> {
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .gte('end_date', new Date().toISOString().split('T')[0]);
    return count || 0;
  }

  private static async getCompletionRate(dateFilter: CustomDateRange): Promise<number> {
    const { count: total } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true });

    const { count: completed } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    return total && total > 0 ? ((completed || 0) / total) * 100 : 0;
  }

  private static async getAverageScore(dateFilter: CustomDateRange): Promise<number> {
    const { data } = await supabase
      .from('course_enrollments')
      .select('final_score')
      .not('final_score', 'is', null);

    const scores = (data || []).map(e => e.final_score);
    return scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;
  }

  private static async getAverageAttendance(dateFilter: CustomDateRange): Promise<number> {
    // TODO: 출석 데이터 연동
    return 0;
  }

  private static async getTotalCertificates(dateFilter: CustomDateRange): Promise<number> {
    // TODO: 인증서 데이터 연동
    return 0;
  }

  private static async getCourseAttendanceRate(courseId: string): Promise<number> {
    // TODO: 과정별 출석률 계산
    return 0;
  }

  private static async getPerfectAttendanceCount(courseId: string): Promise<number> {
    // TODO: 완벽 출석자 수 계산
    return 0;
  }

  private static async getAssignmentSubmissionRate(courseId: string): Promise<number> {
    // TODO: 과제 제출률 계산
    return 0;
  }

  private static async getExamPassRate(courseId: string): Promise<number> {
    // TODO: 시험 합격률 계산
    return 0;
  }
}
