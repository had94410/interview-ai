export type InterviewStyle = 'gentle' | 'standard' | 'strict';

export interface InterviewerPersona {
  id: string;
  name: string;
  title: string;
  style: InterviewStyle;
  styleLabel: string;
  avatarColor: string;
  description: string;
  voiceName: string;
}

export interface DocumentAttachment {
  name: string;
  type: string;
  content: string; // text or base64
  isBase64?: boolean;
}

export interface InterviewConfig {
  jobCategory: string;
  careerStage: string;
  interviewStage: string;
  interviewerPersona: InterviewerPersona;
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

export interface StarEvaluation {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface AnswerFeedback {
  score: number; // 0 - 100
  ratingLabel: string; // "秀逸" | "合格ライン" | "要改善" | "不足"
  summary: string;
  strengths: string[];
  improvements: string[];
  starEvaluation: StarEvaluation;
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

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
  questionNumber?: number;
  questionFocus?: string;
  questionModelAnswer?: string;
  questionTips?: string[];
  feedback?: AnswerFeedback;
}

export interface RadarScores {
  logic: number;
  concreteness: number;
  passion: number;
  problemSolving: number;
  communication: number;
}

export interface FinalReportData {
  overallScore: number;
  grade: 'S' | 'A' | 'B' | 'C';
  passJudgement: string;
  radarScores: RadarScores;
  generalReview: string;
  keyStrengths: string[];
  criticalImprovements: string[];
  actionPlanForRealInterview: string[];
}
