import React, { useState } from 'react';
import {
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface MyExam {
  id: string;
  title: string;
  course: string;
  type: '이론' | '실습';
  status: 'available' | 'in_progress' | 'completed' | 'missed';
  score?: number;
  max_score: number;
  attempts: number;
  max_attempts: number;
  duration: number;
  due_date: string;
  completed_at?: string;
  passed: boolean;
}

const MyExams: React.FC = () => {
  const [exams] = useState<MyExam[]>([
    {
      id: '1',
      title: '영업 기초 이론 평가',
      course: 'BS 영업 기초 과정',
      type: '이론',
      status: 'available',
      max_score: 100,
      attempts: 0,
      max_attempts: 3,
      duration: 60,
      due_date: '2024-08-25T18:00:00Z',
      passed: false
    },
    {
      id: '2',
      title: 'CRM 시스템 활용 평가',
      course: 'CRM 시스템 활용',
      type: '이론',
      status: 'completed',
      score: 85,
      max_score: 100,
      attempts: 2,
      max_attempts: 3,
      duration: 45,
      due_date: '2024-01-30T18:00:00Z',
      completed_at: '2024-01-28T15:30:00Z',
      passed: true
    },
    {
      id: '3',
      title: '고객 응대 시뮬레이션',
      course: 'BS 영업 기초 과정',
      type: '실습',
      status: 'in_progress',
      max_score: 100,
      attempts: 1,
      max_attempts: 2,
      duration: 90,
      due_date: '2024-08-30T18:00:00Z',
      passed: false
    },
    {
      id: '4',
      title: '월말 종합 평가',
      course: 'BS 영업 기초 과정',
      type: '이론',
      status: 'missed',
      max_score: 100,
      attempts: 0,
      max_attempts: 1,
      duration: 120,
      due_date: '2024-07-31T18:00:00Z',
      passed: false
    }
  ]);

  const getStatusInfo = (exam: MyExam) => {
    const isOverdue = new Date(exam.due_date) < new Date();
    
    switch (exam.status) {
      case 'available':
        return { 
          label: isOverdue ? '기한 만료' : '응시 가능', 
          color: isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800', 
          icon: isOverdue ? ExclamationTriangleIcon : PencilSquareIcon 
        };
      case 'in_progress':
        return { label: '진행중', color: 'bg-blue-100 text-blue-800', icon: ClockIcon };
      case 'completed':
        return { 
          label: exam.passed ? '합격' : '불합격', 
          color: exam.passed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800', 
          icon: exam.passed ? CheckCircleIcon : ExclamationTriangleIcon 
        };
      case 'missed':
        return { label: '미응시', color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon };
    }
  };

  const availableExams = exams.filter(e => e.status === 'available');
  const completedExams = exams.filter(e => e.status === 'completed');
  const passedExams = completedExams.filter(e => e.passed);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <PencilSquareIcon className="h-6 w-6 mr-2" />
              시험 응시
            </h1>
            <p className="text-gray-600">예정된 시험에 응시하고 결과를 확인하세요.</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PencilSquareIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">응시 가능</p>
              <p className="text-2xl font-semibold text-gray-900">{availableExams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">완료</p>
              <p className="text-2xl font-semibold text-gray-900">{completedExams.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">합격률</p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedExams.length > 0 ? Math.round((passedExams.length / completedExams.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">평균 점수</p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedExams.length > 0 
                  ? Math.round(completedExams.reduce((sum, e) => sum + (e.score || 0), 0) / completedExams.length)
                  : 0
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 시험 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">시험 목록</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {exams.map((exam) => {
            const statusInfo = getStatusInfo(exam);
            const StatusIcon = statusInfo.icon;
            const isOverdue = new Date(exam.due_date) < new Date();

            return (
              <div key={exam.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{exam.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        exam.type === '이론' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {exam.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{exam.course}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {exam.duration}분
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(exam.due_date).toLocaleDateString('ko-KR')}
                      </div>
                      <div>
                        응시 횟수: {exam.attempts}/{exam.max_attempts}
                      </div>
                      {exam.score && (
                        <div>
                          점수: {exam.score}/{exam.max_score}
                        </div>
                      )}
                    </div>

                    {exam.completed_at && (
                      <div className="text-sm text-gray-500">
                        완료일: {new Date(exam.completed_at).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    {exam.status === 'available' && !isOverdue && exam.attempts < exam.max_attempts && (
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        시험 응시
                      </button>
                    )}
                    {exam.status === 'in_progress' && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        계속 응시
                      </button>
                    )}
                    {exam.status === 'completed' && exam.attempts < exam.max_attempts && !exam.passed && (
                      <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                        재응시
                      </button>
                    )}
                    {exam.status === 'completed' && (
                      <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        결과 보기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {exams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <PencilSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">예정된 시험이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">새로운 시험이 등록되면 알려드리겠습니다.</p>
        </div>
      )}
    </div>
  );
};

export default MyExams;