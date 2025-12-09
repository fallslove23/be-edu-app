import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { roleLabels } from '@/types/auth.types';
import type { UserRole } from '@/types/auth.types';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  const roles: UserRole[] = ['admin', 'instructor', 'trainee'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      >
        <UserCircleIcon className="h-4 w-4" />
        <span>{roleLabels[user.role]}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    switchRole(role);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    user.role === role ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoleSwitcher;