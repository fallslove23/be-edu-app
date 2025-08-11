// BS 학습 관리 앱 서비스 워커
const CACHE_NAME = 'bs-learning-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// 캐시할 정적 파일들
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // CSS 파일들은 빌드 후 동적으로 추가됨
];

// 오프라인에서도 접근 가능한 API 엔드포인트 패턴
const CACHE_API_PATTERNS = [
  /\/api\/users/,
  /\/api\/courses/,
  /\/api\/dashboard/
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('🚀 서비스 워커 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 정적 파일 캐시 중...');
      return cache.addAll(STATIC_CACHE_URLS);
    }).catch(error => {
      console.error('❌ 캐시 설치 실패:', error);
    })
  );
  
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('✅ 서비스 워커 활성화');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️  구 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 모든 탭에서 즉시 제어 시작
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트 (네트워크 요청 가로채기)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // GET 요청만 처리
  if (request.method !== 'GET') return;
  
  // 크롬 확장프로그램 요청 무시
  if (url.protocol === 'chrome-extension:') return;
  
  // HTML 페이지 요청 처리
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 네트워크 성공 시 캐시 업데이트
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시된 페이지 또는 오프라인 페이지 반환
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 캐시된 페이지가 없으면 오프라인 페이지 반환
            return caches.match(OFFLINE_PAGE);
          });
        })
    );
    return;
  }
  
  // API 요청 처리
  if (CACHE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      // Network First 전략 (최신 데이터 우선, 실패 시 캐시)
      fetch(request)
        .then(response => {
          // 성공 시 캐시 업데이트
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시된 응답 반환
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('📱 오프라인 모드: 캐시된 데이터 사용');
              return cachedResponse;
            }
            // 캐시도 없으면 오프라인 응답 생성
            return new Response(
              JSON.stringify({ 
                error: 'offline', 
                message: '현재 오프라인 상태입니다. 캐시된 데이터가 없습니다.' 
              }),
              { 
                status: 503, 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
          });
        })
    );
    return;
  }
  
  // 정적 파일 처리 (CSS, JS, 이미지 등)
  if (request.url.includes('.css') || 
      request.url.includes('.js') || 
      request.url.includes('.png') || 
      request.url.includes('.jpg') || 
      request.url.includes('.svg')) {
    event.respondWith(
      // Cache First 전략 (정적 파일은 캐시 우선)
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // 캐시에 없으면 네트워크에서 가져와서 캐시
        return fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});

// 백그라운드 동기화 (향후 구현용)
self.addEventListener('sync', event => {
  console.log('🔄 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 오프라인에서 쌓인 데이터 동기화 로직
      syncOfflineData()
    );
  }
});

// 푸시 알림 (향후 구현용)
self.addEventListener('push', event => {
  console.log('📱 푸시 알림 수신:', event.data?.text());
  
  const options = {
    body: event.data?.text() || '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: '열기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('BS 학습 관리 앱', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  console.log('📱 알림 클릭:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});

// 오프라인 데이터 동기화 함수
async function syncOfflineData() {
  try {
    console.log('🔄 오프라인 데이터 동기화 시작');
    
    // 오프라인에서 쌓인 데이터를 IndexedDB에서 가져와서 서버로 전송
    // 향후 구현: IndexedDB 연동 로직
    
    console.log('✅ 오프라인 데이터 동기화 완료');
  } catch (error) {
    console.error('❌ 오프라인 데이터 동기화 실패:', error);
    throw error;
  }
}

// 에러 처리
self.addEventListener('error', event => {
  console.error('❌ 서비스 워커 에러:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('❌ 처리되지 않은 Promise 거부:', event.reason);
  event.preventDefault();
});