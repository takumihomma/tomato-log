import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TimerCard } from './components/TimerCard';
import { VoiceRecorder } from './components/VoiceRecorder';
import { AttachmentManager } from './components/AttachmentManager';
import { LogList } from './components/LogList';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallGuideModal } from './components/InstallGuideModal';

import { StorageService } from './services/storage';
import { ExportService } from './services/export';
import { NotificationService } from './services/notification';
import { PwaService } from './services/pwa';
import type { DayLog } from './domain/log';
import type { Attachment } from './domain/attachment';

export const App: React.FC = () => {
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [allLogs, setAllLogs] = useState<DayLog[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Geolocation setting state
  const [enableGeo, setEnableGeo] = useState<boolean>(false);

  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // PWA Install Guide Modal State
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(false);

  // Export Modal State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportPercent, setExportPercent] = useState<number>(0);
  const [exportMessage, setExportMessage] = useState<string>('');

  // Auto Record Trigger on Notification Return
  const [autoRecordTrigger, setAutoRecordTrigger] = useState<number>(0);

  // Check initial statuses & SW notifications
  useEffect(() => {
    PwaService.init();

    StorageService.requestPersistentStorage().then((persisted) => {
      setIsPersisted(persisted);
    });

    if (NotificationService.isSupported()) {
      setNotificationPermission(Notification.permission);
    }

    // Check URL parameters (e.g. /?action=record)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'record') {
      setAutoRecordTrigger(Date.now());
    }

    // Listen to Service Worker messages (e.g. TRIGGER_WHATS_UP)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TRIGGER_WHATS_UP') {
        setAutoRecordTrigger(Date.now());
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  // Fetch DayLogs and Attachments
  const refreshData = useCallback(async () => {
    const logs = await StorageService.getAllDayLogs();
    setAllLogs(logs);

    const atts = await StorageService.getAttachmentsForDate(selectedDate);
    setAttachments(atts);
  }, [selectedDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleRequestPersist = async () => {
    const res = await StorageService.requestPersistentStorage();
    setIsPersisted(res);
    if (res) {
      alert('データストレージの永続化が有効になりました！');
    } else {
      alert('ストレージ永続化のリクエストは許可されませんでした（ブラウザの設定をご確認ください）。');
    }
  };

  const handleRequestNotification = async () => {
    const perm = await NotificationService.requestPermission();
    setNotificationPermission(perm);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportPercent(0);
    setExportMessage('準備中...');

    try {
      await ExportService.exportAllDataAsZip((percent, msg) => {
        setExportPercent(percent);
        setExportMessage(msg);
      });
    } catch (err: any) {
      alert(`エクスポートエラー: ${err.message || err}`);
      setIsExporting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Bar Header with Settings Button */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Interval Alarm / Notification Timer */}
      <TimerCard />

      {/* Voice / Text Log Input Box */}
      <VoiceRecorder
        currentDate={selectedDate}
        enableGeo={enableGeo}
        onLogUpdated={refreshData}
        autoRecordTrigger={autoRecordTrigger}
      />

      {/* Attachments Preview Gallery */}
      <AttachmentManager
        attachments={attachments}
        onAttachmentDeleted={refreshData}
      />

      {/* Markdown Log List & Editor */}
      <LogList
        logs={allLogs}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onRefresh={refreshData}
      />

      {/* Settings & Manual Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isPersisted={isPersisted}
        onRequestPersist={handleRequestPersist}
        onExport={handleExport}
        notificationPermission={notificationPermission}
        onRequestNotification={handleRequestNotification}
        enableGeo={enableGeo}
        onToggleGeo={setEnableGeo}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Install Guide Modal */}
      <InstallGuideModal
        isOpen={isInstallGuideOpen}
        onClose={() => setIsInstallGuideOpen(false)}
      />

      {/* Export Progress Modal */}
      <ExportModal
        isOpen={isExporting}
        percent={exportPercent}
        message={exportMessage}
        onClose={() => setIsExporting(false)}
      />
    </div>
  );
};

export default App;
