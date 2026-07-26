export class PwaService {
  private static deferredPrompt: any = null;
  private static isInitialized = false;

  /**
   * アプリとしてインストールされ、スタンドアロン起動されているか判定
   */
  static isStandalone(): boolean {
    if (typeof window === 'undefined') return false;

    const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isAndroidApp = document.referrer.startsWith('android-app://');

    return isStandaloneMatch || isIosStandalone || isAndroidApp;
  }

  /**
   * isIOS 判定
   */
  static isIos(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }

  /**
   * beforeinstallprompt イベントリスナーの初期化
   */
  static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      window.dispatchEvent(new Event('pwa-install-available'));
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      window.dispatchEvent(new Event('pwa-installed'));
    });

    this.isInitialized = true;
  }

  /**
   * ワンタップ インストールプロンプトの呼び出し
   */
  static async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * インストールプロンプトが利用可能か
   */
  static canPrompt(): boolean {
    return !!this.deferredPrompt;
  }
}
