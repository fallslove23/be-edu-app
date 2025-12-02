import React, { useState, useEffect, useMemo } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { Exam } from '../../types/exam.types';

interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  estimated_time: number; // minutes
  success_rate: number; // percentage
  tags: string[];
}

interface StudentPerformance {
  user_id: string;
  user_name: string;
  weak_categories: string[];
  strong_categories: string[];
  average_score: number;
  completion_rate: number;
  preferred_difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionRecommendation {
  question: Question;
  score: number; // 0-100
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIQuestionRecommenderProps {
  exam?: Exam;
  studentPerformance?: StudentPerformance;
  availableQuestions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onClose: () => void;
}

export default function AIQuestionRecommender({
  exam,
  studentPerformance,
  availableQuestions,
  onSelectQuestions,
  onClose,
}: AIQuestionRecommenderProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'balanced' | 'adaptive' | 'weakness' | 'challenge'>('adaptive');
  const [targetDifficulty, setTargetDifficulty] = useState<'auto' | 'easy' | 'medium' | 'hard'>('auto');
  const [questionCount, setQuestionCount] = useState(20);
  const [recommendations, setRecommendations] = useState<QuestionRecommendation[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Mock student performance (실제로는 Supabase에서 가져옴)
  const mockPerformance: StudentPerformance = studentPerformance || {
    user_id: 'u1',
    user_name: '김철수',
    weak_categories: ['구강해부학', '치과재료학'],
    strong_categories: ['예방치학', '구강생리학'],
    average_score: 75,
    completion_rate: 85,
    preferred_difficulty: 'medium',
  };

  // Mock questions (실제로는 Supabase question_banks에서 가져옴)
  const mockQuestions: Question[] = availableQuestions.length > 0 ? availableQuestions : Array.from({ length: 50 }, (_, i) => ({
    id: `q${i + 1}`,
    text: `문제 ${i + 1}: 치아의 구조와 기능에 대한 설명으로 올바른 것은?`,
    difficulty: i < 15 ? 'easy' : i < 35 ? 'medium' : 'hard',
    category: ['구강해부학', '치과재료학', '예방치학', '구강생리학'][Math.floor(Math.random() * 4)],
    estimated_time: Math.floor(Math.random() * 3) + 2, // 2-5분
    success_rate: Math.floor(Math.random() * 40) + 60, // 60-100%
    tags: ['이론', '개념', '응용'].slice(0, Math.floor(Math.random() * 3) + 1),
  }));

  // AI 추천 알고리즘
  useEffect(() => {
    generateRecommendations();
  }, [selectedStrategy, targetDifficulty, questionCount]);

  const generateRecommendations = () => {
    const scored: QuestionRecommendation[] = mockQuestions.map(question => {
      let score = 50; // 기본 점수
      let reason = '';
      let priority: 'high' | 'medium' | 'low' = 'medium';

      // 전략별 점수 계산
      switch (selectedStrategy) {
        case 'balanced':
          // 균형잡힌 난이도 분포
          if (question.difficulty === 'medium') score += 20;
          if (question.difficulty === 'easy') score += 10;
          reason = '균형잡힌 난이도 구성';
          break;

        case 'adaptive':
          // 학습자 수준에 맞는 적응형
          if (mockPerformance.average_score >= 80) {
            if (question.difficulty === 'hard') score += 30;
            reason = '높은 수준의 도전 문제';
            priority = 'high';
          } else if (mockPerformance.average_score >= 60) {
            if (question.difficulty === 'medium') score += 25;
            reason = '적절한 난이도의 학습 문제';
            priority = 'medium';
          } else {
            if (question.difficulty === 'easy') score += 20;
            reason = '기초 개념 강화 문제';
            priority = 'medium';
          }
          break;

        case 'weakness':
          // 약점 보완
          if (mockPerformance.weak_categories.includes(question.category)) {
            score += 40;
            reason = `약점 영역(${question.category}) 보완`;
            priority = 'high';
          }
          break;

        case 'challenge':
          // 도전 과제
          if (question.difficulty === 'hard') score += 35;
          if (question.success_rate < 70) score += 15;
          reason = '도전적인 고난이도 문제';
          priority = 'high';
          break;
      }

      // 난이도 목표
      if (targetDifficulty !== 'auto' && question.difficulty === targetDifficulty) {
        score += 15;
      }

      // 성공률 고려 (너무 쉽거나 너무 어려운 문제 제외)
      if (question.success_rate > 90) score -= 10;
      if (question.success_rate < 40) score -= 20;

      // 카테고리 다양성
      const categoryCount = mockQuestions.filter(q => q.category === question.category).length;
      if (categoryCount < 10) score += 10;

      return {
        question,
        score: Math.min(Math.max(score, 0), 100),
        reason,
        priority,
      };
    });

    // 점수순 정렬
    const sorted = scored.sort((a, b) => b.score - a.score);
    setRecommendations(sorted);

    // 상위 N개 자동 선택
    const topN = sorted.slice(0, questionCount);
    setSelectedQuestions(new Set(topN.map(r => r.question.id)));
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleApply = () => {
    const selected = recommendations
      .filter(r => selectedQuestions.has(r.question.id))
      .map(r => r.question);
    onSelectQuestions(selected);
    onClose();
  };

  // 통계
  const stats = useMemo(() => {
    const selected = recommendations.filter(r => selectedQuestions.has(r.question.id));
    const easy = selected.filter(r => r.question.difficulty === 'easy').length;
    const medium = selected.filter(r => r.question.difficulty === 'medium').length;
    const hard = selected.filter(r => r.question.difficulty === 'hard').length;
    const avgTime = Math.round(
      selected.reduce((sum, r) => sum + r.question.estimated_time, 0) / selected.length || 0
    );
    const avgSuccessRate = Math.round(
      selected.reduce((sum, r) => sum + r.question.success_rate, 0) / selected.length || 0
    );

    return {
      total: selected.length,
      easy,
      medium,
      hard,
      avgTime,
      avgSuccessRate,
    };
  }, [recommendations, selectedQuestions]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <SparklesIcon className="h-8 w-8 mr-3" />
                AI 문제 추천 시스템
              </h2>
              <p className="mt-2 text-purple-100">학습자 수준과 약점을 분석하여 최적의 문제를 추천합니다</p>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-2 rounded-full text-white hover:bg-white/20"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* 학습자 프로필 */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-purple-100">평균 점수</div>
                <div className="text-2xl font-bold mt-1">{mockPerformance.average_score}점</div>
              </div>
              <div>
                <div className="text-sm text-purple-100">완료율</div>
                <div className="text-2xl font-bold mt-1">{mockPerformance.completion_rate}%</div>
              </div>
              <div>
                <div className="text-sm text-purple-100">약점 영역</div>
                <div className="text-sm font-semibold mt-1 truncate">
                  {mockPerformance.weak_categories.join(', ')}
                </div>
              </div>
              <div>
                <div className="text-sm text-purple-100">강점 영역</div>
                <div className="text-sm font-semibold mt-1 truncate">
                  {mockPerformance.strong_categories.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 설정 패널 */}
        <div className="border-b border-gray-200 bg-gray-50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 추천 전략 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LightBulbIcon className="h-4 w-4 inline mr-1" />
                추천 전략
              </label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="balanced">균형 잡힌 구성</option>
                <option value="adaptive">적응형 (수준 맞춤)</option>
                <option value="weakness">약점 보완</option>
                <option value="challenge">도전 과제</option>
              </select>
            </div>

            {/* 목표 난이도 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                목표 난이도
              </label>
              <select
                value={targetDifficulty}
                onChange={(e) => setTargetDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="auto">자동 선택</option>
                <option value="easy">쉬움</option>
                <option value="medium">보통</option>
                <option value="hard">어려움</option>
              </select>
            </div>

            {/* 문제 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                문제 수
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 20)))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600">선택된 문제</div>
              <div className="text-xl font-bold text-purple-600 mt-1">{stats.total}개</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600">쉬움</div>
              <div className="text-xl font-bold text-green-600 mt-1">{stats.easy}개</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600">보통</div>
              <div className="text-xl font-bold text-foreground mt-1">{stats.medium}개</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600">어려움</div>
              <div className="text-xl font-bold text-destructive mt-1">{stats.hard}개</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600">평균 시간</div>
              <div className="text-xl font-bold text-blue-600 mt-1">{stats.avgTime}분</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-600">평균 정답률</div>
              <div className="text-xl font-bold text-indigo-600 mt-1">{stats.avgSuccessRate}%</div>
            </div>
          </div>
        </div>

        {/* 추천 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {recommendations.slice(0, 30).map((rec) => (
              <div
                key={rec.question.id}
                className={`relative border-2 rounded-lg p-4 transition-all cursor-pointer ${selectedQuestions.has(rec.question.id)
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
                  }`}
                onClick={() => toggleQuestion(rec.question.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${rec.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {rec.priority === 'high' ? '🔥 높음' : rec.priority === 'medium' ? '⚡ 보통' : '💡 낮음'}
                      </span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${rec.question.difficulty === 'easy' ? 'bg-green-500/10 text-green-700' :
                          rec.question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-destructive/10 text-destructive'
                        }`}>
                        {rec.question.difficulty === 'easy' ? '쉬움' : rec.question.difficulty === 'medium' ? '보통' : '어려움'}
                      </span>
                      <span className="text-xs text-gray-600">{rec.question.category}</span>
                      <span className="text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3 inline mr-1" />
                        {rec.question.estimated_time}분
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{rec.question.text}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>✨ AI 점수: {rec.score}/100</span>
                      <span>📊 정답률: {rec.question.success_rate}%</span>
                      <span className="text-purple-600 font-medium">💡 {rec.reason}</span>
                    </div>
                  </div>
                  {selectedQuestions.has(rec.question.id) && (
                    <CheckCircleIcon className="h-6 w-6 text-purple-600 flex-shrink-0 ml-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {stats.total}개 문제 선택됨 • 예상 소요 시간: {stats.avgTime * stats.total}분
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="btn-outline"
            >
              취소
            </button>
            <button
              onClick={handleApply}
              disabled={stats.total === 0}
              className="btn-primary"
            >
              ✨ 선택한 문제 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
