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
  EyeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import type { Course, CourseStatus, CourseOverview } from '../../types/schedule.types';
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
      planning: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
      confirmed: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      ongoing: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
    };
    return `${styles[status]} border`;
  };

  // Firebase 플래너로 이동
  const openFirebasePlanner = () => {
    window.open('https://studio--eduscheduler-nrx9o.us-central1.hosted.app/curriculum', '_blank');
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">과정 정보를 불러오는 중...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        {/* 헤더 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <PageHeader
            title="과정 관리"
            description="교육 과정을 모니터링하고 일정을 관리합니다."
            badge="Course Management"
          />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openFirebasePlanner}
              className="btn-outline flex items-center"
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

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">전체 과정</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 w-fit">
              <ChartBarIcon className="w-3 h-3 mr-1" />
              전체 운영 현황
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">진행 중</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courses.filter(c => c.status === 'ongoing').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <ClockIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 w-fit">
              현재 운영중인 과정
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">총 교육생</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courses.reduce((sum, course) => sum + course.current_enrollment, 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 w-fit">
              전체 수강생 수
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">수료 과정</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courses.filter(c => c.status === 'completed').length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <ChartBarIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 w-fit">
              완료된 교육 과정
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="과정명, 설명, 카테고리 검색..."
                className="pl-11 pr-4 py-3 w-full border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              {/* 상태 필터 */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CourseStatus | 'all')}
                  className="pl-4 pr-10 py-3 w-44 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all font-medium"
                >
                  <option value="all">모든 상태</option>
                  {(Object.keys(courseStatusLabels) as CourseStatus[]).map(status => (
                    <option key={status} value={status}>{courseStatusLabels[status]}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* 결과 카운트 (데스크탑) */}
              <div className="hidden md:flex items-center px-6 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl">
                <FunnelIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-300 whitespace-nowrap">
                  총 <span className="text-blue-600 dark:text-blue-400 font-bold ml-0.5">{filteredCourses.length}</span>개
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 과정 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    과정 정보
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    기간 / 시간
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    등록 현황
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-5">
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{course.name}</div>
                        <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1 inline-block bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                          {course.category}
                        </div>
                        {course.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs font-medium">
                            {course.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(course.start_date).toLocaleDateString('ko-KR')} ~ {' '}
                        {new Date(course.end_date).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1 font-medium">
                        <ClockIcon className="h-3.5 w-3.5 mr-1" />
                        {course.duration_hours}시간
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {course.current_enrollment} / {course.max_capacity}명
                        </div>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                          {Math.round((course.current_enrollment / course.max_capacity) * 100)}%
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${(course.current_enrollment / course.max_capacity) >= 1
                              ? 'bg-red-500'
                              : (course.current_enrollment / course.max_capacity) >= 0.8
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}
                          style={{
                            width: `${Math.min((course.current_enrollment / course.max_capacity) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg ${getStatusBadgeStyle(course.status)}`}>
                        {courseStatusLabels[course.status]}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewCourse(course)}
                        className="btn-outline py-1.5 px-3 h-auto text-xs flex items-center gap-1.5"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-800">
              <div className="bg-gray-50 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="h-10 w-10 text-gray-300 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">과정이 없습니다</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                새 과정을 추가하거나 Firebase 플래너에서 동기화해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default CourseManagement;