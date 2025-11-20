import React, { Suspense, Component, ReactNode } from 'react';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

// 자체 ErrorBoundary 컴포넌트
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <this.props.FallbackComponent 
          error={this.state.error} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

// 기본 로딩 컴포넌트
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-64 p-8">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {/* 스피너 */}
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-lg animate-spin"></div>
        
        {/* 중앙 점 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="text-center">
        <p className="text-gray-600 text-sm font-medium">컴포넌트 로딩 중...</p>
        <p className="text-gray-400 text-xs mt-1">잠시만 기다려주세요</p>
      </div>
    </div>
  </div>
);

// 기본 에러 폴백 컴포넌트
const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <div className="flex items-center justify-center min-h-64 p-8">
    <div className="text-center bg-destructive/10 border border-destructive/50 rounded-lg p-6 max-w-md">
      <div className="text-destructive mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-destructive mb-2">
        컴포넌트 로드 실패
      </h3>
      
      <p className="text-destructive text-sm mb-4">
        죄송합니다. 요청하신 페이지를 불러오는 중 오류가 발생했습니다.
      </p>
      
      <details className="text-left mb-4">
        <summary className="text-xs text-destructive cursor-pointer">오류 상세 정보</summary>
        <pre className="text-xs text-destructive mt-2 p-2 bg-destructive/10 rounded overflow-auto">
          {error.message}
        </pre>
      </details>
      
      <div className="space-y-2">
        <button
          onClick={resetErrorBoundary}
          className="btn-danger mobile-button w-full py-2 px-4 rounded-full text-sm font-medium"
        >
          다시 시도
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="mobile-button w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-full text-sm"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  </div>
);

// 지연 로딩 래퍼 컴포넌트
const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <DefaultLoadingFallback />,
  errorFallback = DefaultErrorFallback 
}) => {
  return (
    <ErrorBoundary 
      FallbackComponent={errorFallback}
      onError={(error, errorInfo) => {
        // 에러 로깅 (향후 Sentry 등과 연동 가능)
        console.error('💥 Lazy Component Error:', error, errorInfo);
        
        // 성능 모니터링에 에러 리포트
        if ('performance' in window && 'measure' in performance) {
          performance.mark('lazy-component-error');
        }
      }}
      onReset={() => {
        // 에러 복구 시 수행할 작업
        console.log('🔄 Lazy Component Reset');
      }}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// 고차 컴포넌트 (HOC) 버전
export const withLazyWrapper = <P extends object>(
  Component: React.ComponentType<P>,
  customFallback?: React.ReactNode
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <LazyWrapper fallback={customFallback}>
      <Component {...props} />
    </LazyWrapper>
  );
  
  WrappedComponent.displayName = `withLazyWrapper(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// 특정 컴포넌트용 로딩 상태
export const ComponentLoadingFallback: React.FC<{ 
  componentName: string;
  description?: string;
}> = ({ componentName, description }) => (
  <div className="flex items-center justify-center min-h-48 p-6">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-lg animate-spin mx-auto mb-3"></div>
      <p className="text-gray-600 font-medium">{componentName} 로딩 중...</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
    </div>
  </div>
);

// 페이지 로딩 스켈레톤
export const PageLoadingSkeleton: React.FC = () => (
  <div className="space-y-6 p-6 animate-pulse">
    {/* 헤더 영역 */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
    
    {/* 필터 영역 */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
    
    {/* 컨텐츠 영역 */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LazyWrapper;