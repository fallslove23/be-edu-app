import React, { useState, useRef, Suspense, lazy } from 'react';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getMenuSections, sectionLabels } from './config/navigation';
import DarkModeToggle from './components/ui/DarkModeToggle';

// 핵심 컴포넌트들을 lazy loading으로 안전하게 import
const Dashboard = lazy(() => import('./components/dashboard/DashboardWrapper'));
const BSCourseManagement = lazy(() => import('./components/courses/BSCourseManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📚 BS 과정 관리</h2><p className="text-gray-600">BS 고정 템플릿 기반 과정 관리 페이지입니다.</p></div> })));
const TraineeManagement = lazy(() => import('./components/trainees/TraineeManagement'));
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

// 교육 관리 컴포넌트 추가
const UnifiedEducationManagement = lazy(() => import('./components/education/UnifiedEducationManagement'));
const IntegratedEducationManagement = lazy(() => import('./components/education/IntegratedEducationManagement'));
const CourseTemplateManagement = lazy(() => import('./components/courses/CourseTemplateManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📋 과정 템플릿</h2><p className="text-gray-600">과정 템플릿 관리 페이지입니다.</p></div> })));
const AttendanceManagement = lazy(() => import('./components/attendance/AttendanceManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">✅ 출석 관리</h2><p className="text-gray-600">출석 관리 페이지입니다.</p></div> })));

// BS 활동 관리 컴포넌트 추가
const BSActivitiesManagement = lazy(() => import('./components/bs-activities/BSActivityManagement').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">🎯 BS 활동 관리</h2><p className="text-gray-600">BS 활동 기록 및 관리 시스템</p></div> })));
const StudentActivityJournal = lazy(() => import('./components/bs-activities/StudentActivityJournal').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📔 활동 일지</h2><p className="text-gray-600">교육생 개인 활동 일지 작성</p></div> })));

// 스케줄 관리 컴포넌트 추가
const ScheduleViewer = lazy(() => import('./components/schedule/ScheduleViewerWrapper'));
const CourseSchedule = lazy(() => import('./components/schedule/CourseManagement'));
const ScheduleManager = lazy(() => import('./components/operations/ScheduleManager').catch(() => ({ default: () => <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-xl font-bold mb-4">📅 일정 관리</h2><p className="text-gray-600">통합 캘린더 및 일정 관리 페이지입니다.</p></div> })));

// 개인 정보 컴포넌트 추가
const MyProfile = lazy(() => import('./components/profile/MyProfile'));
const MyHistory = lazy(() => import('./components/profile/MyHistory'));

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
  const { user, loading, error, switchRole, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const roleMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 페이지 제목 매핑
  const pageTitles: Record<string, { title: string; description: string }> = {
    'dashboard': { title: '대시보드', description: 'BS 학습 관리 시스템의 전체 현황을 한눈에 확인하세요' },
    'course-management': { title: '과정 관리', description: '교육 과정 및 차수를 통합 관리합니다' },
    'courses': { title: 'BS 과정', description: 'BS 교육 과정을 관리하고 스케줄을 추적합니다' },
    'course-schedule': { title: '교육 일정', description: '교육 과정 일정을 관리합니다' },
    'schedule-viewer': { title: '시간표', description: '교육 시간표를 확인합니다' },
    'trainees': { title: '교육생 관리', description: '교육생 등록 및 정보를 관리합니다' },
    'integrated-education': { title: '통합 교육 관리', description: '교육 과정을 통합적으로 관리합니다' },
    'bs-activities-management': { title: 'BS 활동 관리', description: '전체 교육생 BS 활동 일지를 관리하고 피드백합니다' },
    'activity-journal': { title: '내 활동 일지', description: '치과 방문 활동 일지를 작성하고 관리합니다' },
    'exams': { title: '시험 관리', description: '시험 출제 및 채점을 관리합니다' },
    'practice': { title: '실습 평가', description: '실습 과제를 평가하고 관리합니다' },
    'performance-tracking': { title: '성과 분석', description: '학습 성과를 추적하고 분석합니다' },
    'advanced-analytics': { title: '고급 분석', description: '상세한 분석 도구를 제공합니다' },
    'integrated-analytics': { title: '통합 분석', description: '종합적인 리포팅을 제공합니다' },
    'learning-progress-visualization': { title: '학습 진도', description: '학습 진행 상황을 시각화합니다' },
    'personal-analytics': { title: '개인 분석', description: '개별 학습자를 분석합니다' },
    'users': { title: '사용자 관리', description: '시스템 사용자를 등록하고 관리합니다' },
    'notices': { title: '공지사항', description: '공지사항을 작성하고 관리합니다' },
    'security-dashboard': { title: '보안 대시보드', description: '보안 상태를 모니터링합니다' },
    'advanced-security': { title: '보안 설정', description: '보안 설정을 관리합니다' },
    'advanced-pwa': { title: 'PWA 설정', description: 'Progressive Web App을 설정합니다' },
    'offline-manager': { title: '오프라인 동기화', description: '오프라인 데이터를 동기화합니다' },
    'advanced-file-manager': { title: '파일 관리', description: '파일을 업로드하고 관리합니다' },
    'file-manager': { title: '파일 관리', description: '파일 관리 도구를 제공합니다' },
    'realtime-chat': { title: '실시간 채팅', description: '실시간 메시지 기능입니다' },
    'realtime-notifications': { title: '알림', description: '알림 및 메시지 시스템입니다' },
    'media-viewer': { title: '미디어 뷰어', description: '이미지, 비디오를 재생합니다' },
    'audio-player': { title: '오디오 재생', description: '오디오 파일을 재생합니다' },
    'video-player': { title: '비디오 재생', description: '비디오 파일을 재생합니다' },
    'schedule-manager': { title: '일정 관리', description: '교육 일정을 관리합니다' },
  };

  const currentPage = pageTitles[activeView] || pageTitles['dashboard'];

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
  let menuSections: Record<string, any[]>;
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
          return (
            <ErrorBoundary fallback={
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">🏠 대시보드</h2>
                <p className="text-gray-600">대시보드를 불러오는 중 오류가 발생했습니다.</p>
                <p className="text-sm text-gray-500 mt-2">전체 현황 및 통계 정보를 표시하는 메인 대시보드입니다.</p>
              </div>
            }>
              <Dashboard />
            </ErrorBoundary>
          );
        case 'course-management':
          return (
            <ErrorBoundary fallback={
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">📚 과정 관리</h2>
                <p className="text-gray-600">통합 과정 관리 시스템을 불러오는 중 오류가 발생했습니다.</p>
              </div>
            }>
              <UnifiedEducationManagement />
            </ErrorBoundary>
          );
        case 'bs-activities':
          // 권한에 따른 다른 화면 표시
          if (user.role === 'trainee') {
            // 교육생은 바로 활동 일지로 이동
            return <StudentActivityJournal />;
          } else {
            // 운영진은 활동 관리로 이동  
            return <BSActivitiesManagement />;
          }
        case 'bs-activities-management':
          return <BSActivitiesManagement />;
        case 'activity-journal':
          return <StudentActivityJournal />;
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
          return <LearningProgressVisualization viewMode="overview" />;
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
          return (
            <ErrorBoundary fallback={
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">📅 일정 관리</h2>
                <p className="text-gray-600">통합 캘린더 로드 중 오류가 발생했습니다.</p>
              </div>
            }>
              <ScheduleManager />
            </ErrorBoundary>
          );
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
          return (
            <ErrorBoundary fallback={
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">📚 BS 과정 관리</h2>
                <p className="text-gray-600">BS 과정 관리 시스템을 불러오는 중 오류가 발생했습니다.</p>
                <p className="text-sm text-gray-500 mt-2">BS Basic/Advanced 템플릿 기반 차수별 과정 관리 페이지입니다.</p>
              </div>
            }>
              <BSCourseManagement />
            </ErrorBoundary>
          );
        case 'trainees':
          return (
            <ErrorBoundary fallback={
              <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">👥 교육생 관리</h2>
                <p className="text-gray-600">교육생 관리 시스템을 불러오는 중 오류가 발생했습니다.</p>
                <p className="text-sm text-gray-500 mt-2">엑셀 가져오기 기능을 포함한 교육생 등록 및 관리 페이지입니다.</p>
              </div>
            }>
              <TraineeManagement />
            </ErrorBoundary>
          );
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
          return <MediaViewer files={[]} />;
        case 'audio-player':
          return <AudioPlayer src="" title="오디오 플레이어" />;
        case 'video-player':
          return <VideoPlayer src="" title="비디오 플레이어" />;
        case 'my-profile':
          return <MyProfile />;
        case 'my-history':
          return <MyHistory />;
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
                className="md:hidden text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent active:text-foreground p-3 sm:p-2 rounded-lg transition-colors mr-3 touch-manipulation"
                aria-label="메뉴 토글"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">🎯 BS 학습 관리 시스템</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <DarkModeToggle />

              {/* 역할 배지 */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-1"
                >
                  {user.role === 'admin' ? '👑 관리자' : user.role === 'instructor' ? '👨‍🏫 강사' : user.role === 'trainee' ? '🎓 교육생' : user.role}
                  <span className="text-xs">▼</span>
                </button>

                {/* 역할 전환 드롭다운 */}
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      역할 전환 (테스트용)
                    </div>
                    <button
                      onClick={() => {
                        switchRole?.('trainee');
                        setActiveView('bs-activities');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${user.role === 'trainee' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      🎓 교육생
                    </button>
                    <button
                      onClick={() => {
                        switchRole?.('instructor');
                        setActiveView('bs-activities');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${user.role === 'instructor' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      👨‍🏫 강사
                    </button>
                    <button
                      onClick={() => {
                        switchRole?.('admin');
                        setActiveView('dashboard');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${user.role === 'admin' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      👑 관리자
                    </button>
                  </div>
                )}
              </div>

              {/* 사용자 메뉴 */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 hover:bg-accent px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.department || user.position}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">▼</span>
                </button>

                {/* 사용자 드롭다운 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.employee_id}</div>
                        </div>
                      </div>
                    </div>

                    {/* 메뉴 아이템 */}
                    <button
                      onClick={() => {
                        setActiveView('my-profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <span className="text-lg">👤</span>
                      <span>내 정보</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('my-history');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                    >
                      <span className="text-lg">📋</span>
                      <span>내 이력</span>
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        if (window.confirm('로그아웃 하시겠습니까?')) {
                          logout?.();
                        }
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                    >
                      <span className="text-lg">🚪</span>
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
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
                          className={`w-full text-left px-4 py-3 sm:px-3 sm:py-2 rounded-lg flex items-center justify-between transition-colors touch-manipulation ${
                            activeView === item.id
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground'
                          }`}
                          title={item.description}
                          type="button"
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`text-xl ${activeView === item.id ? '' : 'opacity-60 grayscale'}`}>{item.icon}</span>
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
                                className={`w-full text-left px-4 py-3 sm:px-3 sm:py-2 rounded-md flex items-center space-x-2 text-sm transition-colors touch-manipulation ${
                                  activeView === subItem.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent active:text-foreground'
                                }`}
                                title={subItem.description}
                                type="button"
                              >
                                <span className={`text-base ${activeView === subItem.id ? '' : 'opacity-60 grayscale'}`}>{subItem.icon}</span>
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
          <div className="p-4 sm:p-6">
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