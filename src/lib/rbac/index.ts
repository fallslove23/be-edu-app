/**
 * RBAC (Role-Based Access Control) System
 *
 * Centralized exports for permission management
 */

// Permission definitions and utilities
export {
  Permission,
  type Role,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  isAdmin,
  isManagerOrAbove,
  isInstructorOrAbove,
} from './permissions';

// React hooks
export {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useIsAdmin,
  useIsManager,
  useIsInstructor,
  useRole,
} from './usePermission';

// Components
export { ProtectedComponent } from './ProtectedComponent';
