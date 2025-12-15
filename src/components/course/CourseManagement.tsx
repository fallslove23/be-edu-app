import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer } from '../common/PageContainer';
import type { Course, CourseStatus, CourseFilters } from '../../types/course.types';
import CourseForm from './CourseForm';

interface ExtendedCourse extends Course {
  // BS 과정 관리를 위한 확장 필드
  courseCode: string;
  courseType: 'basic' | 'intermediate' | 'advanced' | 'expert';
  category: 'sales' | 'marketing' | 'management' | 'technical' | 'soft-skills';
  totalSessions: number;
  sessionDuration: number;
  registrationStartDate: string;
  registrationEndDate: string;
  currentEnrollment: number;
  completionRate: number;
  averageRating: number;
}

const CourseManagement: React.FC = () => {
  const { user } = useAuth();
  console.log('CourseManagement - 현재 사용자:', user);
  console.log('CourseManagement - 사용자 역할:', user?.role);
  
  const isAdmin = user?.role === 'admin';
  const isManager = ['admin', 'manager'].includes(user?.role || '');
  const isInstructor = user?.role === 'instructor';
  
  console.log('CourseManagement - isAdmin:', isAdmin);
  console.log('CourseManagement - isManager:', isManager);
  console.log('CourseManagement - isInstructor:', isInstructor);

  const [courses, setCourses] = useState<ExtendedCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<ExtendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CourseFilters>({});
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  
  console.log('CourseManagement - currentView:', currentView);
  const [selectedCourse, setSelectedCourse] = useState<ExtendedCourse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // 샘플 데이터 생성
  useEffect(() => {
    const generateSampleData = (): ExtendedCourse[] => {
      return [
        {
          id: 'course-1',
          name: 'BS 신입 영업사원 기초과정',
          courseCode: 'BS-2025-01',
          courseType: 'basic',
          category: 'sales',
          description: '신입 영업사원을 위한 기초 영업 스킬 및 고객 응대 교육과정입니다.',
          instructor_id: 'instructor-1',
          instructor_name: '김강사',
          manager_id: 'manager-1',
          manager_name: '박매니저',
          start_date: '2025-02-01',
          end_date: '2025-02-28',
          registrationStartDate: '2025-01-15',
          registrationEndDate: '2025-01-31',
          max_trainees: 30,
          current_trainees: 25,
          currentEnrollment: 25,
          totalSessions: 20,
          sessionDuration: 180, // 3시간
          status: 'active' as CourseStatus,
          completionRate: 0,
          averageRating: 0,
          created_at: '2025-01-10T09:00:00Z',
          updated_at: '2025-01-26T14:30:00Z'
        },
        {
          id: 'course-2',
          name: 'BS 고급 영업 전략과정',
          courseCode: 'BS-2025-02',
          courseType: 'advanced',
          category: 'sales',
          description: '경력 영업사원을 위한 고급 영업 전략 및 협상 기법 교육과정입니다.',
          instructor_id: 'instructor-2',
          instructor_name: '이강사',
          manager_id: 'manager-1',
          manager_name: '박매니저',
          start_date: '2025-03-01',
          end_date: '2025-03-31',
          registrationStartDate: '2025-02-01',
          registrationEndDate: '2025-02-28',
          max_trainees: 20,
          current_trainees: 18,
          currentEnrollment: 18,
          totalSessions: 16,
          sessionDuration: 240, // 4시간
          status: 'draft' as CourseStatus,
          completionRate: 0,
          averageRating: 0,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-25T16:00:00Z'
        },
        {
          id: 'course-3',
          name: 'BS 리더십 개발과정',
          courseCode: 'BS-2025-03',
          courseType: 'intermediate',
          category: 'management',
          description: '팀장급 이상을 위한 리더십 역량 개발 및 팀 관리 교육과정입니다.',
          instructor_id: 'instructor-3',
          instructor_name: '최강사',
          manager_id: 'manager-2',
          manager_name: '정매니저',
          start_date: '2024-12-01',
          end_date: '2024-12-31',
          registrationStartDate: '2024-11-01',
          registrationEndDate: '2024-11-30',
          max_trainees: 15,
          current_trainees: 15,
          currentEnrollment: 15,
          totalSessions: 12,
          sessionDuration: 300, // 5시간
          status: 'completed' as CourseStatus,
          completionRate: 93.3,
          averageRating: 4.7,
          created_at: '2024-10-15T09:00:00Z',
          updated_at: '2024-12-31T17:00:00Z'
        }
      ];
    };

    setLoading(true);
    setTimeout(() => {
      const sampleCourses = generateSampleData();
      setCourses(sampleCourses);
      setFilteredCourses(sampleCourses);
      setLoading(false);
    }, 800);
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = courses;

    // 텍스트 검색
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(course => filters.status!.includes(course.status));
    }

    // 카테고리 필터
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(course => filters.category!.includes(course.category));
    }

    // 과정 유형 필터
    if (filters.courseType && filters.courseType.length > 0) {
      filtered = filtered.filter(course => filters.courseType!.includes(course.courseType));
    }

    // 강사 필터
    if (filters.instructorId) {
      filtered = filtered.filter(course => course.instructor_id === filters.instructorId);
    }

    setFilteredCourses(filtered);
  }, [courses, searchQuery, filters]);

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-green-500/10 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: CourseStatus) => {
    switch (status) {
      case 'draft': return '준비중';
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'sales': return '영업';
      case 'marketing': return '마케팅';
      case 'management': return '관리';
      case 'technical': return '기술';
      case 'soft-skills': return '소프트스킬';
      default: return category;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return '기초';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      case 'expert': return '전문가';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  // 과정 저장 핸들러
  const handleSaveCourse = async (courseData: any) => {
    try {
      if (currentView === 'edit' && selectedCourse) {
        // 기존 과정 수정
        const updatedCourse: ExtendedCourse = {
          ...selectedCourse,
          ...courseData,
          updated_at: new Date().toISOString()
        };
        
        setCourses(prev => prev.map(c => 
          c.id === selectedCourse.id ? updatedCourse : c
        ));
        
        alert('과정이 성공적으로 수정되었습니다.');
      } else {
        // 새 과정 추가
        const newCourse: ExtendedCourse = {
          id: `course-${Date.now()}`,
          ...courseData,
          current_trainees: 0,
          currentEnrollment: 0,
          status: 'draft' as CourseStatus,
          completionRate: 0,
          averageRating: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCourses(prev => [newCourse, ...prev]);
        alert('새 과정이 성공적으로 개설되었습니다.');
      }
      
      setCurrentView('list');
      setSelectedCourse(null);
    } catch (error) {
      console.error('과정 저장 실패:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">과정 정보를 불러오는 중...</span>
      </div>
    );
  }

  // 현재 뷰에 따른 렌더링
  if (currentView === 'create') {
    return (
      <CourseForm
        onSave={handleSaveCourse}
        onCancel={() => setCurrentView('list')}
        isEditing={false}
      />
    );
  }

  if (currentView === 'edit' && selectedCourse) {
    return (
      <CourseForm
        course={selectedCourse}
        onSave={handleSaveCourse}
        onCancel={() => {
          setCurrentView('list');
          setSelectedCourse(null);
        }}
        isEditing={true}
      />
    );
  }

  if (currentView === 'details' && selectedCourse) {
    return (
      <PageContainer>
        {/* 상세 정보 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setCurrentView('list');
                  setSelectedCourse(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-medium text-blue-600">{selectedCourse.courseCode}</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedCourse.status)}`}>
                    {getStatusLabel(selectedCourse.status)}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h1>
              </div>
            </div>

            {isManager && (
              <button
                onClick={() => setCurrentView('edit')}
                className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>편집</span>
              </button>
            )}
          </div>
        </div>

        {/* 상세 정보 본문 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 - 주요 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">과정 설명</label>
                  <p className="mt-1 text-gray-900">{selectedCourse.description || '설명이 없습니다.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">분야</label>
                    <p className="mt-1 text-gray-900">{getCategoryLabel(selectedCourse.category)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">난이도</label>
                    <p className="mt-1 text-gray-900">{getTypeLabel(selectedCourse.courseType)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 일정 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                일정 정보
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">교육 기간</label>
                    <p className="mt-1 text-gray-900">
                      {formatDate(selectedCourse.start_date)} ~ {formatDate(selectedCourse.end_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">모집 기간</label>
                    <p className="mt-1 text-gray-900">
                      {formatDate(selectedCourse.registrationStartDate)} ~ {formatDate(selectedCourse.registrationEndDate)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">총 회차</label>
                    <p className="mt-1 text-gray-900">{selectedCourse.totalSessions}회</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">회당 시간</label>
                    <p className="mt-1 text-gray-900">{formatDuration(selectedCourse.sessionDuration)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 교육생 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                교육생 정보
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">등록 현황</span>
                    <span className="font-medium text-gray-900">
                      {selectedCourse.currentEnrollment}/{selectedCourse.max_trainees}명 ({Math.round((selectedCourse.currentEnrollment / selectedCourse.max_trainees) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${(selectedCourse.currentEnrollment / selectedCourse.max_trainees) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {selectedCourse.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm text-gray-600">수료율</label>
                      <p className="mt-1 text-2xl font-bold text-green-600">{selectedCourse.completionRate}%</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">평균 평점</label>
                      <p className="mt-1 text-2xl font-bold text-yellow-600">{selectedCourse.averageRating}/5.0</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽 - 담당자 및 부가 정보 */}
          <div className="space-y-6">
            {/* 담당 인력 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">담당 인력</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">강사</label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedCourse.instructor_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">매니저</label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedCourse.manager_name}</p>
                </div>
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">메타 정보</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">생성일</span>
                  <span className="text-gray-900">{formatDate(selectedCourse.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">최종 수정</span>
                  <span className="text-gray-900">{formatDate(selectedCourse.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">액션</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center justify-center space-x-2">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>수강생 관리</span>
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center justify-center space-x-2">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>일정 관리</span>
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 flex items-center justify-center space-x-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <span>성과 분석</span>
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 flex items-center justify-center space-x-2">
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span>과정 복제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📚 과정 관리</h1>
            <p className="text-gray-600">
              {isAdmin && 'BS 교육과정을 종합적으로 관리하고 운영하세요.'}
              {isManager && !isAdmin && '담당 교육과정을 관리하고 모니터링하세요.'}
              {isInstructor && '배정된 교육과정을 확인하고 수업을 준비하세요.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 뷰 모드 전환 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                카드
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                테이블
              </button>
            </div>

            {(isManager || !user?.role) && (
              <button
                onClick={() => {
                  console.log('과정 개설 버튼 클릭됨, currentView를 create로 변경');
                  setCurrentView('create');
                }}
                className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>과정 개설</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 과정</p>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <PlayIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">진행중</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter(c => c.status === 'active').length}
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
              <p className="text-sm font-medium text-gray-600">총 수강생</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce((sum, c) => sum + c.currentEnrollment, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 수료율</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length > 0 
                  ? Math.round(courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length)
                  : 0
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="과정명, 과정코드, 강사명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status?.[0] || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              status: e.target.value ? [e.target.value as CourseStatus] : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 상태</option>
            <option value="draft">준비중</option>
            <option value="active">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>

          <select
            value={filters.category?.[0] || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              category: e.target.value ? [e.target.value] : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 분야</option>
            <option value="sales">영업</option>
            <option value="marketing">마케팅</option>
            <option value="management">관리</option>
            <option value="technical">기술</option>
            <option value="soft-skills">소프트스킬</option>
          </select>
        </div>
      </div>

      {/* 과정 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            과정 목록 ({filteredCourses.length})
          </h3>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">과정이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || Object.keys(filters).some(key => filters[key as keyof CourseFilters])
                ? '검색 조건에 맞는 과정이 없습니다.'
                : '등록된 과정이 없습니다.'
              }
            </p>
            {isManager && (
              <button
                onClick={() => setCurrentView('create')}
                className="btn-primary px-4 py-2 rounded-full"
              >
                첫 과정 개설하기
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // 카드 뷰
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-blue-600">{course.courseCode}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(course.status)}`}>
                          {getStatusLabel(course.status)}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{course.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>분야:</span>
                      <span className="font-medium">{getCategoryLabel(course.category)} ({getTypeLabel(course.courseType)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>기간:</span>
                      <span className="font-medium">{formatDate(course.start_date)} ~ {formatDate(course.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>수강생:</span>
                      <span className="font-medium">{course.currentEnrollment}/{course.max_trainees}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span>강사:</span>
                      <span className="font-medium">{course.instructor_name}</span>
                    </div>
                  </div>

                  {/* 진도 바 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>등록률</span>
                      <span>{Math.round((course.currentEnrollment / course.max_trainees) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-lg h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-lg"
                        style={{ width: `${(course.currentEnrollment / course.max_trainees) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setCurrentView('details');
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="상세보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {isManager && (
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setCurrentView('edit');
                          }}
                          className="p-1 text-green-600 hover:bg-green-500/10 rounded"
                          title="편집"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {course.status === 'completed' && course.completionRate > 0 && (
                        <span>수료율 {course.completionRate}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // 테이블 뷰
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    과정 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수강생
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    강사
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">{course.courseCode}</span>
                          <span className="text-xs text-gray-500">
                            {getCategoryLabel(course.category)} · {getTypeLabel(course.courseType)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.totalSessions}회차 · {formatDuration(course.sessionDuration)}/회</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(course.status)}`}>
                        {getStatusLabel(course.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{formatDate(course.start_date)}</div>
                      <div className="text-gray-500">~ {formatDate(course.end_date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {course.currentEnrollment}/{course.max_trainees}명
                      </div>
                      <div className="w-16 bg-gray-200 rounded-lg h-1.5 mt-1">
                        <div
                          className="bg-blue-600 h-1.5 rounded-lg"
                          style={{ width: `${(course.currentEnrollment / course.max_trainees) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {course.instructor_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setCurrentView('details');
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="상세보기"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {isManager && (
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setCurrentView('edit');
                            }}
                            className="p-1 text-green-600 hover:bg-green-500/10 rounded"
                            title="편집"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CourseManagement;