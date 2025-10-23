import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface EnhancedMobileUXProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  showScrollToTop?: boolean;
}

const EnhancedMobileUX: React.FC<EnhancedMobileUXProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  enablePullToRefresh = false,
  onRefresh,
  showScrollToTop = true
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 스와이프 핸들러
  const swipeHandlers = useSwipeable({
    onSwipedLeft: onSwipeLeft,
    onSwipedRight: onSwipeRight,
    trackMouse: false
  });

  // Pull to Refresh 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (enablePullToRefresh && window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (enablePullToRefresh && window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (enablePullToRefresh && pullDistance > 80 && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  };

  // 맨 위로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 햅틱 피드백 (지원하는 기기에서)
  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  return (
    <div 
      {...swipeHandlers}
      className="relative min-h-screen touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh 인디케이터 */}
      {enablePullToRefresh && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-2 transition-transform duration-200"
          style={{ 
            transform: `translateY(${isRefreshing ? '0' : pullDistance > 80 ? '0' : '-100%'})`
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>새로고침 중...</span>
            </div>
          ) : pullDistance > 80 ? (
            <span>놓으면 새로고침</span>
          ) : (
            <span>아래로 당겨서 새로고침</span>
          )}
        </div>
      )}

      {/* 빠른 검색 토글 */}
      <div className="fixed top-4 right-4 z-40 md:hidden">
        <button
          onClick={() => {
            setSearchVisible(!searchVisible);
            hapticFeedback('light');
          }}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </div>

      {/* 빠른 검색 오버레이 */}
      {searchVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white dark:bg-gray-800 p-4 mx-4 mt-20 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="빠른 검색..."
                className="flex-1 mobile-input border-none outline-none bg-transparent text-gray-900 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => setSearchVisible(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* 빠른 액션 버튼들 */}
            <div className="grid grid-cols-2 gap-2">
              <button className="mobile-button bg-blue-500 text-white rounded-lg text-sm">
                새 과정 추가
              </button>
              <button className="mobile-button bg-green-500 text-white rounded-lg text-sm">
                출석 체크
              </button>
              <button className="mobile-button bg-purple-500 text-white rounded-lg text-sm">
                시험 관리
              </button>
              <button className="mobile-button bg-orange-500 text-white rounded-lg text-sm">
                성과 분석
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스와이프 힌트 (좌/우) */}
      {(onSwipeLeft || onSwipeRight) && (
        <>
          {onSwipeLeft && (
            <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-30 opacity-20 md:hidden">
              <ChevronLeftIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          {onSwipeRight && (
            <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-30 opacity-20 md:hidden">
              <ChevronRightIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </>
      )}

      {/* 메인 컨텐츠 */}
      <div className="relative">
        {children}
      </div>

      {/* 맨 위로 스크롤 버튼 */}
      {showScrollToTop && showScrollTop && (
        <button
          onClick={() => {
            scrollToTop();
            hapticFeedback('medium');
          }}
          className="fixed bottom-20 right-4 z-40 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-110"
          aria-label="맨 위로 스크롤"
        >
          <ArrowUpIcon className="h-5 w-5" />
        </button>
      )}

      {/* 제스처 가이드 (첫 방문시) */}
      <div className="hidden" id="gesture-guide">
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-semibold mb-4">터치 제스처 가이드</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <ChevronLeftIcon className="h-5 w-5 text-blue-500" />
                <span>좌로 스와이프: 다음 페이지</span>
              </div>
              <div className="flex items-center space-x-3">
                <ChevronRightIcon className="h-5 w-5 text-blue-500" />
                <span>우로 스와이프: 이전 페이지</span>
              </div>
              {enablePullToRefresh && (
                <div className="flex items-center space-x-3">
                  <ArrowUpIcon className="h-5 w-5 text-green-500" />
                  <span>아래로 당기기: 새로고침</span>
                </div>
              )}
            </div>
            <button className="mt-4 w-full mobile-button bg-blue-500 text-white rounded-lg">
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMobileUX;