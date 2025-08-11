import React, { useState, useCallback } from 'react';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import DeleteCourseModal from './DeleteCourseModal';
import CourseEnrollmentDashboard from './CourseEnrollmentDashboard';
import type { Course } from '../../services/course.services';

const CourseManagement: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(undefined);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [courseForTraineeManagement, setCourseForTraineeManagement] = useState<Course | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTraineeManagementOpen, setIsTraineeManagementOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 새 과정 생성
  const handleCreateCourse = useCallback(() => {
    setSelectedCourse(undefined);
    setIsFormOpen(true);
  }, []);

  // 과정 편집
  const handleEditCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  }, []);

  // 과정 삭제 요청
  const handleDeleteCourse = useCallback((course: Course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  }, []);

  // 수강생 관리 요청
  const handleManageTrainees = useCallback((course: Course) => {
    setCourseForTraineeManagement(course);
    setIsTraineeManagementOpen(true);
  }, []);

  // 폼 제출 완료
  const handleFormSubmit = useCallback((course: Course) => {
    console.log('Course saved:', course);
    setRefreshTrigger(prev => prev + 1); // 목록 새로고침 트리거
  }, []);

  // 폼 닫기
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedCourse(undefined);
  }, []);

  // 삭제 확인
  const handleDeleteConfirm = useCallback((courseId: string) => {
    console.log('Course deleted:', courseId);
    setRefreshTrigger(prev => prev + 1); // 목록 새로고침 트리거
  }, []);

  // 삭제 모달 닫기
  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCourseToDelete(null);
  }, []);

  // 수강생 관리 닫기
  const handleTraineeManagementClose = useCallback(() => {
    setIsTraineeManagementOpen(false);
    setCourseForTraineeManagement(null);
  }, []);

  // 과정 업데이트 (수강생 수 등)
  const handleCourseUpdate = useCallback((_updatedCourse: Course) => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 과정 목록 */}
        <CourseList
          key={refreshTrigger} // 새로고침 트리거
          onCreateCourse={handleCreateCourse}
          onEditCourse={handleEditCourse}
          onDeleteCourse={handleDeleteCourse}
          onManageTrainees={handleManageTrainees}
        />

        {/* 과정 생성/편집 폼 */}
        <CourseForm
          course={selectedCourse}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />

        {/* 삭제 확인 모달 */}
        <DeleteCourseModal
          course={courseToDelete}
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteModalClose}
          onConfirm={handleDeleteConfirm}
        />

        {/* 수강생 관리 대시보드 */}
        {courseForTraineeManagement && isTraineeManagementOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  수강생 관리 - {courseForTraineeManagement.name}
                </h2>
                <button
                  onClick={handleTraineeManagementClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CourseEnrollmentDashboard
                  course={courseForTraineeManagement}
                  onCourseUpdate={handleCourseUpdate}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;