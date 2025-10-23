import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useDeviceType } from '../common/MobileOptimizer';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const primaryNavigation: NavigationItem[] = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '교육생', href: '/trainees', icon: UserGroupIcon },
  { name: '과정', href: '/courses', icon: AcademicCapIcon },
  { name: '분석', href: '/analytics', icon: ChartBarIcon },
  { name: '설정', href: '/settings', icon: Cog6ToothIcon },
];

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { isMobile, isTablet } = useDeviceType();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // 모바일에서 라우트 변경 시 메뉴 닫기
  useEffect(() => {
    if (isMobile) {
      setIsMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // 메뉴 토글
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 현재 페이지 확인
  const isCurrentPage = (href: string) => {
    return location.pathname === href;
  };

  if (!isMobile && !isTablet) {
    return null; // 데스크톱에서는 기존 네비게이션 사용
  }

  return (
    <>
      {/* 모바일 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="safe-area-padding">
          <div className="flex items-center justify-between h-16 px-4">
            {/* 로고 및 메뉴 버튼 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMenu}
                className="mobile-button p-2 rounded-lg icon-hover-neutral touch-manipulation"
                aria-label="메뉴 열기"
              >
                <Bars3Icon className="h-6 w-6 icon-neutral" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                BS 학습앱
              </h1>
            </div>

            {/* 헤더 액션 */}
            <div className="flex items-center space-x-2">
              {/* 알림 버튼 */}
              <button className="mobile-button relative p-2 rounded-lg icon-hover-neutral touch-manipulation">
                <BellIcon className="h-6 w-6 icon-neutral" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  </span>
                )}
              </button>

              {/* 사용자 프로필 */}
              <button className="mobile-button p-2 rounded-lg icon-hover-neutral touch-manipulation">
                <UserIcon className="h-6 w-6 icon-neutral" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 사이드 메뉴 오버레이 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        >
          {/* 사이드 메뉴 */}
          <div
            className="fixed left-0 top-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-out safe-area-padding scroll-touch"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 메뉴 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-bs-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">BS</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">학습 관리</h2>
                  <p className="text-sm text-gray-600">관리자</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="mobile-button p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-manipulation"
                aria-label="메뉴 닫기"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* 네비게이션 메뉴 */}
            <nav className="flex-1 px-4 py-4 space-y-2">
              {primaryNavigation.map((item) => {
                const current = isCurrentPage(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      mobile-button flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors touch-manipulation
                      ${current
                        ? 'bg-bs-blue-50 text-bs-blue-700 border border-bs-blue-200'
                        : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <item.icon className={`
                      mr-3 h-6 w-6 flex-shrink-0
                      ${current ? 'text-bs-blue-500' : 'text-gray-400'}
                    `} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* 메뉴 푸터 */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>버전 1.0.0</span>
                <span>오프라인 준비됨</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 탭 네비게이션 (아주 작은 화면용) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-padding">
          <div className="grid grid-cols-5 h-16">
            {primaryNavigation.slice(0, 5).map((item) => {
              const current = isCurrentPage(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    mobile-button flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors touch-manipulation
                    ${current ? 'text-bs-blue-600' : 'text-gray-600'}
                  `}
                >
                  <item.icon className={`
                    h-5 w-5
                    ${current ? 'text-bs-blue-600' : 'text-gray-400'}
                  `} />
                  <span className="truncate w-full text-center">
                    {item.name}
                  </span>
                  {current && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-bs-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* 컨텐츠에 하단 패딩 추가 (하단 탭 네비게이션 공간 확보) */}
      {isMobile && <div className="h-16"></div>}
    </>
  );
};

export default MobileNavigation;