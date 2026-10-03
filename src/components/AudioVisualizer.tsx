import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  isListening: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening, className = '' }) => {
  const [volume, setVolume] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isListening) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setVolume(0);
      return;
    }

    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!isMounted || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setVolume(Math.min(100, Math.round((average / 128) * 100)));

          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.warn('Could not access microphone for visualizer:', err);
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isListening]);

  // Generate 12 bars with varying height based on volume
  const bars = [0.4, 0.7, 1.0, 0.8, 1.2, 0.9, 1.1, 0.7, 0.9, 1.2, 0.6, 0.5];

  return (
    <div className={`flex items-center gap-1.5 h-7 px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full border border-slate-700/50 ${className}`}>
      <span className="relative flex h-2 w-2 mr-1">
        {isListening ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
        )}
      </span>
      <span className="text-xs font-medium text-slate-300 mr-2">
        {isListening ? 'マイク集音中' : 'マイク停止'}
      </span>
      <div className="flex items-center gap-0.5 h-4">
        {bars.map((multiplier, i) => {
          const heightPercent = isListening
            ? Math.max(15, Math.min(100, volume * multiplier * 1.4))
            : 15;
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${
                isListening
                  ? volume > 40
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-indigo-400'
                  : 'bg-slate-700'
              }`}
              style={{ height: `${heightPercent}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};
