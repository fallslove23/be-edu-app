import React, { useState, useCallback } from 'react';
import AttendanceList from './AttendanceList';
import AttendanceForm from './AttendanceForm';
import AttendanceStatistics from './AttendanceStatistics';
import type { Course } from '../../services/course.services';
import type { CourseSchedule, CourseAttendance } from '../../services/course.services';

const AttendanceManagement: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<CourseSchedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 과정 선택
  const handleCourseSelect = useCallback((course: Course) => {
    setSelectedCourse(course);
    setSelectedSchedule(null);
  }, []);

  // 일정 선택
  const handleScheduleSelect = useCallback((schedule: CourseSchedule) => {
    setSelectedSchedule(schedule);
    setIsFormOpen(true);
  }, []);

  // 출석 체크 완료
  const handleAttendanceSubmit = useCallback((attendance: CourseAttendance[]) => {
    console.log('Attendance submitted:', attendance);
    setRefreshTrigger(prev => prev + 1);
    setIsFormOpen(false);
  }, []);

  // 폼 닫기
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setSelectedSchedule(null);
  }, []);

  return (
    <div className="space-y-6 w-full">
      {/* 출석 통계 */}
      <div>
        <AttendanceStatistics
          key={refreshTrigger}
          selectedCourse={selectedCourse}
        />
      </div>

      {/* 출석 목록 */}
      <AttendanceList
        key={refreshTrigger}
        selectedCourse={selectedCourse}
        onCourseSelect={handleCourseSelect}
        onScheduleSelect={handleScheduleSelect}
      />

      {/* 출석 체크 폼 */}
      <AttendanceForm
        schedule={selectedSchedule}
        course={selectedCourse}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleAttendanceSubmit}
      />
    </div>
  );
};

export default AttendanceManagement;