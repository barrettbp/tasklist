class NotificationManager {
  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermissionStatus(): NotificationPermission {
    return this.isSupported() ? Notification.permission : 'denied';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  showTaskComplete(taskName: string, nextTaskName?: string) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const title = `✅ ${taskName} completed!`;
    const body = nextTaskName 
      ? `Starting "${nextTaskName}" next...`
      : 'All tasks completed!';

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro-complete',
      requireInteraction: false,
      silent: false
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  showTaskStart(taskName: string) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const title = `🚀 Starting: ${taskName}`;
    const body = 'Focus time! Stay productive.';

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro-start',
      requireInteraction: false,
      silent: false
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
      notification.close();
    }, 3000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  showBreakReminder(duration: number) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const title = '☕ Break Time!';
    const body = `Take a ${duration}-minute break to recharge.`;

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'pomodoro-break',
      requireInteraction: false,
      silent: false
    });

    // Auto-close after 4 seconds
    setTimeout(() => {
      notification.close();
    }, 4000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

export const notificationManager = new NotificationManager();