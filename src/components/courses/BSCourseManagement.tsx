'use client';

import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  PlusIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  StopIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { CourseTemplateService } from '../../services/course-template.service';
import { UnifiedCourseService } from '../../services/unified-course.service';
import { TemplateCurriculumService } from '../../services/template-curriculum.service';
import { UserService, type User } from '../../services/user.services';
import { useAuth } from '../../contexts/AuthContext';
import type {
  CourseTemplate,
  CourseRound,
  BSCourseSummary,
  RoundStats
} from '../../types/course-template.types';
import type {
  CreateCourseTemplateRequest,
  CreateTemplateCurriculumRequest
} from '../../types/unified-course.types';
import toast from 'react-hot-toast';
import { PageContainer } from '../common/PageContainer';

interface BSCourseManagementProps {
  viewMode?: 'overview' | 'rounds' | 'templates';
  isRoundModalOpen?: boolean;
  setIsRoundModalOpen?: (open: boolean) => void;
}

const BSCourseManagement: React.FC<BSCourseManagementProps> = ({
  viewMode = 'overview',
  isRoundModalOpen: externalIsRoundModalOpen,
  setIsRoundModalOpen: externalSetIsRoundModalOpen
}) => {
  console.log('🎯 BSCourseManagement 컴포넌트가 렌더링되었습니다.');

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [rounds, setRounds] = useState<CourseRound[]>([]);
  const [summary, setSummary] = useState<BSCourseSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<CourseRound | null>(null);
  const [internalIsRoundModalOpen, setInternalIsRoundModalOpen] = useState(false);

  // 외부에서 전달된 state가 있으면 사용, 없으면 내부 state 사용
  const isRoundModalOpen = externalIsRoundModalOpen ?? internalIsRoundModalOpen;
  const setIsRoundModalOpen = externalSetIsRoundModalOpen ?? setInternalIsRoundModalOpen;
  const [templateEditModal, setTemplateEditModal] = useState<{
    isOpen: boolean;
    template: CourseTemplate | null;
  }>({ isOpen: false, template: null });
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(null);

  // 차수 상세 모달
  const [roundDetailModal, setRoundDetailModal] = useState<{
    isOpen: boolean;
    round: CourseRound | null;
  }>({ isOpen: false, round: null });

  // 차수 편집 모달
  const [roundEditModal, setRoundEditModal] = useState<{
    isOpen: boolean;
    round: CourseRound | null;
  }>({ isOpen: false, round: null });

  // 운영 담당자 목록
  const [managers, setManagers] = useState<User[]>([]);
  // 강의실 목록
  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadManagers();
    loadClassrooms();
  }, [selectedTemplate]);

  const loadManagers = async () => {
    try {
      const managerUsers = await UserService.getUsersByRole('course_manager');
      setManagers(managerUsers);
    } catch (error) {
      console.error('운영 담당자 로드 오류:', error);
    }
  };

  const loadClassrooms = async () => {
    try {
      const { data, error } = await import('../../services/supabase').then(m =>
        m.supabase.from('classrooms').select('*').eq('is_available', true).order('name')
      );
      if (error) throw error;
      setClassrooms(data || []);
    } catch (error) {
      console.error('강의실 로드 오류:', error);
      toast.error('강의실 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadData = async () => {
    try {
      console.log('📊 BSCourseManagement 데이터 로딩 시작...');
      setIsLoading(true);

      // 날짜 기반 자동 상태 업데이트 실행
      await CourseTemplateService.autoUpdateRoundStatus();

      const [templatesData, roundsData, summaryData] = await Promise.all([
        CourseTemplateService.getTemplates(),
        CourseTemplateService.getRounds(
          selectedTemplate !== 'all' ? { template_id: selectedTemplate } : undefined
        ),
        CourseTemplateService.getBSCourseSummary()
      ]);

      console.log('📊 로딩된 데이터:', {
        templates: templatesData.length,
        rounds: roundsData.length,
        summary: summaryData.length
      });

      // objectives가 없는 템플릿들을 안전하게 처리
      const safeTemplates = templatesData.map(template => ({
        ...template,
        objectives: template.objectives || [],
        curriculum: template.curriculum || [],
        requirements: template.requirements || []
      }));

      setTemplates(safeTemplates);
      setRounds(roundsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      console.log('📊 BSCourseManagement 데이터 로딩 완료');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'recruiting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/50';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return '기획 중';
      case 'recruiting': return '모집 중';
      case 'in_progress': return '진행 중';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  // 템플릿 편집 관련 함수들
  const handleEditTemplate = (template: CourseTemplate) => {
    setTemplateEditModal({ isOpen: true, template });
    setEditingTemplate(template);
  };

  const handleSaveTemplate = async (updatedTemplate: CourseTemplate) => {
    try {
      console.log('[BSCourseManagement] Updating template basic info:', updatedTemplate);

      // 기본 정보만 업데이트 (커리큘럼은 별도 관리)
      await UnifiedCourseService.updateTemplate(updatedTemplate.id, {
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        code: `BS-${updatedTemplate.category.toUpperCase()}`,
        category: updatedTemplate.category as 'basic' | 'advanced',
        difficulty_level: 'beginner',
        duration_days: updatedTemplate.duration_days,
        total_hours: updatedTemplate.total_hours,
        requirements: Array.isArray(updatedTemplate.requirements)
          ? updatedTemplate.requirements
          : (updatedTemplate.requirements ? [updatedTemplate.requirements] : []),
        objectives: Array.isArray(updatedTemplate.objectives)
          ? updatedTemplate.objectives
          : (updatedTemplate.objectives ? [updatedTemplate.objectives] : [])
        // curriculum 제거 - 기본 정보만 수정
      });

      await loadData();
      setTemplateEditModal({ isOpen: false, template: null });
      setEditingTemplate(null);
      toast.success('템플릿 기본 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('템플릿 수정 실패:', error);
      toast.error('템플릿 수정 중 오류가 발생했습니다.');
    }
  };

  // 새 템플릿 생성 함수
  const handleNewTemplate = async (templateData: Omit<CourseTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('[BSCourseManagement] Creating new template with UnifiedCourseService:', templateData);

      // 커리큘럼 데이터를 template_curriculum 형식으로 변환
      const curriculum: CreateTemplateCurriculumRequest[] = (templateData.curriculum || []).map((curr, index) => ({
        day: curr.day || index + 1,
        order_index: 1, // 같은 날 여러 과목이 있으면 나중에 확장
        subject: curr.title || '제목 없음',
        subject_type: 'lecture' as const,
        description: curr.description,
        duration_hours: curr.duration_hours || 7,
        learning_objectives: Array.isArray(curr.learning_objectives)
          ? curr.learning_objectives
          : (curr.learning_objectives ? [curr.learning_objectives] : []),
        topics: Array.isArray(curr.activities) ? curr.activities : []
      }));

      const request: CreateCourseTemplateRequest = {
        code: `BS-${templateData.category.toUpperCase()}-${Date.now()}`,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category as 'basic' | 'advanced',
        difficulty_level: 'beginner', // 기본값
        duration_days: templateData.duration_days || curriculum.length,
        total_hours: templateData.total_hours || curriculum.reduce((sum, c) => sum + c.duration_hours, 0),
        requirements: Array.isArray(templateData.requirements)
          ? templateData.requirements
          : (templateData.requirements ? [templateData.requirements] : []),
        objectives: Array.isArray(templateData.objectives)
          ? templateData.objectives
          : (templateData.objectives ? [templateData.objectives] : []),
        curriculum
      };

      await UnifiedCourseService.createTemplate(request);
      await loadData();
      setIsNewTemplateModalOpen(false);
      toast.success('새로운 템플릿이 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('템플릿 생성 실패:', error);
      toast.error('템플릿 생성 중 오류가 발생했습니다.');
    }
  };

  // 차수 생성 함수
  const handleCreateRound = async (roundData: any) => {
    try {
      await CourseTemplateService.createRound(roundData);
      await loadData();
      setIsRoundModalOpen(false);
      toast.success('새로운 차수가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('차수 생성 실패:', error);
      toast.error('차수 생성 중 오류가 발생했습니다.');
    }
  };

  // 차수 상세 보기
  const handleViewRound = (round: CourseRound) => {
    setRoundDetailModal({ isOpen: true, round });
  };

  // 차수 편집
  const handleEditRound = (round: CourseRound) => {
    setRoundEditModal({ isOpen: true, round });
  };

  // 차수 저장
  const handleSaveRound = async (updatedRound: CourseRound) => {
    try {
      await CourseTemplateService.updateRound(updatedRound.id, updatedRound);
      await loadData();
      setRoundEditModal({ isOpen: false, round: null });
      toast.success('차수가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('차수 수정 실패:', error);
      toast.error('차수 수정 중 오류가 발생했습니다.');
    }
  };

  // 차수 시작
  const handleStartRound = async (round: CourseRound) => {
    try {
      await CourseTemplateService.updateRound(round.id, {
        ...round,
        status: 'in_progress'
      });
      await loadData();
      toast.success('차수가 시작되었습니다.');
    } catch (error) {
      console.error('차수 시작 실패:', error);
      toast.error('차수 시작 중 오류가 발생했습니다.');
    }
  };

  // 차수 완료
  const handleCompleteRound = async (round: CourseRound) => {
    try {
      await CourseTemplateService.updateRound(round.id, {
        ...round,
        status: 'completed'
      });
      await loadData();
      toast.success('차수가 완료되었습니다.');
    } catch (error) {
      console.error('차수 완료 실패:', error);
      toast.error('차수 완료 중 오류가 발생했습니다.');
    }
  };

  // 차수 삭제
  const handleDeleteRound = async (round: CourseRound) => {
    if (!confirm(`"${round.title}" 차수를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await CourseTemplateService.deleteRound(round.id);
      await loadData();
      toast.success('차수가 삭제되었습니다.');
    } catch (error) {
      console.error('차수 삭제 실패:', error);
      toast.error('차수 삭제 중 오류가 발생했습니다.');
    }
  };

  // 템플릿 삭제 (관리자만)
  const handleDeleteTemplate = async (template: CourseTemplate) => {
    if (!isAdmin) {
      toast.error('관리자만 템플릿을 삭제할 수 있습니다.');
      return;
    }

    // 확인 메시지
    const confirmMessage = `"${template.name}" 템플릿을 삭제하시겠습니까?\n\n⚠️ 주의: 이 템플릿을 사용하는 차수가 있는지 확인해주세요.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // 이 템플릿을 사용하는 차수가 있는지 확인
      const relatedRounds = await CourseTemplateService.getRounds({ template_id: template.id });

      if (relatedRounds.length > 0) {
        const activeRounds = relatedRounds.filter(r => r.status === 'in_progress' || r.status === 'recruiting');
        if (activeRounds.length > 0) {
          toast.error(`활성 상태의 차수 ${activeRounds.length}개가 있어 삭제할 수 없습니다.`);
          return;
        }

        // 완료된 차수만 있는 경우
        const doubleConfirm = confirm(
          `완료된 차수 ${relatedRounds.length}개가 이 템플릿을 사용하고 있습니다.\n정말로 삭제하시겠습니까?`
        );
        if (!doubleConfirm) {
          return;
        }
      }

      // 템플릿 삭제 (소프트 삭제: is_active = false)
      await CourseTemplateService.updateTemplate(template.id, { is_active: false });
      await loadData();
      toast.success('템플릿이 삭제되었습니다.');
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      toast.error('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };


  // 템플릿 편집 모달
  const TemplateEditModal = () => {
    const [formData, setFormData] = useState<{
      id: string;
      name: string;
      description: string;
      category: 'basic' | 'advanced';
      duration_days: number;
      total_hours: number;
      curriculum: any[];
      requirements: any[];
      objectives: any[];
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>({
      id: '',
      name: '',
      description: '',
      category: 'basic',
      duration_days: 0,
      total_hours: 0,
      curriculum: [],
      requirements: [],
      objectives: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    });

    useEffect(() => {
      if (editingTemplate) {
        setFormData({
          ...editingTemplate,
          curriculum: editingTemplate.curriculum || [],
          requirements: editingTemplate.requirements || [],
          objectives: editingTemplate.objectives || []
        });
      } else {
        setFormData({
          id: '',
          name: '',
          description: '',
          category: 'basic',
          duration_days: 0,
          total_hours: 0,
          curriculum: [],
          requirements: [],
          objectives: [],
          is_active: true,
          created_at: '',
          updated_at: ''
        });
      }
    }, [editingTemplate]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await handleSaveTemplate(formData);
    };

    const addCurriculumDay = () => {
      const newDay = {
        id: `curriculum-${Date.now()}`,
        day: formData.curriculum.length + 1,
        title: '',
        description: '',
        duration_hours: 7,
        learning_objectives: [],
        activities: [],
        materials: [],
        assessment: ''
      };
      setFormData({
        ...formData,
        curriculum: [...formData.curriculum, newDay]
      });
    };

    const updateCurriculumDay = (index: number, updates: any) => {
      const newCurriculum = [...formData.curriculum];
      newCurriculum[index] = { ...newCurriculum[index], ...updates };
      const totalHours = newCurriculum.reduce((sum, curr) => sum + curr.duration_hours, 0);
      setFormData({
        ...formData,
        curriculum: newCurriculum,
        total_hours: totalHours,
        duration_days: newCurriculum.length
      });
    };

    const removeCurriculumDay = (index: number) => {
      const newCurriculum = formData.curriculum.filter((_, i) => i !== index);
      // 일차 번호 재정렬
      newCurriculum.forEach((curriculum, i) => {
        curriculum.day = i + 1;
      });
      const totalHours = newCurriculum.reduce((sum, curr) => sum + curr.duration_hours, 0);
      setFormData({
        ...formData,
        curriculum: newCurriculum,
        total_hours: totalHours,
        duration_days: newCurriculum.length
      });
    };

    if (!templateEditModal.isOpen || !editingTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">템플릿 편집: {editingTemplate.name}</h2>
            <button
              onClick={() => {
                setTemplateEditModal({ isOpen: false, template: null });
                setEditingTemplate(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">과정명</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'basic' | 'advanced' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">과정 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              {/* 학습 목표 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학습 목표</label>
                <textarea
                  value={formData.objectives.join('\n')}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value.split('\n').filter(o => o.trim()) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="학습 목표를 한 줄씩 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateEditModal({ isOpen: false, template: null });
                    setEditingTemplate(null);
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // 새 템플릿 생성 모달
  const NewTemplateModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: 'basic' as 'basic' | 'advanced',
      duration_days: 3,
      total_hours: 21,
      curriculum: [] as any[],
      requirements: [] as string[],
      objectives: [] as string[],
      is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await handleNewTemplate(formData);
        // 폼 초기화
        setFormData({
          name: '',
          description: '',
          category: 'basic',
          duration_days: 3,
          total_hours: 21,
          curriculum: [],
          requirements: [],
          objectives: [],
          is_active: true
        });
      } catch (error) {
        console.error('NewTemplateModal submit error:', error);
      }
    };

    if (!isNewTemplateModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">새 과정 템플릿 생성</h2>
            <button
              onClick={() => setIsNewTemplateModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">과정명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="예: BS Expert"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'basic' | 'advanced' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">과정 설명 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="과정에 대한 상세 설명을 입력하세요"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기간 (일) *</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">총 시간 *</label>
                  <input
                    type="number"
                    value={formData.total_hours}
                    onChange={(e) => setFormData({ ...formData, total_hours: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="300"
                    required
                  />
                </div>
              </div>

              {/* 학습 목표 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학습 목표</label>
                <textarea
                  value={formData.objectives.join('\n')}
                  onChange={(e) => setFormData({
                    ...formData,
                    objectives: e.target.value.split('\n').filter(o => o.trim())
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="학습 목표를 한 줄씩 입력하세요&#10;예:&#10;- 영업 기초 지식 습득&#10;- 고객 응대 스킬 향상&#10;- 영업 전략 수립 능력 개발"
                />
              </div>

              {/* 수강 요건 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">수강 요건</label>
                <textarea
                  value={formData.requirements.join('\n')}
                  onChange={(e) => setFormData({
                    ...formData,
                    requirements: e.target.value.split('\n').filter(r => r.trim())
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="수강 요건을 한 줄씩 입력하세요&#10;예:&#10;- 신입사원 또는 경력 1년 미만&#10;- 영업 관련 업무 담당자"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  템플릿 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    console.log('⏳ BSCourseManagement 로딩 중...');
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-64 p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin"></div>
            <p className="text-gray-600 text-sm">BS 과정 데이터 로딩 중...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  console.log('🎯 BSCourseManagement 메인 렌더링 시작', {
    templates: templates.length,
    rounds: rounds.length,
    summary: summary.length,
    viewMode
  });

  return (
    <PageContainer>
      {/* 필터 - 과정 관리 뷰에서만 표시 */}
      {viewMode === 'rounds' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <select
              id="template-filter"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 sm:w-64 border-2 border-gray-200 rounded-lg px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="all">모든 상태</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 전체 현황 */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.map((item, index) => (
              <div key={index} className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${item.template_name === 'BS Basic'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-purple-100 text-purple-600'
                      }`}>
                      <AcademicCapIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-card-foreground">{item.template_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        활성 차수: {item.active_rounds}개 | 수강생: {item.total_trainees}명
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">이번 달 수업</div>
                    <div className="text-2xl font-bold text-card-foreground">{item.this_month_sessions}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-card-foreground">{item.completion_stats.completed_rounds}</div>
                    <div className="text-xs text-muted-foreground">완료 차수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-card-foreground">{item.completion_stats.total_graduates}</div>
                    <div className="text-xs text-muted-foreground">총 수료생</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">{item.completion_stats.average_satisfaction}</div>
                    <div className="text-xs text-muted-foreground">평균 만족도</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 최근 차수 목록 */}
          <div className="bg-card rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-card-foreground">최근 차수</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rounds.slice(0, 4).map(round => (
                  <div key={round.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-card-foreground">{round.title}</h3>
                        <p className="text-sm text-muted-foreground">강사: {round.instructor_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(round.status)}`}>
                        {getStatusLabel(round.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-4 h-4 mr-1" />
                          {round.start_date}
                        </div>
                        <div className="flex items-center">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          {round.current_trainees}/{round.max_trainees}
                        </div>
                      </div>
                      <button
                        onClick={() => {/* Navigate to rounds tab - handled by parent */ }}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        상세보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 차수 관리 */}
      {viewMode === 'rounds' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {rounds.map(round => (
              <div key={round.id} className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                {/* 헤더 */}
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-card-foreground">{round.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(round.status)}`}>
                      {getStatusLabel(round.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {round.manager_name ? `운영: ${round.manager_name}` : '운영 담당자 미배정'}
                  </p>
                </div>

                {/* 상세 정보 */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDaysIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{round.start_date} ~ {round.end_date}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>수강생: {round.current_trainees}/{round.max_trainees}명</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{round.location}</span>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="p-6 pt-0">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewRound(round)}
                      className="btn-neutral btn-sm flex-1 flex items-center justify-center"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      상세
                    </button>
                    <button
                      onClick={() => handleEditRound(round)}
                      className="btn-slate btn-sm flex-1 flex items-center justify-center"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      편집
                    </button>
                    {round.status === 'recruiting' && (
                      <button
                        onClick={() => handleStartRound(round)}
                        className="btn-primary btn-sm flex-1 flex items-center justify-center"
                      >
                        <PlayIcon className="w-4 h-4 mr-1" />
                        시작
                      </button>
                    )}
                    {round.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteRound(round)}
                        className="btn-primary btn-sm flex-1 flex items-center justify-center"
                      >
                        <StopIcon className="w-4 h-4 mr-1" />
                        완료
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 과정이 없을 때 */}
          {rounds.length === 0 && (
            <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-border">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">등록된 과정이 없습니다</h3>
              <p className="text-muted-foreground mb-6">첫 번째 과정을 생성해보세요.</p>
              <button
                onClick={() => setIsRoundModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center px-4 py-2 rounded-full font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                새 과정 생성
              </button>
            </div>
          )}
        </div>
      )}

      {/* 템플릿 편집 */}
      {viewMode === 'templates' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-card-foreground">과정 템플릿 관리</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  BS Basic과 BS Advanced 템플릿의 커리큘럼과 내용을 수정할 수 있습니다.
                </p>
                {isAdmin && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    🔐 관리자 권한으로 템플릿 삭제가 가능합니다
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsNewTemplateModalOpen(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                새 과정 추가
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map(template => (
                <div key={template.id} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* 템플릿 헤더 */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${template.category === 'basic'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                      }`}>
                      {template.category === 'basic' ? 'Basic' : 'Advanced'}
                    </span>
                  </div>

                  {/* 템플릿 정보 */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <CalendarDaysIcon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <div className="text-lg font-bold text-card-foreground">{template.duration_days}</div>
                      <div className="text-xs text-muted-foreground">일</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <ClockIcon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <div className="text-lg font-bold text-card-foreground">{template.total_hours}</div>
                      <div className="text-xs text-muted-foreground">시간</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <AcademicCapIcon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <div className="text-lg font-bold text-card-foreground">{template.curriculum?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">커리큘럼</div>
                    </div>
                  </div>

                  {/* 학습 목표 */}
                  {template.objectives && template.objectives.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-card-foreground mb-2">학습 목표</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {template.objectives.slice(0, 3).map((objective, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="inline-block w-1 h-1 bg-muted-foreground rounded-lg mt-2 mr-2 flex-shrink-0"></span>
                            {objective}
                          </li>
                        ))}
                        {template.objectives.length > 3 && (
                          <li className="text-muted-foreground">
                            +{template.objectives.length - 3}개 더보기
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* 커리큘럼 미리보기 */}
                  {template.curriculum && template.curriculum.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-card-foreground mb-2">커리큘럼 구성</h4>
                      <div className="space-y-2">
                        {template.curriculum.slice(0, 2).map((curriculum, idx) => (
                          <div key={curriculum.id} className="flex items-center justify-between text-sm">
                            <span className="text-card-foreground">
                              {curriculum.day}일차: {curriculum.title}
                            </span>
                            <span className="text-muted-foreground">{curriculum.duration_hours}h</span>
                          </div>
                        ))}
                        {template.curriculum.length > 2 && (
                          <div className="text-sm text-muted-foreground">
                            +{template.curriculum.length - 2}개 커리큘럼 더보기
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      편집
                    </button>
                    <button className="btn-secondary">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        title="템플릿 삭제 (관리자)"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 모달들 */}
      {isRoundModalOpen && <CreateRoundModal />}
      {templateEditModal.isOpen && <TemplateEditModal />}
      {isNewTemplateModalOpen && <NewTemplateModal />}
      {roundDetailModal.isOpen && <RoundDetailModal />}
      {roundEditModal.isOpen && <RoundEditModal />}
    </PageContainer>
  );

  // 차수 상세 보기 모달
  function RoundDetailModal() {
    if (!roundDetailModal.isOpen || !roundDetailModal.round) return null;

    const round = roundDetailModal.round;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden border border-border">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{round.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">차수 상세 정보</p>
            </div>
            <button
              onClick={() => setRoundDetailModal({ isOpen: false, round: null })}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            <div className="space-y-6">
              {/* 상태 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">상태</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(round.status)}`}>
                  {getStatusLabel(round.status)}
                </span>
              </div>

              {/* 기본 정보 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">차수</h3>
                <p className="text-card-foreground">{round.round_number}차</p>
              </div>

              {/* 운영 담당자 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">운영 담당자</h3>
                <p className="text-card-foreground">
                  {round.manager_name || '미배정'}
                </p>
              </div>

              {/* 강사 배정 안내 */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  💡 강사는 세션(일정)별로 배정됩니다. 과정 플래너에서 관리하세요.
                </p>
              </div>

              {/* 일정 */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">교육 일정</h3>
                <div className="flex items-center text-card-foreground">
                  <CalendarDaysIcon className="w-5 h-5 mr-2 text-muted-foreground" />
                  {round.start_date} ~ {round.end_date}
                </div>
              </div>

              {/* 수강 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">수강생</h3>
                  <div className="flex items-center text-card-foreground">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-muted-foreground" />
                    {round.current_trainees}/{round.max_trainees}명
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">강의 장소</h3>
                  <div className="flex items-center text-card-foreground">
                    <MapPinIcon className="w-5 h-5 mr-2 text-muted-foreground" />
                    {round.location}
                  </div>
                </div>
              </div>

              {/* 설명 */}
              {round.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">설명</h3>
                  <p className="text-card-foreground whitespace-pre-wrap">{round.description}</p>
                </div>
              )}

              {/* 세션 정보 */}
              {round.sessions && round.sessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">세션 목록</h3>
                  <div className="space-y-2">
                    {round.sessions.map((session, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-card-foreground">{session.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {session.scheduled_date} {session.start_time} ~ {session.end_time}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${session.status === 'completed'
                            ? 'bg-green-500/10 text-green-700'
                            : session.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>
                            {session.status === 'completed' ? '완료' : session.status === 'in_progress' ? '진행중' : '예정'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t border-border">
            <button
              onClick={() => setRoundDetailModal({ isOpen: false, round: null })}
              className="btn-secondary"
            >
              닫기
            </button>
            <button
              onClick={() => {
                setRoundDetailModal({ isOpen: false, round: null });
                handleEditRound(round);
              }}
              className="btn-primary"
            >
              편집
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 차수 편집 모달
  function RoundEditModal() {
    const [formData, setFormData] = useState<CourseRound | null>(null);

    useEffect(() => {
      if (roundEditModal.round) {
        setFormData(roundEditModal.round);
      }
    }, [roundEditModal.round]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData) {
        await handleSaveRound(formData);
      }
    };

    if (!roundEditModal.isOpen || !formData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">차수 편집</h2>
            <button
              onClick={() => setRoundEditModal({ isOpen: false, round: null })}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* 차수 번호 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">차수</label>
                <input
                  type="number"
                  value={formData.round_number}
                  onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) || 1 })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  min="1"
                  required
                />
              </div>

              {/* 운영 담당자 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">운영 담당자</label>
                <select
                  value={formData.manager_id || ''}
                  onChange={(e) => {
                    const selectedManager = managers.find(m => m.id === e.target.value);
                    setFormData({
                      ...formData,
                      manager_id: e.target.value || undefined,
                      manager_name: selectedManager?.name || undefined
                    });
                  }}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                >
                  <option value="">선택</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  * 운영 담당자 (course_manager 역할)
                </p>
              </div>

              {/* 시작일, 종료일 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">시작일</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">종료일</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>

              {/* 입과 인원 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">입과 인원</label>
                <input
                  type="number"
                  value={formData.max_trainees}
                  onChange={(e) => setFormData({ ...formData, max_trainees: parseInt(e.target.value) || 20 })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  min="1"
                  required
                />
              </div>

              {/* 강의 장소 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">장소</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">강의실을 선택하세요</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.name}>
                      {classroom.name} (위치: {classroom.location || '미지정'}, 수용: {classroom.capacity}명)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  * 자원 관리에서 생성한 강의실 목록
                </p>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                >
                  <option value="planning">기획 중</option>
                  <option value="recruiting">모집 중</option>
                  <option value="in_progress">진행 중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">설명</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-border">
              <button
                type="button"
                onClick={() => handleDeleteRound(formData)}
                className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                삭제
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setRoundEditModal({ isOpen: false, round: null })}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 새 차수 생성 모달
  function CreateRoundModal() {
    const [formData, setFormData] = useState({
      template_id: '',
      round_number: 1,
      title: '',
      instructor_name: '',
      manager_id: '' as string | undefined,
      manager_name: '' as string | undefined,
      start_date: '',
      end_date: '',
      max_trainees: 20,
      location: '',
      description: '',
      auto_generate_title: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        console.log('새 차수 생성:', formData);

        const selectedTemplate = templates.find(t => t.id === formData.template_id);
        const newRound: Partial<CourseRound> = {
          id: `round-${Date.now()}`,
          template_id: formData.template_id,
          round_number: formData.round_number,
          title: formData.auto_generate_title
            ? `${selectedTemplate?.name} ${formData.round_number}차`
            : formData.title,
          instructor_name: '강사 미배정', // 세션별로 배정 예정
          manager_id: formData.manager_id,
          manager_name: formData.manager_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_trainees: formData.max_trainees,
          current_trainees: 0,
          location: formData.location,
          description: formData.description,
          status: 'planning' as const,
          sessions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // 실제로는 서비스를 통해 저장
        // await CourseTemplateService.createRound(newRound);

        setIsRoundModalOpen(false);
        setFormData({
          template_id: '',
          round_number: 1,
          title: '',
          instructor_name: '',
          manager_id: undefined,
          manager_name: undefined,
          start_date: '',
          end_date: '',
          max_trainees: 20,
          location: '',
          description: '',
          auto_generate_title: true
        });

        toast.success('새 차수가 생성되었습니다.');
        await loadData();
      } catch (error) {
        console.error('차수 생성 오류:', error);
        toast.error('차수 생성 중 오류가 발생했습니다.');
      }
    };

    // 자동 제목 생성
    React.useEffect(() => {
      if (formData.auto_generate_title && formData.template_id && formData.round_number) {
        const selectedTemplate = templates.find(t => t.id === formData.template_id);
        if (selectedTemplate) {
          setFormData(prev => ({
            ...prev,
            title: `${selectedTemplate.name} ${formData.round_number}차`
          }));
        }
      }
    }, [formData.template_id, formData.round_number, formData.auto_generate_title, templates]);

    if (!isRoundModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-lg max-w-2xl w-full border border-border max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">새 과정 생성</h2>
            <button
              onClick={() => setIsRoundModalOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">

              {/* 과정 (프로그램) */}
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">과정 (프로그램)</h3>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">과정명</label>
                  <input
                    type="text"
                    placeholder="과정을 선택하세요"
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    readOnly
                  />
                </div>
              </div>

              {/* 등록된 과정 */}
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-4">등록된 과정</h3>
                <div className="max-h-[300px] overflow-y-auto border border-border rounded-lg p-3 bg-muted/20">
                  <div className="space-y-3">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={`border rounded-full p-3 cursor-pointer transition-colors bg-card ${formData.template_id === template.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, template_id: template.id }))}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-card-foreground">{template.name}</h4>
                              {template.category_data && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${template.category_data.color}20`,
                                    color: template.category_data.color
                                  }}
                                >
                                  {template.category_data.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            {template.category_data?.parent_name && (
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {template.category_data.parent_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              type="button"
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-full hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRoundModalOpen(false);
                                handleEditTemplate(template);
                              }}
                              title="템플릿 편집"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                className="p-1.5 text-muted-foreground hover:text-destructive rounded-full hover:bg-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }}
                                title="템플릿 삭제 (관리자)"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 교육 연도, 차수, 일자, 예상 참가자 수 */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">교육 연도</label>
                  <select className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring">
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">차수</label>
                  <input
                    type="number"
                    value={formData.round_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, round_number: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">일자</label>
                  <input
                    type="number"
                    defaultValue="1"
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">예상 참가자 수</label>
                  <input
                    type="number"
                    value={formData.max_trainees}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_trainees: parseInt(e.target.value) || 20 }))}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    min="1"
                  />
                </div>
              </div>

              {/* 제목 (자동 생성) */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">제목 (자동 생성)</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_generate_title: e.target.checked }))}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">제목 설문 (마지막 날 설문)</span>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  placeholder="자동으로 생성됩니다"
                  readOnly={formData.auto_generate_title}
                />
              </div>

              {/* 시작일시, 종료일시 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">시작일시</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">종료일시</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
              </div>

              {/* 강의 장소 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">장소</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                >
                  <option value="">강의실을 선택하세요</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.name}>
                      {classroom.name} (위치: {classroom.location || '미지정'}, 수용: {classroom.capacity}명)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  * 자원 관리에서 생성한 강의실 목록
                </p>
              </div>

              {/* 운영 담당자 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">운영 담당자</label>
                <select
                  value={formData.manager_id || ''}
                  onChange={(e) => {
                    const selectedManager = managers.find(m => m.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      manager_id: e.target.value || undefined,
                      manager_name: selectedManager?.name || undefined
                    }));
                  }}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                >
                  <option value="">선택</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  * 운영 담당자 (course_manager 역할)
                </p>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  rows={4}
                  placeholder="설문에 대한 설명을 입력하세요"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-border">
              <button
                type="button"
                onClick={() => setIsRoundModalOpen(false)}
                className="btn-neutral px-4 py-2 text-sm font-medium rounded-full"
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-base btn-primary"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

};

export default BSCourseManagement;