import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  XMarkIcon,
  UserIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CourseService } from '../../services/course.services';
import type { CreateCourseData, Course } from '../../services/course.services';
import { UserService } from '../../services/user.services';
import type { User } from '../../services/user.services';
import toast from 'react-hot-toast';

interface CourseFormProps {
  course?: Course; // 편집 모드일 때 전달
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: Course) => void;
}

interface FormData extends CreateCourseData {
  id?: string;
  status?: string;
}

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const isEdit = !!course;

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue,
    watch
  } = useForm<FormData>();

  // 사용자 목록 불러오기
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // 편집 모드일 때 폼 데이터 설정
  useEffect(() => {
    if (course && isOpen) {
      setValue('name', course.name);
      setValue('description', course.description || '');
      setValue('instructor_id', course.instructor_id || '');
      setValue('manager_id', course.manager_id || '');
      setValue('start_date', course.start_date);
      setValue('end_date', course.end_date);
      setValue('max_trainees', course.max_trainees);
    } else if (isOpen) {
      reset({
        name: '',
        description: '',
        instructor_id: '',
        manager_id: '',
        start_date: '',
        end_date: '',
        max_trainees: 20
      });
    }
  }, [course, isOpen, setValue, reset]);

  const loadUsers = async () => {
    try {
      const [instructorList, adminList, courseManagerList] = await Promise.all([
        UserService.getUsersByRole('instructor'),
        UserService.getUsersByRole('app_admin'),
        UserService.getUsersByRole('course_manager')
      ]);
      
      const managerList = [...adminList, ...courseManagerList];
      
      setInstructors(instructorList);
      setManagers(managerList);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다.');
    }
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // 날짜 유효성 검사
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (startDate >= endDate) {
        toast.error('종료일은 시작일보다 늦어야 합니다.');
        return;
      }

      const courseData: CreateCourseData = {
        name: data.name,
        description: data.description || undefined,
        instructor_id: data.instructor_id || undefined,
        manager_id: data.manager_id || undefined,
        start_date: data.start_date,
        end_date: data.end_date,
        max_trainees: data.max_trainees
      };

      let result: Course;
      
      if (isEdit && course) {
        result = await CourseService.updateCourse(course.id, courseData);
        toast.success('과정이 성공적으로 수정되었습니다.');
      } else {
        result = await CourseService.createCourse(courseData);
        toast.success('새 과정이 성공적으로 생성되었습니다.');
      }

      onSubmit(result);
      handleClose();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast.error(isEdit ? '과정 수정에 실패했습니다.' : '과정 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const startDate = watch('start_date');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? '과정 수정' : '새 과정 생성'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* 과정명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              과정명 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                {...register('name', { 
                  required: '과정명을 입력해주세요.',
                  maxLength: { value: 100, message: '과정명은 100자 이하로 입력해주세요.' }
                })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 신입 영업사원 기초 교육"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              과정 설명
            </label>
            <textarea
              {...register('description', {
                maxLength: { value: 500, message: '설명은 500자 이하로 입력해주세요.' }
              })}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="과정에 대한 상세 설명을 입력해주세요."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* 강사 및 관리자 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 강사 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                담당 강사
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register('instructor_id')}
                  className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">강사 선택</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name} ({instructor.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 관리자 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                과정 관리자
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  {...register('manager_id')}
                  className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">관리자 선택</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 시작일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  {...register('start_date', { 
                    required: '시작일을 선택해주세요.',
                    validate: (value) => {
                      const today = new Date();
                      const selected = new Date(value);
                      // 오늘 이전 날짜 선택 시 경고 (편집 모드에서는 제외)
                      if (!isEdit && selected < today) {
                        return '시작일은 오늘 이후로 선택해주세요.';
                      }
                      return true;
                    }
                  })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            {/* 종료일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  {...register('end_date', { 
                    required: '종료일을 선택해주세요.',
                    validate: (value) => {
                      if (startDate && value && new Date(value) <= new Date(startDate)) {
                        return '종료일은 시작일보다 늦어야 합니다.';
                      }
                      return true;
                    }
                  })}
                  min={startDate || undefined}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* 최대 수강 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최대 수강 인원 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserGroupIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                {...register('max_trainees', { 
                  required: '최대 수강 인원을 입력해주세요.',
                  min: { value: 1, message: '최소 1명 이상이어야 합니다.' },
                  max: { value: 100, message: '최대 100명까지 가능합니다.' }
                })}
                min="1"
                max="100"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="20"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">명</span>
              </div>
            </div>
            {errors.max_trainees && (
              <p className="mt-1 text-sm text-red-600">{errors.max_trainees.message}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEdit ? '수정 중...' : '생성 중...'}
                </div>
              ) : (
                isEdit ? '수정 완료' : '생성 완료'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;