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
  onEnhancedCreateCourse?: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
  onManageTrainees?: (course: Course) => void;
}

const CourseList: React.FC<CourseListProps> = ({
  onCreateCourse,
  onEnhancedCreateCourse,
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

  // 상태별 배지 클래스 반환
  const getStatusBadgeClass = (status: CourseStatus): string => {
    switch (status) {
      case 'active':
        return 'px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground border border-border';
      case 'draft':
        return 'px-2.5 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground border border-border';
      case 'completed':
        return 'px-2.5 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground border border-border';
      case 'cancelled':
        return 'px-2.5 py-1 text-xs font-medium rounded-md bg-destructive text-destructive-foreground border border-border';
      default:
        return 'px-2.5 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground border border-border';
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
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">과정 목록을 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">과정 관리</h1>
              <p className="text-muted-foreground">교육 과정을 생성하고 관리합니다.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onCreateCourse}
                className="btn-secondary flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>간단 생성</span>
              </button>
              {onEnhancedCreateCourse && (
                <button
                  onClick={onEnhancedCreateCourse}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CalendarIcon className="h-5 w-5" />
                  <span>상세 시간표 생성</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="과정명, 설명, 강사로 검색..."
                className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
              />
            </div>

            {/* 상태 필터 */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CourseStatus | 'all')}
                className="pl-4 pr-10 py-2.5 min-w-[160px] border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all shadow-sm font-medium hover:bg-accent/5"
              >
                <option value="all">전체 상태</option>
                <option value="draft">준비중</option>
                <option value="active">진행중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4 4 4-4" />
                </svg>
              </div>
            </div>

            {/* 결과 카운트 */}
            <div className="flex items-center px-4 py-2.5 bg-secondary/30 rounded-full border border-border">
              <FunnelIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                총 <span className="text-primary font-semibold">{filteredCourses.length}</span>개 과정
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-full">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadCourses}
              className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground px-3 py-1 text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 과정 목록 */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 과정이 없습니다.'}
          </div>
          {!searchTerm && (
            <button
              onClick={onCreateCourse}
              className="btn-primary flex items-center space-x-2 mt-4 mx-auto"
            >
              <PlusIcon className="h-5 w-5" />
              <span>첫 과정 생성하기</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-lg transition-shadow">
              {/* 과정명 및 상태 */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-card-foreground line-clamp-2">
                  {course.name}
                </h3>
                <span className={getStatusBadgeClass(course.status)}>
                  {courseStatusLabels[course.status]}
                </span>
              </div>

              {/* 설명 */}
              {course.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}

              {/* 기간 */}
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>
                  {formatDate(course.start_date)} ~ {formatDate(course.end_date)}
                </span>
              </div>

              {/* 수강 인원 */}
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                <span>
                  {course.current_trainees}/{course.max_trainees}명
                </span>
              </div>

              {/* 강사 정보 */}
              {course.instructor_name && (
                <div className="text-sm text-muted-foreground mb-4">
                  <span className="font-medium">강사:</span> {course.instructor_name}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                {onManageTrainees && (
                  <button
                    onClick={() => onManageTrainees(course)}
                    className="btn-ghost p-2"
                    title="수강생 관리"
                  >
                    <UserGroupIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onEditCourse(course)}
                  className="btn-ghost p-2"
                  title="수정"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteCourse(course)}
                  className="btn-ghost p-2"
                  title="삭제"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 요약 정보 */}
      {filteredCourses.length > 0 && (
        <div className="bg-secondary rounded-lg p-4">
          <div className="text-sm text-secondary-foreground">
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