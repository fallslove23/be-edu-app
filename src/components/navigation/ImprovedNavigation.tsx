'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItemsForRole, MenuItem, SubMenuItem } from '../../config/navigation';
import { NavigationIcon } from './NavigationIcons';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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
  // Initialize with all categories collapsed (empty set)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [recentViews, setRecentViews] = useState<string[]>([]);

  useEffect(() => {
    // Load recent views from localStorage
    const saved = localStorage.getItem('recentViews');
    if (saved) {
      try {
        setRecentViews(JSON.parse(saved));
      } catch {
        setRecentViews([]);
      }
    }
  }, [user]);

  useEffect(() => {
    // Update recent views when view changes
    if (activeView && activeView !== 'dashboard') {
      const newRecent = [activeView, ...recentViews.filter(v => v !== activeView)].slice(0, 5);
      setRecentViews(newRecent);
      localStorage.setItem('recentViews', JSON.stringify(newRecent));
    }

    // Automatically expand the category containing the active view
    const menuItems = getMenuItemsForRole(user?.role || 'trainee');
    const parentCategory = menuItems.find(item =>
      item.isCategory && item.subItems?.some(sub => sub.id === activeView)
    );

    if (parentCategory) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(parentCategory.id);
        return newSet;
      });
    }
  }, [activeView, user]);

  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);

  type NavigationItem = MenuItem | SubMenuItem;

  // Flatten all menu items for search
  const allMenuItems: NavigationItem[] = [];
  const flattenItems = (items: NavigationItem[]) => {
    items.forEach(item => {
      const isCategory = 'isCategory' in item ? item.isCategory : false;
      if (!isCategory) {
        allMenuItems.push(item);
      }
      if ('subItems' in item && item.subItems) {
        flattenItems(item.subItems);
      }
    });
  };
  flattenItems(menuItems);

  // Filter items based on search
  const filteredItems = searchTerm
    ? allMenuItems.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    : menuItems;

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleItemClick = (itemId: string, route?: string, isExternal?: boolean) => {
    if (isExternal && route) {
      // 외부 링크는 새 탭에서 열기
      window.open(route, '_blank', 'noopener,noreferrer');
    } else {
      onViewChange(itemId);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getRecentItems = () => {
    return recentViews.map(viewId =>
      allMenuItems.find(item => item.id === viewId)
    ).filter(Boolean) as MenuItem[];
  };

  return (
    <div className="h-full flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-white/10 shadow-2xl">
      {/* Header */}
      <div className={`p-4 border-b border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-0' : 'space-x-3 mb-4'}`}>
          <div className={`${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">BS</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground text-sm">학습 관리</h2>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          )}
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="메뉴 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-transparent bg-white/5 text-foreground placeholder:text-muted-foreground transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className={`flex-1 overflow-y-auto space-y-2 ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
        {/* Recent Views - only show if no search and there are recent items */}
        {!searchTerm && !isCollapsed && getRecentItems().length > 0 && (
          <div className="mb-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-1 h-4 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                최근 사용
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent"></div>
            </div>
            <div className="space-y-1 bg-muted/30 rounded-xl p-2">
              {getRecentItems().slice(0, 3).map((item) => (
                <button
                  key={`recent-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center space-x-3 ${activeView === item.id
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-primary border border-primary/30 shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border border-transparent'
                    }`}
                  title={item.description}
                >
                  <div className={`flex-shrink-0 p-1.5 rounded-lg ${activeView === item.id ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <NavigationIcon
                      iconName={item.icon}
                      className={`h-4 w-4 ${activeView === item.id ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <span className="truncate font-medium">{item.label}</span>
                  {activeView === item.id && (
                    <div className="ml-auto flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-shrink-0 w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                검색 결과 ({filteredItems.length})
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent"></div>
            </div>
            <div className="space-y-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={`search-${item.id}`}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center space-x-3 ${activeView === item.id
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-primary border border-primary/30 shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border border-transparent'
                      }`}
                    title={item.description}
                  >
                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${activeView === item.id ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      <NavigationIcon
                        iconName={item.icon}
                        className={`h-4 w-4 ${activeView === item.id ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <span className="truncate font-medium">{item.label}</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regular Menu */}
        {!searchTerm && (
          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center gap-2 mb-3 mt-2">
                <div className="flex-shrink-0 w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  전체 메뉴
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent"></div>
              </div>
            )}
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.isCategory && item.subItems ? (
                  // Category with sub-items
                  <div>
                    <button
                      onClick={() => toggleCategory(item.id)}
                      className={`w-full ${isCollapsed ? 'px-0 py-3' : 'px-3 py-2'} rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-muted-foreground hover:bg-white/5 hover:text-foreground relative group hover:translate-x-1`}
                      title={item.description}
                    >
                      <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                        <NavigationIcon iconName={item.icon} className="h-5 w-5 text-muted-foreground" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        expandedCategories.has(item.id)
                          ? <ChevronDownIcon className="h-4 w-4" />
                          : <ChevronRightIcon className="h-4 w-4" />
                      )}
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-max border border-border pointer-events-auto">
                          <div className="font-semibold mb-2 border-b border-border pb-1">{item.label}</div>
                          <div className="space-y-1">
                            {item.subItems.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(subItem.id, subItem.route, subItem.isExternal);
                                }}
                                className="w-full text-left text-muted-foreground hover:text-popover-foreground whitespace-nowrap px-2 py-1 rounded hover:bg-white/5 transition-colors"
                              >
                                {subItem.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>

                    {(!isCollapsed && expandedCategories.has(item.id)) && (
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => handleItemClick(subItem.id, subItem.route, subItem.isExternal)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-300 flex items-center space-x-3 ${activeView === subItem.id
                              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                              }`}
                            title={subItem.description}
                          >
                            <NavigationIcon
                              iconName={subItem.icon}
                              className={`h-4 w-4 ${activeView === subItem.id ? 'text-sidebar-primary-foreground' : 'text-muted-foreground'}`}
                            />
                            <span className="truncate">{subItem.label}</span>
                            {subItem.isExternal && (
                              <svg className="h-3 w-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular menu item
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full ${isCollapsed ? 'px-0 py-3' : 'px-3 py-2'} rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} ${activeView === item.id
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                      } relative group`}
                    title={item.description}
                  >
                    <NavigationIcon
                      iconName={item.icon}
                      className={`h-5 w-5 ${activeView === item.id ? 'text-sidebar-primary-foreground' : 'text-muted-foreground'}`}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-border">
                        {item.label}
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>사용자: {user.role}</span>
              <span className="icon-success-muted">●</span>
            </div>
            <div className="text-center">v1.0.0</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedNavigation;