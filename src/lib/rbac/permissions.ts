/**
 * RBAC (Role-Based Access Control) System
 *
 * Centralized permission management to replace hardcoded role checks
 * throughout the codebase.
 */

// Permission definitions
export enum Permission {
  // User management
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Course management
  COURSE_VIEW = 'course:view',
  COURSE_CREATE = 'course:create',
  COURSE_UPDATE = 'course:update',
  COURSE_DELETE = 'course:delete',
  COURSE_MANAGE = 'course:manage',

  // Schedule management
  SCHEDULE_VIEW = 'schedule:view',
  SCHEDULE_CREATE = 'schedule:create',
  SCHEDULE_UPDATE = 'schedule:update',
  SCHEDULE_DELETE = 'schedule:delete',

  // Student/Trainee management
  TRAINEE_VIEW = 'trainee:view',
  TRAINEE_CREATE = 'trainee:create',
  TRAINEE_UPDATE = 'trainee:update',
  TRAINEE_DELETE = 'trainee:delete',
  TRAINEE_MANAGE_ATTENDANCE = 'trainee:manage_attendance',
  TRAINEE_MANAGE_GRADES = 'trainee:manage_grades',

  // Instructor management
  INSTRUCTOR_VIEW = 'instructor:view',
  INSTRUCTOR_CREATE = 'instructor:create',
  INSTRUCTOR_UPDATE = 'instructor:update',
  INSTRUCTOR_DELETE = 'instructor:delete',
  INSTRUCTOR_MANAGE_PAYMENT = 'instructor:manage_payment',

  // Evaluation management
  EVALUATION_VIEW = 'evaluation:view',
  EVALUATION_CREATE = 'evaluation:create',
  EVALUATION_UPDATE = 'evaluation:update',
  EVALUATION_DELETE = 'evaluation:delete',
  EVALUATION_SUBMIT = 'evaluation:submit',

  // Exam management
  EXAM_VIEW = 'exam:view',
  EXAM_CREATE = 'exam:create',
  EXAM_UPDATE = 'exam:update',
  EXAM_DELETE = 'exam:delete',
  EXAM_TAKE = 'exam:take',
  EXAM_GRADE = 'exam:grade',

  // Resource management
  RESOURCE_VIEW = 'resource:view',
  RESOURCE_CREATE = 'resource:create',
  RESOURCE_UPDATE = 'resource:update',
  RESOURCE_DELETE = 'resource:delete',
  RESOURCE_RESERVE = 'resource:reserve',

  // Analytics & Reports
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',

  // System management
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_MONITOR = 'system:monitor',
  SYSTEM_BACKUP = 'system:backup',

  // Attendance management
  ATTENDANCE_VIEW = 'attendance:view',
  ATTENDANCE_RECORD = 'attendance:record',
  ATTENDANCE_UPDATE = 'attendance:update',

  // Category & Subject management
  CATEGORY_MANAGE = 'category:manage',
  SUBJECT_MANAGE = 'subject:manage',

  // Common codes
  COMMON_CODE_MANAGE = 'common_code:manage',
}

// Role type definition
export type Role = 'admin' | 'manager' | 'instructor' | 'trainee' | 'guest';

// Role permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin: Full access to all features
  admin: Object.values(Permission),

  // Manager: Can manage courses, schedules, users (except admin role assignment)
  manager: [
    // User management (limited)
    Permission.USER_VIEW,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,

    // Course management
    Permission.COURSE_VIEW,
    Permission.COURSE_CREATE,
    Permission.COURSE_UPDATE,
    Permission.COURSE_DELETE,
    Permission.COURSE_MANAGE,

    // Schedule management
    Permission.SCHEDULE_VIEW,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,

    // Trainee management
    Permission.TRAINEE_VIEW,
    Permission.TRAINEE_CREATE,
    Permission.TRAINEE_UPDATE,
    Permission.TRAINEE_DELETE,
    Permission.TRAINEE_MANAGE_ATTENDANCE,
    Permission.TRAINEE_MANAGE_GRADES,

    // Instructor management
    Permission.INSTRUCTOR_VIEW,
    Permission.INSTRUCTOR_CREATE,
    Permission.INSTRUCTOR_UPDATE,
    Permission.INSTRUCTOR_MANAGE_PAYMENT,

    // Evaluation management
    Permission.EVALUATION_VIEW,
    Permission.EVALUATION_CREATE,
    Permission.EVALUATION_UPDATE,
    Permission.EVALUATION_DELETE,

    // Exam management
    Permission.EXAM_VIEW,
    Permission.EXAM_CREATE,
    Permission.EXAM_UPDATE,
    Permission.EXAM_DELETE,
    Permission.EXAM_GRADE,

    // Resource management
    Permission.RESOURCE_VIEW,
    Permission.RESOURCE_CREATE,
    Permission.RESOURCE_UPDATE,
    Permission.RESOURCE_DELETE,
    Permission.RESOURCE_RESERVE,

    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,

    // Attendance
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_RECORD,
    Permission.ATTENDANCE_UPDATE,

    // Categories
    Permission.CATEGORY_MANAGE,
    Permission.SUBJECT_MANAGE,
    Permission.COMMON_CODE_MANAGE,
  ],

  // Instructor: Can view courses, manage own classes, grade students
  instructor: [
    // Course viewing
    Permission.COURSE_VIEW,
    Permission.SCHEDULE_VIEW,

    // Trainee management (limited)
    Permission.TRAINEE_VIEW,
    Permission.TRAINEE_MANAGE_ATTENDANCE,
    Permission.TRAINEE_MANAGE_GRADES,

    // Evaluation
    Permission.EVALUATION_VIEW,
    Permission.EVALUATION_SUBMIT,

    // Exam management (limited)
    Permission.EXAM_VIEW,
    Permission.EXAM_CREATE,
    Permission.EXAM_UPDATE,
    Permission.EXAM_GRADE,

    // Resource viewing and reservation
    Permission.RESOURCE_VIEW,
    Permission.RESOURCE_RESERVE,

    // Attendance
    Permission.ATTENDANCE_VIEW,
    Permission.ATTENDANCE_RECORD,

    // Analytics (own classes)
    Permission.ANALYTICS_VIEW,
    Permission.REPORT_VIEW,
  ],

  // Trainee: Can view own courses, take exams, submit evaluations
  trainee: [
    // Course viewing
    Permission.COURSE_VIEW,
    Permission.SCHEDULE_VIEW,

    // Evaluation submission
    Permission.EVALUATION_VIEW,
    Permission.EVALUATION_SUBMIT,

    // Exam taking
    Permission.EXAM_VIEW,
    Permission.EXAM_TAKE,

    // Resource viewing
    Permission.RESOURCE_VIEW,

    // Own attendance viewing
    Permission.ATTENDANCE_VIEW,
  ],

  // Guest: Very limited read-only access
  guest: [
    Permission.COURSE_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;

  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role | undefined | null, permissions: Permission[]): boolean {
  if (!role) return false;

  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role | undefined | null, permissions: Permission[]): boolean {
  if (!role) return false;

  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user is admin
 */
export function isAdmin(role: Role | undefined | null): boolean {
  return role === 'admin';
}

/**
 * Check if user is manager or above
 */
export function isManagerOrAbove(role: Role | undefined | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if user is instructor or above
 */
export function isInstructorOrAbove(role: Role | undefined | null): boolean {
  return role === 'admin' || role === 'manager' || role === 'instructor';
}
