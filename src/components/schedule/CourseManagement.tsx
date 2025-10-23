import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  LinkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import type { Course, CourseStatus, CourseFilters, CourseOverview } from '../../types/schedule.types';
import { courseStatusLabels } from '../../types/schedule.types';
import { FirebasePlannerService } from '../../services/firebase-planner.service';
import toast from 'react-hot-toast';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseOverview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showPlannerSync, setShowPlannerSync] = useState(false);

  // 과정 데이터 로드
  useEffect(() => {
    loadCourses();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = courses;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, statusFilter]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      
      // 목업 데이터 (실제로는 Supabase에서 가져올 예정)
      const mockCourses: Course[] = [
        {
          id: 'course-001',
          name: '25-7차 BS Basic 과정',
          description: 'BS Basic 교육 과정입니다.',
          category: 'BS Basic',
          duration_hours: 24,
          max_capacity: 20,
          current_enrollment: 15,
          start_date: '2025-09-03',
          end_date: '2025-09-05',
          status: 'ongoing',
          instructor_ids: ['instructor1', 'instructor2'],
          trainee_ids: ['trainee1', 'trainee2', 'trainee3'],
          classroom: '강의실 1',
          materials: [],
          created_at: '2025-08-01T09:00:00Z',
          updated_at: '2025-09-02T14:30:00Z'
        },
        {
          id: 'course-002',
          name: 'PC 기초 과정',
          description: 'PC 기초 사용법을 배우는 과정입니다.',
          category: 'PC 기초',
          duration_hours: 16,
          max_capacity: 15,
          current_enrollment: 12,
          start_date: '2025-09-10',
          end_date: '2025-09-12',
          status: 'confirmed',
          instructor_ids: ['instructor3'],
          trainee_ids: ['trainee4', 'trainee5'],
          classroom: '강의실 2',
          materials: [],
          created_at: '2025-08-15T10:00:00Z',
          updated_at: '2025-08-20T16:00:00Z'
        }
      ];

      setCourses(mockCourses);
      setFilteredCourses(mockCourses);
      
    } catch (error) {
      console.error('과정 데이터 로드 중 오류:', error);
      toast.error('과정 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase 플래너에서 과정 가져오기
  const handleSyncFromPlanner = async () => {
    try {
      setIsLoading(true);
      toast.loading('Firebase 플래너에서 과정 정보를 가져오는 중...');
      
      const plannerCourses = await FirebasePlannerService.getCoursesFromPlanner();
      const convertedCourses = plannerCourses.map(course => 
        FirebasePlannerService.convertFirebaseCoursetoBSCourse(course)
      );

      // 기존 과정과 병합 (중복 제거)
      const mergedCourses = [...courses];
      convertedCourses.forEach(newCourse => {
        const existingIndex = mergedCourses.findIndex(existing => existing.id === newCourse.id);
        if (existingIndex >= 0) {
          mergedCourses[existingIndex] = newCourse; // 업데이트
        } else {
          mergedCourses.push(newCourse); // 새로 추가
        }
      });

      setCourses(mergedCourses);
      toast.dismiss();
      toast.success(`${convertedCourses.length}개의 과정을 Firebase 플래너에서 가져왔습니다.`);
      
    } catch (error) {
      console.error('Firebase 플래너 동기화 중 오류:', error);
      toast.dismiss();
      toast.error('Firebase 플래너 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 과정 상세보기
  const handleViewCourse = (course: Course) => {
    // 목업 상세 정보
    const courseOverview: CourseOverview = {
      course,
      schedules: [],
      instructors: [],
      enrolled_trainees: [],
      conflicts: [],
      progress_summary: {
        total_hours: course.duration_hours,
        completed_hours: 0,
        upcoming_sessions: 5,
        completion_rate: 0
      }
    };
    
    setSelectedCourse(courseOverview);
  };

  // 과정 상태에 따른 스타일
  const getStatusBadgeStyle = (status: CourseStatus) => {
    const styles = {
      planning: 'bg-muted text-muted-foreground border border-border',
      confirmed: 'bg-accent text-accent-foreground border border-border',
      ongoing: 'bg-primary text-primary-foreground border border-border',
      completed: 'bg-secondary text-secondary-foreground border border-border',
      cancelled: 'bg-destructive text-destructive-foreground border border-border'
    };
    return styles[status];
  };

  // Firebase 플래너로 이동
  const openFirebasePlanner = () => {
    window.open('https://studio--eduscheduler-nrx9o.us-central1.hosted.app/curriculum', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium">과정 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">과정 관리</h1>
            <p className="text-muted-foreground">교육 과정을 관리하고 스케줄을 추적합니다.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openFirebasePlanner}
              className="btn-secondary flex items-center"
            >
              <LinkIcon className="h-5 w-5 mr-2" />
              플래너 열기
            </button>
            <button
              onClick={handleSyncFromPlanner}
              className="btn-secondary flex items-center"
              disabled={isLoading}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              플래너 동기화
            </button>
            <button className="btn-primary flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              새 과정 추가
            </button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">전체 과정</p>
              <p className="text-2xl font-bold text-card-foreground">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-accent mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">진행 중</p>
              <p className="text-2xl font-bold text-card-foreground">
                {courses.filter(c => c.status === 'ongoing').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-secondary mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">총 교육생</p>
              <p className="text-2xl font-bold text-card-foreground">
                {courses.reduce((sum, course) => sum + course.current_enrollment, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-muted mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">수료 과정</p>
              <p className="text-2xl font-bold text-card-foreground">
                {courses.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* 검색 입력 */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="과정명, 설명, 카테고리 검색..."
            className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 상태 필터 - 깔끔한 드롭다운 */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CourseStatus | 'all')}
            className="pl-4 pr-10 py-2.5 min-w-[160px] border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all shadow-sm font-medium hover:bg-accent/5"
          >
            <option value="all">모든 상태</option>
            {(Object.keys(courseStatusLabels) as CourseStatus[]).map(status => (
              <option key={status} value={status}>{courseStatusLabels[status]}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4 4 4-4" />
            </svg>
          </div>
        </div>

        {/* 결과 카운트 */}
        <div className="flex items-center px-4 py-2.5 bg-secondary/30 rounded-lg border border-border">
          <FunnelIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            총 <span className="text-primary font-semibold">{filteredCourses.length}</span>개 과정
          </span>
        </div>
      </div>

      {/* 과정 목록 */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  과정 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  기간 / 시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  등록 현황
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-accent/10">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-card-foreground">{course.name}</div>
                      <div className="text-sm text-muted-foreground">{course.category}</div>
                      {course.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {course.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-card-foreground">
                      {new Date(course.start_date).toLocaleDateString('ko-KR')} ~ {' '}
                      {new Date(course.end_date).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {course.duration_hours}시간
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-card-foreground">
                      {course.current_enrollment} / {course.max_capacity}명
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min((course.current_enrollment / course.max_capacity) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeStyle(course.status)}`}>
                      {courseStatusLabels[course.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewCourse(course)}
                      className="btn-ghost flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">과정이 없습니다</h3>
            <p className="mt-1 text-sm text-muted-foreground">새 과정을 추가하거나 Firebase 플래너에서 동기화해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;