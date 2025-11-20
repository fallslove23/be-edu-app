import React from 'react';
import { 
  ChartBarIcon, 
  TrophyIcon, 
  ClockIcon, 
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { LearningOverview, CourseProgress } from '../../types/trainee-dashboard.types';

interface LearningProgressWidgetProps {
  learningOverview: LearningOverview;
  currentCourses: CourseProgress[];
}

const LearningProgressWidget: React.FC<LearningProgressWidgetProps> = ({
  learningOverview,
  currentCourses
}) => {
  // 전체 진도율 계산
  const overallProgress = currentCourses.length > 0 
    ? Math.round(currentCourses.reduce((sum, course) => sum + course.progressPercentage, 0) / currentCourses.length)
    : 0;

  // BS Basic/Advanced 과정 구분
  const basicCourses = currentCourses.filter(c => c.isBasicCourse);
  const advancedCourses = currentCourses.filter(c => c.isAdvancedCourse);

  // 성취도 레벨 계산
  const getAchievementLevel = () => {
    if (learningOverview.averageScore >= 90) return { level: 'Excellent', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (learningOverview.averageScore >= 80) return { level: 'Great', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (learningOverview.averageScore >= 70) return { level: 'Good', color: 'text-green-600', bg: 'bg-green-500/10' };
    return { level: 'Needs Improvement', color: 'text-orange-600', bg: 'bg-yellow-100' };
  };

  const achievement = getAchievementLevel();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
          학습 현황
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${achievement.bg} ${achievement.color}`}>
          {achievement.level}
        </div>
      </div>

      {/* 전체 진도율 */}
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray="100, 100"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-600"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={`${overallProgress}, 100`}
              strokeLinecap="round"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{overallProgress}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">전체 진도율</p>
      </div>

      {/* 주요 메트릭스 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-900">
            {learningOverview.activeCourses}
          </div>
          <div className="text-sm text-blue-700">수강 중인 과정</div>
        </div>
        <div className="text-center p-3 bg-green-500/10 rounded-lg">
          <div className="text-lg font-semibold text-green-900">
            {learningOverview.completedCourses}
          </div>
          <div className="text-sm text-green-700">완료한 과정</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-semibold text-purple-900">
            {learningOverview.averageScore}점
          </div>
          <div className="text-sm text-purple-700">평균 점수</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-semibold text-yellow-900">
            {learningOverview.attendanceRate}%
          </div>
          <div className="text-sm text-foreground">출석률</div>
        </div>
      </div>

      {/* BS 과정별 진행상황 */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">과정별 진행상황</h3>
        
        {/* BS Basic */}
        {basicCourses.length > 0 && (
          <div className="border border-green-200 rounded-lg p-4 bg-green-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BookOpenIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">BS Basic</span>
              </div>
              <span className="text-sm font-medium text-green-800">
                {basicCourses[0]?.progressPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-green-200 rounded-lg h-2">
              <div
                className="bg-green-600 h-2 rounded-lg transition-all duration-300"
                style={{ width: `${basicCourses[0]?.progressPercentage || 0}%` }}
              ></div>
            </div>
            {basicCourses[0] && (
              <div className="mt-2 text-sm text-green-700">
                {basicCourses[0].attendedSessions}/{basicCourses[0].totalSessions} 세션 완료
              </div>
            )}
          </div>
        )}

        {/* BS Advanced */}
        {advancedCourses.length > 0 && (
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrophyIcon className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-900">BS Advanced</span>
              </div>
              <span className="text-sm font-medium text-purple-800">
                {advancedCourses[0]?.progressPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-lg h-2">
              <div
                className="bg-purple-600 h-2 rounded-lg transition-all duration-300"
                style={{ width: `${advancedCourses[0]?.progressPercentage || 0}%` }}
              ></div>
            </div>
            {advancedCourses[0] && (
              <div className="mt-2 text-sm text-purple-700">
                {advancedCourses[0].attendedSessions}/{advancedCourses[0].totalSessions} 세션 완료
              </div>
            )}
          </div>
        )}

        {/* 과정이 없는 경우 */}
        {basicCourses.length === 0 && advancedCourses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpenIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>현재 등록된 BS 과정이 없습니다.</p>
          </div>
        )}
      </div>

      {/* BS 활동 현황 */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">BS 활동 현황</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-foreground mr-2" />
            <span className="text-gray-700">제출 현황</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {learningOverview.bsActivitiesSubmitted}/{learningOverview.bsActivitiesRequired}
            </div>
            <div className="text-sm text-gray-500">
              {Math.round((learningOverview.bsActivitiesSubmitted / learningOverview.bsActivitiesRequired) * 100)}% 완료
            </div>
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-lg h-2">
          <div
            className="bg-yellow-500 h-2 rounded-lg transition-all duration-300"
            style={{ 
              width: `${Math.round((learningOverview.bsActivitiesSubmitted / learningOverview.bsActivitiesRequired) * 100)}%` 
            }}
          ></div>
        </div>
      </div>

      {/* 학습 목표 및 권장사항 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          이번 주 목표
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          {learningOverview.attendanceRate < 90 && (
            <li className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2 text-foreground" />
              출석률 향상이 필요합니다 (현재 {learningOverview.attendanceRate}%)
            </li>
          )}
          {learningOverview.bsActivitiesSubmitted < learningOverview.bsActivitiesRequired && (
            <li className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
              BS 활동 {learningOverview.bsActivitiesRequired - learningOverview.bsActivitiesSubmitted}개 제출 필요
            </li>
          )}
          {learningOverview.averageScore < 80 && (
            <li className="flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2 text-purple-500" />
              평균 점수 80점 이상 달성하기
            </li>
          )}
          {learningOverview.attendanceRate >= 90 && 
           learningOverview.bsActivitiesSubmitted >= learningOverview.bsActivitiesRequired &&
           learningOverview.averageScore >= 80 && (
            <li className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
              모든 목표를 달성했습니다! 계속 유지하세요 🎉
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default LearningProgressWidget;