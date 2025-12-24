'use client'

import BSActivityForm from '@/components/bs-activities/BSActivityForm';
import BSActivityDashboard from '@/components/bs-activities/BSActivityDashboard';
import BSPresentationMode from '@/components/bs-activities/BSPresentationMode';
import { AuthProvider } from '@/contexts/AuthContext';
import { useState } from 'react';

function BSActivityTestContent() {
  const [view, setView] = useState<'form' | 'dashboard' | 'presentation'>('dashboard');
  const [showPresentation, setShowPresentation] = useState(false);

  // 테스트용 course ID
  const testCourseId = 'test-course-123';

  if (showPresentation) {
    return (
      <BSPresentationMode
        courseId={testCourseId}
        presentationDate={new Date().toISOString().split('T')[0]}
        onClose={() => setShowPresentation(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 BS 활동 관리 시스템 (신규 버전)
          </h1>
          <p className="text-gray-600 mb-4">
            새로 개발된 BS 활동 관리 컴포넌트 테스트 페이지
          </p>

          {/* 뷰 전환 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={() => setView('form')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'form'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 활동 작성 폼
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 관리 대시보드
            </button>
            <button
              onClick={() => setShowPresentation(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              🎤 발표 모드
            </button>
          </div>
        </div>

        {/* 컴포넌트 렌더링 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {view === 'form' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">활동 일지 작성</h2>
              <BSActivityForm
                courseId={testCourseId}
                onSuccess={() => {
                  alert('활동 제출 완료!');
                  setView('dashboard');
                }}
                onCancel={() => setView('dashboard')}
              />
            </div>
          )}

          {view === 'dashboard' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">관리 대시보드</h2>
              <BSActivityDashboard courseId={testCourseId} />
            </div>
          )}
        </div>

        {/* 안내 정보 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 font-semibold mb-2">ℹ️ 테스트 안내</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• <strong>활동 작성 폼</strong>: 교육생이 현장에서 활동을 기록하는 모바일 최적화 폼</li>
            <li>• <strong>관리 대시보드</strong>: 강사가 교육생 활동을 모니터링하고 피드백하는 화면</li>
            <li>• <strong>발표 모드</strong>: 발표일에 교육생이 개인별로 활동을 발표하는 프레젠테이션 모드</li>
            <li>• Supabase 연동을 위해 먼저 database/bs-activities-schema.sql을 실행해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BSActivityTestPage() {
  return (
    <AuthProvider>
      <BSActivityTestContent />
    </AuthProvider>
  );
}
