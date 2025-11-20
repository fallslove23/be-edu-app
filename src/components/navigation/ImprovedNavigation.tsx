import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItemsForRole, MenuItem } from '../../config/navigation';
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
  }, [activeView]);

  if (!user) return null;

  const menuItems = getMenuItemsForRole(user.role);
  
  
  // Flatten all menu items for search
  const allMenuItems: MenuItem[] = [];
  const flattenItems = (items: MenuItem[]) => {
    items.forEach(item => {
      if (!item.isCategory) {
        allMenuItems.push(item);
      }
      if (item.subItems) {
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
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-0' : 'space-x-3 mb-4'}`}>
          <div className={`${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'} bg-blue-600 rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">BS</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">학습 관리</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.name}</p>
            </div>
          )}
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="메뉴 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
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
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              최근 사용
            </h3>
            <div className="space-y-1">
              {getRecentItems().slice(0, 3).map((item) => (
                <button
                  key={`recent-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-full text-sm transition-colors flex items-center space-x-3 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  title={item.description}
                >
                  <NavigationIcon 
                    iconName={item.icon} 
                    className={`h-4 w-4 ${activeView === item.id ? 'text-white' : 'text-gray-400'}`} 
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              검색 결과 ({filteredItems.length})
            </h3>
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <button
                  key={`search-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-full text-sm transition-colors flex items-center space-x-3 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  title={item.description}
                >
                  <NavigationIcon 
                    iconName={item.icon} 
                    className={`h-4 w-4 ${activeView === item.id ? 'text-white' : 'text-gray-400'}`} 
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Regular Menu */}
        {!searchTerm && (
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.isCategory && item.subItems ? (
                  // Category with sub-items
                  <div>
                    <button
                      onClick={() => !isCollapsed && toggleCategory(item.id)}
                      className={`w-full ${isCollapsed ? 'px-0 py-3' : 'px-3 py-2'} rounded-lg text-sm font-medium transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-foreground hover:bg-muted relative group`}
                      title={item.description}
                    >
                      <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                        <NavigationIcon iconName={item.icon} className="h-5 w-5 text-gray-500" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>
                      {!isCollapsed && (
                        expandedCategories.has(item.id)
                          ? <ChevronDownIcon className="h-4 w-4" />
                          : <ChevronRightIcon className="h-4 w-4" />
                      )}
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-max">
                          <div className="font-semibold mb-2 border-b border-gray-600 pb-1">{item.label}</div>
                          <div className="space-y-1">
                            {item.subItems.map((subItem) => (
                              <div key={subItem.id} className="text-gray-300 hover:text-white whitespace-nowrap">
                                {subItem.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                    
                    {(!isCollapsed && expandedCategories.has(item.id)) && (
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => handleItemClick(subItem.id, subItem.route, subItem.isExternal)}
                            className={`w-full text-left px-3 py-2 rounded-full text-sm transition-colors flex items-center space-x-3 ${
                              activeView === subItem.id
                                ? 'bg-blue-600 text-white'
                                : 'text-foreground hover:bg-muted'
                            }`}
                            title={subItem.description}
                          >
                            <NavigationIcon
                              iconName={subItem.icon}
                              className={`h-4 w-4 ${activeView === subItem.id ? 'text-white' : 'text-gray-400'}`}
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
                    className={`w-full ${isCollapsed ? 'px-0 py-3' : 'px-3 py-2'} rounded-lg text-sm font-medium transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                      activeView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-foreground hover:bg-muted'
                    } relative group`}
                    title={item.description}
                  >
                    <NavigationIcon
                      iconName={item.icon}
                      className={`h-5 w-5 ${activeView === item.id ? 'text-white' : 'text-gray-500'}`}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
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