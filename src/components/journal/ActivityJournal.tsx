import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  AcademicCapIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import JournalForm from './JournalForm';
import PresentationScheduler from '../presentation/PresentationScheduler';
import PresentationFeedback from '../presentation/PresentationFeedback';
import type { 
  BSActivityEntry, 
  ActivityJournalFilters,
  PresentationSchedule,
  InstructorFeedback,
  JournalStatistics
} from '../../types/activity-journal.types';

const ActivityJournal: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isInstructor = user?.role === 'instructor';
  const isOperator = ['admin', 'manager', 'operator'].includes(user?.role || '');

  const [currentView, setCurrentView] = useState<'list' | 'form' | 'presentation' | 'feedback' | 'scheduler'>('list');
  const [entries, setEntries] = useState<BSActivityEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BSActivityEntry[]>([]);
  const [presentations, setPresentations] = useState<PresentationSchedule[]>([]);
  const [feedbacks, setFeedbacks] = useState<InstructorFeedback[]>([]);
  const [statistics, setStatistics] = useState<JournalStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 필터링 상태
  const [filters, setFilters] = useState<ActivityJournalFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<BSActivityEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 폼 관련 상태
  const [editingEntry, setEditingEntry] = useState<Partial<BSActivityEntry> | null>(null);
  const [currentCourse, setCurrentCourse] = useState({
    courseCode: 'BS-2025-01',
    courseName: 'BS 신입 영업사원 기초과정',
    round: 1
  });

  // 피드백 관련 상태
  const [feedbackEntry, setFeedbackEntry] = useState<BSActivityEntry | null>(null);

  // 샘플 데이터 생성
  useEffect(() => {
    const generateSampleData = () => {
      const sampleEntries: BSActivityEntry[] = [
        {
          id: 'entry-1',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          round: 1,
          studentId: 'student-1',
          studentName: '김교육',
          title: '고객 상담 및 제품 소개 실습',
          workSite: '서울 강남지점',
          workDate: '2025-01-25',
          workContent: '기존 고객 3명과 신규 고객 2명에게 제품 소개를 진행했습니다. 특히 신규 고객들의 니즈 파악에 집중했고, 제품의 장점을 구체적인 사례와 함께 설명했습니다.',
          learningPoints: '고객별로 다른 접근 방식이 필요하다는 것을 배웠습니다. 기존 고객은 업그레이드 위주로, 신규 고객은 기본 기능 설명부터 시작하는 것이 효과적이었습니다.',
          challenges: '신규 고객 중 한 분이 경쟁사 제품과 비교를 요청했는데, 경쟁사에 대한 지식이 부족해서 즉석에서 답변하기 어려웠습니다.',
          solutions: '경쟁사 제품 분석 자료를 미리 준비하고, 우리 제품만의 차별화 포인트를 명확히 정리해서 다음 상담에 활용하겠습니다.',
          insights: '고객의 말을 끝까지 듣고 니즈를 정확히 파악한 후 설명하는 것이 훨씬 효과적이라는 것을 깨달았습니다.',
          improvementAreas: '경쟁사 분석 능력 향상, 고객 질문에 대한 즉석 대응 능력 개선이 필요합니다.',
          nextActions: '경쟁사 제품 스터디, 고객 유형별 접근 전략 수립, 실무진과의 피드백 세션 참여',
          createdAt: '2025-01-25T18:30:00Z',
          updatedAt: '2025-01-25T18:30:00Z',
          submittedAt: '2025-01-25T18:30:00Z',
          status: 'feedback_received',
          presentationDate: '2025-01-28',
          presentationOrder: 1,
          isSelected: true,
          attachments: [],
          scoreReflected: true,
          submissionDeadline: '2025-01-26T23:59:59Z',
          isLateSubmission: false
        },
        {
          id: 'entry-2',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          round: 1,
          studentId: 'student-1',
          studentName: '김교육',
          title: '영업 데이터 분석 및 고객 관리',
          workSite: '본사 사무실',
          workDate: '2025-01-26',
          workContent: 'CRM 시스템을 활용해 지난 분기 고객 데이터를 분석하고, 고객 세분화 작업을 진행했습니다.',
          learningPoints: 'CRM 시스템의 다양한 기능을 활용하면 고객 패턴 분석이 훨씬 효율적이라는 것을 배웠습니다.',
          challenges: '데이터양이 많아서 어떤 기준으로 분류해야 할지 판단이 어려웠습니다.',
          solutions: '선배 동료에게 조언을 구하고, 업계 표준 분류 기준을 참고했습니다.',
          insights: '데이터 기반의 의사결정이 얼마나 중요한지 실감했습니다.',
          improvementAreas: '데이터 분석 스킬 향상, Excel 고급 기능 활용 능력',
          nextActions: 'Excel 고급 과정 수강, 데이터 분석 관련 도서 읽기',
          createdAt: '2025-01-26T17:00:00Z',
          updatedAt: '2025-01-26T17:00:00Z',
          submittedAt: '2025-01-26T17:00:00Z',
          status: 'ready_for_presentation',
          isSelected: false,
          attachments: [],
          scoreReflected: false,
          submissionDeadline: '2025-01-27T23:59:59Z',
          isLateSubmission: false
        }
      ];

      const samplePresentations: PresentationSchedule[] = [
        {
          id: 'presentation-1',
          courseCode: 'BS-2025-01',
          round: 1,
          presentationDate: '2025-01-28',
          deadline: '2025-01-26T23:59:59Z',
          selectedStudents: [
            {
              studentId: 'student-1',
              studentName: '김교육',
              activityId: 'entry-1',
              presentationOrder: 1
            }
          ],
          status: 'presentation_day',
          createdAt: '2025-01-20T09:00:00Z',
          updatedAt: '2025-01-26T17:00:00Z'
        }
      ];

      const sampleFeedbacks: InstructorFeedback[] = [
        {
          id: 'feedback-1',
          activityId: 'entry-1',
          instructorId: 'instructor-1',
          instructorName: '박강사',
          presentationScore: 8,
          contentQuality: 9,
          presentationSkill: 7,
          strengths: '고객 니즈 파악에 집중한 점이 매우 좋았습니다. 실제 현장 경험을 바탕으로 한 구체적인 사례가 인상적이었습니다.',
          areasForImprovement: '경쟁사 분석 부분에서 더 깊이 있는 준비가 필요합니다. 또한 발표 시 좀 더 자신감 있게 말씀해주세요.',
          specificSuggestions: '경쟁사 분석 자료를 체계적으로 정리하고, 고객 유형별 접근 전략을 구체화해보세요. 발표 스킬은 연습을 통해 개선할 수 있습니다.',
          encouragement: '현장에서의 배움을 체계적으로 정리하는 능력이 뛰어납니다. 앞으로 더 발전된 모습을 기대하겠습니다!',
          overallGrade: 'B+',
          createdAt: '2025-01-28T15:30:00Z',
          updatedAt: '2025-01-28T15:30:00Z'
        }
      ];

      const sampleStatistics: JournalStatistics = {
        totalEntries: 2,
        byStatus: {
          'draft': 0,
          'submitted': 0,
          'ready_for_presentation': 1,
          'presented': 0,
          'feedback_received': 1
        },
        byRound: { 1: 2 },
        submissionRate: 100,
        onTimeSubmissionRate: 100,
        averageScore: 8.0,
        feedbackCoverage: 50
      };

      return { entries: sampleEntries, presentations: samplePresentations, feedbacks: sampleFeedbacks, statistics: sampleStatistics };
    };

    setLoading(true);
    setTimeout(() => {
      const { entries: sampleEntries, presentations: samplePresentations, feedbacks: sampleFeedbacks, statistics: sampleStats } = generateSampleData();
      
      // 사용자 역할에 따라 필터링
      let filteredData = sampleEntries;
      if (isStudent) {
        filteredData = sampleEntries.filter(entry => entry.studentId === user?.id);
      }
      
      setEntries(filteredData);
      setFilteredEntries(filteredData);
      setPresentations(samplePresentations);
      setFeedbacks(sampleFeedbacks);
      setStatistics(sampleStats);
      setLoading(false);
    }, 800);
  }, [user?.id, isStudent]);

  // 검색 및 필터링
  const applyFilters = useCallback(() => {
    let filtered = entries;

    // 텍스트 검색
    if (searchQuery) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.workSite.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.workContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 필터 적용
    if (filters.courseCode) {
      filtered = filtered.filter(entry => entry.courseCode === filters.courseCode);
    }
    if (filters.round) {
      filtered = filtered.filter(entry => entry.round === filters.round);
    }
    if (filters.status) {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }
    if (filters.workSite) {
      filtered = filtered.filter(entry => entry.workSite.includes(filters.workSite));
    }
    if (filters.dateRange) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.workDate);
        const start = filters.dateRange?.start ? new Date(filters.dateRange.start) : null;
        const end = filters.dateRange?.end ? new Date(filters.dateRange.end) : null;
        
        if (start && entryDate < start) return false;
        if (end && entryDate > end) return false;
        return true;
      });
    }

    setFilteredEntries(filtered);
  }, [entries, searchQuery, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // 활동일지 저장
  const handleSaveEntry = async (entryData: Partial<BSActivityEntry>) => {
    const newEntry: BSActivityEntry = {
      id: entryData.id || `entry-${Date.now()}`,
      courseCode: entryData.courseCode || currentCourse.courseCode,
      courseName: entryData.courseName || currentCourse.courseName,
      round: entryData.round || currentCourse.round,
      studentId: entryData.studentId || user?.id || '',
      studentName: entryData.studentName || user?.name || '',
      title: entryData.title || '',
      workSite: entryData.workSite || '',
      workDate: entryData.workDate || '',
      workContent: entryData.workContent || '',
      learningPoints: entryData.learningPoints || '',
      challenges: entryData.challenges || '',
      solutions: entryData.solutions || '',
      insights: entryData.insights || '',
      improvementAreas: entryData.improvementAreas || '',
      nextActions: entryData.nextActions || '',
      createdAt: entryData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: entryData.submittedAt,
      status: entryData.status || 'draft',
      presentationDate: entryData.presentationDate,
      presentationOrder: entryData.presentationOrder,
      isSelected: entryData.isSelected || false,
      attachments: entryData.attachments || [],
      scoreReflected: entryData.scoreReflected || false,
      submissionDeadline: entryData.submissionDeadline || '',
      isLateSubmission: entryData.isLateSubmission || false
    };

    if (editingEntry?.id) {
      // 수정
      setEntries(prev => prev.map(entry => entry.id === newEntry.id ? newEntry : entry));
    } else {
      // 새로 추가
      setEntries(prev => [newEntry, ...prev]);
    }

    setEditingEntry(null);
    setCurrentView('list');
  };

  // 피드백 제출 핸들러
  const handleFeedbackSubmit = async (feedback: Partial<InstructorFeedback>) => {
    // 실제 환경에서는 서버에 전송
    setFeedbacks(prev => [...prev, feedback as InstructorFeedback]);
    
    // 해당 활동일지 상태 업데이트
    setEntries(prev => prev.map(entry => 
      entry.id === feedback.activityId 
        ? { ...entry, status: 'feedback_received' as const }
        : entry
    ));
    
    setFeedbackEntry(null);
    setCurrentView('list');
  };

  // 상태별 색상 반환
  const getStatusColor = (status: BSActivityEntry['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'ready_for_presentation': return 'bg-yellow-100 text-yellow-700';
      case 'presented': return 'bg-purple-100 text-purple-700';
      case 'feedback_received': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 상태별 라벨 반환
  const getStatusLabel = (status: BSActivityEntry['status']) => {
    switch (status) {
      case 'draft': return '임시저장';
      case 'submitted': return '제출완료';
      case 'ready_for_presentation': return '발표대기';
      case 'presented': return '발표완료';
      case 'feedback_received': return '피드백완료';
      default: return '알 수 없음';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 발표 스케줄러 뷰
  if (currentView === 'scheduler') {
    return (
      <PresentationScheduler
        courseCode={currentCourse.courseCode}
        round={currentCourse.round}
        onScheduleUpdate={(schedule) => {
          setPresentations(prev => [...prev, schedule]);
        }}
      />
    );
  }

  // 피드백 뷰
  if (currentView === 'feedback' && feedbackEntry) {
    return (
      <PresentationFeedback
        activityEntry={feedbackEntry}
        onFeedbackSubmit={handleFeedbackSubmit}
        onClose={() => {
          setFeedbackEntry(null);
          setCurrentView('list');
        }}
        isRealTime={false}
      />
    );
  }

  // 폼 뷰
  if (currentView === 'form') {
    return (
      <JournalForm
        entry={editingEntry || undefined}
        courseCode={currentCourse.courseCode}
        courseName={currentCourse.courseName}
        round={currentCourse.round}
        onSave={handleSaveEntry}
        onCancel={() => {
          setCurrentView('list');
          setEditingEntry(null);
        }}
        submissionDeadline="2025-01-30T23:59:59Z"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">활동일지를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📔 BS 활동일지</h1>
            <p className="text-gray-600">
              {isStudent && '현장 업무 경험을 기록하고 학습 성과를 공유하세요.'}
              {isInstructor && '교육생들의 활동일지를 확인하고 피드백을 제공하세요.'}
              {isOperator && '전체 활동일지 현황을 관리하고 분석하세요.'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {isOperator && (
              <button
                onClick={() => setCurrentView('scheduler')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <PresentationChartBarIcon className="h-4 w-4" />
                <span>발표 일정 관리</span>
              </button>
            )}
            
            {isStudent && (
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setCurrentView('form');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>활동일지 작성</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 통계 대시보드 */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">전체 일지</p>
                <p className="text-xl font-bold text-gray-900">{statistics.totalEntries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">제출률</p>
                <p className="text-xl font-bold text-gray-900">{statistics.submissionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">정시 제출</p>
                <p className="text-xl font-bold text-gray-900">{statistics.onTimeSubmissionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">평균 점수</p>
                <p className="text-xl font-bold text-gray-900">{statistics.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="제목, 현장, 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 상태</option>
            <option value="draft">임시저장</option>
            <option value="submitted">제출완료</option>
            <option value="ready_for_presentation">발표대기</option>
            <option value="presented">발표완료</option>
            <option value="feedback_received">피드백완료</option>
          </select>

          <select
            value={filters.round || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, round: e.target.value ? Number(e.target.value) : undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">모든 차수</option>
            <option value="1">1차</option>
            <option value="2">2차</option>
            <option value="3">3차</option>
          </select>
        </div>
      </div>

      {/* 활동일지 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            활동일지 목록 ({filteredEntries.length})
          </h3>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">활동일지가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || Object.keys(filters).some(key => filters[key as keyof ActivityJournalFilters])
                ? '검색 조건에 맞는 활동일지가 없습니다.'
                : '아직 작성된 활동일지가 없습니다.'
              }
            </p>
            {isStudent && (
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setCurrentView('form');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                첫 활동일지 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => {
              const feedback = feedbacks.find(f => f.activityId === entry.id);
              
              return (
                <div key={entry.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{entry.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                        {entry.isSelected && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            발표 선정
                          </span>
                        )}
                        {entry.isLateSubmission && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            지각 제출
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          {formatDate(entry.workDate)}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">현장:</span>
                          {entry.workSite}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">차수:</span>
                          {entry.round}차 ({entry.courseCode})
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {entry.workContent}
                      </p>

                      {!isStudent && (
                        <div className="text-sm text-gray-600">
                          작성자: {entry.studentName}
                        </div>
                      )}

                      {feedback && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">강사 피드백</span>
                            <span className="text-sm font-bold text-blue-900">{feedback.overallGrade}</span>
                          </div>
                          <p className="text-sm text-blue-800">{feedback.strengths}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="상세보기"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {(isStudent && entry.studentId === user?.id && ['draft', 'submitted'].includes(entry.status)) && (
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setCurrentView('form');
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="수정"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}

                      {isInstructor && entry.status === 'presented' && !feedback && (
                        <button
                          onClick={() => {
                            setFeedbackEntry(entry);
                            setCurrentView('feedback');
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                          title="피드백 작성"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedEntry.title}</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">현장:</span>
                    <span className="ml-2 text-gray-900">{selectedEntry.workSite}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">날짜:</span>
                    <span className="ml-2 text-gray-900">{formatDate(selectedEntry.workDate)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">수행한 업무 내용</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEntry.workContent}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">학습 포인트</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEntry.learningPoints}</p>
                </div>

                {selectedEntry.challenges && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">어려웠던 점</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEntry.challenges}</p>
                  </div>
                )}

                {selectedEntry.solutions && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">해결 방안</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEntry.solutions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityJournal;