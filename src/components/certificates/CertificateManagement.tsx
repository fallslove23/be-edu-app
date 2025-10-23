import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import CertificatePreview from './CertificatePreview';

type CertificateStatus = 'eligible' | 'issued' | 'not_eligible' | 'pending_review';
type ViewType = 'dashboard' | 'eligible' | 'issued' | 'templates' | 'bulk';

interface Student {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  department: string;
  position: string;
  course_id: string;
  course_name: string;
  session_name: string;
  enrollment_date: string;
  completion_date?: string;
  attendance_rate: number;
  exam_scores: number[];
  final_score: number;
  certificate_status: CertificateStatus;
  certificate_issued_date?: string;
  certificate_number?: string;
}

interface CompletionCriteria {
  minimum_attendance: number;
  minimum_exam_score: number;
  required_assignments: number;
  minimum_final_score: number;
}

interface Certificate {
  id: string;
  student_id: string;
  student_name: string;
  course_name: string;
  session_name: string;
  certificate_number: string;
  issued_date: string;
  completion_date: string;
  final_score: number;
  template_id: string;
  issuer_name: string;
  status: 'active' | 'revoked';
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  course_category: string;
  background_image?: string;
  logo_position: 'top-left' | 'top-center' | 'top-right';
  title_text: string;
  content_template: string;
  signature_fields: string[];
  created_date: string;
  is_default: boolean;
}

const CertificateManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // 수료 기준
  const completionCriteria: CompletionCriteria = {
    minimum_attendance: 80,
    minimum_exam_score: 70,
    required_assignments: 2,
    minimum_final_score: 70
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 목업 학생 데이터
      const mockStudents: Student[] = [
        {
          id: 'student-1',
          name: '김민수',
          email: 'kim@company.com',
          employee_id: 'EMP001',
          department: '영업팀',
          position: '과장',
          course_id: 'course-1',
          course_name: 'BS 영업 기초과정',
          session_name: '2024년 2차',
          enrollment_date: '2024-08-01',
          completion_date: '2024-08-15',
          attendance_rate: 95,
          exam_scores: [85, 88, 92],
          final_score: 88,
          certificate_status: 'eligible',
          certificate_issued_date: undefined,
          certificate_number: undefined
        },
        {
          id: 'student-2',
          name: '이영희',
          email: 'lee@company.com',
          employee_id: 'EMP002',
          department: '마케팅팀',
          position: '대리',
          course_id: 'course-1',
          course_name: 'BS 영업 기초과정',
          session_name: '2024년 2차',
          enrollment_date: '2024-08-01',
          completion_date: '2024-08-15',
          attendance_rate: 90,
          exam_scores: [92, 85, 89],
          final_score: 89,
          certificate_status: 'issued',
          certificate_issued_date: '2024-08-16',
          certificate_number: 'CERT-2024-001'
        },
        {
          id: 'student-3',
          name: '박정우',
          email: 'park@company.com',
          employee_id: 'EMP003',
          department: '영업팀',
          position: '사원',
          course_id: 'course-1',
          course_name: 'BS 영업 기초과정',
          session_name: '2024년 2차',
          enrollment_date: '2024-08-01',
          completion_date: undefined,
          attendance_rate: 75,
          exam_scores: [65, 68],
          final_score: 66,
          certificate_status: 'not_eligible',
          certificate_issued_date: undefined,
          certificate_number: undefined
        },
        {
          id: 'student-4',
          name: '최수현',
          email: 'choi@company.com',
          employee_id: 'EMP004',
          department: '고객서비스팀',
          position: '주임',
          course_id: 'course-2',
          course_name: 'BS 고급 영업 전략',
          session_name: '2024년 1차',
          enrollment_date: '2024-08-20',
          completion_date: '2024-09-05',
          attendance_rate: 88,
          exam_scores: [88, 92, 85],
          final_score: 88,
          certificate_status: 'eligible',
          certificate_issued_date: undefined,
          certificate_number: undefined
        }
      ];

      // 목업 수료증 데이터
      const mockCertificates: Certificate[] = [
        {
          id: 'cert-1',
          student_id: 'student-2',
          student_name: '이영희',
          course_name: 'BS 영업 기초과정',
          session_name: '2024년 2차',
          certificate_number: 'CERT-2024-001',
          issued_date: '2024-08-16',
          completion_date: '2024-08-15',
          final_score: 89,
          template_id: 'template-1',
          issuer_name: 'BS교육연구소',
          status: 'active'
        }
      ];

      // 목업 템플릿 데이터
      const mockTemplates: CertificateTemplate[] = [
        {
          id: 'template-1',
          name: 'BS 표준 수료증',
          description: 'BS 교육과정의 기본 수료증 템플릿',
          course_category: 'BS 영업 과정',
          logo_position: 'top-center',
          title_text: '수 료 증',
          content_template: `위 사람은 {course_name} {session_name}을(를) 성실히 이수하였기에 이 증서를 수여합니다.
          
수료일: {completion_date}
최종성적: {final_score}점

BS교육연구소장`,
          signature_fields: ['BS교육연구소장', '교육담당자'],
          created_date: '2024-01-01',
          is_default: true
        },
        {
          id: 'template-2',
          name: 'BS 우수 수료증',
          description: '90점 이상 우수 수료자를 위한 특별 템플릿',
          course_category: 'BS 영업 과정',
          logo_position: 'top-center',
          title_text: '우수 수료증',
          content_template: `위 사람은 {course_name} {session_name}을(를) 우수한 성적으로 이수하였기에 이 증서를 수여합니다.
          
수료일: {completion_date}
최종성적: {final_score}점 (우수)

BS교육연구소장`,
          signature_fields: ['BS교육연구소장', '교육담당자'],
          created_date: '2024-01-01',
          is_default: false
        }
      ];

      setStudents(mockStudents);
      setCertificates(mockCertificates);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load certificate data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 수료 자격 확인
  const checkEligibility = (student: Student): boolean => {
    return (
      student.attendance_rate >= completionCriteria.minimum_attendance &&
      student.final_score >= completionCriteria.minimum_final_score &&
      student.exam_scores.length >= completionCriteria.required_assignments &&
      student.exam_scores.every(score => score >= completionCriteria.minimum_exam_score)
    );
  };

  // 수료증 발급
  const issueCertificate = async (studentId: string, templateId: string = 'template-1') => {
    const student = students.find(s => s.id === studentId);
    if (!student || !checkEligibility(student)) {
      alert('수료 기준을 만족하지 않습니다.');
      return;
    }

    const certificateNumber = `CERT-2024-${String(certificates.length + 1).padStart(3, '0')}`;
    const newCertificate: Certificate = {
      id: `cert-${Date.now()}`,
      student_id: studentId,
      student_name: student.name,
      course_name: student.course_name,
      session_name: student.session_name,
      certificate_number: certificateNumber,
      issued_date: new Date().toISOString().split('T')[0],
      completion_date: student.completion_date || new Date().toISOString().split('T')[0],
      final_score: student.final_score,
      template_id: templateId,
      issuer_name: 'BS교육연구소',
      status: 'active'
    };

    // 학생 상태 업데이트
    const updatedStudents = students.map(s => 
      s.id === studentId 
        ? { 
            ...s, 
            certificate_status: 'issued' as CertificateStatus,
            certificate_issued_date: newCertificate.issued_date,
            certificate_number: certificateNumber
          }
        : s
    );

    setStudents(updatedStudents);
    setCertificates([...certificates, newCertificate]);
    
    console.log('수료증 발급:', newCertificate);
  };

  // 일괄 발급
  const bulkIssueCertificates = async () => {
    if (selectedStudents.length === 0) {
      alert('발급할 학생을 선택해주세요.');
      return;
    }

    const eligibleStudents = selectedStudents.filter(studentId => {
      const student = students.find(s => s.id === studentId);
      return student && checkEligibility(student);
    });

    if (eligibleStudents.length === 0) {
      alert('수료 기준을 만족하는 학생이 없습니다.');
      return;
    }

    for (const studentId of eligibleStudents) {
      await issueCertificate(studentId);
    }

    setSelectedStudents([]);
    alert(`${eligibleStudents.length}명의 수료증이 발급되었습니다.`);
  };

  // 미리보기 열기
  const openPreview = (certificateId: string) => {
    const certificate = certificates.find(c => c.id === certificateId);
    const template = templates.find(t => t.id === certificate?.template_id);
    
    if (certificate && template) {
      setPreviewData({
        certificate,
        template,
        certificateData: {
          student_name: certificate.student_name,
          course_name: certificate.course_name,
          session_name: certificate.session_name,
          completion_date: certificate.completion_date,
          final_score: certificate.final_score,
          certificate_number: certificate.certificate_number,
          issued_date: certificate.issued_date,
          issuer_name: certificate.issuer_name
        }
      });
      setShowPreview(true);
    }
  };

  // 템플릿 미리보기
  const previewTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const sampleData = {
        student_name: '홍길동',
        course_name: 'BS 영업 기초과정',
        session_name: '2024년 샘플차수',
        completion_date: '2024-08-31',
        final_score: 85,
        certificate_number: 'CERT-SAMPLE-001',
        issued_date: '2024-09-01',
        issuer_name: 'BS교육연구소'
      };

      setPreviewData({
        template,
        certificateData: sampleData
      });
      setShowPreview(true);
    }
  };

  // 다운로드 및 인쇄 핸들러
  const handleDownload = () => {
    console.log('수료증 다운로드:', previewData);
    // 실제로는 PDF 생성 및 다운로드 로직
  };

  const handlePrint = () => {
    console.log('수료증 인쇄:', previewData);
    // 실제로는 인쇄 로직
    window.print();
  };

  // 통계 계산
  const stats = {
    total_students: students.length,
    eligible: students.filter(s => s.certificate_status === 'eligible').length,
    issued: students.filter(s => s.certificate_status === 'issued').length,
    not_eligible: students.filter(s => s.certificate_status === 'not_eligible').length,
    completion_rate: students.length > 0 ? Math.round((students.filter(s => s.certificate_status === 'issued').length / students.length) * 100) : 0
  };

  const getStatusIcon = (status: CertificateStatus) => {
    switch (status) {
      case 'eligible':
        return <CheckCircleIcon className="h-5 w-5 text-gray-600" />;
      case 'issued':
        return <TrophyIcon className="h-5 w-5 text-gray-700" />;
      case 'not_eligible':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending_review':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: CertificateStatus) => {
    switch (status) {
      case 'eligible':
        return '발급 가능';
      case 'issued':
        return '발급 완료';
      case 'not_eligible':
        return '기준 미달';
      case 'pending_review':
        return '검토 중';
      default:
        return '미분류';
    }
  };

  const getStatusColor = (status: CertificateStatus) => {
    switch (status) {
      case 'eligible':
        return 'bg-gray-100 text-gray-700';
      case 'issued':
        return 'bg-gray-100 text-gray-700';
      case 'not_eligible':
        return 'bg-red-100 text-red-700';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrophyIcon className="h-8 w-8 mr-3 text-gray-600" />
              수료증 관리
            </h1>
            <p className="mt-2 text-gray-600">
              수료 기준 확인 및 수료증 발급을 관리합니다.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={bulkIssueCertificates}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              일괄 발급
            </button>
          </div>
        </div>

        {/* 과정 필터 카드 */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mt-6">
          <div className="flex items-center gap-4">
            <select
              id="course-filter"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="flex-1 sm:w-64 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="all">전체 과정</option>
              <option value="course-1">BS 영업 기초과정</option>
              <option value="course-2">BS 고급 영업 전략</option>
              <option value="course-3">BS 고객 관리 시스템</option>
            </select>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.total_students}</div>
            <div className="text-sm text-gray-600">총 수강생</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.eligible}</div>
            <div className="text-sm text-gray-600">발급 가능</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.issued}</div>
            <div className="text-sm text-gray-600">발급 완료</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.not_eligible}</div>
            <div className="text-sm text-gray-600">기준 미달</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{stats.completion_rate}%</div>
            <div className="text-sm text-gray-600">수료율</div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { key: 'dashboard', label: '대시보드', icon: TrophyIcon },
              { key: 'eligible', label: '발급 대상', icon: CheckCircleIcon },
              { key: 'issued', label: '발급 완료', icon: DocumentTextIcon },
              { key: 'templates', label: '템플릿 관리', icon: AcademicCapIcon },
              { key: 'bulk', label: '일괄 처리', icon: UserGroupIcon }
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
              {/* 수료 기준 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">📋 수료 기준</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{completionCriteria.minimum_attendance}%</div>
                    <div className="text-sm text-gray-600">최소 출석률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{completionCriteria.minimum_exam_score}점</div>
                    <div className="text-sm text-gray-600">최소 시험 점수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{completionCriteria.required_assignments}개</div>
                    <div className="text-sm text-gray-600">필수 과제 수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">{completionCriteria.minimum_final_score}점</div>
                    <div className="text-sm text-gray-600">최종 성적</div>
                  </div>
                </div>
              </div>

              {/* 최근 활동 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">최근 발급된 수료증</h3>
                <div className="space-y-3">
                  {certificates.slice(0, 5).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <TrophyIcon className="h-8 w-8 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">{cert.student_name}</div>
                          <div className="text-sm text-gray-600">{cert.course_name} • {cert.session_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{cert.certificate_number}</div>
                        <div className="text-sm text-gray-500">{cert.issued_date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 발급 대상 탭 */}
          {currentView === 'eligible' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">수료증 발급 대상자</h3>
                <div className="text-sm text-gray-600">
                  {students.filter(s => s.certificate_status === 'eligible').length}명
                </div>
              </div>

              <div className="space-y-4">
                {students
                  .filter(s => s.certificate_status === 'eligible')
                  .map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                            className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-600">
                              {student.department} • {student.position} • {student.employee_id}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.course_name} • {student.session_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-2">
                            출석률: {student.attendance_rate}% • 최종성적: {student.final_score}점
                          </div>
                          <button
                            onClick={() => issueCertificate(student.id)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            수료증 발급
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 발급 완료 탭 */}
          {currentView === 'issued' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">발급 완료된 수료증</h3>
                <div className="text-sm text-gray-600">
                  {certificates.length}개
                </div>
              </div>

              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <TrophyIcon className="h-8 w-8 text-gray-600" />
                        <div>
                          <div className="font-medium text-gray-900">{cert.student_name}</div>
                          <div className="text-sm text-gray-600">
                            {cert.course_name} • {cert.session_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            수료증 번호: {cert.certificate_number}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-2">
                          발급일: {cert.issued_date} • 성적: {cert.final_score}점
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => openPreview(cert.id)}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            미리보기
                          </button>
                          <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center">
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            다운로드
                          </button>
                          <button className="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors flex items-center">
                            <PrinterIcon className="h-4 w-4 mr-1" />
                            인쇄
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 템플릿 관리 탭 */}
          {currentView === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">수료증 템플릿</h3>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  새 템플릿 추가
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                      {template.is_default && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          기본
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <div className="text-center text-lg font-bold text-gray-900 mb-2">
                        {template.title_text}
                      </div>
                      <div className="text-sm text-gray-600 whitespace-pre-line">
                        {template.content_template.replace(/{[^}]+}/g, '[내용]')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {template.course_category} • {template.created_date}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-600 hover:text-gray-700 text-sm">
                          편집
                        </button>
                        <button 
                          onClick={() => previewTemplate(template.id)}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          미리보기
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일괄 처리 탭 */}
          {currentView === 'bulk' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">일괄 수료증 발급</h3>
              
              {/* 선택된 학생 목록 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  선택된 학생 ({selectedStudents.length}명)
                </h4>
                {selectedStudents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudents.map(studentId => {
                      const student = students.find(s => s.id === studentId);
                      return student ? (
                        <div key={studentId} className="flex items-center justify-between p-2 bg-white rounded">
                          <span className="text-sm text-gray-900">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.course_name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">선택된 학생이 없습니다.</p>
                )}
              </div>

              {/* 일괄 발급 설정 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">발급 설정</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사용할 템플릿
                    </label>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-gray-500 focus:border-gray-500">
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      발급 옵션
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">발급 즉시 이메일 전송</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500" />
                        <span className="ml-2 text-sm text-gray-700">PDF 파일로 일괄 다운로드</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  선택 취소
                </button>
                <button
                  onClick={bulkIssueCertificates}
                  disabled={selectedStudents.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedStudents.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-800'
                  }`}
                >
                  일괄 발급 ({selectedStudents.length}명)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 수료증 미리보기 모달 */}
      {showPreview && previewData && (
        <CertificatePreview
          certificateData={previewData.certificateData}
          template={previewData.template}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
};

export default CertificateManagement;