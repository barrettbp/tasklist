// Web Push Notification utilities

export interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}

class NotificationManager {
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<NotificationState> {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    
    if (!isSupported) {
      console.log('Push notifications not supported');
      return {
        permission: 'default',
        isSupported: false,
        isSubscribed: false,
        subscription: null
      };
    }

    // Get current permission
    const permission = Notification.permission;

    // Register service worker
    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully');
      
      // Wait for the service worker to be ready
      if (this.registration.installing) {
        await new Promise(resolve => {
          this.registration!.installing!.addEventListener('statechange', () => {
            if (this.registration!.installing!.state === 'activated') {
              resolve(void 0);
            }
          });
        });
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return {
        permission,
        isSupported,
        isSubscribed: false,
        subscription: null
      };
    }

    // Get VAPID public key from server
    try {
      console.log('Fetching VAPID public key...');
      
      // Try Netlify function first, then fallback to Express route for development
      let response;
      try {
        response = await fetch('/.netlify/functions/vapid');
        console.log('Trying Netlify function endpoint');
      } catch (netlifyError) {
        console.log('Netlify function not available, trying Express route');
        response = await fetch('/api/vapid-public-key');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${contentType}. Response: ${text.substring(0, 200)}`);
      }
      
      const { publicKey } = await response.json();
      this.vapidPublicKey = publicKey;
      console.log('VAPID public key retrieved successfully');
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      // Don't fail initialization, just log the error
    }

    // Check current subscription
    const subscription = await this.getCurrentSubscription();

    return {
      permission,
      isSupported,
      isSubscribed: !!subscription,
      subscription
    };
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return 'denied';
    }

    console.log('Current permission status:', Notification.permission);

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('Permission request result:', permission);
        return permission;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }

    return Notification.permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    console.log('Starting subscription process...');
    console.log('Registration available:', !!this.registration);
    console.log('VAPID key available:', !!this.vapidPublicKey);
    
    if (!this.registration) {
      console.error('Service Worker not registered');
      throw new Error('Service Worker not registered. Please try refreshing the page.');
    }
    
    if (!this.vapidPublicKey) {
      console.error('VAPID key missing');
      throw new Error('Server configuration error. Please try again later.');
    }

    try {
      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      console.log('Converted VAPID key to Uint8Array');

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('Browser subscription successful');

      // Send subscription to server
      let response;
      try {
        response = await fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
        console.log('Using Netlify function for subscription');
      } catch (netlifyError) {
        console.log('Netlify function not available, trying Express route');
        response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to register with server: ${response.status}`);
      }

      console.log('Server subscription registration successful');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error; // Re-throw to let the caller handle it
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription cancelled');
        return true;
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }

    return false;
  }

  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  async sendTestNotification(): Promise<void> {
    try {
      let response;
      try {
        response = await fetch('/.netlify/functions/test-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Using Netlify function for test notification');
      } catch (netlifyError) {
        console.log('Netlify function not available, trying Express route');
        response = await fetch('/api/test-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.ok) {
        console.log('Test notification sent');
      } else {
        console.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationManager = new NotificationManager();