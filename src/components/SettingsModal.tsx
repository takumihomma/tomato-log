import React from 'react';
import { Settings, X, ShieldCheck, HardDrive, Download, Bell, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPersisted: boolean;
  onRequestPersist: () => void;
  onExport: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isPersisted,
  onRequestPersist,
  onExport,
  notificationPermission,
  onRequestNotification
}) => {
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5.rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex' }}>
              <Settings size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>アプリ設定 & マニュアル</h2>
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

        {/* Section 1: Storage Persistence */}
        <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>1. 永続ストレージ設定</h3>
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

          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--accent-orange)" /> 【使い方・マニュアル】
            </p>
            スマホやブラウザの空き容量が逼迫した際、OSやブラウザが保存データを自動消去（データクリア）するのを防ぐ保護機能です。
            「保護を有効化する」ボタンをタップして許可を与えると、「永続化 有効中」となりデータが安全に端末内へ保持されます。
          </div>
        </div>

        {/* Section 2: Backup */}
        <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>2. データ一括バックアップ</h3>
            </div>
            <button onClick={onExport} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}>
              <Download size={15} /> ZIPバックアップ出力
            </button>
          </div>

          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--accent-blue)" /> 【使い方・マニュアル】
            </p>
            アプリ内に保存されたすべての日付別 Markdown（.md）ログと、添付したすべての画像・ファイルを1つの ZIP ファイルにまとめてダウンロード保存します。
            定期的なバックアップや、スマホの機種変更時のデータ移行・手元保管にご活用ください。
          </div>
        </div>

        {/* Section 3: Notification */}
        <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>3. タイマー通知の許可</h3>
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

          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HelpCircle size={14} color="var(--primary)" /> 【使い方・マニュアル】
            </p>
            設定したタイマー時間（15分、30分、1時間など）が経過した際、スマホやPCの画面へ「ログの記録時間です」という通知を送信する許可設定です。
            通知をタップすることで、即座にアプリが開きマイク音声入力を開始できます。
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
