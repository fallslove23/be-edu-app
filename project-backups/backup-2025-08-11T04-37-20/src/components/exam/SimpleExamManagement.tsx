import React, { useState } from 'react';

const SimpleExamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'results'>('overview');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🎯 이론 평가 관리</h1>
        <p className="text-gray-600">수강생들의 이론 시험을 생성하고 관리하세요.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { key: 'overview', label: '📊 개요' },
              { key: 'create', label: '➕ 시험 생성' },
              { key: 'results', label: '📈 결과 분석' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">8</div>
                  <div className="text-sm text-gray-600">전체 시험</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-gray-600">진행중</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">2</div>
                  <div className="text-sm text-gray-600">예정됨</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-gray-600">완료됨</div>
                </div>
              </div>

              {/* 최근 시험 목록 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">최근 시험</h3>
                <div className="space-y-3">
                  {[
                    { id: 1, title: '영업 기초 이론 평가', course: 'BS 영업 기초과정', status: 'active', students: 15 },
                    { id: 2, title: '고급 영업 전략 종합 평가', course: 'BS 고급 영업 전략', status: 'scheduled', students: 12 },
                    { id: 3, title: 'CRM 활용 능력 평가', course: 'BS 고객 관리 시스템', status: 'completed', students: 18 }
                  ].map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div>
                        <h4 className="font-medium text-gray-900">{exam.title}</h4>
                        <p className="text-sm text-gray-600">{exam.course}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{exam.students}명 참여</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exam.status === 'active' ? 'bg-green-100 text-green-800' :
                          exam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status === 'active' ? '진행중' :
                           exam.status === 'scheduled' ? '예정' : '완료'}
                        </span>
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
              <div className="max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900 mb-4">새 시험 생성</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시험 제목</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="예: 영업 기초 이론 평가"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">과정 선택</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">과정을 선택하세요</option>
                      <option value="1">BS 영업 기초과정</option>
                      <option value="2">BS 고급 영업 전략</option>
                      <option value="3">BS 고객 관리 시스템</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">시험 시간 (분)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">문항 수</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시험 설명</label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="시험에 대한 설명을 입력하세요."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">문제 순서 랜덤화</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">즉시 결과 표시</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      시험 생성
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">시험 결과 분석</h3>
              
              {/* 성적 분포 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">성적 분포</h4>
                <div className="space-y-3">
                  {[
                    { range: '90-100점', count: 15, percentage: 25, color: 'bg-green-500' },
                    { range: '80-89점', count: 20, percentage: 33, color: 'bg-blue-500' },
                    { range: '70-79점', count: 12, percentage: 20, color: 'bg-yellow-500' },
                    { range: '60-69점', count: 8, percentage: 13, color: 'bg-orange-500' },
                    { range: '60점 미만', count: 5, percentage: 8, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.range} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600">{item.range}</div>
                      <div className="flex-1 mx-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{item.count}명</span>
                          <span className="text-sm text-gray-500">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 평균 점수 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">78.5점</div>
                  <div className="text-sm text-gray-600 mt-1">전체 평균 점수</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleExamManagement;