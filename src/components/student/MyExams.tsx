import React, { useState, useEffect } from 'react';
import { ExamService } from '@/services/exam.services';
import { useAuth } from '@/contexts/AuthContext';
import { examTypeLabels } from '@/services/exam.services';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import {
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface MyExam {
  id: string;
  title: string;
  course: string;
  type: string;
  status: 'available' | 'in_progress' | 'completed' | 'missed';
  score?: number;
  max_score: number;
  attempts: number;
  max_attempts: number;
  duration: number;
  due_date: string;
  completed_at?: string;
  passed: boolean;
}

const MyExams: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<MyExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Available exams (metadata)
        const available = await ExamService.getAvailableExams(user.id);
        // 2. Attempts history
        const history = await ExamService.getTraineeExamHistory(user.id);

        console.log('Available exams:', available);
        console.log('History:', history);

        // Merge
        const merged: MyExam[] = available.map(exam => {
          // Find attempts for this exam
          const attempts = history.filter(h => h.exam_id === exam.id);
          // history is sorted desc by submitted_at, so first one is latest
          const latestAttempt = attempts[0];

          let status: MyExam['status'] = 'available';
          if (latestAttempt) {
            if (latestAttempt.status === 'in_progress') status = 'in_progress';
            else if (latestAttempt.status === 'graded' || latestAttempt.status === 'submitted') status = 'completed';
          } else {
            // Check if missed (past due date)
            if (exam.available_until && new Date(exam.available_until) < new Date()) {
              status = 'missed';
            }
          }

          return {
            id: exam.id,
            title: exam.title,
            course: exam.round?.title || exam.course_name || '과정 정보 없음',
            type: examTypeLabels[exam.exam_type] || exam.exam_type,
            status,
            score: latestAttempt?.score,
            max_score: exam.total_points,
            attempts: attempts.length,
            max_attempts: exam.max_attempts,
            duration: exam.duration_minutes,
            due_date: exam.available_until || exam.scheduled_at || new Date().toISOString(),
            completed_at: latestAttempt?.submitted_at,
            passed: latestAttempt?.passed || false
          };
        });

        setExams(merged);
      } catch (err) {
        console.error('Failed to fetch exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user]);

  const getStatusInfo = (exam: MyExam) => {
    const isOverdue = new Date(exam.due_date) < new Date();

    switch (exam.status) {
      case 'available':
        return {
          label: isOverdue ? '기한 만료' : '응시 가능',
          color: isOverdue ? 'bg-destructive/10 text-destructive dark:text-red-400' : 'bg-green-500/10 text-green-700 dark:text-green-400',
          icon: isOverdue ? ExclamationTriangleIcon : PencilSquareIcon
        };
      case 'in_progress':
        return { label: '진행중', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', icon: ClockIcon };
      case 'completed':
        return {
          label: exam.passed ? '합격' : '불합격',
          color: exam.passed ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
          icon: exam.passed ? CheckCircleIcon : ExclamationTriangleIcon
        };
      case 'missed':
        return { label: '미응시', color: 'bg-destructive/10 text-destructive dark:text-red-400', icon: ExclamationTriangleIcon };
    }
  };

  const availableExams = exams.filter(e => e.status === 'available');
  const completedExams = exams.filter(e => e.status === 'completed');
  const passedExams = completedExams.filter(e => e.passed);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <PageHeader
          title="시험 응시"
          description="예정된 시험에 응시하고 결과를 확인하세요."
        />

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <PencilSquareIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">응시 가능</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{availableExams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">완료</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedExams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <TrophyIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">합격률</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedExams.length > 0 ? Math.round((passedExams.length / completedExams.length) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <TrophyIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">평균 점수</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedExams.length > 0
                    ? Math.round(completedExams.reduce((sum, e) => sum + (e.score || 0), 0) / completedExams.length)
                    : 0
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 시험 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 font-bold">
            <h2 className="text-lg text-gray-900 dark:text-white">시험 목록</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {exams.map((exam) => {
              const statusInfo = getStatusInfo(exam);
              const StatusIcon = statusInfo.icon;
              const isOverdue = new Date(exam.due_date) < new Date();

              return (
                <div key={exam.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{exam.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
                          {exam.type}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">{exam.course}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          {exam.duration}분
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          {new Date(exam.due_date).toLocaleDateString('ko-KR')}
                        </div>
                        <div>
                          응시 횟수: <span className="font-medium text-gray-900 dark:text-white">{exam.attempts}/{exam.max_attempts}</span>
                        </div>
                        {exam.score !== undefined && (
                          <div>
                            점수: <span className="font-medium text-gray-900 dark:text-white">{exam.score}/{exam.max_score}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                      {exam.status === 'available' && !isOverdue && exam.attempts < exam.max_attempts && (
                        <button className="btn-primary w-full sm:w-auto text-sm py-2">
                          시험 응시
                        </button>
                      )}
                      {exam.status === 'in_progress' && (
                        <button className="btn-success w-full sm:w-auto text-sm py-2">
                          계속 응시
                        </button>
                      )}
                      {exam.status === 'completed' && exam.attempts < exam.max_attempts && !exam.passed && (
                        <button className="btn-warning w-full sm:w-auto text-sm py-2">
                          재응시
                        </button>
                      )}
                      {exam.status === 'completed' && (
                        <button className="btn-secondary w-full sm:w-auto text-sm py-2">
                          결과 보기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : exams.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <PencilSquareIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">예정된 시험이 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
              새로운 시험이 등록되면 이 페이지와 알림 센터를 통해 알려드리겠습니다.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default MyExams;