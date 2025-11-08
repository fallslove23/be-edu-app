import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">앱 로딩 오류</h1>
                <p className="text-gray-600 mb-4">
                  애플리케이션을 로드하는 중에 오류가 발생했습니다.
                </p>
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    오류 세부사항
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-sm">
                    <p className="font-semibold">Error:</p>
                    <p className="mb-2">{this.state.error?.message}</p>
                    <p className="font-semibold">Stack:</p>
                    <pre className="text-xs overflow-auto">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </details>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  페이지 새로고침
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;