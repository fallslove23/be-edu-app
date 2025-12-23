'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { UserGroupIcon, AcademicCapIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  evaluationTemplateService,
  instructorEvaluationService,
} from '@/services/evaluation.service';
import type {
  EvaluationTemplateWithComponents,
  EvaluationComponent,
  SubItemScore,
} from '@/types/evaluation.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Trainee {
  id: string;
  name: string;
  email?: string;
}

export default function GradeInputPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [template, setTemplate] = useState<EvaluationTemplateWithComponents | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<EvaluationComponent | null>(null);

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadTemplate();
      loadTrainees();
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    // TODO: 실제 과정 목록 로드
    setCourses([
      { id: '1', name: '웹 개발 과정 1기' },
      { id: '2', name: '웹 개발 과정 2기' },
    ]);
  };

  const loadTemplate = async () => {
    try {
      setLoading(true);
      // TODO: 실제 평가 템플릿 로드
      // const templates = await evaluationTemplateService.getByCourseTemplateId(courseTemplateId);
      // const fullTemplate = await evaluationTemplateService.getWithComponents(templates[0].id);
      // setTemplate(fullTemplate);
    } catch (error) {
      console.error('평가 템플릿 로드 실패:', error);
      toast.error('평가 템플릿을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrainees = async () => {
    try {
      // TODO: 실제 교육생 목록 로드
      setTrainees([
        { id: '1', name: '김철수', email: 'kim@example.com' },
        { id: '2', name: '이영희', email: 'lee@example.com' },
        { id: '3', name: '박민수', email: 'park@example.com' },
      ]);
    } catch (error) {
      console.error('교육생 목록 로드 실패:', error);
      toast.error('교육생 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleScoreChange = (subItemId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [subItemId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedTrainee || !selectedComponent || !user) {
      toast.error('모든 항목을 선택해주세요.');
      return;
    }

    if (!selectedComponent.sub_items || selectedComponent.sub_items.length === 0) {
      toast.error('평가 항목이 설정되지 않았습니다.');
      return;
    }

    try {
      setSaving(true);

      const subItemScores: SubItemScore[] = selectedComponent.sub_items.map((item) => ({
        sub_item_id: item.id,
        name: item.name,
        score: scores[item.id] || 0,
        max_score: item.max_score,
      }));

      const totalScore = subItemScores.reduce((sum, item) => sum + item.score, 0);
      const maxPossibleScore = subItemScores.reduce((sum, item) => sum + item.max_score, 0);

      await instructorEvaluationService.upsert({
        course_round_id: selectedCourseId,
        trainee_id: selectedTrainee.id,
        component_id: selectedComponent.id,
        instructor_id: user.id,
        instructor_name: user.name || user.email,
        weight_percentage: selectedComponent.weight_percentage,
        sub_item_scores: subItemScores,
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        feedback,
      });

      toast.success('성적이 저장되었습니다.');

      // 초기화
      setScores({});
      setFeedback('');
    } catch (error) {
      console.error('성적 저장 실패:', error);
      toast.error('성적 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="📝 성적 입력" description="교육생 성적을 입력하고 관리합니다." />

      {/* 과정 및 평가 항목 선택 */}
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">과정 선택</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">과정을 선택하세요</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">평가 항목</label>
            <select
              value={selectedComponent?.id || ''}
              onChange={(e) => {
                const comp = template?.components.find((c) => c.id === e.target.value);
                setSelectedComponent(comp || null);
              }}
              disabled={!template}
              className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
            >
              <option value="">평가 항목을 선택하세요</option>
              {template?.components
                .filter((c) => c.evaluation_type === 'instructor_manual')
                .map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} ({comp.weight_percentage}%)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">교육생 선택</label>
            <select
              value={selectedTrainee?.id || ''}
              onChange={(e) => {
                const trainee = trainees.find((t) => t.id === e.target.value);
                setSelectedTrainee(trainee || null);
              }}
              disabled={!selectedCourseId}
              className="w-full appearance-none border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
            >
              <option value="">교육생을 선택하세요</option>
              {trainees.map((trainee) => (
                <option key={trainee.id} value={trainee.id}>
                  {trainee.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 성적 입력 폼 */}
      {selectedComponent && selectedTrainee ? (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">{selectedComponent.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTrainee.name} - 가중치: {selectedComponent.weight_percentage}%
              </p>
            </div>
          </div>

          {selectedComponent.sub_items && selectedComponent.sub_items.length > 0 ? (
            <>
              <div className="space-y-4 mb-6">
                {selectedComponent.sub_items.map((subItem) => (
                  <div
                    key={subItem.id}
                    className="flex items-center justify-between p-4 border border-border rounded-xl"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{subItem.name}</h4>
                      {subItem.description && (
                        <p className="text-sm text-muted-foreground mt-1">{subItem.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        max={subItem.max_score}
                        step="0.5"
                        value={scores[subItem.id] || ''}
                        onChange={(e) => handleScoreChange(subItem.id, parseFloat(e.target.value) || 0)}
                        className="w-24 border border-border rounded-lg px-3 py-2 text-center bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground">/ {subItem.max_score}점</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">피드백</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="교육생에게 전달할 피드백을 입력하세요"
                />
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">총점</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedComponent.sub_items.reduce((sum, item) => sum + (scores[item.id] || 0), 0)} /{' '}
                    {selectedComponent.sub_items.reduce((sum, item) => sum + item.max_score, 0)}점
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {saving ? '저장 중...' : '성적 저장'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AcademicCapIcon className="mx-auto h-16 w-16 mb-4" />
              <p>평가 세부 항목이 설정되지 않았습니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <UserGroupIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">평가 정보를 선택하세요</h3>
          <p className="text-muted-foreground">과정, 평가 항목, 교육생을 모두 선택해주세요.</p>
        </div>
      )}
    </PageContainer>
  );
}
