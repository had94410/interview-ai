import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Send,
  RotateCcw,
  Flag,
  Sparkles,
  Clock,
  Keyboard,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import {
  AnswerFeedback,
  InterviewConfig,
  InterviewMessage,
  FinalReportData,
} from '../types';
import {
  VoiceRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking,
} from '../utils/speech';
import { InterviewerAvatar } from './InterviewerAvatar';
import { CameraPreview } from './CameraPreview';
import { AudioVisualizer } from './AudioVisualizer';
import { RealtimeFeedbackCard } from './RealtimeFeedbackCard';

interface InterviewRoomProps {
  config: InterviewConfig;
  initialQuestion: string;
  initialQuestionFocus?: string;
  initialModelAnswer?: string;
  initialQuestionTips?: string[];
  onFinish: (report: FinalReportData, history: InterviewMessage[]) => void;
  onExit: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  config,
  initialQuestion,
  initialQuestionFocus,
  initialModelAnswer,
  initialQuestionTips,
  onFinish,
  onExit,
}) => {
  // Turn states
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentQuestionText, setCurrentQuestionText] = useState(initialQuestion);
  const [currentQuestionFocus, setCurrentQuestionFocus] = useState(
    initialQuestionFocus || '簡潔な自己紹介と第一印象'
  );
  const [currentModelAnswer, setCurrentModelAnswer] = useState<string>(initialModelAnswer || '');
  const [currentQuestionTips, setCurrentQuestionTips] = useState<string[]>(initialQuestionTips || []);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(config.showModelAnswerOnAsk ?? true);
  const [interviewerState, setInterviewerState] = useState<
    'speaking' | 'listening' | 'thinking' | 'idle'
  >('idle');

  // Input states
  const [isRecording, setIsRecording] = useState(false);
  const [candidateTranscript, setCandidateTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [cameraEnabled, setCameraEnabled] = useState(config.enableCamera);
  const [isAudioMuted, setIsAudioMuted] = useState(!config.useVoice);

  // Time elapsed for current answer
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Message history
  const [history, setHistory] = useState<InterviewMessage[]>([
    {
      id: 'init-q1',
      role: 'interviewer',
      text: initialQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      questionNumber: 1,
      questionFocus: initialQuestionFocus,
      questionModelAnswer: initialModelAnswer,
      questionTips: initialQuestionTips,
    },
  ]);

  // Latest real-time feedback
  const [latestFeedback, setLatestFeedback] = useState<{
    feedback: AnswerFeedback;
    questionNumber: number;
    questionText: string;
    candidateAnswer: string;
  } | null>(null);

  // Loading/submitting state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishingReport, setIsFinishingReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speech Recognizer instance
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Init recognizer
  useEffect(() => {
    recognizerRef.current = new VoiceRecognizer();
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Answer timer
  useEffect(() => {
    if (isRecording) {
      setAnswerSeconds(0);
      timerRef.current = setInterval(() => {
        setAnswerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Read the question aloud whenever question changes
  const speakCurrentQuestion = (text: string) => {
    if (isAudioMuted) {
      setInterviewerState('listening');
      return;
    }

    setInterviewerState('speaking');
    speakText(text, {
      useGeminiTTS: config.useGeminiTTS,
      voiceName: config.interviewerPersona.voiceName,
      onEnd: () => {
        setInterviewerState('listening');
        // Auto-start recording after question finishes if speech is supported
        if (isSpeechRecognitionSupported() && inputMode === 'voice') {
          startVoiceRecording();
        }
      },
      onError: () => {
        setInterviewerState('listening');
      },
    });
  };

  // On initial mount, speak the 1st question
  useEffect(() => {
    speakCurrentQuestion(initialQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start voice recording
  const startVoiceRecording = () => {
    if (!recognizerRef.current) return;
    setErrorMessage(null);
    setIsRecording(true);
    setCandidateTranscript('');
    setInterimTranscript('');

    recognizerRef.current.start(
      {
        onInterimResult: (text) => {
          setInterimTranscript(text);
        },
        onFinalResult: (text) => {
          setCandidateTranscript(text);
          setInterimTranscript('');
        },
        onError: (err) => {
          console.warn('Speech recognition error in room:', err);
          const errorMessages: Record<string, string> = {
            'audio-capture': 'マイクを利用できません。マイクの接続とブラウザーの使用許可を確認してください。テキスト入力に切り替えます。',
            'language-not-supported': '日本語の音声認識に対応していません。テキスト入力に切り替えます。',
            network: 'ブラウザーの音声認識サービスに接続できませんでした。インターネット接続を確認するか、テキスト入力をご利用ください。',
            'not-allowed': 'マイクの使用が許可されていません。アドレスバーの権限設定でマイクを許可してください。テキスト入力に切り替えます。',
            'service-not-allowed': 'ブラウザーの音声認識サービスが利用できません。テキスト入力をご利用ください。',
          };
          setCandidateTranscript((current) => current || recognizerRef.current?.getTranscript() || '');
          setInterimTranscript('');
          setIsRecording(false);
          setInputMode('text');
          const startError = err.startsWith('start-failed:')
            ? `音声認識を開始できませんでした（${err.slice('start-failed:'.length)}）。マイクの使用許可と、ほかのアプリがマイクを使用していないことを確認してください。`
            : undefined;
          setErrorMessage(errorMessages[err] || startError || '音声認識に失敗しました。もう一度お試しいただくか、テキスト入力をご利用ください。');
        },
        onEnd: () => {
          setIsRecording(false);
        },
      },
      candidateTranscript
    );
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (!recognizerRef.current) return;
    const finalText = recognizerRef.current.stop();
    setIsRecording(false);
    const combined = (finalText || interimTranscript || candidateTranscript).trim();
    if (combined) {
      setCandidateTranscript(combined);
    }
    setInterimTranscript('');
  };

  // Toggle record button
  const toggleRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      stopSpeaking();
      startVoiceRecording();
    }
  };

  // Submit Answer to AI for Real-time Feedback & Next Question
  const handleAnswerSubmit = async () => {
    const rawAnswer = (candidateTranscript || interimTranscript).trim();
    if (!rawAnswer) {
      setErrorMessage('回答が入力されていません。マイクで話すか、テキストを入力してください。');
      return;
    }

    // Stop recording and speech
    if (isRecording) {
      stopVoiceRecording();
    }
    stopSpeaking();

    setIsProcessing(true);
    setErrorMessage(null);
    setInterviewerState('thinking');

    // Add candidate message to history
    const candidateMsg: InterviewMessage = {
      id: `cand-${Date.now()}`,
      role: 'candidate',
      text: rawAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      questionNumber: currentQuestionNumber,
    };

    const newHistory = [...history, candidateMsg];
    setHistory(newHistory);

    try {
      const response = await fetch('/api/interview/evaluate-and-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          currentQuestionIndex: currentQuestionNumber,
          currentQuestionText,
          candidateAnswer: rawAnswer,
          history: newHistory,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || '評価処理に失敗しました。');
      }

      // Attach feedback to this candidate turn
      candidateMsg.feedback = data.feedback;
      setLatestFeedback({
        feedback: data.feedback,
        questionNumber: currentQuestionNumber,
        questionText: currentQuestionText,
        candidateAnswer: rawAnswer,
      });

      // Clear input buffers
      setCandidateTranscript('');
      setInterimTranscript('');

      if (data.isFinished || currentQuestionNumber >= config.totalQuestions) {
        // Complete interview and generate final report!
        await handleGenerateFinalReport(newHistory);
      } else {
        // Advance to next question!
        const nextNum = currentQuestionNumber + 1;
        setCurrentQuestionNumber(nextNum);
        setCurrentQuestionText(data.nextQuestion);
        setCurrentQuestionFocus(data.nextQuestionFocus || '掘り下げと適性');
        setCurrentModelAnswer(data.nextQuestionModelAnswer || '');
        setCurrentQuestionTips(data.nextQuestionTips || []);

        const interviewerMsg: InterviewMessage = {
          id: `interviewer-q${nextNum}`,
          role: 'interviewer',
          text: data.nextQuestion,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          questionNumber: nextNum,
          questionFocus: data.nextQuestionFocus,
          questionModelAnswer: data.nextQuestionModelAnswer,
          questionTips: data.nextQuestionTips,
        };

        setHistory([...newHistory, interviewerMsg]);

        // Speak the new question aloud
        speakCurrentQuestion(data.nextQuestion);
      }
    } catch (err: any) {
      console.error('Error in answer evaluation:', err);
      setErrorMessage(err.message || '回答の送信に失敗しました。もう一度お試しください。');
      setInterviewerState('listening');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate final comprehensive report
  const handleGenerateFinalReport = async (fullHistory: InterviewMessage[]) => {
    setIsFinishingReport(true);
    setInterviewerState('thinking');

    try {
      const res = await fetch('/api/interview/final-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          history: fullHistory,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.report) {
        throw new Error(data.error || 'レポート生成に失敗しました');
      }

      onFinish(data.report, fullHistory);
    } catch (err: any) {
      console.error('Failed to generate final report:', err);
      setErrorMessage('レポートの生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsFinishingReport(false);
    }
  };

  const displayText = interimTranscript
    ? `${candidateTranscript} ${interimTranscript}`
    : candidateTranscript;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white text-sm">模擬面接中</span>
          </div>
          <span className="hidden sm:inline text-xs text-slate-400">|</span>
          <span className="hidden sm:inline text-xs text-slate-300 font-medium">
            {config.jobCategory}
          </span>
          <span className="hidden md:inline px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300">
            {config.interviewStage}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Mute toggle */}
          <button
            onClick={() => {
              if (!isAudioMuted) stopSpeaking();
              setIsAudioMuted(!isAudioMuted);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              isAudioMuted
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="面接官の音声読み上げON/OFF"
          >
            <span>{isAudioMuted ? '音声ミュート' : '音声ON'}</span>
          </button>

          {/* Model Answer / Cheat Sheet Toggle */}
          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showCheatSheet
                ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="出題時に模範解答と回答のコツを表示"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">模範解答</span>
            <span className="text-[10px]">{showCheatSheet ? '表示中' : '非表示'}</span>
          </button>

          {/* End Interview prematurely to see report */}
          <button
            onClick={() => handleGenerateFinalReport(history)}
            disabled={isFinishingReport || history.length <= 1}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">面接を終了して採点</span>
          </button>

          {/* Abort / Exit */}
          <button
            onClick={onExit}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="設定に戻る"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Interview Visuals & Controls | Right Real-Time AI Coaching Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Interviewer & Candidate Camera / Mic Area) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Half: Split between Interviewer & Candidate Webcam */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Interviewer Avatar */}
            <InterviewerAvatar
              persona={config.interviewerPersona}
              state={interviewerState}
              currentQuestionText={currentQuestionText}
              questionNumber={currentQuestionNumber}
              totalQuestions={config.totalQuestions}
              questionFocus={currentQuestionFocus}
              modelAnswer={currentModelAnswer}
              answeringTips={currentQuestionTips}
              showModelAnswerByDefault={showCheatSheet}
              isPersonalized={Boolean(config.rawResumeText || config.rawCareerText)}
              onReplayAudio={() => speakCurrentQuestion(currentQuestionText)}
              isAudioMuted={isAudioMuted}
            />

            {/* Candidate Camera Preview */}
            <CameraPreview
              enabled={cameraEnabled}
              onToggle={() => setCameraEnabled(!cameraEnabled)}
            />
          </div>

          {/* Answering & Speech Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            {/* Header with Answering status, Timer, Mode switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 text-sm">あなたの回答</span>
                {isRecording && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    リアルタイム音声認識中
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Answer Duration Counter */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>回答時間: </span>
                  <span className="font-mono font-bold text-white">
                    {formatTimer(answerSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-500">(目安: 60〜90秒)</span>
                </div>

                {/* Mode toggle */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setInputMode('voice')}
                    className={`p-1.5 rounded-md text-xs transition flex items-center gap-1 ${
                      inputMode === 'voice'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="音声で回答"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">音声</span>
                  </button>
                  <button
                    onClick={() => {
                      if (isRecording) stopVoiceRecording();
                      setInputMode('text');
                    }}
                    className={`p-1.5 rounded-md text-xs transition flex items-center gap-1 ${
                      inputMode === 'text'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="キーボードでテキスト入力"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">テキスト</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Answer Display / Input Area */}
            {inputMode === 'voice' ? (
              <div className="relative min-h-[120px] max-h-[220px] overflow-y-auto bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-sm">
                {displayText ? (
                  <p className="text-slate-100 leading-relaxed font-sans whitespace-pre-wrap">
                    {displayText}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-500">
                    <Mic className="w-7 h-7 text-indigo-500/50 mb-2" />
                    <p className="text-xs">
                      {isRecording
                        ? 'マイクに向かって回答を話してください...'
                        : '「マイクで回答を開始」ボタンを押して発言してください'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      結論から先に話し、具体的なエピソードや数字を交えると高評価です
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                rows={4}
                value={candidateTranscript}
                onChange={(e) => setCandidateTranscript(e.target.value)}
                placeholder="質問に対する回答をここに入力してください（結論ファースト・STAR法を意識）..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
              />
            )}

            {/* Live Audio Visualizer Bar */}
            {inputMode === 'voice' && <AudioVisualizer isListening={isRecording} />}

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons: Voice Record Toggle & Submit */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {inputMode === 'voice' ? (
                <button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>発言を一時停止</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>マイクで回答を開始</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setCandidateTranscript('')}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  クリア
                </button>
              )}

              {/* Submit Answer */}
              <button
                onClick={handleAnswerSubmit}
                disabled={isProcessing || isFinishingReport || !displayText.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-extrabold text-xs sm:text-sm text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>AIがリアルタイム採点中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>この回答を提出して添削を受ける</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time AI Coaching Panel & Transcript History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Realtime Feedback Card */}
          {latestFeedback ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  最新のリアルタイム添削結果
                </span>
                <span className="text-[11px] text-slate-400">
                  全問終了後に総合評価シートが発行されます
                </span>
              </div>
              <RealtimeFeedbackCard
                feedback={latestFeedback.feedback}
                questionNumber={latestFeedback.questionNumber}
                questionText={latestFeedback.questionText}
                candidateAnswer={latestFeedback.candidateAnswer}
              />
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-200 text-sm">リアルタイムAI添削待機中</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                質問に回答して提出すると、AIが即座に
                <strong className="text-indigo-300 font-medium"> スコア・STAR法充足度・良かった点・改善アドバイス・模範言い換え例 </strong>
                をここに表示します。
              </p>
            </div>
          )}

          {/* Conversation History Archive */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 max-h-[360px] overflow-y-auto">
            <h4 className="font-bold text-slate-300 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              面接ログ ({history.length}件のやりとり)
            </h4>

            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    item.role === 'interviewer'
                      ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                      : 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">
                      {item.role === 'interviewer'
                        ? `面接官 ${config.interviewerPersona.name}`
                        : 'あなた（候補者）'}
                    </span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="leading-relaxed">{item.text}</p>

                  {item.feedback && (
                    <div className="mt-1.5 pt-1.5 border-t border-indigo-900/50 flex items-center justify-between text-[11px] text-indigo-300">
                      <span>採点スコア: {item.feedback.score}点</span>
                      <span>{item.feedback.ratingLabel}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
