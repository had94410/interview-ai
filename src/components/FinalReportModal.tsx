import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
} from 'lucide-react';
import { FinalReportData, InterviewConfig, InterviewMessage } from '../types';

interface FinalReportModalProps {
  report: FinalReportData;
  config: InterviewConfig;
  history: InterviewMessage[];
  onRestart: () => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  report,
  config,
  history,
  onRestart,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Trigger celebration confetti if passed with high score
  useEffect(() => {
    if (report.overallScore >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [report.overallScore]);

  const handleCopyReport = () => {
    const textReport = `
========================================
【AI面接 総合評価診断レポート】
========================================
志望職種: ${config.jobCategory}
区分: ${config.careerStage} (${config.interviewStage})
面接官: ${config.interviewerPersona.name} (${config.interviewerPersona.styleLabel})

■ 総合評価
総合スコア: ${report.overallScore} / 100 点 (ランク: ${report.grade})
面接判定: ${report.passJudgement}

■ 評価軸別スコア (各100点満点)
- 論理構成・結論ファースト: ${report.radarScores.logic}点
- 具体性・エピソード深度: ${report.radarScores.concreteness}点
- 熱意・企業理解: ${report.radarScores.passion}点
- 課題解決力・行動力: ${report.radarScores.problemSolving}点
- コミュニケーション力: ${report.radarScores.communication}点

■ 面接官総評
${report.generalReview}

■ 際立っていた強み
${report.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

■ 最優先の改善ポイント
${report.criticalImprovements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

■ 本番面接までのアクションプラン
${report.actionPlanForRealInterview.map((s, i) => `${i + 1}. ${s}`).join('\n')}
========================================
`;
    navigator.clipboard.writeText(textReport.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Grade badge styling
  const getGradeStyle = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'text-amber-400 bg-amber-950/80 border-amber-500 shadow-amber-500/20';
      case 'A':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-500 shadow-emerald-500/20';
      case 'B':
        return 'text-blue-400 bg-blue-950/80 border-blue-500 shadow-blue-500/20';
      default:
        return 'text-rose-400 bg-rose-950/80 border-rose-500 shadow-rose-500/20';
    }
  };

  // SVG Radar Chart Math
  const radarLabels = [
    { key: 'logic', label: '論理構成・結論ファースト', val: report.radarScores.logic },
    { key: 'concreteness', label: '具体性・エピソード深度', val: report.radarScores.concreteness },
    { key: 'passion', label: '熱意・志望度・適性', val: report.radarScores.passion },
    { key: 'problemSolving', label: '課題解決力・行動力', val: report.radarScores.problemSolving },
    { key: 'communication', label: 'コミュニケーション力', val: report.radarScores.communication },
  ];

  const size = 300;
  const center = size / 2;
  const radius = 100;
  const angleStep = (Math.PI * 2) / radarLabels.length;

  // Calculate polygon coordinates for scores
  const scorePoints = radarLabels
    .map((item, idx) => {
      const angle = idx * angleStep - Math.PI / 2;
      const r = (item.val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  // Filter messages that have feedback
  const feedbackMessages = history.filter((m) => m.role === 'candidate' && m.feedback);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full my-6 p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-[11px] font-semibold text-indigo-300">
                面接結果診断レポート
              </span>
              <span className="text-xs text-slate-400">
                {config.jobCategory} • {config.careerStage}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-amber-400" />
              AI面接 総合評価シート
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'コピー完了' : 'レポートをコピー'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="印刷 / PDF保存"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onRestart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>もう一度練習する</span>
            </button>
          </div>
        </div>

        {/* Top Cards: Score & Judgement & Grade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Score */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-slate-400 mb-1">総合評価スコア</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">
                {report.overallScore}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100点</span>
            </div>
            <span className="text-xs text-slate-400 mt-1">
              全 {config.totalQuestions} 問の平均・総合実力
            </span>
          </div>

          {/* Grade Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-slate-400 mb-1">実力ランク</span>
            <div
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black shadow-lg my-1 ${getGradeStyle(
                report.grade
              )}`}
            >
              {report.grade}
            </div>
            <span className="text-xs text-slate-300 mt-1">
              {report.grade === 'S'
                ? '内定確実レベル'
                : report.grade === 'A'
                ? '通過有力レベル'
                : report.grade === 'B'
                ? '合格ライン境界線'
                : '要再対策レベル'}
            </span>
          </div>

          {/* Pass Judgement */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-slate-400 mb-1">面接官判定</span>
            <div className="my-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 font-bold text-base">
              {report.passJudgement}
            </div>
            <p className="text-[11px] text-slate-400">
              面接官: {config.interviewerPersona.name} ({config.interviewerPersona.styleLabel})
            </p>
          </div>
        </div>

        {/* Middle Section: Radar Chart & Review */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radar Chart */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 self-start">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              能力別バランスチャート (5軸評価)
            </h4>

            <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
                {/* Background concentric polygons */}
                {[0.25, 0.5, 0.75, 1.0].map((level, lIdx) => {
                  const pts = radarLabels
                    .map((_, idx) => {
                      const angle = idx * angleStep - Math.PI / 2;
                      const r = level * radius;
                      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={lIdx}
                      points={pts}
                      fill="none"
                      stroke="#334155"
                      strokeWidth={lIdx === 3 ? '1.5' : '1'}
                      strokeDasharray={lIdx < 3 ? '2 2' : 'none'}
                    />
                  );
                })}

                {/* Axis lines */}
                {radarLabels.map((_, idx) => {
                  const angle = idx * angleStep - Math.PI / 2;
                  const x = center + radius * Math.cos(angle);
                  const y = center + radius * Math.sin(angle);
                  return (
                    <line
                      key={idx}
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Score Area Polygon */}
                <polygon
                  points={scorePoints}
                  fill="rgba(99, 102, 241, 0.35)"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />

                {/* Score Points Dots */}
                {radarLabels.map((item, idx) => {
                  const angle = idx * angleStep - Math.PI / 2;
                  const r = (item.val / 100) * radius;
                  const x = center + r * Math.cos(angle);
                  const y = center + r * Math.sin(angle);
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#818cf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Labels */}
                {radarLabels.map((item, idx) => {
                  const angle = idx * angleStep - Math.PI / 2;
                  const labelRadius = radius + 24;
                  const x = center + labelRadius * Math.cos(angle);
                  const y = center + labelRadius * Math.sin(angle);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[10px] fill-slate-300 font-semibold"
                    >
                      {item.val}点
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Labels Legend */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[11px]">
              {radarLabels.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-slate-400">
                  <span className="truncate mr-1">{item.label}</span>
                  <span className="font-bold text-indigo-300">{item.val}点</span>
                </div>
              ))}
            </div>
          </div>

          {/* General Review by Interviewer */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              面接官からの総評
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              {report.generalReview}
            </p>

            {/* Action Plan */}
            <div>
              <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                本番面接に向けた3箇条アクションプラン
              </h5>
              <div className="space-y-1.5">
                {report.actionPlanForRealInterview.map((action, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-100 flex items-start gap-2"
                  >
                    <span className="font-bold text-indigo-400">0{i + 1}.</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              高く評価された強み
            </h4>
            <ul className="space-y-2">
              {report.keyStrengths.map((str, idx) => (
                <li key={idx} className="text-xs text-emerald-100 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/50 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              次までに直すべき重要課題
            </h4>
            <ul className="space-y-2">
              {report.criticalImprovements.map((imp, idx) => (
                <li key={idx} className="text-xs text-amber-100 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Per-Question History & Real-Time Feedback Archive */}
        {feedbackMessages.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span>各問の回答とリアルタイム添削履歴</span>
              <span className="text-xs font-normal text-slate-400">
                (タップして詳細フィードバックを展開)
              </span>
            </h4>

            <div className="space-y-3">
              {feedbackMessages.map((msg, index) => {
                const isExpanded = expandedIndex === index;
                const fb = msg.feedback!;
                return (
                  <div
                    key={msg.id || index}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 font-bold text-xs border border-indigo-800">
                          第{index + 1}問
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {msg.text}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            評価: {fb.ratingLabel} ({fb.score}点)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400">{fb.score}点</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800 space-y-3 text-xs bg-slate-900/40">
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">
                            あなたの発言:
                          </span>
                          <p className="text-slate-200">{msg.text}</p>
                        </div>

                        <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-900/50">
                          <span className="text-indigo-300 font-semibold block mb-1">
                            AI模範回答・改善例:
                          </span>
                          <p className="text-slate-200">{fb.modelAnswer}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-200">
                            <span className="font-bold block mb-1">◎ 良かった点:</span>
                            {fb.strengths.join(' / ')}
                          </div>
                          <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/40 text-amber-200">
                            <span className="font-bold block mb-1">▲ 改善点:</span>
                            {fb.improvements.join(' / ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex justify-center">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <RotateCcw className="w-5 h-5" />
            <span>別の条件で新しい面接に挑戦する</span>
          </button>
        </div>
      </div>
    </div>
  );
};
