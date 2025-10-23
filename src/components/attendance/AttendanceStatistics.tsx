import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CourseService } from '../../services/course.services';
import type { Course } from '../../services/course.services';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AttendanceStatisticsProps {
  selectedCourse: Course | null;
}

interface AttendanceStats {
  totalSchedules: number;
  completedSchedules: number;
  totalAttendees: number;
  averageAttendanceRate: number;
  punctualityRate: number;
  monthlyStats: {
    date: string;
    attendanceRate: number;
    totalTrainees: number;
    presentCount: number;
  }[];
}

const AttendanceStatistics: React.FC<AttendanceStatisticsProps> = ({
  selectedCourse
}) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 통계 데이터 로드
  useEffect(() => {
    loadStatistics();
  }, [selectedCourse]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // 임시 목업 데이터
      const mockStats: AttendanceStats = {
        totalSchedules: 12,
        completedSchedules: 8,
        totalAttendees: 15,
        averageAttendanceRate: 92.5,
        punctualityRate: 87.3,
        monthlyStats: [
          { date: '2024-08-15', attendanceRate: 95.0, totalTrainees: 15, presentCount: 14 },
          { date: '2024-08-16', attendanceRate: 90.0, totalTrainees: 15, presentCount: 13 },
          { date: '2024-08-17', attendanceRate: 88.0, totalTrainees: 15, presentCount: 13 },
          { date: '2024-08-18', attendanceRate: 93.0, totalTrainees: 15, presentCount: 14 },
          { date: '2024-08-19', attendanceRate: 95.0, totalTrainees: 15, presentCount: 14 },
          { date: '2024-08-22', attendanceRate: 87.0, totalTrainees: 15, presentCount: 13 },
          { date: '2024-08-23', attendanceRate: 92.0, totalTrainees: 15, presentCount: 14 },
          { date: '2024-08-24', attendanceRate: 90.0, totalTrainees: 15, presentCount: 13 }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load attendance statistics:', error);
      setError('출석 통계를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 출석률 색상 클래스
  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 bg-green-100';
    if (rate >= 90) return 'text-blue-600 bg-blue-100';
    if (rate >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">통계를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <div className="text-center py-8 text-destructive">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-destructive/50" />
            <p>{error}</p>
            <button
              onClick={loadStatistics}
              className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>
              {selectedCourse
                ? '출석 통계 데이터가 없습니다.'
                : '과정을 선택하여 출석 통계를 확인하세요.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-card-foreground flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          출석 통계
        </h2>
        {selectedCourse && (
          <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.name}</p>
        )}
      </div>

      <div className="p-6">
        {/* 주요 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-card-foreground">{stats.totalSchedules}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center mt-1">
              <CalendarDaysIcon className="h-4 w-4 mr-1" />
              총 일정
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.completedSchedules}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center mt-1">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              완료된 일정
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.totalAttendees}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center mt-1">
              <UserGroupIcon className="h-4 w-4 mr-1" />
              총 수강생
            </div>
          </div>


          <div className="text-center p-4 bg-muted rounded-lg">
            <div className={`text-2xl font-bold ${getAttendanceRateColor(stats.averageAttendanceRate).split(' ')[0]}`}>
              {stats.averageAttendanceRate}%
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center mt-1">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              평균 출석률
            </div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg">
            <div className={`text-2xl font-bold ${getAttendanceRateColor(stats.punctualityRate).split(' ')[0]}`}>
              {stats.punctualityRate}%
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center mt-1">
              <ClockIcon className="h-4 w-4 mr-1" />
              정시 출석률
            </div>
          </div>
        </div>

        {/* 월별 출석률 차트 */}
        <div>
          <h3 className="text-lg font-bold text-card-foreground mb-4">일별 출석률</h3>
          <div className="space-y-3">
            {stats.monthlyStats.map((stat, index) => (
              <div key={stat.date} className="flex items-center space-x-4">
                <div className="w-20 text-sm text-muted-foreground">
                  {format(parseISO(stat.date), 'MM/dd (E)', { locale: ko })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-card-foreground">
                      출석률: {stat.attendanceRate}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.presentCount}/{stat.totalTrainees}명
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        stat.attendanceRate >= 95 ? 'bg-green-500' :
                        stat.attendanceRate >= 90 ? 'bg-primary' :
                        stat.attendanceRate >= 85 ? 'bg-yellow-500' : 'bg-destructive'
                      }`}
                      style={{ width: `${stat.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 출석률 범례 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">출석률 범례</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>우수 (95% 이상)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>양호 (90-94%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span>보통 (85-89%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>주의 (85% 미만)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStatistics;