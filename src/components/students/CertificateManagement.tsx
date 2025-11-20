import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface Certificate {
  id: string;
  certificateNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  position: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  completionDate: string;
  issueDate?: string;
  issueRequestDate: string;
  finalScore: number;
  grade: string;
  totalHours: number;
  instructorName: string;
  status: 'pending' | 'approved' | 'issued' | 'rejected';
  template: 'standard' | 'leadership' | 'excellence';
  issuedBy: string;
  validUntil?: string;
  downloadCount: number;
  printCount: number;
  notes?: string;
  rejectionReason?: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  criteria: string;
  active: boolean;
}

const CertificateManagement: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  
  // 필터링 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  useEffect(() => {
    loadCertificates();
    loadTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [certificates, searchQuery, selectedStatus, selectedTemplate, selectedPeriod]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      // 실제로는 API 호출
      const mockData: Certificate[] = [
        {
          id: '1',
          certificateNumber: 'CERT-2024-001',
          studentId: 'ST001',
          studentName: '김영희',
          studentEmail: 'kim.yh@company.com',
          department: '영업팀',
          position: '대리',
          courseId: 'BS-BASIC-001',
          courseName: 'BS 기초 과정',
          courseCode: 'BS-BASIC',
          completionDate: '2024-02-14',
          issueDate: '2024-02-15',
          issueRequestDate: '2024-02-14',
          finalScore: 87.5,
          grade: 'A',
          totalHours: 40,
          instructorName: '박강사',
          status: 'issued',
          template: 'standard',
          issuedBy: '교육담당자',
          validUntil: '2026-02-14',
          downloadCount: 3,
          printCount: 1,
          notes: '우수 성과로 발급'
        },
        {
          id: '2',
          certificateNumber: 'CERT-2024-002',
          studentId: 'ST002',
          studentName: '이철수',
          studentEmail: 'lee.cs@company.com',
          department: '마케팅팀',
          position: '과장',
          courseId: 'BS-ADV-001',
          courseName: 'BS 고급 과정',
          courseCode: 'BS-ADV',
          completionDate: '2024-02-28',
          issueDate: '2024-03-01',
          issueRequestDate: '2024-02-28',
          finalScore: 93.5,
          grade: 'A+',
          totalHours: 60,
          instructorName: '김강사',
          status: 'issued',
          template: 'excellence',
          issuedBy: '교육담당자',
          validUntil: '2026-02-28',
          downloadCount: 2,
          printCount: 0
        },
        {
          id: '3',
          certificateNumber: 'CERT-2024-003',
          studentId: 'ST003',
          studentName: '박민준',
          studentEmail: 'park.mj@company.com',
          department: '개발팀',
          position: '사원',
          courseId: 'BS-BASIC-002',
          courseName: 'BS 기초 과정 2차',
          courseCode: 'BS-BASIC',
          completionDate: '2024-03-30',
          issueRequestDate: '2024-03-30',
          finalScore: 80,
          grade: 'B+',
          totalHours: 40,
          instructorName: '박강사',
          status: 'pending',
          template: 'standard',
          issuedBy: '',
          downloadCount: 0,
          printCount: 0,
          notes: '발급 대기 중'
        },
        {
          id: '4',
          certificateNumber: '',
          studentId: 'ST004',
          studentName: '최지원',
          studentEmail: 'choi.jw@company.com',
          department: 'HR팀',
          position: '사원',
          courseId: 'BS-LEADER-001',
          courseName: 'BS 리더십 과정',
          courseCode: 'BS-LEADER',
          completionDate: '2024-04-15',
          issueRequestDate: '2024-04-15',
          finalScore: 95,
          grade: 'A+',
          totalHours: 50,
          instructorName: '이강사',
          status: 'approved',
          template: 'leadership',
          issuedBy: '',
          downloadCount: 0,
          printCount: 0
        }
      ];

      setCertificates(mockData);
    } catch (error) {
      console.error('인증서 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const mockTemplates: CertificateTemplate[] = [
        {
          id: 'standard',
          name: '표준 수료증',
          description: '일반적인 과정 수료를 위한 기본 템플릿',
          criteria: '과정 수료 + 60점 이상',
          active: true
        },
        {
          id: 'leadership',
          name: '리더십 인증서',
          description: '리더십 과정 전용 고급 템플릿',
          criteria: '리더십 과정 수료 + 80점 이상',
          active: true
        },
        {
          id: 'excellence',
          name: '우수 수료증',
          description: '우수한 성과를 거둔 수료자를 위한 특별 템플릿',
          criteria: '90점 이상 + 출석률 95% 이상',
          active: true
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
    }
  };

  const applyFilters = () => {
    let filtered = certificates;

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(cert =>
        cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cert => cert.status === selectedStatus);
    }

    // 템플릿 필터
    if (selectedTemplate !== 'all') {
      filtered = filtered.filter(cert => cert.template === selectedTemplate);
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
      
      filtered = filtered.filter(cert => 
        new Date(cert.issueRequestDate) >= periodDate
      );
    }

    setFilteredCertificates(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'text-green-600 bg-green-500/10';
      case 'approved':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-orange-600 bg-yellow-100';
      case 'rejected':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'issued':
        return '발급 완료';
      case 'approved':
        return '승인됨';
      case 'pending':
        return '승인 대기';
      case 'rejected':
        return '반려됨';
      default:
        return status;
    }
  };

  const getTemplateLabel = (template: string) => {
    const t = templates.find(temp => temp.id === template);
    return t ? t.name : template;
  };

  const handleApprove = async (certificateId: string) => {
    try {
      // 실제로는 API 호출
      setCertificates(prev => prev.map(cert => 
        cert.id === certificateId 
          ? { ...cert, status: 'approved' as const }
          : cert
      ));
      console.log('인증서 승인:', certificateId);
    } catch (error) {
      console.error('승인 실패:', error);
    }
  };

  const handleReject = async (certificateId: string, reason: string) => {
    try {
      // 실제로는 API 호출
      setCertificates(prev => prev.map(cert => 
        cert.id === certificateId 
          ? { ...cert, status: 'rejected' as const, rejectionReason: reason }
          : cert
      ));
      console.log('인증서 반려:', certificateId, reason);
    } catch (error) {
      console.error('반려 실패:', error);
    }
  };

  const handleIssue = async (certificateId: string) => {
    try {
      const certificateNumber = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const validUntil = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 2년 후
      
      setCertificates(prev => prev.map(cert => 
        cert.id === certificateId 
          ? { 
              ...cert, 
              status: 'issued' as const, 
              certificateNumber,
              issueDate,
              validUntil,
              issuedBy: user?.name || '시스템'
            }
          : cert
      ));
      console.log('인증서 발급:', certificateId);
    } catch (error) {
      console.error('발급 실패:', error);
    }
  };

  const handleDownload = async (certificateId: string) => {
    try {
      // 실제로는 PDF 생성 및 다운로드
      setCertificates(prev => prev.map(cert => 
        cert.id === certificateId 
          ? { ...cert, downloadCount: cert.downloadCount + 1 }
          : cert
      ));
      console.log('인증서 다운로드:', certificateId);
    } catch (error) {
      console.error('다운로드 실패:', error);
    }
  };

  const handlePrint = async (certificateId: string) => {
    try {
      // 실제로는 인쇄 대화상자 열기
      setCertificates(prev => prev.map(cert => 
        cert.id === certificateId 
          ? { ...cert, printCount: cert.printCount + 1 }
          : cert
      ));
      console.log('인증서 인쇄:', certificateId);
    } catch (error) {
      console.error('인쇄 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인증서 발급 관리</h1>
          <p className="text-gray-600">수료증 및 인증서 발급 요청을 관리합니다</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            <span>수동 발급</span>
          </button>
          <button className="btn-primary rounded-full">
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>일괄 다운로드</span>
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <ClockIcon className="h-6 w-6 text-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <CheckBadgeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">승인됨</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500/10">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">발급 완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'issued').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-destructive/10">
              <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">반려됨</p>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter(c => c.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="교육생명, 과정명, 인증서 번호..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="pending">승인 대기</option>
            <option value="approved">승인됨</option>
            <option value="issued">발급 완료</option>
            <option value="rejected">반려됨</option>
          </select>

          {/* 템플릿 필터 */}
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 템플릿</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>

          {/* 기간 필터 */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 기간</option>
            <option value="1month">최근 1개월</option>
            <option value="3months">최근 3개월</option>
            <option value="6months">최근 6개월</option>
            <option value="1year">최근 1년</option>
          </select>
        </div>
      </div>

      {/* 인증서 테이블 */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  인증서 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  교육생 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과정 정보
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
              {filteredCertificates.map((certificate) => (
                <tr key={certificate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {certificate.certificateNumber || '미발급'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTemplateLabel(certificate.template)}
                      </div>
                      {certificate.validUntil && (
                        <div className="text-xs text-gray-400">
                          유효기간: {certificate.validUntil}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{certificate.studentName}</div>
                      <div className="text-sm text-gray-500">{certificate.department} · {certificate.position}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{certificate.courseName}</div>
                      <div className="text-sm text-gray-500">
                        수료: {certificate.completionDate} · 점수: {certificate.finalScore} ({certificate.grade})
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(certificate.status)}`}>
                      {getStatusLabel(certificate.status)}
                    </span>
                    {certificate.status === 'issued' && (
                      <div className="text-xs text-gray-500 mt-1">
                        다운로드: {certificate.downloadCount}회 · 인쇄: {certificate.printCount}회
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {certificate.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(certificate.id)}
                            className="text-green-600 hover:text-green-900"
                            title="승인"
                          >
                            <CheckBadgeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(certificate.id, '승인 기준 미충족')}
                            className="text-destructive hover:text-destructive"
                            title="반려"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {certificate.status === 'approved' && (
                        <button
                          onClick={() => handleIssue(certificate.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="발급"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                      )}
                      {certificate.status === 'issued' && (
                        <>
                          <button
                            onClick={() => handleDownload(certificate.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="다운로드"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(certificate.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="인쇄"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedCertificate(certificate)}
                        className="text-gray-600 hover:text-gray-900"
                        title="상세 보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">인증서가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">조건에 맞는 인증서를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateManagement;