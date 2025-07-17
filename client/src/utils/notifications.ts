// Notification utilities for macOS push notifications
export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.requestPermission();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async requestPermission(): Promise<void> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  public async showTaskComplete(taskName: string, nextTaskName?: string): Promise<void> {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission === 'granted') {
      const notification = new Notification(`Task Completed: ${taskName}`, {
        body: nextTaskName ? `Next up: ${nextTaskName}` : 'All tasks completed!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'task-timer',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  public async showTaskStart(taskName: string): Promise<void> {
    if (this.permission !== 'granted') {
      await this.requestPermission();
    }

    if (this.permission === 'granted') {
      const notification = new Notification(`Started: ${taskName}`, {
        body: 'Timer is now running',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'task-timer-start',
        requireInteraction: false,
        silent: false
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        notification.close();
      }, 3000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  public isSupported(): boolean {
    return 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationManager = NotificationManager.getInstance();