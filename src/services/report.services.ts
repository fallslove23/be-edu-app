import { supabase } from './supabase';
import type {
  StudentReport,
  TraineeBasicInfo,
  CourseCompletionInfo,
  GradeInfo,
  AttendanceSummary,
  ExamResult,
  CertificateInfo,
  ReportFilter,
  ReportSort,
  ReportStatistics,
  CompletionStatus,
  Grade
} from '../types/report.types';

/**
 * 교육생 리포트 서비스
 */
export class ReportService {
  /**
   * 교육생 종합 리포트 조회
   */
  static async getStudentReport(traineeId: string): Promise<StudentReport | null> {
    try {
      console.log('[ReportService] 교육생 리포트 조회:', traineeId);

      // 1. 교육생 기본 정보
      const trainee = await this.getTraineeBasicInfo(traineeId);
      if (!trainee) {
        console.error('[ReportService] 교육생을 찾을 수 없습니다:', traineeId);
        return null;
      }

      // 2. 과정 이수 정보
      const courseCompletions = await this.getCourseCompletions(traineeId);

      // 3. 현재 수강 중인 과정
      const currentCourses = courseCompletions.filter(c => c.completion_status === 'in_progress');

      // 4. 성적 정보
      const grades = await this.getGrades(traineeId);

      // 5. 출석 요약
      const attendanceSummary = await this.getAttendanceSummary(traineeId);

      // 6. 시험 결과
      const examResults = await this.getExamResults(traineeId);

      // 7. 인증서 정보
      const certificates = await this.getCertificates(traineeId);

      // 8. 전체 통계
      const overallStatistics = {
        total_courses: courseCompletions.length,
        completed_courses: courseCompletions.filter(c => c.completion_status === 'completed').length,
        in_progress_courses: currentCourses.length,
        average_score: grades.length > 0
          ? grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length
          : 0,
        average_attendance_rate: attendanceSummary.attendance_rate,
        total_certificates: certificates.length
      };

      const report: StudentReport = {
        trainee,
        course_completions: courseCompletions,
        current_courses,
        grades,
        attendance_summary: attendanceSummary,
        exam_results: examResults,
        certificates,
        overall_statistics: overallStatistics
      };

      console.log('[ReportService] ✅ 리포트 생성 완료');
      return report;

    } catch (error) {
      console.error('[ReportService] ❌ 리포트 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 교육생 기본 정보 조회
   */
  private static async getTraineeBasicInfo(traineeId: string): Promise<TraineeBasicInfo | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, profile_image_url, created_at')
        .eq('id', traineeId)
        .eq('role', 'trainee')
        .single();

      if (error) {
        console.warn('교육생 기본 정보 조회 실패, 목업 데이터 사용:', error.message);
        // 목업 데이터 반환
        return this.getMockTraineeInfo(traineeId);
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        profile_image_url: data.profile_image_url,
        joined_at: data.created_at
      };
    } catch (error) {
      console.warn('교육생 기본 정보 조회 중 예외 발생, 목업 데이터 사용:', error);
      return this.getMockTraineeInfo(traineeId);
    }
  }

  /**
   * 목업 교육생 정보 생성
   */
  private static getMockTraineeInfo(traineeId: string): TraineeBasicInfo {
    const mockNames = ['김철수', '이영희', '박민수', '정수진', '최동욱'];
    const randomIndex = parseInt(traineeId.slice(-1), 16) % mockNames.length;
    const name = mockNames[randomIndex];

    return {
      id: traineeId,
      name: name,
      email: `${name.toLowerCase()}@example.com`,
      phone: '010-1234-5678',
      profile_image_url: undefined,
      joined_at: new Date().toISOString()
    };
  }

  /**
   * 과정 이수 정보 조회
   */
  private static async getCourseCompletions(traineeId: string): Promise<CourseCompletionInfo[]> {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          enrolled_at,
          status,
          completed_at,
          course_id,
          courses (
            id,
            name,
            start_date,
            end_date
          )
        `)
        .eq('trainee_id', traineeId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('과정 이수 정보 조회 실패:', error);
        return [];
      }

      return (data || []).map((enrollment: any) => ({
        id: enrollment.id,
        course_name: enrollment.courses?.name || '과정명 없음',
        session_code: enrollment.course_id || '',
        division_name: undefined,
        start_date: enrollment.courses?.start_date || '',
        end_date: enrollment.courses?.end_date || '',
        completion_status: enrollment.status as CompletionStatus,
        completion_date: enrollment.completed_at,
        certificate_issued: false,
        certificate_number: undefined
      }));
    } catch (error) {
      console.error('과정 이수 정보 조회 중 예외 발생:', error);
      return [];
    }
  }

  /**
   * 성적 정보 조회
   */
  private static async getGrades(traineeId: string): Promise<GradeInfo[]> {
    // TODO: 실제 성적 테이블이 생성되면 구현
    // 현재는 시험 결과를 기반으로 생성
    const examResults = await this.getExamResults(traineeId);

    return examResults.map(exam => ({
      subject: exam.exam_title,
      score: exam.score,
      max_score: exam.max_score,
      percentage: exam.percentage,
      grade: exam.grade,
      evaluation_date: exam.taken_at
    }));
  }

  /**
   * 출석 요약 정보 조회
   */
  private static async getAttendanceSummary(traineeId: string): Promise<AttendanceSummary> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('status')
      .eq('trainee_id', traineeId);

    if (error) {
      console.error('출석 정보 조회 실패:', error);
      return {
        total_days: 0,
        present_days: 0,
        late_days: 0,
        absent_days: 0,
        excused_days: 0,
        attendance_rate: 0
      };
    }

    const records = data || [];
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const excusedDays = records.filter(r => r.status === 'excused').length;

    return {
      total_days: totalDays,
      present_days: presentDays,
      late_days: lateDays,
      absent_days: absentDays,
      excused_days: excusedDays,
      attendance_rate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  }

  /**
   * 시험 결과 조회
   */
  private static async getExamResults(traineeId: string): Promise<ExamResult[]> {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select(`
        id,
        score,
        submitted_at,
        time_spent_minutes,
        exam:exams(
          id,
          title,
          exam_type,
          total_points
        )
      `)
      .eq('trainee_id', traineeId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('시험 결과 조회 실패:', error);
      return [];
    }

    return (data || []).map((submission: any) => {
      const percentage = submission.exam?.total_points > 0
        ? (submission.score / submission.exam.total_points) * 100
        : 0;

      return {
        exam_id: submission.exam?.id || '',
        exam_title: submission.exam?.title || '시험명 없음',
        exam_type: submission.exam?.exam_type || 'quiz',
        score: submission.score || 0,
        max_score: submission.exam?.total_points || 100,
        percentage: percentage,
        grade: this.calculateGrade(percentage),
        taken_at: submission.submitted_at,
        time_spent_minutes: submission.time_spent_minutes
      };
    });
  }

  /**
   * 인증서 정보 조회
   */
  private static async getCertificates(traineeId: string): Promise<CertificateInfo[]> {
    // TODO: 인증서 테이블이 생성되면 구현
    // 현재는 빈 배열 반환
    return [];
  }

  /**
   * 점수로 등급 계산
   */
  private static calculateGrade(percentage: number): Grade {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * 리포트 목록 조회 (필터링 및 정렬)
   */
  static async getReports(
    filter?: ReportFilter,
    sort?: ReportSort
  ): Promise<StudentReport[]> {
    try {
      // 교육생 목록 조회
      let query = supabase
        .from('users')
        .select('id')
        .eq('role', 'trainee');

      // 검색 필터 적용
      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
      }

      const { data: trainees, error } = await query;

      // 실제 데이터가 없으면 목업 데이터 사용
      if (error || !trainees || trainees.length === 0) {
        console.warn('교육생 목록 조회 실패 또는 데이터 없음, 목업 데이터 사용');
        return this.getMockReports(filter, sort);
      }

      // 각 교육생의 리포트 생성
      const reports = await Promise.all(
        (trainees || []).map(trainee => this.getStudentReport(trainee.id))
      );

      // null 제거
      const validReports = reports.filter(r => r !== null) as StudentReport[];

      // 정렬 적용
      if (sort) {
        this.sortReports(validReports, sort);
      }

      return validReports;

    } catch (error) {
      console.error('리포트 목록 조회 실패, 목업 데이터 사용:', error);
      return this.getMockReports(filter, sort);
    }
  }

  /**
   * 리포트 정렬
   */
  private static sortReports(reports: StudentReport[], sort: ReportSort): void {
    reports.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.trainee.name;
          bValue = b.trainee.name;
          break;
        case 'score':
          aValue = a.overall_statistics.average_score;
          bValue = b.overall_statistics.average_score;
          break;
        case 'attendance_rate':
          aValue = a.overall_statistics.average_attendance_rate;
          bValue = b.overall_statistics.average_attendance_rate;
          break;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  /**
   * 목업 리포트 생성
   */
  private static getMockReports(filter?: ReportFilter, sort?: ReportSort): StudentReport[] {
    const mockTrainees = [
      { id: '1', name: '김철수', email: 'kim@example.com' },
      { id: '2', name: '이영희', email: 'lee@example.com' },
      { id: '3', name: '박민수', email: 'park@example.com' },
      { id: '4', name: '정수진', email: 'jung@example.com' },
      { id: '5', name: '최동욱', email: 'choi@example.com' }
    ];

    let reports: StudentReport[] = mockTrainees.map((trainee, index) => ({
      trainee: {
        id: trainee.id,
        name: trainee.name,
        email: trainee.email,
        phone: '010-1234-5678',
        profile_image_url: undefined,
        joined_at: new Date(2024, 0, index + 1).toISOString()
      },
      course_completions: [
        {
          id: `completion-${trainee.id}-1`,
          course_name: 'BS Basic 과정',
          session_code: 'BS-2024-01',
          division_name: 'A반',
          start_date: '2024-01-01',
          end_date: '2024-03-31',
          completion_status: 'completed',
          completion_date: '2024-03-31',
          certificate_issued: true,
          certificate_number: `CERT-2024-${trainee.id}`
        },
        {
          id: `completion-${trainee.id}-2`,
          course_name: 'BS Advanced 과정',
          session_code: 'BS-2024-02',
          division_name: 'B반',
          start_date: '2024-04-01',
          end_date: '2024-06-30',
          completion_status: 'in_progress',
          completion_date: undefined,
          certificate_issued: false,
          certificate_number: undefined
        }
      ],
      current_courses: [
        {
          id: `completion-${trainee.id}-2`,
          course_name: 'BS Advanced 과정',
          session_code: 'BS-2024-02',
          division_name: 'B반',
          start_date: '2024-04-01',
          end_date: '2024-06-30',
          completion_status: 'in_progress',
          completion_date: undefined,
          certificate_issued: false,
          certificate_number: undefined
        }
      ],
      grades: [
        {
          subject: 'BS 이론 시험',
          score: 85 + index * 3,
          max_score: 100,
          percentage: 85 + index * 3,
          grade: this.calculateGrade(85 + index * 3),
          evaluation_date: '2024-03-15'
        }
      ],
      attendance_summary: {
        total_days: 60,
        present_days: 55 - index,
        late_days: 3,
        absent_days: 2 + index,
        excused_days: 0,
        attendance_rate: ((55 - index) / 60) * 100
      },
      exam_results: [
        {
          exam_id: `exam-${trainee.id}-1`,
          exam_title: 'BS 이론 시험',
          exam_type: 'final',
          score: 85 + index * 3,
          max_score: 100,
          percentage: 85 + index * 3,
          grade: this.calculateGrade(85 + index * 3),
          taken_at: '2024-03-15',
          time_spent_minutes: 90
        }
      ],
      certificates: [
        {
          id: `cert-${trainee.id}-1`,
          course_name: 'BS Basic 과정',
          certificate_number: `CERT-2024-${trainee.id}`,
          issued_date: '2024-04-01',
          certificate_url: undefined
        }
      ],
      overall_statistics: {
        total_courses: 2,
        completed_courses: 1,
        in_progress_courses: 1,
        average_score: 85 + index * 3,
        average_attendance_rate: ((55 - index) / 60) * 100,
        total_certificates: 1
      }
    }));

    // 검색 필터 적용
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      reports = reports.filter(r =>
        r.trainee.name.toLowerCase().includes(searchLower) ||
        r.trainee.email.toLowerCase().includes(searchLower)
      );
    }

    // 과정명 필터 적용
    if (filter?.course_name) {
      reports = reports.filter(r =>
        r.course_completions.some(c => c.course_name === filter.course_name)
      );
    }

    // 차수 코드 필터 적용
    if (filter?.session_code) {
      reports = reports.filter(r =>
        r.course_completions.some(c => c.session_code === filter.session_code)
      );
    }

    // 정렬 적용
    if (sort) {
      this.sortReports(reports, sort);
    }

    return reports;
  }

  /**
   * 리포트 통계 조회
   */
  static async getReportStatistics(): Promise<ReportStatistics> {
    try {
      const reports = await this.getReports();

      const totalCompletions = reports.reduce(
        (sum, r) => sum + r.overall_statistics.completed_courses,
        0
      );

      const totalCourses = reports.reduce(
        (sum, r) => sum + r.overall_statistics.total_courses,
        0
      );

      const averageScore = reports.length > 0
        ? reports.reduce((sum, r) => sum + r.overall_statistics.average_score, 0) / reports.length
        : 0;

      const averageAttendanceRate = reports.length > 0
        ? reports.reduce((sum, r) => sum + r.overall_statistics.average_attendance_rate, 0) / reports.length
        : 0;

      const certificatesIssued = reports.reduce(
        (sum, r) => sum + r.overall_statistics.total_certificates,
        0
      );

      return {
        total_trainees: reports.length,
        total_completions: totalCompletions,
        average_completion_rate: totalCourses > 0 ? (totalCompletions / totalCourses) * 100 : 0,
        average_score: averageScore,
        average_attendance_rate: averageAttendanceRate,
        certificates_issued: certificatesIssued
      };

    } catch (error) {
      console.error('리포트 통계 조회 실패:', error);
      return {
        total_trainees: 0,
        total_completions: 0,
        average_completion_rate: 0,
        average_score: 0,
        average_attendance_rate: 0,
        certificates_issued: 0
      };
    }
  }
}
