'use client';

import React from 'react';
import { PageContainer } from '../../src/components/common/PageContainer';
import { PageHeader } from '../../src/components/common/PageHeader';
import {
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  TrophyIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  ChartBarIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  color: string;
  stats?: {
    label: string;
    value: string | number;
  };
}

const StudentDashboard: React.FC = () => {
  const dashboardCards: DashboardCard[] = [
    {
      title: '내 과정',
      description: '수강 중인 과정 및 일정 확인',
      icon: AcademicCapIcon,
      route: '/schedule-management',
      color: 'blue'
    },
    {
      title: '시험 응시',
      description: '예정된 시험 확인 및 응시',
      icon: ClipboardDocumentCheckIcon,
      route: '/exams',
      color: 'purple',
      stats: {
        label: '대기 중인 시험',
        value: 0
      }
    },
    {
      title: '실습 평가',
      description: '실습 과제 및 평가 결과 확인',
      icon: BeakerIcon,
      route: '/practice',
      color: 'green',
      stats: {
        label: '평가 대기',
        value: 0
      }
    },
    {
      title: '내 성적',
      description: '시험 및 실습 종합 성적 조회',
      icon: TrophyIcon,
      route: '/comprehensive-grades',
      color: 'yellow'
    },
    {
      title: '활동 일지',
      description: 'BS 활동 일지 작성 및 관리',
      icon: PencilSquareIcon,
      route: '/activity-journal',
      color: 'pink'
    },
    {
      title: '통합 캘린더',
      description: '나의 학습 일정 확인',
      icon: CalendarDaysIcon,
      route: '/schedule-management',
      color: 'indigo'
    },
    {
      title: '학습 자료',
      description: '교육 자료 다운로드',
      icon: BookOpenIcon,
      route: '/materials-library',
      color: 'orange'
    },
    {
      title: '학습 통계',
      description: '출석률 및 학습 진행 현황',
      icon: ChartBarIcon,
      route: '/analytics',
      color: 'teal'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
      },
      pink: {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        border: 'border-pink-200 dark:border-pink-800',
        icon: 'text-pink-600 dark:text-pink-400',
        hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-800',
        icon: 'text-indigo-600 dark:text-indigo-400',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        icon: 'text-orange-600 dark:text-orange-400',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30'
      },
      teal: {
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        border: 'border-teal-200 dark:border-teal-800',
        icon: 'text-teal-600 dark:text-teal-400',
        hover: 'hover:bg-teal-100 dark:hover:bg-teal-900/30'
      }
    };

    return colorMap[color] || colorMap.blue;
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="나의 학습"
          description="학습 진행 현황 및 과제를 확인하세요"
          badge="Student Dashboard"
        />

        {/* 환영 메시지 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">학습을 시작해보세요!</h2>
          <p className="text-blue-100">
            오늘도 한 걸음 더 성장하는 하루가 되길 바랍니다.
          </p>
        </div>

        {/* 대시보드 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            const colors = getColorClasses(card.color);

            return (
              <Link
                key={card.title}
                href={card.route}
                className={`${colors.bg} ${colors.border} ${colors.hover} border rounded-lg p-6 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  {card.stats && (
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${colors.icon}`}>
                        {card.stats.value}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {card.stats.label}
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* 최근 활동 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            최근 활동
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            최근 활동 내역이 없습니다.
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default StudentDashboard;
