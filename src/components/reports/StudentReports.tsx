import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ReportService } from '../../services/report.services';
import type {
  StudentReport,
  ReportStatistics,
  ReportFilter,
  ReportSort
} from '../../types/report.types';

/**
 * 교육생 리포트 메인 컴포넌트
 */
const StudentReports: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 정렬 상태
  const [filter, setFilter] = useState<ReportFilter>({});
  const [sort, setSort] = useState<ReportSort>({ field: 'name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, [filter, sort]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, reportList] = await Promise.all([
        ReportService.getReportStatistics(),
        ReportService.getReports(filter, sort)
      ]);
      setStatistics(stats);
      setReports(reportList);
    } catch (err) {
      console.error('리포트 로드 실패:', err);
      setError('리포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (report: StudentReport) => {
    setSelectedReport(report);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">리포트 로드 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <p className="font-semibold">오류 발생</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">교육생 리포트</h2>
          <p className="text-muted-foreground mt-1">
            교육생별 종합 성과 및 이수 현황 조회
          </p>
        </div>
      </div>

      {/* 통계 요약 (간단하게) */}
      {view === 'list' && statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">총 교육생</p>
                <p className="text-2xl font-bold">{statistics.total_trainees}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">총 이수</p>
                <p className="text-2xl font-bold">{statistics.total_completions}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">평균 이수율</p>
                <p className="text-2xl font-bold">{statistics.average_completion_rate.toFixed(1)}%</p>
              </div>
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">평균 성적</p>
                <p className="text-2xl font-bold">{statistics.average_score.toFixed(1)}점</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">평균 출석률</p>
                <p className="text-2xl font-bold">{statistics.average_attendance_rate.toFixed(1)}%</p>
              </div>
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-600 opacity-20" />
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">발급 인증서</p>
                <p className="text-2xl font-bold">{statistics.certificates_issued}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-indigo-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* 뷰 렌더링 */}
      {view === 'list' && (
        <StudentListView
          reports={reports}
          filter={filter}
          sort={sort}
          showFilters={showFilters}
          onFilterChange={setFilter}
          onSortChange={setSort}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onViewDetail={handleViewDetail}
          onRefresh={loadData}
        />
      )}

      {view === 'detail' && selectedReport && (
        <StudentDetailView report={selectedReport} onBack={handleBackToList} />
      )}
    </div>
  );
};

/**
 * 교육생 목록 뷰 컴포넌트
 */
interface StudentListViewProps {
  reports: StudentReport[];
  filter: ReportFilter;
  sort: ReportSort;
  showFilters: boolean;
  onFilterChange: (filter: ReportFilter) => void;
  onSortChange: (sort: ReportSort) => void;
  onToggleFilters: () => void;
  onViewDetail: (report: StudentReport) => void;
  onRefresh: () => void;
}

const StudentListView: React.FC<StudentListViewProps> = ({
  reports,
  filter,
  sort,
  showFilters,
  onFilterChange,
  onSortChange,
  onToggleFilters,
  onViewDetail,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState(filter.search || '');

  // 고유한 과정명과 차수 코드 추출
  const uniqueCourses = Array.from(
    new Set(
      reports.flatMap(r => r.course_completions.map(c => c.course_name))
    )
  ).sort();

  const uniqueSessions = Array.from(
    new Set(
      reports.flatMap(r => r.course_completions.map(c => c.session_code))
    )
  ).sort();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filter, search: searchTerm });
  };

  const handleSortChange = (field: 'name' | 'score' | 'attendance_rate') => {
    const newDirection = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, direction: newDirection });
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 바 */}
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[250px]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 또는 이메일로 검색..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </form>

        {/* 과정 필터 */}
        <select
          value={filter.course_name || ''}
          onChange={(e) => onFilterChange({ ...filter, course_name: e.target.value || undefined })}
          className="px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">전체 과정</option>
          {uniqueCourses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        {/* 차수 필터 */}
        <select
          value={filter.session_code || ''}
          onChange={(e) => onFilterChange({ ...filter, session_code: e.target.value || undefined })}
          className="px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">전체 차수</option>
          {uniqueSessions.map((session) => (
            <option key={session} value={session}>
              {session}
            </option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors whitespace-nowrap"
        >
          새로고침
        </button>
      </div>

      {/* 활성 필터 표시 */}
      {(filter.course_name || filter.session_code) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">활성 필터:</span>
          {filter.course_name && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              과정: {filter.course_name}
              <button
                onClick={() => onFilterChange({ ...filter, course_name: undefined })}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {filter.session_code && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              차수: {filter.session_code}
              <button
                onClick={() => onFilterChange({ ...filter, session_code: undefined })}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => onFilterChange({ search: filter.search })}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            전체 필터 초기화
          </button>
        </div>
      )}

      {/* 정렬 버튼 */}
      <div className="flex gap-2">
        <span className="text-sm text-muted-foreground self-center">정렬:</span>
        <button
          onClick={() => handleSortChange('name')}
          className={`px-3 py-1 text-sm rounded ${
            sort.field === 'name' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          이름 {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortChange('score')}
          className={`px-3 py-1 text-sm rounded ${
            sort.field === 'score' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          성적 {sort.field === 'score' && (sort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortChange('attendance_rate')}
          className={`px-3 py-1 text-sm rounded ${
            sort.field === 'attendance_rate' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          출석률 {sort.field === 'attendance_rate' && (sort.direction === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* 교육생 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.trainee.id}
            className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onViewDetail(report)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {report.trainee.profile_image_url ? (
                  <img
                    src={report.trainee.profile_image_url}
                    alt={report.trainee.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {report.trainee.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{report.trainee.name}</h3>
                  <p className="text-sm text-muted-foreground">{report.trainee.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">이수 과정</span>
                <span className="font-medium">
                  {report.overall_statistics.completed_courses}/{report.overall_statistics.total_courses}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">평균 성적</span>
                <span className={`font-medium ${getGradeColor(report.overall_statistics.average_score)}`}>
                  {report.overall_statistics.average_score.toFixed(1)}점
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">출석률</span>
                <span className="font-medium">
                  {report.overall_statistics.average_attendance_rate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">인증서</span>
                <span className="font-medium">
                  {report.overall_statistics.total_certificates}개
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-sm text-primary font-medium hover:underline">
                상세 보기 →
              </button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <UserGroupIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>교육생 리포트가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

/**
 * 교육생 상세 뷰 컴포넌트
 */
interface StudentDetailViewProps {
  report: StudentReport;
  onBack: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ report, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'grades' | 'attendance' | 'certificates'>('overview');

  const handleExportPDF = () => {
    // TODO: PDF 내보내기 구현
    alert('PDF 내보내기 기능은 추후 구현 예정입니다.');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-primary hover:underline font-medium"
        >
          ← 목록으로 돌아가기
        </button>
        <button
          onClick={handleExportPDF}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
          PDF 내보내기
        </button>
      </div>

      {/* 교육생 정보 카드 */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start gap-6">
          {report.trainee.profile_image_url ? (
            <img
              src={report.trainee.profile_image_url}
              alt={report.trainee.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {report.trainee.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{report.trainee.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">이메일: </span>
                <span>{report.trainee.email}</span>
              </div>
              {report.trainee.phone && (
                <div>
                  <span className="text-muted-foreground">전화번호: </span>
                  <span>{report.trainee.phone}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">가입일: </span>
                <span>{new Date(report.trainee.joined_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: '개요' },
            { id: 'courses', label: '과정 이수' },
            { id: 'grades', label: '성적' },
            { id: 'attendance', label: '출석' },
            { id: 'certificates', label: '인증서' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'overview' && <OverviewTab report={report} />}
        {activeTab === 'courses' && <CoursesTab report={report} />}
        {activeTab === 'grades' && <GradesTab report={report} />}
        {activeTab === 'attendance' && <AttendanceTab report={report} />}
        {activeTab === 'certificates' && <CertificatesTab report={report} />}
      </div>
    </div>
  );
};

/**
 * 개요 탭
 */
const OverviewTab: React.FC<{ report: StudentReport }> = ({ report }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-1">총 과정</p>
        <p className="text-3xl font-bold">{report.overall_statistics.total_courses}</p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-1">이수 완료</p>
        <p className="text-3xl font-bold text-green-600">{report.overall_statistics.completed_courses}</p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-1">수강 중</p>
        <p className="text-3xl font-bold text-blue-600">{report.overall_statistics.in_progress_courses}</p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-1">평균 성적</p>
        <p className="text-3xl font-bold text-orange-600">{report.overall_statistics.average_score.toFixed(1)}점</p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-1">평균 출석률</p>
        <p className="text-3xl font-bold text-teal-600">{report.overall_statistics.average_attendance_rate.toFixed(1)}%</p>
      </div>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-1">인증서</p>
        <p className="text-3xl font-bold text-indigo-600">{report.overall_statistics.total_certificates}개</p>
      </div>
    </div>
  );
};

/**
 * 과정 이수 탭
 */
const CoursesTab: React.FC<{ report: StudentReport }> = ({ report }) => {
  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { label: '완료', className: 'bg-green-100 text-green-800' },
      in_progress: { label: '수강중', className: 'bg-blue-100 text-blue-800' },
      dropped: { label: '중도포기', className: 'bg-red-100 text-red-800' },
      pending: { label: '대기', className: 'bg-gray-100 text-gray-800' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {report.course_completions.map((course) => (
        <div key={course.id} className="bg-card border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{course.course_name}</h3>
              <p className="text-sm text-muted-foreground">
                {course.session_code}
                {course.division_name && ` - ${course.division_name}`}
              </p>
            </div>
            {getStatusBadge(course.completion_status)}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">시작일: </span>
              <span>{new Date(course.start_date).toLocaleDateString('ko-KR')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">종료일: </span>
              <span>{new Date(course.end_date).toLocaleDateString('ko-KR')}</span>
            </div>
            {course.completion_date && (
              <div>
                <span className="text-muted-foreground">이수일: </span>
                <span>{new Date(course.completion_date).toLocaleDateString('ko-KR')}</span>
              </div>
            )}
            {course.certificate_issued && (
              <div>
                <span className="text-muted-foreground">인증서 번호: </span>
                <span>{course.certificate_number}</span>
              </div>
            )}
          </div>
        </div>
      ))}
      {report.course_completions.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">이수 과정이 없습니다.</p>
      )}
    </div>
  );
};

/**
 * 성적 탭
 */
const GradesTab: React.FC<{ report: StudentReport }> = ({ report }) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">과목</th>
              <th className="text-center py-3 px-4">점수</th>
              <th className="text-center py-3 px-4">백분율</th>
              <th className="text-center py-3 px-4">등급</th>
              <th className="text-center py-3 px-4">평가일</th>
            </tr>
          </thead>
          <tbody>
            {report.grades.map((grade, index) => (
              <tr key={index} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">{grade.subject}</td>
                <td className="text-center py-3 px-4">
                  {grade.score}/{grade.max_score}
                </td>
                <td className="text-center py-3 px-4">{grade.percentage.toFixed(1)}%</td>
                <td className="text-center py-3 px-4">
                  <span className="font-bold">{grade.grade}</span>
                </td>
                <td className="text-center py-3 px-4">
                  {new Date(grade.evaluation_date).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.grades.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">성적 정보가 없습니다.</p>
      )}
    </div>
  );
};

/**
 * 출석 탭
 */
const AttendanceTab: React.FC<{ report: StudentReport }> = ({ report }) => {
  const { attendance_summary } = report;

  return (
    <div className="space-y-6">
      {/* 출석 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">총 일수</p>
          <p className="text-2xl font-bold">{attendance_summary.total_days}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">출석</p>
          <p className="text-2xl font-bold text-green-600">{attendance_summary.present_days}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">지각</p>
          <p className="text-2xl font-bold text-yellow-600">{attendance_summary.late_days}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">결석</p>
          <p className="text-2xl font-bold text-red-600">{attendance_summary.absent_days}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">출석률</p>
          <p className="text-2xl font-bold text-blue-600">{attendance_summary.attendance_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* 출석률 프로그레스 바 */}
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-2">전체 출석률</p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${attendance_summary.attendance_rate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 인증서 탭
 */
const CertificatesTab: React.FC<{ report: StudentReport }> = ({ report }) => {
  return (
    <div className="space-y-4">
      {report.certificates.map((cert) => (
        <div key={cert.id} className="bg-card border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">{cert.course_name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                인증서 번호: {cert.certificate_number}
              </p>
              <p className="text-sm text-muted-foreground">
                발급일: {new Date(cert.issued_date).toLocaleDateString('ko-KR')}
              </p>
            </div>
            {cert.certificate_url && (
              <a
                href={cert.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ArrowDownTrayIcon className="h-5 w-5 inline mr-2" />
                다운로드
              </a>
            )}
          </div>
        </div>
      ))}
      {report.certificates.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">발급된 인증서가 없습니다.</p>
      )}
    </div>
  );
};

export default StudentReports;
