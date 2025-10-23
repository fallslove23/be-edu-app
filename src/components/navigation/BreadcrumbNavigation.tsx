import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { NavigationIcon } from './NavigationIcons';
import { getAllMenuItems } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
}

interface BreadcrumbNavigationProps {
  activeView: string;
  onViewChange: (viewId: string) => void;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  activeView,
  onViewChange
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const allMenuItems = getAllMenuItems(user.role);
  const currentItem = allMenuItems.find(item => item.id === activeView);

  // Build breadcrumb trail
  const breadcrumbs: BreadcrumbItem[] = [
    {
      id: 'dashboard',
      label: '홈',
      onClick: () => onViewChange('dashboard')
    }
  ];

  if (currentItem && currentItem.id !== 'dashboard') {
    breadcrumbs.push({
      id: currentItem.id,
      label: currentItem.label,
      icon: currentItem.icon
    });
  }

  // Don't show breadcrumbs for dashboard or if only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1.5 text-sm text-gray-600 dark:text-gray-400 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3">
      {breadcrumbs.map((item, index) => (
        <div key={item.id} className="contents">
          {index > 0 && (
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
          )}
          
          <div className="flex items-center space-x-1">
            {item.id === 'dashboard' ? (
              <HomeIcon className="h-3.5 w-3.5" />
            ) : item.icon ? (
              <NavigationIcon iconName={item.icon} className="h-3.5 w-3.5" />
            ) : null}
            
            {item.onClick && index < breadcrumbs.length - 1 ? (
              <button
                onClick={item.onClick}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                {item.label}
              </button>
            ) : (
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {item.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;