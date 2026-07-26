import React, { useState, useEffect } from 'react';
import { Settings, Smartphone } from 'lucide-react';
import { PwaService } from '../services/pwa';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenInstallGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenInstallGuide }) => {
  const [isStandalone, setIsStandalone] = useState<boolean>(true);

  useEffect(() => {
    setIsStandalone(PwaService.isStandalone());

    const handleInstallChange = () => {
      setIsStandalone(PwaService.isStandalone());
    };
    window.addEventListener('pwa-installed', handleInstallChange);
    return () => window.removeEventListener('pwa-installed', handleInstallChange);
  }, []);

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
        {!isStandalone && onOpenInstallGuide && (
          <button
            onClick={onOpenInstallGuide}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', gap: '0.4rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
            title="スマホにアプリとしてインストール・保存"
          >
            <Smartphone size={16} /> 📲 アプリ化
          </button>
        )}

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
