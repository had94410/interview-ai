import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  Brain,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { InterviewerPersona } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface InterviewerAvatarProps {
  persona: InterviewerPersona;
  state: 'speaking' | 'listening' | 'thinking' | 'idle';
  currentQuestionText?: string;
  questionNumber?: number;
  totalQuestions?: number;
  questionFocus?: string;
  modelAnswer?: string;
  answeringTips?: string[];
  showModelAnswerByDefault?: boolean;
  isPersonalized?: boolean;
  onReplayAudio?: () => void;
  isAudioMuted?: boolean;
}

export const InterviewerAvatar: React.FC<InterviewerAvatarProps> = ({
  persona,
  state,
  currentQuestionText,
  questionNumber = 1,
  totalQuestions = 5,
  questionFocus,
  modelAnswer,
  answeringTips,
  showModelAnswerByDefault = true,
  isPersonalized = false,
  onReplayAudio,
  isAudioMuted = false,
}) => {
  const [showModelAnswer, setShowModelAnswer] = useState(showModelAnswerByDefault);
  const [copied, setCopied] = useState(false);
  const [isPlayingModelVoice, setIsPlayingModelVoice] = useState(false);

  const handleCopyModelAnswer = () => {
    if (!modelAnswer) return;
    navigator.clipboard.writeText(modelAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakModelAnswer = async () => {
    if (isPlayingModelVoice) {
      stopSpeaking();
      setIsPlayingModelVoice(false);
      return;
    }
    if (!modelAnswer) return;

    setIsPlayingModelVoice(true);
    await speakText(modelAnswer, {
      voiceName: 'Kore',
      onEnd: () => setIsPlayingModelVoice(false),
      onError: () => setIsPlayingModelVoice(false),
    });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-5 min-h-[320px]">
      {/* Top Header inside Interviewer frame */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Small avatar or icon */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              {persona.name.charAt(0)}
            </div>
            {state === 'speaking' && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500 border-2 border-slate-900"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">{persona.name}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  persona.style === 'gentle'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : persona.style === 'strict'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                {persona.styleLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400">{persona.title}</p>
          </div>
        </div>

        {/* Question Counter Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-indigo-300">
            第 {questionNumber} 問 / 全 {totalQuestions} 問
          </div>
        </div>
      </div>

      {/* Center Persona Visualization */}
      <div className="relative flex flex-col items-center justify-center py-5">
        {/* Animated aura rings based on state */}
        <div className="relative flex items-center justify-center">
          {state === 'speaking' && (
            <>
              <div className="absolute w-36 h-36 rounded-full bg-indigo-500/20 animate-ping"></div>
              <div className="absolute w-32 h-32 rounded-full border-2 border-indigo-400/40 animate-pulse"></div>
            </>
          )}

          {state === 'thinking' && (
            <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-amber-400/60 animate-spin"></div>
          )}

          {state === 'listening' && (
            <div className="absolute w-32 h-32 rounded-full bg-emerald-500/10 border border-emerald-400/30 animate-pulse"></div>
          )}

          {/* Central Portrait/Avatar disc */}
          <div
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center text-white font-extrabold text-2xl shadow-xl transition-all duration-300 z-10 ${
              state === 'speaking'
                ? 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 ring-4 ring-indigo-400/50 scale-105'
                : state === 'thinking'
                ? 'bg-gradient-to-tr from-amber-600 via-orange-600 to-yellow-600 ring-4 ring-amber-400/40'
                : state === 'listening'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-700 ring-4 ring-emerald-400/30'
                : 'bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600'
            }`}
          >
            {state === 'thinking' ? (
              <Brain className="w-10 h-10 animate-pulse text-amber-200" />
            ) : state === 'listening' ? (
              <Mic className="w-9 h-9 animate-bounce text-emerald-200" />
            ) : (
              <span className="tracking-wider">{persona.name.slice(0, 2)}</span>
            )}
          </div>
        </div>

        {/* State Tag */}
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur">
          {state === 'speaking' && (
            <span className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-3 py-1 rounded-full animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              面接官が質問中...
            </span>
          )}
          {state === 'listening' && (
            <span className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full">
              <Mic className="w-3.5 h-3.5 animate-bounce" />
              あなたの回答を傾聴しています
            </span>
          )}
          {state === 'thinking' && (
            <span className="flex items-center gap-1.5 text-amber-300 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full">
              <Brain className="w-3.5 h-3.5 animate-spin" />
              回答をリアルタイム解析・採点中...
            </span>
          )}
          {state === 'idle' && (
            <span className="text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full">
              待機中
            </span>
          )}
        </div>
      </div>

      {/* Question Speech Bubble */}
      <div className="mt-2 bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg space-y-3">
        {questionFocus && (
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-amber-300">
              着眼点: {questionFocus}
            </span>
          </div>
        )}

        <p className="text-slate-100 text-sm sm:text-base font-medium leading-relaxed">
          {currentQuestionText || '面接の準備をしています...'}
        </p>

        {/* Audio control bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            {isAudioMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" /> 音声ミュート中
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> 音声読み上げON
              </>
            )}
          </span>

          {onReplayAudio && (
            <button
              onClick={onReplayAudio}
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>質問をもう一度聴く</span>
            </button>
          )}
        </div>

        {/* --- Model Answer & Tips Accordion (出題と一緒に出す模範解答) --- */}
        {modelAnswer && (
          <div className="border border-indigo-500/40 bg-indigo-950/40 rounded-xl overflow-hidden shadow-inner mt-2">
            <button
              type="button"
              onClick={() => setShowModelAnswer(!showModelAnswer)}
              className="w-full flex items-center justify-between p-2.5 text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-900/30 transition"
            >
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                <span>この質問の模範解答・回答のコツ (カンペ)</span>
                {isPersonalized && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    書類連動
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-indigo-300/80 bg-indigo-900/60 px-2 py-0.5 rounded-full font-normal">
                  {showModelAnswer ? '閉じる' : '解答例を見る'}
                </span>
                {showModelAnswer ? (
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-300" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-300" />
                )}
              </div>
            </button>

            {showModelAnswer && (
              <div className="p-3.5 pt-1 space-y-2.5 text-xs border-t border-indigo-800/40 bg-slate-950/60">
                {/* Answering Tips list */}
                {answeringTips && answeringTips.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      回答構成のポイント:
                    </span>
                    <ul className="space-y-1 pl-1">
                      {answeringTips.map((tip, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Model Answer Body */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-300">
                      プロの模範回答例（約1分目安）:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSpeakModelAnswer}
                        className="text-[10px] text-indigo-200 hover:text-white flex items-center gap-1 bg-indigo-900/60 hover:bg-indigo-800 px-2 py-0.5 rounded transition"
                        title="模範回答の音声を再生"
                      >
                        <Volume2 className="w-3 h-3 text-indigo-400" />
                        <span>{isPlayingModelVoice ? '停止' : '音声で聴く'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyModelAnswer}
                        className="text-[10px] text-indigo-200 hover:text-white flex items-center gap-1 bg-indigo-900/60 hover:bg-indigo-800 px-2 py-0.5 rounded transition"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'コピー' : 'コピー'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="p-2.5 rounded-lg bg-slate-900/90 border border-indigo-900/60 text-slate-200 text-xs leading-relaxed font-sans select-text">
                    「{modelAnswer}」
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
