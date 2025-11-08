import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ 컴포넌트 오류</h2>
            <p className="text-gray-600 mb-2">컴포넌트를 불러오는 중 오류가 발생했습니다.</p>
            <p className="text-sm text-gray-500">{this.state.error?.message}</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="btn-primary"
            >
              다시 시도
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;