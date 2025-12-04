'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavigationIcon } from './NavigationIcons';
import { getMenuItemsForRole, MenuItem } from '../../config/navigation';

interface MobileBottomNavProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  // Get menu items for user role
  const menuItems = getMenuItemsForRole(user.role);

  // Define main navigation items for bottom nav based on role
  const getMainNavItems = (): MenuItem[] => {
    const baseItems = [
      menuItems.find(item => item.id === 'dashboard'),
    ].filter(Boolean) as MenuItem[];

    // Add role-specific items
    if (user.role === 'trainee') {
      return [
        ...baseItems,
        menuItems.find(item => item.id === 'activity-journal'),
        menuItems.find(item => item.id === 'my-learning'),
        menuItems.find(item => item.id === 'exams'),
        menuItems.find(item => item.id === 'schedule-management'),
      ].filter(Boolean) as MenuItem[];
    } else if (['instructor'].includes(user.role)) {
      return [
        ...baseItems,
        menuItems.find(item => item.id === 'course-management'),
        menuItems.find(item => item.id === 'attendance'),
        menuItems.find(item => item.id === 'exams'),
        menuItems.find(item => item.id === 'schedule-management'),
      ].filter(Boolean) as MenuItem[];
    } else if (['admin', 'manager', 'operator'].includes(user.role)) {
      return [
        ...baseItems,
        menuItems.find(item => item.id === 'course-management'),
        menuItems.find(item => item.id === 'trainees'),
        menuItems.find(item => item.id === 'analytics'),
      ].filter(Boolean) as MenuItem[];
    }

    return baseItems;
  };

  const mainNavItems = getMainNavItems();

  // Get remaining menu items for "More" menu
  const getMoreMenuItems = (): MenuItem[] => {
    const mainIds = mainNavItems.map(item => item.id);
    return menuItems.filter(item => !mainIds.includes(item.id));
  };

  const moreMenuItems = getMoreMenuItems();

  const handleItemClick = (item: MenuItem) => {
    if (item.isCategory && item.subItems && item.subItems.length > 0) {
      // For category items, navigate to the first sub-item
      onViewChange(item.subItems[0].id);
    } else {
      onViewChange(item.id);
    }
    setShowMoreMenu(false);
  };

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  return (
    <>
      {/* More Menu Modal */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="absolute bottom-16 left-0 right-0 bg-card border-t border-border shadow-2xl rounded-t-3xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-lg font-semibold text-foreground">전체 메뉴</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {moreMenuItems.map((item) => {
                const isActive = activeView === item.id ||
                  (item.subItems && item.subItems.some(sub => sub.id === activeView));

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-2xl
                      transition-all duration-300 touch-manipulation
                      ${isActive
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                      }
                    `}
                  >
                    <div className={`mb-2 p-2.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : 'bg-background/50'}`}>
                      <NavigationIcon
                        iconName={item.icon}
                        className="w-6 h-6"
                      />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight line-clamp-2">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl safe-area-padding"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
        <div className="grid grid-cols-5 gap-0 max-w-screen-sm mx-auto">
          {mainNavItems.slice(0, 4).map((item) => {
            const isActive = activeView === item.id ||
              (item.subItems && item.subItems.some(sub => sub.id === activeView));

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 min-h-touch
                  transition-all duration-300 touch-manipulation relative group
                  ${isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
                title={item.label}
              >
                <div className={`
                  relative mb-1 p-2 rounded-xl transition-all duration-300
                  ${isActive
                    ? 'bg-primary/10 scale-100 shadow-sm shadow-primary/10'
                    : 'hover:bg-muted/50 active:scale-95'
                  }
                `}>
                  <NavigationIcon
                    iconName={item.icon}
                    className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                  />
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse-slow"></span>
                  )}
                </div>
                <span className={`
                  text-[10px] font-medium truncate w-full text-center leading-tight transition-colors duration-300
                  ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground/80 group-hover:text-foreground'}
                `}>
                  {item.label}
                </span>

                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
                )}
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={handleMoreClick}
            className={`
              flex flex-col items-center justify-center py-2 px-1 min-h-touch
              transition-all duration-300 touch-manipulation relative group
              ${showMoreMenu
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
            title="더보기"
          >
            <div className={`
              relative mb-1 p-2 rounded-xl transition-all duration-300
              ${showMoreMenu
                ? 'bg-primary/10 scale-100 shadow-sm shadow-primary/10'
                : 'hover:bg-muted/50 active:scale-95'
              }
            `}>
              <svg
                className={`w-5 h-5 transition-all duration-300 ${showMoreMenu ? 'text-primary rotate-180' : 'text-muted-foreground group-hover:text-foreground'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {showMoreMenu && (
                <span className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse-slow"></span>
              )}
            </div>
            <span className={`
              text-[10px] font-medium truncate w-full text-center leading-tight transition-colors duration-300
              ${showMoreMenu ? 'text-primary font-semibold' : 'text-muted-foreground/80 group-hover:text-foreground'}
            `}>
              더보기
            </span>

            {/* Active Indicator Bar */}
            {showMoreMenu && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
