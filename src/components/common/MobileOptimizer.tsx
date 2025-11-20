import React, { useState, useEffect } from 'react';
import '../../styles/mobile.css';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface MobileOptimizerProps {
  children: React.ReactNode;
}

export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width <= 768) {
        setDeviceType('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width <= 1024) {
        setDeviceType('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setDeviceType('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }

      setOrientation(height > width ? 'portrait' : 'landscape');
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    window.addEventListener('orientationchange', checkDeviceType);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
      window.removeEventListener('orientationchange', checkDeviceType);
    };
  }, []);

  return { deviceType, isMobile, isTablet, orientation };
};

const MobileOptimizer: React.FC<MobileOptimizerProps> = ({ children }) => {
  const { isMobile, isTablet, orientation } = useDeviceType();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // 터치 제스처 감지
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ 
      x: touch.clientX, 
      y: touch.clientY, 
      time: Date.now() 
    });
    setPullDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isRefreshing) return;
    
    const touch = e.touches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;
    const currentTime = Date.now();
    
    // 풀투리프레시 감지 (상단에서 아래로 당기기)
    if (window.scrollY === 0 && deltaY < -50 && Math.abs(deltaX) < 30) {
      const distance = Math.abs(deltaY);
      setPullDistance(Math.min(distance, 120));
      
      // 과도한 스크롤 방지
      if (distance > 80) {
        e.preventDefault();
      }
    }
    
    // 스와이프 제스처 감지
    const swipeThreshold = 50;
    const timeThreshold = 300;
    const timeDiff = currentTime - touchStart.time;
    
    if (timeDiff < timeThreshold && (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold)) {
      const direction = Math.abs(deltaX) > Math.abs(deltaY) 
        ? (deltaX > 0 ? 'left' : 'right')
        : (deltaY > 0 ? 'up' : 'down');
      
      // 스와이프 이벤트 발생
      window.dispatchEvent(new CustomEvent('swipe', { 
        detail: { direction, deltaX, deltaY } 
      }));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80 && !isRefreshing) {
      // 풀투리프레시 실행
      handlePullToRefresh();
    }
    
    setTouchStart(null);
    setPullDistance(0);
  };

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    
    // 새로고침 이벤트 발생
    window.dispatchEvent(new CustomEvent('pullToRefresh'));
    
    // 최소 1초 후 완료
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div 
      className={`mobile-optimized ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''} ${orientation}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 풀투리프레시 인디케이터 */}
      {isMobile && pullDistance > 30 && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-blue-500 text-white transition-all duration-200"
          style={{ 
            height: `${Math.min(pullDistance, 80)}px`,
            opacity: pullDistance > 60 ? 1 : 0.7
          }}
        >
          <div className="flex items-center space-x-2">
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-lg animate-spin"></div>
                <span className="text-sm font-medium">새로고침 중...</span>
              </>
            ) : (
              <span className="text-sm font-medium">
                {pullDistance > 80 ? '놓으면 새로고침' : '아래로 당겨서 새로고침'}
              </span>
            )}
          </div>
        </div>
      )}
      
      {children}
      
    </div>
  );
};

export default MobileOptimizer;