import React, { useState } from 'react';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  UserIcon,
  DocumentChartBarIcon,
  AcademicCapIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

interface TraineePerformance {
  id: string;
  name: string;
  course: string;
  attendance_rate: number;
  exam_average: number;
  progress: number;
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
  last_activity: string;
}

const PerformanceTracking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'individual' | 'reports'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  
  // 목업 데이터
  const performanceData: TraineePerformance[] = [
    { id: '1', name: '김민수', course: 'BS 영업 기초과정', attendance_rate: 95, exam_average: 85, progress: 90, status: 'excellent', last_activity: '2024-08-08' },
    { id: '2', name: '이영희', course: 'BS 고급 영업 전략', attendance_rate: 88, exam_average: 92, progress: 85, status: 'excellent', last_activity: '2024-08-07' },
    { id: '3', name: '박정우', course: 'BS 영업 기초과정', attendance_rate: 92, exam_average: 78, progress: 82, status: 'good', last_activity: '2024-08-08' },
    { id: '4', name: '최수현', course: 'BS 고객 관리 시스템', attendance_rate: 85, exam_average: 88, progress: 78, status: 'good', last_activity: '2024-08-06' },
    { id: '5', name: '정다은', course: 'BS 영업 기초과정', attendance_rate: 76, exam_average: 65, progress: 60, status: 'needs_improvement', last_activity: '2024-08-05' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'needs_improvement': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return '우수';
      case 'good': return '양호';
      case 'average': return '보통';
      case 'needs_improvement': return '개선 필요';
      default: return '미분류';
    }
  };

  const overallStats = {
    total_trainees: performanceData.length,
    excellent: performanceData.filter(p => p.status === 'excellent').length,
    good: performanceData.filter(p => p.status === 'good').length,
    needs_improvement: performanceData.filter(p => p.status === 'needs_improvement').length,
    avg_attendance: Math.round(performanceData.reduce((sum, p) => sum + p.attendance_rate, 0) / performanceData.length),
    avg_exam_score: Math.round(performanceData.reduce((sum, p) => sum + p.exam_average, 0) / performanceData.length),
    avg_progress: Math.round(performanceData.reduce((sum, p) => sum + p.progress, 0) / performanceData.length)
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2" />
              성과 추적
            </h1>
            <p className="text-gray-600">교육생들의 학습 성과를 추적하고 분석합니다.</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="this_week">이번 주</option>
              <option value="this_month">이번 달</option>
              <option value="this_quarter">이번 분기</option>
              <option value="this_year">올해</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              리포트 내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { key: 'overview', label: '전체 현황', icon: ChartBarIcon },
              { key: 'individual', label: '개별 성과', icon: UserIcon },
              { key: 'reports', label: '상세 리포트', icon: DocumentChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* 전체 현황 탭 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 주요 지표 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{overallStats.total_trainees}</div>
                  <div className="text-sm text-gray-600">총 수강생</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{overallStats.avg_attendance}%</div>
                  <div className="text-sm text-gray-600">평균 출석률</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">{overallStats.avg_exam_score}</div>
                  <div className="text-sm text-gray-600">평균 시험 점수</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{overallStats.avg_progress}%</div>
                  <div className="text-sm text-gray-600">평균 진도율</div>
                </div>
              </div>

              {/* 성과 분포 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">성과 등급 분포</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800 font-medium">우수 ({overallStats.excellent}명)</span>
                      <span className="text-green-600">{Math.round((overallStats.excellent / overallStats.total_trainees) * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800 font-medium">양호 ({overallStats.good}명)</span>
                      <span className="text-blue-600">{Math.round((overallStats.good / overallStats.total_trainees) * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-red-800 font-medium">개선 필요 ({overallStats.needs_improvement}명)</span>
                      <span className="text-red-600">{Math.round((overallStats.needs_improvement / overallStats.total_trainees) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">과정별 평균 성과</h3>
                  <div className="space-y-3">
                    {['BS 영업 기초과정', 'BS 고급 영업 전략', 'BS 고객 관리 시스템'].map((course) => {
                      const courseStudents = performanceData.filter(p => p.course === course);
                      const avgScore = courseStudents.length > 0 
                        ? Math.round(courseStudents.reduce((sum, p) => sum + p.exam_average, 0) / courseStudents.length)
                        : 0;
                      
                      return (
                        <div key={course} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{course}</span>
                            <span className="text-gray-600">{avgScore}점</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 개선 권장사항 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">📋 개선 권장사항</h3>
                <div className="space-y-1 text-sm text-yellow-700">
                  <div>• {overallStats.needs_improvement}명의 수강생이 개선이 필요한 상태입니다.</div>
                  <div>• 평균 출석률이 {overallStats.avg_attendance}%입니다. 85% 이상 유지를 권장합니다.</div>
                  <div>• 개별 맞춤 지도가 필요한 수강생에게 추가 지원을 제공하세요.</div>
                </div>
              </div>
            </div>
          )}

          {/* 개별 성과 탭 */}
          {activeTab === 'individual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">개별 수강생 성과</h3>
                <div className="flex items-center space-x-3">
                  <input 
                    type="text" 
                    placeholder="수강생 검색..." 
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">전체 상태</option>
                    <option value="excellent">우수</option>
                    <option value="good">양호</option>
                    <option value="needs_improvement">개선 필요</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수강생</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과정</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">출석률</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시험 평균</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">진도율</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최근 활동</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceData.map((trainee) => (
                      <tr key={trainee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{trainee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{trainee.course}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trainee.attendance_rate}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trainee.exam_average}점</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{trainee.progress}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trainee.status)}`}>
                            {getStatusLabel(trainee.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{trainee.last_activity}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 상세 리포트 탭 */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">상세 성과 리포트</h3>
              
              {/* 리포트 템플릿 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">📊 종합 성과 리포트</h4>
                  <p className="text-sm text-gray-600 mb-4">전체 수강생의 출석, 시험, 진도 현황을 종합한 리포트</p>
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">📈 개별 수강생 리포트</h4>
                  <p className="text-sm text-gray-600 mb-4">특정 수강생의 상세한 학습 성과 분석 리포트</p>
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">📚 과정별 분석 리포트</h4>
                  <p className="text-sm text-gray-600 mb-4">과정별 수강생 성과 비교 및 분석 리포트</p>
                  <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2">⚠️ 개선 필요 수강생 리포트</h4>
                  <p className="text-sm text-gray-600 mb-4">추가 지원이 필요한 수강생 현황 및 권장사항</p>
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm">
                    리포트 생성
                  </button>
                </div>
              </div>

              {/* 리포트 히스토리 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">최근 생성된 리포트</h4>
                <div className="space-y-3">
                  {[
                    { name: '8월 종합 성과 리포트', date: '2024-08-01', type: '종합 리포트', size: '2.3MB' },
                    { name: '과정별 분석 리포트 (7월)', date: '2024-07-31', type: '과정별 리포트', size: '1.8MB' },
                    { name: '개선 필요 수강생 리포트', date: '2024-07-28', type: '개별 리포트', size: '945KB' }
                  ].map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{report.name}</div>
                        <div className="text-sm text-gray-600">{report.type} • {report.date} • {report.size}</div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceTracking;