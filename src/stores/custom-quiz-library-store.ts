import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';
import questionsJson from 'src/data/quiz/custom-questions.json';
import type { CustomQuizDefinition, CustomQuizQuestion } from 'src/types/customQuiz';

const STORAGE_KEY = 'buzzmaster.customQuizLibrary.v1';

type QuizLibraryStorage = {
  selectedQuizId?: string;
  quizzes: CustomQuizDefinition[];
};

function defaultQuestions(): CustomQuizQuestion[] {
  return structuredClone(questionsJson as CustomQuizQuestion[]);
}

function createDefaultQuiz(): CustomQuizDefinition {
  return {
    id: crypto.randomUUID(),
    name: 'Quiz par defaut',
    questions: defaultQuestions(),
    updatedAtMs: Date.now(),
  };
}

function sanitizeQuestion(
  question: Partial<CustomQuizQuestion> | undefined,
): CustomQuizQuestion {
  const sourceAnswers = Array.isArray(question?.answers) ? question.answers : [];
  const answers = sourceAnswers.slice(0, 4);
  while (answers.length < 4) {
    const id = String.fromCharCode('A'.charCodeAt(0) + answers.length);
    answers.push({
      id,
      text: '',
    });
  }

  return {
    id: question?.id || crypto.randomUUID(),
    question: question?.question ?? '',
    answers: answers.map((answer, index) => ({
      id:
        (typeof answer.id === 'string' && answer.id.length > 0
          ? answer.id
          : undefined) || String.fromCharCode('A'.charCodeAt(0) + index),
      text: typeof answer.text === 'string' ? answer.text : '',
    })),
    correctAnswer:
      typeof question?.correctAnswer === 'string' ? question.correctAnswer : 'A',
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
      const parsedQuizzes = (Array.isArray(parsed.quizzes) ? parsed.quizzes : []).map((quiz) =>
        sanitizeQuiz(quiz),
      );

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

      selectedQuizId.value = hasCandidate ? (candidateId as string) : parsedQuizzes[0]!.id;
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
    const quiz: CustomQuizDefinition = {
      id: crypto.randomUUID(),
      name: `Nouveau quiz ${quizzes.value.length + 1}`,
      questions: [
        {
          id: crypto.randomUUID(),
          question: '',
          answers: [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
          ],
          correctAnswer: 'A',
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

    quizzes.value = quizzes.value.filter((quiz) => quiz.id !== selectedQuiz.value?.id);

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
  import.meta.hot.accept(acceptHMRUpdate(useCustomQuizLibraryStore, import.meta.hot));
}
