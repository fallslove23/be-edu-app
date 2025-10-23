import React, { useState } from 'react';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SecureAuthProvider, useAuth } from './contexts/MockAuthContext';

const MinimalAppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  
  console.log('MinimalApp 렌더링:', { isAuthenticated, user: user?.name });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">🎯 BS 학습 관리 시스템</h1>
          <div className="text-sm text-gray-600">사용자: {user?.name}</div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 min-h-screen bg-white border-r border-gray-200">
          <div className="mt-5 px-2">
            <div className="space-y-1">
              {[
                { id: 'dashboard', label: '대시보드', icon: '🏠' },
                { id: 'courses', label: '과정 관리', icon: '📚' },
                { id: 'trainees', label: '교육생 관리', icon: '👥' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="flex-1 p-6">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">📊 대시보드</h2>
                <p className="text-gray-600">대시보드 페이지입니다.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 mb-2">45</div>
                  <div className="text-sm text-gray-600">총 교육생</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600 mb-2">8</div>
                  <div className="text-sm text-gray-600">활성 과정</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-600 mb-2">24</div>
                  <div className="text-sm text-gray-600">완료된 시험</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-orange-600 mb-2">92%</div>
                  <div className="text-sm text-gray-600">평균 출석률</div>
                </div>
              </div>
            </div>
          )}
          
          {activeView === 'courses' && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">📚 과정 관리</h2>
              <p className="text-gray-600">과정 관리 페이지입니다.</p>
            </div>
          )}
          
          {activeView === 'trainees' && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">👥 교육생 관리</h2>
              <p className="text-gray-600">교육생 관리 페이지입니다.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

function MinimalApp() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SecureAuthProvider>
          <MinimalAppContent />
        </SecureAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default MinimalApp;