import React, { useEffect } from 'react';

// HMR 연결 실패 시 대체 방안
const HMRFallback: React.FC = () => {
  useEffect(() => {
    // WebSocket 연결 실패 감지
    const detectWebSocketFailure = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}`;
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onerror = () => {
          console.warn('🔄 HMR WebSocket 연결 실패. 페이지를 수동으로 새로고침해주세요.');
          
          // 3초 후 자동 새로고침 알림
          setTimeout(() => {
            if (confirm('코드가 변경되었습니다. 페이지를 새로고침하시겠습니까?')) {
              window.location.reload();
            }
          }, 3000);
        };
        
        ws.onopen = () => {
          console.log('✅ HMR WebSocket 연결 성공');
          ws.close();
        };
        
      } catch (error) {
        console.warn('🔄 HMR 사용 불가. 수동 새로고침이 필요합니다.');
      }
    };

    // 페이지 로드 후 5초 뒤에 WebSocket 연결 확인
    const timer = setTimeout(detectWebSocketFailure, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
};

export default HMRFallback;