import React, { useState, useEffect } from 'react';
import {
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  TrophyIcon,
  UserIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import type { ScoreCategory, StudentScore } from '../../types/student.types';
import ScoreDataManager from './ScoreDataManager';

interface StudentScoringProps {
  studentId?: string;
  onBack?: () => void;
}

const StudentScoring: React.FC<StudentScoringProps> = ({ studentId, onBack }) => {
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [scoreCategories, setScoreCategories] = useState<ScoreCategory[]>([]);
  const [selectedScore, setSelectedScore] = useState<StudentScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCategoryConfig, setShowCategoryConfig] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    courseId: 'all',
    round: 'all',
    passFail: 'all'
  });

  useEffect(() => {
    const generateSampleData = () => {
      const categories: ScoreCategory[] = [
        {
          id: 'theory',
          name: '이론',
          maxScore: 100,
          weight: 0.3,
          isActive: true,
          description: '이론 시험 점수'
        },
        {
          id: 'practical',
          name: '실기',
          maxScore: 100,
          weight: 0.4,
          isActive: true,
          description: '실습 및 실기 평가 점수'
        },
        {
          id: 'bs_activity',
          name: 'BS 활동',
          maxScore: 100,
          weight: 0.2,
          isActive: true,
          description: 'BS Advanced 과정 활동 일지 점수'
        },
        {
          id: 'attitude',
          name: '태도',
          maxScore: 100,
          weight: 0.1,
          isActive: true,
          description: '수업 태도 및 참여도'
        }
      ];

      const sampleScores: StudentScore[] = [
        {
          id: 'score-1',
          studentId: studentId || 'student-1',
          studentName: '김교육',
          round: 1,
          courseId: 'BS-BASIC',
          courseDisplayName: 'BS 신입 영업사원 기초과정',
          companyId: 'BS-2025-01',
          companyName: 'BS 교육원',
          theoryScore: 85,
          practicalScore: 90,
          bsActivityScore: 0, // BS Basic은 활동일지 없음
          attitudeScore: 95,
          overallScore: 88.5,
          tScore: 85,
          pScore: 90,
          passFail: 'PASS',
          remarks: '우수한 성과를 보이고 있음. 실무 적용 능력 뛰어남.',
          lastUpdated: '2025-01-26T16:30:00Z',
          updatedBy: '김강사'
        },
        {
          id: 'score-2',
          studentId: studentId || 'student-1',
          studentName: '김교육',
          round: 3,
          courseId: 'BS-ADVANCED',
          courseDisplayName: 'BS 고급 영업 전략과정',
          companyId: 'BS-2025-03',
          companyName: 'BS 교육원',
          theoryScore: 0, // 진행중
          practicalScore: 0, // 진행중
          bsActivityScore: 88, // BS Advanced는 활동일지 포함
          attitudeScore: 92,
          overallScore: 0,
          tScore: 0,
          pScore: 0,
          passFail: 'PENDING',
          remarks: '3차 과정 진행중. 활동일지 작성 우수.',
          lastUpdated: '2025-01-26T16:30:00Z',
          updatedBy: '이운영'
        }
      ];

      return { categories, scores: sampleScores };
    };

    setLoading(true);
    setTimeout(() => {
      const { categories, scores } = generateSampleData();
      setScoreCategories(categories);
      setStudentScores(scores);
      setLoading(false);
    }, 500);
  }, [studentId]);

  const calculateOverallScore = (score: StudentScore, categories: ScoreCategory[]): number => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    categories.forEach(category => {
      if (!category.isActive) return;

      let categoryScore = 0;
      switch (category.id) {
        case 'theory':
          categoryScore = score.theoryScore;
          break;
        case 'practical':
          categoryScore = score.practicalScore;
          break;
        case 'bs_activity':
          // BS Basic 과정은 활동일지 점수 제외
          if (score.courseId === 'BS-BASIC') return;
          categoryScore = score.bsActivityScore;
          break;
        case 'attitude':
          categoryScore = score.attitudeScore;
          break;
      }

      if (categoryScore > 0) {
        totalWeightedScore += (categoryScore * category.weight);
        totalWeight += category.weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;
  };

  const handleImportScores = (newScores: StudentScore[]) => {
    setStudentScores(prev => [...newScores, ...prev]);
  };

  const handleExportScores = (): StudentScore[] => {
    return studentScores;
  };

  const getPassFailStatus = (score: StudentScore): 'PASS' | 'FAIL' | 'PENDING' => {
    if (score.overallScore === 0) return 'PENDING';
    return score.overallScore >= 70 ? 'PASS' : 'FAIL';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-100';
      case 'FAIL': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircleIcon className="h-4 w-4" />;
      case 'FAIL': return <XCircleIcon className="h-4 w-4" />;
      case 'PENDING': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredScores = studentScores.filter(score => {
    if (filter.courseId !== 'all' && score.courseId !== filter.courseId) return false;
    if (filter.round !== 'all' && score.round.toString() !== filter.round) return false;
    if (filter.passFail !== 'all' && score.passFail !== filter.passFail) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">점수 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180 mr-2" />
          교육생 프로필로 돌아가기
        </button>
      )}

      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 상세 점수 관리</h1>
            <p className="text-gray-600">
              교육생별 세부 점수 및 평가 이력을 관리하세요.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowDataManager(true)}
              className="flex items-center justify-center space-x-2 border border-gray-300 rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-50 min-h-[44px]"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span className="text-sm sm:text-base">데이터 관리</span>
            </button>
            <button
              onClick={() => setShowCategoryConfig(true)}
              className="flex items-center justify-center space-x-2 border border-gray-300 rounded-lg px-4 py-3 sm:py-2 hover:bg-gray-50 min-h-[44px] hide-on-mobile"
            >
              <Cog6ToothIcon className="h-4 w-4" />
              <span className="text-sm sm:text-base">점수 항목 설정</span>
            </button>
            <button
              onClick={() => {/* 새 점수 입력 */}}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-sm sm:text-base">점수 입력</span>
            </button>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">과정</label>
            <select
              value={filter.courseId}
              onChange={(e) => setFilter(prev => ({ ...prev, courseId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 과정</option>
              <option value="BS-BASIC">BS 기초과정</option>
              <option value="BS-ADVANCED">BS 고급과정</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">차수</label>
            <select
              value={filter.round}
              onChange={(e) => setFilter(prev => ({ ...prev, round: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체 차수</option>
              <option value="1">1차</option>
              <option value="2">2차</option>
              <option value="3">3차</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">합격 여부</label>
            <select
              value={filter.passFail}
              onChange={(e) => setFilter(prev => ({ ...prev, passFail: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">전체</option>
              <option value="PASS">합격</option>
              <option value="FAIL">불합격</option>
              <option value="PENDING">진행중</option>
            </select>
          </div>
        </div>
      </div>

      {/* 점수 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            점수 이력 ({filteredScores.length})
          </h3>
        </div>

        <div className="overflow-x-auto table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  차수/과정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>이론</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <TrophyIcon className="h-4 w-4" />
                    <span>실기</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>BS 활동</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="h-4 w-4" />
                    <span>태도</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  종합점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  합격여부
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScores.map((score) => (
                <tr key={score.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {score.round}차 - {score.companyId}
                      </div>
                      <div className="text-sm text-gray-500">{score.courseDisplayName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {score.theoryScore > 0 ? `${score.theoryScore}점` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">T Score: {score.tScore}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {score.practicalScore > 0 ? `${score.practicalScore}점` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">P Score: {score.pScore}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {score.courseId === 'BS-ADVANCED' 
                        ? (score.bsActivityScore > 0 ? `${score.bsActivityScore}점` : '-')
                        : 'N/A'
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      {score.courseId === 'BS-ADVANCED' ? 'Advanced만' : 'Basic 제외'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {score.attitudeScore > 0 ? `${score.attitudeScore}점` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {score.overallScore > 0 ? `${score.overallScore}점` : '진행중'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(score.passFail)}`}>
                      {getStatusIcon(score.passFail)}
                      <span>
                        {score.passFail === 'PASS' ? '합격' : 
                         score.passFail === 'FAIL' ? '불합격' : '진행중'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedScore(score)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="상세보기"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedScore(score);
                        setIsEditing(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="편집"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredScores.length === 0 && (
          <div className="p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">점수 기록이 없습니다</h3>
            <p className="text-gray-600 mb-4">
              아직 입력된 점수가 없습니다. 새로운 점수를 입력해보세요.
            </p>
            <button
              onClick={() => {/* 새 점수 입력 */}}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              첫 점수 입력하기
            </button>
          </div>
        )}
      </div>

      {/* 상세 점수 모달 */}
      {selectedScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? '점수 편집' : '점수 상세'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedScore(null);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">교육생</label>
                  <div className="text-sm text-gray-900">{selectedScore.studentName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">과정</label>
                  <div className="text-sm text-gray-900">{selectedScore.courseDisplayName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">차수</label>
                  <div className="text-sm text-gray-900">{selectedScore.round}차 ({selectedScore.companyId})</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">최종 업데이트</label>
                  <div className="text-sm text-gray-900">{formatDate(selectedScore.lastUpdated)}</div>
                </div>
              </div>

              {/* 점수 입력 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이론 점수</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={selectedScore.theoryScore}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{selectedScore.theoryScore}점</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">실기 점수</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={selectedScore.practicalScore}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{selectedScore.practicalScore}점</div>
                  )}
                </div>
                {selectedScore.courseId === 'BS-ADVANCED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BS 활동 점수</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={selectedScore.bsActivityScore}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{selectedScore.bsActivityScore}점</div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">태도 점수</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={selectedScore.attitudeScore}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">{selectedScore.attitudeScore}점</div>
                  )}
                </div>
              </div>

              {/* 비고 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비고</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    defaultValue={selectedScore.remarks}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="특이사항이나 추가 의견을 입력하세요..."
                  />
                ) : (
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedScore.remarks || '비고 없음'}
                  </div>
                )}
              </div>

              {/* 계산된 정보 */}
              {!isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">계산된 점수</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">종합 점수:</span>
                      <div className="font-medium text-blue-900">{selectedScore.overallScore}점</div>
                    </div>
                    <div>
                      <span className="text-blue-700">T Score:</span>
                      <div className="font-medium text-blue-900">{selectedScore.tScore}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">P Score:</span>
                      <div className="font-medium text-blue-900">{selectedScore.pScore}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedScore(null);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {isEditing ? '취소' : '닫기'}
              </button>
              {isEditing && (
                <button
                  onClick={() => {
                    // 저장 로직
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 점수 항목 설정 모달 */}
      {showCategoryConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">점수 항목 설정</h3>
                <button
                  onClick={() => setShowCategoryConfig(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-gray-600">점수 항목을 추가하거나 삭제할 수 있습니다.</p>
                <button
                  onClick={() => {/* 새 항목 추가 */}}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>항목 추가</span>
                </button>
              </div>

              <div className="space-y-4">
                {scoreCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">항목명</label>
                          <input
                            type="text"
                            defaultValue={category.name}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">최대점수</label>
                          <input
                            type="number"
                            defaultValue={category.maxScore}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">가중치</label>
                          <input
                            type="number"
                            step="0.1"
                            defaultValue={category.weight}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">활성화</label>
                          <div className="flex items-center pt-2">
                            <input
                              type="checkbox"
                              defaultChecked={category.isActive}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">사용</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => {/* 항목 삭제 */}}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {category.description && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                        <input
                          type="text"
                          defaultValue={category.description}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="항목 설명을 입력하세요..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCategoryConfig(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // 설정 저장 로직
                  setShowCategoryConfig(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 관리 모달 */}
      {showDataManager && (
        <ScoreDataManager
          onImport={handleImportScores}
          onExport={handleExportScores}
          onClose={() => setShowDataManager(false)}
        />
      )}
    </div>
  );
};

export default StudentScoring;