import React, { useState } from 'react';
import {
  DocumentTextIcon,
  PresentationChartBarIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import ActivityJournal from './ActivityJournal';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'active' | 'completed';
  userRole: ('student' | 'instructor' | 'operator')[];
}

const BSJournalWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<string>('journal');

  // BS 활동일지 워크플로우 단계
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'journal',
      title: '활동일지 작성',
      description: '현장 업무 경험을 모바일에서 기록',
      icon: DocumentTextIcon,
      status: 'completed',
      userRole: ['student']
    },
    {
      id: 'submission',
      title: '일지 제출',
      description: '마감일 내 활동일지 제출 완료',
      icon: CheckCircleIcon,
      status: 'completed',
      userRole: ['student']
    },
    {
      id: 'selection',
      title: '발표자 선발',
      description: '라운드별 발표자 자동/수동 선발',
      icon: UserGroupIcon,
      status: 'active',
      userRole: ['operator']
    },
    {
      id: 'scheduling',
      title: '발표 일정 관리',
      description: '발표 순서 및 시간표 생성',
      icon: CalendarDaysIcon,
      status: 'pending',
      userRole: ['operator']
    },
    {
      id: 'presentation',
      title: '발표 진행',
      description: '라운드별 발표 및 실시간 모니터링',
      icon: PresentationChartBarIcon,
      status: 'pending',
      userRole: ['student', 'instructor', 'operator']
    },
    {
      id: 'feedback',
      title: '강사 피드백',
      description: '발표에 대한 상세 피드백 제공',
      icon: ChatBubbleLeftRightIcon,
      status: 'pending',
      userRole: ['instructor']
    },
    {
      id: 'grading',
      title: '성적 반영',
      description: '피드백 기반 성적 산출 및 반영',
      icon: TrophyIcon,
      status: 'pending',
      userRole: ['operator']
    }
  ];

  // 사용자 역할별 필터링
  const getUserSteps = () => {
    return workflowSteps.filter(step => 
      step.userRole.includes(user?.role as any) || user?.role === 'admin'
    );
  };

  const getStepColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending': return 'bg-gray-100 text-gray-500 border-gray-300';
      default: return 'bg-gray-100 text-gray-500 border-gray-300';
    }
  };

  const getIconColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // 메인 활동일지 화면을 표시하는 경우
  if (currentStep === 'main') {
    return <ActivityJournal />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📚 BS 활동일지 워크플로우</h1>
            <p className="text-gray-600">
              현장 업무 → 일지 작성 → 발표 → 피드백 → 성적 반영까지의 전체 과정을 관리합니다.
            </p>
          </div>
          <button
            onClick={() => setCurrentStep('main')}
            className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>활동일지 관리</span>
          </button>
        </div>
      </div>

      {/* 워크플로우 단계 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">📋 진행 단계</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getUserSteps().map((step, index) => {
            const Icon = step.icon;
            const isLast = index === getUserSteps().length - 1;
            
            return (
              <div key={step.id} className="relative">
                <div className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${getStepColor(step.status)}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-white ${getIconColor(step.status)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                      
                      {/* 상태 표시 */}
                      <div className="mt-3 flex items-center">
                        {step.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            완료
                          </span>
                        )}
                        {step.status === 'active' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            진행중
                          </span>
                        )}
                        {step.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            대기중
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 화살표 (마지막 항목 제외) */}
                {!isLast && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className="bg-white border border-gray-300 rounded-full p-1">
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 역할별 안내 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 학생 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-3">
            <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">👨‍🎓 학생</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• 현장 업무를 모바일에서 실시간 기록</li>
            <li>• 마감일 내 활동일지 제출</li>
            <li>• 선발 시 라운드별 발표 참여</li>
            <li>• 강사 피드백 확인 및 성적 조회</li>
          </ul>
        </div>

        {/* 강사 안내 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-3">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-purple-900">👩‍🏫 강사</h3>
          </div>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>• 학생 활동일지 현황 모니터링</li>
            <li>• 발표 진행 상황 실시간 관찰</li>
            <li>• 발표별 상세 피드백 제공</li>
            <li>• 학습 성과 평가 및 등급 부여</li>
          </ul>
        </div>

        {/* 운영자 안내 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-3">
            <CalendarDaysIcon className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-green-900">👨‍💼 운영자</h3>
          </div>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• 라운드별 발표 일정 생성</li>
            <li>• 발표자 자동/수동 선발 관리</li>
            <li>• 발표 진행 상황 컨트롤</li>
            <li>• 성적 반영 및 전체 현황 관리</li>
          </ul>
        </div>
      </div>

      {/* 시스템 특징 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">🚀 시스템 특징</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">모바일 최적화</h3>
                <p className="text-sm text-gray-600">현장에서 모바일로 즉시 활동일지 작성 가능</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">자동 선발 시스템</h3>
                <p className="text-sm text-gray-600">제출 시간, 내용 품질을 기반으로 공정한 발표자 선발</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">실시간 피드백</h3>
                <p className="text-sm text-gray-600">발표 중 강사가 실시간으로 피드백 제공</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">라운드 기반 관리</h3>
                <p className="text-sm text-gray-600">차수별 체계적인 발표 일정 및 진행 관리</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">자동 성적 반영</h3>
                <p className="text-sm text-gray-600">피드백 기반 자동 등급 계산 및 성적 반영</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">통합 대시보드</h3>
                <p className="text-sm text-gray-600">전체 과정 현황을 한눈에 파악 가능한 관리 화면</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BSJournalWorkflow;