import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UsersIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import type { Trainee, TraineeStatus, CreateTraineeData, BulkUploadResult } from '../../types/trainee.types';
import { traineeStatusLabels } from '../../types/trainee.types';
import { TraineeService } from '../../services/trainee.services';
import { ReportService } from '../../services/report.services';
import type { StudentReport } from '../../types/report.types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const TraineeManagement: React.FC = () => {
  console.log('👥 TraineeManagement 컴포넌트가 렌더링되었습니다.');
  
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [filteredTrainees, setFilteredTrainees] = useState<Trainee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TraineeStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 엑셀 가져오기 관련 상태
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // 리포트 보기 상태
  const [showReportForTrainee, setShowReportForTrainee] = useState<string | null>(null);
  const [reportData, setReportData] = useState<StudentReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // 교육생 데이터 로드
  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    try {
      console.log('👥 교육생 데이터 로딩 시작...');
      setIsLoading(true);
      const data = await TraineeService.getTrainees();
      console.log('👥 로딩된 교육생 데이터:', data.length);
      setTrainees(data);
      setFilteredTrainees(data);
    } catch (error) {
      console.error('교육생 데이터 로드 중 오류:', error);
      toast.error('교육생 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      console.log('👥 교육생 데이터 로딩 완료');
    }
  };

  // 교육생 리포트 로드
  const loadTraineeReport = async (traineeId: string) => {
    try {
      setIsLoadingReport(true);
      const report = await ReportService.getStudentReport(traineeId);
      setReportData(report);
    } catch (error) {
      console.error('교육생 리포트 로드 중 오류:', error);
      toast.error('교육생 리포트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // 리포트 보기 트리거
  useEffect(() => {
    if (showReportForTrainee) {
      loadTraineeReport(showReportForTrainee);
    } else {
      setReportData(null);
    }
  }, [showReportForTrainee]);

  // 필터링 로직
  useEffect(() => {
    let filtered = trainees;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(trainee =>
        trainee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trainee => trainee.status === statusFilter);
    }

    // 부서 필터
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(trainee => trainee.department === departmentFilter);
    }

    setFilteredTrainees(filtered);
  }, [trainees, searchTerm, statusFilter, departmentFilter]);

  // 상태 색상 함수
  const getStatusColor = (status: TraineeStatus) => {
    switch (status) {
      case 'active':
        return 'bg-primary text-primary-foreground border-border';
      case 'inactive':
        return 'bg-secondary text-secondary-foreground border-border';
      case 'graduated':
        return 'bg-muted text-muted-foreground border-border';
      case 'suspended':
        return 'bg-destructive text-destructive-foreground border-border';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  // 엑셀 파일 처리 함수들
  const handleExcelFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('📊 엑셀 데이터 파싱 완료:', jsonData);
        setExcelData(jsonData);
        toast.success('엑셀 파일을 성공적으로 불러왔습니다.');
      } catch (error) {
        console.error('엑셀 파일 파싱 오류:', error);
        toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processExcelData = async () => {
    if (excelData.length === 0) {
      toast.error('처리할 데이터가 없습니다.');
      return;
    }

    setIsProcessing(true);
    try {
      // 엑셀 데이터를 Trainee 형식으로 변환
      const traineesToCreate = excelData.map((row: any) => ({
        name: row['이름'] || row['name'] || '',
        email: row['이메일'] || row['email'] || '',
        phone: row['연락처'] || row['phone'] || row['전화번호'] || '',
        employee_id: row['사번'] || row['employee_id'] || row['직원번호'] || '',
        department: row['부서'] || row['department'] || '',
        position: row['직급'] || row['position'] || '',
        hire_date: row['입사일'] || row['hire_date'] || '',
        emergency_contact: row['비상연락처'] ? {
          name: row['비상연락처_이름'] || row['emergency_contact_name'] || '',
          relationship: row['비상연락처_관계'] || row['emergency_contact_relationship'] || '',
          phone: row['비상연락처_전화'] || row['emergency_contact_phone'] || ''
        } : undefined
      })).filter((trainee: any) => trainee.name && trainee.email); // 필수 필드가 있는 경우만

      console.log('📋 변환된 교육생 데이터:', traineesToCreate);

      if (traineesToCreate.length === 0) {
        toast.error('유효한 교육생 데이터가 없습니다. 이름과 이메일은 필수입니다.');
        setIsProcessing(false);
        return;
      }

      // 대량 업로드 실행
      const result = await TraineeService.bulkUploadTrainees(traineesToCreate);
      setUploadResult(result);
      setShowResultModal(true);
      setIsExcelModalOpen(false);
      
      // 성공한 경우 교육생 목록 새로고침
      if (result.success.length > 0) {
        await loadTrainees();
      }

      toast.success(`총 ${result.success.length}명의 교육생이 등록되었습니다.`);
    } catch (error) {
      console.error('엑셀 데이터 처리 오류:', error);
      toast.error('교육생 등록 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        '이름': '홍길동',
        '이메일': 'hong@company.com',
        '사번': 'EMP001',
        '부서': '영업팀',
        '직급': '사원',
        '연락처': '010-1234-5678',
        '입사일': '2024-01-15',
        '비상연락처_이름': '홍어머니',
        '비상연락처_관계': '어머니',
        '비상연락처_전화': '010-9876-5432'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '교육생목록');
    XLSX.writeFile(wb, '교육생_등록_템플릿.xlsx');
    toast.success('템플릿 파일이 다운로드되었습니다.');
  };

  // 부서 목록 추출
  const departments = Array.from(new Set(trainees.map(t => t.department).filter(d => d)));

  // 교육생 생성 모달
  const CreateTraineeModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      employee_id: '',
      department: '',
      position: '',
      hire_date: '',
      cohort: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await TraineeService.createTrainee(formData);
        toast.success('새로운 교육생이 생성되었습니다!');
        setIsCreateModalOpen(false);
        loadTrainees();
        setFormData({
          name: '',
          email: '',
          phone: '',
          employee_id: '',
          department: '',
          position: '',
          hire_date: '',
          cohort: ''
        });
      } catch (error) {
        toast.error('교육생 생성 중 오류가 발생했습니다.');
      }
    };

    if (!isCreateModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-md w-full border border-border">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">새 교육생 등록</h2>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">이메일 *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">사번 *</label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">차수</label>
              <input
                type="text"
                value={formData.cohort}
                onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                placeholder="예: 25-6차"
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">YY-n차 형식 (예: 25-6차 = 2025년 6번째 차수)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">부서</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">직급</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">연락처</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn-neutral px-4 py-2 text-sm font-medium rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                등록
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 교육생 편집 모달
  const EditTraineeModal = () => {
    const [formData, setFormData] = useState({
      name: selectedTrainee?.name || '',
      email: selectedTrainee?.email || '',
      phone: selectedTrainee?.phone || '',
      employee_id: selectedTrainee?.employee_id || '',
      department: selectedTrainee?.department || '',
      position: selectedTrainee?.position || '',
      hire_date: selectedTrainee?.hire_date || '',
      cohort: selectedTrainee?.cohort || ''
    });

    useEffect(() => {
      if (selectedTrainee) {
        setFormData({
          name: selectedTrainee.name,
          email: selectedTrainee.email,
          phone: selectedTrainee.phone,
          employee_id: selectedTrainee.employee_id,
          department: selectedTrainee.department,
          position: selectedTrainee.position,
          hire_date: selectedTrainee.hire_date,
          cohort: selectedTrainee.cohort || ''
        });
      }
    }, [selectedTrainee]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTrainee) return;
      
      try {
        await TraineeService.updateTrainee(selectedTrainee.id, formData);
        toast.success('교육생 정보가 수정되었습니다!');
        setIsEditModalOpen(false);
        setSelectedTrainee(null);
        loadTrainees();
      } catch (error) {
        toast.error('교육생 정보 수정 중 오류가 발생했습니다.');
      }
    };

    if (!isEditModalOpen || !selectedTrainee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-md w-full border border-border">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">교육생 정보 수정</h2>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTrainee(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">이메일 *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">사번 *</label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">차수</label>
              <input
                type="text"
                value={formData.cohort}
                onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                placeholder="예: 25-6차"
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground mt-1">YY-n차 형식 (예: 25-6차 = 2025년 6번째 차수)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">부서</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">직급</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">연락처</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTrainee(null);
                }}
                className="btn-neutral px-4 py-2 text-sm font-medium rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                수정
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 교육생 상세보기 모달
  const TraineeDetailModal = () => {
    if (!isDetailModalOpen || !selectedTrainee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-lg w-full border border-border">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">교육생 상세 정보</h2>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedTrainee(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">이름</label>
                  <p className="text-card-foreground">{selectedTrainee.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">사번</label>
                  <p className="text-card-foreground">{selectedTrainee.employee_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">이메일</label>
                  <p className="text-card-foreground">{selectedTrainee.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">연락처</label>
                  <p className="text-card-foreground">{selectedTrainee.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">부서</label>
                  <p className="text-card-foreground">{selectedTrainee.department || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">직급</label>
                  <p className="text-card-foreground">{selectedTrainee.position || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">입사일</label>
                  <p className="text-card-foreground">{selectedTrainee.hire_date || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">상태</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedTrainee.status)}`}>
                    {traineeStatusLabels[selectedTrainee.status]}
                  </span>
                </div>
              </div>
            </div>

            {/* 비상 연락처 */}
            {selectedTrainee.emergency_contact && (
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">비상 연락처</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">이름</label>
                    <p className="text-card-foreground">{selectedTrainee.emergency_contact.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">관계</label>
                    <p className="text-card-foreground">{selectedTrainee.emergency_contact.relationship}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">연락처</label>
                    <p className="text-card-foreground">{selectedTrainee.emergency_contact.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 수강 과정 */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">수강 과정</h3>
              {selectedTrainee.enrolled_courses && selectedTrainee.enrolled_courses.length > 0 ? (
                <div className="space-y-2">
                  {selectedTrainee.enrolled_courses.map((courseId, index) => (
                    <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span className="text-card-foreground">과정 ID: {courseId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">수강 중인 과정이 없습니다.</p>
              )}
            </div>

            {/* 등록 정보 */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-4">등록 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">등록일</label>
                  <p className="text-card-foreground">
                    {selectedTrainee.created_at ? new Date(selectedTrainee.created_at).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">최종 수정일</label>
                  <p className="text-card-foreground">
                    {selectedTrainee.updated_at ? new Date(selectedTrainee.updated_at).toLocaleDateString('ko-KR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-border">
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedTrainee(selectedTrainee);
                setIsEditModalOpen(true);
              }}
              className="btn-base btn-secondary"
            >
              편집
            </button>
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedTrainee(null);
              }}
              className="btn-base btn-outline"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 엑셀 가져오기 모달
  const ExcelImportModal = () => {
    if (!isExcelModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-lg w-full border border-border">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">엑셀 파일로 교육생 등록</h2>
            <button
              onClick={() => {
                setIsExcelModalOpen(false);
                setExcelData([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 템플릿 다운로드 */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium text-card-foreground mb-2">📥 템플릿 다운로드</h3>
              <p className="text-sm text-muted-foreground mb-3">
                정확한 양식으로 교육생 정보를 등록하려면 템플릿을 다운로드하여 사용하세요.
              </p>
              <button
                onClick={downloadExcelTemplate}
                className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-1"
              >
                <DocumentTextIcon className="w-4 h-4" />
                <span>템플릿 다운로드</span>
              </button>
            </div>

            {/* 파일 업로드 */}
            <div>
              <h3 className="font-medium text-card-foreground mb-3">📁 엑셀 파일 선택</h3>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileSelect}
                className="w-full border border-input rounded-lg p-3 bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-muted-foreground mt-2">
                .xlsx 또는 .xls 파일만 지원됩니다.
              </p>
            </div>

            {/* 미리보기 */}
            {excelData.length > 0 && (
              <div>
                <h3 className="font-medium text-card-foreground mb-3">👀 데이터 미리보기</h3>
                <div className="border border-border rounded-lg p-3 max-h-48 overflow-auto">
                  <p className="text-sm text-muted-foreground mb-2">
                    총 {excelData.length}개의 행이 발견되었습니다.
                  </p>
                  <div className="text-xs space-y-1">
                    {excelData.slice(0, 3).map((row: any, index) => (
                      <div key={index} className="p-2 bg-muted/30 rounded">
                        <span className="font-medium">
                          {row['이름'] || row['name'] || '이름없음'}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({row['이메일'] || row['email'] || '이메일없음'})
                        </span>
                      </div>
                    ))}
                    {excelData.length > 3 && (
                      <div className="text-center text-muted-foreground">
                        ... 외 {excelData.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-border">
            <button
              onClick={() => {
                setIsExcelModalOpen(false);
                setExcelData([]);
              }}
              className="btn-neutral px-4 py-2 text-sm font-medium rounded-lg"
            >
              취소
            </button>
            <button
              onClick={processExcelData}
              disabled={excelData.length === 0 || isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>처리 중...</span>
                </>
              ) : (
                <>
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  <span>등록하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 업로드 결과 모달
  const UploadResultModal = () => {
    if (!showResultModal || !uploadResult) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-2xl w-full border border-border max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">업로드 결과</h2>
            <button
              onClick={() => {
                setShowResultModal(false);
                setUploadResult(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-auto max-h-[60vh]">
            {/* 요약 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-success/10 border border-success/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-success">{uploadResult.success.length}</div>
                <div className="text-sm text-success">성공</div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-destructive">{uploadResult.failed.length}</div>
                <div className="text-sm text-destructive">실패</div>
              </div>
              <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-accent">{uploadResult.duplicates.length}</div>
                <div className="text-sm text-accent">중복</div>
              </div>
            </div>

            {/* 성공한 등록 */}
            {uploadResult.success.length > 0 && (
              <div>
                <h3 className="font-medium text-card-foreground mb-3 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-success mr-2" />
                  성공적으로 등록된 교육생 ({uploadResult.success.length}명)
                </h3>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {uploadResult.success.map((trainee, index) => (
                    <div key={index} className="p-2 bg-success/5 border border-success/20 rounded text-sm">
                      <span className="font-medium">{trainee.name}</span>
                      <span className="text-muted-foreground ml-2">({trainee.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 실패한 등록 */}
            {uploadResult.failed.length > 0 && (
              <div>
                <h3 className="font-medium text-card-foreground mb-3 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-destructive mr-2" />
                  등록 실패 ({uploadResult.failed.length}건)
                </h3>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {uploadResult.failed.map((item, index) => (
                    <div key={index} className="p-2 bg-destructive/5 border border-destructive/20 rounded text-sm">
                      <div className="font-medium">
                        {item.trainee.name || '이름없음'} ({item.trainee.email || '이메일없음'})
                      </div>
                      <div className="text-destructive text-xs">{item.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 중복된 교육생 */}
            {uploadResult.duplicates.length > 0 && (
              <div>
                <h3 className="font-medium text-card-foreground mb-3 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-accent mr-2" />
                  중복된 교육생 ({uploadResult.duplicates.length}명)
                </h3>
                <div className="space-y-2 max-h-32 overflow-auto">
                  {uploadResult.duplicates.map((item, index) => (
                    <div key={index} className="p-2 bg-accent/5 border border-accent/20 rounded text-sm">
                      <div className="font-medium">
                        {item.trainee.name || '이름없음'} ({item.trainee.email || '이메일없음'})
                      </div>
                      <div className="text-accent text-xs">
                        기존 데이터와 {item.duplicateField === 'email' ? '이메일' : '사번'}이 중복됨
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end p-6 border-t border-border">
            <button
              onClick={() => {
                setShowResultModal(false);
                setUploadResult(null);
              }}
              className="btn-base btn-primary"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    console.log('⏳ TraineeManagement 로딩 중...');
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm">교육생 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  console.log('👥 TraineeManagement 메인 렌더링 시작', { 
    trainees: trainees.length, 
    filtered: filteredTrainees.length 
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">교육생 관리</h1>
              <p className="text-muted-foreground">교육생 등록, 관리 및 상태 추적</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="btn-base btn-lg btn-success"
            >
              <DocumentArrowUpIcon className="w-4 h-4" />
              엑셀 가져오기
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-base btn-lg btn-dark"
            >
              <PlusIcon className="w-5 h-5" />
              새 교육생 등록
            </button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mt-6 flex flex-col md:flex-row gap-2">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="이름, 이메일, 사번으로 검색..."
              className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TraineeStatus | 'all')}
            className="sm:w-36 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em 1.25em',
              paddingRight: '2rem'
            }}
          >
            <option value="all">모든 상태</option>
            {Object.entries(traineeStatusLabels).map(([status, label]) => (
              <option key={status} value={status}>{label}</option>
            ))}
          </select>

          {/* 부서 필터 */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="sm:w-36 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em 1.25em',
              paddingRight: '2rem'
            }}
          >
            <option value="all">모든 부서</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* 결과 카운트 */}
          <div className="flex items-center px-3 py-2.5 bg-secondary/30 rounded-lg border border-border">
            <FunnelIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              총 <span className="text-primary font-semibold">{filteredTrainees.length}</span>명
            </span>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">전체 교육생</p>
              <p className="text-2xl font-bold text-card-foreground">{trainees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">활성 교육생</p>
              <p className="text-2xl font-bold text-card-foreground">
                {trainees.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">수료생</p>
              <p className="text-2xl font-bold text-card-foreground">
                {trainees.filter(t => t.status === 'graduated').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">부서 수</p>
              <p className="text-2xl font-bold text-card-foreground">{departments.length}</p>
            </div>
            <div className="p-3 bg-secondary text-secondary-foreground rounded-lg">
              <ChartBarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 교육생 목록 */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-card-foreground">
              교육생 목록 ({filteredTrainees.length}명)
            </h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <FunnelIcon className="w-4 h-4" />
              <span>필터 적용됨</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">본부</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">팀</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">직급</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">성명</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">사번</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">차수</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">전화번호</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">근무지(e-hr)</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainees.map((trainee, index) => (
                <tr key={trainee.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  <td className="p-4 text-card-foreground">{trainee.division || '-'}</td>
                  <td className="p-4 text-card-foreground">{trainee.team || '-'}</td>
                  <td className="p-4 text-card-foreground">{trainee.position}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {trainee.name.charAt(0)}
                      </div>
                      <div className="font-medium text-card-foreground">{trainee.name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-card-foreground">{trainee.employee_id}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {trainee.cohort || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-card-foreground">{trainee.phone}</td>
                  <td className="p-4 text-card-foreground">{trainee.workplace || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTrainee(trainee);
                          setIsDetailModalOpen(true);
                        }}
                        className="btn-base btn-sm btn-primary"
                        title="상세보기"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowReportForTrainee(trainee.id);
                        }}
                        className="btn-base btn-sm btn-primary"
                        title="리포트 보기"
                      >
                        <ClipboardDocumentListIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrainee(trainee);
                          setIsEditModalOpen(true);
                        }}
                        className="btn-base btn-sm btn-secondary"
                        title="편집"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`정말로 ${trainee.name} 교육생을 삭제하시겠습니까?`)) {
                            try {
                              await TraineeService.deleteTrainee(trainee.id);
                              toast.success('교육생이 삭제되었습니다.');
                              loadTrainees();
                            } catch (error) {
                              toast.error('교육생 삭제 중 오류가 발생했습니다.');
                            }
                          }
                        }}
                        className="btn-base btn-sm btn-danger"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrainees.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">교육생이 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                ? '검색 조건에 맞는 교육생이 없습니다.' 
                : '첫 번째 교육생을 등록해보세요.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all' && departmentFilter === 'all') && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                새 교육생 등록
              </button>
            )}
          </div>
        )}
      </div>

      {/* 모달들 */}
      <CreateTraineeModal />
      <EditTraineeModal />
      <TraineeDetailModal />
      <ExcelImportModal />
      <UploadResultModal />
      <TraineeReportModal />
    </div>
  );

  // 교육생 리포트 모달
  function TraineeReportModal() {
    if (!showReportForTrainee || !reportData) return null;

    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'grades' | 'attendance'>('overview');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-border">
          {/* 헤더 */}
          <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{reportData.trainee.name} - 교육생 리포트</h2>
              <p className="text-sm text-muted-foreground mt-1">{reportData.trainee.email}</p>
            </div>
            <button
              onClick={() => setShowReportForTrainee(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {isLoadingReport ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">리포트 로드 중...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 통계 요약 */}
              <div className="p-6 bg-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">총 과정</p>
                    <p className="text-2xl font-bold text-card-foreground">{reportData.overall_statistics.total_courses}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">이수 완료</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.overall_statistics.completed_courses}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">평균 성적</p>
                    <p className="text-2xl font-bold text-orange-600">{reportData.overall_statistics.average_score.toFixed(1)}점</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">출석률</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData.overall_statistics.average_attendance_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* 탭 */}
              <div className="border-b border-border px-6">
                <div className="flex gap-6">
                  {[
                    { id: 'overview', label: '개요' },
                    { id: 'courses', label: '과정 이수' },
                    { id: 'grades', label: '성적' },
                    { id: 'attendance', label: '출석' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`pb-3 px-2 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-primary border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 탭 내용 */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">수강 중인 과정</p>
                        <p className="text-xl font-semibold">{reportData.overall_statistics.in_progress_courses}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">인증서</p>
                        <p className="text-xl font-semibold">{reportData.overall_statistics.total_certificates}개</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'courses' && (
                  <div className="space-y-4">
                    {reportData.course_completions.map((course) => (
                      <div key={course.id} className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{course.course_name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            course.completion_status === 'completed' ? 'bg-green-500/10 text-green-700' :
                            course.completion_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {course.completion_status === 'completed' ? '완료' :
                             course.completion_status === 'in_progress' ? '수강중' : course.completion_status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{course.session_code}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(course.start_date).toLocaleDateString('ko-KR')} - {new Date(course.end_date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'grades' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">과목</th>
                          <th className="text-center py-3 px-4">점수</th>
                          <th className="text-center py-3 px-4">등급</th>
                          <th className="text-center py-3 px-4">평가일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.grades.map((grade, index) => (
                          <tr key={index} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-4">{grade.subject}</td>
                            <td className="text-center py-3 px-4">{grade.score}/{grade.max_score}</td>
                            <td className="text-center py-3 px-4 font-bold">{grade.grade}</td>
                            <td className="text-center py-3 px-4">{new Date(grade.evaluation_date).toLocaleDateString('ko-KR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.grades.length === 0 && (
                      <p className="text-center py-8 text-muted-foreground">성적 정보가 없습니다.</p>
                    )}
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-5 gap-4">
                      <div className="bg-muted/30 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">총 일수</p>
                        <p className="text-2xl font-bold">{reportData.attendance_summary.total_days}</p>
                      </div>
                      <div className="bg-green-500/10 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">출석</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.attendance_summary.present_days}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">지각</p>
                        <p className="text-2xl font-bold text-foreground">{reportData.attendance_summary.late_days}</p>
                      </div>
                      <div className="bg-destructive/10 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">결석</p>
                        <p className="text-2xl font-bold text-destructive">{reportData.attendance_summary.absent_days}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">출석률</p>
                        <p className="text-2xl font-bold text-blue-600">{reportData.attendance_summary.attendance_rate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">전체 출석률</p>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full transition-all"
                          style={{ width: `${reportData.attendance_summary.attendance_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-end">
                <button
                  onClick={() => setShowReportForTrainee(null)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  닫기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
};

export default TraineeManagement;
