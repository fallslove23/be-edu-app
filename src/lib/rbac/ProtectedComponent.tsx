/**
 * Protected Component Wrapper
 *
 * Conditionally renders children based on user permissions.
 */

import React from 'react';
import { Permission } from './permissions';
import { usePermission, useAnyPermission, useAllPermissions } from './usePermission';

interface ProtectedComponentProps {
  children: React.ReactNode;
  /**
   * Single permission required to view this component
   */
  permission?: Permission;
  /**
   * Array of permissions - user needs ANY of these to view
   */
  anyPermissions?: Permission[];
  /**
   * Array of permissions - user needs ALL of these to view
   */
  allPermissions?: Permission[];
  /**
   * Fallback content to show when user doesn't have permission
   */
  fallback?: React.ReactNode;
}

/**
 * Protected Component - Only renders children if user has required permissions
 *
 * @example
 * // Single permission
 * <ProtectedComponent permission={Permission.COURSE_CREATE}>
 *   <CreateCourseButton />
 * </ProtectedComponent>
 *
 * @example
 * // Any permission
 * <ProtectedComponent anyPermissions={[Permission.COURSE_UPDATE, Permission.COURSE_DELETE]}>
 *   <CourseActions />
 * </ProtectedComponent>
 *
 * @example
 * // All permissions
 * <ProtectedComponent allPermissions={[Permission.USER_CREATE, Permission.USER_MANAGE_ROLES]}>
 *   <AdminUserActions />
 * </ProtectedComponent>
 *
 * @example
 * // With fallback
 * <ProtectedComponent permission={Permission.ADMIN_ONLY} fallback={<p>관리자 전용</p>}>
 *   <AdminPanel />
 * </ProtectedComponent>
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
}) => {
  const hasSinglePermission = usePermission(permission!);
  const hasAny = useAnyPermission(anyPermissions || []);
  const hasAll = useAllPermissions(allPermissions || []);

  // Check permissions based on what was provided
  let hasAccess = false;

  if (permission) {
    hasAccess = hasSinglePermission;
  } else if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAny;
  } else if (allPermissions && allPermissions.length > 0) {
    hasAccess = hasAll;
  } else {
    // No permissions specified, render children by default
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
