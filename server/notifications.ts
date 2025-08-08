import webpush from 'web-push';
import { storage } from './storage';

// VAPID keys - in production, these should be environment variables
const VAPID_PUBLIC_KEY = 'BCasQEij984DjtPKY6_CGfO5n1E4amUkIzjcejgbZtmSawGAwdnLjrzgETo1Z4BdP4xDDwfPqvrE9259P8GkIqo';
const VAPID_PRIVATE_KEY = 'ZvBn9OX-1loDEZWFf5kjT-7rgJTJWivY4OJ82yV52Z0';

// Configure VAPID details
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

export class NotificationService {
  static getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  static async sendNotificationToAll(payload: NotificationPayload): Promise<void> {
    try {
      const subscriptions = await storage.getPushSubscriptions();
      
      if (subscriptions.length === 0) {
        console.log('No push subscriptions found');
        return;
      }

      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
          );
          console.log('Push notification sent successfully');
        } catch (error) {
          console.error('Error sending push notification:', error);
          
          // If the subscription is invalid, remove it
          if (error instanceof Error && (error as any).statusCode === 410) {
            console.log('Removing invalid subscription');
            await storage.deletePushSubscription(subscription.endpoint);
          }
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error in sendNotificationToAll:', error);
    }
  }

  static async sendTaskCompleteNotification(taskName: string): Promise<void> {
    const payload: NotificationPayload = {
      title: '⏰ Task Complete!',
      body: `Your "${taskName}" timer just finished.`,
      url: '/'
    };

    await this.sendNotificationToAll(payload);
  }

  static async sendNextTaskStartedNotification(taskName: string): Promise<void> {
    const payload: NotificationPayload = {
      title: '🚀 Next Task Started',
      body: `Started "${taskName}" timer.`,
      url: '/'
    };

    await this.sendNotificationToAll(payload);
  }
}