'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ImprovedNavigation from '@/components/navigation/ImprovedNavigation';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

// Dynamic imports with Next.js - Fixed for Next.js 15
const DashboardWrapper = dynamic(() => import('@/components/dashboard/DashboardWrapper').then(mod => mod.default), { ssr: false });
const CourseManagementTabs = dynamic(() => import('@/components/courses/CourseManagementTabs').then(mod => mod.default), { ssr: false });
const TraineeManagement = dynamic(() => import('@/components/trainees/TraineeManagement').then(mod => mod.default), { ssr: false });
const UserManagement = dynamic(() => import('@/components/users/UserManagement').then(mod => mod.default), { ssr: false });
const InstructorManagement = dynamic(() => import('@/components/admin/InstructorManagement').then(mod => mod.default), { ssr: false });
const BSActivitiesManagement = dynamic(() => import('@/components/bs-activities/BSActivityManagement').then(mod => mod.default), { ssr: false });
const StudentActivityJournal = dynamic(() => import('@/components/bs-activities/StudentActivityJournal').then(mod => mod.default), { ssr: false });
const ExamManagement = dynamic(() => import('@/components/exam/ExamManagement').then(mod => mod.default), { ssr: false });
const EvaluationManagementComplete = dynamic(() => import('@/components/evaluation/EvaluationManagementComplete').then(mod => mod.default), { ssr: false });
const EvaluationTemplateManagement = dynamic(() => import('@/components/evaluation/EvaluationTemplateManagement').then(mod => mod.default), { ssr: false });
const InstructorEvaluationPage = dynamic(() => import('@/components/evaluation/InstructorEvaluationPage').then(mod => mod.default), { ssr: false });
const ComprehensiveGradesPage = dynamic(() => import('@/components/evaluation/ComprehensiveGradesPage').then(mod => mod.default), { ssr: false });
const IntegratedAnalyticsManagement = dynamic(() => import('@/components/analytics/IntegratedAnalyticsManagement').then(mod => mod.default), { ssr: false });
const IntegratedScheduleManager = dynamic(() => import('@/components/schedule/IntegratedScheduleManager').then(mod => mod.default), { ssr: false });
const CurriculumManager = dynamic(() => import('@/components/schedule/CurriculumManager').then(mod => mod.default), { ssr: false });
const CategoryManagement = dynamic(() => import('@/components/admin/CategoryManagement').then(mod => mod.default), { ssr: false });
const SubjectManagement = dynamic(() => import('@/components/admin/SubjectManagement').then(mod => mod.default), { ssr: false });
const ClassroomManagement = dynamic(() => import('@/components/admin/ClassroomManagement').then(mod => mod.default), { ssr: false });
const InstructorPaymentManagement = dynamic(() => import('@/components/admin/InstructorPaymentManagement').then(mod => mod.default), { ssr: false });
const NoticeManagement = dynamic(() => import('@/components/notices/NoticeManagement').then(mod => mod.default), { ssr: false });
const SecurityDashboard = dynamic(() => import('@/components/security/SecurityDashboard').then(mod => mod.default), { ssr: false });
const AdvancedPWA = dynamic(() => import('@/components/pwa/AdvancedPWA').then(mod => mod.default), { ssr: false });
const AdvancedFileManager = dynamic(() => import('@/components/files/AdvancedFileManager').then(mod => mod.default), { ssr: false });
const MaterialsLibrary = dynamic(() => import('@/components/materials/MaterialsLibrary').then(mod => mod.default), { ssr: false });
const MaterialsUpload = dynamic(() => import('@/components/materials/MaterialsUpload').then(mod => mod.default), { ssr: false });
const MaterialsCategories = dynamic(() => import('@/components/materials/MaterialsCategories').then(mod => mod.default), { ssr: false });
const MaterialsDistribution = dynamic(() => import('@/components/materials/MaterialsDistribution').then(mod => mod.default), { ssr: false });
const IntegratedAttendanceManagement = dynamic(() => import('@/components/attendance/IntegratedAttendanceManagement').then(mod => mod.default), { ssr: false });

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">로딩 중...</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // 기본값: 펼쳐진 상태

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Load sidebar preferences
    const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');

    // 저장된 값이 없으면 기본값(true) 사용
    if (savedSidebarCollapsed !== null) {
      setSidebarCollapsed(savedSidebarCollapsed === 'true');
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
      router.push('/login');
    }
  };



  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', String(newCollapsed));
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardWrapper onNavigate={setActiveView} />;
      case 'course-management':
        return <CourseManagementTabs />;
      case 'trainees':
        return <TraineeManagement />;
      case 'users':
        return <UserManagement />;
      case 'instructor-management':
        return <InstructorManagement />;
      case 'bs-activities-management':
        return <BSActivitiesManagement />;
      case 'activity-journal':
        return <StudentActivityJournal />;
      case 'exams':
        return <ExamManagement />;
      case 'practice':
        return <EvaluationManagementComplete />;
      case 'evaluation-templates':
        return <EvaluationTemplateManagement />;
      case 'instructor-evaluation':
        return <InstructorEvaluationPage />;
      case 'comprehensive-grades':
        return <ComprehensiveGradesPage />;
      case 'analytics':
      case 'statistics':
        return <IntegratedAnalyticsManagement />;
      case 'schedule-management':
        return <IntegratedScheduleManager />;
      case 'curriculum-management':
        return <CurriculumManager />;
      case 'category-management':
        return <CategoryManagement />;
      case 'subject-management':
        return <SubjectManagement />;
      case 'classroom-management':
        return <ClassroomManagement />;
      case 'instructor-payment':
        return <InstructorPaymentManagement />;
      case 'notices':
        return <NoticeManagement />;
      case 'security-dashboard':
        return <SecurityDashboard />;
      case 'advanced-pwa':
        return <AdvancedPWA />;
      case 'advanced-file-manager':
        return <AdvancedFileManager />;
      case 'materials-library':
        return <MaterialsLibrary />;
      case 'materials-upload':
        return <MaterialsUpload />;
      case 'materials-categories':
        return <MaterialsCategories />;
      case 'materials-distribution':
        return <MaterialsDistribution />;
      case 'attendance':
        return <IntegratedAttendanceManagement />;
      default:
        return <DashboardWrapper onNavigate={setActiveView} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Desktop Sidebar - Collapsible */}
      <aside
        className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
      >
        <div className="w-full h-full flex flex-col border-r border-border bg-card">
          <ImprovedNavigation
            activeView={activeView}
            onViewChange={setActiveView}
            isCollapsed={sidebarCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Sidebar - Hidden by default, toggled by hamburger */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">메뉴</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <XMarkIcon className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
            <ImprovedNavigation
              activeView={activeView}
              onViewChange={(view) => {
                setActiveView(view);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border z-30 safe-area-padding">
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Mobile Menu Toggle - Only visible on small screens */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary mobile-button"
                  aria-label="메뉴 열기"
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                </button>

                {/* Desktop Sidebar Toggle - Only visible on medium+ screens */}
                <button
                  onClick={toggleSidebar}
                  className="hidden md:block p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                  title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
                >
                  {sidebarCollapsed ? (
                    <ChevronRightIcon className="w-6 h-6 text-foreground" />
                  ) : (
                    <ChevronLeftIcon className="w-6 h-6 text-foreground" />
                  )}
                </button>

                {/* Logo & Title */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-primary-foreground font-bold text-base sm:text-lg">BS</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-base sm:text-lg font-bold text-foreground">
                      BS 학습 관리 시스템
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      {user.role === 'admin' ? '관리자' : user.role === 'instructor' ? '강사' : '교육생'}
                    </p>
                  </div>
                  {/* Mobile Title - Only show on small screens */}
                  <div className="sm:hidden">
                    <h1 className="text-sm font-bold text-foreground">BS 학습</h1>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary mobile-button"
                  title={`테마 변경 (${theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템 설정'})`}
                >
                  {theme === 'light' ? (
                    <SunIcon className="w-5 h-5" />
                  ) : theme === 'dark' ? (
                    <MoonIcon className="w-5 h-5" />
                  ) : (
                    <ComputerDesktopIcon className="w-5 h-5" />
                  )}
                </button>

                {/* Notifications - Hidden on mobile */}
                <button className="hidden sm:flex p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary">
                  <BellIcon className="w-5 h-5" />
                </button>

                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3 pl-3 border-l border-border">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.department}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {user.name.charAt(0)}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-destructive mobile-button"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline font-medium text-sm">로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView}
        onViewChange={setActiveView}
      />
    </div>
  );
}
