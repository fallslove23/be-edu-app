import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * 공통 Button 컴포넌트
 * 전체 앱에서 일관된 버튼 스타일을 사용하기 위한 컴포넌트
 */

const buttonVariants = cva(
  // Base styles - UI 디자인 시스템 기준 (완전히 둥근 pill 스타일)
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      // 버튼 스타일 변형 (디자인 토큰 사용)
      variant: {
        // Primary 버튼 (메인 액션)
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        // Secondary 버튼 (보조 액션) - 스크린샷 스타일
        secondary: 'border border-border text-foreground hover:bg-muted bg-background',
        // Success 버튼
        success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
        // Danger 버튼 (삭제 등)
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        // Outline 버튼 (스크린샷 스타일 - 기본)
        outline: 'border border-border text-foreground hover:bg-muted bg-background',
        // Ghost 버튼
        ghost: 'text-foreground hover:bg-muted',
        // Link 버튼
        link: 'text-primary hover:text-primary/90 underline-offset-4 hover:underline',
      },
      // 버튼 크기
      size: {
        xs: 'px-2.5 py-1.5 text-xs',
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-5 py-3 text-base',
        xl: 'px-6 py-3.5 text-lg',
      },
      // 버튼 너비
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'outline', // 기본값을 outline으로 변경 (스크린샷 스타일)
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 버튼 내용
   */
  children: React.ReactNode;
  /**
   * 로딩 상태
   */
  isLoading?: boolean;
  /**
   * 좌측 아이콘
   */
  leftIcon?: React.ReactNode;
  /**
   * 우측 아이콘
   */
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, fullWidth, className })}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>처리 중...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
