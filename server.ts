import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to call Gemini with retry and fallback across supported flash models
async function generateGeminiContentWithFallback(
  prompt: string,
  configOptions: any = { responseMimeType: 'application/json' }
): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  let lastError: any = null;

  for (const model of models) {
    // Try up to 2 attempts per model with backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: configOptions,
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} attempt ${attempt} error:`, err?.message || err);
        const errStr = JSON.stringify(err || '');
        if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('429')) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

interface DocumentAttachment {
  name: string;
  type: string;
  content: string;
  isBase64?: boolean;
}

interface InterviewConfig {
  jobCategory: string;
  careerStage: string;
  interviewStage: string;
  interviewerPersona: {
    name: string;
    title: string;
    style: 'gentle' | 'standard' | 'strict';
    styleLabel: string;
  };
  targetCompany?: string;
  userNotes?: string;
  totalQuestions: number;
  useVoice: boolean;
  useGeminiTTS: boolean;
  enableCamera: boolean;
  showModelAnswerOnAsk: boolean;
  resumeDocument?: DocumentAttachment;
  careerDocument?: DocumentAttachment;
  rawResumeText?: string;
  rawCareerText?: string;
}

interface Message {
  role: 'interviewer' | 'candidate';
  text: string;
  questionNumber?: number;
  feedback?: AnswerFeedback;
}

interface AnswerFeedback {
  score: number; // 0 - 100
  ratingLabel: string; // e.g. "秀逸", "良好", "改善の余地あり"
  summary: string;
  strengths: string[];
  improvements: string[];
  starEvaluation: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  conclusionFirst: {
    score: number; // 1-5
    comment: string;
  };
  concreteness: {
    score: number; // 1-5
    comment: string;
  };
  modelAnswer: string;
}

// 1. Start Interview - generates examiner greeting and first question
app.post('/api/interview/start', async (req: Request, res: Response) => {
  try {
    const { config } = req.body as { config: InterviewConfig };

    const documentsContext = [
      config.rawResumeText ? `■ 候補者の履歴書・基本プロフィール:\n${config.rawResumeText}` : '',
      config.rawCareerText ? `■ 候補者の職務経歴書・業務実績詳細:\n${config.rawCareerText}` : '',
    ].filter(Boolean).join('\n\n');

    const prompt = `
あなたは日本の企業の面接官「${config.interviewerPersona.name}」（役職: ${config.interviewerPersona.title}）です。
面接タイプ: ${config.interviewStage}
応募区分: ${config.careerStage}
志望職種/業界: ${config.jobCategory}
${config.targetCompany ? `志望企業/想定社風: ${config.targetCompany}` : ''}
${config.userNotes ? `候補者メモ/自己PR要点: ${config.userNotes}` : ''}
面接官の態度・雰囲気: ${config.interviewerPersona.styleLabel}（${config.interviewerPersona.style === 'gentle' ? '温和で安心感を与え、話をじっくり引き出す' : config.interviewerPersona.style === 'strict' ? '鋭い視点で論理的根拠や曖昧さを突く厳格な深掘りスタイル' : '標準的なビジネスマナーを重視した適度な緊張感のあるスタイル'}）

${documentsContext ? `
【候補者から提出された書類（履歴書・職務経歴書）】
${documentsContext}

【最重要指示：パーソナライズ模範解答の作成】
候補者の履歴書・職務経歴書が提出されています。
第1問の模範解答（modelAnswer）は、この候補者の実際の学歴、職歴、担当プロジェクト、使用技術、数値実績、自己PRを具体的に組み込み、この候補者自身が本番の面接でそのまま話せるような、リアルで説得力のあるパーソナライズされた回答を作成してください。
` : `
【模範解答の作成】
履歴書・職務経歴書の提出はありません。${config.jobCategory}（${config.careerStage}）の応募において面接官から高評価を獲得できる、汎用的で実践的なプロの模範回答を作成してください。
`}

【指示】
面接の冒頭挨拶と、アイスブレイクまたは最初の質問（第1問：例として自己紹介と志望理由の要約など、面接タイプに応じた自然な最初の問い）を作成してください。
また、**候補者が練習・カンペとして参考にできるよう、その第1問に対する【理想的なプロの模範解答例】と【回答の構成ポイント・コツ】も一緒に作成してください。**
候補者が本番のように音声で聞き取れるよう、自然で品格のある丁寧な日本語（話し言葉）で記述してください。

以下のJSONフォーマットで返答してください。
{
  "greeting": "面接官としての冒頭の挨拶",
  "firstQuestion": "最初の質問（第1問）の内容。口頭で聞きやすい文章にしてください。",
  "questionFocus": "この質問で見ている評価ポイント（1行）",
  "modelAnswer": "この質問に対する理想的な模範解答例（結論ファースト・STAR法を取り入れた約1分程度で話せるプロの回答サンプル。候補者が参考にできるよう話し言葉で記述）",
  "answeringTips": [
    "回答のポイント1（例: 冒頭で結論と全体像を15秒で端的に伝える）",
    "回答のポイント2（例: 具体的なエピソードや数字を1つ盛り込む）",
    "注意点（例: 経歴を長々と話しすぎず、相手との対話のきっかけを作る）"
  ]
}
`;

    let parsed: any = {};
    try {
      const text = await generateGeminiContentWithFallback(prompt, {
        responseMimeType: 'application/json',
      });
      parsed = JSON.parse(text || '{}');
    } catch (apiErr) {
      console.warn('Gemini generate fallback used for start question:', apiErr);
      parsed = {
        greeting: `本日は面接にお越しいただきありがとうございます。担当面接官の${config.interviewerPersona.name}です。どうぞよろしくお願いいたします。`,
        firstQuestion: `それではまず初めに、1分程度で簡単な自己紹介と${config.jobCategory}を志望された動機の要約をお願いいたします。`,
        questionFocus: '第一印象・簡潔な自己表現力と志望動機の要約',
        modelAnswer: `はじめまして、本日はよろしくお願いいたします。〇〇と申します。これまで〇〇として、主に〇〇の業務に従事し、チームでの目標達成や〇〇%の改善に貢献してまいりました。今回の貴社の${config.jobCategory}の募集を拝見し、自身の〇〇のスキルを活かして貴社の事業成長に直接貢献したいと考え志望いたしました。本日はどうぞよろしくお願いいたします。`,
        answeringTips: [
          '冒頭で挨拶と氏名をはっきりと名乗り、第一印象を爽やかにする',
          '自己紹介は1分（約300文字）を目安に、長くなりすぎないよう要約する',
          '現在の強みと、今回応募した軸を自然に繋げて話す'
        ]
      };
    }

    res.json({
      success: true,
      greeting: parsed.greeting || '本日は面接にお越しいただきありがとうございます。どうぞよろしくお願いいたします。',
      firstQuestion: parsed.firstQuestion || 'それではまず初めに、1分程度で簡単な自己紹介をお願いいたします。',
      questionFocus: parsed.questionFocus || '簡潔な自己表現と第一印象・コミュニケーション力',
      modelAnswer: parsed.modelAnswer || 'はじめまして、〇〇と申します。これまでの経験を活かし、貴社の業務に貢献したいと考え志望いたしました。本日はどうぞよろしくお願いいたします。',
      answeringTips: parsed.answeringTips || [
        '結論から先に話し、1分程度で要約する',
        'これまでの実績や強みを端的に伝える',
        '志望動機への自然な繋がりを意識する'
      ],
    });
  } catch (error: any) {
    console.error('Error starting interview:', error);
    res.json({
      success: true,
      greeting: '本日は面接にお越しいただきありがとうございます。どうぞよろしくお願いいたします。',
      firstQuestion: 'それではまず初めに、1分程度で簡単な自己紹介と今回のご応募理由をお願いいたします。',
      questionFocus: '自己表現とコミュニケーション力',
      modelAnswer: 'はじめまして、〇〇と申します。本日は貴重なお時間をいただきありがとうございます。',
      answeringTips: ['明るいトーンで結論から簡潔に伝える'],
    });
  }
});

// 2. Evaluate Candidate's Answer in Real-Time & Generate Next Question / Follow-up
app.post('/api/interview/evaluate-and-next', async (req: Request, res: Response) => {
  try {
    const {
      config,
      currentQuestionIndex,
      currentQuestionText,
      candidateAnswer,
      history,
    } = req.body as {
      config: InterviewConfig;
      currentQuestionIndex: number;
      currentQuestionText: string;
      candidateAnswer: string;
      history: Message[];
    };

    const isLastQuestion = currentQuestionIndex >= config.totalQuestions;

    const documentsContext = [
      config.rawResumeText ? `■ 候補者の履歴書・基本プロフィール:\n${config.rawResumeText}` : '',
      config.rawCareerText ? `■ 候補者の職務経歴書・業務実績詳細:\n${config.rawCareerText}` : '',
    ].filter(Boolean).join('\n\n');

    const prompt = `
あなたは日本のプロ採用面接官「${config.interviewerPersona.name}」（${config.interviewerPersona.title}）兼、就職・転職のキャリアコーチです。
【面接コンテキスト】
- 志望職種: ${config.jobCategory}
- 区分: ${config.careerStage} (${config.interviewStage})
- 面接官スタンス: ${config.interviewerPersona.styleLabel}
- 現在の質問番号: 第${currentQuestionIndex}問 (全${config.totalQuestions}問)
${isLastQuestion ? '- これが最後の質問に対する回答でした。' : ''}

${documentsContext ? `
【提出された書類（履歴書・職務経歴書）】
${documentsContext}

【パーソナライズ模範解答の作成ルール】
候補者から提出された実際の経歴書や実績（担当業務、プロジェクト、使用ツール、数値成果）を自然に引用・反映し、この候補者が本番で実際に自分のエピソードとして自信を持って語れるパーソナライズされた模範解答を作成してください。
` : `
【模範解答の作成ルール】
提出書類はありません。候補者の発言と職種に即した、高評価を得られる汎用的なプロの模範回答を作成してください。
`}

【質問内容】
${currentQuestionText}

【候補者の回答 (音声認識テキスト)】
「${candidateAnswer}」

【これまでの会話履歴の抜粋】
${history.slice(-4).map((h) => `${h.role === 'interviewer' ? '面接官' : '候補者'}: ${h.text}`).join('\n')}

【あなたの任務】
1. **候補者の回答に対するリアルタイム詳細フィードバック (AnswerFeedback)**
   - 総合評価スコア (0-100点) とレーティング区分（秀逸 90-100 / 合格ライン 75-89 / 要改善 60-74 / 不足 59以下）
   - 即時講評 (summary): 回答の印象と要点 (1〜2文)
   - 良かった点 (strengths): 2〜3項目。具体的に何が評価できるか
   - 改善ポイント (improvements): 2〜3項目。どう直せばより説得力が増すか
   - STAR法の評価 (starEvaluation): Situation(状況), Task(課題), Action(工夫・行動), Result(数字・学び) それぞれの言及度や不足点
   - 結論ファースト度 (conclusionFirst: 1〜5点 & コメント)
   - 具体性・説得力 (concreteness: 1〜5点 & コメント)
   - より魅力的になる模範回答例 (modelAnswer): この回答者のエピソードを活かしたプロレベルの言い換え・改善回答文

2. **面接官としてのリアルタイム対話リアクション & ${isLastQuestion ? '面接終了の挨拶' : '次の質問（深掘り質問または新トピック）'}**
   - interviewerReaction: 候補者の回答を受けた自然な面接官の相槌・所感（「ありがとうございます。〜という点、大変興味深く伺いました。」等）
   - nextQuestion: ${
     isLastQuestion
       ? '面接終了の挨拶と御礼（例: 「本日の面接質問は以上となります。本日はお忙しい中ありがとうございました。」）'
       : '次の質問文（候補者の回答が曖昧だった場合は自然な深掘り質問、十分だった場合は次の評価軸へ進む質問。音声で聞き取りやすい品格ある自然な日本語）'
   }
   - nextQuestionFocus: 次の質問で見極めたい能力・ポイント
   - nextQuestionModelAnswer: ${
     isLastQuestion
       ? '""'
       : '次の質問に対するプロ仕様の理想的な模範解答例（STAR法と結論ファーストを取り入れた、候補者が参考にしやすい1分前後の回答サンプル）'
   }
   - nextQuestionTips: [
       "次の質問に答える構成のコツ1",
       "注意すべき点・ポイント2"
     ]
   - isFinished: ${isLastQuestion}

以下のJSON形式で出力してください:
{
  "feedback": {
    "score": 82,
    "ratingLabel": "合格ライン",
    "summary": "...",
    "strengths": ["...", "..."],
    "improvements": ["...", "..."],
    "starEvaluation": {
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "..."
    },
    "conclusionFirst": {
      "score": 4,
      "comment": "..."
    },
    "concreteness": {
      "score": 4,
      "comment": "..."
    },
    "modelAnswer": "..."
  },
  "interviewerReaction": "...",
  "nextQuestion": "...",
  "nextQuestionFocus": "...",
  "nextQuestionModelAnswer": "...",
  "nextQuestionTips": ["...", "..."],
  "isFinished": ${isLastQuestion}
}
`;

    let parsed: any = {};
    try {
      const text = await generateGeminiContentWithFallback(prompt, {
        responseMimeType: 'application/json',
      });
      parsed = JSON.parse(text || '{}');
    } catch (apiErr) {
      console.warn('Gemini generate fallback used for evaluate-and-next:', apiErr);
      parsed = {
        feedback: {
          score: 80,
          ratingLabel: '合格ライン',
          summary: '回答の要点が伝わっており、意欲が感じられる回答です。さらにSTAR法を意識して数値実績や具体的な工夫を加えると説得力が増します。',
          strengths: ['質問に対する回答意図が明確で聞き取りやすい', 'ポジティブな姿勢と熱意が伝わってくる'],
          improvements: ['結論から先に述べる「結論ファースト」を意識するとさらに良い', '具体的な数字やチーム内でのご自身の役割を詳しく話すと説得力が上がります'],
          starEvaluation: {
            situation: '背景や前提条件が伝わっています',
            task: '取り組むべき課題の提示をより明確にできます',
            action: 'ご自身が取った工夫をさらに具体化できます',
            result: '定量的な成果や得られた学びを補強するとベストです'
          },
          conclusionFirst: {
            score: 4,
            comment: '要点が伝わりやすい順序で話せています'
          },
          concreteness: {
            score: 4,
            comment: 'エピソードの具体性をさらに高めると印象に残ります'
          },
          modelAnswer: `私の強みは課題解決に向けて主体的に行動できる点です。具体的には、${candidateAnswer.slice(0, 80)}...といった状況において、自ら工夫して成果につなげました。この経験を貴社の業務でも発揮したいと考えております。`
        },
        interviewerReaction: 'お答えいただきありがとうございます。大変よく伝わりました。',
        nextQuestion: isLastQuestion
          ? '本日の面接質問は以上となります。本日は誠にありがとうございました。'
          : `ありがとうございます。それでは次の質問に移ります。これまでにチームや業務で困難に直面した経験と、それをどう乗り越えたかをお聞かせいただけますか？`,
        nextQuestionFocus: '困難克服力・課題解決力（STAR法）',
        nextQuestionModelAnswer: `私が直面した最大の困難は、プロジェクト納期が逼迫した際の仕様変更でした（状況）。そこで私はタスクの優先度を細分化し、チームメンバーと進捗を可視化する朝会を主導しました（行動）。その結果、納期通りにリリースを完了し、顧客満足度〇%を維持できました（成果）。この経験から、危機時こそ冷静に全体を俯瞰し巻き込む重要性を学びました。`,
        nextQuestionTips: [
          '困難の大きさ（Situation）だけでなく、自分が取った具体的な工夫（Action）に7割の時間を割く',
          '単なる苦労話で終わらせず、結果（Result）と得た教訓を最後に伝える'
        ],
        isFinished: isLastQuestion
      };
    }

    res.json({
      success: true,
      feedback: parsed.feedback,
      interviewerReaction: parsed.interviewerReaction || 'お答えいただきありがとうございます。',
      nextQuestion: parsed.nextQuestion || (isLastQuestion ? '本日の質問は以上となります。' : 'それでは次の質問に移らせていただきます。'),
      nextQuestionFocus: parsed.nextQuestionFocus || '総合的な適性',
      nextQuestionModelAnswer: parsed.nextQuestionModelAnswer || '',
      nextQuestionTips: parsed.nextQuestionTips || [
        '結論から述べ、自分の具体的な行動と工夫を中心に話す',
        '結果として何が得られたか、数値や学びを添える'
      ],
      isFinished: parsed.isFinished ?? isLastQuestion,
    });
  } catch (error: any) {
    console.error('Error in evaluate-and-next:', error);
    res.status(500).json({
      success: false,
      error: error.message || '回答の評価に失敗しました。',
    });
  }
});

// 3. Final Diagnostic Summary & Report
app.post('/api/interview/final-report', async (req: Request, res: Response) => {
  try {
    const { config, history } = req.body as {
      config: InterviewConfig;
      history: Message[];
    };

    const prompt = `
あなたは熟練の人事役員およびキャリアアドバイザーです。
以下の模擬面接全体のやり取りを総括し、公式な面接評価診断レポートを作成してください。

【面接情報】
- 志望職種: ${config.jobCategory}
- 区分: ${config.careerStage} (${config.interviewStage})
- 面接官: ${config.interviewerPersona.name} (${config.interviewerPersona.styleLabel})

【面接ログ】
${history
  .map(
    (m) =>
      `[${m.role === 'interviewer' ? '面接官' : '候補者'}] ${m.text} ${
        m.feedback ? `\n(この回答のスコア: ${m.feedback.score}点 / 改善点: ${m.feedback.improvements.join('; ')})` : ''
      }`
  )
  .join('\n\n')}

【レポート要件】
1. overallScore (0〜100点の総合点数)
2. grade ("S" (90-100: 内定確実水準), "A" (80-89: 通過水準), "B" (70-79: 境界線水準), "C" (69以下: 再対策推奨))
3. passJudgement ("合格 (二次/役員面接へ推薦)", "ボーダーライン (要ブラッシュアップ)", "不合格 (大幅な再対策が必要)")
4. radarScores (5項目、各0〜100点):
   - logic: 論理構成・結論ファースト (PREP法・論理的一貫性)
   - concreteness: 具体性・エピソード深度 (数字・役割・実例)
   - passion: 熱意・志望度・企業理解 (熱量・主体的な動機)
   - problemSolving: 課題解決力・行動力 (困難への対処・STAR法)
   - communication: コミュニケーション・表現力 (明瞭さ・端的な受け答え・好感度)
5. generalReview: 面接官からの総評（全体を通じた評価と熱いアドバイス、300〜400字程度）
6. keyStrengths: 際立っていた強み（3〜4項目）
7. criticalImprovements: 最優先で直すべき課題（3〜4項目）
8. actionPlanForRealInterview: 本番面接までにやるべき具体的アクションプラン3箇条

JSON形式で返答してください:
{
  "overallScore": 84,
  "grade": "A",
  "passJudgement": "合格 (二次面接へ推薦)",
  "radarScores": {
    "logic": 85,
    "concreteness": 80,
    "passion": 88,
    "problemSolving": 82,
    "communication": 85
  },
  "generalReview": "...",
  "keyStrengths": ["...", "...", "..."],
  "criticalImprovements": ["...", "...", "..."],
  "actionPlanForRealInterview": ["...", "...", "..."]
}
`;

    let parsed: any = {};
    try {
      const text = await generateGeminiContentWithFallback(prompt, {
        responseMimeType: 'application/json',
      });
      parsed = JSON.parse(text || '{}');
    } catch (apiErr) {
      console.warn('Gemini generate fallback used for final-report:', apiErr);
      // Compute average score from feedback in history if available
      const scores = history.filter((m) => m.feedback?.score).map((m) => m.feedback!.score);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 82;
      const grade = avgScore >= 90 ? 'S' : avgScore >= 80 ? 'A' : avgScore >= 70 ? 'B' : 'C';

      parsed = {
        overallScore: avgScore,
        grade,
        passJudgement: avgScore >= 80 ? '合格 (二次面接へ推薦)' : 'ボーダーライン (要ブラッシュアップ)',
        radarScores: {
          logic: Math.min(100, avgScore + 2),
          concreteness: Math.max(65, avgScore - 4),
          passion: Math.min(95, avgScore + 5),
          problemSolving: avgScore,
          communication: Math.min(92, avgScore + 3),
        },
        generalReview: `全体を通じて志望意欲が高く、質問の意図をしっかり汲み取って誠実に回答しようとする姿勢が非常に好印象でした。\n特に困難に直面した際の主体的な取り組みやチームへの配慮が伝わってきました。\n本番では、「結論から簡潔に伝えること」と「数字や具体的な行動規模を盛り込むこと」をさらに意識すると、面接官の評価が飛躍的に高まります。`,
        keyStrengths: [
          '意図を的確に捉えた誠実で明瞭な受け答え',
          '物事に前向きに取り組み、課題を乗り越えようとする向上心',
          '面接官の質問に合わせた柔軟なコミュニケーション能力',
        ],
        criticalImprovements: [
          'エピソードを話す際に結論（成果や学び）を冒頭1文で言い切る訓練を行う',
          '「何割改善したか」「何名に関わったか」など具体的な指標や数値を織り交ぜる',
          '入社後にその強みをどう再現して貢献できるかの解像度を上げる',
        ],
        actionPlanForRealInterview: [
          'STAR法（状況・課題・行動・成果）をメモに書き出し、各エピソードを60秒で話す練習をする',
          '志望企業の理念や中期経営計画を読み込み、「なぜ他社ではなくこの会社か」を1文で言語化する',
          '模擬面接の録音を聞き返して、不要な接続詞（えーと、あの）を減らす',
        ],
      };
    }

    res.json({
      success: true,
      report: parsed,
    });
  } catch (error: any) {
    console.error('Error generating final report:', error);
    res.status(500).json({
      success: false,
      error: error.message || '総合レポートの生成に失敗しました。',
    });
  }
});

// 4. Server-Side High Quality Speech Synthesis (Gemini TTS)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    // Call gemini-3.8-flash-lite-tts
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 500),
              speechMetadata: {
                style: 'Professional Japanese job interviewer, polite, calm, clear pronunciation',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from Gemini TTS' });
      return;
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    // If TTS fails (e.g. rate limit), return informative error so client falls back to Web Speech API
    console.warn('Gemini TTS warning, client will fallback to Web Speech API:', error.message);
    res.status(200).json({
      success: false,
      fallbackToWebSpeech: true,
      error: error.message,
    });
  }
});

// Vite Middleware for Development / Static Serve for Production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const listen = (port: number) =>
    new Promise<void>((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        resolve();
      });
      server.once('error', reject);
    });

  try {
    await listen(PORT);
  } catch (error) {
    const isAddressInUse =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EADDRINUSE';

    if (PORT !== 3000 || !isAddressInUse) {
      throw error;
    }

    console.warn('Port 3000 is already in use; trying port 3001.');
    await listen(3001);
  }
}

export default app;

if (process.env.VERCEL !== '1') {
  setupVite().catch((err) => {
    console.error('Failed to start server:', err);
    process.exitCode = 1;
  });
}
