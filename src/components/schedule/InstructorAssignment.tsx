import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import type { Course, Schedule, Instructor, ScheduleConflict } from '../../types/schedule.types';
import toast from 'react-hot-toast';
import { Badge } from '../common/Badge';

interface InstructorAssignmentProps {
  course: Course;
  schedules: Schedule[];
  onAssignmentChange: (scheduleId: string, instructorId: string | null) => void;
  onScheduleUpdate: (schedules: Schedule[]) => void;
}

const InstructorAssignment: React.FC<InstructorAssignmentProps> = ({
  course,
  schedules,
  onAssignmentChange,
  onScheduleUpdate
}) => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 강사 목록 로드
  useEffect(() => {
    loadInstructors();
  }, []);

  // 충돌 검사
  useEffect(() => {
    if (schedules.length > 0 && instructors.length > 0) {
      checkConflicts();
    }
  }, [schedules, instructors]);

  const loadInstructors = async () => {
    try {
      setIsLoading(true);

      // 목업 강사 데이터
      const mockInstructors: Instructor[] = [
        {
          id: 'instructor1',
          user_id: 'user1',
          name: '김영업 강사',
          email: 'kim.instructor@company.com',
          phone: '010-1111-1111',
          specializations: ['BS Basic', 'PC 기초', '영업 전략'],
          bio: 'BS Basic 전문 강사로 10년 경력을 가지고 있습니다.',
          education_background: '경영학과 석사',
          years_of_experience: 10,
          is_active: true,
          availability: [],
          created_at: '2024-01-01T09:00:00Z',
          updated_at: '2024-01-01T09:00:00Z'
        },
        {
          id: 'instructor2',
          user_id: 'user2',
          name: '이전략 강사',
          email: 'lee.instructor@company.com',
          phone: '010-2222-2222',
          specializations: ['마케팅', '고객관리', 'V-Ceph'],
          bio: '마케팅 및 고객관리 전문 강사입니다.',
          education_background: '마케팅학과 석사',
          years_of_experience: 8,
          is_active: true,
          availability: [],
          created_at: '2024-01-02T09:00:00Z',
          updated_at: '2024-01-02T09:00:00Z'
        },
        {
          id: 'instructor3',
          user_id: 'user3',
          name: '박기술 강사',
          email: 'park.instructor@company.com',
          phone: '010-3333-3333',
          specializations: ['PC 기초', 'Kavo', 'OneClick'],
          bio: 'PC 및 기술 교육 전문 강사입니다.',
          education_background: '컴퓨터공학과 학사',
          years_of_experience: 12,
          is_active: true,
          availability: [],
          created_at: '2024-01-03T09:00:00Z',
          updated_at: '2024-01-03T09:00:00Z'
        }
      ];

      setInstructors(mockInstructors);

    } catch (error) {
      console.error('강사 목록 로드 중 오류:', error);
      toast.error('강사 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 스케줄 충돌 검사
  const checkConflicts = () => {
    const conflictList: ScheduleConflict[] = [];

    // 각 스케줄에 대해 강사 충돌 검사
    schedules.forEach(schedule => {
      if (!schedule.instructor_id) return;

      const conflictingSchedules = schedules.filter(otherSchedule =>
        otherSchedule.id !== schedule.id &&
        otherSchedule.instructor_id === schedule.instructor_id &&
        otherSchedule.date === schedule.date &&
        isTimeOverlapping(schedule, otherSchedule)
      );

      if (conflictingSchedules.length > 0) {
        const instructor = instructors.find(i => i.id === schedule.instructor_id);

        conflictList.push({
          id: `conflict-${schedule.id}`,
          type: 'instructor',
          resource_id: schedule.instructor_id,
          resource_name: instructor?.name || '알 수 없는 강사',
          conflicting_schedules: [
            {
              schedule_id: schedule.id,
              course_name: course.name,
              time_range: `${schedule.start_time}-${schedule.end_time}`
            },
            ...conflictingSchedules.map(cs => ({
              schedule_id: cs.id,
              course_name: course.name,
              time_range: `${cs.start_time}-${cs.end_time}`
            }))
          ],
          date: schedule.date,
          severity: 'high' as const,
          resolved: false
        });
      }
    });

    setConflicts(conflictList);
  };

  // 시간 겹침 검사
  const isTimeOverlapping = (schedule1: Schedule, schedule2: Schedule): boolean => {
    const start1 = new Date(`2000-01-01T${schedule1.start_time}`);
    const end1 = new Date(`2000-01-01T${schedule1.end_time}`);
    const start2 = new Date(`2000-01-01T${schedule2.start_time}`);
    const end2 = new Date(`2000-01-01T${schedule2.end_time}`);

    return start1 < end2 && start2 < end1;
  };

  // 강사 배정 모달 열기
  const openAssignmentModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsAssignmentModalOpen(true);
  };

  // 강사 배정
  const assignInstructor = (instructorId: string | null) => {
    if (!selectedSchedule) return;

    const updatedSchedules = schedules.map(schedule =>
      schedule.id === selectedSchedule.id
        ? { ...schedule, instructor_id: instructorId }
        : schedule
    );

    onScheduleUpdate(updatedSchedules);
    onAssignmentChange(selectedSchedule.id, instructorId);

    setIsAssignmentModalOpen(false);
    setSelectedSchedule(null);

    if (instructorId) {
      const instructor = instructors.find(i => i.id === instructorId);
      toast.success(`${instructor?.name || '강사'}가 배정되었습니다.`);
    } else {
      toast.success('강사 배정이 해제되었습니다.');
    }
  };

  // 강사가 해당 시간에 사용 가능한지 확인
  const isInstructorAvailable = (instructorId: string, schedule: Schedule): boolean => {
    const conflictingCount = schedules.filter(s =>
      s.id !== schedule.id &&
      s.instructor_id === instructorId &&
      s.date === schedule.date &&
      isTimeOverlapping(s, schedule)
    ).length;

    return conflictingCount === 0;
  };

  // 강사의 전문 분야와 매치되는지 확인
  const isInstructorSpecialized = (instructor: Instructor, subject?: string): boolean => {
    if (!subject || !instructor.specializations) return false;
    return instructor.specializations.some(spec =>
      subject.toLowerCase().includes(spec.toLowerCase()) ||
      spec.toLowerCase().includes(subject.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-32 p-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-lg animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">강사 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 충돌 경고 */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 animate-in fade-in zoom-in duration-200">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800 dark:text-red-300">강사 배정 충돌 감지</h3>
              <div className="mt-2 space-y-2">
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="bg-white dark:bg-gray-800 border border-red-100 dark:border-red-800/50 rounded-lg p-3 shadow-sm">
                    <div className="text-sm text-red-700 dark:text-red-400 font-medium">
                      <span className="font-bold">{conflict.resource_name}</span>
                      {' - '}
                      {conflict.date} 시간대 중복
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-500 mt-1">
                      {conflict.conflicting_schedules.map(cs => (
                        <div key={cs.schedule_id}>{cs.time_range}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스케줄별 강사 배정 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              강사 배정 현황
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
              각 시간별 스케줄에 적합한 강사를 배정하세요.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {schedules.map(schedule => {
            const assignedInstructor = instructors.find(i => i.id === schedule.instructor_id);
            const hasConflict = conflicts.some(c =>
              c.conflicting_schedules.some(cs => cs.schedule_id === schedule.id)
            );

            return (
              <div key={schedule.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{schedule.title}</h4>
                      {hasConflict && (
                        <Badge variant="error" size="sm">충돌</Badge>
                      )}
                    </div>

                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center font-medium">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        {new Date(schedule.date).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="flex items-center font-medium">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                    </div>

                    {schedule.subject && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 font-medium inline-block bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        과목: {schedule.subject}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    {assignedInstructor ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 border border-blue-100 dark:border-blue-800">
                          <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                          <div>
                            <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
                              {assignedInstructor.name}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {assignedInstructor.specializations ? assignedInstructor.specializations.slice(0, 2).join(', ') : '전문분야 없음'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openAssignmentModal(schedule)}
                          className="btn-outline h-auto py-2 text-sm"
                        >
                          변경
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignmentModal(schedule)}
                        className="btn-secondary h-auto py-2 text-sm flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        강사 배정
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800">
            <div className="bg-gray-50 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <AcademicCapIcon className="h-8 w-8 text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">스케줄이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">먼저 과정 스케줄을 생성해주세요.</p>
          </div>
        )}
      </div>

      {/* 강사 배정 모달 */}
      {isAssignmentModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">강사 배정</h2>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {/* 선택된 스케줄 정보 */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <div className="bg-white dark:bg-blue-900/30 p-2 rounded-lg mr-3 shadow-sm">
                    <CalendarDaysIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedSchedule.title}</h3>
                    <div className="mt-1 text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {new Date(selectedSchedule.date).toLocaleDateString('ko-KR')} | {' '}
                      <span className="font-mono">{selectedSchedule.start_time} - {selectedSchedule.end_time}</span>
                      {selectedSchedule.subject && ` | ${selectedSchedule.subject}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* 강사 목록 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                    사용 가능한 강사
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {instructors.filter(i => isInstructorAvailable(i.id, selectedSchedule)).length}명
                    </span>
                  </h4>
                  {selectedSchedule.instructor_id && (
                    <button
                      onClick={() => assignInstructor(null)}
                      className="text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      배정 해제
                    </button>
                  )}
                </div>

                <div className="grid gap-3">
                  {instructors.map(instructor => {
                    const isAvailable = isInstructorAvailable(instructor.id, selectedSchedule);
                    const isSpecialized = isInstructorSpecialized(instructor, selectedSchedule.subject);
                    const isCurrentlyAssigned = selectedSchedule.instructor_id === instructor.id;

                    return (
                      <div
                        key={instructor.id}
                        onClick={() => isAvailable && assignInstructor(instructor.id)}
                        className={`relative border rounded-xl p-4 transition-all group ${isCurrentlyAssigned
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                          : isAvailable
                            ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-pointer'
                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <div className={`mt-1 p-2 rounded-full ${isCurrentlyAssigned ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                              <UserIcon className={`h-5 w-5 ${isCurrentlyAssigned ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
                            </div>
                            <div>
                              <div className="flex items-center flex-wrap gap-2">
                                <h5 className={`text-base font-bold ${isCurrentlyAssigned ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                                  {instructor.name}
                                </h5>
                                {isCurrentlyAssigned && (
                                  <span className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                                    <CheckIcon className="h-3 w-3 mr-1" />
                                    배정됨
                                  </span>
                                )}
                                {isSpecialized && (
                                  <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                    전문 분야
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 font-medium">
                                {instructor.specializations ? instructor.specializations.join(' • ') : '전문분야 없음'}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                  경력 {instructor.years_of_experience}년
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {isAvailable ? (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="inline-flex px-2 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm">
                                  선택하기
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-bold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                시간 충돌
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="btn-outline"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAssignment;