import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentPlusIcon,
  UserPlusIcon,
  UsersIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import type { 
  EnrollmentManagement, 
  EnrollmentFilters, 
  EnrollmentStats,
  enrollmentStatusLabels,
  enrollmentTypeLabels
} from '../../types/student.types';
import EnrollmentForm from './EnrollmentForm';

const EnrollmentManagementComponent: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = ['admin', 'manager'].includes(user?.role || '');

  const [enrollments, setEnrollments] = useState<EnrollmentManagement[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<EnrollmentManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EnrollmentFilters>({});
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'bulk' | 'requests'>('list');
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stats, setStats] = useState<EnrollmentStats | null>(null);

  // 샘플 데이터 생성
  useEffect(() => {
    const generateSampleData = (): EnrollmentManagement[] => {
      return [
        {
          id: 'enrollment-1',
          course_id: 'course-1',
          course_name: 'BS 신입 영업사원 기초과정',
          course_code: 'BS-2025-01',
          student_id: 'student-1',
          student_name: '김수강',
          student_email: 'kim.student@company.com',
          student_department: '영업부',
          student_position: '사원',
          enrolled_at: '2025-01-20T09:00:00Z',
          status: 'enrolled',
          enrollment_type: 'admin',
          notes: '신입사원 필수 교육과정',
          approved_by: 'manager-1',
          approved_at: '2025-01-20T09:00:00Z'
        },
        {
          id: 'enrollment-2',
          course_id: 'course-1',
          course_name: 'BS 신입 영업사원 기초과정',
          course_code: 'BS-2025-01',
          student_id: 'student-2',
          student_name: '이학습',
          student_email: 'lee.student@company.com',
          student_department: '마케팅부',
          student_position: '주임',
          enrolled_at: '2025-01-21T10:30:00Z',
          status: 'enrolled',
          enrollment_type: 'self',
          notes: '자가신청을 통한 등록'
        },
        {
          id: 'enrollment-3',
          course_id: 'course-2',
          course_name: 'BS 고급 영업 전략과정',
          course_code: 'BS-2025-02',
          student_id: 'student-3',
          student_name: '박완료',
          student_email: 'park.student@company.com',
          student_department: '영업부',
          student_position: '대리',
          enrolled_at: '2024-12-01T09:00:00Z',
          status: 'completed',
          enrollment_type: 'bulk',
          notes: '일괄 등록을 통한 수강',
          approved_by: 'manager-1',
          approved_at: '2024-12-01T09:00:00Z'
        },
        {
          id: 'enrollment-4',
          course_id: 'course-1',
          course_name: 'BS 신입 영업사원 기초과정',
          course_code: 'BS-2025-01',
          student_id: 'student-4',
          student_name: '최대기',
          student_email: 'choi.student@company.com',
          student_department: '인사부',
          student_position: '사원',
          enrolled_at: '2025-01-22T14:00:00Z',
          status: 'pending',
          enrollment_type: 'self',
          notes: '승인 대기 중인 자가신청'
        }
      ];
    };

    setLoading(true);
    setTimeout(() => {
      const sampleEnrollments = generateSampleData();
      setEnrollments(sampleEnrollments);
      setFilteredEnrollments(sampleEnrollments);
      
      // 통계 계산
      const statsData: EnrollmentStats = {
        total_enrollments: sampleEnrollments.length,
        active_enrollments: sampleEnrollments.filter(e => e.status === 'enrolled').length,
        completed_enrollments: sampleEnrollments.filter(e => e.status === 'completed').length,
        dropped_enrollments: sampleEnrollments.filter(e => e.status === 'dropped').length,
        pending_enrollments: sampleEnrollments.filter(e => e.status === 'pending').length,
        completion_rate: 75,
        dropout_rate: 5,
        by_status: sampleEnrollments.reduce((acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_department: sampleEnrollments.reduce((acc, e) => {
          const dept = e.student_department || '미정';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_course: sampleEnrollments.reduce((acc, e) => {
          acc[e.course_name] = (acc[e.course_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      setStats(statsData);
      setLoading(false);
    }, 800);
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filtered = enrollments;

    // 텍스트 검색
    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.student_department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(enrollment => filters.status!.includes(enrollment.status));
    }

    // 과정 필터
    if (filters.course_id) {
      filtered = filtered.filter(enrollment => enrollment.course_id === filters.course_id);
    }

    // 부서 필터
    if (filters.department && filters.department.length > 0) {
      filtered = filtered.filter(enrollment => 
        enrollment.student_department && filters.department!.includes(enrollment.student_department)
      );
    }

    // 직급 필터
    if (filters.position && filters.position.length > 0) {
      filtered = filtered.filter(enrollment => 
        enrollment.student_position && filters.position!.includes(enrollment.student_position)
      );
    }

    setFilteredEnrollments(filtered);
  }, [enrollments, searchQuery, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-500/10 text-green-700';
      case 'dropped': return 'bg-destructive/10 text-destructive';
      case 'pending': return 'bg-yellow-100 text-orange-700';
      case 'waitlisted': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enrolled': return <CheckCircleIcon className="h-4 w-4" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'dropped': return <XCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'waitlisted': return <ClockIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 등록 저장 핸들러
  const handleSaveEnrollment = async (enrollmentData: {
    student_id: string;
    course_id: string;
    notes?: string;
    enrollment_type: 'individual' | 'admin';
  }) => {
    try {
      // 새 등록 생성
      const newEnrollment: EnrollmentManagement = {
        id: `enrollment-${Date.now()}`,
        course_id: enrollmentData.course_id,
        course_name: '선택된 과정', // 실제로는 course_id로 조회
        course_code: 'BS-2025-XX', // 실제로는 course_id로 조회
        student_id: enrollmentData.student_id,
        student_name: '선택된 학생', // 실제로는 student_id로 조회
        student_email: 'student@company.com', // 실제로는 student_id로 조회
        student_department: '부서명',
        student_position: '직급',
        enrolled_at: new Date().toISOString(),
        status: 'enrolled',
        enrollment_type: enrollmentData.enrollment_type,
        notes: enrollmentData.notes,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      };
      
      setEnrollments(prev => [newEnrollment, ...prev]);
      alert('수강생이 성공적으로 등록되었습니다.');
      
      setCurrentView('list');
    } catch (error) {
      console.error('등록 실패:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">등록 정보를 불러오는 중...</span>
      </div>
    );
  }

  // 현재 뷰에 따른 렌더링
  if (currentView === 'create') {
    return (
      <EnrollmentForm
        onSave={handleSaveEnrollment}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'bulk') {
    // 일괄 등록 컴포넌트 (추후 구현)
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">일괄 등록</h2>
        <p className="text-gray-600">일괄 등록 기능을 개발 중입니다.</p>
        <button
          onClick={() => setCurrentView('list')}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-full"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (currentView === 'requests') {
    // 승인 요청 관리 (추후 구현)
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">승인 요청 관리</h2>
        <p className="text-gray-600">승인 요청 관리 기능을 개발 중입니다.</p>
        <button
          onClick={() => setCurrentView('list')}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-full"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
              <UserGroupIcon className="h-7 w-7 text-blue-600" />
              <span>수강생 등록 관리</span>
            </h1>
            <p className="text-gray-600">
              {isAdmin && 'BS 교육과정의 수강생 등록을 종합적으로 관리하세요.'}
              {isManager && !isAdmin && '담당 과정의 수강생 등록을 관리하고 모니터링하세요.'}
              {!isManager && '수강 신청 및 진행 상황을 확인하세요.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 뷰 모드 전환 */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                테이블
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                카드
              </button>
            </div>

            {/* 액션 버튼들 */}
            {isManager && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('bulk')}
                  className="btn-success px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <UsersIcon className="h-4 w-4" />
                  <span>일괄 등록</span>
                </button>
                <button
                  onClick={() => setCurrentView('create')}
                  className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  <span>개별 등록</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 통계 대시보드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 등록</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_enrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수강중</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_enrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수료</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_enrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-foreground" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인대기</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_enrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DocumentPlusIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수료율</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completion_rate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="수강생명, 이메일, 과정명, 부서로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status?.[0] || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              status: e.target.value ? [e.target.value] : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 상태</option>
            <option value="enrolled">수강중</option>
            <option value="completed">수료</option>
            <option value="dropped">중도포기</option>
            <option value="pending">승인대기</option>
          </select>

          <select
            value={filters.department?.[0] || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              department: e.target.value ? [e.target.value] : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 부서</option>
            <option value="영업부">영업부</option>
            <option value="마케팅부">마케팅부</option>
            <option value="인사부">인사부</option>
            <option value="기술부">기술부</option>
          </select>

          {isManager && (
            <button
              onClick={() => setCurrentView('requests')}
              className="px-4 py-2 bg-orange-500/10 text-orange-700 rounded-full hover:bg-orange-200 flex items-center space-x-2"
            >
              <BellIcon className="h-4 w-4" />
              <span>승인 요청</span>
              {stats && stats.pending_enrollments > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                  {stats.pending_enrollments}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 등록 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            등록 목록 ({filteredEnrollments.length})
          </h3>
          
          {selectedEnrollments.length > 0 && isManager && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedEnrollments.length}개 선택됨
              </span>
              <button className="btn-danger rounded-full">
                선택 삭제
              </button>
              <button className="btn-success rounded-full">
                일괄 승인
              </button>
            </div>
          )}
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 수강생이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || Object.keys(filters).some(key => filters[key as keyof EnrollmentFilters])
                ? '검색 조건에 맞는 등록이 없습니다.'
                : '아직 등록된 수강생이 없습니다.'
              }
            </p>
            {isManager && (
              <button
                onClick={() => setCurrentView('create')}
                className="btn-primary px-4 py-2 rounded-full"
              >
                첫 수강생 등록하기
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          // 테이블 뷰
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isManager && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEnrollments(filteredEnrollments.map(e => e.id));
                          } else {
                            setSelectedEnrollments([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수강생 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    과정 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    {isManager && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedEnrollments.includes(enrollment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEnrollments(prev => [...prev, enrollment.id]);
                            } else {
                              setSelectedEnrollments(prev => prev.filter(id => id !== enrollment.id));
                            }
                          }}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.student_name}</div>
                        <div className="text-sm text-gray-500">{enrollment.student_email}</div>
                        <div className="text-xs text-gray-500">
                          {enrollment.student_department} · {enrollment.student_position}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{enrollment.course_name}</div>
                        <div className="text-sm text-gray-500">{enrollment.course_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(enrollment.status)}`}>
                        {getStatusIcon(enrollment.status)}
                        <span className="ml-1">{(enrollmentStatusLabels as any)[enrollment.status]}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(enrollment.enrolled_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-100 rounded-full" title="상세보기">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {isManager && (
                          <>
                            <button className="p-1 text-green-600 hover:bg-green-500/10 rounded-full" title="편집">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-destructive hover:bg-destructive/10 rounded-full" title="삭제">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // 카드 뷰
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{enrollment.student_name}</h4>
                      <p className="text-sm text-gray-600">{enrollment.student_email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {enrollment.student_department} · {enrollment.student_position}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(enrollment.status)}`}>
                      {getStatusIcon(enrollment.status)}
                      <span className="ml-1">{(enrollmentStatusLabels as any)[enrollment.status]}</span>
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">과정:</span> {enrollment.course_name}
                    </div>
                    <div>
                      <span className="font-medium">코드:</span> {enrollment.course_code}
                    </div>
                    <div>
                      <span className="font-medium">등록일:</span> {formatDate(enrollment.enrolled_at)}
                    </div>
                    {enrollment.notes && (
                      <div>
                        <span className="font-medium">비고:</span> {enrollment.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-blue-600 hover:bg-blue-100 rounded-full" title="상세보기">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {isManager && (
                        <>
                          <button className="p-1 text-green-600 hover:bg-green-500/10 rounded-full" title="편집">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-destructive hover:bg-destructive/10 rounded-full" title="삭제">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {(enrollmentTypeLabels as any)[enrollment.enrollment_type]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentManagementComponent;