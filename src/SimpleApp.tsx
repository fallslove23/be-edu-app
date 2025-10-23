import React, { useState } from 'react';
import './index.css';
import Dashboard from './components/dashboard/Dashboard';
import { UserManagement } from './components/users';
import { IntegratedStudentManagement } from './components/students';
import { IntegratedEducationManagement } from './components/education';
import { IntegratedAssessmentManagement } from './components/assessment';
import { IntegratedAnalyticsManagement } from './components/analytics';
import { NoticeManagement, NoticeView } from './components/notices';
import ScheduleManager from './components/operations/ScheduleManager';
import { PracticeSessionView } from './components/practice';
import { MyCourses, MyExams } from './components/student';
import { TraineeDashboard } from './components/trainee';
import { VideoPlayer, AudioPlayer, ImageViewer, MediaViewer } from './components/media';
import { ActivityJournal } from './components/journal';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getMenuSections, sectionLabels, MenuItem } from './config/navigation';
import RoleSwitcher from './components/common/RoleSwitcher';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import OfflineIndicator from './components/common/OfflineIndicator';
import PerformanceDebug from './components/common/PerformanceDebug';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 기본적으로 주요 메뉴들을 펼쳐놓기
  const [collapsedMenus, setCollapsedMenus] = useState<Record<string, boolean>>({
    'education': true,
    'assessment': true,
    'analytics': true,
    'student': true,
    'system': false,
    'my-learning': true
  });
  
  // 성능 모니터링
  const { measureNow } = usePerformanceMonitor('App', {
    loadTime: 5000, // 앱 전체는 5초까지 허용
    renderTime: 200,
    memoryUsage: 100
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  const menuSections = getMenuSections(user.role);

  // 메뉴 토글 처리
  const toggleMenu = (menuId: string) => {
    setCollapsedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // 라우팅 처리 (URL 파라미터 파싱 포함)
  const handleNavigation = (route: string) => {
    if (route.includes('?')) {
      const [baseRoute] = route.split('?');
      setActiveView(baseRoute);
      
      // URL 파라미터를 localStorage에 저장해서 컴포넌트에서 사용할 수 있게 함
      const params = new URLSearchParams(route.split('?')[1]);
      const tab = params.get('tab');
      if (tab) {
        localStorage.setItem(`${baseRoute}_activeTab`, tab);
      }
    } else {
      setActiveView(route);
      localStorage.removeItem(`${route}_activeTab`);
    }
    setSidebarOpen(false);
  };

  // 현재 활성화된 하위 메뉴 확인
  const isSubMenuActive = (subRoute: string, parentRoute: string) => {
    if (!subRoute) return false;
    
    if (subRoute.includes('?')) {
      const [baseRoute, params] = subRoute.split('?');
      const urlParams = new URLSearchParams(params);
      const tab = urlParams.get('tab');
      const currentTab = localStorage.getItem(`${activeView}_activeTab`);
      return activeView === baseRoute && currentTab === tab;
    }
    
    return activeView === subRoute;
  };

  return (
    <div className="min-h-screen bg-gray-50 scroll-smooth">
      {/* 오프라인 인디케이터 */}
      <OfflineIndicator />
      
      {/* 성능 디버그 패널 (개발 모드 전용) */}
      <PerformanceDebug />
      
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 mr-3"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">🎯 BS 학습 관리 시스템</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserCircleIcon className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
              <RoleSwitcher />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <nav className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:relative z-40 w-64 bg-white shadow-lg md:shadow-sm border-r border-gray-200 min-h-screen transition-transform duration-300 ease-in-out
        `}>
          <div className="p-4">
            <div className="space-y-2">
              {Object.entries(menuSections).map(([sectionKey, items]) => (
                <div key={sectionKey}>
                  {Object.keys(menuSections).length > 1 && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                      {sectionLabels[sectionKey] || sectionKey}
                    </div>
                  )}
                  <div className="space-y-1">
                    {items.map((item: MenuItem) => (
                      <div key={item.id}>
                        {/* 메인 메뉴 항목 */}
                        <button
                          onClick={() => {
                            if (item.isCollapsible) {
                              toggleMenu(item.id);
                            } else if (item.route) {
                              handleNavigation(item.route);
                            } else {
                              handleNavigation(item.id);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                            activeView === item.id
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title={item.description}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {item.isCollapsible && (
                            <span className="ml-2">
                              {collapsedMenus[item.id] ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </button>

                        {/* 하위 메뉴 항목들 */}
                        {item.isCollapsible && item.subItems && collapsedMenus[item.id] && (
                          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100">
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => handleNavigation(subItem.route || subItem.id)}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center space-x-3 text-sm ${
                                  isSubMenuActive(subItem.route || subItem.id, item.id)
                                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                title={subItem.description}
                              >
                                <span className="text-base">{subItem.icon}</span>
                                <span className="font-medium">{subItem.label}</span>
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
        <main className="flex-1 p-4 sm:p-6 md:ml-0 safe-bottom">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <Dashboard />}
            
            {/* 관리자/조직장/운영/강사 메뉴 */}
            {activeView === 'users' && <UserManagement />}
            {activeView === 'notices' && <NoticeManagement />}
            {/* 교육 운영 관리 - 하위 메뉴들도 같은 컴포넌트에서 탭으로 처리 */}
            {activeView === 'education-management' && <IntegratedEducationManagement userRole={user.role} />}
            
            {/* 평가 및 활동 관리 - 하위 메뉴들도 같은 컴포넌트에서 탭으로 처리 */}
            {activeView === 'assessment-management' && <IntegratedAssessmentManagement userRole={user.role} />}
            
            {/* 분석 및 보고서 - 하위 메뉴들도 같은 컴포넌트에서 탭으로 처리 */}
            {activeView === 'analytics-management' && <IntegratedAnalyticsManagement userRole={user.role} />}
            {activeView === 'schedule-management' && <ScheduleManager />}
            
            {/* 교육생 전용 메뉴 */}
            {activeView === 'my-courses' && <MyCourses />}
            {activeView === 'my-exams' && <MyExams />}
            {activeView === 'my-practice' && <PracticeSessionView practice={null} onBack={() => {}} />}
            {activeView === 'my-progress' && <TraineeDashboard traineeId={user?.id || ''} />}
            {activeView === 'notices-view' && <NoticeView />}
            
            {/* 미디어 뷰어 (필요시 사용) */}
            {activeView === 'media-viewer' && <MediaViewer files={[]} />}
            
            {/* BS 활동 점검 */}
            {activeView === 'bs-activity' && <ActivityJournal />}
            
            {/* 교육생 관리 - 하위 메뉴들도 같은 컴포넌트에서 탭으로 처리 */}
            {activeView === 'student-management' && <IntegratedStudentManagement />}
          </div>
        </main>
      </div>
    </div>
  );
};

function SimpleApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default SimpleApp;