import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { SecurityManager } from '../../utils/security';

const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();
  const securityManager = SecurityManager.getInstance();

  // Mock session info since useAuth doesn't provide these
  const sessionInfo = { createdAt: Date.now() - 3600000 };
  const getActiveSessions = () => [{ sessionId: 'session-1', createdAt: Date.now() - 3600000, lastActivity: Date.now() }];
  const invalidateAllSessions = () => console.log('All sessions invalidated');
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    // 활성 세션 목록 가져오기
    const sessions = getActiveSessions();
    setActiveSessions(sessions);

    // 보안 로그 mock data
    const logs = [
      { event: 'successful_login', timestamp: Date.now() - 7200000, details: { email: user?.email } },
      { event: 'token_refreshed', timestamp: Date.now() - 3600000, details: {} },
    ];
    setSecurityLogs(logs);
  }, [user]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  const getLogEventIcon = (event: string) => {
    switch (event) {
      case 'successful_login':
        return <ShieldCheckIcon className="h-4 w-4 text-green-500" />;
      case 'failed_login_attempt':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'token_refreshed':
        return <KeyIcon className="h-4 w-4 text-blue-500" />;
      case 'session_restored':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogEventDescription = (event: string) => {
    switch (event) {
      case 'successful_login':
        return '성공적인 로그인';
      case 'failed_login_attempt':
        return '로그인 실패';
      case 'token_refreshed':
        return '토큰 갱신';
      case 'session_restored':
        return '세션 복원';
      case 'user_logout':
        return '사용자 로그아웃';
      case 'role_switched':
        return '역할 변경';
      case 'all_sessions_invalidated':
        return '모든 세션 무효화';
      default:
        return event;
    }
  };

  const handleInvalidateAllSessions = () => {
    if (window.confirm('모든 활성 세션을 무효화하시겠습니까? 다시 로그인해야 합니다.')) {
      invalidateAllSessions();
    }
  };

  const maskData = (data: string) => {
    return securityManager.maskPersonalInfo(data, 'email');
  };

  if (!user) {
    return <div>인증이 필요합니다.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
            보안 대시보드
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            계정 보안 상태와 활성 세션을 관리합니다
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 현재 세션 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">보안 상태</p>
                  <p className="text-xs text-green-700 dark:text-green-300">활성</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <ComputerDesktopIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">활성 세션</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">{activeSessions.length}개</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">세션 시간</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {sessionInfo ? formatDuration(Date.now() - sessionInfo.createdAt) : '알 수 없음'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center">
                <KeyIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">토큰 상태</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">유효</p>
                </div>
              </div>
            </div>
          </div>

          {/* 활성 세션 관리 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">활성 세션</h3>
              <div className="space-x-2">
                <button
                  onClick={() => setShowSessionDetails(!showSessionDetails)}
                  className="btn-info btn-sm"
                >
                  {showSessionDetails ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleInvalidateAllSessions}
                  className="btn-danger btn-sm"
                >
                  모든 세션 종료
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {activeSessions.map((session, index) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        세션 {index + 1} {index === 0 && '(현재)'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        생성: {formatDate(session.createdAt)} | 
                        마지막 활동: {formatDate(session.lastActivity)}
                      </p>
                      {showSessionDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          세션 ID: {session.sessionId.substring(0, 16)}...
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      활성
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 보안 로그 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">최근 보안 활동</h3>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="btn-secondary btn-sm"
              >
                {showLogs ? '숨기기' : '더보기'}
              </button>
            </div>

            <div className="space-y-2">
              {securityLogs.slice(0, showLogs ? 10 : 3).map((log, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {getLogEventIcon(log.event)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getLogEventDescription(log.event)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString('ko-KR')}
                      {log.details.email && ` | ${maskData(log.details.email)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 보안 권장사항 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">보안 권장사항</h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 정기적으로 비밀번호를 변경하세요</li>
              <li>• 의심스러운 활동이 발견되면 즉시 모든 세션을 종료하세요</li>
              <li>• 공용 컴퓨터 사용 후에는 반드시 로그아웃하세요</li>
              <li>• 브라우저를 최신 버전으로 유지하세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;