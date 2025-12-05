/**
 * React hooks for permission checking
 *
 * Provides convenient hooks to check user permissions in components.
 */

import { useAuth } from '@/contexts/AuthContext';
import {
  Permission,
  Role,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isManagerOrAbove,
  isInstructorOrAbove,
} from './permissions';

/**
 * Hook to check if user has a specific permission
 *
 * @example
 * const canCreateCourse = usePermission(Permission.COURSE_CREATE);
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  return hasPermission(user?.role as Role, permission);
}

/**
 * Hook to check if user has any of the specified permissions
 *
 * @example
 * const canManageCourses = useAnyPermission([
 *   Permission.COURSE_CREATE,
 *   Permission.COURSE_UPDATE,
 *   Permission.COURSE_DELETE
 * ]);
 */
export function useAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return hasAnyPermission(user?.role as Role, permissions);
}

/**
 * Hook to check if user has all of the specified permissions
 *
 * @example
 * const canFullyManageUsers = useAllPermissions([
 *   Permission.USER_CREATE,
 *   Permission.USER_UPDATE,
 *   Permission.USER_DELETE
 * ]);
 */
export function useAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return hasAllPermissions(user?.role as Role, permissions);
}

/**
 * Hook to check if user is admin
 *
 * @example
 * const isUserAdmin = useIsAdmin();
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return isAdmin(user?.role as Role);
}

/**
 * Hook to check if user is manager or above
 *
 * @example
 * const isUserManager = useIsManager();
 */
export function useIsManager(): boolean {
  const { user } = useAuth();
  return isManagerOrAbove(user?.role as Role);
}

/**
 * Hook to check if user is instructor or above
 *
 * @example
 * const isUserInstructor = useIsInstructor();
 */
export function useIsInstructor(): boolean {
  const { user } = useAuth();
  return isInstructorOrAbove(user?.role as Role);
}

/**
 * Hook to get user's role
 *
 * @example
 * const userRole = useRole();
 */
export function useRole(): Role | null {
  const { user } = useAuth();
  return (user?.role as Role) || null;
}
