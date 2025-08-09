import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff } from 'lucide-react';
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
      // Ensure we have the actual browser permission state
      const actualPermission = 'Notification' in window ? Notification.permission : 'denied';
      
      setNotificationState({
        ...state,
        permission: actualPermission
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
      // Set a safe fallback state
      setNotificationState({
        permission: 'denied',
        isSupported: false,
        isSubscribed: false,
        subscription: null
      });
      
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
      
      try {
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
        }
      } catch (error) {
        console.error('Subscription error:', error);
        toast({
          title: "Subscription Failed",
          description: error instanceof Error ? error.message : "Failed to set up push notifications",
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

  const getStatusBadge = () => {
    if (!notificationState.isSupported) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Not Supported</Badge>;
    }
    
    if (notificationState.permission === 'granted' && notificationState.isSubscribed) {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">Connected</Badge>;
    }
    
    if (notificationState.permission === 'denied') {
      return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">Blocked</Badge>;
    }
    
    return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Disabled</Badge>;
  };

  const isEnabled = notificationState.permission === 'granted' && notificationState.isSubscribed;

  return (
    <div className="flex items-center justify-between px-4 py-3 h-16 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
      {/* Left side: Bell icon, text, and status */}
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Notifications
        </span>
        {getStatusBadge()}
      </div>

      {/* Right side: Enable/Disable button */}
      <div>
        {!isEnabled ? (
          <Button
            onClick={handleEnableNotifications}
            disabled={isLoading || !notificationState.isSupported}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Enable
          </Button>
        ) : (
          <Button
            onClick={handleDisableNotifications}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-900"
          >
            Disable
          </Button>
        )}
      </div>
    </div>
  );
}