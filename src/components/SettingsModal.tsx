import React, { useState, useEffect } from 'react';
import { Settings, X, ShieldCheck, HardDrive, Download, Bell, MapPin, HelpCircle, Cloud, CloudOff, RefreshCw, Key, CheckCircle, Clock } from 'lucide-react';
import { GoogleDriveService, type GoogleDriveAuthState } from '../services/googleDrive';
import { StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPersisted: boolean;
  onRequestPersist: () => void;
  onExport: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
  enableGeo: boolean;
  onToggleGeo: (enabled: boolean) => void;
}

interface ScheduleConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const STORAGE_KEY_SCHEDULE = 'tomato_log_timer_schedule';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isPersisted,
  onRequestPersist,
  onExport,
  notificationPermission,
  onRequestNotification,
  enableGeo,
  onToggleGeo
}) => {
  const [gdriveAuth, setGdriveAuth] = useState<GoogleDriveAuthState>(GoogleDriveService.getAuthState());
  const [clientIdInput, setClientIdInput] = useState<string>(GoogleDriveService.getClientId());
  const [showClientIdField, setShowClientIdField] = useState<boolean>(!GoogleDriveService.getClientId());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Timer Schedule State
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { enabled: false, startTime: '09:00', endTime: '18:00' };
  });

  useEffect(() => {
    if (isOpen) {
      setGdriveAuth(GoogleDriveService.getAuthState());
      setClientIdInput(GoogleDriveService.getClientId());
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (saved) {
        try { setSchedule(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
  }, [isOpen]);

  const updateSchedule = (updated: Partial<ScheduleConfig>) => {
    setSchedule((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(next));
      // Notify other components (like TimerCard) of storage change
      window.dispatchEvent(new Event('storage'));
      return next;
    });
  };

  const handleSaveClientId = () => {
    GoogleDriveService.setClientId(clientIdInput);
    setStatusMessage('Google OAuth Client ID を保存しました。');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleGDriveLogin = async () => {
    try {
      setStatusMessage('Google 認証を実行中...');
      const auth = await GoogleDriveService.requestLogin();
      setGdriveAuth(auth);
      setStatusMessage(`Google Drive と連携しました (${auth.userEmail || auth.userName})`);
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err: any) {
      setStatusMessage(`連携失敗: ${err.message || '認証がキャンセルされました'}`);
    }
  };

  const handleGDriveLogout = () => {
    GoogleDriveService.logout();
    setGdriveAuth(GoogleDriveService.getAuthState());
    setStatusMessage('Google Drive 連携を解除しました。');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMessage('Google Drive へ全データを同期中...');
    try {
      const logs = await StorageService.getAllDayLogs();
      const attachments = await StorageService.getAllAttachments();
      const count = await GoogleDriveService.syncAll(logs, attachments);
      const updatedAuth = GoogleDriveService.getAuthState();
      setGdriveAuth(updatedAuth);
      setStatusMessage(`同期完了: ${count} 件のログを Google Drive へ保存しました。`);
    } catch (err: any) {
      setStatusMessage(`同期失敗: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex' }}>
              <Settings size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>アプリ設定 & マニュアル ⚙</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>各種機能の設定と使い方の説明</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Section 1: Auto Schedule Settings */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>1. ⏰ 毎日自動起動スケジュール</h3>
            </div>
            <button
              onClick={() => updateSchedule({ enabled: !schedule.enabled })}
              className={`btn ${schedule.enabled ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            >
              {schedule.enabled ? 'スケジュール ON' : 'スケジュール OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>開始時刻:</label>
              <input
                type="time"
                value={schedule.startTime}
                onChange={(e) => updateSchedule({ startTime: e.target.value })}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.3rem 0.6rem', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>終了時刻:</label>
              <input
                type="time"
                value={schedule.endTime}
                onChange={(e) => updateSchedule({ endTime: e.target.value })}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', padding: '0.3rem 0.6rem', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.7rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--primary)" /> 【使い方・マニュアル】
            </p>
            ON に設定すると、毎日指定した開始時刻（例: 09:00）にタイマーが全自動でスタートし、終了時刻（例: 18:00）になると全自動で停止します。
          </div>
        </div>

        {/* Section 2: Storage Persistence */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>2. 永続ストレージ設定</h3>
            </div>
            {isPersisted ? (
              <span className="badge badge-active">
                <ShieldCheck size={14} /> 永続化 有効中
              </span>
            ) : (
              <button onClick={onRequestPersist} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}>
                <HardDrive size={15} /> 保護を有効化する
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.7rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--accent-orange)" /> 【使い方・マニュアル】
            </p>
            端末の空き容量不足時に、ブラウザがアプリデータ（IndexedDB）を勝手に自動削除するのを防ぐ保護機能です。（※有効化しなくてもデータはブラウザ内に常時保存されています）
          </div>
        </div>

        {/* Section 3: Google Drive Auto Backup */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cloud size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>3. Google Drive クラウド自動同期</h3>
            </div>
            {gdriveAuth.isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-active" style={{ background: 'rgba(52, 199, 89, 0.15)', color: '#34c759' }}>
                  <CheckCircle size={13} /> {gdriveAuth.userEmail || '連携中'}
                </span>
                <button onClick={handleGDriveLogout} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}>
                  <CloudOff size={13} /> 解除
                </button>
              </div>
            ) : (
              <button onClick={handleGDriveLogin} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem', background: '#4285F4', borderColor: '#4285F4' }}>
                <Cloud size={15} /> Google Drive と連携
              </button>
            )}
          </div>

          {gdriveAuth.isConnected && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                最終同期: {gdriveAuth.lastSyncedAt || '未実施'}
              </div>
              <button onClick={handleManualSync} disabled={isSyncing} className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', gap: '0.35rem' }}>
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? '同期中...' : '今すぐ手動同期'}
              </button>
            </div>
          )}

          {/* Client ID Setting Toggle */}
          <div style={{ fontSize: '0.78rem' }}>
            <button
              onClick={() => setShowClientIdField(!showClientIdField)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}
            >
              <Key size={13} /> {showClientIdField ? 'Client ID 設定を隠す' : '⚙ OAuth Client ID の手動設定'}
            </button>

            {showClientIdField && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Google OAuth 2.0 Client ID:</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxx-xxxx.apps.googleusercontent.com"
                    style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.78rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}
                  />
                  <button onClick={handleSaveClientId} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>

          {statusMessage && (
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', background: 'rgba(52, 199, 89, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              {statusMessage}
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.7rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--accent-blue)" /> 【使い方・マニュアル】
            </p>
            連携すると、ログ記録時にご自身の Google Drive の `TomatoLog` フォルダ内へ、日別 Markdown（.md）データと添付画像が全自動で保存・同期されます。
          </div>
        </div>

        {/* Section 4: Backup */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>4. ローカル一括バックアップ</h3>
            </div>
            <button onClick={onExport} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}>
              <Download size={15} /> ZIPバックアップ出力
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.7rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--accent-blue)" /> 【使い方・マニュアル】
            </p>
            全日付の Markdown（.md）ログと添付画像を 1 つの ZIP ファイルにまとめてダウンロード保存します。
          </div>
        </div>

        {/* Section 5: Notification */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>5. タイマー通知の許可</h3>
            </div>
            {notificationPermission === 'granted' ? (
              <span className="badge badge-active">
                <Bell size={14} /> 通知 許可済み
              </span>
            ) : (
              <button onClick={onRequestNotification} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}>
                <Bell size={15} /> 通知を許可する
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.7rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--primary)" /> 【使い方・マニュアル】
            </p>
            設定したタイマー時間が経過した際、端末画面にリマインダー通知を送信する許可設定です。
          </div>
        </div>

        {/* Section 6: Geolocation Toggle */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--accent-orange)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>6. 位置情報の自動添付</h3>
            </div>
            <button
              onClick={() => onToggleGeo(!enableGeo)}
              className={`btn ${enableGeo ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}
            >
              <MapPin size={15} /> {enableGeo ? '位置情報添付 ON' : '位置情報添付 OFF'}
            </button>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.7rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--accent-orange)" /> 【使い方・マニュアル】
            </p>
            ON に設定すると、ログ保存時に現在地（緯度・経度）を取得し、Google Maps リンクを Markdown 内へ自動的に添付します。
          </div>
        </div>

        {/* Footer Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
