import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MyHistory: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications' | 'activities'>('courses');

  // Mock 데이터 - 실제로는 API에서 가져올 것
  const completedCourses = [
    {
      id: '1',
      name: 'BS Basic 1차',
      period: '2025-01-01 ~ 2025-01-31',
      completion_date: '2025-01-31',
      score: 95,
      status: '수료'
    },
    {
      id: '2',
      name: 'BS Advanced 2차',
      period: '2025-02-01 ~ 2025-02-28',
      completion_date: '2025-02-28',
      score: 88,
      status: '수료'
    },
  ];

  const certifications = [
    {
      id: '1',
      name: 'BS Basic 수료증',
      issue_date: '2025-02-01',
      issuer: 'BS 교육원',
      certificate_number: 'BS-BASIC-20250201-001',
    },
    {
      id: '2',
      name: 'BS Advanced 수료증',
      issue_date: '2025-03-01',
      issuer: 'BS 교육원',
      certificate_number: 'BS-ADV-20250301-001',
    },
  ];

  const activities = [
    {
      id: '1',
      date: '2025-01-15',
      type: 'presentation',
      title: '프레젠테이션 발표',
      content: '비즈니스 모델 캔버스 발표',
      score: 'A',
    },
    {
      id: '2',
      date: '2025-01-20',
      type: 'practice',
      title: '실습 평가',
      content: 'SWOT 분석 실습',
      score: 'B+',
    },
    {
      id: '3',
      date: '2025-01-25',
      type: 'exam',
      title: '중간 평가',
      content: 'BS Basic 중간 평가',
      score: '92점',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">📋 내 이력</h1>
        <p className="text-muted-foreground">교육 이수 현황과 활동 기록을 확인하세요</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'courses'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">📚</span>
            수료 과정
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {completedCourses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('certifications')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'certifications'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">🏆</span>
            인증서
            <span className="ml-2 text-xs bg-green-500/10 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-0.5 rounded-full">
              {certifications.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'activities'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">🎯</span>
            활동 기록
            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
              {activities.length}
            </span>
          </button>
        </div>
      </div>

      {/* 수료 과정 */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{course.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      📅 {course.period}
                    </span>
                    <span className="flex items-center gap-1">
                      ✅ {course.completion_date}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-1">{course.score}점</div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:bg-green-900 dark:text-green-200">
                    {course.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-primary/20/40 transition-colors">
                  📄 상세보기
                </button>
                <button className="px-4 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                  📊 성적표
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 인증서 */}
      {activeTab === 'certifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center text-3xl">
                  🏆
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">발급일</span>
                  <span className="text-foreground">{new Date(cert.issue_date).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">인증번호</span>
                  <span className="text-foreground font-mono text-xs">{cert.certificate_number}</span>
                </div>
              </div>
              <button className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                📥 다운로드
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 활동 기록 */}
      {activeTab === 'activities' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    평가
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {new Date(activity.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.type === 'presentation'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : activity.type === 'practice'
                          ? 'bg-green-500/10 text-green-700 dark:bg-green-900 dark:text-green-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {activity.type === 'presentation' ? '발표' : activity.type === 'practice' ? '실습' : '시험'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {activity.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {activity.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary">
                      {activity.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHistory;
