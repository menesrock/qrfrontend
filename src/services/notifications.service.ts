/**
 * Local Notification Service
 * Uses Web Notifications API for browser notifications
 * Works on both web and mobile (with proper permissions)
 */

// Type guard for window object
const isWindowAvailable = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Type declaration for Notification API
declare global {
  interface Window {
    Notification: typeof Notification;
  }
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = isWindowAvailable();
    if (this.isSupported && typeof window !== 'undefined' && window.Notification) {
      this.permission = window.Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[Notification] Notifications are not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      console.log('[Notification] Permission already granted');
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('[Notification] Permission was denied. Please enable in browser settings.');
      return false;
    }

    try {
      if (typeof window === 'undefined' || !window.Notification) {
        console.warn('[Notification] Window.Notification not available');
        return false;
      }
      console.log('[Notification] Requesting permission...');
      const permission = await window.Notification.requestPermission();
      this.permission = permission;
      console.log('[Notification] Permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[Notification] Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are supported and permitted
   */
  isAvailable(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Show a notification
   * @param fallbackCallback Optional callback to call if notification cannot be shown (e.g., show toast)
   */
  async show(title: string, options?: NotificationOptions, fallbackCallback?: (title: string, body?: string) => void): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('[Notification] Notifications are not available. Permission:', this.permission);
      // Use fallback if available
      if (fallbackCallback) {
        fallbackCallback(title, options?.body);
      }
      return;
    }

    try {
      if (typeof window === 'undefined' || !window.Notification) {
        console.warn('[Notification] Window.Notification not available');
        return;
      }
      console.log('[Notification] Showing notification:', title, options);
      
      // Check if we're in a focused window
      const isFocused = document.hasFocus();
      console.log('[Notification] Window focused:', isFocused);
      
      const notification = new window.Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        requireInteraction: true, // Keep notification visible until user interacts
        silent: false, // Make sure sound is enabled
        ...options,
      });

      console.log('[Notification] Notification created successfully', {
        title: notification.title,
        body: notification.body,
        tag: notification.tag,
      });
      
      // Log notification events
      notification.onshow = () => {
        console.log('[Notification] Notification shown');
      };
      
      notification.onerror = (error) => {
        console.error('[Notification] Notification error:', error);
      };
      
      notification.onclose = () => {
        console.log('[Notification] Notification closed');
      };

      // Auto-close after 10 seconds (longer for visibility)
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('[Notification] Error showing notification:', error);
    }
  }

  /**
   * Show order notification for waiters
   */
  async showOrderNotification(order: {
    tableName: string;
    customerName: string;
    items: Array<{ menuItemName: string; quantity: number }>;
    totalAmount: number;
  }): Promise<void> {
    const itemSummary = order.items
      .map((item) => `${item.menuItemName} x${item.quantity}`)
      .join(', ');
    
    const message = `Masa ${order.tableName}'den ${order.customerName} ${itemSummary} istiyor`;
    
    await this.show(`Yeni Sipariş - Masa ${order.tableName}`, {
      body: message,
      tag: `order-${order.tableName}`,
      data: { type: 'order', tableName: order.tableName },
    });
  }

  /**
   * Show call request notification for waiters
   */
  async showCallRequestNotification(request: {
    tableName: string;
    customerName: string;
    type: string;
  }): Promise<void> {
    const typeMessages: Record<string, string> = {
      bill: 'hesap istiyor',
      napkin: 'peçete istiyor',
      cleaning: 'temizlik istiyor',
    };

    const message = `Masa ${request.tableName}'den ${request.customerName} ${typeMessages[request.type] || 'bir şey istiyor'}`;
    
    await this.show(`Garson Çağrısı - Masa ${request.tableName}`, {
      body: message,
      tag: `call-${request.tableName}-${request.type}`,
      data: { type: 'call', tableName: request.tableName, callType: request.type },
    });
  }

  /**
   * Show order confirmation notification for chefs
   */
  async showChefOrderNotification(order: {
    tableName: string;
    customerName: string;
    items: Array<{ menuItemName: string; quantity: number }>;
    queuePosition?: number;
  }): Promise<void> {
    const itemSummary = order.items
      .map((item) => `${item.menuItemName} x${item.quantity}`)
      .join(', ');
    
    const queueInfo = order.queuePosition ? ` (Sıra: #${order.queuePosition})` : '';
    const message = `Masa ${order.tableName}'den ${order.customerName} ${itemSummary} istiyor${queueInfo}`;
    
    await this.show(`Yeni Sipariş - Masa ${order.tableName}`, {
      body: message,
      tag: `chef-order-${order.tableName}`,
      data: { type: 'chef-order', tableName: order.tableName },
    });
  }
}

export const notificationService = new NotificationService();

