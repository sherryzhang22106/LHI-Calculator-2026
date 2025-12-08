export interface Question {
  id: number;
  text: string;
  dimensionId: string;
  isReverse: boolean;
}

export interface Dimension {
  id: string;
  name: string;
  nameCn: string; // Chinese name for display
  description: string;
}

export interface QuizState {
  currentStep: 'welcome' | 'quiz' | 'report';
  answers: Record<number, number>; // questionId -> score (1-5)
  accessCode: string;
}

export interface DimensionResult {
  id: string;
  name: string;
  rawScore: number;
  zScore: number;
  tScore: number; // T-score (50 + 10z)
  level: 'Low' | 'Moderate' | 'High';
}

export interface AIAnalysis {
  resultInterpretation: string;
  personalizedAdvice: string;
  strengths: string;
  areasToWatch: string;
  professionalAdvice: string;
}

export interface AssessmentResult {
  totalScore: number; // 0-100 LHI
  category: 'Fragile' | 'Below Average' | 'Average' | 'Healthy';
  dimensions: DimensionResult[];
  attachmentStyle: string;
  timestamp: string;
  aiAnalysis?: AIAnalysis;
  assessmentId?: string;
}

export enum AccessCodeStatus {
  VALID,
  INVALID,
  USED
}