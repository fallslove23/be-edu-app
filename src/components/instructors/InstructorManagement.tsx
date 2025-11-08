import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

type ViewType = 'dashboard' | 'instructors' | 'assignments' | 'roles' | 'analytics';
type InstructorType = 'internal' | 'external' | 'freelance';
type InstructorStatus = 'active' | 'inactive' | 'on_leave';
type AssignmentRole = 'primary' | 'assistant' | 'guest' | 'substitute';
type AssignmentStatus = 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface WeeklyAvailability {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
  saturday: string[];
  sunday: string[];
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  phone: string;
  employee_id?: string;
  external_company?: string;
  specializations: string[];
  certifications: string[];
  experience_years: number;
  bio: string;
  profile_image?: string;
  status: InstructorStatus;
  instructor_type: InstructorType;
  availability: WeeklyAvailability;
  preferred_courses: string[];
  created_date: string;
  last_active: string;
}

interface CourseAssignment {
  id: string;
  instructor_id: string;
  instructor_name: string;
  course_id: string;
  course_name: string;
  session_name: string;
  role: AssignmentRole;
  responsibilities: string[];
  start_date: string;
  end_date: string;
  schedule_times: string[];
  status: AssignmentStatus;
  assigned_date: string;
  notes?: string;
}

interface InstructorRole {
  id: string;
  role_name: string;
  description: string;
  permissions: string[];
  instructor_count: number;
  created_date: string;
}

const InstructorManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [roles, setRoles] = useState<InstructorRole[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 목업 강사 데이터
      const mockInstructors: Instructor[] = [
        {
          id: 'inst-1',
          name: '김영수',
          email: 'kim@bsedu.com',
          phone: '010-1234-5678',
          employee_id: 'EMP001',
          specializations: ['영업 기초', '고객 관리', '프레젠테이션'],
          certifications: ['영업관리사 1급', 'BS 공인강사'],
          experience_years: 8,
          bio: '10년 이상의 영업 현장 경험을 바탕으로 실무 중심의 교육을 진행합니다.',
          status: 'active',
          instructor_type: 'internal',
          availability: {
            monday: ['09:00-12:00', '14:00-17:00'],
            tuesday: ['09:00-12:00', '14:00-17:00'],
            wednesday: ['09:00-12:00'],
            thursday: ['09:00-12:00', '14:00-17:00'],
            friday: ['09:00-12:00', '14:00-17:00'],
            saturday: [],
            sunday: []
          },
          preferred_courses: ['BS 영업 기초과정', 'BS 고급 영업 전략'],
          created_date: '2024-01-15',
          last_active: '2024-08-12'
        },
        {
          id: 'inst-2',
          name: '박지현',
          email: 'park@external.com',
          phone: '010-2345-6789',
          external_company: 'ABC 컨설팅',
          specializations: ['커뮤니케이션', '리더십', '팀워크'],
          certifications: ['커뮤니케이션 전문가', 'CTI 코치'],
          experience_years: 12,
          bio: '기업 교육 전문가로 다양한 대기업에서 교육 경험이 풍부합니다.',
          status: 'active',
          instructor_type: 'external',
          availability: {
            monday: ['10:00-16:00'],
            tuesday: ['10:00-16:00'],
            wednesday: ['10:00-16:00'],
            thursday: ['10:00-16:00'],
            friday: ['10:00-16:00'],
            saturday: ['09:00-15:00'],
            sunday: []
          },
          preferred_courses: ['BS 커뮤니케이션 과정'],
          created_date: '2024-02-20',
          last_active: '2024-08-10'
        },
        {
          id: 'inst-3',
          name: '이준호',
          email: 'lee@freelance.com',
          phone: '010-3456-7890',
          specializations: ['디지털 마케팅', '데이터 분석'],
          certifications: ['Google Analytics 인증', 'Facebook 광고 전문가'],
          experience_years: 5,
          bio: '디지털 마케팅 분야의 실무 전문가입니다.',
          status: 'active',
          instructor_type: 'freelance',
          availability: {
            monday: ['19:00-22:00'],
            tuesday: ['19:00-22:00'],
            wednesday: ['19:00-22:00'],
            thursday: ['19:00-22:00'],
            friday: ['19:00-22:00'],
            saturday: ['09:00-18:00'],
            sunday: ['09:00-18:00']
          },
          preferred_courses: ['디지털 마케팅 과정'],
          created_date: '2024-03-10',
          last_active: '2024-08-11'
        }
      ];

      // 목업 배정 데이터
      const mockAssignments: CourseAssignment[] = [
        {
          id: 'assign-1',
          instructor_id: 'inst-1',
          instructor_name: '김영수',
          course_id: 'course-1',
          course_name: 'BS 영업 기초과정',
          session_name: '2024년 2차',
          role: 'primary',
          responsibilities: ['강의 진행', '실습 지도', '평가'],
          start_date: '2024-08-01',
          end_date: '2024-08-15',
          schedule_times: ['09:00-12:00', '14:00-17:00'],
          status: 'in_progress',
          assigned_date: '2024-07-15',
          notes: '주강사로 전체 과정 담당'
        },
        {
          id: 'assign-2',
          instructor_id: 'inst-2',
          instructor_name: '박지현',
          course_id: 'course-2',
          course_name: 'BS 커뮤니케이션 과정',
          session_name: '2024년 1차',
          role: 'primary',
          responsibilities: ['강의 진행', '워크샵 운영'],
          start_date: '2024-08-20',
          end_date: '2024-08-30',
          schedule_times: ['10:00-16:00'],
          status: 'assigned',
          assigned_date: '2024-08-01',
          notes: '외부 전문강사 초청'
        },
        {
          id: 'assign-3',
          instructor_id: 'inst-1',
          instructor_name: '김영수',
          course_id: 'course-3',
          course_name: 'BS 고급 영업 전략',
          session_name: '2024년 1차',
          role: 'assistant',
          responsibilities: ['실습 지도', '멘토링'],
          start_date: '2024-09-01',
          end_date: '2024-09-15',
          schedule_times: ['14:00-17:00'],
          status: 'assigned',
          assigned_date: '2024-08-05',
          notes: '보조강사로 실습 중심 지원'
        }
      ];

      // 목업 역할 데이터
      const mockRoles: InstructorRole[] = [
        {
          id: 'role-1',
          role_name: '수석 강사',
          description: '모든 과정을 담당할 수 있는 선임 강사',
          permissions: ['course_creation', 'curriculum_edit', 'student_grade', 'attendance_manage', 'exam_create'],
          instructor_count: 2,
          created_date: '2024-01-01'
        },
        {
          id: 'role-2',
          role_name: '전문 강사',
          description: '특정 분야 전문 강사',
          permissions: ['student_grade', 'attendance_manage', 'exam_create'],
          instructor_count: 3,
          created_date: '2024-01-01'
        },
        {
          id: 'role-3',
          role_name: '보조 강사',
          description: '실습 및 보조 업무 담당 강사',
          permissions: ['attendance_manage'],
          instructor_count: 1,
          created_date: '2024-01-01'
        }
      ];

      setInstructors(mockInstructors);
      setAssignments(mockAssignments);
      setRoles(mockRoles);
    } catch (error) {
      console.error('Failed to load instructor data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 강사 목록
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (instructor.specializations && instructor.specializations.some(spec =>
                           spec.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    const matchesStatus = selectedStatus === 'all' || instructor.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // 통계 계산
  const stats = {
    total_instructors: instructors.length,
    active_instructors: instructors.filter(i => i.status === 'active').length,
    internal_instructors: instructors.filter(i => i.instructor_type === 'internal').length,
    external_instructors: instructors.filter(i => i.instructor_type === 'external').length,
    active_assignments: assignments.filter(a => a.status === 'in_progress').length,
    pending_assignments: assignments.filter(a => a.status === 'assigned').length
  };

  // 상태별 아이콘
  const getStatusIcon = (status: InstructorStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-gray-600" />;
      case 'inactive':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'on_leave':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: InstructorStatus) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      case 'on_leave':
        return '휴직';
      default:
        return status;
    }
  };

  const getStatusColor = (status: InstructorStatus) => {
    switch (status) {
      case 'active':
        return 'bg-gray-100 text-gray-700';
      case 'inactive':
        return 'bg-red-100 text-red-700';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: InstructorType) => {
    switch (type) {
      case 'internal':
        return '내부';
      case 'external':
        return '외부';
      case 'freelance':
        return '프리랜서';
      default:
        return type;
    }
  };

  const getRoleLabel = (role: AssignmentRole) => {
    switch (role) {
      case 'primary':
        return '주강사';
      case 'assistant':
        return '보조강사';
      case 'guest':
        return '게스트';
      case 'substitute':
        return '대타';
      default:
        return role;
    }
  };

  const getAssignmentStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'in_progress':
        return 'bg-gray-100 text-gray-700';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-gray-100 text-gray-600';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAssignmentStatusLabel = (status: AssignmentStatus) => {
    switch (status) {
      case 'assigned':
        return '배정됨';
      case 'confirmed':
        return '확정됨';
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="h-8 w-8 mr-3 text-gray-600" />
              강사 관리
            </h1>
            <p className="mt-2 text-gray-600">
              강사 프로필, 과정 배정, 역할 권한을 관리합니다.
            </p>
          </div>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            강사 등록
          </button>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.total_instructors}</div>
            <div className="text-sm text-gray-600">전체 강사</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.active_instructors}</div>
            <div className="text-sm text-gray-600">활성 강사</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.internal_instructors}</div>
            <div className="text-sm text-gray-600">내부 강사</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.external_instructors}</div>
            <div className="text-sm text-gray-600">외부 강사</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.active_assignments}</div>
            <div className="text-sm text-gray-600">진행중 배정</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.pending_assignments}</div>
            <div className="text-sm text-gray-600">예정 배정</div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { key: 'dashboard', label: '대시보드', icon: ChartBarIcon },
              { key: 'instructors', label: '강사 관리', icon: UserIcon },
              { key: 'assignments', label: '과정 배정', icon: CalendarDaysIcon },
              { key: 'roles', label: '역할 권한', icon: ShieldCheckIcon },
              { key: 'analytics', label: '성과 분석', icon: AcademicCapIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as ViewType)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  currentView === tab.key
                    ? 'border-gray-600 text-gray-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 대시보드 탭 */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* 최근 배정 현황 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">최근 과정 배정</h3>
                <div className="space-y-3">
                  {assignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <UserIcon className="h-8 w-8 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">{assignment.instructor_name}</div>
                          <div className="text-sm text-gray-600">
                            {assignment.course_name} • {assignment.session_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getRoleLabel(assignment.role)} • {assignment.start_date} ~ {assignment.end_date}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentStatusColor(assignment.status)}`}>
                          {getAssignmentStatusLabel(assignment.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 강사별 활동 현황 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">강사별 활동 현황</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instructors.filter(i => i.status === 'active').map((instructor) => {
                    const instructorAssignments = assignments.filter(a => a.instructor_id === instructor.id);
                    const activeAssignments = instructorAssignments.filter(a => a.status === 'in_progress');
                    
                    return (
                      <div key={instructor.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{instructor.name}</h4>
                            <p className="text-sm text-gray-600">{getTypeLabel(instructor.instructor_type)}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instructor.status)}`}>
                            {getStatusLabel(instructor.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">전문분야:</span> {instructor.specializations ? instructor.specializations.slice(0, 2).join(', ') : '없음'}
                            {instructor.specializations && instructor.specializations.length > 2 && ` 외 ${instructor.specializations.length - 2}개`}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">진행중 과정:</span> {activeAssignments.length}개
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">총 배정:</span> {instructorAssignments.length}개
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 강사 관리 탭 */}
          {currentView === 'instructors' && (
            <div className="space-y-4">
              {/* 검색 및 필터 */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* 검색 입력 */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="강사명, 이메일, 전문분야 검색..."
                    className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                  />
                </div>

                {/* 상태 필터 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="all">전체 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="on_leave">휴직</option>
                </select>

                {/* 결과 카운트 */}
                <div className="flex items-center px-4 py-2.5 bg-secondary/30 rounded-lg border border-border">
                  <FunnelIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    총 <span className="text-primary font-semibold">{filteredInstructors.length}</span>명
                  </span>
                </div>
              </div>

              {/* 강사 목록 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredInstructors.map((instructor) => (
                  <div key={instructor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{instructor.name}</h4>
                          <p className="text-sm text-gray-600">{instructor.email}</p>
                          <p className="text-sm text-gray-500">{getTypeLabel(instructor.instructor_type)}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instructor.status)}`}>
                        {getStatusLabel(instructor.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">경력:</span> {instructor.experience_years}년
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">전문분야:</span> {instructor.specializations ? instructor.specializations.slice(0, 2).join(', ') : '없음'}
                        {instructor.specializations && instructor.specializations.length > 2 && ` 외 ${instructor.specializations.length - 2}개`}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">자격증:</span> {instructor.certifications ? instructor.certifications.slice(0, 1).join(', ') : '없음'}
                        {instructor.certifications && instructor.certifications.length > 1 && ` 외 ${instructor.certifications.length - 1}개`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                        프로필 보기
                      </button>
                      <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                        편집
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 과정 배정 탭 */}
          {currentView === 'assignments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">과정 배정 현황</h3>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  새 배정 생성
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">강사</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과정</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{assignment.instructor_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.course_name}</div>
                          <div className="text-sm text-gray-500">{assignment.session_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getRoleLabel(assignment.role)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.start_date}</div>
                          <div className="text-sm text-gray-500">~ {assignment.end_date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssignmentStatusColor(assignment.status)}`}>
                            {getAssignmentStatusLabel(assignment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button className="text-gray-600 hover:text-gray-700">
                              보기
                            </button>
                            <button className="text-gray-600 hover:text-gray-700">
                              편집
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 역할 권한 탭 */}
          {currentView === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">강사 역할 및 권한</h3>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  새 역할 생성
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                  <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{role.role_name}</h4>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {role.instructor_count}명
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-medium text-gray-700">권한:</div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((permission, index) => (
                          <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors">
                        권한 보기
                      </button>
                      <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors">
                        편집
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 성과 분석 탭 */}
          {currentView === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">강사 성과 분석</h3>
              
              {/* 성과 요약 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">강사 활용도</h4>
                  <div className="space-y-2">
                    {instructors.slice(0, 3).map((instructor) => {
                      const instructorAssignments = assignments.filter(a => a.instructor_id === instructor.id);
                      const utilization = Math.round((instructorAssignments.length / assignments.length) * 100);
                      
                      return (
                        <div key={instructor.id}>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">{instructor.name}</span>
                            <span className="text-gray-600">{utilization}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gray-600 h-2 rounded-full"
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">과정별 배정 현황</h4>
                  <div className="space-y-2">
                    {['BS 영업 기초과정', 'BS 커뮤니케이션 과정', 'BS 고급 영업 전략'].map((course) => {
                      const courseAssignments = assignments.filter(a => a.course_name === course);
                      
                      return (
                        <div key={course} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">{course}</span>
                            <span className="text-gray-600">{courseAssignments.length}명</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">역할별 분포</h4>
                  <div className="space-y-2">
                    {['primary', 'assistant', 'guest'].map((role) => {
                      const roleAssignments = assignments.filter(a => a.role === role);
                      const percentage = Math.round((roleAssignments.length / assignments.length) * 100);
                      
                      return (
                        <div key={role} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">{getRoleLabel(role as AssignmentRole)}</span>
                            <span className="text-gray-600">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 개선 권장사항 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">📊 분석 결과 및 권장사항</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>• 내부 강사 활용도가 높습니다. 외부 전문가 영입을 고려해보세요.</div>
                  <div>• 보조강사 배정을 늘려 주강사의 부담을 줄이는 것을 권장합니다.</div>
                  <div>• 신규 강사를 위한 멘토링 프로그램 도입을 검토해보세요.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorManagement;