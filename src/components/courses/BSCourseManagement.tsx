'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  CalendarDays,
  UsersRound,
  Clock,
  MapPin,
  BarChart2,
  Settings2,
  Eye,
  Pencil,
  Trash2,
  Play,
  Square,
  Users,
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'recruiting':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'in_progress':
        return 'bg-green-500/10 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'cancelled':
        return 'bg-destructive/10 dark:bg-red-900/30 text-destructive dark:text-red-400 border-destructive/50 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">템플릿 편집</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{editingTemplate.name}</p>
            </div>
            <button
              onClick={() => {
                setTemplateEditModal({ isOpen: false, template: null });
                setEditingTemplate(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">과정명</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'basic' | 'advanced' })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow appearance-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">과정 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* 학습 목표 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">학습 목표</label>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <textarea
                    value={formData.objectives.join('\n')}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value.split('\n').filter(o => o.trim()) })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow resize-none"
                    rows={4}
                    placeholder="학습 목표를 한 줄씩 입력하세요"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                    * 각 줄이 하나의 학습 목표로 등록됩니다.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateEditModal({ isOpen: false, template: null });
                    setEditingTemplate(null);
                  }}
                  className="btn-secondary px-6 py-2.5 rounded-xl font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 rounded-xl font-bold"
                >
                  저장하기
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">새 과정 템플릿 생성</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">새로운 교육 과정의 기본 정보를 입력하세요.</p>
            </div>
            <button
              onClick={() => setIsNewTemplateModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">과정명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                    placeholder="예: BS Expert"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">카테고리 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'basic' | 'advanced' })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow appearance-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">과정 설명 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow resize-none"
                  rows={3}
                  placeholder="과정에 대한 상세 설명을 입력하세요"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">기간 (일) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                      min="1"
                      max="30"
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400 text-sm">일</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">총 시간 *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.total_hours}
                      onChange={(e) => setFormData({ ...formData, total_hours: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                      min="1"
                      max="300"
                      required
                    />
                    <span className="absolute right-4 top-3.5 text-gray-400 text-sm">시간</span>
                  </div>
                </div>
              </div>

              {/* 학습 목표 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">학습 목표</label>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <textarea
                    value={formData.objectives.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      objectives: e.target.value.split('\n').filter(o => o.trim())
                    })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow resize-none"
                    rows={4}
                    placeholder="학습 목표를 한 줄씩 입력하세요&#10;예:&#10;- 영업 기초 지식 습득&#10;- 고객 응대 스킬 향상&#10;- 영업 전략 수립 능력 개발"
                  />
                </div>
              </div>

              {/* 수강 요건 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">수강 요건</label>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <textarea
                    value={formData.requirements.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      requirements: e.target.value.split('\n').filter(r => r.trim())
                    })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow resize-none"
                    rows={3}
                    placeholder="수강 요건을 한 줄씩 입력하세요&#10;예:&#10;- 신입사원 또는 경력 1년 미만&#10;- 영업 관련 업무 담당자"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="btn-secondary px-6 py-2.5 rounded-xl font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 rounded-xl font-bold"
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
            <p className="text-gray-600 dark:text-gray-400 text-sm">BS 과정 데이터 로딩 중...</p>
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
    <div className="space-y-6">
      {/* 필터 - 과정 관리 뷰에서만 표시 */}
      {viewMode === 'rounds' && (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-4">
            <select
              id="template-filter"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 sm:w-64 border border-gray-200 dark:border-gray-600 rounded-xl px-6 py-3.5 text-base bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 dark:hover:border-gray-500 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="all">모든 과정 템플릿</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsRoundModalOpen(true)}
              className="btn-primary px-6 py-3.5 rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>새 차수 개설</span>
            </button>
          </div>
        </div>
      )}

      {/* 전체 현황 */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-8 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-2xl transition-colors duration-300 ${item.template_name === 'BS Basic'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
                      : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40'
                      }`}>
                      <GraduationCap className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.template_name}</h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
                        <span className="flex items-center">
                          <Play className="w-3 h-3 mr-1" />
                          활성 {item.active_rounds}개
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {item.total_trainees}명
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">이번 달 수업</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{item.this_month_sessions}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.completion_stats.completed_rounds}</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">완료 차수</div>
                  </div>
                  <div className="text-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">{item.completion_stats.total_graduates}</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">총 수료생</div>
                  </div>
                  <div className="text-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-1">{item.completion_stats.average_satisfaction}</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">평균 만족도</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 최근 차수 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">최근 진행 차수</h2>
              <button
                onClick={() => {
                  // 탭 변경 로직이 필요하다면 상위 컴포넌트에서 처리하거나 여기서 직접 탭 상태 변경
                  // 현재는 viewMode prop으로 제어되므로 직접 변경 불가.
                  // 하지만 탭이 상위에 있으므로 사용자가 탭을 클릭하면 됨.
                  // 여기서는 버튼을 숨기거나 다른 동작을 연결.
                }}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
              >
                전체 보기 <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rounds.slice(0, 4).map(round => (
                  <div key={round.id} className="group border border-gray-100 dark:border-gray-700 rounded-2xl p-5 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/50 transition-all duration-300 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-white dark:hover:bg-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${getStatusColor(round.status)}`}>
                            {getStatusLabel(round.status)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {round.round_number}차
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {round.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleViewRound(round)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="mr-4">{round.instructor_name || '강사 미배정'}</span>
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{round.current_trainees}/{round.max_trainees}명</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{round.start_date} ~ {round.end_date}</span>
                      </div>
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
              <div key={round.id} className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 group">
                {/* 헤더 */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full mb-2 ${getStatusColor(round.status)}`}>
                        {getStatusLabel(round.status)}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{round.title}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm text-gray-400">
                      <span className="text-xs font-bold">{round.round_number}차</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                    {round.manager_name ? `운영: ${round.manager_name}` : '운영 담당자 미배정'}
                  </p>
                </div>

                {/* 상세 정보 */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">교육 기간</p>
                      <span className="font-medium">{round.start_date} ~ {round.end_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-3 text-purple-600 dark:text-purple-400">
                      <UsersRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">수강생 현황</p>
                      <span className="font-medium">{round.current_trainees}명 / 정원 {round.max_trainees}명</span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mr-3 text-orange-600 dark:text-orange-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">강의 장소</p>
                      <span className="font-medium">{round.location}</span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleViewRound(round)}
                      className="btn-secondary py-2.5 text-sm font-bold rounded-xl flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      상세보기
                    </button>
                    <button
                      onClick={() => handleEditRound(round)}
                      className="btn-outline py-2.5 text-sm font-bold rounded-xl flex items-center justify-center"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      편집
                    </button>
                    {round.status === 'recruiting' && (
                      <button
                        onClick={() => handleStartRound(round)}
                        className="col-span-2 btn-primary py-2.5 text-sm font-bold rounded-xl flex items-center justify-center mt-2"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        과정 시작
                      </button>
                    )}
                    {round.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteRound(round)}
                        className="col-span-2 btn-primary py-2.5 text-sm font-bold rounded-xl flex items-center justify-center mt-2"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        과정 완료
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 과정이 없을 때 */}
          {rounds.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">등록된 과정이 없습니다</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                새로운 과정을 개설하여 교육을 시작해보세요. 템플릿을 기반으로 쉽게 과정을 생성할 수 있습니다.
              </p>
              <button
                onClick={() => setIsRoundModalOpen(true)}
                className="btn-primary px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                새 과정 생성
              </button>
            </div>
          )}
        </div>
      )}

      {/* 템플릿 편집 */}
      {viewMode === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">과정 템플릿 관리</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  BS Basic과 BS Advanced 템플릿의 커리큘럼과 내용을 수정할 수 있습니다.
                </p>
                {isAdmin && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center">
                    <Settings2 className="w-3 h-3 mr-1" />
                    관리자 권한으로 템플릿 삭제가 가능합니다
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsNewTemplateModalOpen(true)}
                className="btn-primary flex items-center px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                새 과정 추가
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map(template => (
                <div key={template.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-md transition-all duration-300 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-white dark:hover:bg-gray-800 group">
                  {/* 템플릿 헤더 */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${template.category === 'basic'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}>
                          {template.category === 'basic' ? 'Basic' : 'Advanced'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{template.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                    </div>
                  </div>

                  {/* 템플릿 정보 */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="text-center p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                      <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{template.duration_days}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">일</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                      <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{template.total_hours}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">시간</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                      <GraduationCap className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{template.curriculum?.length || 0}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">커리큘럼</div>
                    </div>
                  </div>

                  {/* 학습 목표 */}
                  {template.objectives && template.objectives.length > 0 && (
                    <div className="mb-6 bg-white dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">학습 목표</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        {template.objectives.slice(0, 2).map((objective, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2.5 flex-shrink-0"></span>
                            <span className="line-clamp-1">{objective}</span>
                          </li>
                        ))}
                        {template.objectives.length > 2 && (
                          <li className="text-xs text-gray-400 dark:text-gray-500 pl-4">
                            +{template.objectives.length - 2}개 더보기
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="btn-primary flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      템플릿 편집
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="btn-outline border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 rounded-xl transition-colors"
                        title="템플릿 삭제 (관리자)"
                      >
                        <Trash2 className="w-4 h-4" />
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
    </div>
  );

  // 차수 상세 보기 모달
  function RoundDetailModal() {
    if (!roundDetailModal.isOpen || !roundDetailModal.round) return null;

    const round = roundDetailModal.round;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{round.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">차수 상세 정보</p>
            </div>
            <button
              onClick={() => setRoundDetailModal({ isOpen: false, round: null })}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            <div className="space-y-8">
              {/* 상태 및 기본 정보 */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(round.status)}`}>
                    {getStatusLabel(round.status)}
                  </span>
                  <span className="text-gray-900 dark:text-white font-bold">{round.round_number}차</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <UserIcon className="w-4 h-4 mr-2" />
                  운영 담당자: <span className="text-gray-900 dark:text-white font-medium ml-1">{round.manager_name || '미배정'}</span>
                </div>
              </div>

              {/* 주요 정보 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">교육 일정</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium pl-1">{round.start_date} ~ {round.end_date}</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                      <UsersRound className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-purple-900 dark:text-purple-300">수강생</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium pl-1">{round.current_trainees}/{round.max_trainees}명</p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white dark:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-orange-900 dark:text-orange-300">강의 장소</span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium pl-1">{round.location}</p>
                </div>
              </div>

              {/* 설명 */}
              {round.description && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-1 h-4 bg-gray-900 dark:bg-white rounded-full mr-2"></div>
                    과정 설명
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {round.description}
                  </div>
                </div>
              )}

              {/* 세션 정보 */}
              {round.sessions && round.sessions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                    <div className="w-1 h-4 bg-gray-900 dark:bg-white rounded-full mr-2"></div>
                    세션 목록
                  </h3>
                  <div className="space-y-3">
                    {round.sessions.map((session, idx) => (
                      <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{session.title}</h4>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-4 h-4 mr-1.5" />
                              {session.scheduled_date} {session.start_time} ~ {session.end_time}
                            </div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${session.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : session.status === 'in_progress'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
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

          <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
            <button
              onClick={() => setRoundDetailModal({ isOpen: false, round: null })}
              className="btn-secondary px-6 py-2.5 rounded-xl font-bold"
            >
              닫기
            </button>
            <button
              onClick={() => {
                setRoundDetailModal({ isOpen: false, round: null });
                handleEditRound(round);
              }}
              className="btn-primary px-6 py-2.5 rounded-xl font-bold"
            >
              편집하기
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">차수 편집</h2>
            <button
              onClick={() => setRoundEditModal({ isOpen: false, round: null })}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                  required
                />
              </div>

              {/* 차수 번호 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">차수</label>
                <input
                  type="number"
                  value={formData.round_number}
                  onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                  min="1"
                  required
                />
              </div>

              {/* 운영 담당자 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">운영 담당자</label>
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
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow appearance-none"
                >
                  <option value="">선택</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                  * 운영 담당자 (course_manager 역할)
                </p>
              </div>

              {/* 시작일, 종료일 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">시작일</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">종료일</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                    required
                  />
                </div>
              </div>

              {/* 입과 인원 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">입과 인원</label>
                <input
                  type="number"
                  value={formData.max_trainees}
                  onChange={(e) => setFormData({ ...formData, max_trainees: parseInt(e.target.value) || 20 })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                  min="1"
                  required
                />
              </div>

              {/* 강의 장소 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">장소</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow appearance-none"
                  required
                >
                  <option value="">강의실을 선택하세요</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.name}>
                      {classroom.name} (위치: {classroom.location || '미지정'}, 수용: {classroom.capacity}명)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                  * 자원 관리에서 생성한 강의실 목록
                </p>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow appearance-none"
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
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">설명</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
              <button
                type="button"
                onClick={() => handleDeleteRound(formData)}
                className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground px-6 py-2.5 rounded-xl font-bold"
              >
                삭제
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setRoundEditModal({ isOpen: false, round: null })}
                  className="btn-secondary px-6 py-2.5 rounded-xl font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 rounded-xl font-bold"
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">새 과정 생성</h2>
            <button
              onClick={() => setIsRoundModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">

              {/* 과정 (프로그램) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="w-1 h-5 bg-blue-500 rounded-full mr-2"></div>
                  과정 (프로그램)
                </h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">과정명</label>
                  <input
                    type="text"
                    placeholder="과정을 선택하세요"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>

              {/* 등록된 과정 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="w-1 h-5 bg-purple-500 rounded-full mr-2"></div>
                  등록된 과정
                </h3>
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-700/20">
                  <div className="space-y-3">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${formData.template_id === template.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-200 dark:ring-blue-800 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, template_id: template.id }))}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 dark:text-white">{template.name}</h4>
                              {template.category_data && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                                  style={{
                                    backgroundColor: `${template.category_data.color}20`,
                                    color: template.category_data.color
                                  }}
                                >
                                  {template.category_data.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{template.description}</p>
                            {template.category_data?.parent_name && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {template.category_data.parent_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              type="button"
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRoundModalOpen(false);
                                handleEditTemplate(template);
                              }}
                              title="템플릿 편집"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template);
                                }}
                                title="템플릿 삭제 (관리자)"
                              >
                                <Trash2 className="h-4 w-4" />
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">교육 연도</label>
                  <select className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none">
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">차수</label>
                  <input
                    type="number"
                    value={formData.round_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, round_number: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">일자</label>
                  <input
                    type="number"
                    defaultValue="1"
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">예상 참가자</label>
                  <input
                    type="number"
                    value={formData.max_trainees}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_trainees: parseInt(e.target.value) || 20 }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    min="1"
                  />
                </div>
              </div>

              {/* 제목 (자동 생성) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">제목 (자동 생성)</label>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_generate_title: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">템플릿 이름과 차수를 조합하여 자동 생성</span>
                </div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${formData.auto_generate_title ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-700'}`}
                  placeholder="자동으로 생성됩니다"
                  readOnly={formData.auto_generate_title}
                />
              </div>

              {/* 시작일시, 종료일시 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">시작일시</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">종료일시</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    required
                  />
                </div>
              </div>

              {/* 강의 장소 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">장소</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
                >
                  <option value="">강의실을 선택하세요</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.name}>
                      {classroom.name} (위치: {classroom.location || '미지정'}, 수용: {classroom.capacity}명)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                  * 자원 관리에서 생성한 강의실 목록
                </p>
              </div>

              {/* 운영 담당자 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">운영 담당자</label>
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
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none"
                >
                  <option value="">선택</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                  * 운영 담당자 (course_manager 역할)
                </p>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                  rows={4}
                  placeholder="설문에 대한 설명을 입력하세요"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
              <button
                type="button"
                onClick={() => setIsRoundModalOpen(false)}
                className="btn-secondary px-6 py-2.5 rounded-xl font-bold"
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2.5 rounded-xl font-bold"
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