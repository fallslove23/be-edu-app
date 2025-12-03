import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  GraduationCap,
  Trophy,
  Clock,
  Eye,
  Pencil,
  UserPlus,
  FileDown,
  BarChart2,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import StudentProfile from './StudentProfile';
import PerformanceReportGenerator from './PerformanceReportGenerator';
import AdvancedSearch, { SearchFilter, SearchQuery } from '../common/AdvancedSearch';
import { useAuth } from '../../contexts/AuthContext';
import type { StudentListItem, StudentStatistics, StudentSearchFilters } from '../../types/student.types';

const StudentManagement: React.FC = () => {
  const { user } = useAuth();

  // 권한 체크: 강사는 읽기 전용, 관리자/운영자는 전체 권한
  const isInstructor = user?.role === 'instructor';
  const canModifyStudents = !isInstructor; // 강사가 아닌 경우에만 수정 가능

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentListItem[]>([]);
  const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StudentSearchFilters>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<SearchQuery | null>(null);

  // 고급 검색 필터 정의
  const searchFilters: SearchFilter[] = [
    {
      id: 'department',
      type: 'select',
      label: '부서',
      options: [
        { value: '영업1팀', label: '영업1팀' },
        { value: '영업2팀', label: '영업2팀' },
        { value: '마케팅팀', label: '마케팅팀' },
        { value: '개발팀', label: '개발팀' },
        { value: '인사팀', label: '인사팀' }
      ]
    },
    {
      id: 'position',
      type: 'multiselect',
      label: '직급',
      options: [
        { value: '사원', label: '사원' },
        { value: '대리', label: '대리' },
        { value: '과장', label: '과장' },
        { value: '차장', label: '차장' },
        { value: '부장', label: '부장' }
      ]
    },
    {
      id: 'courseType',
      type: 'select',
      label: '과정 유형',
      options: [
        { value: 'BS-BASIC', label: 'BS 기초과정' },
        { value: 'BS-ADVANCED', label: 'BS 고급과정' },
        { value: 'BS-EXPERT', label: 'BS 전문가과정' }
      ]
    },
    {
      id: 'enrollmentPeriod',
      type: 'daterange',
      label: '등록 기간'
    },
    {
      id: 'progressRange',
      type: 'range',
      label: '학습 진도 (%)',
      min: 0,
      max: 100
    },
    {
      id: 'scoreRange',
      type: 'range',
      label: '평균 점수',
      min: 0,
      max: 100
    },
    {
      id: 'status',
      type: 'select',
      label: '상태',
      options: [
        { value: 'active', label: '수강중' },
        { value: 'completed', label: '수료' },
        { value: 'dropped', label: '중도탈락' },
        { value: 'pending', label: '대기중' }
      ]
    },
    {
      id: 'hasCompletedCourse',
      type: 'boolean',
      label: '수료 경험'
    }
  ];

  // 고급 검색 핸들러
  const handleAdvancedSearch = (searchQuery: SearchQuery) => {
    setCurrentSearchQuery(searchQuery);
    applyFilters(searchQuery);
  };

  // 필터 적용 함수
  const applyFilters = (query: SearchQuery) => {
    let filtered = students;

    // 텍스트 검색
    if (query.searchText) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query.searchText.toLowerCase()) ||
        student.department.toLowerCase().includes(query.searchText.toLowerCase()) ||
        student.position.toLowerCase().includes(query.searchText.toLowerCase()) ||
        student.currentCourses.some(course =>
          course.courseCode.toLowerCase().includes(query.searchText.toLowerCase()) ||
          course.courseName.toLowerCase().includes(query.searchText.toLowerCase())
        )
      );
    }

    // 필터 적용
    Object.entries(query.filters).forEach(([filterId, value]) => {
      if (!value) return;

      switch (filterId) {
        case 'department':
          filtered = filtered.filter(student => student.department === value);
          break;
        case 'position':
          if (Array.isArray(value) && value.length > 0) {
            filtered = filtered.filter(student => value.includes(student.position));
          }
          break;
        case 'courseType':
          filtered = filtered.filter(student =>
            student.currentCourses.some(course => course.courseCode.startsWith(value))
          );
          break;
        case 'enrollmentPeriod':
          if (value.start || value.end) {
            filtered = filtered.filter(student => {
              const enrollmentDate = new Date(student.enrollmentDate);
              const start = value.start ? new Date(value.start) : new Date('1970-01-01');
              const end = value.end ? new Date(value.end) : new Date();
              return enrollmentDate >= start && enrollmentDate <= end;
            });
          }
          break;
        case 'progressRange':
          if (value.min !== undefined || value.max !== undefined) {
            filtered = filtered.filter(student => {
              const avgProgress = student.currentCourses.reduce((sum, course) => sum + course.progress, 0) / student.currentCourses.length;
              const min = value.min !== undefined ? Number(value.min) : 0;
              const max = value.max !== undefined ? Number(value.max) : 100;
              return avgProgress >= min && avgProgress <= max;
            });
          }
          break;
        case 'scoreRange':
          if (value.min !== undefined || value.max !== undefined) {
            filtered = filtered.filter(student => {
              const min = value.min !== undefined ? Number(value.min) : 0;
              const max = value.max !== undefined ? Number(value.max) : 100;
              return student.averageScore >= min && student.averageScore <= max;
            });
          }
          break;
        case 'status':
          filtered = filtered.filter(student => student.status === value);
          break;
        case 'hasCompletedCourse':
          filtered = filtered.filter(student =>
            value === true ? student.completedCourses > 0 : student.completedCourses === 0
          );
          break;
      }
    });

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (query.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'score':
          aValue = a.averageScore;
          bValue = b.averageScore;
          break;
        case 'createdAt':
        case 'updatedAt':
        default:
          aValue = new Date(a.enrollmentDate);
          bValue = new Date(b.enrollmentDate);
      }

      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStudents(filtered);
  };

  useEffect(() => {
    const generateSampleData = () => {
      const sampleStudents: StudentListItem[] = [
        {
          id: 'student-1',
          name: '김교육',
          department: '영업1팀',
          position: '사원',
          currentCourses: [
            {
              courseCode: 'BS-2025-01',
              courseName: 'BS 신입 영업사원 기초과정',
              progress: 20
            },
            {
              courseCode: 'BS-2025-03',
              courseName: 'BS 신입 영업사원 기초과정',
              progress: 0
            }
          ],
          overallGrade: 4.2,
          attendanceRate: 97.5,
          lastActiveAt: '2025-01-26T16:30:00Z'
        },
        {
          id: 'student-2',
          name: '이학습',
          department: '영업2팀',
          position: '주임',
          currentCourses: [
            {
              courseCode: 'BS-2025-02',
              courseName: 'BS 고급 영업 전략과정',
              progress: 46.9
            }
          ],
          overallGrade: 4.5,
          attendanceRate: 100,
          lastActiveAt: '2025-01-25T14:20:00Z'
        },
        {
          id: 'student-3',
          name: '박성장',
          department: '마케팅팀',
          position: '대리',
          currentCourses: [
            {
              courseCode: 'BS-2025-01',
              courseName: 'BS 신입 영업사원 기초과정',
              progress: 15
            }
          ],
          overallGrade: 3.8,
          attendanceRate: 90,
          lastActiveAt: '2025-01-24T11:15:00Z'
        },
        {
          id: 'student-4',
          name: '최발전',
          department: '영업1팀',
          position: '사원',
          currentCourses: [],
          overallGrade: 4.8,
          attendanceRate: 98,
          lastActiveAt: '2025-01-20T09:30:00Z'
        },
        {
          id: 'student-5',
          name: '정우수',
          department: '영업3팀',
          position: '사원',
          currentCourses: [
            {
              courseCode: 'BS-2025-02',
              courseName: 'BS 고급 영업 전략과정',
              progress: 60
            }
          ],
          overallGrade: 4.3,
          attendanceRate: 95,
          lastActiveAt: '2025-01-26T15:45:00Z'
        },
        {
          id: 'student-6',
          name: '한동시',
          department: '영업1팀',
          position: '사원',
          currentCourses: [
            {
              courseCode: 'BS-2025-01',
              courseName: 'BS 신입 영업사원 기초과정',
              progress: 20
            },
            {
              courseCode: 'BS-2025-02',
              courseName: 'BS 고급 영업 전략과정',
              progress: 5
            }
          ],
          overallGrade: 4.1,
          attendanceRate: 92,
          lastActiveAt: '2025-01-25T13:20:00Z'
        },
        {
          id: 'student-7',
          name: '장진보',
          department: '영업3팀',
          position: '주임',
          currentCourses: [
            {
              courseCode: 'BS-2025-03',
              courseName: 'BS 신입 영업사원 기초과정',
              progress: 10
            }
          ],
          overallGrade: 4.4,
          attendanceRate: 96,
          lastActiveAt: '2025-01-26T09:45:00Z'
        },
        {
          id: 'student-8',
          name: '윤성과',
          department: '영업2팀',
          position: '대리',
          currentCourses: [
            {
              courseCode: 'BS-2025-02',
              courseName: 'BS 고급 영업 전략과정',
              progress: 30
            }
          ],
          overallGrade: 4.6,
          attendanceRate: 98,
          lastActiveAt: '2025-01-26T11:30:00Z'
        }
      ];

      const sampleStatistics: StudentStatistics = {
        totalStudents: 145,
        activeStudents: 112,
        completedStudents: 78,
        averageGrade: 4.2,
        averageAttendance: 94.8,
        averageSatisfaction: 4.5,
        courseStatistics: [
          {
            courseCode: 'BS-2025-01',
            courseName: 'BS 신입 영업사원 기초과정 (1차)',
            totalEnrolled: 48,
            completed: 32,
            dropped: 2,
            averageGrade: 4.0,
            completionRate: 93.8
          },
          {
            courseCode: 'BS-2025-02',
            courseName: 'BS 고급 영업 전략과정 (2차)',
            totalEnrolled: 35,
            completed: 22,
            dropped: 1,
            averageGrade: 4.3,
            completionRate: 94.3
          },
          {
            courseCode: 'BS-2025-03',
            courseName: 'BS 신입 영업사원 기초과정 (3차)',
            totalEnrolled: 28,
            completed: 0,
            dropped: 0,
            averageGrade: 0,
            completionRate: 0
          }
        ],
        monthlyEnrollments: [
          { month: '2024-11', count: 25 },
          { month: '2024-12', count: 18 },
          { month: '2025-01', count: 32 }
        ],
        monthlyCompletions: [
          { month: '2024-11', count: 15 },
          { month: '2024-12', count: 22 },
          { month: '2025-01', count: 8 }
        ]
      };

      return { students: sampleStudents, statistics: sampleStatistics };
    };

    setLoading(true);
    setTimeout(() => {
      const { students: studentData, statistics: statsData } = generateSampleData();
      setStudents(studentData);
      setFilteredStudents(studentData);
      setStatistics(statsData);
      setLoading(false);
    }, 800);
  }, []);

  // 초기 검색 설정
  useEffect(() => {
    if (students.length > 0 && !currentSearchQuery) {
      // 기본 검색 쿼리 설정
      const defaultQuery: SearchQuery = {
        searchText: '',
        filters: {},
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      handleAdvancedSearch(defaultQuery);
    }
  }, [students]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 4.0) return 'text-green-600';
    if (grade >= 3.5) return 'text-blue-600';
    if (grade >= 3.0) return 'text-foreground';
    return 'text-destructive';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-blue-600';
    if (rate >= 80) return 'text-foreground';
    return 'text-destructive';
  };

  // 학생 프로필 뷰
  if (selectedStudentId) {
    return (
      <StudentProfile
        studentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">교육생 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <div className="p-3 bg-blue-50 rounded-xl mr-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                교육생 종합 관리
              </h1>
              <p className="text-gray-600">
                {isInstructor
                  ? '교육생 현황 및 학습 이력을 조회할 수 있습니다. (조회 전용)'
                  : '교육생 현황 및 학습 이력을 종합적으로 관리하세요.'
                }
              </p>
              {isInstructor && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <ClipboardList className="inline-block w-4 h-4 mr-1" />
                    강사 권한으로 로그인하셨습니다. 교육생 정보 조회만 가능합니다.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  목록
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  카드
                </button>
              </div>
              {canModifyStudents && (
                <button
                  onClick={() => {/* 새 교육생 등록 */ }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-sm transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>교육생 등록</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 통계 대시보드 */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">전체 교육생</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">활성 교육생</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.activeStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">수료 완료</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.completedStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-foreground" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 성적</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.averageGrade.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <BarChart2 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 출석률</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.averageAttendance.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 고급 검색 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AdvancedSearch
            filters={searchFilters}
            onSearch={handleAdvancedSearch}
            placeholder="교육생 이름, 부서, 직급, 과정명으로 검색..."
            showResults={true}
            resultCount={filteredStudents.length}
            recentSearches={[
              '김교육',
              '영업1팀',
              'BS 기초과정',
              '수료',
              '사원'
            ]}
            suggestions={[
              '김교육',
              '이학습',
              '박성장',
              '영업1팀',
              '영업2팀',
              '마케팅팀',
              'BS 기초과정',
              'BS 고급과정'
            ]}
          />

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {/* 엑셀 다운로드 */ }}
              className="flex items-center space-x-1 border border-gray-300 rounded-full px-3 py-2 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              <span>엑셀 다운로드</span>
            </button>

            <button
              onClick={() => setShowReportGenerator(true)}
              className="btn-success flex items-center space-x-1 rounded-full px-3 py-2"
            >
              <BarChart2 className="h-4 w-4" />
              <span>성과 리포트</span>
            </button>
          </div>
        </div>

        {/* 교육생 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              교육생 목록 ({filteredStudents.length})
            </h3>
          </div>

          {viewMode === 'list' ? (
            // 목록 뷰
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      교육생 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      현재 수강 과정
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      성적
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      출석률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최근 활동
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.department} · {student.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.currentCourses.length > 0 ? (
                          <div className="space-y-1">
                            {student.currentCourses.map((course, index) => (
                              <div key={index}>
                                <div className="text-sm font-medium text-gray-900">{course.courseCode}</div>
                                <div className="text-sm text-gray-500">{course.courseName}</div>
                                <div className="mt-1">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-lg h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-lg"
                                        style={{ width: `${course.progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{course.progress}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">수강 중인 과정 없음</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getGradeColor(student.overallGrade)}`}>
                          {student.overallGrade.toFixed(1)}/5.0
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                          {student.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(student.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedStudentId(student.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="상세보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canModifyStudents && (
                            <button
                              onClick={() => {/* 편집 */ }}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="편집"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
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
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      {student.department} · {student.position}
                    </div>

                    {student.currentCourses.length > 0 ? (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">현재 수강 과정</div>
                        {student.currentCourses.map((course, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-900">{course.courseCode}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-lg h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-lg"
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{course.progress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3 text-sm text-gray-500">
                        수강 중인 과정 없음
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        성적: <span className={`font-medium ${getGradeColor(student.overallGrade)}`}>
                          {student.overallGrade.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        출석: <span className={`font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                          {student.attendanceRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">교육생이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || Object.keys(filters).length > 0
                  ? '검색 조건에 맞는 교육생이 없습니다.'
                  : '등록된 교육생이 없습니다.'
                }
              </p>
              <button
                onClick={() => {/* 교육생 등록 */ }}
                className="btn-primary px-4 py-2 rounded-full"
              >
                첫 교육생 등록하기
              </button>
            </div>
          )}
        </div>

        {/* 성과 리포트 생성기 모달 */}
        {showReportGenerator && (
          <PerformanceReportGenerator
            onClose={() => setShowReportGenerator(false)}
          />
        )}
      </div>
    </div>
  );
};

export default StudentManagement;