import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { CourseTemplateService } from '../../services/course-template.service';
import type { CourseTemplate } from '../../types/course-template.types';
import toast from 'react-hot-toast';

type SortOption = 'name' | 'updated_at' | 'usage_count' | 'created_at';

const UnifiedTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [selectedTemplate, setSelectedTemplate] = useState<CourseTemplate | null>(null);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CourseTemplate | null>(null);
  const [templateEditModal, setTemplateEditModal] = useState<{
    isOpen: boolean;
    template: CourseTemplate | null;
  }>({ isOpen: false, template: null });
  const [templateUsageCount, setTemplateUsageCount] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const templatesData = await CourseTemplateService.getTemplates();
      setTemplates(templatesData);

      // 템플릿 사용 통계 로드 (모의 데이터 - 실제로는 API에서 가져와야 함)
      const usageData: Record<string, number> = {};
      templatesData.forEach(template => {
        usageData[template.id] = Math.floor(Math.random() * 20); // 임시 데이터
      });
      setTemplateUsageCount(usageData);
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      toast.error('템플릿 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // 템플릿 복제 기능
  const handleDuplicateTemplate = async (template: CourseTemplate) => {
    try {
      const duplicatedTemplate = {
        ...template,
        name: `${template.name} (복사본)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined
      };

      await CourseTemplateService.createTemplate(duplicatedTemplate as any);
      await loadData();
      toast.success('템플릿이 성공적으로 복제되었습니다.');
    } catch (error) {
      console.error('템플릿 복제 실패:', error);
      toast.error('템플릿 복제 중 오류가 발생했습니다.');
    }
  };

  // 필터링 및 정렬
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'usage_count':
          return (templateUsageCount[b.id] || 0) - (templateUsageCount[a.id] || 0);
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

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
                    className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'basic' | 'advanced' })}
                    className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
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
            <h2 className="text-xl font-bold text-gray-900">새 템플릿 생성</h2>
            <button
              onClick={() => setIsNewTemplateModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    className="w-full border-2 border-gray-200 rounded-xl px-6 py-3.5 text-base bg-white text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
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
                  placeholder="학습 목표를 한 줄씩 입력하세요"
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
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">템플릿 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 검색 및 액션 바 */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="템플릿 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring bg-background text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="sm:w-40 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.25em 1.25em',
                paddingRight: '2rem'
              }}
            >
              <option value="all">모든 카테고리</option>
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sm:w-40 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.25em 1.25em',
                paddingRight: '2rem'
              }}
            >
              <option value="updated_at">최근 수정일순</option>
              <option value="name">이름순</option>
              <option value="usage_count">사용 횟수순</option>
              <option value="created_at">생성일순</option>
            </select>

            <button
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              새 템플릿
            </button>
          </div>
        </div>
      </div>

      {/* 템플릿 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            {/* 헤더 */}
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.category === 'basic'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {template.category === 'basic' ? 'Basic' : 'Advanced'}
                    </span>
                    {templateUsageCount[template.id] !== undefined && templateUsageCount[template.id] > 0 && (
                      <span className="flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        <ChartBarIcon className="w-3 h-3 mr-1" />
                        {templateUsageCount[template.id]}개 과정에서 사용 중
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="p-6">
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

              {/* 학습 목표 미리보기 */}
              {template.objectives && template.objectives.length > 0 && (
                <div className="mb-4">
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
              )}

              {/* 커리큘럼 미리보기 */}
              {template.curriculum && template.curriculum.length > 0 && (
                <div className="mb-4">
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
              <div className="flex space-x-2 pt-4 border-t border-border">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  편집
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="border border-border hover:bg-accent flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  title="템플릿 복제"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="border border-border hover:bg-accent flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  title="상세보기"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 템플릿이 없을 때 */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl shadow-sm border border-border">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-card-foreground mb-2">등록된 템플릿이 없습니다</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || categoryFilter !== 'all'
              ? '검색 조건에 맞는 템플릿이 없습니다.'
              : '첫 번째 템플릿을 생성해보세요.'
            }
          </p>
          <button
            onClick={() => setIsNewTemplateModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            새 템플릿 생성
          </button>
        </div>
      )}

      {/* 템플릿 상세 모달 */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.category === 'basic' ? 'Basic' : 'Advanced'}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">과정 설명</h4>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">기간:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.duration_days}일</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">총 시간:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.total_hours}시간</span>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">커리큘럼:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.curriculum.length}개</span>
                  </div>
                </div>

                {selectedTemplate.objectives && selectedTemplate.objectives.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">학습 목표</h4>
                    <ul className="space-y-1">
                      {selectedTemplate.objectives.map((objective, index) => (
                        <li key={index} className="text-sm text-gray-600">• {objective}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedTemplate.curriculum && selectedTemplate.curriculum.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">커리큘럼</h4>
                    <div className="space-y-3">
                      {selectedTemplate.curriculum.map((curriculum, index) => (
                        <div key={curriculum.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{curriculum.day}일차: {curriculum.title}</h5>
                            <span className="text-sm text-gray-600">{curriculum.duration_hours}시간</span>
                          </div>
                          {curriculum.description && (
                            <p className="text-sm text-gray-600 mb-2">{curriculum.description}</p>
                          )}
                          {curriculum.learning_objectives && curriculum.learning_objectives.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {curriculum.learning_objectives.map((obj: string, idx: number) => (
                                <li key={idx}>• {obj}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 모달들 */}
      {templateEditModal.isOpen && <TemplateEditModal />}
      {isNewTemplateModalOpen && <NewTemplateModal />}
    </div>
  );
};

export default UnifiedTemplateManagement;
