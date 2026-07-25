import React from 'react';
import { Settings, ShieldCheck, HardDrive } from 'lucide-react';

interface HeaderProps {
  isPersisted: boolean;
  onRequestPersist: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPersisted,
  onRequestPersist,
  onOpenSettings
}) => {
  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <header className="glass-panel header">
      <div className="logo-group">
        <img src="/favicon.svg" alt="Tomato Log Logo" className="logo-icon" />
        <div>
          <h1 className="app-title">Tomato Log</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{todayStr}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {isPersisted ? (
          <span className="badge badge-active" title="ブラウザのストレージ永続化が有効です">
            <ShieldCheck size={14} /> 永続ストレージ
          </span>
        ) : (
          <button
            onClick={onRequestPersist}
            className="badge"
            style={{ cursor: 'pointer', background: 'rgba(255, 112, 67, 0.15)', color: 'var(--accent-orange)' }}
            title="クリックしてデータ保護の永続化を有効にする"
          >
            <HardDrive size={14} /> 保護を有効化
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="btn btn-primary"
          style={{ padding: '0.5rem 0.95rem', fontSize: '0.88rem', gap: '0.4rem' }}
          title="設定とマニュアルを開く"
        >
          <Settings size={17} /> 設定 ⚙
        </button>
      </div>
    </header>
  );
};
