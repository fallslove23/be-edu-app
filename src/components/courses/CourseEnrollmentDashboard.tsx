import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CourseEnrollmentService } from '../../services/course-enrollment.service';
import type { 
  CourseEnrollmentSummary,
  EnrollmentRequest,
  EnrollmentResult
} from '../../types/course-enrollment.types';
import type { Course } from '../../types/course.types';
import { enrollmentStatusLabels } from '../../types/course.types';
import TraineeSelector from './TraineeSelector';
import EnrollmentHistoryModal from './EnrollmentHistoryModal';
import WaitingListManager from './WaitingListManager';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface CourseEnrollmentDashboardProps {
  course: Course;
  onCourseUpdate?: (course: Course) => void;
}

const CourseEnrollmentDashboard: React.FC<CourseEnrollmentDashboardProps> = ({
  course,
  onCourseUpdate
}) => {
  const [enrollmentSummary, setEnrollmentSummary] = useState<CourseEnrollmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTraineeSelector, setShowTraineeSelector] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showWaitingListManager, setShowWaitingListManager] = useState(false);
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set());
  const [processingEnrollment, setProcessingEnrollment] = useState(false);

  // 데이터 로드
  const loadEnrollmentData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const summary = await CourseEnrollmentService.getCourseEnrollmentSummary(course.id);
      setEnrollmentSummary(summary);

    } catch (error) {
      console.error('Failed to load enrollment data:', error);
      setError('수강생 현황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEnrollmentData();
  }, [course.id]);

  // 새로고침
  const handleRefresh = () => {
    loadEnrollmentData(true);
  };

  // 교육생 배정
  const handleEnrollTrainees = async (traineeIds: string[]) => {
    try {
      setProcessingEnrollment(true);

      const request: EnrollmentRequest = {
        course_id: course.id,
        trainee_ids: traineeIds,
        priority: 'normal',
        auto_approve: true
      };

      const result: EnrollmentResult = await CourseEnrollmentService.bulkEnrollTrainees(request);

      // 결과 메시지
      const messages = [];
      if (result.total_enrolled > 0) {
        messages.push(`${result.total_enrolled}명이 성공적으로 배정되었습니다.`);
      }
      if (result.total_waitlisted > 0) {
        messages.push(`${result.total_waitlisted}명이 대기자 목록에 추가되었습니다.`);
      }
      if (result.total_failed > 0) {
        messages.push(`${result.total_failed}명의 배정에 실패했습니다.`);
      }

      if (messages.length > 0) {
        toast.success(messages.join(' '));
      }

      // 실패한 배정들에 대한 상세 정보 표시
      if (result.failed_enrollments.length > 0) {
        console.log('Failed enrollments:', result.failed_enrollments);
        // TODO: 실패 상세 정보를 모달로 표시
      }

      // 데이터 새로고침
      loadEnrollmentData(true);
      if (onCourseUpdate && result.total_enrolled > 0) {
        // 과정 정보 업데이트 (current_trainees 수정)
        const updatedCourse = {
          ...course,
          current_trainees: course.current_trainees + result.total_enrolled
        };
        onCourseUpdate(updatedCourse);
      }

    } catch (error) {
      console.error('Failed to enroll trainees:', error);
      toast.error('교육생 배정에 실패했습니다.');
    } finally {
      setProcessingEnrollment(false);
    }
  };

  // 개별 배정 해제
  const handleUnenrollTrainee = async (enrollmentId: string, traineeName: string) => {
    if (!confirm(`${traineeName}님의 배정을 해제하시겠습니까?`)) {
      return;
    }

    try {
      await CourseEnrollmentService.unenrollTrainee(enrollmentId, '관리자에 의한 해제');
      toast.success(`${traineeName}님의 배정이 해제되었습니다.`);
      
      // 데이터 새로고침
      loadEnrollmentData(true);
      if (onCourseUpdate) {
        const updatedCourse = {
          ...course,
          current_trainees: Math.max(0, course.current_trainees - 1)
        };
        onCourseUpdate(updatedCourse);
      }

    } catch (error) {
      console.error('Failed to unenroll trainee:', error);
      toast.error('배정 해제에 실패했습니다.');
    }
  };

  // 선택된 배정들 일괄 해제
  const handleBulkUnenroll = async () => {
    if (selectedEnrollments.size === 0) {
      toast.error('해제할 교육생을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedEnrollments.size}명의 배정을 해제하시겠습니까?`)) {
      return;
    }

    try {
      const promises = Array.from(selectedEnrollments).map(enrollmentId => 
        CourseEnrollmentService.unenrollTrainee(enrollmentId, '일괄 해제')
      );

      await Promise.all(promises);
      toast.success(`${selectedEnrollments.size}명의 배정이 해제되었습니다.`);
      
      setSelectedEnrollments(new Set());
      loadEnrollmentData(true);
      
      if (onCourseUpdate) {
        const updatedCourse = {
          ...course,
          current_trainees: Math.max(0, course.current_trainees - selectedEnrollments.size)
        };
        onCourseUpdate(updatedCourse);
      }

    } catch (error) {
      console.error('Failed to bulk unenroll:', error);
      toast.error('일괄 해제에 실패했습니다.');
    }
  };

  // 배정 선택/해제
  const toggleEnrollmentSelection = (enrollmentId: string) => {
    const newSelected = new Set(selectedEnrollments);
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId);
    } else {
      newSelected.add(enrollmentId);
    }
    setSelectedEnrollments(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (!enrollmentSummary) return;

    const activeEnrollments = enrollmentSummary.recent_enrollments.filter(e => e.status === 'active');
    const allSelected = activeEnrollments.every(e => selectedEnrollments.has(e.id));
    
    const newSelected = new Set<string>();
    if (!allSelected) {
      activeEnrollments.forEach(e => newSelected.add(e.id));
    }
    setSelectedEnrollments(newSelected);
  };

  // 상태별 배지 색상
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'dropped':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy.MM.dd', { locale: ko });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">수강생 현황을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !enrollmentSummary) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
          <div className="text-gray-600 mb-4">{error || '데이터를 불러올 수 없습니다.'}</div>
          <button
            onClick={() => loadEnrollmentData()}
            className="btn-primary"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { enrollment_stats, recent_enrollments, waiting_list } = enrollmentSummary;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="h-7 w-7 mr-2 text-blue-600" />
              수강생 관리
            </h2>
            <p className="text-gray-600 mt-1">{course.name}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="새로고침"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              title="배정 이력"
            >
              <ClockIcon className="h-4 w-4 mr-1" />
              이력
            </button>

            {enrollment_stats.waiting_list_count > 0 && (
              <button
                onClick={() => setShowWaitingListManager(true)}
                className="flex items-center px-3 py-2 text-foreground border border-yellow-300 rounded-full hover:bg-yellow-50 transition-colors"
                title="대기자 관리"
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                대기자 ({enrollment_stats.waiting_list_count})
              </button>
            )}
            
            <button
              onClick={() => setShowTraineeSelector(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              교육생 추가
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">총 등록</p>
                <p className="text-xl font-semibold text-blue-900">
                  {enrollment_stats.total_enrolled}명
                </p>
                <p className="text-xs text-blue-700">
                  정원 {course.max_trainees}명 중
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-500/10 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">수강 중</p>
                <p className="text-xl font-semibold text-green-900">
                  {enrollment_stats.active_enrollments}명
                </p>
                <p className="text-xs text-green-700">
                  {enrollment_stats.available_spots}자리 남음
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">완료율</p>
                <p className="text-xl font-semibold text-purple-900">
                  {enrollment_stats.completion_rate}%
                </p>
                <p className="text-xs text-purple-700">
                  {enrollment_stats.completed_enrollments}명 수료
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-foreground" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">대기자</p>
                <p className="text-xl font-semibold text-yellow-900">
                  {enrollment_stats.waiting_list_count}명
                </p>
                <p className="text-xs text-foreground">
                  중도포기 {enrollment_stats.drop_rate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>등록 현황</span>
            <span>{enrollment_stats.enrollment_rate}% 등록됨</span>
          </div>
          <div className="w-full bg-gray-200 rounded-lg h-2">
            <div
              className="bg-blue-600 h-2 rounded-lg transition-all duration-300"
              style={{ width: `${enrollment_stats.enrollment_rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 수강생 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              수강생 목록 ({recent_enrollments.length})
            </h3>
            
            {selectedEnrollments.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedEnrollments.size}명 선택됨
                </span>
                <button
                  onClick={handleBulkUnenroll}
                  className="btn-danger"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  일괄 해제
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {recent_enrollments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>등록된 교육생이 없습니다.</p>
              <button
                onClick={() => setShowTraineeSelector(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                첫 교육생 추가하기
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={recent_enrollments.filter(e => e.status === 'active').every(e => selectedEnrollments.has(e.id))}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    교육생
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    점수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recent_enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEnrollments.has(enrollment.id)}
                        onChange={() => toggleEnrollmentSelection(enrollment.id)}
                        disabled={enrollment.status !== 'active'}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.trainee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.trainee_email}
                        </div>
                        {enrollment.trainee_department && (
                          <div className="text-xs text-gray-400">
                            {enrollment.trainee_department}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(enrollment.status)}`}>
                        {enrollmentStatusLabels[enrollment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(enrollment.enrolled_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enrollment.final_score ? `${enrollment.final_score}점` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {/* TODO: 상세 보기 */}}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="상세 보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {enrollment.status === 'active' && (
                        <button
                          onClick={() => handleUnenrollTrainee(enrollment.id, enrollment.trainee_name)}
                          className="text-destructive hover:text-destructive transition-colors"
                          title="배정 해제"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 대기자 목록 */}
      {waiting_list.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-foreground" />
              대기자 목록 ({waiting_list.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {waiting_list.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <div className="font-medium text-gray-900">
                      {index + 1}. {entry.trainee_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.trainee_email} • 요청일: {formatDate(entry.requested_at)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      {entry.position}번째 대기
                    </span>
                    <button
                      onClick={() => {/* TODO: 우선 배정 */}}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="우선 배정"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 교육생 선택 모달 */}
      <TraineeSelector
        course={course}
        isOpen={showTraineeSelector}
        onClose={() => setShowTraineeSelector(false)}
        onEnrollTrainees={handleEnrollTrainees}
      />

      {/* 배정 이력 모달 */}
      <EnrollmentHistoryModal
        courseId={course.id}
        courseName={course.name}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* 대기자 관리 모달 */}
      <WaitingListManager
        course={course}
        isOpen={showWaitingListManager}
        onClose={() => setShowWaitingListManager(false)}
        onWaitingListUpdate={() => loadEnrollmentData(true)}
      />

      {/* 처리 중 오버레이 */}
      {processingEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-lg h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-700">교육생을 배정하는 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollmentDashboard;