import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NotificationService } from '../notification';

export class NativeNotificationService {
  /**
   * 通知パーミッションの要求・許可確認
   */
  static async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        return res.display === 'granted';
      } catch (err) {
        console.warn('Native LocalNotifications permission error:', err);
        return false;
      }
    } else {
      const perm = await NotificationService.requestPermission();
      return perm === 'granted';
    }
  }

  /**
   * 即時またはバックグラウンド指定時刻でのローカル通知スケジュール設定
   * ネイティブアプリでは指定したサウンド (whatsup) がスマホのスピーカーからバックグラウンド直接再生されます。
   */
  static async scheduleNotification(title: string, body: string, delaySeconds: number = 0): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const scheduleAt = new Date(Date.now() + delaySeconds * 1000);

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Date.now() % 100000),
              schedule: { at: scheduleAt },
              sound: 'whatsup.wav',
              actionTypeId: 'OPEN_RECORD',
              extra: {
                action: 'record'
              }
            }
          ]
        });
      } catch (err) {
        console.error('Error scheduling native notification:', err);
      }
    } else {
      // Web / PWA fallback
      if (delaySeconds > 0) {
        setTimeout(() => {
          NotificationService.sendNotification(title, body);
        }, delaySeconds * 1000);
      } else {
        NotificationService.sendNotification(title, body);
      }
    }
  }

  /**
   * ネイティブ通知タップイベントのリスナー登録
   */
  static addActionListener(onNotificationClick: () => void): void {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        if (notification.actionId === 'tap' || notification.actionId === 'OPEN_RECORD') {
          onNotificationClick();
        }
      });
    }
  }
}
