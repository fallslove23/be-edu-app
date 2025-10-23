import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  blur?: boolean;
  quality?: number;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  blur = true,
  quality = 75,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || generatePlaceholder(width, height));
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 플레이스홀더 생성 (SVG 기반)
  function generatePlaceholder(w?: number, h?: number): string {
    const width = w || 300;
    const height = h || 200;
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <g fill="#d1d5db">
          <rect x="${width * 0.3}" y="${height * 0.35}" width="${width * 0.4}" height="${height * 0.2}" rx="4"/>
          <circle cx="${width * 0.4}" cy="${height * 0.6}" r="${Math.min(width, height) * 0.05}"/>
          <polygon points="${width * 0.55},${height * 0.55} ${width * 0.6},${height * 0.65} ${width * 0.65},${height * 0.55}"/>
        </g>
        <text x="50%" y="80%" text-anchor="middle" fill="#9ca3af" font-family="system-ui" font-size="12px">
          이미지 로딩 중...
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // WebP 지원 확인
  const supportsWebP = (): boolean => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  // 최적화된 이미지 URL 생성
  const getOptimizedImageUrl = (originalSrc: string): string => {
    // 실제 구현에서는 이미지 최적화 서비스 URL로 변경
    // 예: Cloudinary, ImageKit, 또는 자체 이미지 최적화 API
    
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('blob:')) {
      return originalSrc;
    }

    const url = new URL(originalSrc, window.location.origin);
    
    // 품질 설정
    if (quality !== 75) {
      url.searchParams.set('q', quality.toString());
    }
    
    // WebP 변환 (지원되는 경우)
    if (supportsWebP() && !originalSrc.includes('.svg')) {
      url.searchParams.set('f', 'webp');
    }
    
    // 반응형 크기 설정
    if (width) {
      url.searchParams.set('w', width.toString());
    }
    if (height) {
      url.searchParams.set('h', height.toString());
    }
    
    return url.toString();
  };

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    if (loading === 'eager') {
      loadImage();
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadImage();
          observerRef.current?.unobserve(img);
        }
      },
      {
        rootMargin: '50px', // 뷰포트에 진입하기 50px 전에 로딩 시작
        threshold: 0.1,
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, loading]);

  // 이미지 로딩 함수
  const loadImage = () => {
    const optimizedSrc = getOptimizedImageUrl(src);
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(optimizedSrc);
      setIsLoaded(true);
      setIsError(false);
      onLoad?.();
    };
    
    img.onerror = () => {
      setIsError(true);
      if (fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setIsLoaded(true);
      }
      onError?.();
    };
    
    img.src = optimizedSrc;
  };

  // 재시도 함수
  const handleRetry = () => {
    setIsError(false);
    setIsLoaded(false);
    loadImage();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`
          transition-all duration-300 ease-in-out
          ${isLoaded ? 'opacity-100' : 'opacity-60'}
          ${blur && !isLoaded ? 'blur-sm' : ''}
          ${isError ? 'grayscale' : ''}
          w-full h-full object-cover
        `}
        style={{
          background: isLoaded ? 'transparent' : '#f3f4f6',
        }}
      />

      {/* 로딩 인디케이터 */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-xs text-gray-500">로딩 중...</span>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {isError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mb-2">이미지를 불러올 수 없습니다</p>
            <button
              onClick={handleRetry}
              className="mobile-button text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 접근성을 위한 alt 텍스트 표시 (스크린 리더용) */}
      <span className="sr-only">{alt}</span>
    </div>
  );
};

// 프로필 이미지용 특화 컴포넌트
export const LazyProfileImage: React.FC<{
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: 32, height: 32, className: 'w-8 h-8' },
    md: { width: 48, height: 48, className: 'w-12 h-12' },
    lg: { width: 64, height: 64, className: 'w-16 h-16' },
    xl: { width: 96, height: 96, className: 'w-24 h-24' },
  };

  const { width, height, className: sizeClass } = sizes[size];

  // 기본 아바타 SVG
  const defaultAvatar = `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9ca3af">
      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  `)}`;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-200 ${className}`}>
      <LazyImage
        src={src || defaultAvatar}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full"
        fallbackSrc={defaultAvatar}
        blur={false}
      />
    </div>
  );
};

// 이미지 갤러리용 컴포넌트
export const LazyGalleryImage: React.FC<{
  src: string;
  alt: string;
  aspectRatio?: 'square' | '4:3' | '16:9' | '3:2';
  onClick?: () => void;
  className?: string;
}> = ({ src, alt, aspectRatio = 'square', onClick, className = '' }) => {
  const aspectClasses = {
    square: 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '3:2': 'aspect-[3/2]',
  };

  return (
    <div
      className={`
        ${aspectClasses[aspectRatio]} 
        rounded-lg overflow-hidden cursor-pointer 
        hover:shadow-lg transition-shadow duration-200
        ${className}
      `}
      onClick={onClick}
    >
      <LazyImage
        src={src}
        alt={alt}
        className="w-full h-full hover:scale-105 transition-transform duration-300"
        quality={85}
      />
    </div>
  );
};

export default LazyImage;