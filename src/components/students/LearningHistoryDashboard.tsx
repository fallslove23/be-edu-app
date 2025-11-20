import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { LearningHistoryService } from '../../services/learning-history.service';
import type {
  LearningHistorySummary,
  CourseProgress,
  CompletionEligibility,
} from '../../types/learning-history.types';

interface LearningHistoryDashboardProps {
  traineeId: string;
  traineeName: string;
}

export const LearningHistoryDashboard: React.FC<LearningHistoryDashboardProps> = ({
  traineeId,
  traineeName,
}) => {
  const [history, setHistory] = useState<LearningHistorySummary | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null);
  const [eligibility, setEligibility] = useState<CompletionEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'achievements'>('overview');

  useEffect(() => {
    loadHistory();
  }, [traineeId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await LearningHistoryService.getTraineeLearningHistory(traineeId);
      setHistory(data);
    } catch (error) {
      console.error('학습 이력 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (course: CourseProgress) => {
    setSelectedCourse(course);
    const eligibilityData = await LearningHistoryService.checkCompletionEligibility(
      traineeId,
      course.course_id
    );
    setEligibility(eligibilityData);
  };

  const handleDownloadReport = async () => {
    try {
      const report = await LearningHistoryService.generateLearningReport(traineeId);

      // JSON 파일로 다운로드
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-report-${traineeName}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('학습 이력서가 다운로드되었습니다.');
    } catch (error) {
      console.error('이력서 생성 실패:', error);
      alert('이력서 생성에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">학습 이력 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">학습 이력을 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground">학습 이력</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {history.trainee_name} ({history.employee_id}) - {history.department}
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="btn-base bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          학습 이력서 다운로드
        </button>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">전체 과정</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {history.total_courses_enrolled}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">완료한 과정</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {history.total_courses_completed}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">평균 출석률</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {history.overall_attendance_rate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-lg">
              <ClockIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">평균 점수</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {history.overall_average_score.toFixed(1)}점
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-border">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'courses'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            과정 상세 ({history.course_progress.length})
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'achievements'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            성취 배지 ({history.recent_achievements.length})
          </button>
        </div>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 진행 중인 과정 */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">📚 진행 중인 과정</h3>
            {history.course_progress.filter(c => c.status === 'active').length === 0 ? (
              <p className="text-muted-foreground text-sm">진행 중인 과정이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {history.course_progress
                  .filter(c => c.status === 'active')
                  .map((course) => (
                    <div
                      key={course.course_id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-card-foreground">{course.course_name}</h4>
                        <p className="text-sm text-muted-foreground">{course.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">진도율</p>
                          <p className="text-lg font-bold text-primary">
                            {course.progress_percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">출석률</p>
                          <p className="text-lg font-bold text-teal-600">
                            {course.attendance_rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 완료한 과정 */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">✅ 완료한 과정</h3>
            {history.course_progress.filter(c => c.status === 'completed').length === 0 ? (
              <p className="text-muted-foreground text-sm">완료한 과정이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {history.course_progress
                  .filter(c => c.status === 'completed')
                  .slice(0, 5)
                  .map((course) => (
                    <div
                      key={course.course_id}
                      className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-card-foreground">{course.course_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.completion_date
                            ? new Date(course.completion_date).toLocaleDateString('ko-KR')
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">평균 점수</p>
                          <p className="text-lg font-bold text-green-600">
                            {course.average_score.toFixed(1)}점
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  과정명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  진도율
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  출석률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  평균 점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  수료 가능
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.course_progress.map((course) => (
                <tr
                  key={course.course_id}
                  className="hover:bg-muted/20 cursor-pointer"
                  onClick={() => handleCourseClick(course)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-card-foreground">{course.course_name}</div>
                      <div className="text-sm text-muted-foreground">{course.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.status === 'active'
                          ? 'bg-blue-500/10 text-blue-600'
                          : course.status === 'completed'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}
                    >
                      {course.status === 'active'
                        ? '진행 중'
                        : course.status === 'completed'
                        ? '완료'
                        : '중단'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{course.progress_percentage.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-sm">{course.attendance_rate.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-sm">{course.average_score.toFixed(1)}점</td>
                  <td className="px-6 py-4">
                    {course.meets_requirements ? (
                      <span className="text-green-600 font-medium">✓ 가능</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ 불가</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.recent_achievements.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">아직 획득한 배지가 없습니다.</p>
            </div>
          ) : (
            history.recent_achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-card rounded-lg border border-border p-6 text-center"
              >
                <div className="text-5xl mb-3">{achievement.icon}</div>
                <h4 className="font-semibold text-card-foreground mb-2">{achievement.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(achievement.earned_date).toLocaleDateString('ko-KR')}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 과정 상세 모달 */}
      {selectedCourse && eligibility && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{selectedCourse.course_name}</h3>
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setEligibility(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 진도 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">진도율</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {selectedCourse.progress_percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCourse.attended_sessions} / {selectedCourse.total_sessions} 세션
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">출석률</p>
                  <p className="text-2xl font-bold text-teal-600 mt-1">
                    {selectedCourse.attendance_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    출석 {selectedCourse.present_count} / 지각 {selectedCourse.late_count} / 결석{' '}
                    {selectedCourse.absent_count}
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">과제 제출률</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {selectedCourse.assignment_completion_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCourse.assignments_completed} / {selectedCourse.assignments_total} 완료
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">시험 응시율</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {selectedCourse.exam_completion_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCourse.exams_taken} / {selectedCourse.exams_total} 응시
                  </p>
                </div>
              </div>

              {/* 수료 조건 */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">수료 조건</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">출석률</span>
                    <span
                      className={`text-sm font-medium ${
                        eligibility.requirements_met.attendance ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {eligibility.requirements_met.attendance ? '✓ 충족' : '✗ 미충족'} (
                      {selectedCourse.completion_requirements.min_attendance_rate}% 이상 필요)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">과제 제출률</span>
                    <span
                      className={`text-sm font-medium ${
                        eligibility.requirements_met.assignments ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {eligibility.requirements_met.assignments ? '✓ 충족' : '✗ 미충족'} (
                      {selectedCourse.completion_requirements.min_assignment_rate}% 이상 필요)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">시험 응시율</span>
                    <span
                      className={`text-sm font-medium ${
                        eligibility.requirements_met.exams ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {eligibility.requirements_met.exams ? '✓ 충족' : '✗ 미충족'} (
                      {selectedCourse.completion_requirements.min_exam_rate}% 이상 필요)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">평균 점수</span>
                    <span
                      className={`text-sm font-medium ${
                        eligibility.requirements_met.average_score
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {eligibility.requirements_met.average_score ? '✓ 충족' : '✗ 미충족'} (
                      {selectedCourse.completion_requirements.min_average_score}점 이상 필요)
                    </span>
                  </div>
                </div>
              </div>

              {/* 수료 가능 여부 */}
              <div
                className={`p-4 rounded-lg ${
                  eligibility.is_eligible ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <p className="font-semibold mb-2">
                  {eligibility.is_eligible ? '✓ 수료 가능' : '✗ 수료 불가'}
                </p>
                <ul className="text-sm space-y-1">
                  {eligibility.reasons.map((reason, index) => (
                    <li key={index} className="text-muted-foreground">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
