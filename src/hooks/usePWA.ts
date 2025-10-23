import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
    installPrompt: null,
    canInstall: false
  });

  useEffect(() => {
    // 디바이스 및 브라우저 감지
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any)?.standalone === true;
    const isInstalled = isStandalone;

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installPrompt = e as BeforeInstallPromptEvent;
      
      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt,
        canInstall: true
      }));
    };

    // appinstalled 이벤트 리스너
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
        canInstall: false
      }));
      
      console.log('✅ PWA가 성공적으로 설치되었습니다!');
    };

    // iOS Safari에서는 수동 설치만 가능
    const canInstall = isIOS ? !isStandalone : false;

    setState(prev => ({
      ...prev,
      isIOS,
      isStandalone,
      isInstalled,
      canInstall: canInstall || prev.isInstallable
    }));

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // PWA 설치 실행
  const installPWA = async (): Promise<boolean> => {
    if (!state.installPrompt) {
      console.warn('⚠️ 설치 프롬프트를 사용할 수 없습니다');
      return false;
    }

    try {
      await state.installPrompt.prompt();
      const choiceResult = await state.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          installPrompt: null,
          canInstall: false
        }));
        return true;
      } else {
        console.log('❌ 사용자가 PWA 설치를 거절했습니다');
        return false;
      }
    } catch (error) {
      console.error('❌ PWA 설치 중 오류 발생:', error);
      return false;
    }
  };

  // PWA 업데이트 확인
  const checkForUpdates = async (): Promise<boolean> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          return true;
        }
      } catch (error) {
        console.error('❌ PWA 업데이트 확인 실패:', error);
      }
    }
    return false;
  };

  // 오프라인 상태 감지
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...state,
    isOnline,
    installPWA,
    checkForUpdates
  };
};