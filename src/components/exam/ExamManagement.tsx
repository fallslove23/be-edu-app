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
           exam.course_name.toLowerCase().includes(searchTerm.toLowerCase());
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
      await fetchExams();
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setCurrentView('question-bank')}
                className="mb-4 text-gray-600 hover:text-gray-800 flex items-center"
              >
                ← 문제은행으로 돌아가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <UserGroupIcon className="h-8 w-8 mr-3 text-gray-600" />
                시험 대상자 선택
              </h1>
              <p className="mt-2 text-gray-600">
                "{selectedQuestionBank.name}" 문제은행으로 시험을 진행할 과정 차수를 선택하세요.
              </p>
            </div>
            <button
              onClick={handleCreateExamFromBank}
              disabled={selectedTargets.length === 0}
              className={`px-4 py-2 rounded-full flex items-center transition-colors ${
                selectedTargets.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              시험 생성 ({selectedTargets.length}개 차수)
            </button>
          </div>
        </div>

        {/* 선택된 문제은행 정보 */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-2">선택된 문제은행</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm">
              <span className="text-gray-600">문제은행명:</span>
              <div className="font-medium">{selectedQuestionBank.name}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">카테고리:</span>
              <div className="font-medium">{selectedQuestionBank.category || '-'}</div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">문제 수:</span>
              <div className="font-medium">{selectedQuestionBank.question_count || 0}개</div>
            </div>
          </div>
        </div>

        {/* 과정 차수 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">과정 차수 목록</h2>
          <div className="space-y-3">
            {examTargets.map((target) => (
              <label
                key={target.id}
                className={`flex items-center p-4 border rounded-full cursor-pointer transition-colors ${
                  selectedTargets.includes(target.id)
                    ? 'border-gray-600 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTargets.includes(target.id)}
                  onChange={() => handleTargetToggle(target.id)}
                  className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {target.course_name} - {target.session_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {target.start_date} ~ {target.end_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {target.student_count}명
                      </div>
                      <div className="text-xs text-gray-500">
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <AcademicCapIcon className="h-8 w-8 mr-3 text-blue-600" />
              이론 평가 관리
            </h1>
            <p className="mt-2 text-gray-600">
              수강생들의 이론 시험을 생성하고 관리하세요.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentView('question-bank')}
              className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors flex items-center"
            >
              <BookOpenIcon className="h-5 w-5 mr-2" />
              문제은행 관리
            </button>
            <button
              onClick={() => setCurrentView('form')}
              className="bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              새 시험 생성
            </button>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{examStats.total}</div>
            <div className="text-sm text-gray-600">전체 시험</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{examStats.active}</div>
            <div className="text-sm text-gray-600">진행중</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{examStats.scheduled}</div>
            <div className="text-sm text-gray-600">예정됨</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-700">{examStats.completed}</div>
            <div className="text-sm text-gray-600">완료됨</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{questionBanks.length}</div>
            <div className="text-sm text-gray-600">문제은행</div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="시험명, 과정명으로 검색..."
              className="pl-10 pr-4 py-2.5 w-full border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
            />
          </div>

          {/* 결과 카운트 */}
          <div className="flex items-center px-4 py-2.5 bg-secondary/30 rounded-full border border-border">
            <FunnelIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              총 <span className="text-primary font-semibold">{filteredExams.length}</span>개 시험
            </span>
          </div>
        </div>
      </div>

      {/* 시험 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">시험 목록</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">시험 목록을 불러오는 중...</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{exam.course_name}</p>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                    exam.status === 'active' ? 'bg-primary text-primary-foreground border-border' :
                    exam.status === 'scheduled' ? 'bg-accent text-accent-foreground border-border' :
                    exam.status === 'completed' ? 'bg-muted text-muted-foreground border-border' :
                    'bg-secondary text-secondary-foreground border-border'
                  }`}>
                    {exam.status === 'active' ? '진행중' :
                     exam.status === 'scheduled' ? '예정' :
                     exam.status === 'completed' ? '완료' : '준비중'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>⏱️ {exam.duration_minutes}분</span>
                    <span className="mx-2">•</span>
                    <span>📝 {exam.total_questions}문항</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    🎯 합격점: {exam.passing_score}점
                  </div>
                </div>

                {exam.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {exam.description}
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExamTake(exam)}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    시험 응시
                  </button>
                  <button
                    onClick={() => handleExamEdit(exam)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    편집
                  </button>
                  {exam.status === 'active' && (
                    <button
                      onClick={() => setLiveExam(exam)}
                      className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded text-sm hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
                      title="실시간 현황"
                    >
                      <TvIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setCloningExam(exam)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                    title="시험 복제"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExamResults(exam)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    결과
                  </button>
                  <button
                    onClick={() => setAnalyticsExam(exam)}
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded text-sm hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
                    title="인터랙티브 분석"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
  );
};

export default ExamManagement;