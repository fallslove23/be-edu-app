import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Trainee, TraineeStatus } from '../../types/trainee.types';
import { traineeStatusLabels } from '../../types/trainee.types';
import { CommonCodeService, CommonCode } from '@/services/common-code.service';

interface TraineeFormProps {
  trainee: Trainee | null;
  onBack: () => void;
  onSave: (traineeData: Partial<Trainee>) => void;
}

interface TraineeFormData {
  name: string;
  email: string;
  phone: string;
  employee_id: string;
  department: string;
  position: string;
  hire_date: string;
  status: TraineeStatus;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
}

const TraineeForm: React.FC<TraineeFormProps> = ({
  trainee,
  onBack,
  onSave
}) => {
  // 공통 코드 상태
  const [departments, setDepartments] = useState<CommonCode[]>([]);
  const [positions, setPositions] = useState<CommonCode[]>([]);
  const [relationships, setRelationships] = useState<CommonCode[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<TraineeFormData>({
    defaultValues: trainee ? {
      name: trainee.name,
      email: trainee.email,
      phone: trainee.phone,
      employee_id: trainee.employee_id,
      department: trainee.department,
      position: trainee.position,
      hire_date: trainee.hire_date,
      status: trainee.status,
      emergency_contact_name: trainee.emergency_contact.name,
      emergency_contact_relationship: trainee.emergency_contact.relationship,
      emergency_contact_phone: trainee.emergency_contact.phone
    } : {
      name: '',
      email: '',
      phone: '',
      employee_id: '',
      department: '',
      position: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      emergency_contact_phone: ''
    }
  });

  // 공통 코드 로드
  useEffect(() => {
    const loadCommonCodes = async () => {
      try {
        setLoading(true);
        const [deptCodes, posCodes, relCodes] = await Promise.all([
          CommonCodeService.getDepartments(),
          CommonCodeService.getPositions(),
          CommonCodeService.getRelationships()
        ]);
        setDepartments(deptCodes);
        setPositions(posCodes);
        setRelationships(relCodes);
      } catch (error) {
        console.error('공통 코드 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommonCodes();
  }, []);

  const onSubmit = async (data: TraineeFormData) => {
    const traineeData: Partial<Trainee> = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      employee_id: data.employee_id,
      department: data.department,
      position: data.position,
      hire_date: data.hire_date,
      status: data.status,
      enrolled_courses: trainee?.enrolled_courses || [],
      emergency_contact: {
        name: data.emergency_contact_name,
        relationship: data.emergency_contact_relationship,
        phone: data.emergency_contact_phone
      }
    };

    onSave(traineeData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {trainee ? '교육생 정보 수정' : '새 교육생 등록'}
            </h1>
            <p className="text-gray-600">
              {trainee ? '기존 교육생 정보를 수정합니다.' : '새로운 교육생을 등록합니다.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 *
              </label>
              <input
                type="text"
                {...register('name', { required: '이름을 입력해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="홍길동"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 *
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: '이메일을 입력해주세요.',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: '올바른 이메일 형식을 입력해주세요.'
                  }
                })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="example@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 *
              </label>
              <input
                type="tel"
                {...register('phone', { required: '전화번호를 입력해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="010-1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사번 *
              </label>
              <input
                type="text"
                {...register('employee_id', { required: '사번을 입력해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="EMP001"
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-destructive">{errors.employee_id.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 회사 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">회사 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부서 *
              </label>
              <select
                {...register('department', { required: '부서를 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">부서 선택</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직급 *
              </label>
              <select
                {...register('position', { required: '직급을 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">직급 선택</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.name}>{pos.name}</option>
                ))}
              </select>
              {errors.position && (
                <p className="mt-1 text-sm text-destructive">{errors.position.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입사일 *
              </label>
              <input
                type="date"
                {...register('hire_date', { required: '입사일을 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.hire_date && (
                <p className="mt-1 text-sm text-destructive">{errors.hire_date.message}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태 *
            </label>
            <select
              {...register('status', { required: '상태를 선택해주세요.' })}
              className="w-full md:w-1/3 border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {(Object.keys(traineeStatusLabels) as TraineeStatus[]).map(status => (
                <option key={status} value={status}>{traineeStatusLabels[status]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 비상 연락처 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">비상 연락처</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연락처 이름 *
              </label>
              <input
                type="text"
                {...register('emergency_contact_name', { required: '비상 연락처 이름을 입력해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="김가족"
              />
              {errors.emergency_contact_name && (
                <p className="mt-1 text-sm text-destructive">{errors.emergency_contact_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관계 *
              </label>
              <select
                {...register('emergency_contact_relationship', { required: '관계를 선택해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">관계 선택</option>
                {relationships.map(rel => (
                  <option key={rel.id} value={rel.name}>{rel.name}</option>
                ))}
              </select>
              {errors.emergency_contact_relationship && (
                <p className="mt-1 text-sm text-destructive">{errors.emergency_contact_relationship.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 *
              </label>
              <input
                type="tel"
                {...register('emergency_contact_phone', { required: '비상 연락처 전화번호를 입력해주세요.' })}
                className="w-full border border-gray-300 rounded-full px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="010-9876-5432"
              />
              {errors.emergency_contact_phone && (
                <p className="mt-1 text-sm text-destructive">{errors.emergency_contact_phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? '저장 중...' : (trainee ? '수정 완료' : '교육생 등록')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TraineeForm;