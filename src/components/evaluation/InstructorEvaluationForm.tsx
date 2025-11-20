/**
 * 강사 평가 입력 폼
 * - 모바일 최적화
 * - 세부 항목별 점수 입력
 * - 실시간 합계 계산
 */

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import {
  evaluationTemplateService,
  instructorEvaluationService,
  comprehensiveGradeService,
} from '../../services/evaluation.service';
import { useAuth } from '../../contexts/AuthContext';
import type {
  EvaluationTemplateWithComponents,
  EvaluationComponent,
  EvaluationSubItem,
  SubItemScore,
} from '../../types/evaluation.types';

interface InstructorEvaluationFormProps {
  courseRoundId: string;
  traineeId: string;
  traineeName: string;
  templateId: string;
  onComplete?: () => void;
}

export default function InstructorEvaluationForm({
  courseRoundId,
  traineeId,
  traineeName,
  templateId,
  onComplete,
}: InstructorEvaluationFormProps) {
  const { user } = useAuth();
  const [template, setTemplate] = useState<EvaluationTemplateWithComponents | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<EvaluationComponent | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await evaluationTemplateService.getWithComponents(templateId);
      setTemplate(data);

      // 강사가 평가할 수 있는 첫 번째 항목 선택
      const manualComponents = data?.components.filter(
        (c) => c.evaluation_type === 'instructor_manual'
      );
      if (manualComponents && manualComponents.length > 0) {
        setSelectedComponent(manualComponents[0]);

        // 기존 평가 로드
        await loadExistingEvaluation(manualComponents[0].id);
      }
    } catch (err) {
      console.error('템플릿 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingEvaluation = async (componentId: string) => {
    if (!user) return;

    try {
      const evaluations = await instructorEvaluationService.getByTraineeId(courseRoundId, traineeId);
      const existing = evaluations.find(
        (e) => e.component_id === componentId && e.instructor_id === user.id
      );

      if (existing) {
        const scoresMap: Record<string, number> = {};
        existing.sub_item_scores.forEach((s) => {
          scoresMap[s.sub_item_id] = s.score;
        });
        setScores(scoresMap);
        setFeedback(existing.feedback || '');
      }
    } catch (err) {
      console.error('기존 평가 로드 실패:', err);
    }
  };

  const handleComponentChange = async (component: EvaluationComponent) => {
    setSelectedComponent(component);
    setScores({});
    setFeedback('');
    setSaved(false);
    await loadExistingEvaluation(component.id);
  };

  const handleScoreChange = (subItemId: string, score: number) => {
    setScores({ ...scores, [subItemId]: score });
    setSaved(false);
  };

  const calculateTotal = () => {
    if (!selectedComponent) return 0;

    return selectedComponent.sub_items.reduce((sum, subItem) => {
      return sum + (scores[subItem.id] || 0);
    }, 0);
  };

  const calculateMaxScore = () => {
    if (!selectedComponent) return 0;

    return selectedComponent.sub_items.reduce((sum, subItem) => {
      return sum + subItem.max_score;
    }, 0);
  };

  const handleSave = async () => {
    if (!user || !selectedComponent) return;

    // 유효성 검사
    const allScored = selectedComponent.sub_items.every((subItem) => {
      const score = scores[subItem.id];
      return score !== undefined && score >= 0 && score <= subItem.max_score;
    });

    if (!allScored) {
      alert('모든 항목에 유효한 점수를 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      // SubItemScore 배열 생성
      const subItemScores: SubItemScore[] = selectedComponent.sub_items.map((subItem) => ({
        sub_item_id: subItem.id,
        name: subItem.name,
        score: scores[subItem.id] || 0,
        max_score: subItem.max_score,
      }));

      // 강사 평가 저장
      await instructorEvaluationService.upsert({
        course_round_id: courseRoundId,
        trainee_id: traineeId,
        component_id: selectedComponent.id,
        instructor_id: user.id,
        instructor_name: user.name || user.email,
        weight_percentage: selectedComponent.instructor_config?.instructors.find(
          (i) => i.instructor_id === user.id
        )?.weight || 100,
        sub_item_scores: subItemScores,
        total_score: calculateTotal(),
        max_possible_score: calculateMaxScore(),
        feedback: feedback || undefined,
      });

      // 최종 성적 재계산
      await comprehensiveGradeService.calculate(courseRoundId, traineeId, templateId);

      setSaved(true);

      // 2초 후 완료 콜백
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
    } catch (err) {
      console.error('평가 저장 실패:', err);
      alert('평가 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!template || !selectedComponent) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          평가 가능한 항목이 없습니다.
        </p>
      </div>
    );
  }

  const manualComponents = template.components.filter(
    (c) => c.evaluation_type === 'instructor_manual'
  );

  const total = calculateTotal();
  const maxScore = calculateMaxScore();
  const percentage = maxScore > 0 ? (total / maxScore) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {traineeName} 평가
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">{template.name}</p>
      </div>

      {/* 구성 요소 선택 (여러 개인 경우) */}
      {manualComponents.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            평가 항목
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {manualComponents.map((component) => (
              <button
                key={component.id}
                onClick={() => handleComponentChange(component)}
                className={`p-3 rounded-full border-2 text-left transition-colors ${
                  selectedComponent.id === component.id
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {component.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {component.weight_percentage}%
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 점수 입력 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {selectedComponent.name}
        </h3>

        <div className="space-y-4">
          {selectedComponent.sub_items.map((subItem) => (
            <div
              key={subItem.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {subItem.name}
                  </h4>
                  {subItem.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {subItem.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {scores[subItem.id] !== undefined ? scores[subItem.id] : '-'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    / {subItem.max_score}점
                  </div>
                </div>
              </div>

              {/* 점수 입력 버튼 (모바일 최적화) */}
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: Math.floor(subItem.max_score) + 1 }, (_, i) => i).map((score) => (
                  <button
                    key={score}
                    onClick={() => handleScoreChange(subItem.id, score)}
                    className={`py-3 rounded-full font-medium transition-colors ${
                      scores[subItem.id] === score
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-foreground hover:bg-muted'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 합계 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              합계
            </span>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {total.toFixed(1)} / {maxScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* 피드백 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            피드백 (선택사항)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setSaved(false);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={3}
            placeholder="학생에게 전달할 피드백을 입력하세요..."
          />
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6 flex items-center justify-between">
          {saved && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">저장 완료</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="btn-primary ml-auto"
          >
            {saving ? '저장 중...' : saved ? '저장됨' : '평가 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
