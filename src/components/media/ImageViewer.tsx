import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ImageViewerProps {
  src: string | string[];
  alt?: string;
  title?: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
  onClose?: () => void;
  showControls?: boolean;
  allowDownload?: boolean;
  allowFullscreen?: boolean;
}

interface ImageInfo {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = '이미지',
  title,
  caption,
  width,
  height,
  className = '',
  onClose,
  showControls = true,
  allowDownload = true,
  allowFullscreen = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 이미지 배열로 변환
  const images: ImageInfo[] = Array.isArray(src)
    ? src.map((s, i) => ({ src: s, alt: `${alt} ${i + 1}`, title, caption }))
    : [{ src, alt, title, caption }];

  const currentImage = images[currentIndex];
  const isMultiple = images.length > 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose?.();
          }
          break;
        case 'ArrowLeft':
          if (isMultiple) {
            previousImage();
          }
          break;
        case 'ArrowRight':
          if (isMultiple) {
            nextImage();
          }
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen, currentIndex, isMultiple]);

  const nextImage = () => {
    if (isMultiple) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      resetView();
    }
  };

  const previousImage = () => {
    if (isMultiple) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      resetView();
    }
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.2));
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
    setImageError(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = currentImage.title || 'image';
    link.click();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-900 rounded-full overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      } ${className}`}
      style={{ width, height }}
    >
      {/* 이미지 컨테이너 */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 로딩 인디케이터 */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-white"></div>
            <span className="text-white ml-3">이미지 로딩 중...</span>
          </div>
        )}

        {/* 에러 상태 */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-lg">이미지를 불러올 수 없습니다</p>
            <p className="text-sm text-gray-400 mt-2">파일이 손상되었거나 존재하지 않습니다</p>
          </div>
        )}

        {/* 이미지 */}
        <img
          ref={imageRef}
          src={currentImage.src}
          alt={currentImage.alt}
          className={`max-w-none transition-transform duration-200 ${
            isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            opacity: imageLoaded ? 1 : 0
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      </div>

      {/* 컨트롤 버튼 */}
      {showControls && (
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {/* 줌 아웃 */}
          <button
            onClick={zoomOut}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="축소"
          >
            <MagnifyingGlassMinusIcon className="h-5 w-5" />
          </button>

          {/* 줌 리셋 */}
          <button
            onClick={resetZoom}
            className="px-3 py-2 bg-black/50 hover:bg-black/70 text-white rounded-full text-sm transition-colors"
            title="원본 크기"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* 줌 인 */}
          <button
            onClick={zoomIn}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="확대"
          >
            <MagnifyingGlassPlusIcon className="h-5 w-5" />
          </button>

          {/* 다운로드 */}
          {allowDownload && (
            <button
              onClick={downloadImage}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="다운로드"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          )}

          {/* 전체화면 */}
          {allowFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title={isFullscreen ? '전체화면 해제' : '전체화면'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-5 w-5" />
              ) : (
                <ArrowsPointingOutIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {/* 닫기 */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="닫기"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* 네비게이션 화살표 (여러 이미지인 경우) */}
      {isMultiple && (
        <>
          <button
            onClick={previousImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="이전 이미지"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="다음 이미지"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* 이미지 정보 오버레이 */}
      {(currentImage.title || currentImage.caption) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
          {currentImage.title && (
            <h3 className="text-lg font-medium mb-2">{currentImage.title}</h3>
          )}
          {currentImage.caption && (
            <p className="text-sm text-gray-300">{currentImage.caption}</p>
          )}
        </div>
      )}

      {/* 이미지 인덱스 표시 (여러 이미지인 경우) */}
      {isMultiple && (
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 키보드 단축키 안내 (전체화면일 때) */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-3 rounded-lg">
          <div>ESC: 닫기 | ← →: 이미지 변경 | +/- : 확대/축소 | 0: 원본크기</div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;