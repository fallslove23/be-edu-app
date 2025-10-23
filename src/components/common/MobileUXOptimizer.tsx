import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface MobileUXOptimizerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export const MobileUXOptimizer: React.FC<MobileUXOptimizerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  enablePullToRefresh = false,
  onRefresh,
  className = ''
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);

  // 스와이프 핸들러 설정
  const handlers = useSwipeable({
    onSwipedLeft: () => onSwipeLeft?.(),
    onSwipedRight: () => onSwipeRight?.(),
    preventScrollOnSwipe: false,
    trackMouse: false, // 모바일 전용
  });

  // Pull to refresh 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enablePullToRefresh) return;
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enablePullToRefresh || isRefreshing) return;
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY;
    
    // 페이지 최상단에서만 pull to refresh 동작
    if (window.scrollY === 0 && distance > 0) {
      setPullDistance(Math.min(distance, 100));
      setIsPulling(distance > 60);
    }
  };

  const handleTouchEnd = async () => {
    if (!enablePullToRefresh || isRefreshing) return;
    
    if (isPulling && pullDistance > 60 && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setIsPulling(false);
        setPullDistance(0);
      }
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  // 키보드 최적화
  useEffect(() => {
    const handleResize = () => {
      // iOS Safari에서 키보드가 올라올 때 뷰포트 조정
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 모바일 성능 최적화
  useEffect(() => {
    // 터치 지연 제거
    document.body.style.touchAction = 'manipulation';
    
    // 스크롤 성능 최적화
    const scrollElements = document.querySelectorAll('.scroll-container');
    scrollElements.forEach(el => {
      (el as HTMLElement).style.willChange = 'scroll-position';
    });

    return () => {
      document.body.style.touchAction = '';
    };
  }, []);

  const refreshIndicatorStyle = {
    transform: `translateY(${pullDistance / 2}px) scale(${Math.min(pullDistance / 60, 1)})`,
    opacity: pullDistance > 0 ? Math.min(pullDistance / 60, 1) : 0,
  };

  return (
    <div
      {...handlers}
      className={`mobile-ux-optimizer ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance * 0.3}px)`,
        transition: isPulling || isRefreshing ? 'none' : 'transform 0.3s ease',
      }}
    >
      {/* Pull to Refresh 인디케이터 */}
      {enablePullToRefresh && (
        <div 
          className="pull-refresh-indicator fixed top-0 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
          style={refreshIndicatorStyle}
        >
          <div className={`w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}
      
      {children}
    </div>
  );
};

// 터치 최적화 버튼 컴포넌트
interface TouchOptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TouchOptimizedButton: React.FC<TouchOptimizedButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'mobile-button inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-900 focus:ring-gray-500 dark:hover:bg-gray-800 dark:text-white'
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-2 min-h-[40px]',
    md: 'text-base px-4 py-2.5 min-h-[44px]',
    lg: 'text-lg px-6 py-3 min-h-[48px]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// 모바일 최적화 입력 필드
interface TouchOptimizedInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const TouchOptimizedInput: React.FC<TouchOptimizedInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`
        w-full px-4 py-3 text-base border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
        placeholder-gray-500 dark:placeholder-gray-400
        min-h-[44px] touch-manipulation
        ${className}
      `}
    />
  );
};

// 모바일 최적화 모달
interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const MobileOptimizedModal: React.FC<MobileOptimizedModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="flex items-end justify-center min-h-screen md:items-center md:p-4">
        <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-t-lg md:rounded-lg shadow-xl transform transition-all modal-mobile md:modal">
          {/* 헤더 */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                ✕
              </TouchOptimizedButton>
            </div>
          )}
          
          {/* 컨텐츠 */}
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileUXOptimizer;