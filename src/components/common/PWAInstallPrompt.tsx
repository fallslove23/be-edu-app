import React, { useState, useEffect } from 'react';
import { 
  DevicePhoneMobileIcon, 
  XMarkIcon, 
  ArrowDownTrayIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS 감지
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // 이미 설치된 PWA인지 확인
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any)?.standalone === true;
    setIsStandalone(standalone);

    // beforeinstallprompt 이벤트 리스너 (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // 사용자가 이전에 거절하지 않았다면 프롬프트 표시
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000); // 3초 후 표시
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS에서 Safari인지 확인하고 프롬프트 표시
    if (iOS && !standalone) {
      const safariPromptDismissed = localStorage.getItem('ios-install-dismissed');
      if (!safariPromptDismissed) {
        setTimeout(() => setShowPrompt(true), 5000); // 5초 후 표시
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      // Android/Chrome 설치
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ PWA 설치 수락됨');
        } else {
          console.log('❌ PWA 설치 거절됨');
          localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }
        
        setShowPrompt(false);
        setInstallPrompt(null);
      } catch (error) {
        console.error('❌ PWA 설치 오류:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    if (isIOS) {
      localStorage.setItem('ios-install-dismissed', Date.now().toString());
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  // 이미 설치되었거나 표시할 필요가 없으면 렌더링하지 않음
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* 모바일 하단 설치 배너 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg transform transition-transform duration-300 safe-bottom">
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <DevicePhoneMobileIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">BS 학습앱 설치</h3>
              <p className="text-xs text-blue-100">
                {isIOS ? '홈 화면에 추가하기' : '빠른 접근을 위해 설치'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isIOS && installPrompt && (
              <button
                onClick={handleInstallClick}
                className="mobile-button bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg flex items-center space-x-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="text-xs font-medium">설치</span>
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="mobile-button p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari 설치 안내 모달 */}
      {isIOS && showPrompt && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-6 space-y-4 safe-bottom">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-xl p-3">
                  <SparklesIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">BS 학습앱을 홈 화면에 추가</h3>
                  <p className="text-sm text-gray-600">빠른 접근과 더 나은 경험을 위해</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="mobile-button p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-lg p-2 text-sm font-bold">1</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Safari 하단의 공유 버튼 탭</p>
                  <p className="text-sm text-gray-600">📤 (공유 아이콘)</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-lg p-2 text-sm font-bold">2</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">"홈 화면에 추가" 선택</p>
                  <p className="text-sm text-gray-600">📱 목록에서 찾아서 탭</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                <div className="bg-blue-500 text-white rounded-lg p-2 text-sm font-bold">3</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">"추가" 버튼 탭</p>
                  <p className="text-sm text-gray-600">✅ 홈 화면에 앱 아이콘 생성</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">앱 설치의 장점</h4>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• 홈 화면에서 바로 접근</li>
                    <li>• 오프라인에서도 사용 가능</li>
                    <li>• 더 빠른 로딩 속도</li>
                    <li>• 네이티브 앱 같은 경험</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="mobile-button w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
            >
              나중에 하기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;