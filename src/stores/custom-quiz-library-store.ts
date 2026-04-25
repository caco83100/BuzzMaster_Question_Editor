import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import questionsJson from 'src/data/quiz/custom-questions.json';
import type {
  CustomQuizAnswer,
  CustomQuizDefinition,
  CustomQuizQuestion,
  QuizColorId,
} from 'src/types/customQuiz';
import { QUIZ_COLOR_ORDER } from 'src/types/customQuiz';

const STORAGE_KEY = 'buzzmaster.customQuizLibrary.v1';

type QuizLibraryStorage = {
  selectedQuizId?: string;
  quizzes: CustomQuizDefinition[];
};

const LEGACY_COLOR_MAP: Record<string, QuizColorId> = {
  A: 'BLUE',
  B: 'ORANGE',
  C: 'GREEN',
  D: 'YELLOW',
  E: 'RED',
};

function defaultQuestions(): CustomQuizQuestion[] {
  return (questionsJson as CustomQuizQuestion[]).map((question) =>
    sanitizeQuestion(question),
  );
}

function createDefaultQuiz(): CustomQuizDefinition {
  return {
    id: crypto.randomUUID(),
    name: 'Quiz par defaut',
    questions: defaultQuestions(),
    updatedAtMs: Date.now(),
  };
}

function normalizeColorId(value: unknown): QuizColorId | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.toUpperCase();
  if (normalized in LEGACY_COLOR_MAP) {
    return LEGACY_COLOR_MAP[normalized]!;
  }

  return QUIZ_COLOR_ORDER.find((color) => color === normalized as QuizColorId);
}

function clampAnswerCount(value: number): number {
  if (value < 2) {
    return 2;
  }
  if (value > 5) {
    return 5;
  }
  return value;
}

function buildAnswers(
  rawAnswers: Array<Partial<CustomQuizAnswer>>,
  answerCount: number,
): CustomQuizAnswer[] {
  const targetColors = QUIZ_COLOR_ORDER.slice(0, answerCount);

  const textByColor: Partial<Record<QuizColorId, string>> = {};
  rawAnswers.forEach((answer, index) => {
    const color = normalizeColorId(answer.id) ?? targetColors[index];
    if (!color) {
      return;
    }

    if (textByColor[color] !== undefined) {
      return;
    }

    textByColor[color] = typeof answer.text === 'string' ? answer.text : '';
  });

  return targetColors.map((color) => ({
    id: color,
    text: textByColor[color] ?? '',
  }));
}

function sanitizeQuestion(
  question: Partial<CustomQuizQuestion> | undefined,
): CustomQuizQuestion {
  const rawAnswers = Array.isArray(question?.answers) ? question.answers : [];
  const rawAnswerCount =
    typeof question?.answerCount === 'number'
      ? question.answerCount
      : rawAnswers.length || 4;
  const answerCount = clampAnswerCount(rawAnswerCount);
  const answers = buildAnswers(rawAnswers, answerCount);

  const correctAnswer = normalizeColorId(question?.correctAnswer) ?? answers[0]!.id;
  const correctedAnswer = answers.some((answer) => answer.id === correctAnswer)
    ? correctAnswer
    : answers[0]!.id;

  return {
    id: question?.id || crypto.randomUUID(),
    question: question?.question ?? '',
    answerCount,
    answers,
    correctAnswer: correctedAnswer,
  };
}

function sanitizeQuiz(quiz: Partial<CustomQuizDefinition>): CustomQuizDefinition {
  const rawQuestions = Array.isArray(quiz.questions) ? quiz.questions : [];
  return {
    id: quiz.id || crypto.randomUUID(),
    name: quiz.name?.trim() || 'Quiz sans nom',
    questions: rawQuestions.map((question) => sanitizeQuestion(question)),
    updatedAtMs: quiz.updatedAtMs ?? Date.now(),
  };
}

export const useCustomQuizLibraryStore = defineStore('custom-quiz-library', () => {
  const quizzes = ref<CustomQuizDefinition[]>([]);
  const selectedQuizId = ref<string>('');

  const selectedQuiz = computed<CustomQuizDefinition | undefined>(() => {
    return quizzes.value.find((quiz) => quiz.id === selectedQuizId.value);
  });

  const quizOptions = computed(() => {
    return quizzes.value.map((quiz) => ({
      label: quiz.name,
      value: quiz.id,
    }));
  });

  function load() {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    if (!raw) {
      const initialQuiz = createDefaultQuiz();
      quizzes.value = [initialQuiz];
      selectedQuizId.value = initialQuiz.id;
      persist();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<QuizLibraryStorage>;
      const parsedQuizzes = (
        Array.isArray(parsed.quizzes) ? parsed.quizzes : []
      ).map((quiz) => sanitizeQuiz(quiz));

      if (parsedQuizzes.length === 0) {
        const initialQuiz = createDefaultQuiz();
        quizzes.value = [initialQuiz];
        selectedQuizId.value = initialQuiz.id;
        persist();
        return;
      }

      quizzes.value = parsedQuizzes;

      const candidateId = parsed.selectedQuizId;
      const hasCandidate = candidateId
        ? parsedQuizzes.some((quiz) => quiz.id === candidateId)
        : false;

      selectedQuizId.value = hasCandidate
        ? (candidateId as string)
        : parsedQuizzes[0]!.id;
    } catch {
      const initialQuiz = createDefaultQuiz();
      quizzes.value = [initialQuiz];
      selectedQuizId.value = initialQuiz.id;
      persist();
    }
  }

  function persist() {
    const payload: QuizLibraryStorage = {
      selectedQuizId: selectedQuizId.value,
      quizzes: quizzes.value,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors to avoid breaking quiz usage.
    }
  }

  function selectQuiz(quizId: string) {
    selectedQuizId.value = quizId;
    persist();
  }

  function createQuiz() {
    const answers = QUIZ_COLOR_ORDER.slice(0, 4).map((id) => ({
      id,
      text: '',
    }));

    const quiz: CustomQuizDefinition = {
      id: crypto.randomUUID(),
      name: `Nouveau quiz ${quizzes.value.length + 1}`,
      questions: [
        {
          id: crypto.randomUUID(),
          question: '',
          answerCount: 4,
          answers,
          correctAnswer: answers[0]!.id,
        },
      ],
      updatedAtMs: Date.now(),
    };

    quizzes.value.push(quiz);
    selectedQuizId.value = quiz.id;
    persist();
  }

  function deleteSelectedQuiz() {
    if (!selectedQuiz.value) {
      return;
    }

    quizzes.value = quizzes.value.filter(
      (quiz) => quiz.id !== selectedQuiz.value?.id,
    );

    if (quizzes.value.length === 0) {
      const fallback = createDefaultQuiz();
      quizzes.value = [fallback];
      selectedQuizId.value = fallback.id;
    } else {
      selectedQuizId.value = quizzes.value[0]!.id;
    }

    persist();
  }

  function saveSelectedQuiz(updated: CustomQuizDefinition) {
    const sanitized = sanitizeQuiz({
      ...updated,
      id: updated.id || selectedQuizId.value || crypto.randomUUID(),
      updatedAtMs: Date.now(),
    });

    const index = quizzes.value.findIndex((quiz) => quiz.id === sanitized.id);
    if (index < 0) {
      quizzes.value.push(sanitized);
    } else {
      quizzes.value[index] = sanitized;
    }

    selectedQuizId.value = sanitized.id;
    persist();
  }

  return {
    quizzes,
    selectedQuizId,
    selectedQuiz,
    quizOptions,

    load,
    persist,
    selectQuiz,
    createQuiz,
    deleteSelectedQuiz,
    saveSelectedQuiz,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useCustomQuizLibraryStore, import.meta.hot),
  );
}
