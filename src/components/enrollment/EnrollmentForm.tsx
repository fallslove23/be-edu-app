import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
  employee_id?: string;
}

interface Course {
  id: string;
  name: string;
  courseCode: string;
  start_date: string;
  end_date: string;
  max_trainees: number;
  current_trainees: number;
}

interface EnrollmentFormProps {
  onSave: (enrollmentData: {
    student_id: string;
    course_id: string;
    notes?: string;
    enrollment_type: 'individual' | 'admin';
  }) => Promise<void>;
  onCancel: () => void;
  preSelectedCourse?: Course;
  preSelectedStudent?: Student;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({
  onSave,
  onCancel,
  preSelectedCourse,
  preSelectedStudent
}) => {
  const { user } = useAuth();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(preSelectedStudent || null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(preSelectedCourse || null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 검색 상태
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // 샘플 데이터
  const [students] = useState<Student[]>([
    {
      id: 'student-1',
      name: '김수강',
      email: 'kim.student@company.com',
      department: '영업부',
      position: '사원',
      employee_id: 'EMP001'
    },
    {
      id: 'student-2',
      name: '이학습',
      email: 'lee.student@company.com',
      department: '마케팅부',
      position: '주임',
      employee_id: 'EMP002'
    },
    {
      id: 'student-3',
      name: '박교육',
      email: 'park.student@company.com',
      department: '인사부',
      position: '대리',
      employee_id: 'EMP003'
    },
    {
      id: 'student-4',
      name: '최훈련',
      email: 'choi.student@company.com',
      department: '기술부',
      position: '사원',
      employee_id: 'EMP004'
    }
  ]);

  const [courses] = useState<Course[]>([
    {
      id: 'course-1',
      name: 'BS 신입 영업사원 기초과정',
      courseCode: 'BS-2025-01',
      start_date: '2025-02-01',
      end_date: '2025-02-28',
      max_trainees: 30,
      current_trainees: 25
    },
    {
      id: 'course-2',
      name: 'BS 고급 영업 전략과정',
      courseCode: 'BS-2025-02',
      start_date: '2025-03-01',
      end_date: '2025-03-31',
      max_trainees: 20,
      current_trainees: 18
    },
    {
      id: 'course-3',
      name: 'BS 리더십 개발과정',
      courseCode: 'BS-2025-03',
      start_date: '2025-04-01',
      end_date: '2025-04-30',
      max_trainees: 15,
      current_trainees: 10
    }
  ]);

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.department?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.employee_id?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // 필터링된 과정 목록 (등록 가능한 것만)
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(courseSearch.toLowerCase());
    const hasSpace = course.current_trainees < course.max_trainees;
    const isActive = new Date(course.start_date) > new Date();
    
    return matchesSearch && hasSpace && isActive;
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedStudent) newErrors.student = '수강생을 선택해주세요';
    if (!selectedCourse) newErrors.course = '과정을 선택해주세요';

    // 이미 등록된 학생인지 확인 (실제 환경에서는 API 호출)
    if (selectedStudent && selectedCourse) {
      // 여기서 중복 등록 체크 로직 추가
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        student_id: selectedStudent!.id,
        course_id: selectedCourse!.id,
        notes: notes.trim() || undefined,
        enrollment_type: 'admin'
      });
      onCancel(); // 성공 시 폼 닫기
    } catch (error) {
      console.error('등록 실패:', error);
      setErrors({ submit: '등록에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserPlusIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">수강생 등록</h2>
              <p className="text-sm text-gray-600">과정에 수강생을 개별 등록합니다</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 수강생 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>수강생 선택</span>
            </h3>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수강생 검색 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="이름, 이메일, 부서, 사번으로 검색..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.student ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              
              {/* 학생 드롭다운 */}
              {showStudentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentSearch(student.name);
                          setShowStudentDropdown(false);
                          if (errors.student) {
                            setErrors(prev => ({ ...prev, student: '' }));
                          }
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{student.email}</div>
                        <div className="text-xs text-gray-500">
                          {student.department} · {student.position} · {student.employee_id}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>
              )}
              
              {errors.student && <p className="text-red-500 text-xs mt-1">{errors.student}</p>}
            </div>

            {/* 선택된 학생 정보 */}
            {selectedStudent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">선택된 수강생</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div><strong>{selectedStudent.name}</strong> ({selectedStudent.employee_id})</div>
                  <div>{selectedStudent.email}</div>
                  <div>{selectedStudent.department} · {selectedStudent.position}</div>
                </div>
              </div>
            )}
          </div>

          {/* 과정 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AcademicCapIcon className="h-5 w-5" />
              <span>과정 선택</span>
            </h3>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                과정 검색 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => {
                    setCourseSearch(e.target.value);
                    setShowCourseDropdown(true);
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                  placeholder="과정명, 과정코드로 검색..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.course ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              
              {/* 과정 드롭다운 */}
              {showCourseDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourse(course);
                          setCourseSearch(course.name);
                          setShowCourseDropdown(false);
                          if (errors.course) {
                            setErrors(prev => ({ ...prev, course: '' }));
                          }
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-600">{course.courseCode}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(course.start_date)} ~ {formatDate(course.end_date)} · 
                          {course.current_trainees}/{course.max_trainees}명
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      등록 가능한 과정이 없습니다
                    </div>
                  )}
                </div>
              )}
              
              {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course}</p>}
            </div>

            {/* 선택된 과정 정보 */}
            {selectedCourse && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">선택된 과정</span>
                </div>
                <div className="text-sm text-green-800">
                  <div><strong>{selectedCourse.name}</strong> ({selectedCourse.courseCode})</div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{formatDate(selectedCourse.start_date)} ~ {formatDate(selectedCourse.end_date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{selectedCourse.current_trainees}/{selectedCourse.max_trainees}명</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(selectedCourse.current_trainees / selectedCourse.max_trainees) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1">
                      {selectedCourse.max_trainees - selectedCourse.current_trainees}자리 남음
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>추가 정보</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고 (선택사항)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="등록 관련 특이사항이나 메모를 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudent || !selectedCourse}
              className="btn-primary"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSubmitting ? '등록 중...' : '등록 완료'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 클릭 외부 영역으로 드롭다운 닫기 */}
      {(showStudentDropdown || showCourseDropdown) && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowStudentDropdown(false);
            setShowCourseDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default EnrollmentForm;