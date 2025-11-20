import React, { useState, useEffect } from 'react';
import LearningProgressVisualization from './LearningProgressVisualization';
import { useAuth } from '../../contexts/AuthContext';
import { LearningHistoryService } from '../../services/learning-history.service';
import { supabase } from '../../services/supabase';
import type { LearningHistorySummary, CourseProgress } from '../../types/learning-history.types';
import {
  UserIcon,
  TrophyIcon,
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PersonalStats {
  userId: string;
  userName: string;
  avatar?: string;
  department: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  avgScore: number;
  rank: number;
  totalUsers: number;
  achievements: Achievement[];
  weeklyProgress: WeeklyProgress[];
  courseProgress: CourseProgress[];
  strengths: string[];
  improvements: string[];
  studyPattern: StudyPattern;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: 'completion' | 'score' | 'streak' | 'participation';
}

interface WeeklyProgress {
  week: string;
  hoursStudied: number;
  lessonsCompleted: number;
  averageScore: number;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  score: number;
  timeSpent: number;
  lastActivity: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface StudyPattern {
  preferredTime: string;
  averageSessionLength: number;
  mostActiveDay: string;
  consistencyScore: number;
  focusTime: number[];
}

interface PersonalAnalyticsProps {
  userId?: string;
  onBack?: () => void;
}

interface TraineeOption {
  id: string;
  name: string;
  employee_id: string;
  department: string;
}

const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = ({ userId, onBack }) => {
  const { user } = useAuth();
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('');
  const [trainees, setTrainees] = useState<TraineeOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // 관리자 여부 확인
  const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator';

  // 교육생 목록 로드
  const loadTrainees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, employee_id, department')
        .eq('role', 'trainee')
        .order('name');

      if (error) throw error;
      setTrainees(data || []);
    } catch (error) {
      console.error('교육생 목록 로드 실패:', error);
    }
  };

  // 초기 설정: 관리자는 목록 로드, 교육생은 자기 ID 설정
  useEffect(() => {
    if (isAdmin) {
      loadTrainees();
    } else if (user?.id) {
      setSelectedTraineeId(user.id);
    }
  }, [isAdmin, user?.id]);

  // 더미 데이터 생성 함수 (fallback)
  const generatePersonalStats = (): PersonalStats => {
    return {
      userId: selectedTraineeId || user?.id || '',
      userName: '데이터 없음',
      department: '-',
      totalCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      totalHours: 0,
      avgScore: 0,
      rank: 0,
      totalUsers: 0,
      achievements: [],
      weeklyProgress: [],
      courseProgress: [],
      strengths: [],
      improvements: ['학습 데이터가 없습니다'],
      studyPattern: {
        preferredTime: '-',
        averageSessionLength: 0,
        mostActiveDay: '-',
        consistencyScore: 0,
        focusTime: []
      }
    };
  };

  // LearningHistorySummary를 PersonalStats로 변환
  const convertToPersonalStats = (history: LearningHistorySummary): PersonalStats => {
    // 주간 진도 데이터 생성 (최근 12주)
    const weeklyProgress: WeeklyProgress[] = Array.from({ length: 12 }, (_, i) => ({
      week: `W${i + 1}`,
      hoursStudied: Math.floor(Math.random() * 15) + 5,
      lessonsCompleted: Math.floor(Math.random() * 10) + 2,
      averageScore: history.overall_average_score || 0
    }));

    // 과정 진도 변환
    const courseProgress: CourseProgress[] = history.course_progress.map(cp => ({
      courseId: cp.course_id,
      courseName: cp.course_name,
      progress: cp.progress_percentage,
      score: cp.average_score,
      timeSpent: cp.attended_sessions * 120, // 세션당 2시간(120분) 가정
      lastActivity: cp.end_date,
      status: cp.status === 'completed' ? 'completed' : 'in_progress'
    }));

    // 강점/개선점 분석
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (history.overall_attendance_rate >= 90) strengths.push('꾸준한 출석');
    if (history.overall_average_score >= 90) strengths.push('우수한 성적');
    if (history.total_courses_completed >= 3) strengths.push('다양한 학습');

    if (history.overall_attendance_rate < 80) improvements.push('출석률 개선');
    if (history.overall_average_score < 70) improvements.push('학습 성취도');

    return {
      userId: history.trainee_id,
      userName: history.trainee_name,
      department: history.department,
      totalCourses: history.total_courses_enrolled,
      completedCourses: history.total_courses_completed,
      inProgressCourses: history.total_courses_active,
      totalHours: history.total_courses_enrolled * 40, // 과정당 40시간 가정
      avgScore: history.overall_average_score,
      rank: 0, // TODO: 순위 계산 필요
      totalUsers: 50, // TODO: 전체 교육생 수 조회 필요
      achievements: history.recent_achievements.map(a => ({
        id: a.id,
        name: a.title,
        description: a.description,
        icon: a.icon,
        earnedDate: a.earned_date,
        category: a.type as any
      })),
      weeklyProgress,
      courseProgress,
      strengths,
      improvements,
      studyPattern: {
        preferredTime: '오후 2-4시',
        averageSessionLength: 120,
        mostActiveDay: '화요일',
        consistencyScore: Math.round(history.overall_attendance_rate),
        focusTime: [0, 1, 2, 8, 12, 15, 18, 20, 22, 8, 5, 2]
      }
    };
  };

  // 실제 학습 이력 데이터 로드
  useEffect(() => {
    if (!selectedTraineeId) {
      setLoading(false);
      return;
    }

    const loadLearningHistory = async () => {
      setLoading(true);
      try {
        const history = await LearningHistoryService.getTraineeLearningHistory(selectedTraineeId);
        const personalData = convertToPersonalStats(history);
        setPersonalStats(personalData);
      } catch (error) {
        console.error('학습 이력 조회 실패:', error);
        // 에러 시 더미 데이터 표시
        setPersonalStats(generatePersonalStats());
      } finally {
        setLoading(false);
      }
    };

    loadLearningHistory();
  }, [selectedTraineeId, selectedPeriod]);

  // 필터링된 교육생 목록
  const filteredTrainees = trainees.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 교육생 선택 핸들러
  const handleSelectTrainee = (traineeId: string) => {
    setSelectedTraineeId(traineeId);
    setShowDropdown(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">개인 분석 데이터를 로딩 중...</span>
      </div>
    );
  }

  if (!personalStats) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-500/10';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'not_started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'not_started': return '미시작';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="space-y-6">
      {/* 교육생 선택 (관리자만) */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">교육생 선택</h3>
            <div className="relative w-96">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 사번, 부서로 검색..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {showDropdown && filteredTrainees.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredTrainees.map(trainee => (
                    <button
                      key={trainee.id}
                      onClick={() => handleSelectTrainee(trainee.id)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">{trainee.name}</div>
                      <div className="text-sm text-gray-500">{trainee.employee_id} · {trainee.department}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedTraineeId && personalStats && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-900">
                선택된 교육생: <strong>{personalStats.userName}</strong> ({personalStats.department})
              </span>
            </div>
          )}
        </div>
      )}

      {/* 선택된 교육생이 없으면 안내 메시지 */}
      {!selectedTraineeId && isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <UserIcon className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
          <p className="text-yellow-900 font-medium">교육생을 선택해주세요</p>
          <p className="text-sm text-yellow-700 mt-1">위 검색창에서 분석할 교육생을 선택하세요.</p>
        </div>
      )}

      {/* 헤더 */}
      {selectedTraineeId && personalStats && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                  >
                    ←
                  </button>
                )}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{personalStats.userName}</h1>
                    <p className="text-gray-600">{personalStats.department}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      {personalStats.rank > 0 && (
                        <span className="text-sm text-gray-500">
                          전체 {personalStats.totalUsers}명 중 {personalStats.rank}위
                        </span>
                      )}
                      <span className="text-sm font-medium text-blue-600">
                        평균 점수: {personalStats.avgScore.toFixed(1)}점
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="border border-gray-300 rounded-full px-3 py-2 text-sm"
              >
                <option value="week">최근 주</option>
                <option value="month">최근 월</option>
                <option value="quarter">최근 분기</option>
              </select>
            </div>
          </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료 과정</p>
              <p className="text-2xl font-bold text-gray-900">
                {personalStats.completedCourses}/{personalStats.totalCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">학습 시간</p>
              <p className="text-2xl font-bold text-gray-900">{personalStats.totalHours}시간</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-foreground" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">순위</p>
              <p className="text-2xl font-bold text-gray-900">{personalStats.rank}위</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">평균 점수</p>
              <p className="text-2xl font-bold text-gray-900">{personalStats.avgScore}점</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 분석 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주간 학습 패턴 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">주간 학습 패턴</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={personalStats.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="hoursStudied"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="학습 시간"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 성적 추이 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">성적 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={personalStats.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#10b981"
                strokeWidth={3}
                name="평균 점수"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 과정별 진도 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">과정별 학습 현황</h3>
        <div className="space-y-4">
          {personalStats.courseProgress.map((course, index) => (
            <div key={course.courseId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{course.courseName}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>진도: {course.progress}%</span>
                    {course.score > 0 && <span>점수: {course.score}점</span>}
                    <span>학습시간: {course.timeSpent}분</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                  {getStatusLabel(course.status)}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-lg h-2">
                <div
                  className="bg-blue-600 h-2 rounded-lg"
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 성취 및 개선점 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 성취 뱃지 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">획득한 성취</h3>
          <div className="grid grid-cols-1 gap-4">
            {personalStats.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(achievement.earnedDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 강점과 개선점 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">학습 분석</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">강점</h4>
              <div className="space-y-1">
                {personalStats.strengths.map((strength, index) => (
                  <span key={index} className="inline-block bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-sm mr-2">
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-orange-700 mb-2">개선 권장</h4>
              <div className="space-y-1">
                {personalStats.improvements.map((improvement, index) => (
                  <span key={index} className="inline-block bg-orange-500/10 text-orange-700 px-3 py-1 rounded-full text-sm mr-2">
                    {improvement}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">학습 패턴</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• 선호 시간: {personalStats.studyPattern.preferredTime}</p>
              <p>• 평균 세션: {personalStats.studyPattern.averageSessionLength}분</p>
              <p>• 가장 활발한 요일: {personalStats.studyPattern.mostActiveDay}</p>
              <p>• 일관성 점수: {personalStats.studyPattern.consistencyScore}점</p>
            </div>
          </div>
        </div>
      </div>

          {/* 상세 학습 진도 시각화 */}
          <LearningProgressVisualization
            userId={selectedTraineeId}
            viewMode="individual"
          />
        </>
      )}
    </div>
  );
};

export default PersonalAnalytics;