/**
 * 중앙 집중식 로깅 유틸리티
 * 에러 추적, 사용자 행동 로깅, 성능 모니터링을 위한 유틸리티
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logHistory: Array<{ timestamp: Date; level: LogLevel; message: string; context?: LogContext }> = [];
  private maxHistorySize = 100;

  /**
   * 디버그 레벨 로그
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * 정보 레벨 로그
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 경고 레벨 로그
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * 에러 레벨 로그
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      metadata: {
        ...context?.metadata,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      },
    };
    this.log(LogLevel.ERROR, message, errorContext);

    // 프로덕션 환경에서는 외부 로깅 서비스로 전송
    if (!this.isDevelopment) {
      this.sendToExternalService(message, errorContext);
    }
  }

  /**
   * 내부 로그 메서드
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date();
    const logEntry = { timestamp, level, message, context };

    // 히스토리에 저장
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // 콘솔 출력
    const formattedMessage = this.formatMessage(timestamp, level, message, context);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, context);
        break;
    }
  }

  /**
   * 로그 메시지 포맷팅
   */
  private formatMessage(timestamp: Date, level: LogLevel, message: string, context?: LogContext): string {
    const time = timestamp.toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `{${context.action}}` : '';

    return `[${time}] [${level.toUpperCase()}] ${component}${action} ${message}`;
  }

  /**
   * 외부 로깅 서비스로 전송 (Sentry, LogRocket 등)
   */
  private sendToExternalService(message: string, context?: LogContext): void {
    // TODO: 실제 외부 로깅 서비스 통합
    // 예: Sentry.captureException(), LogRocket.track() 등
    console.log('📡 External logging service:', message, context);
  }

  /**
   * 로그 히스토리 조회
   */
  getHistory(): Array<{ timestamp: Date; level: LogLevel; message: string; context?: LogContext }> {
    return [...this.logHistory];
  }

  /**
   * 로그 히스토리 초기화
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * 성능 측정 시작
   */
  startPerformanceMeasure(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.info(`Performance: ${label}`, {
        action: 'performance',
        metadata: { duration: `${duration.toFixed(2)}ms` },
      });
    };
  }

  /**
   * API 호출 로깅
   */
  logApiCall(method: string, url: string, status: number, duration?: number): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${url}`, {
      action: 'api_call',
      metadata: { method, url, status, duration: duration ? `${duration}ms` : undefined },
    });
  }

  /**
   * 사용자 행동 로깅
   */
  logUserAction(action: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      action: 'user_action',
      metadata,
    });
  }
}

// 싱글톤 인스턴스 export
export const logger = new Logger();

// 편의 함수들
export const logError = (message: string, error?: Error, context?: LogContext) =>
  logger.error(message, error, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);

export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);

export const measurePerformance = (label: string) =>
  logger.startPerformanceMeasure(label);
