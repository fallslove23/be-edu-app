import CryptoJS from 'crypto-js';

// 환경변수 또는 설정에서 가져올 비밀키 (실제 운영환경에서는 환경변수 사용)
const SECRET_KEY = 'bs_learning_app_secret_2024';
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8시간
const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30분

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number; // issued at
  exp: number; // expires at
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

// 간단한 JWT 구현 (실제 운영환경에서는 검증된 라이브러리 사용 권장)
export class SecurityManager {
  private static instance: SecurityManager;
  private activeSessions = new Map<string, SessionInfo>();

  private constructor() {
    this.loadSessions();
    this.startSessionCleanup();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // JWT 토큰 생성
  generateToken(userId: string, email: string, role: string): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const payload: TokenPayload = {
      userId,
      email,
      role,
      sessionId,
      iat: now,
      exp: now + SESSION_TIMEOUT
    };

    // 세션 정보 저장
    this.activeSessions.set(sessionId, {
      sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      ipAddress: 'localhost', // 실제로는 클라이언트 IP
      userAgent: navigator.userAgent
    });

    this.saveSessions();

    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = this.generateSignature(encodedPayload);
    
    return `${encodedPayload}.${signature}`;
  }

  // JWT 토큰 검증
  verifyToken(token: string): TokenPayload | null {
    try {
      const [encodedPayload, signature] = token.split('.');
      
      if (!encodedPayload || !signature) {
        return null;
      }

      // 서명 검증
      const expectedSignature = this.generateSignature(encodedPayload);
      if (signature !== expectedSignature) {
        console.warn('토큰 서명이 유효하지 않습니다');
        return null;
      }

      const payload: TokenPayload = JSON.parse(atob(encodedPayload));
      
      // 만료 시간 확인
      if (Date.now() > payload.exp) {
        console.warn('토큰이 만료되었습니다');
        this.invalidateSession(payload.sessionId);
        return null;
      }

      // 세션 확인
      const session = this.activeSessions.get(payload.sessionId);
      if (!session) {
        console.warn('세션을 찾을 수 없습니다');
        return null;
      }

      // 세션 활동 시간 업데이트
      session.lastActivity = Date.now();
      this.saveSessions();

      return payload;
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      return null;
    }
  }

  // 토큰 새로고침 (만료 30분 전)
  shouldRefreshToken(token: string): boolean {
    const payload = this.verifyToken(token);
    if (!payload) return false;
    
    return (payload.exp - Date.now()) < REFRESH_THRESHOLD;
  }

  // 토큰 새로고침
  refreshToken(oldToken: string, email: string, role: string): string | null {
    const payload = this.verifyToken(oldToken);
    if (!payload) return null;

    // 기존 세션 무효화
    this.invalidateSession(payload.sessionId);
    
    // 새 토큰 생성
    return this.generateToken(payload.userId, email, role);
  }

  // 세션 무효화
  invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.saveSessions();
  }

  // 모든 세션 무효화 (로그아웃)
  invalidateAllSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
    this.saveSessions();
  }

  // 활성 세션 목록 조회
  getActiveSessions(userId: string): SessionInfo[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // 세션 정보 조회
  getSessionInfo(sessionId: string): SessionInfo | null {
    return this.activeSessions.get(sessionId) || null;
  }

  // 비밀번호 해시 (실제로는 bcrypt 등 사용 권장)
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password + SECRET_KEY).toString();
  }

  // 비밀번호 검증
  verifyPassword(password: string, hash: string): boolean {
    const computedHash = this.hashPassword(password);
    return computedHash === hash;
  }

  // 데이터 암호화
  encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  }

  // 데이터 복호화
  decryptData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('복호화 실패:', error);
      return '';
    }
  }

  // 개인정보 마스킹
  maskPersonalInfo(data: string, type: 'email' | 'phone' | 'name'): string {
    switch (type) {
      case 'email':
        const [username, domain] = data.split('@');
        return `${username.slice(0, 2)}***@${domain}`;
      case 'phone':
        return data.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3');
      case 'name':
        return data.length > 2 
          ? `${data[0]}${'*'.repeat(data.length - 2)}${data[data.length - 1]}`
          : `${data[0]}*`;
      default:
        return data;
    }
  }

  // 보안 이벤트 로깅
  logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 로컬 스토리지에 보안 로그 저장 (실제로는 서버로 전송)
    const logs = this.getSecurityLogs();
    logs.push(logEntry);
    
    // 최대 100개 로그만 유지
    const recentLogs = logs.slice(-100);
    localStorage.setItem('bs_security_logs', JSON.stringify(recentLogs));
  }

  // 보안 로그 조회
  getSecurityLogs(): any[] {
    const logs = localStorage.getItem('bs_security_logs');
    return logs ? JSON.parse(logs) : [];
  }

  // 세션 ID 생성
  private generateSessionId(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  // 서명 생성
  private generateSignature(payload: string): string {
    return CryptoJS.HmacSHA256(payload, SECRET_KEY).toString();
  }

  // 세션 정보 저장
  private saveSessions(): void {
    const sessionsArray = Array.from(this.activeSessions.entries());
    localStorage.setItem('bs_active_sessions', JSON.stringify(sessionsArray));
  }

  // 세션 정보 로드
  private loadSessions(): void {
    const saved = localStorage.getItem('bs_active_sessions');
    if (saved) {
      try {
        const sessionsArray = JSON.parse(saved);
        this.activeSessions = new Map(sessionsArray);
      } catch (error) {
        console.error('세션 로드 실패:', error);
        this.activeSessions.clear();
      }
    }
  }

  // 만료된 세션 정리
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.activeSessions.entries()) {
        // 8시간 이상 비활성 세션 제거
        if (now - session.lastActivity > SESSION_TIMEOUT) {
          this.activeSessions.delete(sessionId);
        }
      }
      this.saveSessions();
    }, 5 * 60 * 1000); // 5분마다 정리
  }
}

// 보안 관리자 싱글톤 인스턴스
export const securityManager = SecurityManager.getInstance();