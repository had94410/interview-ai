// Speech recognition & synthesis utilities for AI Interview

export interface SpeechRecognitionHandlers {
  onInterimResult: (text: string) => void;
  onFinalResult: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

// Check Web Speech API Recognition availability
export function getSpeechRecognitionConstructor(): any {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export class VoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private isStarted: boolean = false;
  private fullTranscript: string = '';
  private handlers: SpeechRecognitionHandlers | null = null;

  constructor() {
    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (SpeechConstructor) {
      this.recognition = new SpeechConstructor();
      this.recognition.lang = 'ja-JP';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalChunk) {
          this.fullTranscript += (this.fullTranscript ? ' ' : '') + finalChunk.trim();
          if (this.handlers) {
            this.handlers.onFinalResult(this.fullTranscript);
          }
        }

        if (interimText && this.handlers) {
          const combined = this.fullTranscript
            ? `${this.fullTranscript} ${interimText}`
            : interimText;
          this.handlers.onInterimResult(combined);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        const isFatalError = [
          'audio-capture',
          'language-not-supported',
          'network',
          'not-allowed',
          'service-not-allowed',
        ].includes(event.error);

        if (isFatalError) {
          this.isListening = false;
        }

        if (event.error !== 'no-speech' && this.handlers) {
          this.handlers.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isStarted = false;
        if (this.isListening) {
          window.setTimeout(() => this.startRecognition(), 0);
          return;
        }
        if (this.handlers) {
          this.handlers.onEnd();
        }
      };
    }
  }

  private startRecognition() {
    if (!this.recognition || !this.isListening || this.isStarted) return;

    try {
      this.recognition.start();
      this.isStarted = true;
    } catch (error) {
      const startError = error as DOMException;
      if (startError.name === 'InvalidStateError') {
        console.warn('Speech recognition is already active:', startError.message);
        this.isStarted = true;
        return;
      }

      console.warn('Start recognition error:', startError.name, startError.message);
      this.isListening = false;
      this.handlers?.onError(
        startError.name === 'NotAllowedError'
          ? 'not-allowed'
          : `start-failed:${startError.name || 'Error'}`
      );
    }
  }

  public start(handlers: SpeechRecognitionHandlers, initialText: string = '') {
    if (!this.recognition) {
      handlers.onError('このブラウザは音声認識APIをサポートしていません。ChromeまたはEdgeをご利用ください。');
      return;
    }

    if (this.isListening) return;

    this.handlers = handlers;
    this.fullTranscript = initialText;
    this.isListening = true;
    this.startRecognition();
  }

  public stop(): string {
    this.isListening = false;
    if (this.recognition && this.isStarted) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    return this.fullTranscript;
  }

  public reset() {
    this.stop();
    this.fullTranscript = '';
  }

  public getTranscript(): string {
    return this.fullTranscript;
  }
}

// Text to Speech
let currentAudio: HTMLAudioElement | null = null;

export async function speakText(
  text: string,
  options?: {
    useGeminiTTS?: boolean;
    voiceName?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  // Stop existing speech
  stopSpeaking();

  const { useGeminiTTS = false, voiceName = 'Kore', onStart, onEnd, onError } = options || {};

  // Try Gemini TTS if configured
  if (useGeminiTTS) {
    try {
      onStart?.();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        currentAudio = new Audio(audioSrc);
        currentAudio.onended = () => {
          currentAudio = null;
          onEnd?.();
        };
        currentAudio.onerror = (e) => {
          console.warn('Audio play error, falling back to Web Speech:', e);
          speakWithWebSpeech(text, { onStart, onEnd, onError });
        };
        await currentAudio.play();
        return;
      }
    } catch (err) {
      console.warn('Gemini TTS failed, falling back to Web Speech:', err);
    }
  }

  // Fallback or default: Web Speech API
  speakWithWebSpeech(text, { onStart, onEnd, onError });
}

export function speakWithWebSpeech(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    callbacks?.onError?.('音声合成APIがサポートされていません');
    callbacks?.onEnd?.();
    return;
  }

  // Cancel prior
  window.speechSynthesis.cancel();

  // Strip Markdown markers if any
  const cleanText = text.replace(/[*#_`]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 1.05; // Slightly brisk, natural Japanese interview pace
  utterance.pitch = 1.0;

  // Find Japanese voice
  const voices = window.speechSynthesis.getVoices();
  const jaVoice =
    voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja')) ||
    voices.find((v) => v.name.includes('Japanese') || v.name.includes('Japan'));
  if (jaVoice) {
    utterance.voice = jaVoice;
  }

  utterance.onstart = () => {
    callbacks?.onStart?.();
  };

  utterance.onend = () => {
    callbacks?.onEnd?.();
  };

  utterance.onerror = (event) => {
    console.warn('Speech synthesis error:', event);
    callbacks?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
