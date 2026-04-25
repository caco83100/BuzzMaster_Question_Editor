export type CustomQuizPhase =
  | 'SETUP'
  | 'QUESTION'
  | 'ANSWERS_OPEN'
  | 'CORRECTION'
  | 'QUESTION_PODIUM'
  | 'FINAL_SCOREBOARD';

export interface CustomQuizAnswer {
  id: string;
  text: string;
}

export interface CustomQuizQuestion {
  id: string;
  question: string;
  answers: CustomQuizAnswer[];
  correctAnswer: string;
}

export interface CustomQuizPlayer {
  id: string;
  name: string;
}

export interface CustomQuizPlayerAnswer {
  playerId: string;
  answerId: string;
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
