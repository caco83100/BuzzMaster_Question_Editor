export type CustomQuizPhase =
  | 'SETUP'
  | 'QUESTION'
  | 'ANSWERS_OPEN'
  | 'PAUSED'
  | 'CORRECTION'
  | 'QUESTION_PODIUM'
  | 'FINAL_SCOREBOARD';

export type QuizColorId = 'RED' | 'BLUE' | 'ORANGE' | 'GREEN' | 'YELLOW';

export const QUIZ_COLOR_ORDER: QuizColorId[] = [
  'BLUE',
  'ORANGE',
  'GREEN',
  'YELLOW',
  'RED',
];

export interface CustomQuizAnswer {
  id: QuizColorId;
  text: string;
}

export interface CustomQuizQuestion {
  id: string;
  question: string;
  answerCount: number;
  answers: CustomQuizAnswer[];
  correctAnswer: QuizColorId;
}

export interface CustomQuizPlayer {
  id: string;
  name: string;
}

export interface CustomQuizPlayerAnswer {
  playerId: string;
  answerId: QuizColorId;
  answeredAtMs: number;
}

export interface CustomQuizQuestionResult {
  questionId: string;
  answers: CustomQuizPlayerAnswer[];
  pointsByPlayer: Record<string, number>;
}

export interface CustomQuizDefinition {
  id: string;
  name: string;
  questions: CustomQuizQuestion[];
  updatedAtMs: number;
}
