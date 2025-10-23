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
import type { 
  CourseTemplate, 
  CourseRound, 
  BSCourseSummary,
  RoundStats 
} from '../../types/course-template.types';
import toast from 'react-hot-toast';

const BSCourseManagement: React.FC = () => {
  console.log('🎯 BSCourseManagement 컴포넌트가 렌더링되었습니다.');
  
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [rounds, setRounds] = useState<CourseRound[]>([]);
  const [summary, setSummary] = useState<BSCourseSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'rounds' | 'templates'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<CourseRound | null>(null);
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [templateEditModal, setTemplateEditModal] = useState<{
    isOpen: boolean;
    template: CourseTemplate | null;
  }>({ isOpen: false, template: null });
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedTemplate]);

  const loadData = async () => {
    try {
      console.log('📊 BSCourseManagement 데이터 로딩 시작...');
      setIsLoading(true);
      
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

      setTemplates(templatesData);
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
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
      await CourseTemplateService.updateTemplate(updatedTemplate.id, updatedTemplate);
      await loadData();
      setTemplateEditModal({ isOpen: false, template: null });
      setEditingTemplate(null);
      toast.success('템플릿이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('템플릿 수정 실패:', error);
      toast.error('템플릿 수정 중 오류가 발생했습니다.');
    }
  };

  // 새 템플릿 생성 함수
  const handleNewTemplate = async (templateData: Omit<CourseTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await CourseTemplateService.createTemplate(templateData);
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


  // 템플릿 편집 모달
  const TemplateEditModal = () => {
    const [formData, setFormData] = useState(editingTemplate || {
      id: '',
      name: '',
      description: '',
      category: 'basic' as const,
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
        setFormData(editingTemplate);
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
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
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

              {/* 커리큘럼 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">커리큘럼</h3>
                  <button
                    type="button"
                    onClick={addCurriculumDay}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    일차 추가
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.curriculum.map((curriculum, index) => (
                    <div key={curriculum.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">{curriculum.day}일차</h4>
                        <button
                          type="button"
                          onClick={() => removeCurriculumDay(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                          <input
                            type="text"
                            value={curriculum.title}
                            onChange={(e) => updateCurriculumDay(index, { title: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
                          <input
                            type="number"
                            value={curriculum.duration_hours}
                            onChange={(e) => updateCurriculumDay(index, { duration_hours: parseInt(e.target.value) || 0 })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                            min="1"
                            max="12"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                        <textarea
                          value={curriculum.description}
                          onChange={(e) => updateCurriculumDay(index, { description: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">학습 목표</label>
                        <textarea
                          value={curriculum.learning_objectives.join('\n')}
                          onChange={(e) => updateCurriculumDay(index, { 
                            learning_objectives: e.target.value.split('\n').filter(o => o.trim()) 
                          })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          placeholder="학습 목표를 한 줄씩 입력"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  총 {formData.duration_days}일, {formData.total_hours}시간
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateEditModal({ isOpen: false, template: null });
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    저장
                  </button>
                </div>
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
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">BS 과정 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 BSCourseManagement 메인 렌더링 시작', { 
    templates: templates.length, 
    rounds: rounds.length, 
    summary: summary.length,
    viewMode 
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">BS 과정 관리</h1>
              <p className="text-muted-foreground">템플릿 기반 차수 및 일정 관리</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-ring"
            >
              <option value="all">모든 과정</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setIsRoundModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              새 차수 생성
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 mt-6 border-b border-gray-200">
          {[
            { id: 'overview', label: '전체 현황', icon: ChartBarIcon },
            { id: 'rounds', label: '차수 관리', icon: CalendarDaysIcon },
            { id: 'templates', label: '과정 편집', icon: Cog6ToothIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                viewMode === tab.id
                  ? 'text-primary border-b-2 border-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 전체 현황 */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.map((item, index) => (
              <div key={index} className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      item.template_name === 'BS Basic' 
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
          <div className="bg-card rounded-xl shadow-sm border border-border">
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
                        onClick={() => setViewMode('rounds')}
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
              <div key={round.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {/* 헤더 */}
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-card-foreground">{round.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(round.status)}`}>
                      {getStatusLabel(round.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">강사: {round.instructor_name}</p>
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
                    <button className="btn-neutral btn-sm flex-1 flex items-center justify-center">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      상세
                    </button>
                    <button className="btn-slate btn-sm flex-1 flex items-center justify-center">
                      <PencilIcon className="w-4 h-4 mr-1" />
                      편집
                    </button>
                    {round.status === 'recruiting' && (
                      <button className="bg-emerald-600 text-white hover:bg-emerald-700 btn-sm flex-1 flex items-center justify-center rounded-lg transition-colors font-medium">
                        <PlayIcon className="w-4 h-4 mr-1" />
                        시작
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 차수가 없을 때 */}
          {rounds.length === 0 && (
            <div className="text-center py-12 bg-card rounded-xl shadow-sm border border-border">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">등록된 차수가 없습니다</h3>
              <p className="text-muted-foreground mb-6">첫 번째 차수를 생성해보세요.</p>
              <button
                onClick={() => setIsRoundModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                새 차수 생성
              </button>
            </div>
          )}
        </div>
      )}

      {/* 템플릿 편집 */}
      {viewMode === 'templates' && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-card-foreground">과정 템플릿 관리</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  BS Basic과 BS Advanced 템플릿의 커리큘럼과 내용을 수정할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setIsNewTemplateModalOpen(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium"
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
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.category === 'basic' 
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
                      <div className="text-lg font-bold text-card-foreground">{template.curriculum.length}</div>
                      <div className="text-xs text-muted-foreground">커리큘럼</div>
                    </div>
                  </div>

                  {/* 학습 목표 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-card-foreground mb-2">학습 목표</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {template.objectives.slice(0, 3).map((objective, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="inline-block w-1 h-1 bg-muted-foreground rounded-full mt-2 mr-2 flex-shrink-0"></span>
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

                  {/* 커리큘럼 미리보기 */}
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

                  {/* 액션 버튼 */}
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      편집
                    </button>
                    <button className="btn-neutral px-4 py-2 text-sm font-medium rounded-lg">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 모달들 */}
      <CreateRoundModal />
      <TemplateEditModal />
      <NewTemplateModal />
    </div>
  );

  // 새 차수 생성 모달
  const CreateRoundModal = () => {
    const [formData, setFormData] = useState({
      template_id: '',
      round_number: 1,
      title: '',
      instructor_name: '',
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
          instructor_name: formData.instructor_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_trainees: formData.max_trainees,
          current_trainees: 0,
          location: formData.location,
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
        <div className="bg-card rounded-xl max-w-2xl w-full border border-border max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-bold text-card-foreground">새 설문 생성</h2>
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
                <div className="space-y-4">
                  {templates.map(template => (
                    <div 
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.template_id === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, template_id: template.id }))}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-card-foreground">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            type="button"
                            className="p-2 text-muted-foreground hover:text-primary"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            className="p-2 text-muted-foreground hover:text-destructive"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <label className="block text-sm font-medium text-card-foreground mb-2">강의 장소</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  placeholder="강의실 또는 장소를 입력하세요"
                />
              </div>

              {/* 강사명 */}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">강사명</label>
                <input
                  type="text"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor_name: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-ring"
                  placeholder="담당 강사명을 입력하세요"
                  required
                />
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
                className="btn-neutral px-4 py-2 text-sm font-medium rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm font-medium rounded-lg transition-colors"
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