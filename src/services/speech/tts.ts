export class VoiceSynthService {
  public static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * 明るく大きめの女性の声で「What's up?」と発声
   */
  public static speakWhatsUp(): void {
    if (!this.isSupported()) {
      console.warn('Web Speech Synthesis API is not supported in this browser.');
      return;
    }

    try {
      // 既存の発声をキャンセルして即時割り込み再生
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance("What's up?");
      utterance.lang = 'en-US';
      utterance.volume = 1.0; // 最大音量 (1.0)
      utterance.rate = 0.95;  // 自然なテンポ
      utterance.pitch = 1.25; // 明るく高めの女性ボイスピッチ

      // 利用可能な音声一覧から英語の女性ボイスを選択
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            v.name.includes('Google US English') ||
            v.name.includes('Zira') ||
            v.name.includes('Karen') ||
            v.name.includes('Moira'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Error playing TTS voice:', err);
    }
  }
}

// ブラウザの音声リスト非同期ロード対策
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
