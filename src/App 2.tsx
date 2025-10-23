import React, { useState, Suspense, lazy } from 'react';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getMenuSections, sectionLabels } from './config/navigation';
import DarkModeToggle from './components/ui/DarkModeToggle';

// 핵심 컴포넌트들을 lazy loading으로 안전하게 import
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🏠 대시보드</h2><p className="text-gray-600">전체 현황 및 요약 정보를 표시합니다.</p></div> })));
const BSCourseManagement = lazy(() => import('./components/courses/BSCourseManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📚 BS 과정 관리</h2><p className="text-gray-600">BS 고정 템플릿 기반 과정 관리 페이지입니다.</p></div> })));
const TraineeManagement = lazy(() => import('./components/trainees/TraineeManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">👥 교육생 관리</h2><p className="text-gray-600">교육생 등록 및 관리 페이지입니다.</p></div> })));
const UserManagement = lazy(() => import('./components/users/UserManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">👥 사용자 관리</h2><p className="text-gray-600">시스템 사용자 관리 페이지입니다.</p></div> })));
const NoticeManagement = lazy(() => import('./components/notices/NoticeManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📢 공지사항 관리</h2><p className="text-gray-600">공지사항 작성 및 관리 페이지입니다.</p></div> })));
const ExamManagement = lazy(() => import('./components/exam/ExamManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📝 시험 관리</h2><p className="text-gray-600">시험 출제 및 관리 페이지입니다.</p></div> })));
const PracticeEvaluation = lazy(() => import('./components/practice/PracticeEvaluation').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎯 실습 평가</h2><p className="text-gray-600">실습 평가 관리 페이지입니다.</p></div> })));
const PerformanceTracking = lazy(() => import('./components/performance/PerformanceTracking').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📊 성과 분석</h2><p className="text-gray-600">성과 분석 및 보고서 페이지입니다.</p></div> })));

// 고급 분석 기능 컴포넌트 추가
const AdvancedAnalytics = lazy(() => import('./components/analytics/AdvancedAnalytics').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📊 고급 분석</h2><p className="text-gray-600">상세한 학습 진도 및 성과 분석 도구입니다.</p></div> })));
const IntegratedAnalyticsManagement = lazy(() => import('./components/analytics/IntegratedAnalyticsManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📈 통합 분석 관리</h2><p className="text-gray-600">종합적인 학습 데이터 분석 및 리포팅입니다.</p></div> })));
const LearningProgressVisualization = lazy(() => import('./components/analytics/LearningProgressVisualization').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📊 학습 진도 시각화</h2><p className="text-gray-600">학습 진행 상황을 시각적으로 표시합니다.</p></div> })));
const PersonalAnalytics = lazy(() => import('./components/analytics/PersonalAnalytics').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">👤 개인 분석</h2><p className="text-gray-600">개별 학습자의 상세 분석 리포트입니다.</p></div> })));

// 보안 기능 컴포넌트 추가
const AdvancedSecurity = lazy(() => import('./components/security/AdvancedSecurity').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🔒 고급 보안</h2><p className="text-gray-600">시스템 보안 관리 및 모니터링 도구입니다.</p></div> })));
const SecurityDashboard = lazy(() => import('./components/security/SecurityDashboard').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🛡️ 보안 대시보드</h2><p className="text-gray-600">보안 상태 및 위협 모니터링입니다.</p></div> })));
const SecureLogin = lazy(() => import('./components/auth/SecureLogin').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🔐 보안 로그인</h2><p className="text-gray-600">강화된 인증 시스템입니다.</p></div> })));

// PWA 및 오프라인 기능 컴포넌트 추가
const AdvancedPWA = lazy(() => import('./components/pwa/AdvancedPWA').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📱 고급 PWA</h2><p className="text-gray-600">Progressive Web App 고급 기능 관리</p></div> })));
const OfflineManager = lazy(() => import('./components/offline/OfflineManager').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📡 오프라인 관리</h2><p className="text-gray-600">오프라인 데이터 동기화 및 관리</p></div> })));

// 고급 파일 관리 기능 컴포넌트 추가  
const AdvancedFileManager = lazy(() => import('./components/files/AdvancedFileManager').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📁 고급 파일 관리</h2><p className="text-gray-600">파일 업로드, 다운로드 및 관리 시스템</p></div> })));
const FileManager = lazy(() => import('./components/file/FileManager').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📂 파일 관리</h2><p className="text-gray-600">기본 파일 관리 도구</p></div> })));

// 멀티미디어 및 커뮤니케이션 기능 컴포넌트 추가
const MediaViewer = lazy(() => import('./components/media/MediaViewer').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎬 미디어 뷰어</h2><p className="text-gray-600">이미지, 비디오, 오디오 파일 재생</p></div> })));
const AudioPlayer = lazy(() => import('./components/media/AudioPlayer').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎵 오디오 플레이어</h2><p className="text-gray-600">오디오 파일 재생 및 관리</p></div> })));
const VideoPlayer = lazy(() => import('./components/media/VideoPlayer').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎥 비디오 플레이어</h2><p className="text-gray-600">비디오 파일 재생 및 관리</p></div> })));
const RealTimeChat = lazy(() => import('./components/realtime/RealTimeChat').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">💬 실시간 채팅</h2><p className="text-gray-600">실시간 메시지 및 채팅 기능</p></div> })));
const RealTimeNotifications = lazy(() => import('./components/realtime/RealTimeNotifications').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🔔 실시간 알림</h2><p className="text-gray-600">실시간 알림 및 메시지 시스템</p></div> })));

// 교육 및 BS 활동 관리 컴포넌트 추가
const IntegratedEducationManagement = lazy(() => import('./components/education/IntegratedEducationManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎓 통합 교육 관리</h2><p className="text-gray-600">교육 과정 통합 관리 시스템</p></div> })));
const BSActivitiesManagement = lazy(() => import('./components/bs-activities/BSActivitiesManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎯 BS 활동 관리</h2><p className="text-gray-600">BS 활동 기록 및 관리 시스템</p></div> })));
const ActivityJournal = lazy(() => import('./components/journal/ActivityJournal').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📔 활동 일지</h2><p className="text-gray-600">일일 활동 기록 및 관리</p></div> })));

// 스케줄 관리 컴포넌트 추가
const ScheduleViewer = lazy(() => import('./components/schedule/ScheduleViewerWrapper'));
const CourseSchedule = lazy(() => import('./components/schedule/CourseManagement'));

// 로딩 컴포넌트
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">⏳</div>
      <h2 className="text-xl font-semibold mb-2">로딩 중...</h2>
      <p className="text-gray-600">시스템을 준비하고 있습니다.</p>
    </div>
  </div>
);

// 에러 폴백 컴포넌트
const ErrorFallback: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold mb-2 text-red-600">오류 발생</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
      >
        새로고침
      </button>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading, error } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // 로딩 상태
  if (loading) {
    return <LoadingSpinner />;
  }

  // 에러 상태
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // 사용자 정보 없음
  if (!user) {
    return <ErrorFallback error="사용자 정보를 불러올 수 없습니다." />;
  }

  // 메뉴 섹션 안전하게 가져오기
  let menuSections;
  try {
    menuSections = getMenuSections(user.role);
  } catch (err) {
    console.error('메뉴 로딩 실패:', err);
    return <ErrorFallback error="메뉴를 불러올 수 없습니다." />;
  }

  // 메뉴 아이템 클릭 핸들러
  const handleMenuClick = (itemId: string) => {
    console.log('Menu clicked:', itemId);
    setActiveView(itemId);
    setSidebarOpen(false);
  };

  // 서브메뉴 토글 핸들러
  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // 안전한 페이지 렌더링 함수
  const renderPage = () => {
    try {
      switch (activeView) {
        case 'dashboard':
          return <Dashboard />;
        case 'education':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎓 교육 운영</h2><p className="text-gray-600 mb-6">BS 고정 템플릿 기반 직관적인 과정 관리</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><button onClick={() => setActiveView('courses')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">📚</div><h3 className="font-semibold">BS 과정 관리</h3><p className="text-sm text-gray-600">BS Basic/Advanced 차수 관리</p></button><button onClick={() => setActiveView('trainees')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">👥</div><h3 className="font-semibold">교육생 관리</h3><p className="text-sm text-gray-600">교육생 등록 및 관리</p></button><button onClick={() => setActiveView('integrated-education')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🎓</div><h3 className="font-semibold">통합 교육 관리</h3><p className="text-sm text-gray-600">교육 과정 통합 관리</p></button></div></div>;
        case 'integrated-education':
          return <IntegratedEducationManagement />;
        case 'bs-activities':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎯 BS 활동</h2><p className="text-gray-600 mb-6">BS 활동 기록 및 관리</p><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><button onClick={() => setActiveView('bs-activities-management')} className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🎯</div><h3 className="font-semibold">BS 활동 관리</h3><p className="text-sm text-gray-600">BS 활동 종합 관리</p></button><button onClick={() => setActiveView('activity-journal')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">📝</div><h3 className="font-semibold">활동 일지</h3><p className="text-sm text-gray-600">일일 활동 기록 작성</p></button><div className="p-4 bg-green-50 rounded-lg"><div className="text-2xl mb-2">📊</div><h3 className="font-semibold">활동 통계</h3><p className="text-sm text-gray-600">활동 현황 및 통계</p></div></div></div>;
        case 'bs-activities-management':
          return <BSActivitiesManagement />;
        case 'activity-journal':
          return <ActivityJournal />;
        case 'assessment':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📝 평가 관리</h2><p className="text-gray-600 mb-6">시험, 실습평가, 인증서 관리</p><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><button onClick={() => setActiveView('exams')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">📋</div><h3 className="font-semibold">시험 관리</h3><p className="text-sm text-gray-600">시험 출제 및 채점</p></button><button onClick={() => setActiveView('practice')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🎯</div><h3 className="font-semibold">실습 평가</h3><p className="text-sm text-gray-600">실습 과제 평가</p></button><div className="p-4 bg-purple-50 rounded-lg"><div className="text-2xl mb-2">🏆</div><h3 className="font-semibold">인증서</h3><p className="text-sm text-gray-600">수료증 발급</p></div></div></div>;
        case 'analytics':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📊 분석 관리</h2><p className="text-gray-600 mb-6">다양한 분석 도구와 리포트</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><button onClick={() => setActiveView('performance-tracking')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">📊</div><h3 className="font-semibold">기본 성과 분석</h3><p className="text-sm text-gray-600">기본 성과 추적</p></button><button onClick={() => setActiveView('advanced-analytics')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🔍</div><h3 className="font-semibold">고급 분석</h3><p className="text-sm text-gray-600">상세 분석 도구</p></button><button onClick={() => setActiveView('integrated-analytics')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">📈</div><h3 className="font-semibold">통합 분석</h3><p className="text-sm text-gray-600">종합 리포팅</p></button><button onClick={() => setActiveView('personal-analytics')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">👤</div><h3 className="font-semibold">개인 분석</h3><p className="text-sm text-gray-600">개별 학습자 분석</p></button></div></div>;
        case 'performance-tracking':
          return <PerformanceTracking />;
        case 'advanced-analytics':
          return <AdvancedAnalytics />;
        case 'integrated-analytics':
          return <IntegratedAnalyticsManagement />;
        case 'learning-progress-visualization':
          return <LearningProgressVisualization />;
        case 'personal-analytics':
          return <PersonalAnalytics />;
        case 'schedule-viewer':
          return (
            <ErrorBoundary fallback={
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">🗓️ 시간표 뷰어</h2>
                <p className="text-gray-600">시간표 뷰어를 불러오는 중 오류가 발생했습니다.</p>
              </div>
            }>
              <ScheduleViewer />
            </ErrorBoundary>
          );
        case 'course-schedule':
          return <CourseSchedule />;
        case 'schedule-management':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📅 일정 관리</h2><p className="text-gray-600">강의 일정, 교실 배정, 캘린더 관리</p></div>;
        case 'student-reports':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📋 교육생 리포트</h2><p className="text-gray-600 mb-6">교육생 수료이력, 성과, 인증서 리포트 조회</p><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="p-4 bg-blue-50 rounded-lg"><div className="text-2xl mb-2">🎓</div><h3 className="font-semibold">수료 현황</h3><p className="text-sm text-gray-600">과정별 수료 현황</p></div><div className="p-4 bg-green-50 rounded-lg"><div className="text-2xl mb-2">📊</div><h3 className="font-semibold">성과 리포트</h3><p className="text-sm text-gray-600">교육생 성과 분석</p></div><div className="p-4 bg-purple-50 rounded-lg"><div className="text-2xl mb-2">🏆</div><h3 className="font-semibold">인증서 발급</h3><p className="text-sm text-gray-600">인증서 발급 현황</p></div></div></div>;
        case 'system':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">⚙️ 시스템 관리</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><button onClick={() => setActiveView('users')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">👥</span><div><h3 className="font-semibold">사용자 관리</h3><p className="text-sm text-gray-600">시스템 사용자 등록 및 관리</p></div></div></button><button onClick={() => setActiveView('notices')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">📢</span><div><h3 className="font-semibold">공지사항 관리</h3><p className="text-sm text-gray-600">시스템 공지사항 작성 및 관리</p></div></div></button><button onClick={() => setActiveView('security-dashboard')} className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">🛡️</span><div><h3 className="font-semibold">보안 대시보드</h3><p className="text-sm text-gray-600">보안 상태 모니터링</p></div></div></button><button onClick={() => setActiveView('advanced-security')} className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">🔒</span><div><h3 className="font-semibold">고급 보안</h3><p className="text-sm text-gray-600">보안 설정 및 관리</p></div></div></button><button onClick={() => setActiveView('advanced-pwa')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">📱</span><div><h3 className="font-semibold">PWA 관리</h3><p className="text-sm text-gray-600">Progressive Web App 설정</p></div></div></button><button onClick={() => setActiveView('offline-manager')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">📡</span><div><h3 className="font-semibold">오프라인 관리</h3><p className="text-sm text-gray-600">오프라인 데이터 동기화</p></div></div></button><button onClick={() => setActiveView('advanced-file-manager')} className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">📁</span><div><h3 className="font-semibold">고급 파일 관리</h3><p className="text-sm text-gray-600">파일 업로드 및 관리</p></div></div></button><button onClick={() => setActiveView('file-manager')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"><div className="flex items-center space-x-3"><span className="text-2xl">📂</span><div><h3 className="font-semibold">파일 관리</h3><p className="text-sm text-gray-600">기본 파일 관리 도구</p></div></div></button></div></div>;
        case 'communication':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📡 커뮤니케이션 & 미디어</h2><p className="text-gray-600 mb-6">실시간 소통 및 멀티미디어 관리</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><button onClick={() => setActiveView('realtime-chat')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">💬</div><h3 className="font-semibold">실시간 채팅</h3><p className="text-sm text-gray-600">실시간 메시지 및 채팅</p></button><button onClick={() => setActiveView('realtime-notifications')} className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🔔</div><h3 className="font-semibold">실시간 알림</h3><p className="text-sm text-gray-600">알림 및 메시지 시스템</p></button><button onClick={() => setActiveView('media-viewer')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🎬</div><h3 className="font-semibold">미디어 뷰어</h3><p className="text-sm text-gray-600">이미지, 비디오 재생</p></button><button onClick={() => setActiveView('audio-player')} className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🎵</div><h3 className="font-semibold">오디오 플레이어</h3><p className="text-sm text-gray-600">오디오 파일 재생</p></button><button onClick={() => setActiveView('video-player')} className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"><div className="text-2xl mb-2">🎥</div><h3 className="font-semibold">비디오 플레이어</h3><p className="text-sm text-gray-600">비디오 파일 재생</p></button></div></div>;
        case 'my-learning':
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎒 나의 학습</h2><p className="text-gray-600 mb-6">개인 학습 관련 메뉴</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 bg-green-50 rounded-lg"><div className="text-2xl mb-2">📚</div><h3 className="font-semibold">내 과정</h3><p className="text-sm text-gray-600">수강 중인 과정 확인</p></div><div className="p-4 bg-green-50 rounded-lg"><div className="text-2xl mb-2">📝</div><h3 className="font-semibold">내 시험</h3><p className="text-sm text-gray-600">시험 일정 및 결과</p></div></div></div>;
        case 'courses':
          console.log('🎯 App.tsx: BSCourseManagement 렌더링 시작');
          return <BSCourseManagement />;
        case 'trainees':
          return <TraineeManagement />;
        case 'users':
          return <UserManagement />;
        case 'notices':
          return <NoticeManagement />;
        case 'exams':
          return <ExamManagement />;
        case 'practice':
          return <PracticeEvaluation />;
        case 'performance':
          return <PerformanceTracking />;
        case 'security-dashboard':
          return <SecurityDashboard />;
        case 'advanced-security':
          return <AdvancedSecurity />;
        case 'secure-login':
          return <SecureLogin />;
        case 'advanced-pwa':
          return <AdvancedPWA />;
        case 'offline-manager':
          return <OfflineManager />;
        case 'advanced-file-manager':
          return <AdvancedFileManager />;
        case 'file-manager':
          return <FileManager />;
        case 'realtime-chat':
          return <RealTimeChat />;
        case 'realtime-notifications':
          return <RealTimeNotifications />;
        case 'media-viewer':
          return <MediaViewer />;
        case 'audio-player':
          return <AudioPlayer />;
        case 'video-player':
          return <VideoPlayer />;
        default:
          return <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🔍 페이지를 찾을 수 없습니다</h2><p className="text-gray-600">요청하신 페이지가 존재하지 않습니다.</p></div>;
      }
    } catch (error) {
      console.error('페이지 렌더링 오류:', error);
      return <ErrorFallback error="페이지를 불러오는 중 오류가 발생했습니다." />;
    }
  };

  return (
    <div className="modern-layout">
      {/* 디버그: 렌더링 확인 */}
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2">
        ✅ App 렌더링 성공 | 사용자: {user.name} ({user.role}) | 현재 페이지: {activeView}
      </div>
      
      {/* 상단 헤더 */}
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-muted-foreground hover:text-foreground hover:bg-accent p-2 rounded-lg transition-colors mr-3"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">🎯 BS 학습 관리 시스템</h1>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>👤</span>
                <span>{user.name}</span>
              </div>
              <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm font-medium">
                {user.role}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <nav className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:relative z-40 bg-card border-r border-border min-h-screen transition-transform duration-300 ease-in-out w-64
        `}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-lg">
                🎯
              </div>
              <span className="font-semibold text-card-foreground">BS 학습</span>
            </div>
          </div>
          <div className="px-4">
            <div className="space-y-2">
              {Object.entries(menuSections).map(([sectionKey, items]) => (
                <div key={sectionKey}>
                  {Object.keys(menuSections).length > 1 && (
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {sectionLabels[sectionKey] || sectionKey}
                    </div>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id}>
                        {/* 메인 메뉴 아이템 */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (item.subItems && item.isCollapsible) {
                              toggleSubmenu(item.id);
                            } else {
                              handleMenuClick(item.id);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                            activeView === item.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          title={item.description}
                          type="button"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {item.subItems && item.isCollapsible && (
                            <span className="text-sm">
                              {expandedMenus.has(item.id) ? '▼' : '▶'}
                            </span>
                          )}
                        </button>

                        {/* 서브메뉴 */}
                        {item.subItems && item.isCollapsible && expandedMenus.has(item.id) && (
                          <div className="ml-8 mt-1 space-y-1">
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMenuClick(subItem.id);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 text-sm transition-colors ${
                                  activeView === subItem.id 
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                                title={subItem.description}
                                type="button"
                              >
                                <span className="text-base">{subItem.icon}</span>
                                <span>{subItem.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* 오버레이 (모바일에서만) */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 bg-background">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
            <p className="text-muted-foreground mt-1">BS 학습 관리 시스템의 전체 현황을 한눈에 확인하세요</p>
          </div>
          <div className="p-6">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-muted-foreground">페이지를 불러오고 있습니다...</p>
                </div>
              </div>
            }>
              {renderPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;