import React, { useState } from 'react';
import {
  Briefcase,
  User,
  Layers,
  Sparkles,
  Mic,
  Camera,
  Volume2,
  VolumeX,
  Play,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { InterviewConfig, InterviewerPersona, DocumentAttachment } from '../types';
import { isSpeechRecognitionSupported, speakText, stopSpeaking } from '../utils/speech';
import { DocumentUploadCard } from './DocumentUploadCard';

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
  isLoading: boolean;
}

const INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  {
    id: 'sakurai',
    name: '櫻井 陽菜',
    title: '人事部 採用マネージャー',
    style: 'gentle',
    styleLabel: '温和・共感型',
    avatarColor: 'from-pink-500 to-rose-600',
    description: '緊張をほぐし、人柄やポテンシャルを丁寧に引き出してくれる優しい面接官。面接練習の初日や自信をつけたい方におすすめです。',
    voiceName: 'Kore',
  },
  {
    id: 'tanaka',
    name: '田中 健一',
    title: '採用統括グループ リーダー',
    style: 'standard',
    styleLabel: '標準・ビジネス型',
    avatarColor: 'from-indigo-600 to-blue-700',
    description: '標準的なビジネスマナーと実務適性をバランスよく評価する標準面接官。実際の企業の一次〜二次面接に一番近い王道スタイルです。',
    voiceName: 'Fenrir',
  },
  {
    id: 'kanda',
    name: '神田 慎介',
    title: '取締役 兼 統括事業部長',
    style: 'strict',
    styleLabel: '論理追求・厳格深掘り型',
    avatarColor: 'from-slate-700 to-zinc-900',
    description: '「なぜそう考えたのか？」「数値的根拠は？」と鋭く論理的矛盾を突いてくる厳格スタイル。本番の役員面接や圧迫耐性を鍛えたい方に最適。',
    voiceName: 'Puck',
  },
];

const JOB_TAXONOMY = [
  { category: 'IT・Webエンジニア', jobs: ['Webアプリケーションエンジニア', 'フロントエンドエンジニア', 'バックエンドエンジニア', 'フルスタックエンジニア', 'スマートフォンアプリエンジニア', 'ゲーム開発エンジニア', 'AI・機械学習エンジニア', 'データエンジニア', 'セキュリティエンジニア', 'QA・テストエンジニア', '社内SE・情報システム', 'テクニカルサポート'] },
  { category: 'インフラ・ネットワーク', jobs: ['クラウドエンジニア', 'サーバーエンジニア', 'ネットワークエンジニア', 'SRE・DevOpsエンジニア', 'データベースエンジニア', 'システム運用・保守', 'ITヘルプデスク', '通信インフラエンジニア'] },
  { category: 'ITコンサル・プロジェクト管理', jobs: ['ITコンサルタント', 'システムアナリスト', 'プロジェクトマネージャー', 'プロジェクトリーダー', 'プロダクトマネージャー', 'スクラムマスター', 'プリセールス・セールスエンジニア', 'ITアーキテクト'] },
  { category: '営業', jobs: ['法人営業（新規開拓）', '法人営業（既存顧客中心）', '個人営業・リテール営業', 'インサイドセールス', 'フィールドセールス', 'ルート営業', '代理店営業・パートナーセールス', '海外営業', 'IT・SaaS営業', '人材営業', '医療機器営業', '不動産営業', '金融営業', '自動車営業', '営業企画・営業推進'] },
  { category: 'カスタマーサクセス・サポート', jobs: ['カスタマーサクセス', 'カスタマーサポート', 'テクニカルサポート', 'コールセンターSV', 'ヘルプデスク', 'アカウントマネージャー', 'カスタマーエクスペリエンス企画'] },
  { category: 'マーケティング・広報', jobs: ['デジタルマーケティング', 'Web広告運用', 'SEO・コンテンツマーケティング', 'SNS・インフルエンサーマーケティング', 'CRM・顧客データ分析', 'ブランドマネージャー', '市場調査・マーケティングリサーチ', '広報・PR', 'IR・投資家広報', '広告宣伝', '販促・プロモーション', 'イベント企画・運営'] },
  { category: '商品企画・事業企画', jobs: ['商品企画・開発', 'サービス企画', '事業企画・事業開発', '経営企画', '新規事業開発', '事業推進・事業管理', 'M&A・アライアンス', '店舗開発', '商品バイヤー・MD', 'Webサービス企画'] },
  { category: '人事・総務・法務', jobs: ['採用担当・採用企画', '人材開発・研修', '人事制度・組織開発', '労務・給与・社会保険', 'HRビジネスパートナー', '総務', '法務・コンプライアンス', '知的財産・特許', '内部監査・内部統制', '秘書・役員アシスタント'] },
  { category: '経理・財務', jobs: ['経理（月次・年次決算）', '財務・資金調達', '管理会計・経営管理', '税務', '連結決算', '公認会計士・監査', '経理事務・財務アシスタント'] },
  { category: '金融・保険', jobs: ['銀行法人営業', '銀行個人営業・窓口', '証券営業・投資アドバイザー', '投資銀行・M&Aアドバイザリー', 'アセットマネジメント', 'リスク管理・クオンツ', '保険営業', '保険アンダーライター', '保険金査定・支払査定', '金融事務'] },
  { category: 'コンサルティング', jobs: ['戦略コンサルタント', '経営コンサルタント', '業務改革コンサルタント', '人事・組織コンサルタント', '財務・会計コンサルタント', 'ITコンサルタント', 'セキュリティコンサルタント', 'サプライチェーンコンサルタント'] },
  { category: '購買・物流・貿易', jobs: ['購買・調達', 'バイヤー・MD', '物流企画・SCM', '倉庫管理・物流管理', '貿易事務', '生産管理・需給管理', '在庫管理', '配送・配車管理'] },
  { category: '製造・品質・研究開発', jobs: ['機械設計', '電気・電子回路設計', '組み込みエンジニア', '生産技術・製造技術', '品質管理・品質保証', '生産管理', '製品開発・研究開発', '化学・素材研究開発', '食品・飲料の商品開発', '工場管理・製造オペレーター', 'フィールドエンジニア', '技術営業'] },
  { category: '建設・不動産', jobs: ['建築施工管理', '土木施工管理', '建築設計・意匠設計', '設備設計・電気設備設計', '不動産開発・用地仕入れ', '不動産企画・運営', '不動産管理・プロパティマネジメント', '不動産仲介・売買', 'インテリアデザイナー', '測量・積算'] },
  { category: 'デザイン・クリエイティブ', jobs: ['UI・UXデザイナー', 'Webデザイナー', 'グラフィックデザイナー', 'アートディレクター', 'プロダクトデザイナー', 'Webディレクター', '映像制作・動画編集', 'ライター・編集者', 'ゲームプランナー', 'ゲームデザイナー'] },
  { category: '医療・介護・福祉', jobs: ['看護師', '薬剤師', '医療事務', '臨床検査技師', '理学療法士・作業療法士', '介護職・介護福祉士', 'ケアマネジャー', '社会福祉士・相談員', '医療機器営業', '病院・施設運営'] },
  { category: '教育・保育', jobs: ['小・中・高校教員', '塾講師・スクール運営', '保育士', '幼稚園教諭', '大学職員・学校事務', '企業研修・人材育成', '教材・教育サービス企画'] },
  { category: '販売・接客・サービス', jobs: ['店舗スタッフ・販売員', '店長・店舗マネージャー', 'スーパーバイザー・エリアマネージャー', 'ホテル・宿泊スタッフ', '旅行企画・手配', '飲食店スタッフ・店長', 'ウェディングプランナー', '美容部員・エステティシャン', 'カスタマーサービス'] },
  { category: '公務員・団体職員', jobs: ['国家公務員', '地方公務員', '行政事務', '公共政策・地域振興', '団体職員・非営利法人スタッフ'] },
];

const CAREER_STAGES = [
  { id: '新卒採用', label: '新卒採用（大学生・大学院生）', desc: '学生時代に力を入れたこと(ガクチカ)や将来ビジョン中心' },
  { id: '20代第二新卒', label: '第二新卒（社会人1〜3年目）', desc: '前職の早期転職理由とこれからの学習意欲・ポテンシャル' },
  { id: '中途キャリア転職', label: '中途・キャリア採用（即戦力）', desc: 'これまでの職務経歴・実績と即戦力としての貢献度' },
  { id: 'マネージャー・幹部職', label: 'リーダー・管理職候補', desc: 'チームマネジメント、組織課題解決、リーダーシップ' },
];

const INTERVIEW_STAGES = [
  { id: '一次面接（人柄・基礎力）', label: '一次面接（人柄・コミュニケーション基礎）' },
  { id: '二次面接（実務経験・実績深掘り）', label: '二次面接（職務実績・STAR法の深掘り）' },
  { id: '最終面接（理念共感・役員面接）', label: '最終役員面接（志望度・カルチャーフィット・覚悟）' },
];

export const InterviewSetup: React.FC<InterviewSetupProps> = ({ onStart, isLoading }) => {
  const [selectedJobCategory, setSelectedJobCategory] = useState(JOB_TAXONOMY[0].category);
  const [selectedJobTitle, setSelectedJobTitle] = useState(JOB_TAXONOMY[0].jobs[0]);
  const [jobSearch, setJobSearch] = useState('');
  const activeJobCategory = JOB_TAXONOMY.find(({ category }) => category === selectedJobCategory) ?? JOB_TAXONOMY[0];
  const matchingJobs = jobSearch.trim()
    ? JOB_TAXONOMY.flatMap(({ category, jobs }) =>
        jobs
          .filter((job) => `${job} ${category}`.toLocaleLowerCase().includes(jobSearch.trim().toLocaleLowerCase()))
          .map((job) => ({ category, job }))
      )
    : activeJobCategory.jobs.map((job) => ({ category: activeJobCategory.category, job }));
  const [careerStage, setCareerStage] = useState(CAREER_STAGES[2].id);
  const [interviewStage, setInterviewStage] = useState(INTERVIEW_STAGES[1].id);
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>(INTERVIEWER_PERSONAS[1]);
  const [targetCompany, setTargetCompany] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [useVoice, setUseVoice] = useState<boolean>(true);
  const [useGeminiTTS, setUseGeminiTTS] = useState<boolean>(false);
  const [enableCamera, setEnableCamera] = useState<boolean>(true);
  const [showModelAnswerOnAsk, setShowModelAnswerOnAsk] = useState<boolean>(true);
  const [resumeDoc, setResumeDoc] = useState<DocumentAttachment | undefined>(undefined);
  const [careerDoc, setCareerDoc] = useState<DocumentAttachment | undefined>(undefined);
  const [rawResumeText, setRawResumeText] = useState<string>('');
  const [rawCareerText, setRawCareerText] = useState<string>('');

  // Sound test state
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const hasSpeechRec = isSpeechRecognitionSupported();

  const handleTestVoice = async () => {
    if (isTestingVoice) {
      stopSpeaking();
      setIsTestingVoice(false);
      return;
    }

    setIsTestingVoice(true);
    await speakText(
      `こんにちは。本日の面接を担当します、${selectedPersona.name}です。リラックスしてお話ししてくださいね。`,
      {
        useGeminiTTS,
        voiceName: selectedPersona.voiceName,
        onEnd: () => setIsTestingVoice(false),
        onError: () => setIsTestingVoice(false),
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      jobCategory: `${selectedJobTitle}（${selectedJobCategory}）`,
      careerStage,
      interviewStage,
      interviewerPersona: selectedPersona,
      targetCompany: targetCompany.trim() || undefined,
      userNotes: userNotes.trim() || undefined,
      totalQuestions,
      useVoice,
      useGeminiTTS,
      enableCamera,
      showModelAnswerOnAsk,
      resumeDocument: resumeDoc,
      careerDocument: careerDoc,
      rawResumeText: rawResumeText.trim() || undefined,
      rawCareerText: rawCareerText.trim() || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Hero Banner */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>音声対話 × リアルタイムAI添削</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI面接官と本番さながらの模擬面接
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          面接官とリアルタイムに声で対話。話した直後にAIが
          <span className="text-indigo-400 font-semibold"> STAR法・結論ファースト度・具体性</span>
          を即時解析し、その場で模範言い換え例を伝授します。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Industry & Job Category */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Briefcase className="w-4 h-4" />
            <span>STEP 1: 志望職種 & 応募条件の設定</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              志望職種 / ポジション
            </label>
            <p className="text-[11px] text-slate-400 mb-3">
              分類から選ぶか、職種名で検索してください。選んだ職種に合わせて面接の質問を調整します。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 mb-1.5">職種分類</h3>
                <div className="h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-1">
                  {JOB_TAXONOMY.map(({ category, jobs }) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedJobCategory(category);
                        setSelectedJobTitle(jobs[0]);
                        setJobSearch('');
                      }}
                      aria-pressed={selectedJobCategory === category}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                        selectedJobCategory === category
                          ? 'bg-indigo-950/80 text-white'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span>{category}</span>
                      <span className="shrink-0 text-[10px] text-slate-500">{jobs.length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="job-search" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  職種を選択
                </label>
                <input
                  id="job-search"
                  type="search"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="例：法人営業、デザイナー、購買"
                  className="w-full mb-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                />
                <div className="h-[218px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-1">
                  {matchingJobs.length > 0 ? (
                    matchingJobs.map(({ category, job }) => (
                      <button
                        key={`${category}-${job}`}
                        type="button"
                        onClick={() => {
                          setSelectedJobCategory(category);
                          setSelectedJobTitle(job);
                        }}
                        aria-pressed={selectedJobTitle === job && selectedJobCategory === category}
                        className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                          selectedJobTitle === job && selectedJobCategory === category
                            ? 'bg-indigo-950/80 text-white'
                            : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <span className="block text-xs">{job}</span>
                        {jobSearch.trim() && (
                          <span className="block mt-0.5 text-[10px] text-slate-500">{category}</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-xs text-slate-400">
                      該当する職種がありません。別のキーワードで検索してください。
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-indigo-300">
              選択中：{selectedJobCategory} ／ {selectedJobTitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                面接フェーズ
              </label>
              <select
                value={interviewStage}
                onChange={(e) => setInterviewStage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                {INTERVIEW_STAGES.map((stg) => (
                  <option key={stg.id} value={stg.id}>
                    {stg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              応募区分（キャリアステージ）
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CAREER_STAGES.map((stage) => {
                const isSelected = careerStage === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setCareerStage(stage.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-100">{stage.label}</span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">{stage.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Resume & Career History Upload (Optional) */}
        <DocumentUploadCard
          resumeDoc={resumeDoc}
          careerDoc={careerDoc}
          rawResumeText={rawResumeText}
          rawCareerText={rawCareerText}
          onResumeChange={(doc, text) => {
            setResumeDoc(doc);
            setRawResumeText(text || '');
          }}
          onCareerChange={(doc, text) => {
            setCareerDoc(doc);
            setRawCareerText(text || '');
          }}
        />

        {/* Step 3: Choose Interviewer Persona */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <User className="w-4 h-4" />
              <span>STEP 3: 面接官のタイプ（厳しさ・スタイル）を選択</span>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {isTestingVoice ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{isTestingVoice ? '音声を停止' : '面接官の声を聞いてみる'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {INTERVIEWER_PERSONAS.map((persona) => {
              const isSelected = selectedPersona.id === persona.id;
              return (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white text-sm">
                        {persona.name.charAt(0)}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
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

                    <h4 className="font-bold text-slate-100 text-sm">{persona.name}</h4>
                    <p className="text-[11px] text-slate-400 mb-2">{persona.title}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{persona.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {isSelected ? '選択中' : 'タップして選択'}
                    </span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-indigo-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4: Question Count & Custom Notes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>STEP 4: 質問数 & 想定企業メモ（任意）</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                質問数（セッションの長さ）
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 3, label: '3問 (クイック)', sub: '約5分' },
                  { count: 5, label: '5問 (標準模試)', sub: '約12分' },
                  { count: 7, label: '7問 (フル実践)', sub: '約20分' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setTotalQuestions(item.count)}
                    className={`py-2 px-1 text-center rounded-xl border transition ${
                      totalQuestions === item.count
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] opacity-70">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                志望先企業名 / 業界イメージ (任意)
              </label>
              <input
                type="text"
                placeholder="例: トヨタ自動車、サイバーエージェント、外資ITなど"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              アピールしたい経験・自己PR要点メモ (任意)
            </label>
            <textarea
              rows={2}
              placeholder="例: 大学時代にプログラミングスクールで100人の受講生をメンターした経験。STAR法で結論から伝える練習をしたい。"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600 resize-none"
            />
          </div>
        </div>

        {/* Step 5: Device & Voice Environment Settings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Mic className="w-4 h-4" />
            <span>STEP 5: 音声 & カメラの環境設定</span>
          </div>

          {!hasSpeechRec && (
            <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-start gap-2 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                お使いのブラウザは音声認識APIに非対応か制限されています。
                <br />
                Google ChromeまたはMicrosoft Edgeをご利用いただくと、より快適に音声対話が行えます（キーボードでのテキスト入力回答も可能です）。
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Voice toggle */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  面接官の音声読み上げ
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {useVoice ? '質問を声で読み上げます' : 'テキスト表示のみ'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={useVoice}
                onChange={(e) => setUseVoice(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Camera preview toggle */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  候補者カメラ映像
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {enableCamera ? '目線・姿勢ガイド付き' : 'カメラなし'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableCamera}
                onChange={(e) => setEnableCamera(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Show Model Answer On Ask Option */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                  出題時に模範解答を表示
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {showModelAnswerOnAsk ? '質問と一緒に回答例とコツを表示' : '本番同様に模範解答を隠す'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={showModelAnswerOnAsk}
                onChange={(e) => setShowModelAnswerOnAsk(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Gemini TTS Option */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  AI高品質音声モード
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {useGeminiTTS ? 'Gemini TTS 音声' : 'ブラウザ音声合成 (高速)'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={useGeminiTTS}
                onChange={(e) => setUseGeminiTTS(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>面接ルームを準備中...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>AI模擬面接を開始する（音声対話スタート）</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
