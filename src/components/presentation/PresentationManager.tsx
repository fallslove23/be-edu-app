import React, { useState, useEffect } from 'react';
import {
  PresentationChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  EyeIcon,
  PlayIcon,
  DocumentTextIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface PresentationSlide {
  id: string;
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'conclusion';
  order: number;
}

interface Presentation {
  id: string;
  journalId: string;
  title: string;
  courseCode: string;
  courseName: string;
  session: number;
  studentName: string;
  studentId: string;
  presentationDate: string;
  duration: number; // 분
  slides: PresentationSlide[];
  status: 'draft' | 'ready' | 'presented' | 'completed';
  feedback?: string;
  score?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // 발표 관련 정보
  audience: string[];
  presenter: string;
  location: string;
  equipment: string[];
  notes: string;
}

interface PresentationManagerProps {
  journalId?: string;
}

const PresentationManager: React.FC<PresentationManagerProps> = ({ journalId }) => {
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [filteredPresentations, setFilteredPresentations] = useState<Presentation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSamplePresentations = (): Presentation[] => {
      return [
        {
          id: 'pres-1',
          journalId: 'entry-1',
          title: '고객 니즈 분석 방법론 학습 발표',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          session: 8,
          studentName: user?.name || '홍길동',
          studentId: user?.id || 'student-001',
          presentationDate: '2025-01-17',
          duration: 10,
          slides: [
            {
              id: 'slide-1',
              title: '고객 니즈 분석 방법론 학습',
              content: 'BS-2025-01 8차시 학습 내용 발표',
              type: 'title',
              order: 1
            },
            {
              id: 'slide-2',
              title: '학습 목표',
              content: '• SPIN 기법을 활용한 효과적인 질문 기법 습득\n• 고객의 명시적/잠재적 니즈 파악 능력 향상\n• 적극적 경청을 통한 고객 관계 구축 방법 이해\n• 실제 영업 상황에서의 적용 방안 모색',
              type: 'content',
              order: 2
            },
            {
              id: 'slide-3',
              title: '주요 학습 활동',
              content: '• SPIN 기법 이론 학습 및 사례 분석\n• 2인 1조 롤플레이 실습 (고객-영업사원)\n• 실제 고객 대화 시나리오 작성\n• 경청 기법 실습 및 피드백',
              type: 'content',
              order: 3
            },
            {
              id: 'slide-4',
              title: '핵심 인사이트',
              content: '고객의 니즈는 표면적으로 드러나는 것과 실제로 원하는 것이 다를 수 있다는 점을 배웠습니다. 특히 문제 상황을 구체적으로 파악하고, 그것이 미치는 영향을 함께 고민해야 진정한 니즈를 찾을 수 있다는 것을 깨달았습니다.',
              type: 'content',
              order: 4
            },
            {
              id: 'slide-5',
              title: '향후 적용 계획',
              content: '이번 주말에 가족이나 지인들과 대화할 때 배운 경청 기법을 연습해보고, 다음 수업 전까지 SPIN 기법을 활용한 대화 시나리오 3개를 더 작성하겠습니다.',
              type: 'conclusion',
              order: 5
            }
          ],
          status: 'ready',
          score: 4.5,
          tags: ['SPIN기법', '질문기법', '경청', '고객니즈'],
          audience: ['강사', '동료 교육생'],
          presenter: user?.name || '홍길동',
          location: '교육실 A',
          equipment: ['프로젝터', '마이크', '화이트보드'],
          notes: '실습 사례를 중심으로 발표하고, 질의응답 시간을 충분히 확보',
          createdAt: '2025-01-10T16:45:00Z',
          updatedAt: '2025-01-15T14:20:00Z'
        },
        {
          id: 'pres-2',
          journalId: 'entry-3',
          title: '대형 거래 협상 전략 발표',
          courseCode: 'BS-2025-02',
          courseName: 'BS 고급 영업 전략과정',
          session: 15,
          studentName: user?.name || '홍길동',
          studentId: user?.id || 'student-001',
          presentationDate: '2025-01-16',
          duration: 15,
          slides: [
            {
              id: 'slide-1',
              title: '대형 거래 협상 전략과 실전 적용',
              content: 'BS-2025-02 15차시 학습 내용 발표',
              type: 'title',
              order: 1
            },
            {
              id: 'slide-2',
              title: 'DMU 분석의 중요성',
              content: 'Decision Making Unit 분석을 통한 체계적인 이해관계자 파악 및 맞춤형 접근 전략 수립',
              type: 'content',
              order: 2
            },
            {
              id: 'slide-3',
              title: 'Win-Win 협상 전략',
              content: '• 상호 이익 창출 방안 모색\n• BATNA를 통한 협상력 강화\n• 장기적 파트너십 관점에서의 접근',
              type: 'content',
              order: 3
            },
            {
              id: 'slide-4',
              title: '실제 적용 사례',
              content: '담당 대형 고객사의 DMU 분석 결과와 협상 전략 수립 과정을 사례로 공유',
              type: 'content',
              order: 4
            },
            {
              id: 'slide-5',
              title: '결론 및 향후 계획',
              content: '현재 담당하고 있는 대형 고객사에 DMU 분석을 적용하여 협상 전략을 재검토하겠습니다.',
              type: 'conclusion',
              order: 5
            }
          ],
          status: 'presented',
          feedback: '실제 사례를 잘 활용한 발표였습니다. DMU 분석이 체계적이고 협상 전략도 현실적으로 잘 수립되었습니다.',
          score: 4.8,
          tags: ['대형거래', 'DMU분석', '협상전략', 'BATNA'],
          audience: ['강사', '동료 교육생', '현업 멘토'],
          presenter: user?.name || '홍길동',
          location: '교육실 B',
          equipment: ['프로젝터', '마이크', '태블릿'],
          notes: '사례 중심 발표로 실무 적용성 강조',
          createdAt: '2025-01-09T17:30:00Z',
          updatedAt: '2025-01-16T15:45:00Z'
        },
        {
          id: 'pres-3',
          journalId: 'entry-2',
          title: '영업 프로세스 체계화',
          courseCode: 'BS-2025-01',
          courseName: 'BS 신입 영업사원 기초과정',
          session: 7,
          studentName: user?.name || '홍길동',
          studentId: user?.id || 'student-001',
          presentationDate: '2025-01-20',
          duration: 8,
          slides: [
            {
              id: 'slide-1',
              title: '영업 프로세스와 단계별 전략',
              content: 'BS-2025-01 7차시 학습 내용 발표',
              type: 'title',
              order: 1
            },
            {
              id: 'slide-2',
              title: '체계적 영업 프로세스의 필요성',
              content: '영업은 예술이 아닌 과학적 접근이 필요하며, 체계적인 프로세스를 통해 성공률을 높일 수 있습니다.',
              type: 'content',
              order: 2
            }
          ],
          status: 'draft',
          tags: ['영업프로세스', '체계화', '단계별전략'],
          audience: ['강사', '동료 교육생'],
          presenter: user?.name || '홍길동',
          location: '교육실 A',
          equipment: ['프로젝터'],
          notes: '프로세스 체크리스트를 활용한 실습 포함',
          createdAt: '2025-01-08T15:10:00Z',
          updatedAt: '2025-01-12T10:30:00Z'
        }
      ];
    };

    setLoading(true);
    setTimeout(() => {
      const data = generateSamplePresentations();
      let filtered = data;
      
      // journalId가 지정된 경우 해당 일지의 발표만 표시
      if (journalId) {
        filtered = data.filter(p => p.journalId === journalId);
      }
      
      setPresentations(data);
      setFilteredPresentations(filtered);
      setLoading(false);
    }, 600);
  }, [user, journalId]);

  // 필터링 로직
  useEffect(() => {
    let filtered = presentations;

    // journalId 필터 (props로 전달된 경우)
    if (journalId) {
      filtered = filtered.filter(p => p.journalId === journalId);
    }

    // 검색어 필터
    if (searchQuery) {
      filtered = filtered.filter(presentation =>
        presentation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        presentation.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        presentation.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(presentation => presentation.status === statusFilter);
    }

    setFilteredPresentations(filtered);
  }, [presentations, searchQuery, statusFilter, journalId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'ready': return 'text-blue-600 bg-blue-100';
      case 'presented': return 'text-green-600 bg-green-500/10';
      case 'completed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '작성중';
      case 'ready': return '발표준비';
      case 'presented': return '발표완료';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  const getScoreStars = (score?: number) => {
    if (!score) return '미평가';
    const full = Math.floor(score);
    const half = score % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty) + ` (${score})`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}시간 ${mins}분`;
    }
    return `${minutes}분`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">발표 자료를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              📊 {journalId ? '발표 자료' : '발표 관리'}
            </h1>
            <p className="text-gray-600">
              {journalId 
                ? '활동 일지를 기반으로 생성된 발표 자료를 관리하세요.'
                : '학습 활동 일지를 기반으로 발표 자료를 생성하고 관리하세요.'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!journalId && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  목록
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'calendar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  달력
                </button>
              </div>
            )}
            <button
              onClick={() => {/* 새 발표 생성 */}}
              className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>발표 생성</span>
            </button>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 (전체 관리 모드일 때만 표시) */}
      {!journalId && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="발표 제목, 과정명, 태그로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">전체 상태</option>
                <option value="draft">작성중</option>
                <option value="ready">발표준비</option>
                <option value="presented">발표완료</option>
                <option value="completed">완료</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PresentationChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 발표</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPresentations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <PlayIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">발표 완료</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredPresentations.filter(p => p.status === 'presented').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredPresentations.length > 0
                  ? `${Math.round(filteredPresentations.reduce((sum, p) => sum + p.duration, 0) / filteredPresentations.length)}분`
                  : '0분'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 평점</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredPresentations.filter(p => p.score).length > 0
                  ? (filteredPresentations
                      .filter(p => p.score)
                      .reduce((sum, p) => sum + (p.score || 0), 0) / 
                     filteredPresentations.filter(p => p.score).length
                    ).toFixed(1)
                  : '0'
                }/5
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 발표 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            발표 목록 ({filteredPresentations.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredPresentations.map((presentation) => (
            <div
              key={presentation.id}
              className="p-6 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedPresentation(presentation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 헤더 정보 */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {presentation.courseCode}
                    </span>
                    <span className="text-sm text-gray-600">{presentation.session}차시</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(presentation.status)}`}>
                      {getStatusLabel(presentation.status)}
                    </span>
                    {presentation.score && (
                      <span className="text-xs text-foreground">
                        ★ {presentation.score}
                      </span>
                    )}
                  </div>

                  {/* 제목 및 정보 */}
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {presentation.title}
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">발표 일정</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(presentation.presentationDate).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-sm text-gray-600">{presentation.location}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">발표 정보</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDuration(presentation.duration)}
                      </div>
                      <div className="text-sm text-gray-600">
                        슬라이드 {presentation.slides.length}개
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">청중</div>
                      <div className="text-sm font-medium text-gray-900">
                        {presentation.audience.join(', ')}
                      </div>
                      {presentation.feedback && (
                        <div className="text-sm text-gray-600">피드백 완료</div>
                      )}
                    </div>
                  </div>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {presentation.tags.slice(0, 4).map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                    {presentation.tags.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{presentation.tags.length - 4}개
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 미리보기
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="미리보기"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 다운로드
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-500/10 rounded-lg"
                    title="다운로드"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 공유
                    }}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                    title="공유"
                  >
                    <ShareIcon className="h-4 w-4" />
                  </button>
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))}

          {filteredPresentations.length === 0 && (
            <div className="p-12 text-center">
              <PresentationChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">발표 자료가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                {journalId
                  ? '이 일지에서 발표 자료를 생성하지 않았습니다.'
                  : searchQuery || statusFilter !== 'all'
                  ? '검색 조건에 맞는 발표가 없습니다.'
                  : '활동 일지를 기반으로 첫 발표 자료를 생성해보세요.'
                }
              </p>
              {(!searchQuery && statusFilter === 'all') && (
                <button
                  onClick={() => {/* 발표 생성 */}}
                  className="btn-primary px-4 py-2 rounded-full"
                >
                  첫 발표 생성하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 상세보기 모달 */}
      {selectedPresentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {selectedPresentation.courseCode}
                    </span>
                    <span className="text-sm text-gray-600">{selectedPresentation.session}차시</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(selectedPresentation.status)}`}>
                      {getStatusLabel(selectedPresentation.status)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {selectedPresentation.title}
                  </h2>
                  <p className="text-gray-600">
                    {new Date(selectedPresentation.presentationDate).toLocaleDateString('ko-KR')} · {formatDuration(selectedPresentation.duration)} · {selectedPresentation.location}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPresentation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* 발표 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">발표 정보</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{new Date(selectedPresentation.presentationDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatDuration(selectedPresentation.duration)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedPresentation.audience.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">평가 결과</h3>
                  <div className="space-y-2">
                    {selectedPresentation.score && (
                      <div className="flex items-center text-sm">
                        <StarIcon className="h-4 w-4 mr-2 text-foreground" />
                        <span>{getScoreStars(selectedPresentation.score)}</span>
                      </div>
                    )}
                    {selectedPresentation.feedback && (
                      <div className="bg-green-500/10 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <strong>피드백:</strong> {selectedPresentation.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 슬라이드 미리보기 */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">📊 슬라이드 구성</h3>
                <div className="space-y-3">
                  {selectedPresentation.slides
                    .sort((a, b) => a.order - b.order)
                    .map((slide, index) => (
                    <div key={slide.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {index + 1}. {slide.title}
                        </h4>
                        <span className="text-xs text-gray-500 capitalize bg-gray-200 px-2 py-1 rounded">
                          {slide.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {slide.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 발표 노트 */}
              {selectedPresentation.notes && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">📝 발표 노트</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">{selectedPresentation.notes}</p>
                  </div>
                </div>
              )}

              {/* 태그 */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">🏷️ 태그</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPresentation.tags.map((tag, index) => (
                    <span key={index} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {/* 발표 시작 */}}
                  className="btn-success px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>발표 시작</span>
                </button>
                <button
                  onClick={() => {/* 다운로드 */}}
                  className="btn-primary px-4 py-2 rounded-full flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>다운로드</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationManager;