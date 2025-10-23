import React, { useState, useEffect } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  subtitle: string;
}

interface ChartData {
  month: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const [stats] = useState<StatCard[]>([
    {
      label: '전체 교육생',
      value: '156',
      change: '+12.5%',
      trend: 'up',
      subtitle: '이번 달 신규 등록 증가'
    },
    {
      label: '진행 중인 과정',
      value: '8',
      change: '+2',
      trend: 'up',
      subtitle: '활발한 교육 운영'
    },
    {
      label: '평균 출석률',
      value: '94.5%',
      change: '+3.2%',
      trend: 'up',
      subtitle: '높은 참여도 유지'
    },
    {
      label: '완료율',
      value: '87%',
      change: '+5.1%',
      trend: 'up',
      subtitle: '목표 달성률 상승'
    }
  ]);

  const [chartData] = useState<ChartData[]>([
    { month: '1월 1일', value: 30 },
    { month: '1월 3일', value: 45 },
    { month: '1월 5일', value: 35 },
    { month: '1월 7일', value: 50 },
    { month: '1월 9일', value: 40 },
    { month: '1월 11일', value: 55 },
    { month: '1월 13일', value: 48 },
    { month: '1월 15일', value: 62 },
    { month: '1월 17일', value: 58 },
    { month: '1월 19일', value: 70 },
    { month: '1월 21일', value: 65 },
    { month: '1월 23일', value: 78 },
    { month: '1월 25일', value: 72 },
    { month: '1월 27일', value: 80 },
    { month: '1월 30일', value: 75 }
  ]);

  const [activeTab, setActiveTab] = useState('3months');

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-card-foreground">{stat.value}</h3>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                stat.trend === 'up'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{stat.change}</span>
              </div>
            </div>

            {/* 서브타이틀 */}
            <div className="flex items-start space-x-2">
              {stat.trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 섹션 */}
      <div className="bg-card rounded-xl border border-border p-6">
        {/* 차트 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground mb-1">교육 활동</h2>
            <p className="text-sm text-muted-foreground">지난 3개월 교육 참여 현황</p>
          </div>

          {/* 탭 버튼 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('3months')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === '3months'
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              최근 3개월
            </button>
            <button
              onClick={() => setActiveTab('30days')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === '30days'
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              최근 30일
            </button>
            <button
              onClick={() => setActiveTab('7days')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === '7days'
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              최근 7일
            </button>
          </div>
        </div>

        {/* 차트 */}
        <div className="relative h-64">
          {/* Y축 그리드 라인 */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-border/30" />
            ))}
          </div>

          {/* 차트 영역 */}
          <div className="relative h-full flex items-end justify-between px-4 space-x-2">
            {chartData.map((data, index) => {
              const heightPercentage = (data.value / maxValue) * 100;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >
                  {/* 툴팁 */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap transition-opacity z-10">
                    {data.value} 방문
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                  </div>

                  {/* 바 */}
                  <div
                    className="w-full rounded-t-sm transition-all duration-300 cursor-pointer"
                    style={{
                      height: `${heightPercentage}%`,
                      background: 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.6))'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X축 라벨 */}
          <div className="flex items-center justify-between px-4 mt-4">
            {chartData.filter((_, i) => i % 2 === 0).map((data, index) => (
              <span key={index} className="text-xs text-muted-foreground">
                {data.month}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 테이블 섹션 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="border-b border-border">
          <div className="flex items-center space-x-4 px-6 py-4">
            <button className="text-sm font-medium text-card-foreground pb-2 border-b-2 border-primary">
              개요
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground pb-2">
              과거 성과
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">3</span>
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground pb-2">
              주요 인원
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">2</span>
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground pb-2">
              집중 문서
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  과정명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  과정 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  교육생 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  진행률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  담당 강사
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { name: 'BS Basic 1기', type: 'BS Basic', target: '28', limit: '85%', reviewer: '김민수' },
                { name: 'BS Advanced 3기', type: 'BS Advanced', target: '24', limit: '92%', reviewer: '김민수' },
                { name: 'BS Basic 2기', type: 'BS Basic', target: '30', limit: '78%', reviewer: '이영희' },
                { name: '영업 전략 심화', type: '심화 과정', target: '18', limit: '95%', reviewer: '박지훈' },
                { name: 'BS 실전 훈련', type: '실습', target: '22', limit: '88%', reviewer: '최수진' },
                { name: '고객 응대 기술', type: '기초 과정', target: '26', limit: '91%', reviewer: '정다은' },
                { name: 'BS 리더십', type: '리더십', target: '15', limit: '86%', reviewer: '강태영' }
              ].map((row, index) => (
                <tr key={index} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button className="text-muted-foreground hover:text-foreground">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </button>
                        <input type="checkbox" className="w-4 h-4 rounded border-border" />
                      </div>
                      <span className="text-sm text-card-foreground">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {row.target}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {row.limit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                    {row.reviewer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
