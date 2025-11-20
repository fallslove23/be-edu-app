/**
 * 평가 템플릿 관리 컴포넌트
 * - 과정별 평가 기준 설정
 * - 구성 요소 및 세부 항목 관리
 */

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
  evaluationTemplateService,
  evaluationComponentService,
  evaluationSubItemService,
} from '../../services/evaluation.service';
import { courseTemplateService } from '../../services/course-template.service';
import type {
  EvaluationTemplateWithComponents,
  EvaluationComponent,
  EvaluationSubItem,
  EvaluationType,
} from '../../types/evaluation.types';
import type { CourseTemplate } from '../../types/course-template.types';

export default function EvaluationTemplateManagement() {
  const [courseTemplates, setCourseTemplates] = useState<CourseTemplate[]>([]);
  const [templates, setTemplates] = useState<EvaluationTemplateWithComponents[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EvaluationTemplateWithComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showSubItemModal, setShowSubItemModal] = useState(false);

  // 폼 상태
  const [templateForm, setTemplateForm] = useState({
    course_template_id: '',
    name: '',
    description: '',
    passing_total_score: 80,
  });

  const [componentForm, setComponentForm] = useState({
    name: '',
    code: '',
    weight_percentage: '' as any,
    evaluation_type: 'instructor_manual' as EvaluationType,
    description: '',
  });

  // 이름에서 코드 자동 생성
  const generateCode = (name: string): string => {
    // 한글을 영어로 변환 (간단한 매핑)
    const koreanToEnglish: Record<string, string> = {
      '실기': 'practical',
      '평가': 'evaluation',
      '이론': 'theory',
      '태도': 'attitude',
      '활동': 'activity',
      '일지': 'journal',
      'BS': 'bs',
      '점수': 'score',
    };

    let code = name;
    Object.entries(koreanToEnglish).forEach(([korean, english]) => {
      code = code.replace(new RegExp(korean, 'g'), english);
    });

    // 공백을 언더스코어로, 특수문자 제거, 소문자로
    return code
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const [subItemForm, setSubItemForm] = useState({
    component_id: '',
    name: '',
    code: '',
    max_score: 5,
    description: '',
  });

  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseTpls, evalTpls] = await Promise.all([
        courseTemplateService.getAll(),
        evaluationTemplateService.getAll(),
      ]);

      setCourseTemplates(courseTpls);

      // 각 템플릿의 구성 요소 로드
      const templatesWithComponents = await Promise.all(
        evalTpls.map((tpl) => evaluationTemplateService.getWithComponents(tpl.id))
      );

      setTemplates(templatesWithComponents.filter((t) => t !== null) as EvaluationTemplateWithComponents[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await evaluationTemplateService.create(templateForm);
      await loadData();
      setShowTemplateModal(false);
      resetTemplateForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '템플릿 생성 실패');
    }
  };

  const handleCreateComponent = async () => {
    if (!selectedTemplate) return;

    // 유효성 검사
    if (!componentForm.name.trim()) {
      alert('항목 이름을 입력해주세요');
      return;
    }
    if (!componentForm.weight_percentage || componentForm.weight_percentage <= 0) {
      alert('가중치를 입력해주세요 (0보다 큰 값)');
      return;
    }

    try {
      const dataToSend = {
        template_id: selectedTemplate.id,
        name: componentForm.name,
        code: componentForm.code,
        weight_percentage: parseFloat(componentForm.weight_percentage as any) || 0,
        evaluation_type: componentForm.evaluation_type,
        description: componentForm.description,
      };

      console.log('Creating component with data:', dataToSend);

      await evaluationComponentService.create(dataToSend);
      await loadData();
      setShowComponentModal(false);
      resetComponentForm();
    } catch (err) {
      console.error('Component creation error:', err);
      alert(err instanceof Error ? err.message : '구성 요소 생성 실패');
    }
  };

  const handleCreateSubItem = async () => {
    try {
      await evaluationSubItemService.create(subItemForm);
      await loadData();
      setShowSubItemModal(false);
      resetSubItemForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '세부 항목 생성 실패');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('이 평가 템플릿을 삭제하시겠습니까?')) return;

    try {
      await evaluationTemplateService.delete(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '템플릿 삭제 실패');
    }
  };

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('이 평가 구성 요소를 삭제하시겠습니까?')) return;

    try {
      await evaluationComponentService.delete(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '구성 요소 삭제 실패');
    }
  };

  const handleDeleteSubItem = async (id: string) => {
    if (!confirm('이 세부 항목을 삭제하시겠습니까?')) return;

    try {
      await evaluationSubItemService.delete(id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '세부 항목 삭제 실패');
    }
  };

  const toggleComponent = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      course_template_id: '',
      name: '',
      description: '',
      passing_total_score: 80,
    });
  };

  const resetComponentForm = () => {
    setComponentForm({
      name: '',
      code: '',
      weight_percentage: 0,
      evaluation_type: 'instructor_manual',
      description: '',
    });
  };

  const resetSubItemForm = () => {
    setSubItemForm({
      component_id: '',
      name: '',
      code: '',
      max_score: 5,
      description: '',
    });
  };

  const getEvaluationTypeLabel = (type: EvaluationType) => {
    const labels: Record<EvaluationType, string> = {
      instructor_manual: '강사 수동 입력',
      exam_auto: '시험 자동 채점',
      activity_auto: '활동 자동 집계',
      peer_review: '동료 평가',
      self_assessment: '자가 평가',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 dark:bg-red-900/20 border border-destructive/50 dark:border-red-800 rounded-lg p-4">
        <p className="text-destructive dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">평가 템플릿 관리</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            과정별 평가 기준을 설정하고 관리합니다
          </p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          새 템플릿
        </button>
      </div>

      {/* 템플릿 목록 */}
      <div className="grid gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
          >
            {/* 템플릿 헤더 */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      수료 기준: <span className="font-medium text-gray-900 dark:text-gray-100">{template.passing_total_score}점</span>
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      template.is_active
                        ? 'bg-green-500/10 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {template.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowComponentModal(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-primary/20/20 rounded"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20 rounded"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 구성 요소 목록 */}
            <div className="p-6">
              {template.components.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  평가 구성 요소가 없습니다. 추가 버튼을 눌러 생성하세요.
                </p>
              ) : (
                <div className="space-y-4">
                  {template.components.map((component) => (
                    <div
                      key={component.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* 구성 요소 헤더 */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {component.name}
                              </h4>
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                                {component.weight_percentage}%
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getEvaluationTypeLabel(component.evaluation_type)}
                              </span>
                            </div>
                            {component.description && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {component.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSubItemForm({ ...subItemForm, component_id: component.id });
                                setShowSubItemModal(true);
                              }}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-primary/20/20 rounded"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleComponent(component.id)}
                              className="p-1 text-foreground hover:bg-muted rounded"
                            >
                              {expandedComponents.has(component.id) ? (
                                <ChevronUpIcon className="w-4 h-4" />
                              ) : (
                                <ChevronDownIcon className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteComponent(component.id)}
                              className="p-1 text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20 rounded"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 세부 항목 목록 (접기/펼치기) */}
                      {expandedComponents.has(component.id) && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                          {component.sub_items.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
                              세부 항목이 없습니다
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {component.sub_items.map((subItem) => (
                                <div
                                  key={subItem.id}
                                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700"
                                >
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {subItem.name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                      ({subItem.code})
                                    </span>
                                    {subItem.description && (
                                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        {subItem.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {subItem.max_score}점
                                    </span>
                                    <button
                                      onClick={() => handleDeleteSubItem(subItem.id)}
                                      className="p-1 text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20 rounded"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">평가 템플릿이 없습니다</p>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              첫 템플릿 만들기
            </button>
          </div>
        )}
      </div>

      {/* 템플릿 생성 모달 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              새 평가 템플릿
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  과정 템플릿
                </label>
                <select
                  value={templateForm.course_template_id}
                  onChange={(e) => setTemplateForm({ ...templateForm, course_template_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">선택하세요</option>
                  {courseTemplates.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: BS Basic 표준 평가"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: 실기 50% + 이론 30% + 태도 20%"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  수료 기준 점수
                </label>
                <input
                  type="number"
                  value={templateForm.passing_total_score}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, passing_total_score: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  resetTemplateForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleCreateTemplate}
                className="btn-primary"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구성 요소 생성 모달 */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              새 평가 구성 요소
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  항목 이름
                </label>
                <input
                  type="text"
                  value={componentForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = generateCode(name);
                    setComponentForm({ ...componentForm, name, code });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: 실기평가"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  코드 (자동 생성)
                </label>
                <input
                  type="text"
                  value={componentForm.code}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  placeholder="이름 입력 시 자동 생성됩니다"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  가중치 (%)
                </label>
                <input
                  type="number"
                  value={componentForm.weight_percentage}
                  onChange={(e) =>
                    setComponentForm({ ...componentForm, weight_percentage: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  평가 방식
                </label>
                <select
                  value={componentForm.evaluation_type}
                  onChange={(e) =>
                    setComponentForm({ ...componentForm, evaluation_type: e.target.value as EvaluationType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="instructor_manual">강사 수동 입력</option>
                  <option value="exam_auto">시험 자동 채점</option>
                  <option value="activity_auto">활동 자동 집계</option>
                  <option value="peer_review">동료 평가</option>
                  <option value="self_assessment">자가 평가</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={componentForm.description}
                  onChange={(e) => setComponentForm({ ...componentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowComponentModal(false);
                  resetComponentForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleCreateComponent}
                className="btn-primary"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 세부 항목 생성 모달 */}
      {showSubItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              새 세부 평가 항목
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  항목 이름
                </label>
                <input
                  type="text"
                  value={subItemForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = generateCode(name);
                    setSubItemForm({ ...subItemForm, name, code });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="예: 기본지식"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  코드 (자동 생성)
                </label>
                <input
                  type="text"
                  value={subItemForm.code}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  placeholder="이름 입력 시 자동 생성됩니다"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  만점
                </label>
                <input
                  type="number"
                  value={subItemForm.max_score}
                  onChange={(e) => setSubItemForm({ ...subItemForm, max_score: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <textarea
                  value={subItemForm.description}
                  onChange={(e) => setSubItemForm({ ...subItemForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSubItemModal(false);
                  resetSubItemForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleCreateSubItem}
                className="btn-primary"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
