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
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">강사 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 충돌 경고 */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">강사 배정 충돌 감지</h3>
              <div className="mt-2 space-y-2">
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="bg-white border border-red-200 rounded p-3">
                    <div className="text-sm text-red-800">
                      <span className="font-medium">{conflict.resource_name}</span>
                      {' - '}
                      {conflict.date} 시간대 중복
                    </div>
                    <div className="text-xs text-red-600 mt-1">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            강사 배정 현황
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            각 시간별 스케줄에 적합한 강사를 배정하세요.
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {schedules.map(schedule => {
            const assignedInstructor = instructors.find(i => i.id === schedule.instructor_id);
            const hasConflict = conflicts.some(c => 
              c.conflicting_schedules.some(cs => cs.schedule_id === schedule.id)
            );

            return (
              <div key={schedule.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{schedule.title}</h4>
                      {hasConflict && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          충돌
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        {new Date(schedule.date).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                    </div>

                    {schedule.subject && (
                      <div className="mt-1 text-sm text-gray-600">
                        과목: {schedule.subject}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {assignedInstructor ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center bg-blue-50 rounded-lg px-3 py-2">
                          <UserIcon className="h-4 w-4 text-blue-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-blue-900">
                              {assignedInstructor.name}
                            </div>
                            <div className="text-xs text-blue-600">
                              {assignedInstructor.specializations ? assignedInstructor.specializations.slice(0, 2).join(', ') : '전문분야 없음'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openAssignmentModal(schedule)}
                          className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                        >
                          변경
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAssignmentModal(schedule)}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
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
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">스케줄이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">먼저 과정 스케줄을 생성해주세요.</p>
          </div>
        )}
      </div>

      {/* 강사 배정 모달 */}
      {isAssignmentModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">강사 배정</h2>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* 선택된 스케줄 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900">{selectedSchedule.title}</h3>
                <div className="mt-1 text-sm text-gray-600">
                  {new Date(selectedSchedule.date).toLocaleDateString('ko-KR')} | {' '}
                  {selectedSchedule.start_time} - {selectedSchedule.end_time}
                  {selectedSchedule.subject && ` | ${selectedSchedule.subject}`}
                </div>
              </div>

              {/* 강사 목록 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">사용 가능한 강사</h4>
                  {selectedSchedule.instructor_id && (
                    <button
                      onClick={() => assignInstructor(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      배정 해제
                    </button>
                  )}
                </div>

                {instructors.map(instructor => {
                  const isAvailable = isInstructorAvailable(instructor.id, selectedSchedule);
                  const isSpecialized = isInstructorSpecialized(instructor, selectedSchedule.subject);
                  const isCurrentlyAssigned = selectedSchedule.instructor_id === instructor.id;

                  return (
                    <div
                      key={instructor.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isCurrentlyAssigned 
                          ? 'border-blue-500 bg-blue-50' 
                          : isAvailable 
                            ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50' 
                            : 'border-gray-100 bg-gray-50 opacity-60'
                      }`}
                      onClick={() => isAvailable && assignInstructor(instructor.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <UserIcon className="h-6 w-6 text-gray-400 mt-1" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="text-sm font-medium text-gray-900">
                                {instructor.name}
                              </h5>
                              {isCurrentlyAssigned && (
                                <CheckIcon className="h-4 w-4 text-blue-600" />
                              )}
                              {isSpecialized && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  전문 분야
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {instructor.specializations ? instructor.specializations.join(' • ') : '전문분야 없음'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              경력 {instructor.years_of_experience}년
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {isAvailable ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              사용 가능
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
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
        </div>
      )}
    </div>
  );
};

export default InstructorAssignment;