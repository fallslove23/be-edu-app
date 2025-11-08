import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { CourseService } from '../../services/course.services';
import type { Course } from '../../services/course.services';
import toast from 'react-hot-toast';

interface DeleteCourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (courseId: string) => void;
}

const DeleteCourseModal: React.FC<DeleteCourseModalProps> = ({
  course,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!course) return;

    // 과정명 확인
    if (confirmText !== course.name) {
      toast.error('과정명을 정확히 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      await CourseService.deleteCourse(course.id);
      toast.success('과정이 성공적으로 삭제되었습니다.');
      
      onConfirm(course.id);
      handleClose();
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('과정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const canDelete = confirmText === course?.name;

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              과정 삭제 확인
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-3">
              다음 과정을 삭제하시겠습니까?
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">{course.name}</h3>
              {course.description && (
                <p className="text-sm text-gray-600 mb-2">{course.description}</p>
              )}
              <div className="text-xs text-gray-500">
                <p>기간: {course.start_date} ~ {course.end_date}</p>
                <p>수강 인원: {course.current_trainees}/{course.max_trainees}명</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  주의사항
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• 삭제된 과정은 복구할 수 없습니다</li>
                  <li>• 관련된 수강 정보, 출석 기록이 모두 삭제됩니다</li>
                  <li>• 진행 중인 과정의 경우 교육생에게 영향을 줄 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 확인 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              삭제를 확인하려면 과정명을 정확히 입력해주세요:
            </label>
            <div className="text-xs text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
              {course.name}
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              placeholder="과정명을 입력하세요"
              disabled={loading}
            />
          </div>

          {/* 경고 메시지 */}
          {course.status === 'active' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                <p className="text-sm text-yellow-800">
                  현재 진행 중인 과정입니다. 삭제 시 교육생들의 학습에 영향을 줄 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {course.current_trainees > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                <p className="text-sm text-yellow-800">
                  {course.current_trainees}명의 교육생이 등록되어 있습니다. 삭제 시 모든 등록 정보가 함께 삭제됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger"
            disabled={loading || !canDelete}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                삭제 중...
              </div>
            ) : (
              '삭제 확인'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCourseModal;