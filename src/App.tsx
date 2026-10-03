import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  HelpCircle,
  X,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { FinalReportData, InterviewConfig, InterviewMessage } from './types';
import { InterviewSetup } from './components/InterviewSetup';
import { InterviewRoom } from './components/InterviewRoom';
import { FinalReportModal } from './components/FinalReportModal';

export default function App() {
  const [phase, setPhase] = useState<'setup' | 'interview' | 'report'>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [initialQuestion, setInitialQuestion] = useState<string>('');
  const [initialQuestionFocus, setInitialQuestionFocus] = useState<string>('');
  const [initialModelAnswer, setInitialModelAnswer] = useState<string>('');
  const [initialQuestionTips, setInitialQuestionTips] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [history, setHistory] = useState<InterviewMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showStarGuide, setShowStarGuide] = useState<boolean>(false);

  // Start Interview from Setup
  const handleStartInterview = async (selectedConfig: InterviewConfig) => {
    setIsLoading(true);
    setConfig(selectedConfig);

    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: selectedConfig }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '面接の初期化に失敗しました');
      }

      setInitialQuestion(data.firstQuestion);
      setInitialQuestionFocus(data.questionFocus);
      setInitialModelAnswer(data.modelAnswer || '');
      setInitialQuestionTips(data.answeringTips || []);
      setPhase('interview');
    } catch (err: any) {
      console.error('Error starting interview:', err);
      // Fallback first question if network error
      setInitialQuestion('それではまず初めに、1分程度で簡単な自己紹介と志望動機の要約をお願いいたします。');
      setInitialQuestionFocus('第一印象と簡潔な自己紹介能力');
      setInitialModelAnswer('はじめまして、本日はよろしくお願いいたします。〇〇と申します。これまで〇〇の経験を積んでまいりました。本日はどうぞよろしくお願いいたします。');
      setInitialQuestionTips(['結論から先に端的に伝える', '自己紹介は1分以内を目安にする']);
      setPhase('interview');
    } finally {
      setIsLoading(false);
    }
  };

  // Finish Interview -> Show Final Diagnostic Report
  const handleFinishInterview = (report: FinalReportData, fullHistory: InterviewMessage[]) => {
    setFinalReport(report);
    setHistory(fullHistory);
    setPhase('report');
  };

  // Restart Interview
  const handleRestart = () => {
    setPhase('setup');
    setFinalReport(null);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Global Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div
            onClick={handleRestart}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  Interview<span className="text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 hidden sm:inline">
                  音声対話 ＆ リアルタイム添削
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStarGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>STAR法とは？</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {phase === 'setup' && (
          <InterviewSetup onStart={handleStartInterview} isLoading={isLoading} />
        )}

        {phase === 'interview' && config && (
          <InterviewRoom
            config={config}
            initialQuestion={initialQuestion}
            initialQuestionFocus={initialQuestionFocus}
            initialModelAnswer={initialModelAnswer}
            initialQuestionTips={initialQuestionTips}
            onFinish={handleFinishInterview}
            onExit={handleRestart}
          />
        )}

        {phase === 'report' && finalReport && config && (
          <FinalReportModal
            report={finalReport}
            config={config}
            history={history}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} InterviewAI - 音声対話型AI面接練習＆リアルタイム添削サービス
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              音声データは面接練習の目的のみに使用されます
            </span>
          </div>
        </div>
      </footer>

      {/* STAR Method Guide Modal */}
      {showStarGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-800">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">STAR法（面接回答の黄金律）</h3>
              </div>
              <button
                onClick={() => setShowStarGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              面接でエピソードや実績を伝える際、面接官が最も評価しやすい世界標準のフレームワークです。当サービスでは回答ごとにSTAR法の充足度をAIがリアルタイム判定します。
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-1">
                  S (Situation: 状況・背景)
                </span>
                <p className="text-slate-300">
                  どのような環境・前提条件・組織状況だったのかを1文で端的に伝えます。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-1">
                  T (Task: 課題・目標・ミッション)
                </span>
                <p className="text-slate-300">
                  直面していた課題や目指すべき数値目標は何だったのかを明示します。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">
                  A (Action: あなた自身の行動・工夫)
                </span>
                <p className="text-slate-300">
                  チームの中で「あなた自身」が具体的にどのような工夫や行動を起こしたのか。面接官が一番見たいポイントです。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">
                  R (Result: 定量的成果・得られた学び)
                </span>
                <p className="text-slate-300">
                  行動の結果どうなったのか（「売上120%達成」「工数30%削減」など可能な限り数字で）。得られた教訓をどう仕事に活かせるかまで話すと完璧です。
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowStarGuide(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition"
              >
                理解したので閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
