import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import type { Course, CourseEnrollment } from '../../types/schedule.types';
import type { Trainee } from '../../types/trainee.types';
import { TraineeService } from '../../services/trainee.services';
import toast from 'react-hot-toast';

interface CourseEnrollmentProps {
  course: Course;
  onEnrollmentChange: (enrollments: CourseEnrollment[]) => void;
}

const CourseEnrollmentComponent: React.FC<CourseEnrollmentProps> = ({
  course,
  onEnrollmentChange
}) => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [availableTrainees, setAvailableTrainees] = useState<Trainee[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [course.id]);

  // 검색 필터링
  useEffect(() => {
    if (trainees.length > 0) {
      filterAvailableTrainees();
    }
  }, [searchTerm, trainees, enrollments]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 교육생 목록 로드
      const traineeList = await TraineeService.getTrainees();
      setTrainees(traineeList);

      // 기존 등록 정보 로드 (목업 데이터)
      const mockEnrollments: CourseEnrollment[] = course.trainee_ids.map((traineeId, index) => ({
        id: `enrollment-${course.id}-${traineeId}`,
        course_id: course.id,
        trainee_id: traineeId,
        enrolled_at: new Date().toISOString(),
        status: 'enrolled',
        completion_rate: 0,
        notes: ''
      }));

      setEnrollments(mockEnrollments);

    } catch (error) {
      console.error('데이터 로드 중 오류:', error);
      toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용 가능한 교육생 필터링
  const filterAvailableTrainees = () => {
    const enrolledTraineeIds = new Set(enrollments.map(e => e.trainee_id));

    let filtered = trainees.filter(trainee =>
      !enrolledTraineeIds.has(trainee.id) &&
      trainee.status === 'active'
    );

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(trainee =>
        trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setAvailableTrainees(filtered);
  };

  // 교육생 등록
  const enrollTrainees = async () => {
    if (selectedTrainees.length === 0) {
      toast('등록할 교육생을 선택해주세요.', { icon: '⚠️' });
      return;
    }

    // 정원 체크
    const totalAfterEnrollment = enrollments.length + selectedTrainees.length;
    if (totalAfterEnrollment > course.max_capacity) {
      toast.error(`정원을 초과합니다. (현재: ${enrollments.length}명, 최대: ${course.max_capacity}명)`);
      return;
    }

    try {
      const newEnrollments: CourseEnrollment[] = selectedTrainees.map(traineeId => ({
        id: `enrollment-${course.id}-${traineeId}-${Date.now()}`,
        course_id: course.id,
        trainee_id: traineeId,
        enrolled_at: new Date().toISOString(),
        status: 'enrolled',
        completion_rate: 0,
        notes: ''
      }));

      const updatedEnrollments = [...enrollments, ...newEnrollments];
      setEnrollments(updatedEnrollments);
      onEnrollmentChange(updatedEnrollments);

      setIsEnrollModalOpen(false);
      setSelectedTrainees([]);
      setSearchTerm('');

      toast.success(`${selectedTrainees.length}명의 교육생이 등록되었습니다.`);

    } catch (error) {
      console.error('교육생 등록 중 오류:', error);
      toast.error('교육생 등록 중 오류가 발생했습니다.');
    }
  };

  // 교육생 등록 취소
  const unenrollTrainee = async (enrollmentId: string) => {
    try {
      const updatedEnrollments = enrollments.filter(e => e.id !== enrollmentId);
      setEnrollments(updatedEnrollments);
      onEnrollmentChange(updatedEnrollments);

      toast.success('교육생 등록이 취소되었습니다.');

    } catch (error) {
      console.error('교육생 등록 취소 중 오류:', error);
      toast.error('교육생 등록 취소 중 오류가 발생했습니다.');
    }
  };

  // 교육생 선택/해제
  const toggleTraineeSelection = (traineeId: string) => {
    setSelectedTrainees(prev =>
      prev.includes(traineeId)
        ? prev.filter(id => id !== traineeId)
        : [...prev, traineeId]
    );
  };

  // 등록된 교육생 정보 가져오기
  const getEnrolledTrainee = (traineeId: string): Trainee | undefined => {
    return trainees.find(t => t.id === traineeId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-32 p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">등록 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 등록 현황 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            등록 현황
          </h3>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-1.5" />
            교육생 등록
          </button>
        </div>

        {/* 등록 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">현재 등록</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{enrollments.length}명</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
            <div className="flex items-center">
              <AcademicCapIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <p className="text-sm font-bold text-green-900 dark:text-green-100">최대 정원</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{course.max_capacity}명</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center">
              <div className="h-6 w-6 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold mr-3">%</div>
              <div>
                <p className="text-sm font-bold text-purple-900 dark:text-purple-100">등록률</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {Math.round((enrollments.length / course.max_capacity) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 정원 초과 경고 */}
        {enrollments.length > course.max_capacity * 0.9 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                정원이 {Math.round((enrollments.length / course.max_capacity) * 100)}% 찼습니다.
              </span>
            </div>
          </div>
        )}

        {/* 등록된 교육생 목록 */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400">등록된 교육생</h4>

          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrollments.map(enrollment => {
                const trainee = getEnrolledTrainee(enrollment.trainee_id);

                return (
                  <div key={enrollment.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-3 border border-gray-100 dark:border-gray-600 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                        <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {trainee?.name || '알 수 없는 교육생'}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {trainee?.department} • {trainee?.employee_id}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => unenrollTrainee(enrollment.id)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                      title="등록 취소"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium">등록된 교육생이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 교육생 등록 모달 */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">교육생 등록</h2>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {/* 검색 */}
              <div className="mb-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="이름, 이메일, 사번, 부서로 검색..."
                    className="pl-11 pr-4 py-3 w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* 선택된 교육생 수 */}
              {selectedTrainees.length > 0 && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200 flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1.5" />
                    {selectedTrainees.length}명 선택됨
                    {enrollments.length + selectedTrainees.length > course.max_capacity && (
                      <span className="text-red-500 dark:text-red-400 ml-2 font-bold flex items-center">
                        (정원 초과: {enrollments.length + selectedTrainees.length}/{course.max_capacity})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* 사용 가능한 교육생 목록 */}
              <div className="space-y-2">
                {availableTrainees.length > 0 ? (
                  availableTrainees.map(trainee => (
                    <div
                      key={trainee.id}
                      className={`relative border rounded-xl p-3 cursor-pointer transition-all group ${selectedTrainees.includes(trainee.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                        }`}
                      onClick={() => toggleTraineeSelection(trainee.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${selectedTrainees.includes(trainee.id) ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <UserIcon className={`h-5 w-5 ${selectedTrainees.includes(trainee.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${selectedTrainees.includes(trainee.id) ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                              {trainee.name}
                            </div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {trainee.department} • {trainee.employee_id} • {trainee.email}
                            </div>
                          </div>
                        </div>

                        {selectedTrainees.includes(trainee.id) ? (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <CheckIcon className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-400 transition-colors"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm font-medium">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록 가능한 교육생이 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end items-center gap-3 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="btn-secondary"
              >
                취소
              </button>

              <button
                onClick={enrollTrainees}
                disabled={selectedTrainees.length === 0}
                className={`${selectedTrainees.length > 0
                  ? 'btn-primary'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed px-5 py-2.5 rounded-xl font-medium shadow-none'
                  }`}
              >
                {selectedTrainees.length > 0
                  ? `${selectedTrainees.length}명 등록`
                  : '교육생 선택'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollmentComponent;