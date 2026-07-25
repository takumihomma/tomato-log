import React from 'react';
import { Settings, X, ShieldCheck, HardDrive, Download, Bell, MapPin, HelpCircle } from 'lucide-react';

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

        {/* Section 1: Storage Persistence */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>1. 永続ストレージ設定</h3>
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
            容量逼迫時のデータ自動クリアを防ぐ保護機能です。「保護を有効化する」を許可するとデータを端末内に安全保持します。
          </div>
        </div>

        {/* Section 2: Backup */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>2. データ一括バックアップ</h3>
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

        {/* Section 3: Notification */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>3. タイマー通知の許可</h3>
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

        {/* Section 4: Geolocation Toggle */}
        <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--accent-orange)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>4. 位置情報の自動添付</h3>
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
