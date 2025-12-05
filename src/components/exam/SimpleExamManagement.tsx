import React, { useState } from 'react';
import { Target, BarChart2, Plus, TrendingUp } from 'lucide-react';

import { PageContainer } from '../common/PageContainer';
import { Badge } from '../common/Badge';

const SimpleExamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'results'>('overview');

  return (
    <div className="min-h-screen bg-[#F2F4F6] p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <div className="p-3 bg-red-50 rounded-xl mr-4">
              <Target className="h-8 w-8 text-red-600" />
            </div>
            이론 평가 관리
          </h1>
          <p className="text-gray-600">수강생들의 이론 시험을 생성하고 관리하세요.</p>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100">
            <nav className="-mb-px flex px-6">
              {[
                { key: 'overview', label: <span className="flex items-center"><BarChart2 className="w-4 h-4 mr-2" />개요</span> },
                { key: 'create', label: <span className="flex items-center"><Plus className="w-4 h-4 mr-2" />시험 생성</span> },
                { key: 'results', label: <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-2" />결과 분석</span> }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 개요 탭 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 통계 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="text-3xl font-bold text-gray-900 mb-1">8</div>
                    <div className="text-sm font-medium text-gray-500">전체 시험</div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-5">
                    <div className="text-3xl font-bold text-green-600 mb-1">3</div>
                    <div className="text-sm font-medium text-green-600">진행중</div>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-5">
                    <div className="text-3xl font-bold text-blue-600 mb-1">2</div>
                    <div className="text-sm font-medium text-blue-600">예정됨</div>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-5">
                    <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
                    <div className="text-sm font-medium text-purple-600">완료됨</div>
                  </div>
                </div>

                {/* 최근 시험 목록 */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">최근 시험</h3>
                  <div className="space-y-3">
                    {[
                      { id: 1, title: '영업 기초 이론 평가', course: 'BS 영업 기초과정', status: 'active', students: 15 },
                      { id: 2, title: '고급 영업 전략 종합 평가', course: 'BS 고급 영업 전략', status: 'scheduled', students: 12 },
                      { id: 3, title: 'CRM 활용 능력 평가', course: 'BS 고객 관리 시스템', status: 'completed', students: 18 }
                    ].map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all cursor-pointer">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{exam.title}</h4>
                          <p className="text-sm text-gray-500">{exam.course}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500 font-medium">{exam.students}명 참여</span>
                          <Badge status={exam.status} size="sm">
                            {exam.status === 'active' ? '진행중' :
                              exam.status === 'scheduled' ? '예정' : '완료'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 시험 생성 탭 */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">새 시험 생성</h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">시험 제목</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="예: 영업 기초 이론 평가"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">과정 선택</label>
                      <select className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white">
                        <option value="">과정을 선택하세요</option>
                        <option value="1">BS 영업 기초과정</option>
                        <option value="2">BS 고급 영업 전략</option>
                        <option value="3">BS 고객 관리 시스템</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">시험 시간 (분)</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">문항 수</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">시험 설명</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="시험에 대한 설명을 입력하세요."
                      />
                    </div>

                    <div className="flex items-center space-x-6 py-2">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm font-medium text-gray-700">문제 순서 랜덤화</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span className="ml-2 text-sm font-medium text-gray-700">즉시 결과 표시</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-3 pt-6">
                      <button className="flex-1 btn-primary font-bold py-3.5 rounded-xl transition-colors">
                        시험 생성
                      </button>
                      <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 결과 분석 탭 */}
            {activeTab === 'results' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">시험 결과 분석</h3>

                {/* 성적 분포 */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-bold text-gray-900 mb-4">성적 분포</h4>
                  <div className="space-y-4">
                    {[
                      { range: '90-100점', count: 15, percentage: 25, color: 'bg-green-500' },
                      { range: '80-89점', count: 20, percentage: 33, color: 'bg-blue-500' },
                      { range: '70-79점', count: 12, percentage: 20, color: 'bg-yellow-500' },
                      { range: '60-69점', count: 8, percentage: 13, color: 'bg-orange-500' },
                      { range: '60점 미만', count: 5, percentage: 8, color: 'bg-red-500' }
                    ].map((item) => (
                      <div key={item.range} className="flex items-center">
                        <div className="w-24 text-sm font-medium text-gray-600">{item.range}</div>
                        <div className="flex-1 mx-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-gray-900">{item.count}명</span>
                            <span className="text-xs text-gray-500">{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full ${item.color}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 평균 점수 */}
                <div className="bg-blue-50 rounded-2xl p-8 text-center border border-blue-100">
                  <div className="text-4xl font-bold text-blue-600 mb-2">78.5<span className="text-2xl ml-1">점</span></div>
                  <div className="text-sm font-medium text-blue-600/70">전체 평균 점수</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleExamManagement;