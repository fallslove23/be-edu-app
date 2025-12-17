'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItemsForRole, getMenuSections, sectionLabels, MenuItem } from '../../config/navigation';
import { NavigationIcon } from './NavigationIcons';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ImprovedNavigationProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
  isCollapsed?: boolean;
}

const ImprovedNavigation: React.FC<ImprovedNavigationProps> = ({
  activeView,
  onViewChange,
  isCollapsed = false
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentViews, setRecentViews] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Memoize menu items and sections for better performance
  const menuItems = useMemo(() => {
    if (!user) return [];
    return getMenuItemsForRole(user.role);
  }, [user?.role]);

  const menuSections = useMemo(() => {
    if (!user) return {};
    return getMenuSections(user.role);
  }, [user?.role]);

  // Load favorites and recent views from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedRecent = localStorage.getItem('recentViews');
    const savedFavorites = localStorage.getItem('favorites');

    if (savedRecent) {
      try {
        setRecentViews(JSON.parse(savedRecent));
      } catch {
        setRecentViews([]);
      }
    }

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Update recent views when view changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (activeView && activeView !== 'dashboard') {
      const newRecent = [activeView, ...recentViews.filter(v => v !== activeView)].slice(0, 5);
      setRecentViews(newRecent);
      localStorage.setItem('recentViews', JSON.stringify(newRecent));
    }
  }, [activeView]);

  // Memoize filtered items for search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return menuItems.filter(item =>
      item.label.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  }, [searchTerm, menuItems]);

  // Memoize favorite and recent items
  const favoriteItems = useMemo(() => {
    return favorites
      .map(favId => menuItems.find(item => item.id === favId))
      .filter(Boolean) as MenuItem[];
  }, [favorites, menuItems]);

  const recentItems = useMemo(() => {
    return recentViews
      .map(viewId => menuItems.find(item => item.id === viewId))
      .filter(Boolean) as MenuItem[];
  }, [recentViews, menuItems]);

  // Memoize handlers
  const handleItemClick = useCallback((itemId: string, route?: string, isExternal?: boolean) => {
    if (isExternal && route) {
      window.open(route, '_blank', 'noopener,noreferrer');
    } else {
      onViewChange(itemId);
    }
  }, [onViewChange]);

  const toggleFavorite = useCallback((itemId: string) => {
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];

    setFavorites(newFavorites);
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  }, [favorites]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  if (!user) return null;

  const renderMenuItem = (item: MenuItem, showFavoriteButton: boolean = true) => {
    const isFavorite = favorites.includes(item.id);
    const isActive = activeView === item.id;

    return (
      <div key={item.id} className="relative group/item">
        <button
          onClick={() => handleItemClick(item.id, item.route, item.isExternal)}
          className={`w-full ${isCollapsed ? 'px-0 py-3' : 'px-3 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'
            } ${isActive
              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-primary border border-primary/30 shadow-sm'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border border-transparent'
            }`}
          title={isCollapsed ? item.label : item.description}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
        >
          <div className={`flex-shrink-0 ${isCollapsed ? '' : 'p-1.5 rounded-lg'} ${isActive ? 'bg-primary/10' : 'bg-muted/50'}`}>
            <NavigationIcon
              iconName={item.icon}
              className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          {!isCollapsed && (
            <>
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.isExternal && (
                <svg
                  className="h-3 w-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
              {isActive && <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>}
            </>
          )}
        </button>

        {!isCollapsed && showFavoriteButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-accent rounded focus:outline-none focus:ring-2 focus:ring-primary"
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            {isFavorite ? (
              <StarIconSolid className="h-4 w-4 text-yellow-500" />
            ) : (
              <StarIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}

        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-border">
            {item.label}
          </div>
        )}
      </div>
    );
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '관리자',
      manager: '매니저',
      operator: '운영자',
      instructor: '강사',
      trainee: '교육생'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="h-full flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-white/10 shadow-2xl">
      <div className={`p-4 border-b border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-0' : 'gap-4 mb-6'}`}>
          <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} bg-[#5D5FEF] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20`}>
            <span className="text-white font-bold text-lg">{user.name?.[0]}</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h2 className="font-bold text-white text-xl tracking-tight">{user.name}님</h2>
              <span className="text-xs text-gray-400 font-medium mt-0.5">
                {getRoleDisplayName(user.role)}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="메뉴 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent bg-white/5 text-foreground placeholder:text-muted-foreground transition-all duration-300"
              aria-label="메뉴 검색"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
                aria-label="검색어 지우기"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
        {!searchTerm && favoriteItems.length > 0 && (
          <div className={`${isCollapsed ? 'mb-3' : 'mb-4 pb-3 border-b border-border/50'}`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2 mb-3">
                <StarIconSolid className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  즐겨찾기
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent"></div>
              </div>
            )}
            <div className="space-y-1" role="list" aria-label="즐겨찾기 메뉴">
              {favoriteItems.map((item) => renderMenuItem(item, false))}
            </div>
          </div>
        )}

        {!searchTerm && !isCollapsed && recentItems.length > 0 && (
          <div className="mb-4 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                최근 사용
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent"></div>
            </div>
            <div className="space-y-1" role="list" aria-label="최근 사용 메뉴">
              {recentItems.slice(0, 3).map((item) => renderMenuItem(item))}
            </div>
          </div>
        )}

        {searchTerm && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                검색 결과 ({filteredItems.length})
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent"></div>
            </div>
            <div className="space-y-1" role="search" aria-label="검색 결과">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => renderMenuItem(item))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!searchTerm && (
          <div className="space-y-3">
            {Object.entries(menuSections).map(([section, items]) => (
              <div key={section}>
                {!isCollapsed && (
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {sectionLabels[section] || section}
                    </h3>
                    <div className="flex-1 h-px bg-border/50"></div>
                  </div>
                )}
                <nav className="space-y-0.5" role="navigation" aria-label={sectionLabels[section] || section}>
                  {items.map((item) => renderMenuItem(item))}
                </nav>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between items-center">
              <span>사용자: {getRoleDisplayName(user.role)}</span>
              <span className="text-green-500" aria-label="온라인">●</span>
            </div>
            <div className="text-center text-gray-500">v1.0.0</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedNavigation;
