import React from 'react';
import { X, Share, PlusSquare, Smartphone, Download, CheckCircle } from 'lucide-react';
import { PwaService } from '../services/pwa';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isIos = PwaService.isIos();
  const canPrompt = PwaService.canPrompt();

  const handlePromptClick = async () => {
    const success = await PwaService.promptInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0,0,0,0.8)',
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
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex' }}>
              <Smartphone size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>アプリをスマホに追加 (PWA)</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ホーム画面に追加してアプリとして快適に利用できます</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}>
            <X size={20} />
          </button>
        </div>

        {/* ワンタップインストール可能時 (Android/Chrome等) */}
        {canPrompt && (
          <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>ワンタップでアプリとしてインストールできます</p>
            <button onClick={handlePromptClick} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.92rem', gap: '0.5rem', justifyContent: 'center' }}>
              <Download size={18} /> 今すぐアプリをインストール
            </button>
          </div>
        )}

        {/* OS別 手動追加手順 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isIos ? (
            /* iPhone (iOS / Safari) 手順 */
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Smartphone size={18} /> iPhone / iPad (Safari) での手順
              </h3>
              <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.7' }}>
                <li>Safari 画面下の <strong>「共有アイコン <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />」</strong> をタップします。</li>
                <li>メニューをスクロールし、<strong>「ホーム画面に追加 <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />」</strong> をタップします。</li>
                <li>右上の <strong>「追加」</strong> をタップすると、ホーム画面にアプリが開設されます。</li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome 手順 */
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Smartphone size={18} /> Android (Chrome) での手順
              </h3>
              <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.7' }}>
                <li>Chrome 画面右上の <strong>「 ︙ (3点メニュー)」</strong> をタップします。</li>
                <li>メニューから <strong>「アプリをインストール」</strong> または <strong>「ホーム画面に追加」</strong> を選択します。</li>
                <li>確認画面で「インストール」をタップします。</li>
              </ol>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', lineHeight: '1.5' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle size={14} color="var(--accent-green)" /> アプリ化のメリット
          </p>
          アドレスバーがなくなり全画面でサクサク動作し、オフラインでもログの閲覧・音声記録が使えます。
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
