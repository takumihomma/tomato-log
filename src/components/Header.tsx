import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
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
        <button
          onClick={onOpenSettings}
          className="btn btn-primary"
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem', gap: '0.45rem' }}
          title="設定とマニュアルを開く"
        >
          <Settings size={18} /> 設定 ⚙
        </button>
      </div>
    </header>
  );
};
