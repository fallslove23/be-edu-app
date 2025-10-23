// 푸시 알림 서비스
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
  serviceWorkerReady: boolean;
  subscribed: boolean;
}

class NotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // 실제 VAPID 키로 교체 필요

  // 브라우저 지원 여부 확인
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // 알림 권한 상태 조회
  async getPermissionState(): Promise<NotificationPermissionState> {
    const supported = this.isSupported();
    const permission = supported ? Notification.permission : 'denied';
    
    let serviceWorkerReady = false;
    let subscribed = false;

    if (supported) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
        serviceWorkerReady = true;

        const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
        subscribed = !!subscription;
      } catch (error) {
        console.error('❌ Service Worker 상태 확인 실패:', error);
      }
    }

    return {
      permission,
      supported,
      serviceWorkerReady,
      subscribed
    };
  }

  // 알림 권한 요청
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('⚠️ 브라우저가 알림을 지원하지 않습니다');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 알림 권한 상태:', permission);
      return permission;
    } catch (error) {
      console.error('❌ 알림 권한 요청 실패:', error);
      return 'denied';
    }
  }

  // 푸시 구독 생성
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('브라우저가 푸시 알림을 지원하지 않습니다');
    }

    try {
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }

      // 기존 구독 확인
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // 새 구독 생성
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });

        console.log('✅ 푸시 구독 생성됨:', subscription);
      }

      // 서버에 구독 정보 전송
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('❌ 푸시 구독 실패:', error);
      throw error;
    }
  }

  // 푸시 구독 해제
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.serviceWorkerRegistration) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      }

      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        const success = await subscription.unsubscribe();
        
        if (success) {
          console.log('✅ 푸시 구독 해제됨');
          // 서버에서 구독 정보 제거
          await this.removeSubscriptionFromServer(subscription);
        }
        
        return success;
      }
      
      return true;
    } catch (error) {
      console.error('❌ 푸시 구독 해제 실패:', error);
      return false;
    }
  }

  // 즉시 알림 표시 (로컬)
  async showNotification(payload: NotificationPayload): Promise<void> {
    const permission = await this.getPermissionState();
    
    if (permission.permission !== 'granted') {
      console.warn('⚠️ 알림 권한이 없습니다');
      return;
    }

    try {
      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.svg',
        badge: payload.badge || '/icons/icon-96x96.svg',
        image: payload.image,
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: payload.timestamp || Date.now(),
        actions: payload.actions
      };

      if (this.serviceWorkerRegistration) {
        // Service Worker를 통한 알림 (백그라운드에서도 표시)
        await this.serviceWorkerRegistration.showNotification(payload.title, options);
      } else {
        // 브라우저 기본 알림
        new Notification(payload.title, options);
      }
      
      console.log('🔔 알림 표시됨:', payload.title);
    } catch (error) {
      console.error('❌ 알림 표시 실패:', error);
      throw error;
    }
  }

  // 예약 알림 (서버 통신 필요)
  async scheduleNotification(payload: NotificationPayload, scheduleTime: Date): Promise<boolean> {
    try {
      // 실제로는 서버 API 호출
      const response = await fetch('/api/notifications/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          scheduleTime: scheduleTime.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('알림 예약 실패');
      }

      console.log('⏰ 알림 예약됨:', payload.title, scheduleTime);
      return true;
    } catch (error) {
      console.error('❌ 알림 예약 실패:', error);
      return false;
    }
  }

  // 알림 기록 조회
  async getNotificationHistory(limit = 20): Promise<NotificationPayload[]> {
    try {
      // 실제로는 서버 API 호출 또는 IndexedDB 조회
      const response = await fetch(`/api/notifications/history?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('알림 기록 조회 실패');
      }

      const history = await response.json();
      return history;
    } catch (error) {
      console.error('❌ 알림 기록 조회 실패:', error);
      return [];
    }
  }

  // 알림 설정 저장
  async saveNotificationSettings(settings: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    quietHours: { start: string; end: string };
    categories: { [key: string]: boolean };
  }): Promise<void> {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(settings));
      console.log('💾 알림 설정 저장됨');
    } catch (error) {
      console.error('❌ 알림 설정 저장 실패:', error);
    }
  }

  // 알림 설정 조회
  getNotificationSettings(): any {
    try {
      const settings = localStorage.getItem('notification-settings');
      return settings ? JSON.parse(settings) : {
        enabled: true,
        sound: true,
        vibration: true,
        quietHours: { start: '22:00', end: '08:00' },
        categories: {
          courses: true,
          exams: true,
          announcements: true,
          reminders: true
        }
      };
    } catch (error) {
      console.error('❌ 알림 설정 조회 실패:', error);
      return {};
    }
  }

  // VAPID 키 변환 (Base64 URL → Uint8Array)
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 서버에 구독 정보 전송
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('구독 정보 전송 실패');
      }

      console.log('📤 구독 정보 서버 전송 완료');
    } catch (error) {
      console.error('❌ 구독 정보 전송 실패:', error);
      // 오프라인 상태에서는 나중에 동기화하도록 큐에 추가
    }
  }

  // 서버에서 구독 정보 제거
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('구독 해제 실패');
      }

      console.log('📤 구독 해제 서버 처리 완료');
    } catch (error) {
      console.error('❌ 구독 해제 실패:', error);
    }
  }
}

export const notificationService = new NotificationService();