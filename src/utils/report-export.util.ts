import type { ExportOptions } from '../types/analytics.types';
import type { StudentReport } from '../types/report.types';
import type {
  AnalyticsSummary,
  CoursePerformance,
  StudentPerformance,
  DepartmentStats
} from '../types/analytics.types';

/**
 * 리포트 익스포트 유틸리티
 */
export class ReportExportUtil {
  /**
   * Excel 형식으로 교육생 리포트 다운로드
   */
  static async exportStudentReportToExcel(
    report: StudentReport,
    options: ExportOptions = { format: 'excel', include_charts: false, include_detailed_breakdown: true, language: 'ko' }
  ): Promise<void> {
    try {
      // CSV 형식으로 변환 (간단한 Excel 대체)
      const csvData = this.convertStudentReportToCSV(report);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `교육생_리포트_${report.trainee.name}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Excel 익스포트 실패:', error);
      throw error;
    }
  }

  /**
   * 분석 요약을 Excel로 다운로드
   */
  static async exportAnalyticsSummaryToExcel(
    summary: AnalyticsSummary,
    options: ExportOptions = { format: 'excel', include_charts: false, include_detailed_breakdown: true, language: 'ko' }
  ): Promise<void> {
    try {
      const csvData = this.convertAnalyticsSummaryToCSV(summary);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `분석_요약_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('분석 요약 익스포트 실패:', error);
      throw error;
    }
  }

  /**
   * 과정별 성과를 Excel로 다운로드
   */
  static async exportCoursePerformanceToExcel(
    performances: CoursePerformance[],
    options: ExportOptions = { format: 'excel', include_charts: false, include_detailed_breakdown: true, language: 'ko' }
  ): Promise<void> {
    try {
      const csvData = this.convertCoursePerformanceToCSV(performances);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `과정별_성과_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('과정별 성과 익스포트 실패:', error);
      throw error;
    }
  }

  /**
   * 교육생별 성과를 Excel로 다운로드
   */
  static async exportStudentPerformanceToExcel(
    performances: StudentPerformance[],
    options: ExportOptions = { format: 'excel', include_charts: false, include_detailed_breakdown: true, language: 'ko' }
  ): Promise<void> {
    try {
      const csvData = this.convertStudentPerformanceToCSV(performances);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `교육생별_성과_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('교육생별 성과 익스포트 실패:', error);
      throw error;
    }
  }

  /**
   * PDF 형식으로 리포트 다운로드
   */
  static async exportToPDF(
    report: StudentReport,
    options: ExportOptions = { format: 'pdf', include_charts: true, include_detailed_breakdown: true, language: 'ko' }
  ): Promise<void> {
    try {
      // PDF 생성을 위해 HTML을 구성
      const htmlContent = this.generateReportHTML(report, options);

      // 새 창에서 인쇄 대화상자 열기
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // 로드 완료 후 인쇄
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('PDF 익스포트 실패:', error);
      throw error;
    }
  }

  // ========== Helper Methods ==========

  private static convertStudentReportToCSV(report: StudentReport): string {
    const lines: string[] = [];

    // 헤더
    lines.push('BS 학습 관리 시스템 - 교육생 리포트');
    lines.push('');

    // 기본 정보
    lines.push('■ 기본 정보');
    lines.push(`이름,${report.trainee.name}`);
    lines.push(`이메일,${report.trainee.email}`);
    lines.push(`전화번호,${report.trainee.phone}`);
    lines.push(`가입일,${new Date(report.trainee.joined_at).toLocaleDateString('ko-KR')}`);
    lines.push('');

    // 전체 통계
    lines.push('■ 전체 통계');
    lines.push(`총 과정 수,${report.overall_statistics.total_courses}`);
    lines.push(`완료 과정 수,${report.overall_statistics.completed_courses}`);
    lines.push(`진행 중 과정 수,${report.overall_statistics.in_progress_courses}`);
    lines.push(`평균 점수,${report.overall_statistics.average_score.toFixed(1)}`);
    lines.push(`평균 출석률,${report.overall_statistics.average_attendance_rate.toFixed(1)}%`);
    lines.push(`발급 인증서 수,${report.overall_statistics.total_certificates}`);
    lines.push('');

    // 과정 이수 정보
    lines.push('■ 과정 이수 정보');
    lines.push('과정명,차수,시작일,종료일,상태,완료일,인증서 번호');
    report.course_completions.forEach(course => {
      lines.push([
        course.course_name,
        course.session_code,
        course.start_date,
        course.end_date,
        this.getStatusLabel(course.completion_status),
        course.completion_date || '-',
        course.certificate_number || '-'
      ].join(','));
    });
    lines.push('');

    // 성적 정보
    lines.push('■ 성적 정보');
    lines.push('과목,점수,만점,백분율,등급,평가일');
    report.grades.forEach(grade => {
      lines.push([
        grade.subject,
        grade.score,
        grade.max_score,
        grade.percentage.toFixed(1) + '%',
        grade.grade,
        grade.evaluation_date
      ].join(','));
    });
    lines.push('');

    // 출석 요약
    lines.push('■ 출석 요약');
    lines.push(`총 일수,${report.attendance_summary.total_days}`);
    lines.push(`출석,${report.attendance_summary.present_days}`);
    lines.push(`지각,${report.attendance_summary.late_days}`);
    lines.push(`결석,${report.attendance_summary.absent_days}`);
    lines.push(`출석률,${report.attendance_summary.attendance_rate.toFixed(1)}%`);

    return lines.join('\n');
  }

  private static convertAnalyticsSummaryToCSV(summary: AnalyticsSummary): string {
    const lines: string[] = [];

    lines.push('BS 학습 관리 시스템 - 분석 요약');
    lines.push('');

    lines.push('항목,현재 값,성장률');
    lines.push(`총 교육생 수,${summary.total_students},${summary.student_growth.toFixed(1)}%`);
    lines.push(`활성 교육생 수,${summary.active_students},-`);
    lines.push(`총 과정 수,${summary.total_courses},-`);
    lines.push(`활성 과정 수,${summary.active_courses},${summary.course_growth.toFixed(1)}%`);
    lines.push(`완료율,${summary.completion_rate.toFixed(1)}%,${summary.completion_growth.toFixed(1)}%`);
    lines.push(`평균 점수,${summary.average_score.toFixed(1)},${summary.score_growth.toFixed(1)}%`);
    lines.push(`평균 출석률,${summary.average_attendance.toFixed(1)}%,-`);
    lines.push(`발급 인증서 수,${summary.total_certificates},-`);

    return lines.join('\n');
  }

  private static convertCoursePerformanceToCSV(performances: CoursePerformance[]): string {
    const lines: string[] = [];

    lines.push('BS 학습 관리 시스템 - 과정별 성과');
    lines.push('');
    lines.push('과정명,카테고리,등록자,완료자,완료율,탈락률,평균점수,중앙값,평균출석률,완벽출석자,과제제출률,시험합격률,평균완료시간(일)');

    performances.forEach(perf => {
      lines.push([
        perf.course_name,
        perf.category,
        perf.total_enrolled,
        perf.total_completed,
        perf.completion_rate.toFixed(1) + '%',
        perf.dropout_rate.toFixed(1) + '%',
        perf.average_score.toFixed(1),
        perf.median_score.toFixed(1),
        perf.average_attendance.toFixed(1) + '%',
        perf.perfect_attendance_count,
        perf.assignment_submission_rate.toFixed(1) + '%',
        perf.exam_pass_rate.toFixed(1) + '%',
        perf.average_completion_time.toFixed(0)
      ].join(','));
    });

    return lines.join('\n');
  }

  private static convertStudentPerformanceToCSV(performances: StudentPerformance[]): string {
    const lines: string[] = [];

    lines.push('BS 학습 관리 시스템 - 교육생별 성과');
    lines.push('');
    lines.push('이름,부서,등록과정,완료과정,진행중,평균점수,최고점수,최저점수,출석률,순위,백분위');

    performances.forEach(perf => {
      lines.push([
        perf.student_name,
        perf.department,
        perf.enrolled_courses,
        perf.completed_courses,
        perf.in_progress_courses,
        perf.overall_average.toFixed(1),
        perf.highest_score.toFixed(1),
        perf.lowest_score.toFixed(1),
        perf.attendance_rate.toFixed(1) + '%',
        perf.rank,
        perf.percentile.toFixed(1)
      ].join(','));
    });

    return lines.join('\n');
  }

  private static generateReportHTML(report: StudentReport, options: ExportOptions): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>교육생 리포트 - ${report.trainee.name}</title>
  <style>
    body {
      font-family: 'Noto Sans KR', sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
    h2 { color: #6366f1; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background-color: #f9fafb; font-weight: 600; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .stat-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1f2937; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>BS 학습 관리 시스템 - 교육생 리포트</h1>

  <h2>기본 정보</h2>
  <table>
    <tr><th>이름</th><td>${report.trainee.name}</td></tr>
    <tr><th>이메일</th><td>${report.trainee.email}</td></tr>
    <tr><th>전화번호</th><td>${report.trainee.phone}</td></tr>
    <tr><th>가입일</th><td>${new Date(report.trainee.joined_at).toLocaleDateString('ko-KR')}</td></tr>
  </table>

  <h2>전체 통계</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">총 과정 수</div>
      <div class="stat-value">${report.overall_statistics.total_courses}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">완료 과정 수</div>
      <div class="stat-value">${report.overall_statistics.completed_courses}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">평균 점수</div>
      <div class="stat-value">${report.overall_statistics.average_score.toFixed(1)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">평균 출석률</div>
      <div class="stat-value">${report.overall_statistics.average_attendance_rate.toFixed(1)}%</div>
    </div>
  </div>

  <h2>과정 이수 정보</h2>
  <table>
    <thead>
      <tr>
        <th>과정명</th>
        <th>차수</th>
        <th>기간</th>
        <th>상태</th>
        <th>인증서</th>
      </tr>
    </thead>
    <tbody>
      ${report.course_completions.map(course => `
        <tr>
          <td>${course.course_name}</td>
          <td>${course.session_code}</td>
          <td>${course.start_date} ~ ${course.end_date}</td>
          <td>${this.getStatusLabel(course.completion_status)}</td>
          <td>${course.certificate_number || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>성적 정보</h2>
  <table>
    <thead>
      <tr>
        <th>과목</th>
        <th>점수</th>
        <th>등급</th>
        <th>평가일</th>
      </tr>
    </thead>
    <tbody>
      ${report.grades.map(grade => `
        <tr>
          <td>${grade.subject}</td>
          <td>${grade.score} / ${grade.max_score} (${grade.percentage.toFixed(1)}%)</td>
          <td>${grade.grade}</td>
          <td>${grade.evaluation_date}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer;">
      PDF로 저장
    </button>
  </div>
</body>
</html>
    `;
  }

  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': '완료',
      'in_progress': '진행중',
      'dropped': '중도포기',
      'pending': '대기중'
    };
    return labels[status] || status;
  }
}
