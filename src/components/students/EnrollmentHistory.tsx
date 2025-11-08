import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  position: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  courseCategory: 'mandatory' | 'optional' | 'leadership';
  round: number;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  status: 'enrolled' | 'in-progress' | 'completed' | 'dropped' | 'pending';
  attendanceRate?: number;
  currentProgress?: number;
  instructorName: string;
  enrollmentMethod: 'manual' | 'self' | 'automatic';
  maxStudents: number;
  currentStudents: number;
  notes?: string;
}

interface EnrollmentStatistics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  pendingEnrollments: number;
  averageProgress: number;
}

const EnrollmentHistory: React.FC = () => {
  const { user } = useAuth();
  const [enrollmentRecords, setEnrollmentRecords] = useState<EnrollmentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<EnrollmentRecord[]>([]);
  const [statistics, setStatistics] = useState<EnrollmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 필터링 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    loadEnrollmentRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [enrollmentRecords, searchQuery, selectedCourse, selectedStatus, selectedCategory, selectedPeriod]);

  const loadEnrollmentRecords = async () => {
    setLoading(true);
    try {
      // 실제로는 API 호출
      const mockData: EnrollmentRecord[] = [
        {
          id: '1',
          studentId: 'ST001',
          studentName: '김영희',
          studentEmail: 'kim.yh@company.com',
          department: '영업팀',
          position: '대리',
          courseId: 'BS-BASIC-001',
          courseName: 'BS 기초 과정',
          courseCode: 'BS-BASIC',
          courseCategory: 'mandatory',
          round: 1,
          enrollmentDate: '2024-01-10',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          status: 'completed',
          attendanceRate: 95,
          currentProgress: 100,
          instructorName: '박강사',
          enrollmentMethod: 'automatic',
          maxStudents: 20,
          currentStudents: 18,
          notes: '필수 과정 자동 등록'
        },
        {
          id: '2',
          studentId: 'ST002',
          studentName: '이철수',
          studentEmail: 'lee.cs@company.com',
          department: '마케팅팀',
          position: '과장',
          courseId: 'BS-ADV-001',
          courseName: 'BS 고급 과정',
          courseCode: 'BS-ADV',
          courseCategory: 'optional',
          round: 1,
          enrollmentDate: '2024-01-25',
          startDate: '2024-02-01',
          endDate: '2024-03-01',
          status: 'completed',
          attendanceRate: 100,
          currentProgress: 100,
          instructorName: '김강사',
          enrollmentMethod: 'self',
          maxStudents: 15,
          currentStudents: 12
        },
        {
          id: '3',
          studentId: 'ST003',
          studentName: '박민준',
          studentEmail: 'park.mj@company.com',
          department: '개발팀',
          position: '사원',
          courseId: 'BS-BASIC-002',
          courseName: 'BS 기초 과정 2차',
          courseCode: 'BS-BASIC',
          courseCategory: 'mandatory',
          round: 2,
          enrollmentDate: '2024-02-20',
          startDate: '2024-03-01',
          endDate: '2024-04-01',
          status: 'in-progress',
          attendanceRate: 88,
          currentProgress: 75,
          instructorName: '박강사',
          enrollmentMethod: 'manual',
          maxStudents: 20,
          currentStudents: 19,
          notes: '중도 합류'
        },
        {
          id: '4',
          studentId: 'ST004',
          studentName: '최지원',
          studentEmail: 'choi.jw@company.com',
          department: 'HR팀',
          position: '사원',
          courseId: 'BS-LEADER-001',
          courseName: 'BS 리더십 과정',
          courseCode: 'BS-LEADER',
          courseCategory: 'leadership',
          round: 1,
          enrollmentDate: '2024-03-05',
          startDate: '2024-03-15',
          endDate: '2024-04-15',
          status: 'enrolled',
          currentProgress: 0,
          instructorName: '이강사',
          enrollmentMethod: 'self',
          maxStudents: 10,
          currentStudents: 8
        },
        {
          id: '5',
          studentId: 'ST005',
          studentName: '정수민',
          studentEmail: 'jung.sm@company.com',
          department: '재무팀',
          position: '대리',
          courseId: 'BS-ADV-002',
          courseName: 'BS 고급 과정 2차',
          courseCode: 'BS-ADV',
          courseCategory: 'optional',
          round: 2,
          enrollmentDate: '2024-02-10',
          startDate: '2024-03-01',
          endDate: '2024-04-01',
          status: 'dropped',
          attendanceRate: 45,
          currentProgress: 30,
          instructorName: '김강사',
          enrollmentMethod: 'self',
          maxStudents: 15,
          currentStudents: 11,
          notes: '개인 사정으로 중도 포기'
        }
      ];

      setEnrollmentRecords(mockData);
      calculateStatistics(mockData);
    } catch (error) {
      console.error('수강 이력 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (records: EnrollmentRecord[]) => {
    const stats: EnrollmentStatistics = {
      totalEnrollments: records.length,
      activeEnrollments: records.filter(r => ['enrolled', 'in-progress'].includes(r.status)).length,
      completedEnrollments: records.filter(r => r.status === 'completed').length,
      droppedEnrollments: records.filter(r => r.status === 'dropped').length,
      pendingEnrollments: records.filter(r => r.status === 'pending').length,
      averageProgress: records.length > 0 
        ? records.reduce((sum, r) => sum + (r.currentProgress || 0), 0) / records.length 
        : 0
    };

    setStatistics(stats);
  };

  const applyFilters = () => {
    let filtered = enrollmentRecords;

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 과정 필터
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(record => record.courseCode === selectedCourse);
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => record.courseCategory === selectedCategory);
    }

    // 기간 필터
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const periodDate = new Date();
      
      switch (selectedPeriod) {
        case '1month':
          periodDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          periodDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          periodDate.setMonth(now.getMonth() - 6);
          break;
        case '1year':
          periodDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(record => 
        new Date(record.enrollmentDate) >= periodDate
      );
    }

    setFilteredRecords(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'enrolled':
        return 'text-purple-600 bg-purple-100';
      case 'dropped':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '수료 완료';
      case 'in-progress':
        return '수강 중';
      case 'enrolled':
        return '등록됨';
      case 'dropped':
        return '중도 포기';
      case 'pending':
        return '대기 중';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'mandatory':
        return '필수';
      case 'optional':
        return '선택';
      case 'leadership':
        return '리더십';
      default:
        return category;
    }
  };

  const getEnrollmentMethodLabel = (method: string) => {
    switch (method) {
      case 'manual':
        return '수동 등록';
      case 'self':
        return '자가 등록';
      case 'automatic':
        return '자동 등록';
      default:
        return method;
    }
  };

  const exportToExcel = () => {
    // Excel 내보내기 기능 구현
    console.log('Excel 내보내기:', filteredRecords);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">수강 이력 관리</h1>
          <p className="text-gray-600">교육생들의 과정 수강 현황 및 등록 이력을 관리합니다</p>
        </div>
        <button
          onClick={exportToExcel}
          className="btn-success"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          <span>Excel 내보내기</span>
        </button>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 등록</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalEnrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수강 중</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeEnrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수료 완료</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.completedEnrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">중도 포기</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.droppedEnrollments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 진도</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.averageProgress.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 검색 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="교육생명, 과정명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 과정 필터 */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 과정</option>
            <option value="BS-BASIC">BS 기초 과정</option>
            <option value="BS-ADV">BS 고급 과정</option>
            <option value="BS-LEADER">BS 리더십 과정</option>
          </select>

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="enrolled">등록됨</option>
            <option value="in-progress">수강 중</option>
            <option value="completed">수료 완료</option>
            <option value="dropped">중도 포기</option>
            <option value="pending">대기 중</option>
          </select>

          {/* 카테고리 필터 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 카테고리</option>
            <option value="mandatory">필수 과정</option>
            <option value="optional">선택 과정</option>
            <option value="leadership">리더십 과정</option>
          </select>

          {/* 기간 필터 */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 기간</option>
            <option value="1month">최근 1개월</option>
            <option value="3months">최근 3개월</option>
            <option value="6months">최근 6개월</option>
            <option value="1year">최근 1년</option>
          </select>
        </div>
      </div>

      {/* 수강 이력 테이블 */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  교육생 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과정 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  진행 상황
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {record.studentName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                        <div className="text-sm text-gray-500">{record.department} · {record.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.courseName}</div>
                    <div className="text-sm text-gray-500">
                      {record.courseCode} · {record.round}차 · {getCategoryLabel(record.courseCategory)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.enrollmentDate}</div>
                    <div className="text-sm text-gray-500">{getEnrollmentMethodLabel(record.enrollmentMethod)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>진도율</span>
                          <span>{record.currentProgress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${record.currentProgress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    {record.attendanceRate && (
                      <div className="text-xs text-gray-500 mt-1">
                        출석률: {record.attendanceRate}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {getStatusLabel(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="상세 보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="수정"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">수강 이력이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">조건에 맞는 수강 이력을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentHistory;