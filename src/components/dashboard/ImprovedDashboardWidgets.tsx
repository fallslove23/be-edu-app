'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Calendar,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  trend?: 'up' | 'down';
  loading?: boolean;
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    icon: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-500/10',
    icon: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    icon: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    icon: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    icon: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    icon: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  },
};

// 개선된 통계 카드
export const ImprovedStatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  color,
  trend,
  loading = false,
}) => {
  const colors = colorMap[color];
  const isPositive = trend === 'up' || (change && change > 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>

          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded-md"></div>
          ) : (
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {change !== undefined && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isPositive
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(change)}%
                </div>
              )}
            </div>
          )}

          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>

        {trend && (
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Progress bar (optional) */}
      {typeof value === 'string' && value.includes('%') && (
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.icon} rounded-full transition-all duration-500`}
              style={{ width: value }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

// 빠른 작업 버튼
export const QuickActionCard: React.FC<QuickActionProps> = ({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left group"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </button>
  );
};

// 활동 피드 아이템
export const ActivityFeedItem: React.FC<ActivityItemProps> = ({
  title,
  description,
  time,
  icon: Icon,
  color,
}) => {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
    </div>
  );
};

// 차트 컨테이너
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  actions,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
};

// 미니 통계 카드 (작은 버전)
interface MiniStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  trend,
}) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-md ${color} bg-opacity-10`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium ${
              trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

// 진행률 카드
interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  color: string;
  subtitle?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  color,
  subtitle,
}) => {
  const percentage = (current / total) * 100;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <span className="text-sm font-medium text-muted-foreground">
          {current}/{total}
        </span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{subtitle}</span>
        <span className={`text-sm font-semibold ${color.replace('bg-', 'text-')}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// 업데이트된 차트 테마
export const chartTheme = {
  backgroundColor: [
    'rgba(59, 130, 246, 0.8)',   // blue
    'rgba(16, 185, 129, 0.8)',   // green
    'rgba(139, 92, 246, 0.8)',   // purple
    'rgba(251, 146, 60, 0.8)',   // orange
    'rgba(239, 68, 68, 0.8)',    // red
    'rgba(99, 102, 241, 0.8)',   // indigo
  ],
  borderColor: [
    'rgb(59, 130, 246)',
    'rgb(16, 185, 129)',
    'rgb(139, 92, 246)',
    'rgb(251, 146, 60)',
    'rgb(239, 68, 68)',
    'rgb(99, 102, 241)',
  ],
  gradientStart: 'rgba(59, 130, 246, 0.4)',
  gradientEnd: 'rgba(59, 130, 246, 0.01)',
};

export const getChartOptions = (isDark: boolean) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        padding: 15,
        font: {
          size: 12,
        },
        color: isDark ? '#94a3b8' : '#64748b',
      },
    },
    tooltip: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      titleColor: isDark ? '#f1f5f9' : '#1e293b',
      bodyColor: isDark ? '#cbd5e1' : '#64748b',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: isDark ? '#334155' : '#f1f5f9',
        drawBorder: false,
      },
      ticks: {
        color: isDark ? '#94a3b8' : '#64748b',
        font: {
          size: 11,
        },
      },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: isDark ? '#94a3b8' : '#64748b',
        font: {
          size: 11,
        },
      },
    },
  },
});
