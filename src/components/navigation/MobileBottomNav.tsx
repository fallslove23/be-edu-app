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
        menuItems.find(item => item.id === 'assessment'),
        menuItems.find(item => item.id === 'schedule'),
      ].filter(Boolean) as MenuItem[];
    } else if (['instructor'].includes(user.role)) {
      return [
        ...baseItems,
        menuItems.find(item => item.id === 'course-management'),
        menuItems.find(item => item.id === 'attendance'),
        menuItems.find(item => item.id === 'assessment'),
        menuItems.find(item => item.id === 'schedule'),
      ].filter(Boolean) as MenuItem[];
    } else if (['admin', 'manager', 'operator'].includes(user.role)) {
      return [
        ...baseItems,
        menuItems.find(item => item.id === 'course-management'),
        menuItems.find(item => item.id === 'hr-management'),
        menuItems.find(item => item.id === 'analytics'),
        menuItems.find(item => item.id === 'system'),
      ].filter(Boolean) as MenuItem[];
    }

    return baseItems;
  };

  const mainNavItems = getMainNavItems();

  const handleItemClick = (item: MenuItem) => {
    if (item.isCategory && item.subItems && item.subItems.length > 0) {
      // For category items, navigate to the first sub-item
      onViewChange(item.subItems[0].id);
    } else {
      onViewChange(item.id);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl safe-area-padding"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
      }}
    >
      <div className="grid grid-cols-5 gap-0 max-w-screen-sm mx-auto">
        {mainNavItems.slice(0, 5).map((item) => {
          const isActive = activeView === item.id ||
            (item.subItems && item.subItems.some(sub => sub.id === activeView));

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                flex flex-col items-center justify-center py-2 px-1 min-h-touch
                transition-all duration-200 touch-manipulation
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-primary'
                }
              `}
              title={item.label}
            >
              <div className={`
                relative mb-1 p-2 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-primary/10 scale-110'
                  : 'hover:bg-muted active:scale-95'
                }
              `}>
                <NavigationIcon
                  iconName={item.icon}
                  className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`}
                />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={`
                text-[10px] font-medium truncate w-full text-center
                ${isActive ? 'text-primary' : ''}
              `}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
