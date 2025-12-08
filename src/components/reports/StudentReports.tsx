import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { ReportService } from '../../services/report.services';
import IntegratedAnalyticsDashboard from './IntegratedAnalyticsDashboard';
import StudentDetailView from './StudentDetailView';
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
  const [mainView, setMainView] = useState<'reports' | 'analytics'>('reports');
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
          <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
      {/* 헤더 및 탭 네비게이션 */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">분석 및 보고서</h2>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            <button
              onClick={() => setMainView('analytics')}
              className={`flex items-center px-4 py-3 border-b-2 transition-colors ${mainView === 'analytics'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <DocumentChartBarIcon className="h-5 w-5 mr-2" />
              통합 분석 대시보드
            </button>
            <button
              onClick={() => setMainView('reports')}
              className={`flex items-center px-4 py-3 border-b-2 transition-colors ${mainView === 'reports'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              교육생 개별 리포트
            </button>
          </div>
        </div>
      </div>

      {/* 통합 분석 대시보드 */}
      {mainView === 'analytics' && (
        <IntegratedAnalyticsDashboard />
      )}

      {/* 기존 교육생 리포트 */}
      {mainView === 'reports' && (
        <div className="space-y-6">

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
    if (score >= 70) return 'text-foreground';
    return 'text-destructive';
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
          className="px-4 py-2 border rounded-full bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
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
          className="px-4 py-2 border rounded-full bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
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
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors whitespace-nowrap"
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
                className="hover:bg-blue-200 rounded-lg p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {filter.session_code && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-700 text-sm rounded-full">
              차수: {filter.session_code}
              <button
                onClick={() => onFilterChange({ ...filter, session_code: undefined })}
                className="hover:bg-green-200 rounded-lg p-0.5"
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
          className={`px-3 py-1 text-sm rounded ${sort.field === 'name' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
        >
          이름 {sort.field === 'name' && (sort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortChange('score')}
          className={`px-3 py-1 text-sm rounded ${sort.field === 'score' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
        >
          성적 {sort.field === 'score' && (sort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortChange('attendance_rate')}
          className={`px-3 py-1 text-sm rounded ${sort.field === 'attendance_rate' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
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
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
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
              <button className="w-full text-sm text-primary font-medium hover:underline rounded-full">
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


export default StudentReports;
