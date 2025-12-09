import React, { useState } from 'react';
import {
  Pencil,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  Shield,
  GraduationCap,
  BarChart2,
  BookOpen
} from 'lucide-react';
import type { Trainee } from '../../types/trainee.types';
import { traineeStatusLabels } from '../../types/trainee.types';
// import { LearningHistoryDashboard } from '../students/LearningHistoryDashboard'; // 삭제된 컴포넌트
import { DetailLayout, DetailSection } from '../common/DetailLayout';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DetailLayout
      title="교육생 상세 정보"
      description="교육생의 상세 정보와 학습 현황을 확인합니다."
      onBack={onBack}
      actions={
        <button
          onClick={() => onEdit(trainee)}
          className="btn-primary"
        >
          <Pencil className="h-4 w-4 mr-2" />
          수정
        </button>
      }
    >
      {/* 탭 */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'info'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <UserIcon className="w-4 h-4 inline mr-2" />
          기본 정보
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <BarChart2 className="w-4 h-4 inline mr-2" />
          학습 이력
        </button>
      </div>

      {/* 탭 내용 */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 개인 정보 */}
            <DetailSection title="개인 정보" icon={<UserIcon className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">이름</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{trainee.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">사번</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white font-mono">{trainee.employee_id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">이메일</div>
                  <div className="flex items-center text-gray-900 dark:text-white font-medium">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {trainee.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">전화번호</div>
                  <div className="flex items-center text-gray-900 dark:text-white font-medium">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {trainee.phone}
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* 회사 정보 */}
            <DetailSection title="회사 정보" icon={<Building2 className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">부서</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{trainee.department}</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">직급</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{trainee.position}</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">입사일</div>
                  <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(trainee.hire_date)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">상태</div>
                  <div>
                    <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${trainee.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        trainee.status === 'graduated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          trainee.status === 'inactive' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                      {traineeStatusLabels[trainee.status]}
                    </span>
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* 비상 연락처 */}
            <DetailSection title="비상 연락처" icon={<Shield className="h-5 w-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">이름</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{trainee.emergency_contact.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">관계</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{trainee.emergency_contact.relationship}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">전화번호</div>
                  <div className="flex items-center text-lg font-medium text-gray-900 dark:text-white">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {trainee.emergency_contact.phone}
                  </div>
                </div>
              </div>
            </DetailSection>
          </div>

          {/* 오른쪽: 학습 현황 */}
          <div className="space-y-6">
            {/* 학습 통계 */}
            <DetailSection title="학습 현황" icon={<BarChart2 className="h-5 w-5" />}>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">수강 과정</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {mockProgress.completedCourses} / {mockProgress.totalCourses}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${(mockProgress.completedCourses / mockProgress.totalCourses) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">평균 점수</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{mockProgress.averageScore}점</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${mockProgress.averageScore}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">시험 통과율</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {mockProgress.passedExams} / {mockProgress.totalExams}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${(mockProgress.passedExams / mockProgress.totalExams) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">마지막 활동</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatDate(mockProgress.lastActivity)}</span>
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* 등록된 과정 */}
            <DetailSection title="등록 과정" icon={<GraduationCap className="h-5 w-5" />}>
              <div className="space-y-4">
                {trainee.enrolled_courses && trainee.enrolled_courses.length > 0 ? (
                  trainee.enrolled_courses.map((courseId, index) => (
                    <div key={courseId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                          영업 기초 과정 {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">진행률: {Math.floor(Math.random() * 40) + 60}%</div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${index === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          index === 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-yellow-100 text-orange-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                        {index === 0 ? '완료' : index === 1 ? '진행중' : '대기'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">등록된 과정이 없습니다</p>
                  </div>
                )}
              </div>
            </DetailSection>

            {/* 시스템 정보 */}
            <DetailSection title="시스템 정보">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">등록일</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(trainee.created_at)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 dark:text-gray-400">수정일</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(trainee.updated_at)}</span>
                </div>
              </div>
            </DetailSection>
          </div>
        </div>
      )}

      {/* 학습 이력 탭 */}
      {activeTab === 'history' && (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">학습 히스토리 기능은 준비 중입니다.</p>
        </div>
      )}
    </DetailLayout>
  );
};

export default TraineeDetail;