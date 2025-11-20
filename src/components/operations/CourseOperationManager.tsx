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
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../ui';

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

  const getStatusBadgeVariant = (status: string): 'success' | 'info' | 'warning' | 'default' | 'danger' => {
    switch (status) {
      case 'in_progress': return 'success';
      case 'scheduled': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'default';
      case 'cancelled': return 'danger';
      default: return 'default';
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return '진행중';
      case 'scheduled': return '예정';
      case 'paused': return '일시정지';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  const getIssueBadgeVariant = (severity: string): 'danger' | 'warning' | 'info' => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
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
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">과정 운영 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <Card variant="elevated">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">⚙️ 과정 운영 관리</h1>
              <p className="text-gray-600">
                진행중인 교육 과정의 전반적인 운영 현황을 관리합니다.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={<ArrowPathIcon className="h-5 w-5" />}
              onClick={loadData}
            >
              새로고침
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 과정 목록 */}
        <div className="lg:col-span-1">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>
                운영 과정 목록 ({courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={`p-4 rounded-md border cursor-pointer transition-all ${
                      selectedCourse?.id === course.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {course.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {course.code} • {course.instructor}
                        </p>
                      </div>
                      {course.issues.length > 0 && (
                        <Badge
                          variant="danger"
                          size="sm"
                          icon={<BellIcon className="h-3 w-3" />}
                        >
                          {course.issues.length}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={getStatusBadgeVariant(course.status)}
                        size="sm"
                        icon={getStatusIcon(course.status)}
                      >
                        {getStatusLabel(course.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {course.completedSessions}/{course.totalSessions} 세션
                      </span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full bg-gray-200 rounded-lg h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-lg transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 상세 정보 */}
        {selectedCourse && (
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedCourse.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCourse.code} • {selectedCourse.instructor} • {selectedCourse.classroom}
                    </p>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(selectedCourse.status)}
                    icon={getStatusIcon(selectedCourse.status)}
                  >
                    {getStatusLabel(selectedCourse.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* 탭 */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'overview', label: '개요', icon: ChartBarIcon },
                      { id: 'sessions', label: '세션', icon: CalendarDaysIcon },
                      { id: 'issues', label: '이슈', icon: ExclamationTriangleIcon },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`
                          flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                      >
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                        {tab.id === 'issues' && selectedCourse.issues.length > 0 && (
                          <Badge variant="danger" size="sm">
                            {selectedCourse.issues.length}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* 탭 콘텐츠 */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">전체 세션</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {selectedCourse.totalSessions}
                              </p>
                            </div>
                            <CalendarDaysIcon className="h-10 w-10 text-indigo-600" />
                          </div>
                        </div>
                      </Card>

                      <Card>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">등록 학생</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {selectedCourse.totalStudents}
                              </p>
                            </div>
                            <UserGroupIcon className="h-10 w-10 text-green-600" />
                          </div>
                        </div>
                      </Card>

                      <Card>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">진행률</p>
                              <p className="text-2xl font-bold text-gray-900">
                                {selectedCourse.progress}%
                              </p>
                            </div>
                            <ChartBarIcon className="h-10 w-10 text-blue-600" />
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* 상태 변경 버튼 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">과정 상태 관리</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          leftIcon={<PlayCircleIcon className="h-4 w-4" />}
                          onClick={() => updateCourseStatus(selectedCourse.id, 'in_progress')}
                          disabled={selectedCourse.status === 'in_progress'}
                        >
                          진행 시작
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          leftIcon={<PauseCircleIcon className="h-4 w-4" />}
                          onClick={() => updateCourseStatus(selectedCourse.id, 'paused')}
                          disabled={selectedCourse.status === 'paused'}
                        >
                          일시 정지
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                          onClick={() => updateCourseStatus(selectedCourse.id, 'completed')}
                          disabled={selectedCourse.status === 'completed'}
                        >
                          완료
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<XCircleIcon className="h-4 w-4" />}
                          onClick={() => updateCourseStatus(selectedCourse.id, 'cancelled')}
                          disabled={selectedCourse.status === 'cancelled'}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div className="space-y-3">
                    {sessions
                      .filter(s => s.courseId === selectedCourse.id)
                      .map((session) => (
                        <Card key={session.id}>
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {session.sessionNumber}회차: {session.title}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {session.date} {session.startTime} - {session.endTime}
                                </p>
                              </div>
                              <Badge
                                variant={getStatusBadgeVariant(session.status)}
                                size="sm"
                              >
                                {getStatusLabel(session.status)}
                              </Badge>
                            </div>
                            {session.notes && (
                              <p className="mt-2 text-sm text-gray-600">{session.notes}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                  </div>
                )}

                {activeTab === 'issues' && (
                  <div className="space-y-3">
                    {selectedCourse.issues.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-500">보고된 이슈가 없습니다.</p>
                      </div>
                    ) : (
                      selectedCourse.issues.map((issue) => (
                        <Card key={issue.id}>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{issue.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                              </div>
                              <Badge
                                variant={getIssueBadgeVariant(issue.severity)}
                                size="sm"
                              >
                                {issue.severity === 'high' ? '높음' :
                                 issue.severity === 'medium' ? '중간' : '낮음'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>보고일: {issue.reportedDate}</span>
                              <Badge variant="warning" size="sm">
                                {issue.status === 'open' ? '미해결' :
                                 issue.status === 'in_progress' ? '처리중' : '해결'}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseOperationManager;
