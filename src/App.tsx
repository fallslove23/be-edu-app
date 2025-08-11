import React, { useState } from 'react';
import './index.css';
import { ExamManagement } from './components/exam';
import PerformanceTracking from './components/performance/PerformanceTracking';
import Dashboard from './components/dashboard/Dashboard';
import { CourseManagement } from './components/courses';
import { TraineeManagement } from './components/trainees';
import { UserManagement } from './components/users';
import { PracticeEvaluation } from './components/practice';
import { NoticeManagement } from './components/notices';
import { MyCourses, MyExams } from './components/student';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getMenuSections, sectionLabels } from './config/navigation';
import RoleSwitcher from './components/common/RoleSwitcher';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  const menuSections = getMenuSections(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="space-y-4">
              {Object.entries(menuSections).map(([sectionKey, items]) => (
                <div key={sectionKey}>
                  {Object.keys(menuSections).length > 1 && (
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                      {sectionLabels[sectionKey] || sectionKey}
                    </div>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveView(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                          activeView === item.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title={item.description}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
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
        <main className="flex-1 p-4 sm:p-6 md:ml-0">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <Dashboard />}
            
            {/* 관리자/조직장/운영/강사 메뉴 */}
            {activeView === 'users' && <UserManagement />}
            {activeView === 'notices' && <NoticeManagement />}
            {activeView === 'courses' && <CourseManagement />}
            {activeView === 'trainees' && <TraineeManagement />}
            {activeView === 'exams' && <ExamManagement />}
            {activeView === 'practice' && <PracticeEvaluation />}
            {activeView === 'performance' && <PerformanceTracking />}
            
            {/* 교육생 전용 메뉴 */}
            {activeView === 'my-courses' && <MyCourses />}
            {activeView === 'my-exams' && <MyExams />}
            {activeView === 'my-practice' && <div>실습 참여 (개발 예정)</div>}
            {activeView === 'my-progress' && <div>학습 현황 (개발 예정)</div>}
            {activeView === 'notices-view' && <div>공지사항 보기 (개발 예정)</div>}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;