import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  TrophyIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  ChevronRightIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import type { StudentProfile as StudentProfileType, CourseEnrollment } from '../../types/student.types';
import { useAuth } from '../../contexts/AuthContext';
import StudentScoring from './StudentScoring';

interface StudentProfileProps {
  studentId: string;
  onBack?: () => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, onBack }) => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';
  
  const [student, setStudent] = useState<StudentProfileType | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'performance' | 'scoring'>('overview');
  
  // 강사가 scoring 탭에 있으면 overview로 이동
  useEffect(() => {
    if (isInstructor && activeTab === 'scoring') {
      setActiveTab('overview');
    }
  }, [isInstructor, activeTab]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSampleStudent = (): StudentProfileType => {
      return {
        id: studentId,
        name: '김교육',
        email: 'kim.education@company.com',
        phone: '010-1234-5678',
        department: '영업1팀',
        position: '사원',
        joinDate: '2024-03-15',
        employeeId: 'EMP2024001',
        avatar: undefined,
        
        enrollmentHistory: [
          {
            id: 'enroll-1',
            studentId: studentId,
            courseCode: 'BS-2025-01',
            courseName: 'BS 신입 영업사원 기초과정',
            session: 1,
            enrollmentDate: '2025-01-15',
            completionDate: undefined,
            status: 'enrolled',
            attendance: 8,
            totalSessions: 40,
            attendanceRate: 95,
            examScores: [
              {
                examId: 'exam-1',
                examName: '중간평가',
                examType: 'midterm',
                score: 85,
                maxScore: 100,
                percentage: 85,
                grade: 'B+',
                examDate: '2025-01-25'
              }
            ],
            finalGrade: '',
            gradePoint: 0,
            journalCount: 8,
            presentationCount: 2,
            studyHours: 120,
            instructorFeedback: '학습 의지가 뛰어나고 적극적으로 참여하고 있습니다.',
            satisfactionScore: 4.5,
            certificateIssued: false,
            createdAt: '2025-01-15T09:00:00Z',
            updatedAt: '2025-01-26T16:30:00Z'
          },
          {
            id: 'enroll-3',
            studentId: studentId,
            courseCode: 'BS-2025-03',
            courseName: 'BS 신입 영업사원 기초과정',
            session: 3,
            enrollmentDate: '2025-03-01',
            completionDate: undefined,
            status: 'enrolled',
            attendance: 0,
            totalSessions: 40,
            attendanceRate: 0,
            examScores: [],
            finalGrade: '',
            gradePoint: 0,
            journalCount: 0,
            presentationCount: 0,
            studyHours: 0,
            instructorFeedback: '3차 과정 신규 등록. 1차 과정 우수 성과로 심화 과정 추천.',
            satisfactionScore: undefined,
            certificateIssued: false,
            createdAt: '2025-03-01T09:00:00Z',
            updatedAt: '2025-03-01T09:00:00Z'
          },
          {
            id: 'enroll-2',
            studentId: studentId,
            courseCode: 'BS-2024-05',
            courseName: 'BS 신입사원 기초교육',
            session: 5,
            enrollmentDate: '2024-11-01',
            completionDate: '2024-12-20',
            status: 'completed',
            attendance: 32,
            totalSessions: 32,
            attendanceRate: 100,
            examScores: [
              {
                examId: 'exam-2',
                examName: '기말평가',
                examType: 'final',
                score: 92,
                maxScore: 100,
                percentage: 92,
                grade: 'A',
                examDate: '2024-12-15'
              }
            ],
            finalGrade: 'A',
            gradePoint: 4.0,
            journalCount: 15,
            presentationCount: 3,
            studyHours: 160,
            studentFeedback: '실무에 바로 적용할 수 있는 유용한 내용이었습니다.',
            satisfactionScore: 5.0,
            certificateIssued: true,
            certificateNumber: 'BS-2024-05-001',
            createdAt: '2024-11-01T09:00:00Z',
            updatedAt: '2024-12-20T17:00:00Z'
          }
        ],
        currentCourses: [],
        completedCourses: [],
        
        overallGrade: 4.2,
        attendanceRate: 97.5,
        satisfactionScore: 4.7,
        completionRate: 100,
        
        totalJournals: 23,
        totalPresentations: 5,
        totalStudyHours: 280,
        
        createdAt: '2024-03-15T09:00:00Z',
        updatedAt: '2025-01-26T16:30:00Z',
        lastActiveAt: '2025-01-26T16:30:00Z'
      };
    };

    setLoading(true);
    setTimeout(() => {
      const studentData = generateSampleStudent();
      // 현재/완료 과정 분리
      studentData.currentCourses = studentData.enrollmentHistory.filter(e => e.status === 'enrolled');
      studentData.completedCourses = studentData.enrollmentHistory.filter(e => e.status === 'completed');
      
      setStudent(studentData);
      setLoading(false);
    }, 800);
  }, [studentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'dropped': return 'text-red-600 bg-red-100';
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enrolled': return '수강중';
      case 'completed': return '수료';
      case 'dropped': return '중도포기';
      case 'waiting': return '대기중';
      case 'suspended': return '일시정지';
      default: return '알 수 없음';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    if (grade.startsWith('D')) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">교육생 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center p-8">
        <ExclamationCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">교육생을 찾을 수 없습니다</h3>
        <p className="text-gray-600">요청하신 교육생 정보가 존재하지 않습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180 mr-2" />
          교육생 목록으로 돌아가기
        </button>
      )}

      {/* 교육생 기본 정보 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{student.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium mr-2">소속:</span>
                  <span>{student.department} ({student.position})</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">사번:</span>
                  <span>{student.employeeId}</span>
                </div>
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span>{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <span>{student.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  <span>입사일: {formatDate(student.joinDate)}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>최근 활동: {formatDate(student.lastActiveAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 성과 지표 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 성적</p>
              <p className="text-2xl font-bold text-gray-900">{student.overallGrade.toFixed(1)}/5.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">출석률</p>
              <p className="text-2xl font-bold text-gray-900">{student.attendanceRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">만족도</p>
              <p className="text-2xl font-bold text-gray-900">{student.satisfactionScore.toFixed(1)}/5.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">수료율</p>
              <p className="text-2xl font-bold text-gray-900">{student.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: '종합 현황', icon: TrophyIcon },
              { id: 'courses', label: '수강 이력', icon: AcademicCapIcon },
              { id: 'performance', label: '성과 분석', icon: DocumentTextIcon },
              ...(isInstructor ? [] : [{ id: 'scoring', label: '상세 점수', icon: ChartBarIcon }])
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } flex items-center py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* 종합 현황 탭 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 현재 수강 과정 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">현재 수강 과정</h3>
                {student.currentCourses.length > 0 ? (
                  <div className="space-y-3">
                    {student.currentCourses.map((course) => (
                      <div key={course.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-blue-600">{course.courseCode}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(course.status)}`}>
                                {getStatusLabel(course.status)}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              출석: {course.attendance}/{course.totalSessions}회 ({course.attendanceRate}%)
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">진도율</div>
                            <div className="text-lg font-bold text-blue-600">
                              {Math.round((course.attendance / course.totalSessions) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">현재 수강 중인 과정이 없습니다.</p>
                )}
              </div>

              {/* 학습 활동 요약 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">학습 활동 요약</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <DocumentTextIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{student.totalJournals}</div>
                    <div className="text-sm text-gray-600">작성한 활동일지</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <PresentationChartBarIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{student.totalPresentations}</div>
                    <div className="text-sm text-gray-600">발표 횟수</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <ClockIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{student.totalStudyHours}</div>
                    <div className="text-sm text-gray-600">총 학습시간 (시간)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 수강 이력 탭 */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">전체 수강 이력</h3>
              {student.enrollmentHistory.length > 0 ? (
                <div className="space-y-4">
                  {student.enrollmentHistory.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-blue-600">{course.courseCode}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(course.status)}`}>
                              {getStatusLabel(course.status)}
                            </span>
                            {course.certificateIssued && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                                수료증 발급
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{course.courseName}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">수강 기간:</span><br />
                              {formatDate(course.enrollmentDate)}
                              {course.completionDate && ` ~ ${formatDate(course.completionDate)}`}
                            </div>
                            <div>
                              <span className="font-medium">출석:</span><br />
                              {course.attendance}/{course.totalSessions}회 ({course.attendanceRate}%)
                            </div>
                            <div>
                              <span className="font-medium">성적:</span><br />
                              {course.finalGrade ? (
                                <span className={`font-medium ${getGradeColor(course.finalGrade)}`}>
                                  {course.finalGrade} ({course.gradePoint}/4.5)
                                </span>
                              ) : (
                                <span className="text-gray-400">진행중</span>
                              )}
                            </div>
                          </div>

                          {course.examScores.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm font-medium text-gray-700">시험 성적:</span>
                              <div className="mt-1 space-y-1">
                                {course.examScores.map((exam, index) => (
                                  <div key={index} className="text-sm text-gray-600">
                                    {exam.examName}: {exam.score}/{exam.maxScore}점 ({exam.grade})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>활동일지: {course.journalCount}개</div>
                            <div>발표: {course.presentationCount}회</div>
                            <div>학습시간: {course.studyHours}시간</div>
                          </div>

                          {(course.instructorFeedback || course.studentFeedback) && (
                            <div className="mt-4 space-y-2">
                              {course.instructorFeedback && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                  <span className="text-sm font-medium text-blue-900">강사 피드백:</span>
                                  <p className="text-sm text-blue-800 mt-1">{course.instructorFeedback}</p>
                                </div>
                              )}
                              {course.studentFeedback && (
                                <div className="bg-green-50 border border-green-200 rounded p-3">
                                  <span className="text-sm font-medium text-green-900">학습자 피드백:</span>
                                  <p className="text-sm text-green-800 mt-1">{course.studentFeedback}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">수강 이력이 없습니다.</p>
              )}
            </div>
          )}

          {/* 성과 분석 탭 */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">학습 성과 분석</h3>
              
              {/* 성과 지표 상세 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">성적 분포</h4>
                  <div className="space-y-2">
                    {student.enrollmentHistory
                      .filter(course => course.finalGrade)
                      .map((course, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{course.courseCode}</span>
                        <span className={`text-sm font-medium ${getGradeColor(course.finalGrade)}`}>
                          {course.finalGrade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">출석 현황</h4>
                  <div className="space-y-2">
                    {student.enrollmentHistory.map((course, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{course.courseCode}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {course.attendanceRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 학습 패턴 분석 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">학습 패턴</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">평균 일지 작성:</span>
                    <div className="font-medium text-gray-900">
                      {student.enrollmentHistory.length > 0 
                        ? Math.round(student.totalJournals / student.enrollmentHistory.length)
                        : 0
                      }개/과정
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">평균 발표 횟수:</span>
                    <div className="font-medium text-gray-900">
                      {student.enrollmentHistory.length > 0 
                        ? Math.round(student.totalPresentations / student.enrollmentHistory.length)
                        : 0
                      }회/과정
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">평균 학습시간:</span>
                    <div className="font-medium text-gray-900">
                      {student.enrollmentHistory.length > 0 
                        ? Math.round(student.totalStudyHours / student.enrollmentHistory.length)
                        : 0
                      }시간/과정
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 상세 점수 탭 (강사 제외) */}
          {activeTab === 'scoring' && !isInstructor && (
            <StudentScoring 
              studentId={studentId}
              onBack={() => setActiveTab('overview')}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;