export class WakeLockService {
  private static wakeLock: any = null;

  /**
   * Screen Wake Lock がサポートされているか確認
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'wakeLock' in navigator;
  }

  /**
   * 画面の自動スリープ/消灯を防止（有効化）
   */
  static async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      if (this.wakeLock !== null) {
        return true;
      }
      this.wakeLock = await (navigator as any).wakeLock.request('screen');

      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
      });

      return true;
    } catch (err: any) {
      console.warn('Wake Lock request failed:', err.message || err);
      this.wakeLock = null;
      return false;
    }
  }

  /**
   * 画面の自動消灯防止を解除（無効化）
   */
  static async releaseWakeLock(): Promise<void> {
    if (this.wakeLock !== null) {
      try {
        await this.wakeLock.release();
      } catch (err) {
        console.error('Error releasing Wake Lock:', err);
      } finally {
        this.wakeLock = null;
      }
    }
  }

  /**
   * 現在 Wake Lock が有効化されているか
   */
  static isActive(): boolean {
    return this.wakeLock !== null;
  }
}
