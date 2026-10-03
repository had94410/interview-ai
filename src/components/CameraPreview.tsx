import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Sparkles, UserCheck } from 'lucide-react';

interface CameraPreviewProps {
  enabled: boolean;
  onToggle: () => void;
  candidateName?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  enabled,
  onToggle,
  candidateName = 'あなた（候補者）',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!enabled) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.warn('Camera permission denied or camera not found:', err);
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enabled]);

  return (
    <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between group">
      {/* Video or Camera Off placeholder */}
      {enabled && hasPermission ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          />

          {/* Subdued Eye-Level and Posture Guideline */}
          {showGuidelines && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-60 transition-opacity duration-300">
              {/* Eye level horizontal line */}
              <div className="w-full border-t border-dashed border-indigo-400/40 relative top-[-10%]">
                <span className="absolute right-3 -top-5 text-[10px] text-indigo-300/80 bg-slate-950/60 px-1.5 py-0.5 rounded">
                  目線ライン（カメラの位置）
                </span>
              </div>
              {/* Silhouette guide circle */}
              <div className="w-44 h-56 rounded-full border border-dashed border-indigo-400/30 -mt-6"></div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-400 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-slate-500 border border-slate-700">
            <CameraOff className="w-7 h-7" />
          </div>
          <p className="text-sm font-medium text-slate-300">カメラはオフになっています</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {hasPermission
              ? '本番同様の緊張感で練習したい場合はカメラをONにしてください'
              : 'カメラへのアクセスが拒否されているか、見つかりませんでした'}
          </p>
        </div>
      )}

      {/* Top Overlay Bar */}
      <div className="relative z-10 p-3 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-semibold text-white tracking-wide drop-shadow">
            {candidateName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {enabled && (
            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              title="姿勢・目線ガイドの表示切替"
              className={`text-[11px] px-2 py-1 rounded-md flex items-center gap-1 transition ${
                showGuidelines
                  ? 'bg-indigo-600/80 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>目線ガイド</span>
            </button>
          )}

          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg border backdrop-blur transition text-xs flex items-center gap-1 ${
              enabled
                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
            }`}
            title={enabled ? 'カメラをOFFにする' : 'カメラをONにする'}
          >
            {enabled ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{enabled ? 'OFF' : 'カメラON'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar: Posture tip */}
      <div className="relative z-10 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>背筋を伸ばし、画面ではなくカメラのレンズを見て話すと好印象です</span>
        </div>
      </div>
    </div>
  );
};
