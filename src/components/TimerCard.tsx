import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Play, Square, Volume2, ShieldCheck } from 'lucide-react';
import { NotificationService } from '../services/notification';
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

export const TimerCard: React.FC<TimerCardProps> = ({ onTriggerRecord }) => {
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
  const [isRunning, setIsRunning] = useState<boolean>(false);
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

  const startTimer = useCallback(async () => {
    setIsRunning(true);
    setTimeLeftSeconds(intervalMinutes * 60);
    const active = await WakeLockService.requestWakeLock();
    setIsWakeLockActive(active);
  }, [intervalMinutes]);

  const stopTimer = useCallback(async () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await WakeLockService.releaseWakeLock();
    setIsWakeLockActive(false);
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

  // Main Countdown Timer Loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            VoiceSynthService.speakWhatsUp();
            NotificationService.sendNotification(
              '🍅 What\'s up? ログの時間です！',
              `設定された${intervalMinutes}分が経過しました。タップして近況を録音しましょう。`
            );

            if (onTriggerRecord) {
              onTriggerRecord();
            }
            return intervalMinutes * 60;
          }
          return prev - 1;
        });
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
  }, [isRunning, intervalMinutes, onTriggerRecord]);

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
            <button onClick={startTimer} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Play size={16} /> タイマー開始
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

