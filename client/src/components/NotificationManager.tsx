import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { notificationManager, type NotificationState } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationManagerProps {
  onNotificationStateChange?: (isEnabled: boolean) => void;
}

export function NotificationManager({ onNotificationStateChange }: NotificationManagerProps) {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    subscription: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    onNotificationStateChange?.(notificationState.isSubscribed && notificationState.permission === 'granted');
  }, [notificationState, onNotificationStateChange]);

  const initializeNotifications = async () => {
    setIsLoading(true);
    try {
      const state = await notificationManager.initialize();
      setNotificationState(state);
    } catch (error) {
      console.error('Error initializing notifications:', error);
      toast({
        title: "Notification Error",
        description: "Failed to initialize push notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('Starting notification setup...');
      
      // First request permission
      const permission = await notificationManager.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission !== 'granted') {
        if (permission === 'denied') {
          toast({
            title: "Permission Denied",
            description: "Please enable notifications in browser settings: Settings → Privacy & Security → Notifications",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Permission Required",
            description: "Please allow notifications when prompted by your browser",
            variant: "destructive"
          });
        }
        
        // Update state to reflect current permission
        setNotificationState(prev => ({
          ...prev,
          permission
        }));
        return;
      }

      // Then subscribe to push notifications
      console.log('Attempting to subscribe to push notifications...');
      const subscription = await notificationManager.subscribe();
      
      if (subscription) {
        setNotificationState(prev => ({
          ...prev,
          permission,
          isSubscribed: true,
          subscription
        }));
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications when tasks complete"
        });
        
        // Send a test notification to verify it works
        setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎉 Notifications Working!', {
              body: 'You\'ll now receive notifications when your tasks complete.',
              icon: '/favicon.ico'
            });
          }
        }, 1000);
        
      } else {
        toast({
          title: "Subscription Failed",
          description: "Failed to set up push notifications. Check browser console for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: `Failed to enable notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await notificationManager.unsubscribe();
      
      if (success) {
        setNotificationState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null
        }));
        
        toast({
          title: "Notifications Disabled",
          description: "Push notifications have been turned off"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to disable notifications",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationManager.sendTestNotification();
      toast({
        title: "Test Sent",
        description: "Check for the test notification!"
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    }
  };

  if (!notificationState.isSupported) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (notificationState.permission === 'granted' && notificationState.isSubscribed) {
      return <Badge variant="default" className="bg-green-500">Enabled</Badge>;
    } else if (notificationState.permission === 'denied') {
      return <Badge variant="destructive">Blocked</Badge>;
    } else {
      return <Badge variant="secondary">Disabled</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Get notified when your timers complete, even when the tab is closed
          {notificationState.permission === 'denied' && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Notifications are blocked. To enable: <br/>
              • Chrome/Safari: Click the lock icon → Notifications → Allow <br/>
              • Firefox: Click the shield icon → Permissions → Allow Notifications
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {!notificationState.isSubscribed || notificationState.permission !== 'granted' ? (
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Enable Notifications
            </Button>
          ) : (
            <Button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BellOff className="w-4 h-4" />
              Disable Notifications
            </Button>
          )}
          
          {notificationState.permission === 'granted' && (
            <Button
              onClick={handleTestNotification}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              Test Push
            </Button>
          )}
          
          {/* Simple browser notification test */}
          {notificationState.permission === 'granted' && (
            <Button
              onClick={() => {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Browser Test', {
                    body: 'Simple browser notification working!',
                    icon: '/favicon.ico'
                  });
                }
              }}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              Test Browser
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Status:</strong> {notificationState.permission}</p>
          <p><strong>Subscribed:</strong> {notificationState.isSubscribed ? 'Yes' : 'No'}</p>
          <p><strong>Service Worker:</strong> {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}</p>
          <p><strong>Push Manager:</strong> {'PushManager' in window ? 'Supported' : 'Not Supported'}</p>
        </div>
      </CardContent>
    </Card>
  );
}