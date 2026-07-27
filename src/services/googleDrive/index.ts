import type { DayLog } from '../../domain/log';
import type { Attachment } from '../../domain/attachment';

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
const FOLDER_NAME = 'TomatoLog';

export interface GoogleDriveAuthState {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  lastSyncedAt?: string;
  autoSync: boolean;
}

const STORAGE_KEY_AUTH = 'tomato_log_gdrive_auth';
const STORAGE_KEY_CLIENT_ID = 'tomato_log_gdrive_client_id';

export class GoogleDriveService {
  private static tokenClient: any = null;

  /**
   * Google Identity Services (GIS) スクリプトの動的ロード
   */
  static async loadGsiScript(): Promise<boolean> {
    if ((window as any).google?.accounts?.oauth2) {
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  // アプリ標準公式 Client ID
  private static readonly PRESET_CLIENT_ID = '697956634455-5epkq3u3btcvlrth1so2nkdc6l31nhak.apps.googleusercontent.com';

  /**
   * 保存されている OAuth Client ID の取得
   */
  static getClientId(): string {
    const customId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
    if (customId && customId.trim()) return customId.trim();

    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || (import.meta as any).env?.GOOGLE_CLIENT_ID;
    if (envClientId && envClientId.trim()) return envClientId.trim();

    // デフォルト公式 Client ID
    return this.PRESET_CLIENT_ID;
  }

  /**
   * カスタム OAuth Client ID の保存
   */
  static setClientId(clientId: string): void {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  }

  /**
   * 認証状態の取得
   */
  static getAuthState(): GoogleDriveAuthState {
    const data = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!data) {
      return { isConnected: false, autoSync: true };
    }
    try {
      const parsed: GoogleDriveAuthState = JSON.parse(data);
      if (parsed.tokenExpiresAt && Date.now() >= parsed.tokenExpiresAt) {
        parsed.accessToken = undefined;
      }
      return parsed;
    } catch {
      return { isConnected: false, autoSync: true };
    }
  }

  /**
   * 認証状態の保存
   */
  static saveAuthState(state: Partial<GoogleDriveAuthState>): GoogleDriveAuthState {
    const current = this.getAuthState();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
    return updated;
  }

  /**
   * 連携解除（ログアウト）
   */
  static logout(): void {
    const current = this.getAuthState();
    if (current.accessToken && (window as any).google?.accounts?.oauth2) {
      try {
        (window as any).google.accounts.oauth2.revoke(current.accessToken, () => {});
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }

  /**
   * Google 認証（ログイン）を呼び出し
   * @param silent true の場合は画面ポップアップを出さずに水面下でトークン再取得を試みる
   */
  static async requestLogin(silent: boolean = false): Promise<GoogleDriveAuthState> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error('Google Client ID が設定されていません。');
    }

    await this.loadGsiScript();

    const authState = this.getAuthState();

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          hint: authState.userEmail,
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error(`Google 認証エラー: ${response.error}`));
              return;
            }

            const accessToken = response.access_token;
            const expiresIn = response.expires_in || 3600;
            const tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

            try {
              const userInfo = await GoogleDriveService.fetchUserInfo(accessToken);
              const updatedState = GoogleDriveService.saveAuthState({
                isConnected: true,
                accessToken,
                tokenExpiresAt,
                userEmail: userInfo.email || authState.userEmail,
                userName: userInfo.name || authState.userName,
                userPicture: userInfo.picture || authState.userPicture,
              });
              resolve(updatedState);
            } catch (err) {
              reject(err);
            }
          },
        });

        // silent の場合は prompt: '' (ポップアップなし)、手動ログイン時は prompt: 'consent'
        this.tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * ユーザープロファイル情報の取得
   */
  private static async fetchUserInfo(accessToken: string): Promise<{ email?: string; name?: string; picture?: string }> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
  }

  /**
   * 有効なアクセストークンの取得
   * @param interactive 手動操作時のみ true (ポップアップ許可)
   */
  static async getValidToken(interactive: boolean = false): Promise<string | null> {
    let auth = this.getAuthState();
    if (!auth.isConnected) return null;

    // トークンがまだ有効
    if (auth.accessToken && auth.tokenExpiresAt && Date.now() < auth.tokenExpiresAt) {
      return auth.accessToken;
    }

    // トークン期限切れ時: バックグラウンド（ログ保存時）はサイレント取得のみ試行し、ポップアップは出さない
    try {
      const updated = await this.requestLogin(!interactive);
      return updated.accessToken || null;
    } catch (err) {
      console.warn('サイレントトークン再取得失敗 (ポップアップは抑制されました):', err);
      return null;
    }
  }

  /**
   * TomatoLog 専用フォルダの ID を取得（なければ作成）
   */
  static async getOrCreateFolderId(token: string): Promise<string> {
    const q = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!searchRes.ok) throw new Error('Google Drive フォルダ検索失敗');
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    if (!createRes.ok) throw new Error('Google Drive フォルダ作成失敗');
    const createData = await createRes.json();
    return createData.id;
  }

  /**
   * DayLog (.md) を Google Drive へ保存・更新
   */
  static async uploadDayLog(dayLog: DayLog): Promise<void> {
    const auth = this.getAuthState();
    if (!auth.isConnected || !auth.autoSync) return;

    const token = await this.getValidToken();
    if (!token) return;

    const folderId = await this.getOrCreateFolderId(token);
    const fileName = `${dayLog.date}.md`;

    const q = `'${folderId}' in parents and name = '${fileName}' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    const fileContent = dayLog.markdown;
    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' });

    if (existingFile) {
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/markdown;charset=utf-8',
        },
        body: blob,
      });
    } else {
      const metadata = {
        name: fileName,
        mimeType: 'text/markdown',
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    }

    this.saveAuthState({ lastSyncedAt: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) });
  }

  /**
   * 添付ファイルを Google Drive へ保存・更新
   */
  static async uploadAttachment(attachment: Attachment): Promise<void> {
    const auth = this.getAuthState();
    if (!auth.isConnected || !auth.autoSync) return;

    const token = await this.getValidToken();
    if (!token) return;

    const folderId = await this.getOrCreateFolderId(token);
    const fileName = attachment.filename;

    const q = `'${folderId}' in parents and name = '${fileName}' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    const blob = new Blob([attachment.data], { type: attachment.mimeType });

    if (existingFile) {
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
      await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': attachment.mimeType,
        },
        body: blob,
      });
    } else {
      const metadata = {
        name: fileName,
        mimeType: attachment.mimeType,
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    }
  }

  /**
   * すべてのログを一括同期
   */
  static async syncAll(dayLogs: DayLog[], attachments: Attachment[]): Promise<number> {
    const auth = this.getAuthState();
    if (!auth.isConnected) return 0;

    let count = 0;
    for (const log of dayLogs) {
      await this.uploadDayLog(log);
      count++;
    }
    for (const att of attachments) {
      await this.uploadAttachment(att);
    }
    this.saveAuthState({ lastSyncedAt: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) });
    return count;
  }
}
