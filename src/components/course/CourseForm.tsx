import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { Course, CreateCourseData } from '../../types/course.types';

interface ExtendedCourseData extends CreateCourseData {
  courseCode: string;
  courseType: 'basic' | 'intermediate' | 'advanced' | 'expert';
  category: 'sales' | 'marketing' | 'management' | 'technical' | 'soft-skills';
  totalSessions: number;
  sessionDuration: number;
  registrationStartDate: string;
  registrationEndDate: string;
}

interface CourseFormProps {
  course?: Course & {
    courseCode?: string;
    courseType?: 'basic' | 'intermediate' | 'advanced' | 'expert';
    category?: 'sales' | 'marketing' | 'management' | 'technical' | 'soft-skills';
    totalSessions?: number;
    sessionDuration?: number;
    registrationStartDate?: string;
    registrationEndDate?: string;
  };
  onSave: (courseData: ExtendedCourseData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [formData, setFormData] = useState<ExtendedCourseData>({
    name: course?.name || '',
    description: course?.description || '',
    instructor_id: course?.instructor_id || '',
    manager_id: course?.manager_id || user?.id || '',
    start_date: course?.start_date || '',
    end_date: course?.end_date || '',
    max_trainees: course?.max_trainees || 20,
    courseCode: course?.courseCode || '',
    courseType: course?.courseType || 'basic',
    category: course?.category || 'sales',
    totalSessions: course?.totalSessions || 10,
    sessionDuration: course?.sessionDuration || 180,
    registrationStartDate: course?.registrationStartDate || '',
    registrationEndDate: course?.registrationEndDate || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 자동 과정코드 생성
  useEffect(() => {
    if (!isEditing && !formData.courseCode) {
      const year = new Date().getFullYear();
      const categoryPrefix = {
        'sales': 'SA',
        'marketing': 'MK',
        'management': 'MG',
        'technical': 'TC',
        'soft-skills': 'SS'
      };
      const typePrefix = {
        'basic': '01',
        'intermediate': '02',
        'advanced': '03',
        'expert': '04'
      };
      
      const prefix = categoryPrefix[formData.category];
      const suffix = typePrefix[formData.courseType];
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        courseCode: `BS-${year}-${prefix}${suffix}-${randomNum}`
      }));
    }
  }, [formData.category, formData.courseType, isEditing]);

  const handleInputChange = (field: keyof ExtendedCourseData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 필수 필드 검증
    if (!formData.name.trim()) newErrors.name = '과정명을 입력해주세요';
    if (!formData.courseCode.trim()) newErrors.courseCode = '과정코드를 입력해주세요';
    if (!formData.description?.trim()) newErrors.description = '과정 설명을 입력해주세요';
    if (!formData.start_date) newErrors.start_date = '시작일을 선택해주세요';
    if (!formData.end_date) newErrors.end_date = '종료일을 선택해주세요';
    if (!formData.registrationStartDate) newErrors.registrationStartDate = '등록 시작일을 선택해주세요';
    if (!formData.registrationEndDate) newErrors.registrationEndDate = '등록 종료일을 선택해주세요';

    // 날짜 논리 검증
    const regStart = new Date(formData.registrationStartDate);
    const regEnd = new Date(formData.registrationEndDate);
    const courseStart = new Date(formData.start_date);
    const courseEnd = new Date(formData.end_date);

    if (regStart >= regEnd) {
      newErrors.registrationEndDate = '등록 종료일은 등록 시작일보다 늦어야 합니다';
    }
    if (regEnd > courseStart) {
      newErrors.registrationEndDate = '등록 종료일은 과정 시작일보다 이르거나 같아야 합니다';
    }
    if (courseStart >= courseEnd) {
      newErrors.end_date = '과정 종료일은 시작일보다 늦어야 합니다';
    }

    // 숫자 필드 검증
    if (formData.max_trainees < 1) newErrors.max_trainees = '최대 수강생은 1명 이상이어야 합니다';
    if (formData.totalSessions < 1) newErrors.totalSessions = '총 회차는 1회 이상이어야 합니다';
    if (formData.sessionDuration < 30) newErrors.sessionDuration = '회차별 시간은 30분 이상이어야 합니다';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onCancel(); // 성공 시 폼 닫기
    } catch (error) {
      console.error('과정 저장 실패:', error);
      setErrors({ submit: '저장에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'sales': '영업',
      'marketing': '마케팅', 
      'management': '관리',
      'technical': '기술',
      'soft-skills': '소프트스킬'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'basic': '기초',
      'intermediate': '중급',
      'advanced': '고급',
      'expert': '전문가'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? '과정 수정' : '새 과정 개설'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing ? '기존 과정 정보를 수정합니다' : 'BS 교육과정을 새롭게 개설합니다'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* 기본 정보 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>기본 정보</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과정명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="BS 신입 영업사원 기초과정"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과정코드 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.courseCode}
                  onChange={(e) => handleInputChange('courseCode', e.target.value)}
                  placeholder="BS-2025-SA01-01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.courseCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.courseCode && <p className="text-red-500 text-xs mt-1">{errors.courseCode}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과정 설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="과정의 목표, 대상, 주요 내용을 설명해주세요"
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* 분류 및 난이도 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <BuildingOfficeIcon className="h-5 w-5" />
              <span>분류 및 난이도</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  교육 분야
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sales">영업</option>
                  <option value="marketing">마케팅</option>
                  <option value="management">관리</option>
                  <option value="technical">기술</option>
                  <option value="soft-skills">소프트스킬</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  난이도
                </label>
                <select
                  value={formData.courseType}
                  onChange={(e) => handleInputChange('courseType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basic">기초</option>
                  <option value="intermediate">중급</option>
                  <option value="advanced">고급</option>
                  <option value="expert">전문가</option>
                </select>
              </div>
            </div>
          </div>

          {/* 일정 및 등록 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <CalendarDaysIcon className="h-5 w-5" />
              <span>일정 및 등록</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  등록 시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.registrationStartDate}
                  onChange={(e) => handleInputChange('registrationStartDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.registrationStartDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.registrationStartDate && <p className="text-red-500 text-xs mt-1">{errors.registrationStartDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  등록 종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.registrationEndDate}
                  onChange={(e) => handleInputChange('registrationEndDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.registrationEndDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.registrationEndDate && <p className="text-red-500 text-xs mt-1">{errors.registrationEndDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과정 시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과정 종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
              </div>
            </div>
          </div>

          {/* 수강 관리 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5" />
              <span>수강 관리</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 수강생 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.max_trainees}
                  onChange={(e) => handleInputChange('max_trainees', parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.max_trainees ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_trainees && <p className="text-red-500 text-xs mt-1">{errors.max_trainees}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  총 회차 수 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.totalSessions}
                  onChange={(e) => handleInputChange('totalSessions', parseInt(e.target.value) || 0)}
                  min="1"
                  max="50"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.totalSessions ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.totalSessions && <p className="text-red-500 text-xs mt-1">{errors.totalSessions}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  회차별 시간 (분) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.sessionDuration}
                  onChange={(e) => handleInputChange('sessionDuration', parseInt(e.target.value) || 0)}
                  min="30"
                  step="30"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.sessionDuration ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sessionDuration > 0 && `${formatDuration(formData.sessionDuration)}`}
                </p>
                {errors.sessionDuration && <p className="text-red-500 text-xs mt-1">{errors.sessionDuration}</p>}
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          {isAdmin && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>담당자 정보</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당 매니저 ID
                  </label>
                  <input
                    type="text"
                    value={formData.manager_id}
                    onChange={(e) => handleInputChange('manager_id', e.target.value)}
                    placeholder="manager-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    강사 ID
                  </label>
                  <input
                    type="text"
                    value={formData.instructor_id}
                    onChange={(e) => handleInputChange('instructor_id', e.target.value)}
                    placeholder="instructor-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">과정 정보 미리보기</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">과정명:</span>
                <span>{formData.name || '(미입력)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">분야/난이도:</span>
                <span>{getCategoryLabel(formData.category)} · {getTypeLabel(formData.courseType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">교육 기간:</span>
                <span>
                  {formData.start_date && formData.end_date 
                    ? `${formData.start_date} ~ ${formData.end_date}`
                    : '(미설정)'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">등록 기간:</span>
                <span>
                  {formData.registrationStartDate && formData.registrationEndDate
                    ? `${formData.registrationStartDate} ~ ${formData.registrationEndDate}`
                    : '(미설정)'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">수강 규모:</span>
                <span>최대 {formData.max_trainees}명</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">교육 구성:</span>
                <span>{formData.totalSessions}회차 × {formatDuration(formData.sessionDuration)}</span>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '개설 완료'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;