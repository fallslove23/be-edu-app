import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  UserIcon,
  TrophyIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { ReportService } from '../../services/report.services';
import type {
  StudentReport,
  ReportStatistics,
  ReportFilter,
  ReportSort
} from '../../types/report.types';

// 기존 StudentReports.tsx에서 사용하던 하위 컴포넌트들 import
// (StudentListView, StudentDetailView는 기존 파일에 그대로 있음)

/**
 * 교육생 리포트 컨텐츠 컴포넌트
 * (탭 내부에서 사용하기 위한 컴포넌트)
 */
const StudentReportsContent: React.FC = () => {
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
      {/* 통계 요약 */}
      {view === 'list' && statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 교육생</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.total_trainees}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">총 이수</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.total_completions}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평균 이수율</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.average_completion_rate.toFixed(1)}%</p>
              </div>
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평균 성적</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.average_score.toFixed(1)}점</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평균 출석률</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.average_attendance_rate.toFixed(1)}%</p>
              </div>
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-teal-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">발급 인증서</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.certificates_issued}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-indigo-600 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* 리스트 뷰 - 기존 StudentReports의 StudentListView 재사용 */}
      {view === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">교육생 목록</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FunnelIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 필터 영역 */}
          {showFilters && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="이름 또는 이메일 검색..."
                  value={filter.search || ''}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <select
                  value={sort.field}
                  onChange={(e) => setSort({ ...sort, field: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="name">이름순</option>
                  <option value="score">점수순</option>
                  <option value="attendance_rate">출석률순</option>
                </select>
                <select
                  value={sort.direction}
                  onChange={(e) => setSort({ ...sort, direction: e.target.value as 'asc' | 'desc' })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="asc">오름차순</option>
                  <option value="desc">내림차순</option>
                </select>
              </div>
            </div>
          )}

          {/* 교육생 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">과정 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">완료</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">평균 점수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">출석률</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.trainee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.trainee.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{report.trainee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.overall_statistics.total_courses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.overall_statistics.completed_courses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.overall_statistics.average_score.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {report.overall_statistics.average_attendance_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetail(report)}
                        className="text-primary hover:text-primary/80"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reports.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">조회된 교육생이 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* 상세 뷰 */}
      {view === 'detail' && selectedReport && (
        <div className="space-y-6">
          <button
            onClick={handleBackToList}
            className="mb-4 text-primary hover:text-primary/80 flex items-center font-medium"
          >
            ← 목록으로 돌아가기
          </button>

          {/* 헤더 - 교육생 기본 정보 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <UserIcon className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedReport.trainee.name}</h2>
                  <p className="text-blue-100">{selectedReport.trainee.email}</p>
                  {selectedReport.trainee.phone && (
                    <p className="text-blue-100 text-sm mt-1">{selectedReport.trainee.phone}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">종합 평점</div>
                <div className="text-4xl font-bold flex items-center gap-2">
                  <StarIcon className="h-8 w-8 text-yellow-300" />
                  {selectedReport.overall_statistics.average_score.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">총 수강</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {selectedReport.overall_statistics.total_courses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">과정</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">완료</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {selectedReport.overall_statistics.completed_courses}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedReport.overall_statistics.total_courses > 0
                  ? `${((selectedReport.overall_statistics.completed_courses / selectedReport.overall_statistics.total_courses) * 100).toFixed(0)}% 이수`
                  : '0%'}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <TrophyIcon className="h-8 w-8 text-yellow-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">평균 점수</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {selectedReport.overall_statistics.average_score.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">점</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <CalendarIcon className="h-8 w-8 text-purple-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">출석률</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {selectedReport.overall_statistics.average_attendance_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">평균</div>
            </div>
          </div>

          {/* 과정별 상세 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              수강 과정 내역
            </h3>

            {selectedReport.course_details && selectedReport.course_details.length > 0 ? (
              <div className="space-y-4">
                {selectedReport.course_details.map((course, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {course.course_name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {course.start_date} ~ {course.end_date || '진행중'}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {course.attendance_rate.toFixed(0)}% 출석
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {course.average_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">평균 점수</div>
                      </div>
                    </div>

                    {/* 진도율 바 */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">진도율</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {course.progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            course.progress >= 80 ? 'bg-green-500' :
                            course.progress >= 60 ? 'bg-blue-500' :
                            course.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 상태 배지 */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        course.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {course.status === 'completed' ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            완료
                          </>
                        ) : course.status === 'in_progress' ? (
                          <>
                            <ClockIcon className="h-4 w-4" />
                            진행중
                          </>
                        ) : (
                          <>
                            <ExclamationCircleIcon className="h-4 w-4" />
                            미시작
                          </>
                        )}
                      </span>

                      {course.completion_date && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          이수일: {course.completion_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">수강 이력이 없습니다</p>
              </div>
            )}
          </div>

          {/* 성적 분석 */}
          {selectedReport.grade_breakdown && selectedReport.grade_breakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
                성적 분석
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReport.grade_breakdown.map((grade, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {grade.course_name}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {grade.final_score.toFixed(1)}점
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">필기</span>
                        <span className="text-gray-900 dark:text-gray-100">{grade.written_score?.toFixed(1) || '-'}점</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">실기</span>
                        <span className="text-gray-900 dark:text-gray-100">{grade.practical_score?.toFixed(1) || '-'}점</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">출석</span>
                        <span className="text-gray-900 dark:text-gray-100">{grade.attendance_score?.toFixed(1) || '-'}점</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이수 증명서 */}
          {selectedReport.completion_history && selectedReport.completion_history.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <TrophyIcon className="h-6 w-6 text-yellow-600" />
                이수 증명서
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedReport.completion_history.map((completion, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
                    <div className="text-center mb-3">
                      <TrophyIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {completion.course_name}
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">이수일</span>
                        <span className="text-gray-900 dark:text-gray-100">{completion.completion_date || '-'}</span>
                      </div>
                      {completion.certificate_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">증서번호</span>
                          <span className="text-gray-900 dark:text-gray-100 text-xs">{completion.certificate_number}</span>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          completion.completion_status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {completion.completion_status === 'completed' ? '이수 완료' : '진행중'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentReportsContent;
