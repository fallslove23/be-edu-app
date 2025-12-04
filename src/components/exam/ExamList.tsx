import React from 'react';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  PencilIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { examStatusLabels, examTypeLabels } from '../../services/exam.services';
import type { Exam } from '../../types/exam.types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ExamListProps {
  exams: Exam[];
  loading: boolean;
  error: string | null;
  onExamSelect: (exam: Exam, action: 'edit' | 'take' | 'results') => void;
  onClone?: (exam: Exam) => void;
  onRefresh: () => void;
}

const ExamList: React.FC<ExamListProps> = ({
  exams,
  loading,
  error,
  onExamSelect,
  onClone,
  onRefresh
}) => {
  // 상태별 색상 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'draft':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive dark:text-red-400 border-destructive/50 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  // 시험 유형별 아이콘
  const getExamTypeIcon = (examType: string) => {
    return <AcademicCapIcon className="h-4 w-4" />;
  };

  // 시험 일정 표시
  const formatSchedule = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      const startFormatted = format(startDate, 'MM/dd (E) HH:mm', { locale: ko });
      const endFormatted = format(endDate, 'HH:mm', { locale: ko });
      return `${startFormatted} ~ ${endFormatted}`;
    } catch (error) {
      return '일정 미정';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">시험 목록을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-300" />
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={onRefresh}
              className="btn-danger"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">시험이 없습니다</h3>
            <p className="text-gray-600 dark:text-gray-400">새로운 시험을 생성하여 시작하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            시험 목록 ({exams.length}개)
          </h2>
          <button
            onClick={onRefresh}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            새로고침
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
            >
              {/* 시험 헤더 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exam.course_name}</p>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(exam.status)}`}>
                  {examStatusLabels[exam.status]}
                </div>
              </div>

              {/* 시험 정보 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  {getExamTypeIcon(exam.exam_type)}
                  <span className="ml-2">{examTypeLabels[exam.exam_type]}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  <span className="ml-2">{exam.duration_minutes}분</span>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <UsersIcon className="h-4 w-4" />
                  <span className="ml-2">{exam.question_count || 0}문항</span>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span className="ml-2 text-xs">{formatSchedule(exam.available_from || '', exam.available_until || '')}</span>
                </div>
              </div>

              {/* 시험 설명 */}
              {exam.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {exam.description}
                </p>
              )}

              {/* 추가 정보 */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span>합격점: {exam.passing_score}점</span>
                <span>최대 {exam.max_attempts}회 응시</span>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExamSelect(exam, 'edit')}
                  className="flex-1 btn-secondary btn-sm inline-flex items-center justify-center"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span className="ml-1">편집</span>
                </button>

                {onClone && (
                  <button
                    onClick={() => onClone(exam)}
                    className="btn-secondary btn-sm !p-2"
                    title="시험 복제"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                )}

                {exam.status === 'active' && (
                  <button
                    onClick={() => onExamSelect(exam, 'take')}
                    className="flex-1 btn-primary btn-sm inline-flex items-center justify-center"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span className="ml-1">시험응시</span>
                  </button>
                )}

                {(exam.status === 'completed' || exam.status === 'active') && (
                  <button
                    onClick={() => onExamSelect(exam, 'results')}
                    className="btn-secondary btn-sm !p-2"
                    title="결과"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 특별 표시 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  {exam.randomize_questions && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-lg mr-1"></div>
                      문제 랜덤
                    </span>
                  )}
                  {exam.show_correct_answers && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-lg mr-1"></div>
                      즉시 결과
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamList;