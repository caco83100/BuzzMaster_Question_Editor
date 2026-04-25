import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  CustomQuizPhase,
  CustomQuizPlayer,
  CustomQuizPlayerAnswer,
  CustomQuizQuestion,
  CustomQuizQuestionResult,
  QuizColorId,
} from 'src/types/customQuiz';

const CORRECT_POINTS = 100;
const SPEED_BONUS = [50, 30, 10];

type PlayablePhase = Exclude<
  CustomQuizPhase,
  'SETUP' | 'PAUSED' | 'FINAL_SCOREBOARD'
>;

export const useCustomQuizStore = defineStore('custom-quiz', () => {
  const phase = ref<CustomQuizPhase>('SETUP');
  const previousPhase = ref<PlayablePhase | undefined>(undefined);
  const questions = ref<CustomQuizQuestion[]>([]);
  const players = ref<CustomQuizPlayer[]>([]);
  const currentQuestionIndex = ref(0);
  const currentAnswers = ref<Record<string, CustomQuizPlayerAnswer>>({});
  const results = ref<CustomQuizQuestionResult[]>([]);
  const totalScores = ref<Record<string, number>>({});
  const openedAtMs = ref<number | undefined>(undefined);

  const currentQuestion = computed<CustomQuizQuestion | undefined>(() => {
    return questions.value[currentQuestionIndex.value];
  });

  const sortedScoreboard = computed(() => {
    return [...players.value]
      .map((player) => ({
        player,
        score: totalScores.value[player.id] ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  });

  const currentQuestionResult = computed<CustomQuizQuestionResult | undefined>(
    () => {
      const question = currentQuestion.value;
      if (!question) {
        return undefined;
      }

      return results.value.find((value) => value.questionId === question.id);
    },
  );

  const questionProgressLabel = computed(() => {
    if (questions.value.length === 0) {
      return '0 / 0';
    }

    return `${currentQuestionIndex.value + 1} / ${questions.value.length}`;
  });

  const isLastQuestion = computed(() => {
    return (
      questions.value.length > 0 &&
      currentQuestionIndex.value + 1 >= questions.value.length
    );
  });

  const allPlayersAnswered = computed(() => {
    return (
      phase.value === 'ANSWERS_OPEN' &&
      players.value.length > 0 &&
      Object.keys(currentAnswers.value).length >= players.value.length
    );
  });

  function reset() {
    phase.value = 'SETUP';
    previousPhase.value = undefined;
    players.value = [];
    currentQuestionIndex.value = 0;
    currentAnswers.value = {};
    results.value = [];
    totalScores.value = {};
    openedAtMs.value = undefined;
  }

  function setQuestions(nextQuestions: CustomQuizQuestion[]) {
    questions.value = nextQuestions;
  }

  function start(playersList: CustomQuizPlayer[]) {
    reset();
    players.value = playersList;

    totalScores.value = playersList.reduce(
      (acc, player) => {
        acc[player.id] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    phase.value = questions.value.length > 0 ? 'QUESTION' : 'FINAL_SCOREBOARD';
  }

  function openAnswers() {
    if (phase.value !== 'QUESTION') {
      return;
    }

    currentAnswers.value = {};
    openedAtMs.value = Date.now();
    phase.value = 'ANSWERS_OPEN';
  }

  function registerAnswer(playerId: string, answerId: QuizColorId) {
    if (phase.value !== 'ANSWERS_OPEN') {
      return;
    }

    if (!players.value.some((player) => player.id === playerId)) {
      return;
    }

    const question = currentQuestion.value;
    if (!question) {
      return;
    }

    if (!question.answers.some((answer) => answer.id === answerId)) {
      return;
    }

    if (currentAnswers.value[playerId] !== undefined) {
      return;
    }

    const base = openedAtMs.value ?? Date.now();
    currentAnswers.value[playerId] = {
      playerId,
      answerId,
      answeredAtMs: Date.now() - base,
    };

    if (Object.keys(currentAnswers.value).length >= players.value.length) {
      closeAnswersAndScore();
    }
  }

  function closeAnswersAndScore() {
    if (phase.value !== 'ANSWERS_OPEN') {
      return;
    }

    const question = currentQuestion.value;
    if (!question) {
      phase.value = 'FINAL_SCOREBOARD';
      return;
    }

    const answers = Object.values(currentAnswers.value);
    const correctAnswers = answers
      .filter((answer) => answer.answerId === question.correctAnswer)
      .sort((a, b) => a.answeredAtMs - b.answeredAtMs);

    const pointsByPlayer: Record<string, number> = {};
    correctAnswers.forEach((answer, index) => {
      const speedBonus = SPEED_BONUS[index] ?? 0;
      pointsByPlayer[answer.playerId] = CORRECT_POINTS + speedBonus;
    });

    players.value.forEach((player) => {
      const points = pointsByPlayer[player.id] ?? 0;
      totalScores.value[player.id] = (totalScores.value[player.id] ?? 0) + points;
    });

    const questionResult: CustomQuizQuestionResult = {
      questionId: question.id,
      answers,
      pointsByPlayer,
    };

    results.value = results.value.filter((value) => value.questionId !== question.id);
    results.value.push(questionResult);

    phase.value = 'CORRECTION';
  }

  function toQuestionPodium() {
    if (phase.value !== 'CORRECTION') {
      return;
    }

    phase.value = 'QUESTION_PODIUM';
  }

  function nextQuestionOrFinish() {
    if (phase.value !== 'QUESTION_PODIUM') {
      return;
    }

    if (currentQuestionIndex.value + 1 >= questions.value.length) {
      phase.value = 'FINAL_SCOREBOARD';
      return;
    }

    currentQuestionIndex.value += 1;
    currentAnswers.value = {};
    phase.value = 'QUESTION';
  }

  function pause() {
    if (
      phase.value !== 'QUESTION' &&
      phase.value !== 'ANSWERS_OPEN' &&
      phase.value !== 'CORRECTION' &&
      phase.value !== 'QUESTION_PODIUM'
    ) {
      return;
    }

    previousPhase.value = phase.value;
    phase.value = 'PAUSED';
  }

  function resume() {
    if (phase.value !== 'PAUSED') {
      return;
    }

    if (!previousPhase.value) {
      phase.value = 'QUESTION';
      return;
    }

    phase.value = previousPhase.value;
  }

  function stop() {
    reset();
  }

  return {
    phase,
    questions,
    players,
    currentQuestion,
    currentAnswers,
    currentQuestionResult,
    sortedScoreboard,
    questionProgressLabel,
    isLastQuestion,
    allPlayersAnswered,

    setQuestions,
    start,
    openAnswers,
    registerAnswer,
    closeAnswersAndScore,
    toQuestionPodium,
    nextQuestionOrFinish,
    pause,
    resume,
    stop,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCustomQuizStore, import.meta.hot));
}
