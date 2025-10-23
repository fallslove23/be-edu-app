import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  StarIcon,
  CheckBadgeIcon,
  ClockIcon,
  ChartBarIcon,
  UserIcon,
  BookOpenIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface CompletionRecord {
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
  startDate: string;
  endDate: string;
  completionDate: string;
  totalHours: number;
  attendanceRate: number;
  examScore: number;
  practiceScore: number;
  finalScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'F';
  status: 'completed' | 'failed' | 'pending';
  certificateIssued: boolean;
  certificateNumber?: string;
  instructorName: string;
  notes?: string;
}

interface CompletionStatistics {
  totalCompletions: number;
  completionRate: number;
  averageScore: number;
  excellentCount: number; // A+, A
  goodCount: number; // B+, B
  satisfactoryCount: number; // C+, C
  failedCount: number; // F
  certificatesIssued: number;
}

const CompletionHistory: React.FC = () => {
  const { user } = useAuth();
  const [completionRecords, setCompletionRecords] = useState<CompletionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CompletionRecord[]>([]);
  const [statistics, setStatistics] = useState<CompletionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 필터링 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    loadCompletionRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [completionRecords, searchQuery, selectedCourse, selectedGrade, selectedStatus, selectedPeriod]);

  const loadCompletionRecords = async () => {
    setLoading(true);
    try {
      // 실제로는 API 호출
      const mockData: CompletionRecord[] = [
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
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          completionDate: '2024-02-14',
          totalHours: 40,
          attendanceRate: 95,
          examScore: 85,
          practiceScore: 90,
          finalScore: 87.5,
          grade: 'A',
          status: 'completed',
          certificateIssued: true,
          certificateNumber: 'CERT-2024-001',
          instructorName: '박강사',
          notes: '우수한 성과로 수료'
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
          startDate: '2024-02-01',
          endDate: '2024-03-01',
          completionDate: '2024-02-28',
          totalHours: 60,
          attendanceRate: 100,
          examScore: 95,
          practiceScore: 92,
          finalScore: 93.5,
          grade: 'A+',
          status: 'completed',
          certificateIssued: true,
          certificateNumber: 'CERT-2024-002',
          instructorName: '김강사'
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
          startDate: '2024-03-01',
          endDate: '2024-04-01',
          completionDate: '2024-03-30',
          totalHours: 40,
          attendanceRate: 88,
          examScore: 78,
          practiceScore: 82,
          finalScore: 80,
          grade: 'B+',
          status: 'completed',
          certificateIssued: false,
          instructorName: '박강사',
          notes: '인증서 발급 대기'
        }
      ];

      setCompletionRecords(mockData);
      calculateStatistics(mockData);
    } catch (error) {
      console.error('수료 이력 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (records: CompletionRecord[]) => {
    const completedRecords = records.filter(r => r.status === 'completed');
    const totalRecords = records.length;
    
    const stats: CompletionStatistics = {
      totalCompletions: completedRecords.length,
      completionRate: totalRecords > 0 ? (completedRecords.length / totalRecords) * 100 : 0,
      averageScore: completedRecords.length > 0 
        ? completedRecords.reduce((sum, r) => sum + r.finalScore, 0) / completedRecords.length 
        : 0,
      excellentCount: completedRecords.filter(r => ['A+', 'A'].includes(r.grade)).length,
      goodCount: completedRecords.filter(r => ['B+', 'B'].includes(r.grade)).length,
      satisfactoryCount: completedRecords.filter(r => ['C+', 'C'].includes(r.grade)).length,
      failedCount: records.filter(r => r.status === 'failed' || r.grade === 'F').length,
      certificatesIssued: completedRecords.filter(r => r.certificateIssued).length
    };

    setStatistics(stats);
  };

  const applyFilters = () => {
    let filtered = completionRecords;

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

    // 성적 필터
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(record => record.grade === selectedGrade);
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(record => record.status === selectedStatus);
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
        new Date(record.completionDate) >= periodDate
      );
    }

    setFilteredRecords(filtered);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
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
          <h1 className="text-2xl font-bold text-gray-900">수료 이력 관리</h1>
          <p className="text-gray-600">교육생들의 과정 수료 현황 및 성과를 관리합니다</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          <span>Excel 내보내기</span>
        </button>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 수료자</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalCompletions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">수료율</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <CheckBadgeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">인증서 발급</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.certificatesIssued}</p>
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

          {/* 성적 필터 */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 성적</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="C+">C+</option>
            <option value="C">C</option>
            <option value="F">F</option>
          </select>

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="completed">수료 완료</option>
            <option value="failed">수료 실패</option>
            <option value="pending">수료 대기</option>
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

      {/* 수료 이력 테이블 */}
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
                  수료 일자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  성과
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  인증서
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
                          <UserIcon className="h-6 w-6 text-gray-600" />
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
                    <div className="text-sm text-gray-500">{record.courseCode} · {record.totalHours}시간</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.completionDate}</div>
                    <div className="text-sm text-gray-500">출석률: {record.attendanceRate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(record.grade)}`}>
                        {record.grade}
                      </span>
                      <span className="text-sm text-gray-900">{record.finalScore}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      이론: {record.examScore} · 실습: {record.practiceScore}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status === 'completed' ? '수료 완료' : 
                       record.status === 'failed' ? '수료 실패' : '수료 대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.certificateIssued ? (
                      <div className="flex items-center text-green-600">
                        <CheckBadgeIcon className="h-4 w-4 mr-1" />
                        <span>발급완료</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>발급대기</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">수료 이력이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">조건에 맞는 수료 이력을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletionHistory;