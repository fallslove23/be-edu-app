'use client';

import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  TvIcon
} from '@heroicons/react/24/outline';
import { PageContainer } from '../common/PageContainer';
import { PageHeader } from '../common/PageHeader';
import { CourseTemplateService } from '../../services/course-template.service';
import type { CourseRound } from '../../types/course-template.types';
import { ExamService } from '../../services/exam.services';
import type { Exam } from '../../types/exam.types';
import { QuestionBankService } from '../../services/question-bank.service';
import type { QuestionBank as QB } from '../../services/question-bank.service';
import ExamForm from './ExamForm';
import ExamTaking from './ExamTaking';
import ExamResults from './ExamResults';
import QuestionBankManagement from './QuestionBankManagement';
import ExamList from './ExamList';
import ExamCloneWizard from './ExamCloneWizard';
import LiveExamDashboard from './LiveExamDashboard';
import InteractiveExamAnalytics from './InteractiveExamAnalytics';

type ViewType = 'list' | 'form' | 'taking' | 'results' | 'question-bank' | 'target-selection';

interface ExamTarget {
  id: string;
  course_id: string;
  course_name: string;
  session_number: number;
  session_name: string;
  start_date: string;
  end_date: string;
  student_count: number;
  selected: boolean;
}

const ExamManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseRounds, setCourseRounds] = useState<CourseRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [questionBanks, setQuestionBanks] = useState<QB[]>([]);
  const [examTargets, setExamTargets] = useState<ExamTarget[]>([]);
  const [selectedQuestionBank, setSelectedQuestionBank] = useState<QB | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [cloningExam, setCloningExam] = useState<Exam | null>(null);
  const [liveExam, setLiveExam] = useState<Exam | null>(null);
  const [analyticsExam, setAnalyticsExam] = useState<Exam | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    // Supabase 연결 테스트 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      import('../../utils/supabase-test').then(({ testSupabaseConnection }) => {
        testSupabaseConnection().then(result => {
          console.log('📊 Supabase 테스트 결과:', result);
        });
      });
    }

    loadExams();
    loadQuestionBanks();
    loadExamTargets();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);

      // 과정 차수 데이터 로드
      console.log('📊 Loading course rounds...');
      const roundsData = await CourseTemplateService.getRounds();
      console.log('📊 Loaded course rounds:', roundsData);
      console.log('📊 Course rounds count:', roundsData?.length);
      setCourseRounds(roundsData);

      // 실제 시험 데이터 로드
      const examsData = await ExamService.getExams();
      console.log('✅ Loaded exams from database:', examsData);
      setExams(examsData);

    } catch (error) {
      console.error('❌ Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionBanks = async () => {
    try {
      console.log('📚 Loading question banks...');
      const banks = await QuestionBankService.getQuestionBanks({ includeQuestions: false });
      console.log('✅ Loaded question banks:', banks);
      setQuestionBanks(banks);
    } catch (error) {
      console.error('❌ Failed to load question banks:', error);
    }
  };

  const loadExamTargets = async () => {
    try {
      // 목업 시험 대상자 데이터 (과정 차수별)
      const mockExamTargets: ExamTarget[] = [
        {
          id: '1',
          course_id: 'course-1',
          course_name: 'BS 영업 기초과정',
          session_number: 1,
          session_name: '2024년 1차',
          start_date: '2024-08-01',
          end_date: '2024-08-15',
          student_count: 25,
          selected: false
        },
        {
          id: '2',
          course_id: 'course-1',
          course_name: 'BS 영업 기초과정',
          session_number: 2,
          session_name: '2024년 2차',
          start_date: '2024-09-01',
          end_date: '2024-09-15',
          student_count: 30,
          selected: false
        },
        {
          id: '3',
          course_id: 'course-2',
          course_name: 'BS 고급 영업 전략',
          session_number: 1,
          session_name: '2024년 1차',
          start_date: '2024-08-20',
          end_date: '2024-09-05',
          student_count: 18,
          selected: false
        },
        {
          id: '4',
          course_id: 'course-3',
          course_name: 'BS 고객 관리 시스템',
          session_number: 1,
          session_name: '2024년 1차',
          start_date: '2024-08-25',
          end_date: '2024-09-10',
          student_count: 22,
          selected: false
        }
      ];
      setExamTargets(mockExamTargets);
    } catch (error) {
      console.error('Failed to load exam targets:', error);
    }
  };

  // 검색 필터링
  const filteredExams = exams.filter(exam => {
    if (!searchTerm) return true;
    return exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.course_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  // 시험 통계 요약
  const examStats = {
    total: exams.length,
    active: exams.filter(e => e.status === 'active').length,
    scheduled: exams.filter(e => e.status === 'scheduled').length,
    completed: exams.filter(e => e.status === 'completed').length
  };

  // 핸들러 함수들
  const handleExamSave = (examData: Partial<Exam>) => {
    console.log('시험 저장:', examData);
    if (selectedQuestionBank && selectedTargets.length > 0) {
      console.log('문제은행에서 생성된 시험:', {
        examData,
        questionBank: selectedQuestionBank,
        targets: selectedTargets
      });
      // 실제로는 API를 통해 선택된 각 과정 차수별로 시험 생성
    }
    // 실제로는 API를 통해 저장
    loadExams(); // 목록 새로고침
    setCurrentView('list');
  };

  const handleExamEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('form');
  };

  const handleExamTake = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('taking');
  };

  const handleExamResults = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('results');
  };

  const handleExamClone = async (clonedExamData: Partial<Exam>, options: any) => {
    try {
      console.log('🔄 시험 복제:', clonedExamData, options);
      // TODO: ExamService에 cloneExam 메서드 추가 필요
      // const newExam = await ExamService.cloneExam(cloningExam!.id, clonedExamData, options);

      // 임시: 새 시험으로 저장
      await handleExamSave(clonedExamData);

      alert('시험이 복제되었습니다!');
      setCloningExam(null);
      await loadExams();
    } catch (error) {
      console.error('❌ 시험 복제 실패:', error);
      alert('시험 복제에 실패했습니다.');
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedExam(null);
    setSelectedQuestionBank(null);
    setSelectedTargets([]);
  };

  const handleQuestionBankSelect = (questionBank: QB) => {
    setSelectedQuestionBank(questionBank);
    setCurrentView('target-selection');
  };

  const handleTargetToggle = (targetId: string) => {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  const handleCreateExamFromBank = () => {
    if (!selectedQuestionBank || selectedTargets.length === 0) return;

    // 문제은행에서 시험 생성 폼으로 이동
    setCurrentView('form');
  };

  // 뷰별 렌더링
  if (currentView === 'question-bank') {
    return (
      <QuestionBankManagement
        onBack={handleBackToList}
        onSelectBank={handleQuestionBankSelect}
      />
    );
  }

  if (currentView === 'target-selection' && selectedQuestionBank) {
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setCurrentView('question-bank')}
                className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
              >
                ← 문제은행으로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <UserGroupIcon className="h-8 w-8 mr-3 text-gray-600 dark:text-gray-400" />
                시험 대상자 선택
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                "{selectedQuestionBank.name}" 문제은행으로 시험을 진행할 과정 차수를 선택하세요.
              </p>
            </div>
            <button
              onClick={handleCreateExamFromBank}
              disabled={selectedTargets.length === 0}
              className={`px-4 py-2 rounded-full flex items-center transition-colors ${selectedTargets.length === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 dark:bg-blue-600 text-white hover:bg-gray-800 dark:hover:bg-blue-700'
                }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              시험 생성 ({selectedTargets.length}개 차수)
            </button>
          </div>
        </div>

        {/* 선택된 문제은행 정보 */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">선택된 문제은행</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">문제은행명:</span>
              <div className="font-medium text-gray-900 dark:text-white">{selectedQuestionBank.name}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">카테고리:</span>
              <div className="font-medium text-gray-900 dark:text-white">{selectedQuestionBank.category || '-'}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">문제 수:</span>
              <div className="font-medium text-gray-900 dark:text-white">{selectedQuestionBank.question_count || 0}개</div>
            </div>
          </div>
        </div>

        {/* 과정 차수 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">과정 차수 목록</h2>
          <div className="space-y-3">
            {examTargets.map((target) => (
              <label
                key={target.id}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedTargets.includes(target.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500 ring-1 ring-blue-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTargets.includes(target.id)}
                  onChange={() => handleTargetToggle(target.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {target.course_name} - {target.session_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {target.start_date} ~ {target.end_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {target.student_count}명
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {target.session_number}차
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'form') {
    return (
      <ExamForm
        exam={selectedExam}
        courseRounds={courseRounds}
        onBack={handleBackToList}
        onSave={handleExamSave}
        questionBank={selectedQuestionBank ? {
          id: selectedQuestionBank.id,
          name: selectedQuestionBank.name,
          questions: selectedQuestionBank.questions || []
        } : undefined}
        selectedTargets={selectedTargets}
      />
    );
  }

  if (currentView === 'taking' && selectedExam) {
    return (
      <ExamTaking
        exam={selectedExam}
        onBack={handleBackToList}
        onSubmit={(results) => {
          console.log('시험 제출:', results);
          setCurrentView('results');
        }}
      />
    );
  }

  if (currentView === 'results' && selectedExam) {
    return (
      <ExamResults
        exam={selectedExam}
        onBack={handleBackToList}
        onRetake={() => setCurrentView('taking')}
      />
    );
  }

  // 기본 목록 뷰
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <PageHeader
            title="이론 평가 관리"
            description="수강생들의 이론 시험을 생성하고 관리하세요."
            badge="Exam Management"
          />
          <div className="flex space-x-3 w-full lg:w-auto">
            <button
              onClick={() => setCurrentView('question-bank')}
              className="btn-secondary flex-1 lg:flex-none justify-center"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              문제은행 관리
            </button>
            <button
              onClick={() => setCurrentView('form')}
              className="btn-primary flex-1 lg:flex-none justify-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              새 시험 생성
            </button>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{examStats.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">전체 시험</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800 p-5">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">{examStats.active}</div>
            <div className="text-sm text-blue-600 dark:text-blue-300">진행중</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800 p-5">
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400 mb-1">{examStats.scheduled}</div>
            <div className="text-sm text-amber-600 dark:text-amber-300">예정됨</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800 p-5">
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">{examStats.completed}</div>
            <div className="text-sm text-emerald-600 dark:text-emerald-300">완료됨</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow-sm border border-purple-100 dark:border-purple-800 p-5">
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400 mb-1">{questionBanks.length}</div>
            <div className="text-sm text-purple-600 dark:text-purple-300">문제은행</div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="시험명, 과정명으로 검색..."
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 결과 카운트 */}
            <div className="flex items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <FunnelIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                총 <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredExams.length}</span>개 시험
              </span>
            </div>
          </div>
        </div>

        {/* 시험 목록 */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5" />
            시험 목록
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <span className="text-gray-500 dark:text-gray-400">시험 목록을 불러오는 중...</span>
            </div>
          ) : filteredExams.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {exam.course_name || '과정 정보 없음'}
                      </p>
                    </div>
                    <div className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${exam.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                      exam.status === 'scheduled' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' :
                        exam.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' :
                          'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                      }`}>
                      {exam.status === 'active' ? '진행중' :
                        exam.status === 'scheduled' ? '예정' :
                          exam.status === 'completed' ? '완료' : '준비중'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="block text-xs text-gray-500 dark:text-gray-400">제한시간</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{exam.duration_minutes}분</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                      <span className="block text-xs text-gray-500 dark:text-gray-400">문항수</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{exam.question_count || 0}문항</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center col-span-2">
                      <span className="block text-xs text-gray-500 dark:text-gray-400">합격 기준</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{exam.passing_score}점 이상</span>
                    </div>
                  </div>

                  {exam.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 line-clamp-2 min-h-[2.5em]">
                      {exam.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleExamTake(exam)}
                      className="btn-primary btn-sm w-full justify-center"
                    >
                      시험응시
                    </button>
                    <button
                      onClick={() => handleExamEdit(exam)}
                      className="btn-outline btn-sm w-full justify-center"
                    >
                      편집
                    </button>

                    {exam.status === 'active' && (
                      <button
                        onClick={() => setLiveExam(exam)}
                        className="btn-secondary btn-sm w-full justify-center col-span-2 flex items-center gap-1"
                      >
                        <TvIcon className="h-4 w-4" />
                        실시간 현황
                      </button>
                    )}

                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => setCloningExam(exam)}
                        className="btn-outline btn-sm flex-1 justify-center flex items-center gap-1"
                        title="시험 복제"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        복제
                      </button>
                      <button
                        onClick={() => handleExamResults(exam)}
                        className="btn-outline btn-sm flex-1 justify-center"
                      >
                        결과
                      </button>
                      <button
                        onClick={() => setAnalyticsExam(exam)}
                        className="btn-secondary btn-sm px-3"
                        title="인터랙티브 분석"
                      >
                        <ChartBarIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">등록된 시험이 없습니다</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">새로운 시험을 생성하여 평가를 시작해보세요.</p>
              <button
                onClick={() => setCurrentView('form')}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                첫 시험 생성하기
              </button>
            </div>
          )}
        </div>

        {/* 시험 복제 마법사 */}
        {cloningExam && (
          <ExamCloneWizard
            exam={cloningExam}
            onClone={handleExamClone}
            onClose={() => setCloningExam(null)}
          />
        )}

        {/* 실시간 응시 대시보드 */}
        {liveExam && (
          <LiveExamDashboard
            exam={liveExam}
            onClose={() => setLiveExam(null)}
          />
        )}

        {/* 인터랙티브 분석 대시보드 */}
        {analyticsExam && (
          <InteractiveExamAnalytics
            exam={analyticsExam}
            onClose={() => setAnalyticsExam(null)}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default ExamManagement;