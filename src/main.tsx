import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA 서비스 워커 등록 (개발 중에는 비활성화)
const registerServiceWorker = async () => {
  // 개발 모드에서는 Service Worker 비활성화
  if (process.env.NODE_ENV === 'development') {
    console.log('🚧 개발 모드: Service Worker 비활성화');

    // 기존 Service Worker 제거
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🗑️ Service Worker 제거됨');
      }
    }
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // 새 서비스 워커 업데이트 확인
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 새 버전 사용 가능 알림
              console.log('🔄 새 버전이 사용 가능합니다. 페이지를 새로고침하세요.');

              // 사용자에게 업데이트 알림 (향후 토스트 메시지로 개선 가능)
              if (confirm('새 버전이 사용 가능합니다. 지금 업데이트하시겠습니까?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      console.log('✅ Service Worker 등록 성공:', registration.scope);
    } catch (error) {
      console.error('❌ Service Worker 등록 실패:', error);
    }
  } else {
    console.log('📱 Service Worker가 지원되지 않는 브라우저입니다.');
  }
};

// PWA 설치 프롬프트 처리
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA 설치 프롬프트 준비됨');
  e.preventDefault();
  deferredPrompt = e;

  // 설치 버튼 표시 (향후 UI 컴포넌트로 개선 가능)
  showInstallBanner();
});

window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA가 성공적으로 설치되었습니다!');
  deferredPrompt = null;
});

const showInstallBanner = () => {
  // 향후 더 나은 UI로 개선 가능
  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-family: system-ui, sans-serif;
    ">
      📱 앱을 홈 화면에 추가하세요!
      <button onclick="this.parentElement.style.display='none'" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        margin-left: 10px;
        cursor: pointer;
      ">설치</button>
      <button onclick="this.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        padding: 4px 8px;
        margin-left: 5px;
        cursor: pointer;
      ">×</button>
    </div>
  `;

  const installButton = banner.querySelector('button');
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`🎯 PWA 설치 선택: ${outcome}`);
        deferredPrompt = null;
        banner.remove();
      }
    });
  }

  document.body.appendChild(banner);

  // 10초 후 자동으로 숨기기
  setTimeout(() => {
    if (banner.parentElement) {
      banner.remove();
    }
  }, 10000);
};

// 앱 초기화
createRoot(document.getElementById('root')!).render(<App />)

// 서비스 워커 등록 (DOM 렌더링 후)
registerServiceWorker();
