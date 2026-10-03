import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Star,
  Zap,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnswerFeedback } from '../types';

interface RealtimeFeedbackCardProps {
  feedback: AnswerFeedback;
  questionNumber?: number;
  questionText?: string;
  candidateAnswer?: string;
}

export const RealtimeFeedbackCard: React.FC<RealtimeFeedbackCardProps> = ({
  feedback,
  questionNumber,
  questionText,
  candidateAnswer,
}) => {
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showStarDetails, setShowStarDetails] = useState(true);

  const handleCopyModelAnswer = () => {
    if (!feedback.modelAnswer) return;
    navigator.clipboard.writeText(feedback.modelAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Color coding by score
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50';
    if (score >= 70) return 'text-blue-400 bg-blue-950/70 border-blue-500/50';
    if (score >= 60) return 'text-amber-400 bg-amber-950/70 border-amber-500/50';
    return 'text-rose-400 bg-rose-950/70 border-rose-500/50';
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-indigo-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header: Score & Rating */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              <span>リアルタイムAI添削フィードバック</span>
              {questionNumber && (
                <span className="text-xs text-indigo-300 font-normal">
                  (第{questionNumber}問の回答)
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">STAR法・論理構成・具体性を即時解析</p>
          </div>
        </div>

        {/* Score pill */}
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getScoreColor(feedback.score)}`}>
          <span className="text-xs font-semibold">{feedback.ratingLabel}</span>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold">{feedback.score}</span>
            <span className="text-[10px] ml-0.5 opacity-70">/100点</span>
          </div>
        </div>
      </div>

      {/* Summary comment */}
      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs sm:text-sm text-slate-200 leading-relaxed">
        <span className="font-semibold text-indigo-300 mr-1.5">【講評】</span>
        {feedback.summary}
      </div>

      {/* Metric Bars: Conclusion First & Concreteness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              結論ファースト度
            </span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    s <= (feedback.conclusionFirst?.score || 3)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">{feedback.conclusionFirst?.comment}</p>
        </div>

        <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              具体性・説得力
            </span>
            <div className="flex text-emerald-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${
                    s <= (feedback.concreteness?.score || 3)
                      ? 'fill-emerald-400 text-emerald-400'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">{feedback.concreteness?.comment}</p>
        </div>
      </div>

      {/* Good Points & Improvement Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Strengths */}
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3">
          <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            良かった点
          </h5>
          <ul className="space-y-1.5">
            {feedback.strengths.map((str, idx) => (
              <li key={idx} className="text-[11px] text-emerald-100 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3">
          <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            改善アドバイス
          </h5>
          <ul className="space-y-1.5">
            {feedback.improvements.map((imp, idx) => (
              <li key={idx} className="text-[11px] text-amber-100 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* STAR Framework Accordion */}
      {feedback.starEvaluation && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowStarDetails(!showStarDetails)}
            className="w-full flex items-center justify-between p-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              STAR法フレームワーク診断 (状況・課題・行動・成果)
            </span>
            {showStarDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showStarDetails && (
            <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-0.5">S (Situation: 状況)</span>
                <p className="text-slate-300">{feedback.starEvaluation.situation || '特に問題なし'}</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-0.5">T (Task: 課題・目標)</span>
                <p className="text-slate-300">{feedback.starEvaluation.task || '特に問題なし'}</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">A (Action: 独自の行動)</span>
                <p className="text-slate-300">{feedback.starEvaluation.action || '特に問題なし'}</p>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">R (Result: 定量成果・学び)</span>
                <p className="text-slate-300">{feedback.starEvaluation.result || '特に問題なし'}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Answer Box */}
      {feedback.modelAnswer && (
        <div className="bg-gradient-to-r from-indigo-950/50 to-violet-950/50 border border-indigo-500/40 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              AIによる模範改善回答例（こう言い換えると合格率UP）
            </span>
            <button
              onClick={handleCopyModelAnswer}
              className="text-[11px] text-indigo-200 hover:text-white flex items-center gap-1 bg-indigo-900/60 hover:bg-indigo-800/80 px-2 py-0.5 rounded transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'コピー完了' : 'コピー'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-indigo-900/50">
            「{feedback.modelAnswer}」
          </p>

          {/* Toggle original answer comparison */}
          {candidateAnswer && (
            <div className="mt-2 text-right">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-[10px] text-slate-400 hover:text-slate-200 underline"
              >
                {showOriginal ? '自分の発言を隠す' : '自分が話した回答と比較する'}
              </button>
              {showOriginal && (
                <div className="mt-1 text-left bg-slate-900/90 p-2.5 rounded text-[11px] text-slate-400 border border-slate-800">
                  <span className="text-slate-500 block mb-1">【あなたの元の発言】</span>
                  「{candidateAnswer}」
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
