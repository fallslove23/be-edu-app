import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import CourseForm from '../course/CourseForm';

interface CourseSession {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string; // "BS-2025-01" 형태
  year: number;
  sessionNumber: number; // n차
  status: 'planning' | 'recruiting' | 'ongoing' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  totalSessions: number; // 총 차시
  currentSession: number; // 현재 진행 차시
  maxStudents: number;
  currentStudents: number;
  instructor: {
    id: string;
    name: string;
    phone?: string;
  };
  operator: {
    id: string;
    name: string;
    phone?: string;
  };
  schedule: {
    days: string[]; // ['월', '화', '수']
    startTime: string;
    endTime: string;
    room: string;
  };
  description: string;
  objectives: string[];
  requirements: string[];
  createdAt: string;
  updatedAt: string;
}

const NewCourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<CourseSession[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<number>(2025);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseSession | null>(null);
  const [loading, setLoading] = useState(true);

  // 샘플 데이터 생성
  useEffect(() => {
    const generateSampleCourses = (): CourseSession[] => {
      return [
        {
          id: 'course-1',
          courseId: 'bs-basic',
          courseName: 'BS 신입 영업사원 기초과정',
          courseCode: 'BS-2025-01',
          year: 2025,
          sessionNumber: 1,
          status: 'ongoing',
          startDate: '2025-01-15',
          endDate: '2025-03-15',
          totalSessions: 40,
          currentSession: 8,
          maxStudents: 25,
          currentStudents: 23,
          instructor: {
            id: 'inst-1',
            name: '김강사',
            phone: '010-1234-5678'
          },
          operator: {
            id: 'op-1',
            name: '박운영',
            phone: '010-9876-5432'
          },
          schedule: {
            days: ['월', '화', '수'],
            startTime: '09:00',
            endTime: '12:00',
            room: '교육실 A'
          },
          description: '신입 영업사원을 위한 기초 영업 교육과정입니다.',
          objectives: [
            '영업의 기본 개념 이해',
            '고객 접근 방법론 습득',
            '영업 프로세스 숙지',
            '기본적인 협상 스킬 습득'
          ],
          requirements: [
            '신입사원 대상',
            '영업 관련 경험 무관',
            '교육 참여 의지'
          ],
          createdAt: '2024-12-01',
          updatedAt: '2025-01-10'
        },
        {
          id: 'course-2',
          courseId: 'bs-advanced',
          courseName: 'BS 고급 영업 전략과정',
          courseCode: 'BS-2025-02',
          year: 2025,
          sessionNumber: 2,
          status: 'ongoing',
          startDate: '2025-02-01',
          endDate: '2025-04-30',
          totalSessions: 32,
          currentSession: 15,
          maxStudents: 20,
          currentStudents: 18,
          instructor: {
            id: 'inst-2',
            name: '이전문',
            phone: '010-2468-1357'
          },
          operator: {
            id: 'op-2',
            name: '최관리',
            phone: '010-1357-2468'
          },
          schedule: {
            days: ['화', '목'],
            startTime: '14:00',
            endTime: '17:00',
            room: '교육실 B'
          },
          description: '경험 있는 영업사원을 위한 고급 전략 교육과정입니다.',
          objectives: [
            '고급 영업 전략 수립',
            '대형 거래 협상 기법',
            '영업팀 관리 능력',
            '성과 분석 및 개선'
          ],
          requirements: [
            '영업 경험 2년 이상',
            '기초과정 수료자',
            '팀장급 이상'
          ],
          createdAt: '2024-12-15',
          updatedAt: '2025-01-20'
        },
        {
          id: 'course-3',
          courseId: 'bs-basic',
          courseName: 'BS 신입 영업사원 기초과정',
          courseCode: 'BS-2025-03',
          year: 2025,
          sessionNumber: 3,
          status: 'recruiting',
          startDate: '2025-03-01',
          endDate: '2025-05-01',
          totalSessions: 40,
          currentSession: 0,
          maxStudents: 25,
          currentStudents: 12,
          instructor: {
            id: 'inst-1',
            name: '김강사',
            phone: '010-1234-5678'
          },
          operator: {
            id: 'op-1',
            name: '박운영',
            phone: '010-9876-5432'
          },
          schedule: {
            days: ['월', '수', '금'],
            startTime: '13:00',
            endTime: '16:00',
            room: '교육실 C'
          },
          description: '신입 영업사원을 위한 기초 영업 교육과정입니다.',
          objectives: [
            '영업의 기본 개념 이해',
            '고객 접근 방법론 습득',
            '영업 프로세스 숙지',
            '기본적인 협상 스킬 습득'
          ],
          requirements: [
            '신입사원 대상',
            '영업 관련 경험 무관',
            '교육 참여 의지'
          ],
          createdAt: '2025-01-15',
          updatedAt: '2025-01-25'
        }
      ];
    };

    setLoading(true);
    setTimeout(() => {
      const data = generateSampleCourses();
      setCourses(data);
      setFilteredCourses(data);
      setLoading(false);
    }, 800);
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = courses;

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    // 연도 필터
    filtered = filtered.filter(course => course.year === yearFilter);

    setFilteredCourses(filtered);
  }, [courses, searchQuery, statusFilter, yearFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'text-gray-600 bg-gray-100';
      case 'recruiting': return 'text-blue-600 bg-blue-100';
      case 'ongoing': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return '기획중';
      case 'recruiting': return '모집중';
      case 'ongoing': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  // 과정 저장 핸들러
  const handleSaveCourse = async (courseData: any) => {
    try {
      // 새로운 CourseSession 생성
      const newCourseSession: CourseSession = {
        id: `course-session-${Date.now()}`,
        courseId: `course-${Date.now()}`,
        courseName: courseData.name,
        courseCode: courseData.courseCode,
        year: new Date().getFullYear(),
        sessionNumber: 1, // 첫 번째 차수
        status: 'planning',
        startDate: courseData.start_date,
        endDate: courseData.end_date,
        totalSessions: courseData.totalSessions,
        currentSession: 0,
        maxStudents: courseData.max_trainees,
        currentStudents: 0,
        instructor: {
          id: courseData.instructor_id || 'instructor-temp',
          name: '강사 배정 예정',
          email: ''
        },
        manager: {
          id: courseData.manager_id || 'manager-temp',
          name: '매니저 배정 예정',
          email: ''
        },
        description: courseData.description || '',
        objectives: ['교육 목표를 설정해주세요'],
        requirements: ['수강 요건을 설정해주세요'],
        location: '강의실 미정',
        materials: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 목록에 추가
      setCourses(prev => [newCourseSession, ...prev]);
      
      // 폼 닫기
      setShowCourseForm(false);
      setShowAddModal(false);
      
      alert('새 과정이 성공적으로 추가되었습니다!');
    } catch (error) {
      console.error('과정 저장 실패:', error);
      throw error;
    }
  };

  const duplicateCourse = (course: CourseSession) => {
    const newSessionNumber = Math.max(...courses.map(c => c.sessionNumber)) + 1;
    const newCourse: CourseSession = {
      ...course,
      id: `course-${Date.now()}`,
      courseCode: `BS-${course.year}-${newSessionNumber.toString().padStart(2, '0')}`,
      sessionNumber: newSessionNumber,
      status: 'planning',
      currentSession: 0,
      currentStudents: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    setCourses([...courses, newCourse]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">과정 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 교육 차수 운영 현황</h1>
            <p className="text-gray-600">
              사내 필수 교육과정의 차수별 진행 현황을 모니터링하고 관리하세요.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => alert('과정 템플릿 관리는 CourseTemplateManagement 컴포넌트를 사용하세요.')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span>템플릿 관리</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span>새 차수 개설</span>
            </button>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="과정명, 과정코드, 강사명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 필터 */}
          <div className="flex space-x-4">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={2025}>2025년</option>
              <option value={2024}>2024년</option>
              <option value={2026}>2026년</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="planning">기획중</option>
              <option value="recruiting">모집중</option>
              <option value="ongoing">진행중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>

            <button className="flex items-center space-x-1 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50">
              <FunnelIcon className="h-4 w-4" />
              <span>필터</span>
            </button>
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 과정</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">진행중</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCourses.filter(c => c.status === 'ongoing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 교육생</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCourses.reduce((sum, course) => sum + course.currentStudents, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">모집중</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCourses.filter(c => c.status === 'recruiting').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 과정 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            과정 목록 ({filteredCourses.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 과정 정보 */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-lg font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      {course.courseCode}
                    </span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(course.status)}`}>
                      {getStatusLabel(course.status)}
                    </span>
                  </div>

                  <h4 className="text-xl font-medium text-gray-900 mb-2">
                    {course.courseName}
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    {/* 기간 및 시간 */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">수업 일정</div>
                      <div className="text-sm font-medium text-gray-900">
                        {course.schedule.days.join(', ')} {course.schedule.startTime}-{course.schedule.endTime}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(course.startDate).toLocaleDateString('ko-KR')} ~ {new Date(course.endDate).toLocaleDateString('ko-KR')}
                      </div>
                    </div>

                    {/* 강사 및 운영자 */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">담당자</div>
                      <div className="text-sm font-medium text-gray-900">
                        강사: {course.instructor.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        운영: {course.operator.name}
                      </div>
                    </div>

                    {/* 진도 및 인원 */}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">진행 현황</div>
                      <div className="text-sm font-medium text-gray-900">
                        {course.currentSession}/{course.totalSessions}차시 ({getProgressPercentage(course.currentSession, course.totalSessions)}%)
                      </div>
                      <div className="text-sm text-gray-600">
                        교육생: {course.currentStudents}/{course.maxStudents}명
                      </div>
                    </div>
                  </div>

                  {/* 진행률 바 */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>진행률</span>
                      <span>{getProgressPercentage(course.currentSession, course.totalSessions)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${getProgressPercentage(course.currentSession, course.totalSessions)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateCourse(course);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="과정 복사"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 편집 로직
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    title="편집"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 삭제 로직
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="삭제"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}

          {filteredCourses.length === 0 && (
            <div className="p-12 text-center">
              <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">과정이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? '검색 조건에 맞는 과정이 없습니다.'
                  : '새로운 과정을 추가해보세요.'
                }
              </p>
              {(!searchQuery && statusFilter === 'all') && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary px-4 py-2 rounded-lg"
                >
                  첫 차수 개설하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">과정 상세 정보</h2>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* 상세 정보 표시 */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{selectedCourse.courseName}</h3>
                  <p className="text-gray-600">{selectedCourse.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">학습 목표</h4>
                    <ul className="space-y-1">
                      {selectedCourse.objectives.map((objective, index) => (
                        <li key={index} className="text-sm text-gray-600">• {objective}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">수강 요건</h4>
                    <ul className="space-y-1">
                      {selectedCourse.requirements.map((requirement, index) => (
                        <li key={index} className="text-sm text-gray-600">• {requirement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 과정 추가 확인 모달 */}
      {showAddModal && !showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">새 차수 개설</h3>
            <p className="text-gray-600 mb-6">
              기존 교육과정의 새로운 차수를 개설하시겠습니까?<br/>
              차수별 상세 정보를 입력할 수 있습니다.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowCourseForm(true);
                }}
                className="btn-primary"
              >
                차수 개설하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 과정 추가 폼 */}
      {showCourseForm && (
        <CourseForm
          onSave={handleSaveCourse}
          onCancel={() => {
            setShowCourseForm(false);
            setShowAddModal(false);
          }}
          isEditing={false}
        />
      )}
    </div>
  );
};

export default NewCourseManagement;