// BS Learning App Service Worker
const CACHE_NAME = 'bs-learning-app-v1.2.0';
const STATIC_CACHE_NAME = 'bs-learning-static-v1';
const DYNAMIC_CACHE_NAME = 'bs-learning-dynamic-v1';

// 캐시할 정적 리소스
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// 캐시할 중요한 API 엔드포인트
const API_ROUTES = [
  '/api/dashboard',
  '/api/courses',
  '/api/users/profile'
];

// 서비스 워커 설치
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');

  event.waitUntil(
    (async () => {
      try {
        // 정적 리소스 캐시
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        await staticCache.addAll(STATIC_RESOURCES);

        console.log('✅ Service Worker: Static resources cached');

        // 새 서비스 워커가 즉시 활성화되도록 설정
        self.skipWaiting();
      } catch (error) {
        console.error('❌ Service Worker: Installation failed', error);
      }
    })()
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');

  event.waitUntil(
    (async () => {
      try {
        // 이전 버전 캐시 정리
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name =>
          name !== STATIC_CACHE_NAME &&
          name !== DYNAMIC_CACHE_NAME &&
          (name.startsWith('bs-learning-') || name.startsWith('workbox-'))
        );

        await Promise.all(
          oldCaches.map(cacheName => {
            console.log(`🗑️ Service Worker: Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );

        // 모든 탭에서 새 서비스 워커 활성화
        await self.clients.claim();

        console.log('✅ Service Worker: Activated successfully');
      } catch (error) {
        console.error('❌ Service Worker: Activation failed', error);
      }
    })()
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin 요청만 처리
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // 정적 리소스: Cache First 전략
        if (STATIC_RESOURCES.some(resource => url.pathname === resource)) {
          const cache = await caches.open(STATIC_CACHE_NAME);
          const cachedResponse = await cache.match(request);

          if (cachedResponse) {
            return cachedResponse;
          }

          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }

        // API 요청: Network First 전략 (오프라인 대응)
        if (url.pathname.startsWith('/api/') || API_ROUTES.some(route => url.pathname.startsWith(route))) {
          try {
            const networkResponse = await fetch(request);

            if (networkResponse.ok) {
              const cache = await caches.open(DYNAMIC_CACHE_NAME);
              await cache.put(request, networkResponse.clone());
            }

            return networkResponse;
          } catch (networkError) {
            // 네트워크 실패 시 캐시에서 응답
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            const cachedResponse = await cache.match(request);

            if (cachedResponse) {
              console.log('📱 Service Worker: Serving from cache (offline)', request.url);
              return cachedResponse;
            }

            // 캐시도 없으면 오프라인 페이지 반환
            if (request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>오프라인 - BS Learning</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; }
                    .offline { color: #666; }
                    .retry { margin-top: 20px; }
                    button { padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; }
                  </style>
                </head>
                <body>
                  <div class="offline">
                    <h1>🔌 오프라인 상태</h1>
                    <p>인터넷 연결을 확인하고 다시 시도해주세요.</p>
                    <div class="retry">
                      <button onclick="window.location.reload()">다시 시도</button>
                    </div>
                  </div>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }

            throw networkError;
          }
        }

        // 기타 요청: Stale While Revalidate 전략
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // 백그라운드에서 네트워크 요청 실행
        const networkResponsePromise = fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => null);

        // 캐시된 응답이 있으면 즉시 반환, 없으면 네트워크 대기
        return cachedResponse || await networkResponsePromise ||
          new Response('Network Error', { status: 503 });

      } catch (error) {
        console.error('❌ Service Worker: Fetch failed', error);
        return new Response('Service Unavailable', { status: 503 });
      }
    })()
  );
});

// 백그라운드 동기화 (향후 기능)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 오프라인 중 수집된 데이터 동기화
      console.log('🔄 Service Worker: Background sync triggered')
    );
  }
});

// 푸시 알림 (향후 기능)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [100, 50, 100],
      data: data.url ? { url: data.url } : undefined,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'BS Learning', options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// 에러 처리
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker: Error occurred', event.error);
});

// 처리되지 않은 Promise 거부 처리
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker: Unhandled promise rejection', event.reason);
});

console.log('🎯 BS Learning Service Worker loaded successfully');