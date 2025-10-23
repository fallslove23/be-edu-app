import React, { useState, useEffect } from 'react';
import LearningProgressVisualization from './LearningProgressVisualization';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserIcon,
  TrophyIcon,
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  StarIcon
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

const PersonalAnalytics: React.FC<PersonalAnalyticsProps> = ({ userId = 'user_1', onBack }) => {
  const { user } = useAuth();
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generatePersonalStats = (): PersonalStats => {
      const achievements: Achievement[] = [
        {
          id: '1',
          name: '첫 번째 완주',
          description: '첫 번째 과정을 완주했습니다',
          icon: '🏁',
          earnedDate: '2024-08-01',
          category: 'completion'
        },
        {
          id: '2',
          name: '우수 성적',
          description: '평균 90점 이상 달성',
          icon: '⭐',
          earnedDate: '2024-08-05',
          category: 'score'
        },
        {
          id: '3',
          name: '꾸준히',
          description: '7일 연속 학습',
          icon: '🔥',
          earnedDate: '2024-08-10',
          category: 'streak'
        }
      ];

      const weeklyProgress: WeeklyProgress[] = Array.from({ length: 12 }, (_, i) => ({
        week: `W${i + 1}`,
        hoursStudied: Math.floor(Math.random() * 15) + 5,
        lessonsCompleted: Math.floor(Math.random() * 10) + 2,
        averageScore: Math.floor(Math.random() * 20) + 75
      }));

      const courseProgress: CourseProgress[] = [
        {
          courseId: 'c1',
          courseName: '신입 영업사원 기초 교육',
          progress: 100,
          score: 95,
          timeSpent: 240,
          lastActivity: '2024-08-10',
          status: 'completed'
        },
        {
          courseId: 'c2',
          courseName: '중급 영업 스킬 향상',
          progress: 75,
          score: 88,
          timeSpent: 180,
          lastActivity: '2024-08-11',
          status: 'in_progress'
        },
        {
          courseId: 'c3',
          courseName: '고객 관계 관리 전문',
          progress: 0,
          score: 0,
          timeSpent: 0,
          lastActivity: '',
          status: 'not_started'
        }
      ];

      return {
        userId,
        userName: '김학습',
        avatar: undefined,
        department: '영업1팀',
        totalCourses: 5,
        completedCourses: 2,
        inProgressCourses: 2,
        totalHours: 56,
        avgScore: 89.5,
        rank: 7,
        totalUsers: 50,
        achievements,
        weeklyProgress,
        courseProgress,
        strengths: ['분석적 사고', '꾸준함', '협업'],
        improvements: ['시간 관리', '집중력'],
        studyPattern: {
          preferredTime: '오후 2-4시',
          averageSessionLength: 45,
          mostActiveDay: '화요일',
          consistencyScore: 85,
          focusTime: [0, 1, 2, 8, 12, 15, 18, 20, 22, 8, 5, 2]
        }
      };
    };

    setLoading(true);
    setTimeout(() => {
      setPersonalStats(generatePersonalStats());
      setLoading(false);
    }, 800);
  }, [userId, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">개인 분석 데이터를 로딩 중...</span>
      </div>
    );
  }

  if (!personalStats) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
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
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
            )}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{personalStats.userName}</h1>
                <p className="text-gray-600">{personalStats.department}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    전체 {personalStats.totalUsers}명 중 {personalStats.rank}위
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    평균 점수: {personalStats.avgScore}점
                  </span>
                </div>
              </div>
            </div>
          </div>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
            <div className="p-2 bg-green-100 rounded-lg">
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
              <TrophyIcon className="h-6 w-6 text-yellow-600" />
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
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
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
                  <span key={index} className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">
                    {strength}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-orange-700 mb-2">개선 권장</h4>
              <div className="space-y-1">
                {personalStats.improvements.map((improvement, index) => (
                  <span key={index} className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm mr-2">
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
        userId={user?.id || userId}
        viewMode="individual"
      />
    </div>
  );
};

export default PersonalAnalytics;