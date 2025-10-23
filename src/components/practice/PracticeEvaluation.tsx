import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import type { PracticeEvaluation as PracticeEvaluationType, PracticeType, PracticeStatus, PracticeSession } from '../../types/practice.types';
import { practiceTypeLabels, practiceStatusLabels } from '../../types/practice.types';
import PracticeForm from './PracticeForm';
import PracticeSessionView from './PracticeSessionView';
import PracticeResults from './PracticeResults';

type ViewType = 'list' | 'form' | 'session' | 'results';

const PracticeEvaluation: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedPractice, setSelectedPractice] = useState<PracticeEvaluationType | null>(null);
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [practices, setPractices] = useState<PracticeEvaluationType[]>([]);
  const [filteredPractices, setFilteredPractices] = useState<PracticeEvaluationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<PracticeType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PracticeStatus | 'all'>('all');

  // Mock data - 실제로는 API에서 가져옴
  useEffect(() => {
    const mockPractices: PracticeEvaluationType[] = [
      {
        id: '1',
        course_id: 'course-1',
        title: '고객 대면 영업 시뮬레이션',
        description: '실제 고객과의 대면 상황을 시뮬레이션하여 영업 스킬을 평가합니다.',
        evaluation_type: 'role_play',
        scenario: {
          title: '부동산 중개 상담',
          background: '30대 부부가 첫 아파트 구매를 위해 상담을 요청한 상황',
          customer_profile: {
            name: '김영수, 박미영 부부',
            age: 32,
            occupation: '직장인 부부',
            personality_traits: ['신중함', '꼼꼼함', '예산 민감'],
            needs: ['안전한 학군', '교통 편의성', '투자 가치'],
            concerns: ['예산 초과', '대출 조건', '향후 시세'],
            budget_range: '4억 ~ 4.5억원'
          },
          sales_context: {
            product: '강남구 신축 아파트',
            competition: ['인근 분양 아파트', '기존 아파트 매매'],
            market_situation: '금리 상승으로 관망세 증가',
            sales_goals: ['신뢰 구축', '니즈 파악', '제안서 약속']
          },
          success_criteria: ['고객 니즈 정확한 파악', '적절한 물건 추천', '다음 미팅 약속']
        },
        duration_minutes: 45,
        max_score: 100,
        evaluation_criteria: [
          {
            id: 'comm1',
            category: 'communication',
            name: '첫인상 및 라포 형성',
            description: '고객과의 첫 만남에서 신뢰감을 구축하고 편안한 분위기를 조성',
            max_points: 20,
            weight: 0.2,
            rubric: [
              { level: 5, label: '우수', description: '매우 전문적이고 친근한 첫인상, 완벽한 라포 형성', points: 20 },
              { level: 4, label: '양호', description: '전문적인 첫인상, 좋은 라포 형성', points: 16 },
              { level: 3, label: '보통', description: '적절한 첫인상, 기본적인 라포 형성', points: 12 },
              { level: 2, label: '미흡', description: '어색한 첫인상, 라포 형성 부족', points: 8 },
              { level: 1, label: '부족', description: '부적절한 첫인상, 라포 형성 실패', points: 4 }
            ]
          }
        ],
        instructions: '고객의 말을 주의 깊게 들으며, 니즈를 파악하여 적절한 솔루션을 제안하세요.',
        materials: ['부동산 매물 자료', '대출 상품 안내', '계약서 양식'],
        status: 'published',
        created_by: 'instructor-1',
        created_at: '2024-01-15T09:00:00Z',
        scheduled_start: '2024-02-01T09:00:00Z',
        scheduled_end: '2024-02-15T18:00:00Z'
      },
      {
        id: '2',
        course_id: 'course-1',
        title: '보험 상품 프레젠테이션',
        description: '다양한 보험 상품을 고객에게 효과적으로 설명하고 제안하는 능력을 평가합니다.',
        evaluation_type: 'presentation',
        scenario: {
          title: '가족 보험 컨설팅',
          background: '40대 가장이 가족을 위한 종합적인 보험 설계를 원하는 상황',
          customer_profile: {
            name: '이철민',
            age: 42,
            occupation: '중소기업 대표',
            personality_traits: ['결정력 있음', '가족 중시', '효율성 추구'],
            needs: ['가족 보장', '노후 준비', '세제 혜택'],
            concerns: ['보험료 부담', '복잡한 상품', '보장 범위'],
            budget_range: '월 50만원 ~ 70만원'
          },
          sales_context: {
            product: '종합 가족 보험 패키지',
            competition: ['타사 보험 상품', '은행 금융 상품'],
            market_situation: '저금리로 보험 관심 증가',
            sales_goals: ['맞춤 설계 제안', '보험료 최적화', '계약 체결']
          },
          success_criteria: ['니즈 맞춤 제안', '명확한 설명', '계약 의향 확인']
        },
        duration_minutes: 30,
        max_score: 100,
        evaluation_criteria: [
          {
            id: 'pres1',
            category: 'presentation_skills',
            name: '프레젠테이션 구성',
            description: '논리적이고 체계적인 프레젠테이션 구성과 전달',
            max_points: 25,
            weight: 0.25,
            rubric: [
              { level: 5, label: '우수', description: '완벽한 구성과 논리적 흐름', points: 25 },
              { level: 4, label: '양호', description: '좋은 구성과 명확한 흐름', points: 20 },
              { level: 3, label: '보통', description: '적절한 구성', points: 15 },
              { level: 2, label: '미흡', description: '구성이 다소 부족', points: 10 },
              { level: 1, label: '부족', description: '구성과 흐름이 부적절', points: 5 }
            ]
          }
        ],
        instructions: '고객의 상황을 고려한 맞춤형 보험 설계안을 체계적으로 발표하세요.',
        materials: ['보험 상품 카탈로그', '설계 프로그램', '프레젠테이션 자료'],
        status: 'published',
        created_by: 'instructor-2',
        created_at: '2024-01-20T10:00:00Z',
        scheduled_start: '2024-02-05T09:00:00Z',
        scheduled_end: '2024-02-20T18:00:00Z'
      },
      {
        id: '3',
        course_id: 'course-2',
        title: '어려운 고객 상황 대처',
        description: '불만이 있거나 까다로운 고객을 응대하는 상황을 시뮬레이션합니다.',
        evaluation_type: 'simulation',
        scenario: {
          title: '클레임 상황 처리',
          background: '보험금 지급에 불만을 가진 고객의 항의 전화를 받는 상황',
          customer_profile: {
            name: '화난 고객',
            age: 50,
            occupation: '자영업자',
            personality_traits: ['감정적', '직설적', '불신'],
            needs: ['신속한 해결', '명확한 답변', '진심 어린 사과'],
            concerns: ['부당 처리', '시간 지연', '추가 피해'],
            budget_range: '해당 없음'
          },
          sales_context: {
            product: '자동차 보험 클레임',
            competition: ['타사 이동 검토'],
            market_situation: '고객 만족도 중요성 증대',
            sales_goals: ['고객 진정', '문제 해결', '관계 회복']
          },
          success_criteria: ['감정 공감', '문제 해결책 제시', '고객 만족']
        },
        duration_minutes: 25,
        max_score: 100,
        evaluation_criteria: [
          {
            id: 'handle1',
            category: 'objection_handling',
            name: '감정 처리 및 공감',
            description: '고객의 감정을 이해하고 적절히 대응하는 능력',
            max_points: 30,
            weight: 0.3,
            rubric: [
              { level: 5, label: '우수', description: '완벽한 감정 공감과 효과적 진정', points: 30 },
              { level: 4, label: '양호', description: '좋은 감정 이해와 적절한 대응', points: 24 },
              { level: 3, label: '보통', description: '기본적인 감정 공감', points: 18 },
              { level: 2, label: '미흡', description: '감정 이해 부족', points: 12 },
              { level: 1, label: '부족', description: '감정 대응 실패', points: 6 }
            ]
          }
        ],
        instructions: '고객의 감정을 먼저 이해하고, 차근차근 문제 해결책을 제시하세요.',
        materials: ['클레임 처리 매뉴얼', '고객 정보', '유사 사례집'],
        status: 'draft',
        created_by: 'instructor-1',
        created_at: '2024-01-22T14:00:00Z'
      }
    ];

    setPractices(mockPractices);
    setFilteredPractices(mockPractices);
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = practices;

    if (searchTerm) {
      filtered = filtered.filter(practice =>
        practice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        practice.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(practice => practice.evaluation_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(practice => practice.status === statusFilter);
    }

    setFilteredPractices(filtered);
  }, [practices, searchTerm, typeFilter, statusFilter]);

  const handleCreatePractice = () => {
    setSelectedPractice(null);
    setCurrentView('form');
  };

  const handleEditPractice = (practice: PracticeEvaluationType) => {
    setSelectedPractice(practice);
    setCurrentView('form');
  };

  const handleStartSession = (practice: PracticeEvaluationType) => {
    setSelectedPractice(practice);
    setCurrentView('session');
  };

  const handleViewResults = (practice: PracticeEvaluationType) => {
    setSelectedPractice(practice);
    setCurrentView('results');
  };

  const handleSavePractice = (practiceData: Partial<PracticeEvaluationType>) => {
    if (selectedPractice) {
      const updatedPractices = practices.map(p =>
        p.id === selectedPractice.id ? { ...p, ...practiceData } : p
      );
      setPractices(updatedPractices);
    } else {
      const newPractice: PracticeEvaluationType = {
        ...practiceData as PracticeEvaluationType,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      setPractices([...practices, newPractice]);
    }
    setCurrentView('list');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedPractice(null);
    setSelectedSession(null);
  };

  if (currentView === 'form') {
    return (
      <PracticeForm
        practice={selectedPractice}
        onBack={handleBack}
        onSave={handleSavePractice}
      />
    );
  }

  if (currentView === 'session' && selectedPractice) {
    return (
      <PracticeSessionView
        practice={selectedPractice}
        onBack={handleBack}
      />
    );
  }

  if (currentView === 'results' && selectedPractice) {
    return (
      <PracticeResults
        practice={selectedPractice}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">실습 평가 관리</h1>
            <p className="text-muted-foreground">영업 시뮬레이션, 역할극, 프레젠테이션 등 실습 평가를 관리합니다.</p>
          </div>
          <button
            onClick={handleCreatePractice}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors flex items-center font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 실습 평가 생성
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">전체 평가</p>
              <p className="text-2xl font-semibold text-card-foreground">{practices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">진행중</p>
              <p className="text-2xl font-semibold text-card-foreground">
                {practices.filter(p => p.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-slate-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">참여 인원</p>
              <p className="text-2xl font-semibold text-card-foreground">24</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">평균 점수</p>
              <p className="text-2xl font-semibold text-card-foreground">82.5</p>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="제목, 설명 검색..."
              className="pl-10 pr-4 py-2 w-full border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PracticeType | 'all')}
            className="border border-input rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="all">모든 유형</option>
            {(Object.keys(practiceTypeLabels) as PracticeType[]).map(type => (
              <option key={type} value={type}>{practiceTypeLabels[type]}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PracticeStatus | 'all')}
            className="border border-input rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring focus:border-ring"
          >
            <option value="all">모든 상태</option>
            {(Object.keys(practiceStatusLabels) as PracticeStatus[]).map(status => (
              <option key={status} value={status}>{practiceStatusLabels[status]}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-muted-foreground">
            총 {filteredPractices.length}개 평가
          </div>
        </div>
      </div>

      {/* 실습 평가 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPractices.map((practice) => (
          <div key={practice.id} className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    practice.evaluation_type === 'role_play' ? 'bg-purple-100 text-purple-800' :
                    practice.evaluation_type === 'simulation' ? 'bg-blue-100 text-blue-800' :
                    practice.evaluation_type === 'presentation' ? 'bg-green-100 text-green-800' :
                    practice.evaluation_type === 'case_study' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {practiceTypeLabels[practice.evaluation_type]}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    practice.status === 'published' ? 'bg-green-100 text-green-800' :
                    practice.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    practice.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    practice.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {practiceStatusLabels[practice.status]}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-card-foreground mb-2">{practice.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{practice.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {practice.duration_minutes}분
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    최대 {practice.max_score}점
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-muted-foreground/70">
                  시나리오: {practice.scenario.title}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => handleStartSession(practice)}
                disabled={practice.status !== 'published'}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium transition-colors"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                세션 시작
              </button>
              <button
                onClick={() => handleViewResults(practice)}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center font-medium transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-1" />
                결과 보기
              </button>
              <button
                onClick={() => handleEditPractice(practice)}
                className="btn-neutral btn-sm"
              >
                수정
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPractices.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg shadow-sm border border-border">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-card-foreground">실습 평가가 없습니다</h3>
          <p className="mt-1 text-sm text-muted-foreground">새로운 실습 평가를 생성해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default PracticeEvaluation;