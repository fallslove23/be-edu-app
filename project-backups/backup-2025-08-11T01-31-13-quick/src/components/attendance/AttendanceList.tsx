import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { CourseService } from '../../services/course.services';
import type { Course, CourseSchedule } from '../../services/course.services';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AttendanceListProps {
  selectedCourse: Course | null;
  onCourseSelect: (course: Course) => void;
  onScheduleSelect: (schedule: CourseSchedule) => void;
}

const AttendanceList: React.FC<AttendanceListProps> = ({
  selectedCourse,
  onCourseSelect,
  onScheduleSelect
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<CourseSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 과정 목록 로드
  useEffect(() => {
    loadCourses();
  }, []);

  // 선택된 과정의 일정 로드
  useEffect(() => {
    if (selectedCourse) {
      loadSchedules(selectedCourse.id);
    } else {
      setSchedules([]);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await CourseService.getCourses({ status: 'active' });
      setCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setError('과정 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (courseId: string) => {
    try {
      setLoading(true);
      // 임시 목업 데이터 (실제로는 CourseService에서 가져올 예정)
      const mockSchedules: CourseSchedule[] = [
        {
          id: '1',
          course_id: courseId,
          course_name: selectedCourse?.name || '',
          title: '오리엔테이션',
          description: '과정 소개 및 목표 설정',
          scheduled_date: '2024-08-15',
          start_time: '09:00',
          end_time: '12:00',
          location: '대회의실',
          instructor_id: selectedCourse?.instructor_id,
          instructor_name: selectedCourse?.instructor_name,
          status: 'scheduled',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          course_id: courseId,
          course_name: selectedCourse?.name || '',
          title: '영업 프로세스 이해',
          description: '영업의 기본 프로세스와 단계별 접근법',
          scheduled_date: '2024-08-16',
          start_time: '09:00',
          end_time: '17:00',
          location: '교육실 A',
          instructor_id: selectedCourse?.instructor_id,
          instructor_name: selectedCourse?.instructor_name,
          status: 'completed',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          course_id: courseId,
          course_name: selectedCourse?.name || '',
          title: '고객 커뮤니케이션 스킬',
          description: '효과적인 고객 소통 방법과 실습',
          scheduled_date: '2024-08-17',
          start_time: '13:00',
          end_time: '18:00',
          location: '교육실 B',
          instructor_id: selectedCourse?.instructor_id,
          instructor_name: selectedCourse?.instructor_name,
          status: 'in_progress',
          created_at: new Date().toISOString()
        }
      ];
      
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      setError('일정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 일정 상태별 색상 클래스
  const getScheduleStatusClass = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'scheduled':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // 일정 상태 레이블
  const getScheduleStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '예정';
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy년 MM월 dd일 (E)', { locale: ko });
    } catch {
      return dateString;
    }
  };

  // 시간 포맷팅
  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 과정 선택 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">과정 선택</h2>
          <p className="mt-1 text-sm text-gray-600">출석을 관리할 과정을 선택하세요.</p>
        </div>
        <div className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              진행 중인 과정이 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => onCourseSelect(course)}
                  className={`p-4 text-left rounded-lg border-2 transition-colors ${
                    selectedCourse?.id === course.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-2">{course.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {course.instructor_name || '강사 미배정'}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <UserGroupIcon className="h-3 w-3 mr-1" />
                          {course.current_trainees}/{course.max_trainees}명
                        </span>
                        <span className="flex items-center">
                          <CalendarDaysIcon className="h-3 w-3 mr-1" />
                          {format(parseISO(course.start_date), 'MM/dd', { locale: ko })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 일정 목록 */}
      {selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedCourse.name} - 일정 목록
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              출석을 체크할 일정을 선택하세요.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 일정이 없습니다.
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onScheduleSelect(schedule)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {schedule.title}
                        </h3>
                        <span className={getScheduleStatusClass(schedule.status)}>
                          {getScheduleStatusLabel(schedule.status)}
                        </span>
                      </div>
                      
                      {schedule.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {schedule.description}
                        </p>
                      )}
                      
                      <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {formatDate(schedule.scheduled_date)}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </span>
                        {schedule.location && (
                          <span className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {schedule.location}
                          </span>
                        )}
                        {schedule.instructor_name && (
                          <span className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {schedule.instructor_name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleSelect(schedule);
                        }}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        출석 체크
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => {
                setError(null);
                if (selectedCourse) {
                  loadSchedules(selectedCourse.id);
                } else {
                  loadCourses();
                }
              }}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceList;