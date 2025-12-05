/**
 * Badge Component
 *
 * Reusable badge component for status indicators, labels, and tags.
 * Uses centralized design system colors.
 */

import React from 'react';
import { statusColors, getStatusColor } from '@/design-system/colors';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'active' | 'success' | 'inactive' | 'pending' | 'inProgress'
  | 'warning' | 'error' | 'danger' | 'info' | 'completed'
  | 'cancelled' | 'rejected' | 'approved' | 'scheduled' | 'draft';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Badge content (text or elements)
   */
  children: React.ReactNode;

  /**
   * Predefined color variant
   */
  variant?: BadgeVariant;

  /**
   * Custom status string (will be auto-mapped to colors)
   */
  status?: string;

  /**
   * Badge size
   */
  size?: BadgeSize;

  /**
   * Show dot indicator
   */
  dot?: boolean;

  /**
   * Custom className for additional styling
   */
  className?: string;

  /**
   * Click handler
   */
  onClick?: () => void;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Badge Component
 *
 * @example
 * // With variant
 * <Badge variant="success">활성</Badge>
 *
 * @example
 * // With status (auto-mapped)
 * <Badge status="in_progress">진행중</Badge>
 *
 * @example
 * // With dot indicator
 * <Badge variant="active" dot>활성</Badge>
 *
 * @example
 * // Different sizes
 * <Badge variant="info" size="sm">Small</Badge>
 * <Badge variant="info" size="md">Medium</Badge>
 * <Badge variant="info" size="lg">Large</Badge>
 *
 * @example
 * // Clickable badge
 * <Badge variant="pending" onClick={() => console.log('clicked')}>
 *   클릭 가능
 * </Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  dot = false,
  className,
  onClick,
}) => {
  // Get colors from variant or status
  const colors = variant
    ? statusColors[variant]
    : status
    ? getStatusColor(status)
    : statusColors.inactive;

  const baseClasses = cn(
    'inline-flex items-center gap-1.5 rounded-full font-medium',
    'transition-colors duration-200',
    sizeClasses[size],
    colors.bg,
    colors.text,
    colors.border,
    'border',
    onClick && 'cursor-pointer',
    onClick && colors.hover,
    className
  );

  return (
    <span className={baseClasses} onClick={onClick}>
      {dot && (
        <span
          className={cn(
            'inline-block rounded-full',
            size === 'sm' && 'w-1.5 h-1.5',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-2.5 h-2.5',
            'bg-current opacity-75'
          )}
        />
      )}
      {children}
    </span>
  );
};

/**
 * Utility function to create a badge className string
 * Useful for when you can't use the Badge component
 */
export function getBadgeClasses(
  variant?: BadgeVariant,
  status?: string,
  size: BadgeSize = 'md'
): string {
  const colors = variant
    ? statusColors[variant]
    : status
    ? getStatusColor(status)
    : statusColors.inactive;

  return cn(
    'inline-flex items-center gap-1.5 rounded-full font-medium border',
    sizeClasses[size],
    colors.bg,
    colors.text,
    colors.border
  );
}

export default Badge;
