/**
 * Design System - Color Tokens
 *
 * Centralized color management with dark mode support.
 * Replaces hardcoded Tailwind classes throughout the codebase.
 */

/**
 * Status Colors
 * Used for status indicators, badges, and alerts
 */
export const statusColors = {
  // Active/Success states
  active: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
  },

  // Inactive/Disabled states
  inactive: {
    bg: 'bg-gray-100 dark:bg-gray-800/30',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-800/50',
  },

  // Pending/In Progress states
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
  },
  inProgress: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
  },

  // Warning states
  warning: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    hover: 'hover:bg-orange-200 dark:hover:bg-orange-900/50',
  },

  // Error/Danger states
  error: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    hover: 'hover:bg-red-200 dark:hover:bg-red-900/50',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    hover: 'hover:bg-red-200 dark:hover:bg-red-900/50',
  },

  // Info states
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
  },

  // Completed states
  completed: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
  },

  // Cancelled/Rejected states
  cancelled: {
    bg: 'bg-gray-100 dark:bg-gray-800/30',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-800/50',
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    hover: 'hover:bg-red-200 dark:hover:bg-red-900/50',
  },

  // Approved states
  approved: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
  },

  // Scheduled states
  scheduled: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
  },

  // Draft states
  draft: {
    bg: 'bg-gray-100 dark:bg-gray-800/30',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-800/50',
  },
};

/**
 * Button Colors
 * Primary, secondary, and action buttons
 */
export const buttonColors = {
  primary: {
    bg: 'bg-blue-600 dark:bg-blue-500',
    text: 'text-white',
    hover: 'hover:bg-blue-700 dark:hover:bg-blue-600',
    active: 'active:bg-blue-800 dark:active:bg-blue-700',
    disabled: 'disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500',
  },
  secondary: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    text: 'text-gray-900 dark:text-gray-100',
    hover: 'hover:bg-gray-300 dark:hover:bg-gray-600',
    active: 'active:bg-gray-400 dark:active:bg-gray-500',
    disabled: 'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400',
  },
  success: {
    bg: 'bg-green-600 dark:bg-green-500',
    text: 'text-white',
    hover: 'hover:bg-green-700 dark:hover:bg-green-600',
    active: 'active:bg-green-800 dark:active:bg-green-700',
    disabled: 'disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500',
  },
  danger: {
    bg: 'bg-red-600 dark:bg-red-500',
    text: 'text-white',
    hover: 'hover:bg-red-700 dark:hover:bg-red-600',
    active: 'active:bg-red-800 dark:active:bg-red-700',
    disabled: 'disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500',
  },
  warning: {
    bg: 'bg-orange-600 dark:bg-orange-500',
    text: 'text-white',
    hover: 'hover:bg-orange-700 dark:hover:bg-orange-600',
    active: 'active:bg-orange-800 dark:active:bg-orange-700',
    disabled: 'disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500',
  },
  ghost: {
    bg: 'bg-transparent',
    text: 'text-gray-700 dark:text-gray-300',
    hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    active: 'active:bg-gray-200 dark:active:bg-gray-700',
    disabled: 'disabled:text-gray-400 dark:disabled:text-gray-600',
  },
};

/**
 * Background Colors
 * Page, card, and container backgrounds
 */
export const backgroundColors = {
  page: 'bg-gray-50 dark:bg-gray-900',
  card: 'bg-white dark:bg-gray-800',
  cardHover: 'hover:bg-gray-50 dark:hover:bg-gray-750',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg',
  muted: 'bg-gray-100 dark:bg-gray-800',
  overlay: 'bg-black/50 dark:bg-black/70',
};

/**
 * Text Colors
 * Primary, secondary, and muted text
 */
export const textColors = {
  primary: 'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-700 dark:text-gray-300',
  muted: 'text-gray-500 dark:text-gray-400',
  placeholder: 'text-gray-400 dark:text-gray-500',
  disabled: 'text-gray-400 dark:text-gray-600',
  link: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
  linkVisited: 'text-purple-600 dark:text-purple-400',
};

/**
 * Border Colors
 * Default, focus, and error borders
 */
export const borderColors = {
  default: 'border-gray-200 dark:border-gray-700',
  hover: 'hover:border-gray-300 dark:hover:border-gray-600',
  focus: 'focus:border-blue-500 dark:focus:border-blue-400',
  error: 'border-red-500 dark:border-red-400',
  success: 'border-green-500 dark:border-green-400',
  divider: 'border-gray-200 dark:border-gray-700',
};

/**
 * Course/Education Status Colors
 */
export const courseStatusColors = {
  planned: statusColors.draft,
  recruiting: statusColors.inProgress,
  inProgress: statusColors.inProgress,
  completed: statusColors.completed,
  cancelled: statusColors.cancelled,
};

/**
 * Attendance Status Colors
 */
export const attendanceStatusColors = {
  present: statusColors.success,
  absent: statusColors.error,
  late: statusColors.warning,
  excused: statusColors.info,
};

/**
 * Grade/Score Colors
 */
export const gradeColors = {
  excellent: statusColors.success, // A: 90-100
  good: statusColors.info, // B: 80-89
  average: statusColors.warning, // C: 70-79
  poor: statusColors.error, // D/F: <70
};

/**
 * Priority Colors
 */
export const priorityColors = {
  high: statusColors.error,
  medium: statusColors.warning,
  low: statusColors.info,
  none: statusColors.inactive,
};

/**
 * Utility function to get status color
 */
export function getStatusColor(status: string) {
  const normalizedStatus = status.toLowerCase().replace(/[_-]/g, '');

  // Map common status strings to color tokens
  const statusMap: Record<string, keyof typeof statusColors> = {
    active: 'active',
    success: 'success',
    inactive: 'inactive',
    disabled: 'inactive',
    pending: 'pending',
    inprogress: 'inProgress',
    processing: 'inProgress',
    warning: 'warning',
    error: 'error',
    danger: 'danger',
    failed: 'error',
    info: 'info',
    completed: 'completed',
    done: 'completed',
    finished: 'completed',
    cancelled: 'cancelled',
    rejected: 'rejected',
    approved: 'approved',
    scheduled: 'scheduled',
    draft: 'draft',
  };

  const colorKey = statusMap[normalizedStatus];
  return colorKey ? statusColors[colorKey] : statusColors.inactive;
}

/**
 * Export all color tokens
 */
export const colors = {
  status: statusColors,
  button: buttonColors,
  background: backgroundColors,
  text: textColors,
  border: borderColors,
  courseStatus: courseStatusColors,
  attendance: attendanceStatusColors,
  grade: gradeColors,
  priority: priorityColors,
};

export default colors;
