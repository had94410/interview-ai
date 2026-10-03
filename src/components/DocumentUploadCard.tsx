import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
  Eye,
  FileCode,
  AlertCircle,
} from 'lucide-react';
import { DocumentAttachment } from '../types';

interface DocumentUploadCardProps {
  resumeDoc?: DocumentAttachment;
  careerDoc?: DocumentAttachment;
  rawResumeText: string;
  rawCareerText: string;
  onResumeChange: (doc?: DocumentAttachment, text?: string) => void;
  onCareerChange: (doc?: DocumentAttachment, text?: string) => void;
}

const SAMPLE_TEMPLATES = [
  {
    label: '💻 エンジニア転職サンプル',
    resume: `【氏名】佐藤 健太 (28歳)
【学歴】2020年 〇〇大学 理工学部 情報工学科 卒業
【保有スキル】TypeScript, React, Node.js, Go, AWS, Docker
【自己PR】自走力と課題解決力を強みとしており、最新技術のキャッチアップと事業成果への還元を常に意識しています。`,
    career: `【直近の職歴】株式会社〇〇テクノロジー（2020年4月〜現在 / 4年）
【担当業務】自社BtoB SaaSプロダクトのフロントエンドおよびバックエンド開発
【実績・工夫】
・月間PV 500万規模のWebアプリのリプレイスプロジェクトを主導。TypeScript/Reactを導入し、表示速度を45%改善。
・AWS ECS/Fargate環境の構築とCI/CDパイプライン刷新により、デプロイ頻度を週1回から1日複数回へと大幅短縮。
・若手エンジニア3名のメンターを担当し、コードレビュー文化の定着を牽引。`,
  },
  {
    label: '🎓 新卒・第二新卒サンプル',
    resume: `【氏名】山田 花子 (22歳)
【学歴】〇〇大学 経済学部 2026年3月 卒業見込み
【資格】TOEIC 820点、日商簿記2級
【学生時代に力を入れたこと】大学3年次に長期インターン生としてWebマーケティング業務に参画。`,
    career: `【学生時代・インターン実績】
・株式会社〇〇にてインターンとしてSEO記事の執筆およびSNS広告の企画運用を担当（1年間）。
・データ分析（Google Analytics）に基づき、離脱率の高かったランディングページを改修。CVRを1.8%から3.2%へと約1.8倍に引き上げることに成功。
・未経験ながら週20時間のコミットを継続し、学生MVP賞を受賞。チームでの協調性と粘り強さに自信があります。`,
  },
  {
    label: '📈 法人営業・総合職サンプル',
    resume: `【氏名】高橋 亮介 (29歳)
【学歴】2019年 〇〇大学 経営学部 卒業
【職種】法人営業（エンタープライズ担当）
【自己PR】顧客の経営課題を深掘りし、伴走型でソリューションを提案するリレーション営業が得意です。`,
    career: `【職歴】〇〇商事株式会社（2019年4月〜現在 / 5年）
【担当業務】大手製造業・小売業向けの業務管理システム提案営業
【実績】
・2024年度 上半期営業目標 130%達成（全国営業所120名中 第2位表彰）。
・新規顧客の獲得において、顧客ヒアリングからROIシミュレーション作成を徹底し、受注単価2,000万円の大型案件を成約。
・既存顧客の解約率を前年比で2.1%低減させるカスタマーサポート連携施策を自発的に推進。`,
  },
];

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  resumeDoc,
  careerDoc,
  rawResumeText,
  rawCareerText,
  onResumeChange,
  onCareerChange,
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'career'>('resume');
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const careerInputRef = useRef<HTMLInputElement | null>(null);

  const hasAnyDoc = Boolean(rawResumeText.trim() || rawCareerText.trim());

  // Handle file selection
  const handleFileRead = async (
    file: File,
    type: 'resume' | 'career'
  ) => {
    // If text or markdown file, read as text directly
    if (
      file.type.includes('text') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv')
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        const doc: DocumentAttachment = {
          name: file.name,
          type: file.type || 'text/plain',
          content: text,
        };
        if (type === 'resume') {
          onResumeChange(doc, text);
        } else {
          onCareerChange(doc, text);
        }
      };
      reader.readAsText(file);
    } else {
      // For PDF or other document, read as Data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const base64 = dataUrl.split(',')[1] || '';
        const doc: DocumentAttachment = {
          name: file.name,
          type: file.type || 'application/pdf',
          content: base64,
          isBase64: true,
        };

        // Also add readable placeholder text if raw text is empty
        const fallbackText = `【添付ファイル: ${file.name}】\nファイルサイズ: ${(file.size / 1024).toFixed(1)} KB\n※書類ファイルをアップロードしました。このファイル情報をもとに模範解答が作成されます。`;
        if (type === 'resume') {
          onResumeChange(doc, rawResumeText || fallbackText);
        } else {
          onCareerChange(doc, rawCareerText || fallbackText);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplySample = (template: typeof SAMPLE_TEMPLATES[0]) => {
    onResumeChange(
      {
        name: `${template.label.split(' ')[1]}_履歴書.txt`,
        type: 'text/plain',
        content: template.resume,
      },
      template.resume
    );
    onCareerChange(
      {
        name: `${template.label.split(' ')[1]}_職務経歴書.txt`,
        type: 'text/plain',
        content: template.career,
      },
      template.career
    );
  };

  const handleClear = () => {
    onResumeChange(undefined, '');
    onCareerChange(undefined, '');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm">
                履歴書・職務経歴書の登録（任意）
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                任意入力
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              書類をアップロードまたは入力すると、
              <strong className="text-indigo-300 font-semibold">あなたの実際の経歴・実績に基づいた専用の模範解答</strong>
              が生成されます。（書類がなくても一般的な模範解答が出ます）
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {hasAnyDoc ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>パーソナライズ模範解答モード 有効</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs">
              <span>標準模範解答モード（書類なしでも利用可能）</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Sample Buttons */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          書類がない場合はワンクリックでお試しサンプルを適用できます:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {SAMPLE_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySample(tmpl)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition font-medium"
            >
              {tmpl.label}
            </button>
          ))}
          {hasAnyDoc && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 rounded-lg text-rose-400 hover:text-rose-300 text-[11px] hover:bg-rose-950/30 transition flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>クリア</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Tabs: 履歴書 vs 職務経歴書 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('resume')}
              className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'resume'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>1. 履歴書（基本情報・学歴・自己PR）</span>
              {rawResumeText.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('career')}
              className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'career'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. 職務経歴書（担当業務・実績・スキル）</span>
              {rawCareerText.trim() && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingText(!isEditingText)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pb-1"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{isEditingText ? 'ファイル選択に戻る' : 'テキストを直接入力・編集'}</span>
          </button>
        </div>

        {/* Tab 1: 履歴書 Content */}
        {activeTab === 'resume' && (
          <div className="space-y-3">
            {!isEditingText ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload Drag/Click Zone */}
                <div
                  onClick={() => resumeInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-950/40 hover:bg-slate-900/50 transition flex flex-col items-center justify-center space-y-2 group"
                >
                  <input
                    type="file"
                    ref={resumeInputRef}
                    accept=".pdf,.txt,.md,.doc,.docx,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileRead(file, 'resume');
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      履歴書ファイルをアップロード
                    </span>
                    <span className="text-[10px] text-slate-500">
                      PDF, Word, TXT, Markdown等に対応
                    </span>
                  </div>
                </div>

                {/* Upload Status / Current Resume Text Preview */}
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/70 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                        登録済みの履歴書データ:
                      </span>
                      {rawResumeText.trim() && (
                        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                          登録完了
                        </span>
                      )}
                    </div>

                    {rawResumeText.trim() ? (
                      <p className="text-[11px] text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                        {rawResumeText}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic py-4 text-center">
                        履歴書は未登録です（登録がなくても一般的な模範解答が生成されます）
                      </p>
                    )}
                  </div>

                  {rawResumeText.trim() && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => onResumeChange(undefined, '')}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>履歴書を削除</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  履歴書のテキスト直接入力・編集
                </label>
                <textarea
                  rows={5}
                  value={rawResumeText}
                  onChange={(e) => onResumeChange(resumeDoc, e.target.value)}
                  placeholder="氏名、学歴、志望理由、自己PR、保有資格などをコピー＆ペーストしてください..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 職務経歴書 Content */}
        {activeTab === 'career' && (
          <div className="space-y-3">
            {!isEditingText ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Upload Drag/Click Zone */}
                <div
                  onClick={() => careerInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 text-center bg-slate-950/40 hover:bg-slate-900/50 transition flex flex-col items-center justify-center space-y-2 group"
                >
                  <input
                    type="file"
                    ref={careerInputRef}
                    accept=".pdf,.txt,.md,.doc,.docx,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileRead(file, 'career');
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      職務経歴書ファイルをアップロード
                    </span>
                    <span className="text-[10px] text-slate-500">
                      PDF, Word, TXT, Markdown等に対応
                    </span>
                  </div>
                </div>

                {/* Upload Status / Current Career Text Preview */}
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/70 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                        登録済みの職務経歴書データ:
                      </span>
                      {rawCareerText.trim() && (
                        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900">
                          登録完了
                        </span>
                      )}
                    </div>

                    {rawCareerText.trim() ? (
                      <p className="text-[11px] text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                        {rawCareerText}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic py-4 text-center">
                        職務経歴書は未登録です（登録がなくても一般的な模範解答が生成されます）
                      </p>
                    )}
                  </div>

                  {rawCareerText.trim() && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => onCareerChange(undefined, '')}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>職務経歴書を削除</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  職務経歴書のテキスト直接入力・編集
                </label>
                <textarea
                  rows={5}
                  value={rawCareerText}
                  onChange={(e) => onCareerChange(careerDoc, e.target.value)}
                  placeholder="職歴、担当プロジェクト、使用技術・ツール、定量的実績、成功体験などを入力してください..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
