'use client';

import React, { useState, useEffect } from 'react';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import {
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

interface PracticeSubmission {
  id: string;
  trainee_id: string;
  trainee_name: string;
  trainee_email: string;
  course_name: string;
  round_name: string;
  practice_title: string;
  submitted_at: string;
  status: 'pending' | 'evaluated';
  score?: number;
  max_score: number;
  feedback?: string;
}

const PracticeEvaluationManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<PracticeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'evaluated'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<PracticeSubmission | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      // TODO: 실제 API 호출로 교체
      // const { data, error } = await supabase.from('practice_submissions').select('*');

      // 임시 데이터
      const mockData: PracticeSubmission[] = [
        {
          id: '1',
          trainee_id: 'trainee1',
          trainee_name: '홍길동',
          trainee_email: 'hong@example.com',
          course_name: 'BS Basic',
          round_name: '25-1차',
          practice_title: '임플란트 식립 실습',
          submitted_at: '2025-12-10T10:00:00',
          status: 'pending',
          max_score: 100
        },
        {
          id: '2',
          trainee_id: 'trainee2',
          trainee_name: '김철수',
          trainee_email: 'kim@example.com',
          course_name: 'BS Advanced',
          round_name: '25-1차',
          practice_title: '크라운 제작 실습',
          submitted_at: '2025-12-09T14:30:00',
          status: 'evaluated',
          score: 85,
          max_score: 100,
          feedback: '전반적으로 우수합니다. 마무리 작업에 더 신경쓰면 좋겠습니다.'
        }
      ];

      setSubmissions(mockData);
    } catch (error) {
      console.error('실습 제출 목록 로딩 실패:', error);
      toast.error('실습 제출 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = (submission: PracticeSubmission) => {
    setSelectedSubmission(submission);
    setScore(submission.score || 0);
    setFeedback(submission.feedback || '');
    setShowEvaluationModal(true);
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedSubmission) return;

    try {
      // TODO: 실제 API 호출로 교체
      // await supabase.from('practice_submissions').update({...}).eq('id', selectedSubmission.id);

      toast.success('평가가 저장되었습니다!');
      setShowEvaluationModal(false);
      loadSubmissions();
    } catch (error) {
      console.error('평가 저장 실패:', error);
      toast.error('평가 저장에 실패했습니다.');
    }
  };

  const getFilteredSubmissions = () => {
    if (filter === 'all') return submissions;
    return submissions.filter(s => s.status === filter);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
          평가 대기
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
        평가 완료
      </span>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="실습 평가 관리"
        description="실습 과제 평가 및 관리"
        badge="Practice Evaluation"
      />

      <div className="space-y-6">
        {/* 필터 */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FunnelIcon className="w-4 h-4 inline mr-2" />
            전체 ({submissions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'pending'
                ? 'bg-white dark:bg-gray-600 text-yellow-600 dark:text-yellow-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ClockIcon className="w-4 h-4 inline mr-2" />
            평가 대기 ({submissions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('evaluated')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'evaluated'
                ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4 inline mr-2" />
            평가 완료 ({submissions.filter(s => s.status === 'evaluated').length})
          </button>
        </div>

        {/* 제출 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    교육생
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    과정/차수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    실습명
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    제출일시
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    점수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {getFilteredSubmissions().map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{submission.trainee_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{submission.trainee_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{submission.course_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{submission.round_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {submission.practice_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                      {new Date(submission.submitted_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {submission.score !== undefined ? (
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {submission.score}/{submission.max_score}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEvaluate(submission)}
                        className="btn-primary text-sm"
                      >
                        <StarIcon className="w-4 h-4" />
                        {submission.status === 'pending' ? '평가하기' : '수정'}
                      </button>
                    </td>
                  </tr>
                ))}
                {getFilteredSubmissions().length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      제출된 실습이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 평가 모달 */}
      {showEvaluationModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              실습 평가
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">교육생</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.trainee_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">실습명</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.practice_title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  점수 (만점: {selectedSubmission.max_score}점)
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.max_score}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  피드백
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="교육생에게 전달할 피드백을 입력하세요..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleSubmitEvaluation}
                className="btn-primary"
              >
                <CheckCircleIcon className="w-5 h-5" />
                평가 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default PracticeEvaluationManagement;
