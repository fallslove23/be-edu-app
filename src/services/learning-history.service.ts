import { supabase } from './supabase';
import type {
  LearningHistorySummary,
  CourseProgress,
  CompletionRequirements,
  CompletionEligibility,
  LearningReport,
  Achievement,
  ProgressTimeline,
  LearningHistoryFilter,
} from '../types/learning-history.types';

export class LearningHistoryService {
  /**
   * 기본 수료 조건
   */
  private static DEFAULT_REQUIREMENTS: CompletionRequirements = {
    min_attendance_rate: 80,
    min_assignment_rate: 70,
    min_exam_rate: 100,
    min_average_score: 60,
  };

  /**
   * 교육생의 전체 학습 이력 조회
   */
  static async getTraineeLearningHistory(traineeId: string): Promise<LearningHistorySummary> {
    try {
      // 교육생 기본 정보
      const { data: trainee } = await supabase
        .from('users')
        .select('name, employee_id, department')
        .eq('id', traineeId)
        .single();

      if (!trainee) {
        throw new Error('교육생을 찾을 수 없습니다.');
      }

      // 등록된 모든 과정 조회
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          status,
          enrolled_at,
          completion_date,
          final_score,
          courses (
            id,
            name,
            category,
            start_date,
            end_date
          )
        `)
        .eq('trainee_id', traineeId)
        .order('enrolled_at', { ascending: false });

      const courseProgressList: CourseProgress[] = [];

      for (const enrollment of enrollments || []) {
        const progress = await this.getCourseProgress(traineeId, enrollment.course_id);
        courseProgressList.push(progress);
      }

      // 전체 통계 계산
      const activeCount = courseProgressList.filter(c => c.status === 'active').length;
      const completedCount = courseProgressList.filter(c => c.status === 'completed').length;
      const droppedCount = courseProgressList.filter(c => c.status === 'dropped').length;

      const totalCourses = courseProgressList.length;
      const overallCompletionRate = totalCourses > 0
        ? (completedCount / totalCourses) * 100
        : 0;

      const overallAttendanceRate = totalCourses > 0
        ? courseProgressList.reduce((sum, c) => sum + c.attendance_rate, 0) / totalCourses
        : 0;

      const overallAverageScore = totalCourses > 0
        ? courseProgressList.reduce((sum, c) => sum + c.average_score, 0) / totalCourses
        : 0;

      // 최근 활동 날짜
      const lastActivityDate = courseProgressList.length > 0
        ? courseProgressList[0].end_date
        : new Date().toISOString();

      // 성취 배지 생성
      const achievements = await this.generateAchievements(traineeId, courseProgressList);

      return {
        trainee_id: traineeId,
        trainee_name: trainee.name,
        employee_id: trainee.employee_id || '',
        department: trainee.department || '',
        total_courses_enrolled: totalCourses,
        total_courses_completed: completedCount,
        total_courses_active: activeCount,
        total_courses_dropped: droppedCount,
        overall_completion_rate: Math.round(overallCompletionRate * 10) / 10,
        overall_attendance_rate: Math.round(overallAttendanceRate * 10) / 10,
        overall_average_score: Math.round(overallAverageScore * 10) / 10,
        course_progress: courseProgressList,
        last_activity_date: lastActivityDate,
        recent_achievements: achievements,
      };
    } catch (error) {
      console.error('학습 이력 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 과정의 진도율 계산
   */
  static async getCourseProgress(traineeId: string, courseId: string): Promise<CourseProgress> {
    try {
      // 과정 기본 정보
      const { data: course } = await supabase
        .from('courses')
        .select('name, category, start_date, end_date')
        .eq('id', courseId)
        .single();

      // 등록 정보
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('status, enrolled_at, completion_date, final_score')
        .eq('trainee_id', traineeId)
        .eq('course_id', courseId)
        .single();

      // 전체 세션 수
      const { count: totalSessions } = await supabase
        .from('course_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      // 출석 정보
      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('status')
        .eq('trainee_id', traineeId)
        .eq('course_id', courseId);

      const presentCount = attendanceRecords?.filter(a => a.status === 'present').length || 0;
      const lateCount = attendanceRecords?.filter(a => a.status === 'late').length || 0;
      const absentCount = attendanceRecords?.filter(a => a.status === 'absent').length || 0;
      const excusedCount = attendanceRecords?.filter(a => a.status === 'excused').length || 0;

      const attendedSessions = presentCount + lateCount;
      const attendanceRate = totalSessions && totalSessions > 0
        ? ((presentCount + lateCount) / totalSessions) * 100
        : 0;

      // 과제 정보 (evaluations 테이블에서 조회)
      const { count: assignmentsTotal } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('evaluation_type', 'assignment');

      const { count: assignmentsCompleted } = await supabase
        .from('evaluation_results')
        .select('*', { count: 'exact', head: true })
        .eq('trainee_id', traineeId)
        .eq('course_id', courseId)
        .not('score', 'is', null);

      const assignmentCompletionRate = assignmentsTotal && assignmentsTotal > 0
        ? ((assignmentsCompleted || 0) / assignmentsTotal) * 100
        : 0;

      // 시험 정보
      const { count: examsTotal } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      const { count: examsTaken } = await supabase
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .eq('trainee_id', traineeId)
        .eq('course_id', courseId);

      const examCompletionRate = examsTotal && examsTotal > 0
        ? ((examsTaken || 0) / examsTotal) * 100
        : 0;

      // 평균 점수 계산
      const { data: scores } = await supabase
        .from('evaluation_results')
        .select('score')
        .eq('trainee_id', traineeId)
        .eq('course_id', courseId)
        .not('score', 'is', null);

      const averageScore = scores && scores.length > 0
        ? scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length
        : 0;

      // 진도율 계산
      const progressPercentage = totalSessions && totalSessions > 0
        ? (attendedSessions / totalSessions) * 100
        : 0;

      // 수료 조건 확인
      const requirements = this.DEFAULT_REQUIREMENTS;
      const meetsRequirements = this.checkCompletionRequirements({
        attendance_rate: attendanceRate,
        assignment_completion_rate: assignmentCompletionRate,
        exam_completion_rate: examCompletionRate,
        average_score: averageScore,
      }, requirements);

      return {
        course_id: courseId,
        course_name: course?.name || '',
        category: course?.category || '',
        start_date: course?.start_date || '',
        end_date: course?.end_date || '',
        status: enrollment?.status || 'active',
        total_sessions: totalSessions || 0,
        attended_sessions: attendedSessions,
        progress_percentage: Math.round(progressPercentage * 10) / 10,
        attendance_rate: Math.round(attendanceRate * 10) / 10,
        present_count: presentCount,
        late_count: lateCount,
        absent_count: absentCount,
        excused_count: excusedCount,
        assignments_completed: assignmentsCompleted || 0,
        assignments_total: assignmentsTotal || 0,
        assignment_completion_rate: Math.round(assignmentCompletionRate * 10) / 10,
        exams_taken: examsTaken || 0,
        exams_total: examsTotal || 0,
        exam_completion_rate: Math.round(examCompletionRate * 10) / 10,
        average_score: Math.round(averageScore * 10) / 10,
        completion_requirements: requirements,
        meets_requirements: meetsRequirements,
        completion_date: enrollment?.completion_date,
      };
    } catch (error) {
      console.error('과정 진도 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 수료 조건 충족 여부 확인
   */
  private static checkCompletionRequirements(
    actual: {
      attendance_rate: number;
      assignment_completion_rate: number;
      exam_completion_rate: number;
      average_score: number;
    },
    requirements: CompletionRequirements
  ): boolean {
    return (
      actual.attendance_rate >= requirements.min_attendance_rate &&
      actual.assignment_completion_rate >= requirements.min_assignment_rate &&
      actual.exam_completion_rate >= requirements.min_exam_rate &&
      actual.average_score >= requirements.min_average_score
    );
  }

  /**
   * 수료 가능 여부 상세 확인
   */
  static async checkCompletionEligibility(
    traineeId: string,
    courseId: string
  ): Promise<CompletionEligibility> {
    const progress = await this.getCourseProgress(traineeId, courseId);
    const req = progress.completion_requirements;

    const requirementsMet = {
      attendance: progress.attendance_rate >= req.min_attendance_rate,
      assignments: progress.assignment_completion_rate >= req.min_assignment_rate,
      exams: progress.exam_completion_rate >= req.min_exam_rate,
      average_score: progress.average_score >= req.min_average_score,
    };

    const missingRequirements: string[] = [];
    const reasons: string[] = [];

    if (!requirementsMet.attendance) {
      missingRequirements.push('출석률');
      reasons.push(
        `출석률 ${progress.attendance_rate.toFixed(1)}% (필요: ${req.min_attendance_rate}% 이상)`
      );
    }

    if (!requirementsMet.assignments) {
      missingRequirements.push('과제 제출률');
      reasons.push(
        `과제 제출률 ${progress.assignment_completion_rate.toFixed(1)}% (필요: ${req.min_assignment_rate}% 이상)`
      );
    }

    if (!requirementsMet.exams) {
      missingRequirements.push('시험 응시율');
      reasons.push(
        `시험 응시율 ${progress.exam_completion_rate.toFixed(1)}% (필요: ${req.min_exam_rate}% 이상)`
      );
    }

    if (!requirementsMet.average_score) {
      missingRequirements.push('평균 점수');
      reasons.push(
        `평균 점수 ${progress.average_score.toFixed(1)}점 (필요: ${req.min_average_score}점 이상)`
      );
    }

    const isEligible = Object.values(requirementsMet).every(met => met);

    return {
      is_eligible: isEligible,
      reasons: isEligible ? ['모든 수료 조건을 충족했습니다.'] : reasons,
      requirements_met: requirementsMet,
      missing_requirements: missingRequirements,
    };
  }

  /**
   * 성취 배지 생성
   */
  private static async generateAchievements(
    traineeId: string,
    courseProgressList: CourseProgress[]
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // 과정 완료 배지
    const completedCourses = courseProgressList.filter(c => c.status === 'completed');
    if (completedCourses.length >= 5) {
      achievements.push({
        id: `completion-${traineeId}`,
        title: '학습 열정가',
        description: '5개 이상의 과정을 완료했습니다',
        type: 'completion',
        earned_date: new Date().toISOString(),
        icon: '🏆',
      });
    }

    // 완벽 출석 배지
    const perfectAttendance = courseProgressList.filter(c => c.attendance_rate === 100);
    if (perfectAttendance.length > 0) {
      achievements.push({
        id: `attendance-${traineeId}`,
        title: '완벽 출석',
        description: `${perfectAttendance[0].course_name}에서 100% 출석`,
        type: 'perfect_attendance',
        earned_date: new Date().toISOString(),
        course_name: perfectAttendance[0].course_name,
        icon: '✅',
      });
    }

    // 고득점 배지
    const highScoreCourses = courseProgressList.filter(c => c.average_score >= 90);
    if (highScoreCourses.length > 0) {
      achievements.push({
        id: `score-${traineeId}`,
        title: '우수 학습자',
        description: `${highScoreCourses[0].course_name}에서 평균 ${highScoreCourses[0].average_score}점`,
        type: 'high_score',
        earned_date: new Date().toISOString(),
        course_name: highScoreCourses[0].course_name,
        icon: '⭐',
      });
    }

    return achievements;
  }

  /**
   * 학습 이력서 생성
   */
  static async generateLearningReport(traineeId: string): Promise<LearningReport> {
    const history = await this.getTraineeLearningHistory(traineeId);

    const { data: trainee } = await supabase
      .from('users')
      .select('name, employee_id, department, position')
      .eq('id', traineeId)
      .single();

    // 총 교육 시간 계산
    const totalHours = history.course_progress.reduce((sum, course) => {
      return sum + (course.total_sessions * 2); // 세션당 2시간 가정
    }, 0);

    // 추천 사항 생성
    const recommendations: string[] = [];
    if (history.overall_attendance_rate < 80) {
      recommendations.push('출석률 개선이 필요합니다. 규칙적인 학습 습관을 만들어보세요.');
    }
    if (history.overall_average_score < 70) {
      recommendations.push('복습 시간을 늘려 평균 점수를 향상시켜보세요.');
    }
    if (history.total_courses_active === 0 && history.total_courses_completed > 0) {
      recommendations.push('새로운 과정에 도전해보세요!');
    }

    return {
      trainee_id: traineeId,
      trainee_name: trainee?.name || '',
      employee_id: trainee?.employee_id || '',
      department: trainee?.department || '',
      position: trainee?.position || '',
      report_period: {
        start_date: history.course_progress[history.course_progress.length - 1]?.start_date || '',
        end_date: history.course_progress[0]?.end_date || '',
      },
      summary: {
        total_courses: history.total_courses_enrolled,
        completed_courses: history.total_courses_completed,
        active_courses: history.total_courses_active,
        total_hours: totalHours,
        attendance_rate: history.overall_attendance_rate,
        average_score: history.overall_average_score,
      },
      course_details: history.course_progress,
      achievements: history.recent_achievements,
      recommendations,
      generated_at: new Date().toISOString(),
    };
  }
}
