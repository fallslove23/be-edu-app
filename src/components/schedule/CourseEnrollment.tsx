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
      toast.warning('등록할 교육생을 선택해주세요.');
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
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">등록 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 등록 현황 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            등록 현황
          </h3>
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            교육생 등록
          </button>
        </div>

        {/* 등록 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">현재 등록</p>
                <p className="text-xl font-bold text-blue-600">{enrollments.length}명</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">최대 정원</p>
                <p className="text-xl font-bold text-green-600">{course.max_capacity}명</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-6 w-6 bg-purple-600 rounded mr-2"></div>
              <div>
                <p className="text-sm font-medium text-purple-900">등록률</p>
                <p className="text-xl font-bold text-purple-600">
                  {Math.round((enrollments.length / course.max_capacity) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 정원 초과 경고 */}
        {enrollments.length > course.max_capacity * 0.9 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">
                정원이 {Math.round((enrollments.length / course.max_capacity) * 100)}% 찼습니다.
              </span>
            </div>
          </div>
        )}

        {/* 등록된 교육생 목록 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">등록된 교육생</h4>
          
          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrollments.map(enrollment => {
                const trainee = getEnrolledTrainee(enrollment.trainee_id);
                
                return (
                  <div key={enrollment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {trainee?.name || '알 수 없는 교육생'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {trainee?.department} • {trainee?.employee_id}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => unenrollTrainee(enrollment.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="등록 취소"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm">등록된 교육생이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 교육생 등록 모달 */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">교육생 등록</h2>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* 검색 */}
              <div className="mb-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="이름, 이메일, 사번, 부서로 검색..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* 선택된 교육생 수 */}
              {selectedTrainees.length > 0 && (
                <div className="mb-4 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    {selectedTrainees.length}명 선택됨
                    {enrollments.length + selectedTrainees.length > course.max_capacity && (
                      <span className="text-red-600 ml-2">
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
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedTrainees.includes(trainee.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleTraineeSelection(trainee.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {trainee.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {trainee.department} • {trainee.employee_id} • {trainee.email}
                            </div>
                          </div>
                        </div>
                        
                        {selectedTrainees.includes(trainee.id) && (
                          <CheckIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-sm">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록 가능한 교육생이 없습니다.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              
              <button
                onClick={enrollTrainees}
                disabled={selectedTrainees.length === 0}
                className={`${
                  selectedTrainees.length > 0
                    ? 'btn-primary'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed px-6 py-2 text-sm font-medium rounded-md'
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