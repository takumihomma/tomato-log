import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Play, Square, Volume2, ShieldCheck } from 'lucide-react';
import { NotificationService } from '../services/notification';
import { NativeNotificationService } from '../services/nativeNotification';
import { VoiceSynthService } from '../services/speech/tts';
import { WakeLockService } from '../services/wakeLock';

interface TimerCardProps {
  onTriggerRecord?: () => void;
}

interface ScheduleConfig {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

const STORAGE_KEY_SCHEDULE = 'tomato_log_timer_schedule';
const STORAGE_KEY_TARGET_TIME = 'tomato_log_timer_target_timestamp';
const STORAGE_KEY_INTERVAL_MINS = 'tomato_log_timer_interval_mins';
const STORAGE_KEY_IS_RUNNING = 'tomato_log_timer_is_running';

export const TimerCard: React.FC<TimerCardProps> = ({ onTriggerRecord }) => {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_INTERVAL_MINS);
    return saved ? parseInt(saved, 10) : 30;
  });
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_IS_RUNNING) === 'true';
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(30 * 60);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);

  // Auto Schedule Config State
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { enabled: false, startTime: '09:00', endTime: '18:00' };
  });

  const timerRef = useRef<number | null>(null);

  // タイマー開始処理（絶対時間タイムスタンプの物理保存 & ネイティブ通知音予約）
  const startTimer = useCallback(async (customMins?: number) => {
    const mins = customMins || intervalMinutes;
    const targetTimestamp = Date.now() + mins * 60 * 1000;

    localStorage.setItem(STORAGE_KEY_TARGET_TIME, targetTimestamp.toString());
    localStorage.setItem(STORAGE_KEY_INTERVAL_MINS, mins.toString());
    localStorage.setItem(STORAGE_KEY_IS_RUNNING, 'true');

    setIsRunning(true);
    setTimeLeftSeconds(mins * 60);

    // ネイティブローカル通知音 (whatsup) を指定時間後（スリープ・別アプリ使用中対応）に予約
    await NativeNotificationService.scheduleNotification(
      '🍅 What\'s up? ログの時間です！',
      `設定された${mins}分が経過しました。タップして近況を録音しましょう。`,
      mins * 60
    );

    const active = await WakeLockService.requestWakeLock();
    setIsWakeLockActive(active);
  }, [intervalMinutes]);

  // タイマー停止処理
  const stopTimer = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY_TARGET_TIME);
    localStorage.setItem(STORAGE_KEY_IS_RUNNING, 'false');

    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await WakeLockService.releaseWakeLock();
    setIsWakeLockActive(false);
  }, []);

  const triggerAlarm = useCallback(() => {
    VoiceSynthService.speakWhatsUp();
    NotificationService.sendNotification(
      '🍅 What\'s up? ログの時間です！',
      `設定された時間間隔が経過しました。タップして近況を録音しましょう。`
    );
    if (onTriggerRecord) {
      onTriggerRecord();
    }
  }, [onTriggerRecord]);

  // アプリ復帰・プロセスキル時のタイマー残り時間自動同期
  const syncTimerState = useCallback(() => {
    const running = localStorage.getItem(STORAGE_KEY_IS_RUNNING) === 'true';
    const targetStr = localStorage.getItem(STORAGE_KEY_TARGET_TIME);
    const minsStr = localStorage.getItem(STORAGE_KEY_INTERVAL_MINS);
    const mins = minsStr ? parseInt(minsStr, 10) : intervalMinutes;

    if (running && targetStr) {
      const targetTime = parseInt(targetStr, 10);
      const now = Date.now();
      const diffSec = Math.ceil((targetTime - now) / 1000);

      if (diffSec <= 0) {
        // バックグラウンド中に時間を過ぎていた場合
        triggerAlarm();
        // 次のサイクルを再セット
        const nextTarget = now + mins * 60 * 1000;
        localStorage.setItem(STORAGE_KEY_TARGET_TIME, nextTarget.toString());
        setTimeLeftSeconds(mins * 60);
      } else {
        // まだ途中
        setTimeLeftSeconds(diffSec);
      }
      setIsRunning(true);
      WakeLockService.requestWakeLock().then(setIsWakeLockActive);
    }
  }, [intervalMinutes, triggerAlarm]);

  // ページフォーカス復帰（別アプリから戻った時）および初期読み込み時の再同期
  useEffect(() => {
    syncTimerState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncTimerState();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncTimerState);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncTimerState);
    };
  }, [syncTimerState]);

  // Listen to schedule storage changes (e.g. from SettingsModal)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (saved) {
        try { setSchedule(JSON.parse(saved)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTestVoice = () => {
    VoiceSynthService.speakWhatsUp();
  };

  // Schedule Checker (Runs every 30 seconds)
  useEffect(() => {
    if (!schedule.enabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentHHmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { startTime, endTime } = schedule;

      let shouldRun = false;
      if (startTime < endTime) {
        shouldRun = currentHHmm >= startTime && currentHHmm < endTime;
      } else {
        shouldRun = currentHHmm >= startTime || currentHHmm < endTime;
      }

      if (shouldRun && !isRunning) {
        startTimer();
      } else if (!shouldRun && isRunning) {
        stopTimer();
      }
    };

    checkSchedule();
    const scheduleInterval = setInterval(checkSchedule, 30000);
    return () => clearInterval(scheduleInterval);
  }, [schedule, isRunning, startTimer, stopTimer]);

  // Main Countdown Timer Loop (目標時間とのギャップで精密カウントダウン)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        const targetStr = localStorage.getItem(STORAGE_KEY_TARGET_TIME);
        if (!targetStr) return;

        const targetTime = parseInt(targetStr, 10);
        const diffSec = Math.ceil((targetTime - Date.now()) / 1000);

        if (diffSec <= 0) {
          triggerAlarm();

          // 次のサイクル目標をセット
          const nextTarget = Date.now() + intervalMinutes * 60 * 1000;
          localStorage.setItem(STORAGE_KEY_TARGET_TIME, nextTarget.toString());
          setTimeLeftSeconds(intervalMinutes * 60);
        } else {
          setTimeLeftSeconds(diffSec);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, intervalMinutes, triggerAlarm]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 56, 92, 0.15)', color: 'var(--primary)', display: 'flex' }}>
            <Clock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              定期タイマー & アラーム通知
              {schedule.enabled && (
                <span className="badge badge-active" style={{ marginLeft: '0.6rem', fontSize: '0.72rem', background: 'rgba(52, 199, 89, 0.15)', color: '#34c759' }}>
                  自動起動 ON ({schedule.startTime}〜{schedule.endTime})
                </span>
              )}
              {isWakeLockActive && (
                <span className="badge badge-active" style={{ marginLeft: '0.4rem', fontSize: '0.72rem', background: 'rgba(0, 122, 255, 0.15)', color: '#007aff', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <ShieldCheck size={12} /> 画面消灯防止 ON
                </span>
              )}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>時間になると女性の声で「What's up?」と喋ります</p>
          </div>
        </div>

        <button
          onClick={handleTestVoice}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
          title="女性の声でWhat's up?を試聴する"
        >
          <Volume2 size={15} color="var(--primary)" /> 音声テスト
        </button>
      </div>

      {/* Main Timer Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>通知間隔:</label>
          {[1, 15, 30, 60].map((mins) => (
            <button
              key={mins}
              disabled={isRunning}
              onClick={() => {
                setIntervalMinutes(mins);
                setTimeLeftSeconds(mins * 60);
                localStorage.setItem(STORAGE_KEY_INTERVAL_MINS, mins.toString());
              }}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: intervalMinutes === mins ? 'var(--primary)' : 'var(--border-color)',
                background: intervalMinutes === mins ? 'var(--primary-glow)' : 'transparent',
                color: intervalMinutes === mins ? '#fff' : 'var(--text-muted)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'var(--transition-fast)'
              }}
            >
              {mins === 1 ? '1分(テスト)' : `${mins}分`}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {isRunning && (
            <div style={{ fontFamily: 'var(--font-code)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatTime(timeLeftSeconds)}
            </div>
          )}

          {isRunning ? (
            <button onClick={stopTimer} className="btn btn-danger" style={{ gap: '0.4rem' }}>
              <Square size={16} /> タイマー停止
            </button>
          ) : (
            <button onClick={() => startTimer()} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Play size={16} /> タイマー開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

