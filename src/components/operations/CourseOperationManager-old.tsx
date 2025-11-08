import React, { useState, useEffect } from 'react';
import {
  PlayCircleIcon,
  PauseCircleIcon,
  StopCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface Course {
  id: string;
  code: string;
  name: string;
  round: number;
  status: 'scheduled' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  totalStudents: number;
  presentStudents: number;
  instructor: string;
  classroom: string;
  progress: number;
  issues: CourseIssue[];
}

interface CourseIssue {
  id: string;
  type: 'attendance' | 'technical' | 'schedule' | 'other';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  reportedDate: string;
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo?: string;
}

interface Session {
  id: string;
  courseId: string;
  date: string;
  sessionNumber: number;
  title: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendanceRate: number;
  notes?: string;
}

const CourseOperationManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'issues'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // 모의 데이터 생성
    setTimeout(() => {
      const mockCourses: Course[] = [
        {
          id: 'course-1',
          code: 'BS-2025-01',
          name: 'BS 신입 영업사원 기초과정 1차',
          round: 1,
          status: 'in_progress',
          startDate: '2025-01-20',
          endDate: '2025-02-28',
          totalSessions: 20,
          completedSessions: 8,
          totalStudents: 25,
          presentStudents: 23,
          instructor: '김강사',
          classroom: '교육실 A',
          progress: 40,
          issues: [
            {
              id: 'issue-1',
              type: 'attendance',
              severity: 'medium',
              title: '출석률 저조',
              description: '최근 3일간 출석률이 85% 이하로 떨어졌습니다.',
              reportedDate: '2025-01-25',
              status: 'open'
            }
          ]
        },
        {
          id: 'course-2',
          code: 'BS-2025-02',
          name: 'BS 고급 영업 전략과정 2차',
          round: 2,
          status: 'in_progress',
          startDate: '2025-01-15',
          endDate: '2025-02-20',
          totalSessions: 15,
          completedSessions: 12,
          totalStudents: 18,
          presentStudents: 18,
          instructor: '이강사',
          classroom: '교육실 B',
          progress: 80,
          issues: []
        },
        {
          id: 'course-3',
          code: 'BS-2025-03',
          name: 'BS 신입 영업사원 기초과정 3차',
          round: 3,
          status: 'scheduled',
          startDate: '2025-02-10',
          endDate: '2025-03-20',
          totalSessions: 20,
          completedSessions: 0,
          totalStudents: 30,
          presentStudents: 0,
          instructor: '박강사',
          classroom: '교육실 C',
          progress: 0,
          issues: []
        }
      ];

      const mockSessions: Session[] = [
        {
          id: 'session-1',
          courseId: 'course-1',
          date: '2025-01-26',
          sessionNumber: 9,
          title: '영업 프로세스 실습',
          startTime: '09:00',
          endTime: '18:00',
          status: 'scheduled',
          attendanceRate: 0
        },
        {
          id: 'session-2',
          courseId: 'course-1',
          date: '2025-01-25',
          sessionNumber: 8,
          title: '고객 관계 관리',
          startTime: '09:00',
          endTime: '18:00',
          status: 'completed',
          attendanceRate: 92,
          notes: '실습 진행 우수, 질의응답 활발'
        }
      ];

      setCourses(mockCourses);
      setSessions(mockSessions);
      setSelectedCourse(mockCourses[0]);
      setLoading(false);
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'text-green-600 bg-green-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <PlayCircleIcon className="h-4 w-4" />;
      case 'scheduled': return <ClockIcon className="h-4 w-4" />;
      case 'paused': return <PauseCircleIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled': return <XCircleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getIssueColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const updateCourseStatus = (courseId: string, newStatus: Course['status']) => {
    setCourses(prev => 
      prev.map(course => 
        course.id === courseId 
          ? { ...course, status: newStatus }
          : course
      )
    );
    
    if (selectedCourse?.id === courseId) {
      setSelectedCourse(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">과정 운영 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">⚙️ 과정 운영 관리</h1>
            <p className="text-gray-600 dark:text-gray-300">
              진행중인 교육 과정의 전반적인 운영 현황을 관리합니다.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2">
              <ArrowPathIcon className="h-4 w-4" />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 과정 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                운영 과정 목록 ({courses.length})
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedCourse?.id === course.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {course.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {course.code} • {course.instructor}
                      </p>
                    </div>
                    {course.issues.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <BellIcon className="h-3 w-3 mr-1" />
                        {course.issues.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                      {getStatusIcon(course.status)}
                      <span>
                        {course.status === 'in_progress' ? '진행중' :
                         course.status === 'scheduled' ? '예정' :
                         course.status === 'paused' ? '일시정지' :
                         course.status === 'completed' ? '완료' : '취소'}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {course.completedSessions}/{course.totalSessions} 세션
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    진도율: {course.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="lg:col-span-2">
          {selectedCourse ? (
            <div className="space-y-6">
              {/* 과정 정보 및 제어 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCourse.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedCourse.code} • {selectedCourse.instructor} • {selectedCourse.classroom}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                    {selectedCourse.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => updateCourseStatus(selectedCourse.id, 'paused')}
                          className="btn-warning flex items-center space-x-1 text-sm"
                        >
                          <PauseCircleIcon className="h-4 w-4" />
                          <span>일시정지</span>
                        </button>
                        <button
                          onClick={() => updateCourseStatus(selectedCourse.id, 'completed')}
                          className="btn-success px-3 py-2 rounded-lg flex items-center space-x-1 text-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>완료처리</span>
                        </button>
                      </>
                    )}
                    {selectedCourse.status === 'paused' && (
                      <button
                        onClick={() => updateCourseStatus(selectedCourse.id, 'in_progress')}
                        className="btn-success px-3 py-2 rounded-lg flex items-center space-x-1 text-sm"
                      >
                        <PlayCircleIcon className="h-4 w-4" />
                        <span>재개</span>
                      </button>
                    )}
                    {selectedCourse.status === 'scheduled' && (
                      <button
                        onClick={() => updateCourseStatus(selectedCourse.id, 'in_progress')}
                        className="btn-primary px-3 py-2 rounded-lg flex items-center space-x-1 text-sm"
                      >
                        <PlayCircleIcon className="h-4 w-4" />
                        <span>시작</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 현황 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">총 교육생</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCourse.totalStudents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">현재 출석</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCourse.presentStudents}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">완료 세션</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCourse.completedSessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">진도율</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCourse.progress}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 탭 메뉴 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'overview', label: '개요', icon: EyeIcon },
                      { id: 'sessions', label: '세션 관리', icon: CalendarDaysIcon },
                      { id: 'issues', label: '이슈 관리', icon: ExclamationTriangleIcon }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {tab.id === 'issues' && selectedCourse.issues.length > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs rounded-full px-2 py-1 ml-1">
                            {selectedCourse.issues.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">과정 정보</h4>
                          <dl className="space-y-3">
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">과정 코드</dt>
                              <dd className="text-sm text-gray-900 dark:text-white">{selectedCourse.code}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">교육 기간</dt>
                              <dd className="text-sm text-gray-900 dark:text-white">
                                {selectedCourse.startDate} ~ {selectedCourse.endDate}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">강사</dt>
                              <dd className="text-sm text-gray-900 dark:text-white">{selectedCourse.instructor}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">교실</dt>
                              <dd className="text-sm text-gray-900 dark:text-white">{selectedCourse.classroom}</dd>
                            </div>
                          </dl>
                        </div>

                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">진행 현황</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">전체 진도</span>
                                <span className="text-gray-900 dark:text-white">{selectedCourse.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${selectedCourse.progress}%` }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">출석률</span>
                                <span className="text-gray-900 dark:text-white">
                                  {Math.round((selectedCourse.presentStudents / selectedCourse.totalStudents) * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${(selectedCourse.presentStudents / selectedCourse.totalStudents) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'sessions' && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">세션 목록</h4>
                      <div className="space-y-3">
                        {sessions
                          .filter(session => session.courseId === selectedCourse.id)
                          .map((session) => (
                            <div key={session.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    {session.sessionNumber}일차: {session.title}
                                  </h5>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {session.date} {session.startTime}~{session.endTime}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  {session.status === 'completed' && (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      출석률: {session.attendanceRate}%
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                    {getStatusIcon(session.status)}
                                    <span>
                                      {session.status === 'completed' ? '완료' :
                                       session.status === 'in_progress' ? '진행중' :
                                       session.status === 'scheduled' ? '예정' : '취소'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              {session.notes && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                  {session.notes}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'issues' && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        이슈 목록 ({selectedCourse.issues.length})
                      </h4>
                      {selectedCourse.issues.length > 0 ? (
                        <div className="space-y-3">
                          {selectedCourse.issues.map((issue) => (
                            <div key={issue.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getIssueColor(issue.severity)}`}>
                                      {issue.severity === 'high' ? '높음' :
                                       issue.severity === 'medium' ? '보통' : '낮음'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {issue.type === 'attendance' ? '출석' :
                                       issue.type === 'technical' ? '기술' :
                                       issue.type === 'schedule' ? '일정' : '기타'}
                                    </span>
                                  </div>
                                  <h5 className="font-medium text-gray-900 dark:text-white">{issue.title}</h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{issue.description}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    신고일: {issue.reportedDate}
                                  </p>
                                </div>
                                <div className="ml-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    issue.status === 'open' ? 'bg-red-100 text-red-800' :
                                    issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {issue.status === 'open' ? '미해결' :
                                     issue.status === 'in_progress' ? '진행중' : '해결됨'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          현재 등록된 이슈가 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center text-gray-500 dark:text-gray-400">
                좌측에서 관리할 과정을 선택하세요.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseOperationManager;