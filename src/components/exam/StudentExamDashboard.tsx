import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import ExamTaking from './ExamTaking';
import type { Exam, ExamAnswer } from '../../types/exam.types';
import { ExamService } from '../../services/exam.services';
import toast from 'react-hot-toast';

const StudentExamDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'taking'>('list');

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const allExams = await ExamService.getExams({ status: 'published' });

      setExams(allExams);
    } catch (error) {
      console.error('시험 목록 로딩 실패:', error);
      toast.error('시험 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    setViewMode('taking');
  };

  const handleBackToList = () => {
    setSelectedExam(null);
    setViewMode('list');
  };

  const handleSubmitExam = async (answers: ExamAnswer[]) => {
    if (!selectedExam) return;

    try {
      // TODO: 답안 제출 API 호출
      console.log('답안 제출:', answers);
      toast.success('시험이 제출되었습니다!');
      handleBackToList();
      loadExams(); // 목록 새로고침
    } catch (error) {
      console.error('답안 제출 실패:', error);
      toast.error('답안 제출에 실패했습니다.');
    }
  };

  const getStatusBadge = (exam: Exam) => {
    // TODO: 응시 상태 확인 로직 추가
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        응시 가능
      </span>
    );
  };

  if (viewMode === 'taking' && selectedExam) {
    return (
      <ExamTaking
        exam={selectedExam}
        onBack={handleBackToList}
        onSubmit={handleSubmitExam}
      />
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">시험 응시</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">수강생들의 이론 시험 생성하고 관리하세요.</p>
        </div>

        {/* 시험 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 시험</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{exams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/30">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">완료한 시험</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/30">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">미완료 시험</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{exams.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 시험 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              응시 가능한 시험 ({exams.length})
            </h2>
          </div>

          {exams.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">응시 가능한 시험이 없습니다</h3>
              <p className="text-gray-600 dark:text-gray-400">담당 강사가 시험을 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">{exam.title}</h3>
                          {getStatusBadge(exam)}
                        </div>

                        {exam.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{exam.description}</p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {exam.duration_minutes}분
                          </span>
                          <span className="flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-1" />
                            {exam.total_points || 0}점
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartExam(exam)}
                        className="ml-4 flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <PlayIcon className="w-5 h-5 mr-2" />
                        시험 시작
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default StudentExamDashboard;
