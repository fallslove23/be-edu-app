import React, { useState } from 'react';
import {
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface MyCourse {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  duration: string;
  enrolled_at: string;
  last_accessed?: string;
  description: string;
}

const MyCourses: React.FC = () => {
  const [courses] = useState<MyCourse[]>([
    {
      id: '1',
      title: 'BS 영업 기초 과정',
      instructor: '김강사',
      progress: 75,
      status: 'in_progress',
      duration: '4주',
      enrolled_at: '2024-01-15',
      last_accessed: '2024-08-10',
      description: '영업의 기본 개념과 고객 관리 방법을 학습합니다.'
    },
    {
      id: '2',
      title: 'CRM 시스템 활용',
      instructor: '이강사',
      progress: 100,
      status: 'completed',
      duration: '2주',
      enrolled_at: '2024-01-01',
      last_accessed: '2024-01-30',
      description: 'CRM 시스템을 효과적으로 활용하는 방법을 배웁니다.'
    },
    {
      id: '3',
      title: '고급 영업 전략',
      instructor: '박강사',
      progress: 0,
      status: 'not_started',
      duration: '6주',
      enrolled_at: '2024-08-01',
      description: '고급 영업 기법과 전략 수립 방법을 학습합니다.'
    }
  ]);

  const getStatusInfo = (status: MyCourse['status']) => {
    switch (status) {
      case 'completed':
        return { label: '완료', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon };
      case 'in_progress':
        return { label: '수강중', color: 'bg-blue-100 text-blue-800', icon: PlayIcon };
      case 'not_started':
        return { label: '시작 예정', color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpenIcon className="h-6 w-6 mr-2" />
              내 수강 과정
            </h1>
            <p className="text-gray-600">수강중인 과정과 학습 진도를 확인하세요.</p>
          </div>
          <div className="text-sm text-gray-500">
            총 {courses.length}개 과정 등록
          </div>
        </div>
      </div>

      {/* 진행 상황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">진행중</p>
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.status === 'in_progress').length}
              </p>
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
              <p className="text-2xl font-semibold text-gray-900">
                {courses.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">평균 진도</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 과정 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">수강 과정</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {courses.map((course) => {
            const statusInfo = getStatusInfo(course.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{course.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <span>👨‍🏫 {course.instructor}</span>
                      <span>⏱️ {course.duration}</span>
                      <span>📅 {new Date(course.enrolled_at).toLocaleDateString('ko-KR')}부터</span>
                      {course.last_accessed && (
                        <span>👀 {new Date(course.last_accessed).toLocaleDateString('ko-KR')} 접속</span>
                      )}
                    </div>

                    {/* 진도 바 */}
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            course.progress === 100 ? 'bg-green-500' : 
                            course.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {course.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    {course.status === 'in_progress' && (
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                        <PlayIcon className="h-4 w-4 mr-2" />
                        계속 학습
                      </button>
                    )}
                    {course.status === 'not_started' && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        학습 시작
                      </button>
                    )}
                    {course.status === 'completed' && (
                      <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        복습하기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">수강중인 과정이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">관리자에게 과정 등록을 요청하세요.</p>
        </div>
      )}
    </div>
  );
};

export default MyCourses;