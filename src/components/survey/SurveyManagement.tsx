import React from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const SurveyManagement: React.FC = () => {
  // 교육 피드백 시스템 연동
  const openEducationFeedback = () => {
    window.open('https://education-feedback.lovable.app', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <ChartBarIcon className="h-7 w-7 text-green-600" />
              <span>설문 관리</span>
            </h1>
            <p className="text-gray-600">
              교육 만족도 및 피드백 설문을 관리하고 결과를 분석하세요.
            </p>
          </div>
          
          <button
            onClick={openEducationFeedback}
            className="btn-success px-6 py-3 rounded-full flex items-center space-x-2 transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            <span>교육 피드백 시스템</span>
          </button>
        </div>
      </div>

      {/* 시스템 연동 정보 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <LinkIcon className="h-8 w-8 text-green-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              교육 피드백 시스템 연동
            </h3>
            <p className="text-green-800 mb-4">
              교육 과정에 대한 만족도 설문, 강사 평가, 교육 개선 피드백을 수집하고 분석할 수 있는 
              전문 설문 시스템과 연동되어 있습니다.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white bg-opacity-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">주요 기능</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 교육 만족도 설문 생성</li>
                  <li>• 강사별 교육 평가</li>
                  <li>• 교육 과정 개선 피드백</li>
                  <li>• 실시간 설문 결과 분석</li>
                </ul>
              </div>
              
              <div className="bg-white bg-opacity-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">지원 설문 유형</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 과정 전반 만족도 설문</li>
                  <li>• 일차별 교육 피드백</li>
                  <li>• 강사별 교육 효과성 평가</li>
                  <li>• 교육 환경 및 시설 평가</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={openEducationFeedback}
                className="btn-success px-4 py-2 rounded-full flex items-center space-x-2"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                <span>설문 시스템 접속</span>
              </button>
              
              <div className="text-sm text-green-700">
                <span className="font-medium">연동 주소:</span>
                <span className="ml-2 font-mono">education-feedback.lovable.app</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 설문 관리 기능 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 설문 생성 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">설문 생성</h3>
          </div>
          <p className="text-gray-600 mb-4">
            새로운 교육 피드백 설문을 생성하고 배포합니다.
          </p>
          <button
            onClick={openEducationFeedback}
            className="btn-primary w-full py-2 px-4 rounded-full flex items-center justify-center space-x-2"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>설문 생성하기</span>
          </button>
        </div>

        {/* 결과 분석 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">결과 분석</h3>
          </div>
          <p className="text-gray-600 mb-4">
            수집된 설문 결과를 분석하고 리포트를 생성합니다.
          </p>
          <button
            onClick={openEducationFeedback}
            className="btn-purple w-full flex items-center justify-center space-x-2"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>결과 분석하기</span>
          </button>
        </div>

        {/* 교육 과정 연동 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">과정 연동</h3>
          </div>
          <p className="text-gray-600 mb-4">
            진행중인 교육 과정과 설문을 연동하여 관리합니다.
          </p>
          <button
            onClick={openEducationFeedback}
            className="btn-success w-full py-2 px-4 rounded-full flex items-center justify-center space-x-2"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>과정 연동하기</span>
          </button>
        </div>
      </div>

      {/* 설문 운영 가이드 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">설문 운영 가이드</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-3">설문 시기별 운영</h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-lg mt-2"></div>
                <div>
                  <strong className="text-gray-800">과정 시작 전:</strong> 사전 기대도 및 학습 목표 설문
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-lg mt-2"></div>
                <div>
                  <strong className="text-gray-800">일차별:</strong> 일일 교육 만족도 및 이해도 체크
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-lg mt-2"></div>
                <div>
                  <strong className="text-gray-800">과정 종료 후:</strong> 전체 과정 평가 및 개선 사항
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-lg mt-2"></div>
                <div>
                  <strong className="text-gray-800">추후 관리:</strong> 교육 효과성 및 현업 적용도 조사
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-3">주요 설문 항목</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• 교육 내용의 실무 적용 가능성</div>
              <div>• 강사의 교육 능력 및 전문성</div>
              <div>• 교육 자료의 품질 및 이해도</div>
              <div>• 교육 환경 및 시설 만족도</div>
              <div>• 교육 시간 및 일정의 적절성</div>
              <div>• 전반적인 교육 만족도</div>
              <div>• 향후 교육 개선 사항</div>
            </div>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <LinkIcon className="h-4 w-4 mr-2" />
          <span>
            <strong>연동 시스템:</strong> education-feedback.lovable.app | 
            <strong className="ml-2">접속 방법:</strong> 외부 링크 연결 | 
            <strong className="ml-2">데이터 연동:</strong> API 기반 실시간 동기화
          </span>
        </div>
      </div>
    </div>
  );
};

export default SurveyManagement;