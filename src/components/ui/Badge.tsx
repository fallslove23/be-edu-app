import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * 공통 Badge 컴포넌트
 * 상태, 카테고리 등을 표시하는 뱃지
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-indigo-100 text-indigo-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * 뱃지 내용
   */
  children: React.ReactNode;
  /**
   * 좌측 아이콘
   */
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, icon, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={badgeVariants({ variant, size, className })}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
