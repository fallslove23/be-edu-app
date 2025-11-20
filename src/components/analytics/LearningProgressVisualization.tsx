import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface ProgressData {
  courseId: string;
  courseName: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  averageScore: number;
  lastActivity: string;
  status: 'active' | 'completed' | 'behind';
}

interface LearningProgressVisualizationProps {
  userId?: string;
  viewMode: 'individual' | 'overview';
}

const LearningProgressVisualization: React.FC<LearningProgressVisualizationProps> = ({
  userId,
  viewMode = 'individual'
}) => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // Mock data - 실제로는 API에서 가져올 것
  useEffect(() => {
    const mockData: ProgressData[] = [
      {
        courseId: '1',
        courseName: 'BS 영업 기초과정',
        progress: 75,
        totalLessons: 20,
        completedLessons: 15,
        averageScore: 85,
        lastActivity: '2024-08-10',
        status: 'active'
      },
      {
        courseId: '2',
        courseName: 'BS 고급 영업 전략',
        progress: 100,
        totalLessons: 15,
        completedLessons: 15,
        averageScore: 92,
        lastActivity: '2024-08-05',
        status: 'completed'
      },
      {
        courseId: '3',
        courseName: 'BS 고객 관리 시스템',
        progress: 40,
        totalLessons: 12,
        completedLessons: 5,
        averageScore: 78,
        lastActivity: '2024-07-28',
        status: 'behind'
      },
      {
        courseId: '4',
        courseName: '디지털 마케팅 기초',
        progress: 60,
        totalLessons: 18,
        completedLessons: 11,
        averageScore: 88,
        lastActivity: '2024-08-09',
        status: 'active'
      }
    ];

    setTimeout(() => {
      setProgressData(mockData);
      setLoading(false);
    }, 1000);
  }, [userId, selectedPeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-500/10 border-green-200';
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'behind':
        return 'text-destructive bg-destructive/10 border-destructive/50';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'behind':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'active':
        return '진행중';
      case 'behind':
        return '지연';
      default:
        return '알 수 없음';
    }
  };

  const calculateOverallProgress = () => {
    if (progressData.length === 0) return 0;
    const total = progressData.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(total / progressData.length);
  };

  const calculateAverageScore = () => {
    if (progressData.length === 0) return 0;
    const total = progressData.reduce((sum, course) => sum + course.averageScore, 0);
    return Math.round(total / progressData.length);
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 전체 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            {viewMode === 'individual' ? '내 학습 현황' : '전체 학습 현황'}
          </h3>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['week', 'month', 'quarter'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedPeriod === period
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period === 'week' ? '주간' : period === 'month' ? '월간' : '분기'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">등록 과정</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{progressData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">전체 진도</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{calculateOverallProgress()}%</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-foreground dark:text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">평균 점수</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{calculateAverageScore()}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">완료 과정</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {progressData.filter(course => course.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 과정별 상세 진도 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">과정별 학습 진도</h4>
        
        <div className="space-y-4">
          {progressData.map((course) => (
            <div key={course.courseId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">{course.courseName}</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {course.completedLessons}/{course.totalLessons} 강의 완료 | 
                    평균 점수: {course.averageScore}점 | 
                    최근 활동: {new Date(course.lastActivity).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(course.status)}`}>
                  {getStatusIcon(course.status)}
                  <span>{getStatusLabel(course.status)}</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">진도율</span>
                  <span className="font-medium text-gray-900 dark:text-white">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(course.progress)}`}
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* 간단한 성과 그래프 (막대형) */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span>성과 분석</span>
                  <span>점수별 분포</span>
                </div>
                <div className="flex space-x-1">
                  {/* Mock 점수 분포 데이터 */}
                  {[85, 90, 88, 92, 87, 94, 86].map((score, index) => (
                    <div
                      key={index}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-sm"
                      style={{ height: `${Math.max((score / 100) * 30, 8)}px` }}
                      title={`${index + 1}주차: ${score}점`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 학습 패턴 분석 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">학습 패턴 분석</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 주간 활동 패턴 */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">주간 학습 활동</h5>
            <div className="space-y-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
                const activity = [80, 85, 70, 90, 75, 40, 30][index]; // Mock data
                return (
                  <div key={day} className="flex items-center">
                    <span className="w-6 text-xs text-gray-600 dark:text-gray-400">{day}</span>
                    <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-lg h-2">
                      <div
                        className="h-2 bg-blue-500 rounded-lg transition-all duration-500"
                        style={{ width: `${activity}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-xs text-gray-600 dark:text-gray-400">{activity}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 시간대별 학습 패턴 */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">선호 학습 시간</h5>
            <div className="space-y-2">
              {[
                { time: '09:00-12:00', activity: 85, label: '오전' },
                { time: '13:00-17:00', activity: 95, label: '오후' },
                { time: '18:00-21:00', activity: 60, label: '저녁' },
                { time: '21:00-24:00', activity: 25, label: '밤' }
              ].map((timeSlot) => (
                <div key={timeSlot.time} className="flex items-center">
                  <span className="w-16 text-xs text-gray-600 dark:text-gray-400">{timeSlot.label}</span>
                  <div className="flex-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-lg h-2">
                    <div
                      className="h-2 bg-green-500 rounded-lg transition-all duration-500"
                      style={{ width: `${timeSlot.activity}%` }}
                    ></div>
                  </div>
                  <span className="w-12 text-xs text-gray-600 dark:text-gray-400">{timeSlot.activity}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 학습 권장사항 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">💡 학습 권장사항</h5>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 오후 시간대(13:00-17:00)의 높은 집중도를 활용하세요</li>
            <li>• 지연된 과정에 우선순위를 두고 학습 계획을 세우세요</li>
            <li>• 주말 학습 시간을 늘려 전반적인 진도를 개선하세요</li>
            <li>• 평균 점수가 80점 이하인 과정은 복습이 필요합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LearningProgressVisualization;