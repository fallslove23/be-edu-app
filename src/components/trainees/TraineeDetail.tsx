import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { Trainee } from '../../types/trainee.types';
import { traineeStatusLabels } from '../../types/trainee.types';
import { LearningHistoryDashboard } from '../students/LearningHistoryDashboard';

interface TraineeDetailProps {
  trainee: Trainee;
  onBack: () => void;
  onEdit: (trainee: Trainee) => void;
}

const TraineeDetail: React.FC<TraineeDetailProps> = ({
  trainee,
  onBack,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  // Mock progress data - 실제로는 API에서 가져옴
  const mockProgress = {
    totalCourses: 3,
    completedCourses: 1,
    averageScore: 85,
    totalExams: 5,
    passedExams: 4,
    lastActivity: '2024-01-25'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">교육생 상세 정보</h1>
              <p className="text-gray-600">교육생의 상세 정보와 학습 현황을 확인합니다.</p>
            </div>
          </div>
          <button
            onClick={() => onEdit(trainee)}
            className="btn-primary"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            수정
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon className="w-4 h-4 inline mr-2" />
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChartBarIcon className="w-4 h-4 inline mr-2" />
            학습 이력
          </button>
        </div>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 개인 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                개인 정보
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">이름</dt>
                <dd className="mt-1 text-sm text-gray-900">{trainee.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">사번</dt>
                <dd className="mt-1 text-sm text-gray-900">{trainee.employee_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">이메일</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {trainee.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {trainee.phone}
                </dd>
              </div>
            </div>
          </div>

          {/* 회사 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              회사 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">부서</dt>
                <dd className="mt-1 text-sm text-gray-900">{trainee.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">직급</dt>
                <dd className="mt-1 text-sm text-gray-900">{trainee.position}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">입사일</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {new Date(trainee.hire_date).toLocaleDateString('ko-KR')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">상태</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    trainee.status === 'active' ? 'bg-green-500/10 text-green-700' :
                    trainee.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                    trainee.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {traineeStatusLabels[trainee.status]}
                  </span>
                </dd>
              </div>
            </div>
          </div>

          {/* 비상 연락처 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              비상 연락처
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">이름</dt>
                <dd className="mt-1 text-sm text-gray-900">{trainee.emergency_contact.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">관계</dt>
                <dd className="mt-1 text-sm text-gray-900">{trainee.emergency_contact.relationship}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {trainee.emergency_contact.phone}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 학습 현황 */}
        <div className="space-y-6">
          {/* 학습 통계 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              학습 현황
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">수강 과정</span>
                <span className="text-sm font-medium text-gray-900">
                  {mockProgress.completedCourses} / {mockProgress.totalCourses}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-lg h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-lg" 
                  style={{ width: `${(mockProgress.completedCourses / mockProgress.totalCourses) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">평균 점수</span>
                <span className="text-sm font-medium text-gray-900">{mockProgress.averageScore}점</span>
              </div>
              <div className="w-full bg-gray-200 rounded-lg h-2">
                <div 
                  className="bg-green-600 h-2 rounded-lg" 
                  style={{ width: `${mockProgress.averageScore}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">시험 통과율</span>
                <span className="text-sm font-medium text-gray-900">
                  {mockProgress.passedExams} / {mockProgress.totalExams}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-lg h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-lg" 
                  style={{ width: `${(mockProgress.passedExams / mockProgress.totalExams) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">마지막 활동</span>
                <span className="text-gray-900">{new Date(mockProgress.lastActivity).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>

          {/* 등록된 과정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              등록 과정
            </h2>
            
            <div className="space-y-3">
              {trainee.enrolled_courses && trainee.enrolled_courses.length > 0 ? (
                trainee.enrolled_courses.map((courseId, index) => (
                  <div key={courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        영업 기초 과정 {index + 1}
                      </div>
                      <div className="text-xs text-gray-500">진행률: {Math.floor(Math.random() * 40) + 60}%</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      index === 0 ? 'bg-green-500/10 text-green-700' : 
                      index === 1 ? 'bg-blue-100 text-blue-700' : 
                      'bg-yellow-100 text-orange-700'
                    }`}>
                      {index === 0 ? '완료' : index === 1 ? '진행중' : '대기'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <AcademicCapIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">등록된 과정이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* 시스템 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">시스템 정보</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">등록일</span>
                <span className="text-gray-900">{new Date(trainee.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수정일</span>
                <span className="text-gray-900">{new Date(trainee.updated_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 학습 이력 탭 */}
      {activeTab === 'history' && (
        <LearningHistoryDashboard
          traineeId={trainee.id}
          traineeName={trainee.name}
        />
      )}
    </div>
  );
};

export default TraineeDetail;