export interface SpeechServiceCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ja-JP';
    }
  }

  public static isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start(callbacks: SpeechServiceCallbacks): boolean {
    if (!this.recognition) {
      callbacks.onError('Web Speech API に未対応のブラウザです。');
      return false;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        if (result.isFinal) {
          finalTranscript += transcriptText;
        } else {
          interimTranscript += transcriptText;
        }
      }

      // 重複する連続単語を自動クリーニング（例: 「トマト トマト トマト」 ➔ 「トマト」）
      const cleanedFinal = finalTranscript.replace(/(.+?)\1+/g, '$1');
      const currentDisplay = cleanedFinal + (interimTranscript ? ` (${interimTranscript})` : '');
      callbacks.onResult(currentDisplay, false);
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      callbacks.onError(`音声認識エラー: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      callbacks.onError(`音声入力の開始に失敗しました: ${err.message || err}`);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}
