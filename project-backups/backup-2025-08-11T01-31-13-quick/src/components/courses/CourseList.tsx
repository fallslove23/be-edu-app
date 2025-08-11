import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { CourseService, courseStatusLabels } from '../../services/course.services';
import type { Course, CourseStatus } from '../../services/course.services';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CourseListProps {
  onCreateCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
  onManageTrainees?: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onManageTrainees
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // 과정 목록 불러오기
  const loadCourses = async () => {
    try {
      console.log('[CourseList] Loading courses with filter:', statusFilter);
      setLoading(true);
      setError(null);
      
      const filter = statusFilter === 'all' ? {} : { status: statusFilter };
      console.log('[CourseList] Calling CourseService.getCourses with:', filter);
      
      const data = await CourseService.getCourses(filter);
      console.log('[CourseList] Received courses:', data);
      
      setCourses(data);
      console.log('[CourseList] Courses state updated');
    } catch (error) {
      console.error('[CourseList] Failed to load courses:', error);
      setError(`과정 목록을 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
      console.log('[CourseList] Loading completed');
    }
  };

  useEffect(() => {
    loadCourses();
  }, [statusFilter]);

  // 검색 및 필터링된 과정 목록
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 디버깅용 로그 (간단한 버전)
  if (courses.length === 0 && !loading) {
    console.log('[CourseList] No courses found - loading:', loading, 'error:', error);
  } else {
    console.log('[CourseList] Courses loaded:', courses.length, 'filtered:', filteredCourses.length);
  }

  // 상태별 색상 클래스
  const getStatusBadgeClass = (status: CourseStatus) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy.MM.dd', { locale: ko });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">과정 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">과정 관리</h1>
            <p className="text-gray-600">교육 과정을 생성하고 관리합니다.</p>
          </div>
          <button
            onClick={onCreateCourse}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 과정 생성
          </button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="과정명, 설명, 강사로 검색..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => setStatusFilter(e.target.value as CourseStatus | 'all')}
          >
            <option value="all">전체 상태</option>
            <option value="draft">준비중</option>
            <option value="active">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={loadCourses}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 과정 목록 */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 과정이 없습니다.'}
          </div>
          {!searchTerm && (
            <button
              onClick={onCreateCourse}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              첫 과정 생성하기
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* 과정명 및 상태 */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.name}
                  </h3>
                  <span className={getStatusBadgeClass(course.status)}>
                    {courseStatusLabels[course.status]}
                  </span>
                </div>

                {/* 설명 */}
                {course.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>
                )}

                {/* 기간 */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {formatDate(course.start_date)} ~ {formatDate(course.end_date)}
                  </span>
                </div>

                {/* 수강 인원 */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {course.current_trainees}/{course.max_trainees}명
                  </span>
                </div>

                {/* 강사 정보 */}
                {course.instructor_name && (
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-medium">강사:</span> {course.instructor_name}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                  {onManageTrainees && (
                    <button
                      onClick={() => onManageTrainees(course)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="수강생 관리"
                    >
                      <UserGroupIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEditCourse(course)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="수정"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCourse(course)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="삭제"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 요약 정보 */}
      {filteredCourses.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            총 <span className="font-medium">{filteredCourses.length}</span>개 과정
            {searchTerm && (
              <span> (전체 {courses.length}개 중)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;