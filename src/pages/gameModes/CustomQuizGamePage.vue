<template>
  <q-page
    class="row justify-center"
    padding
  >
    <div class="col-12 col-md-11 col-lg-9 column q-gutter-md">
      <div class="row items-center justify-between">
        <div class="text-h5">Custom Quiz MVP</div>
        <div class="text-subtitle2">Question {{ gameStore.questionProgressLabel }}</div>
      </div>

      <q-separator />

      <div
        v-if="gameStore.phase === 'SETUP'"
        class="column q-gutter-md"
      >
        <q-card
          flat
          bordered
        >
          <q-card-section class="row items-center q-gutter-sm">
            <div class="text-subtitle1">Quiz local</div>
            <q-space />
            <q-btn
              outline
              rounded
              icon="add"
              label="Nouveau quiz"
              @click="libraryStore.createQuiz()"
            />
            <q-btn
              outline
              rounded
              color="negative"
              icon="delete"
              label="Supprimer quiz"
              :disable="!libraryStore.selectedQuiz"
              @click="libraryStore.deleteSelectedQuiz()"
            />
          </q-card-section>

          <q-card-section class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-select
                :model-value="libraryStore.selectedQuizId"
                :options="libraryStore.quizOptions"
                label="Quiz"
                emit-value
                map-options
                outlined
                rounded
                @update:model-value="onQuizSelect"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="editingQuiz.name"
                label="Nom du quiz"
                outlined
                rounded
              />
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Questions</div>
            <q-list
              bordered
              separator
            >
              <q-item
                v-for="(question, index) in editingQuiz.questions"
                :key="question.id"
                class="column q-gutter-sm"
              >
                <div class="row items-center">
                  <div class="text-body1">Question {{ index + 1 }}</div>
                  <q-space />
                  <q-btn
                    size="sm"
                    color="negative"
                    flat
                    round
                    icon="delete"
                    @click="removeQuestion(index)"
                  />
                </div>

                <q-input
                  v-model="question.question"
                  type="textarea"
                  outlined
                  rounded
                  label="Texte de la question"
                  autogrow
                />

                <div class="row q-col-gutter-sm">
                  <div
                    v-for="answer in question.answers"
                    :key="`${question.id}-${answer.id}`"
                    class="col-12 col-md-6"
                  >
                    <q-input
                      v-model="answer.text"
                      outlined
                      rounded
                      :label="`Reponse ${answer.id}`"
                    />
                  </div>
                </div>

                <q-select
                  v-model="question.correctAnswer"
                  :options="answerOptions"
                  label="Bonne reponse"
                  outlined
                  rounded
                  emit-value
                  map-options
                />
              </q-item>
            </q-list>

            <div class="row q-gutter-sm q-mt-md">
              <q-btn
                outline
                rounded
                icon="add"
                label="Ajouter une question"
                @click="addQuestion"
              />
              <q-btn
                color="primary"
                rounded
                icon="save"
                label="Sauvegarder en local"
                @click="saveQuizLocally"
              />
            </div>
          </q-card-section>
        </q-card>

        <q-card
          flat
          bordered
        >
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Joueurs</div>
            <div class="text-body2 q-mb-sm">
              Players detected: <b>{{ controllers.length }}</b>
            </div>
            <div class="text-body2 q-mb-sm">
              Mock players (if no controllers): <b>{{ mockPlayerCount }}</b>
            </div>
            <q-slider
              v-model="mockPlayerCount"
              :min="1"
              :max="8"
              :step="1"
              label
              snap
            />
            <q-list
              bordered
              separator
            >
              <q-item
                v-for="controller in controllers"
                :key="controller.id"
              >
                <q-item-section>{{ controller.name }}</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            rounded
            label="Start quiz"
            :disable="!canStartQuiz"
            @click="startQuiz"
          />
        </div>
      </div>

      <div
        v-else-if="gameStore.phase === 'QUESTION' || gameStore.phase === 'ANSWERS_OPEN'"
        class="column q-gutter-md"
      >
        <div class="text-h6">{{ gameStore.currentQuestion?.question }}</div>
        <q-list
          bordered
          separator
        >
          <q-item
            v-for="answer in gameStore.currentQuestion?.answers ?? []"
            :key="answer.id"
          >
            <q-item-section avatar>
              <q-badge
                color="primary"
                :label="answer.id"
              />
            </q-item-section>
            <q-item-section>{{ answer.text }}</q-item-section>
          </q-item>
        </q-list>

        <q-card
          flat
          bordered
        >
          <q-card-section>
            <div class="text-subtitle2">Mapping boutons buzzer</div>
            <div class="text-body2">Bleu = A, Orange = B, Vert = C, Jaune = D</div>
          </q-card-section>
        </q-card>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="gameStore.phase === 'QUESTION'"
            color="primary"
            rounded
            label="Open answers"
            @click="gameStore.openAnswers()"
          />
          <q-btn
            v-if="gameStore.phase === 'ANSWERS_OPEN'"
            color="primary"
            rounded
            label="Close answers and show correction"
            @click="gameStore.closeAnswersAndScore()"
          />
        </div>

        <q-card
          v-if="gameStore.phase === 'ANSWERS_OPEN'"
          flat
          bordered
        >
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Mock UI inputs (sans buzzers physiques)</div>
            <div class="column q-gutter-sm">
              <div
                v-for="player in gameStore.players"
                :key="player.id"
                class="row items-center q-gutter-sm"
              >
                <div style="min-width: 180px">{{ player.name }}</div>
                <q-btn
                  v-for="answer in gameStore.currentQuestion?.answers ?? []"
                  :key="`${player.id}-${answer.id}`"
                  size="sm"
                  outline
                  rounded
                  :disable="alreadyAnswered(player.id)"
                  :label="answer.id"
                  @click="gameStore.registerAnswer(player.id, answer.id)"
                />
                <q-badge
                  v-if="alreadyAnswered(player.id)"
                  color="positive"
                  label="Answered"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card
          v-if="gameStore.phase === 'ANSWERS_OPEN'"
          flat
          bordered
        >
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Live answers</div>
            <q-list
              dense
              separator
            >
              <q-item
                v-for="item in answersSorted"
                :key="item.player.id"
              >
                <q-item-section>{{ item.player.name }}</q-item-section>
                <q-item-section side>{{ item.answerId }}</q-item-section>
                <q-item-section side>{{ item.answeredAtMs }} ms</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div
        v-else-if="gameStore.phase === 'CORRECTION'"
        class="column q-gutter-md"
      >
        <div class="text-h6">
          Correction: <b>{{ gameStore.currentQuestion?.correctAnswer }}</b>
        </div>
        <q-list
          bordered
          separator
        >
          <q-item
            v-for="row in correctionRows"
            :key="row.player.id"
          >
            <q-item-section>{{ row.player.name }}</q-item-section>
            <q-item-section side>{{ row.answerLabel }}</q-item-section>
            <q-item-section side>
              <q-badge
                :color="row.isCorrect ? 'positive' : 'negative'"
                :label="row.isCorrect ? 'Correct' : 'Wrong'"
              />
            </q-item-section>
            <q-item-section side>{{ row.points }} pts</q-item-section>
          </q-item>
        </q-list>
        <q-btn
          color="primary"
          rounded
          label="Show question podium"
          class="self-start"
          @click="gameStore.toQuestionPodium()"
        />
      </div>

      <div
        v-else-if="gameStore.phase === 'QUESTION_PODIUM'"
        class="column q-gutter-md"
      >
        <div class="text-h6">Question podium</div>
        <q-list
          bordered
          separator
        >
          <q-item
            v-for="entry in questionPodium"
            :key="entry.player.id"
          >
            <q-item-section avatar>
              <q-avatar
                color="primary"
                text-color="white"
                size="sm"
              >
                {{ entry.position }}
              </q-avatar>
            </q-item-section>
            <q-item-section>{{ entry.player.name }}</q-item-section>
            <q-item-section side>+{{ entry.points }} pts</q-item-section>
            <q-item-section side>Total: {{ entry.total }} pts</q-item-section>
          </q-item>
        </q-list>
        <q-btn
          color="primary"
          rounded
          :label="gameStore.isLastQuestion ? 'Finish quiz' : 'Next question'"
          class="self-start"
          @click="gameStore.nextQuestionOrFinish()"
        />
      </div>

      <div
        v-else-if="gameStore.phase === 'FINAL_SCOREBOARD'"
        class="column q-gutter-md"
      >
        <div class="text-h6">Final scoreboard</div>
        <q-list
          bordered
          separator
        >
          <q-item
            v-for="entry in finalScoreboard"
            :key="entry.player.id"
          >
            <q-item-section avatar>
              <q-avatar
                color="primary"
                text-color="white"
                size="sm"
              >
                {{ entry.position }}
              </q-avatar>
            </q-item-section>
            <q-item-section>{{ entry.player.name }}</q-item-section>
            <q-item-section side>{{ entry.score }} pts</q-item-section>
          </q-item>
        </q-list>
        <q-btn
          color="primary"
          rounded
          label="Restart quiz"
          class="self-start"
          @click="gameStore.reset()"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onBeforeMount, onUnmounted, ref, watch } from 'vue';
import { useCustomQuizStore } from 'stores/custom-quiz-store';
import { useCustomQuizLibraryStore } from 'stores/custom-quiz-library-store';
import { useBuzzer } from 'src/plugins/buzzer';
import { BuzzerButton, type ButtonEvent } from 'src/plugins/buzzer/types';
import type { CustomQuizDefinition } from 'src/types/customQuiz';

const quasar = useQuasar();
const gameStore = useCustomQuizStore();
const libraryStore = useCustomQuizLibraryStore();
const { controllers, buzzer } = useBuzzer();

const answerOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
];

const editingQuiz = ref<CustomQuizDefinition>({
  id: '',
  name: '',
  questions: [],
  updatedAtMs: Date.now(),
});
const mockPlayerCount = ref(4);

const answerMap: Record<BuzzerButton, string | undefined> = {
  [BuzzerButton.RED]: undefined,
  [BuzzerButton.BLUE]: 'A',
  [BuzzerButton.ORANGE]: 'B',
  [BuzzerButton.GREEN]: 'C',
  [BuzzerButton.YELLOW]: 'D',
};

const canStartQuiz = computed(() => {
  return (
    editingQuiz.value.name.trim().length > 0 &&
    editingQuiz.value.questions.length > 0 &&
    editingQuiz.value.questions.every(
      (question) =>
        question.question.trim().length > 0 &&
        question.answers.every((answer) => answer.text.trim().length > 0),
    )
  );
});

const answersSorted = computed(() => {
  const playersById = gameStore.players.reduce(
    (acc, player) => {
      acc[player.id] = player;
      return acc;
    },
    {} as Record<string, { id: string; name: string }>,
  );

  return Object.values(gameStore.currentAnswers)
    .sort((a, b) => a.answeredAtMs - b.answeredAtMs)
    .map((answer) => ({
      player: playersById[answer.playerId] ?? { id: answer.playerId, name: answer.playerId },
      answerId: answer.answerId,
      answeredAtMs: answer.answeredAtMs,
    }));
});

const correctionRows = computed(() => {
  const correct = gameStore.currentQuestion?.correctAnswer;
  const pointsByPlayer = gameStore.currentQuestionResult?.pointsByPlayer ?? {};
  const answers = gameStore.currentQuestionResult?.answers ?? [];
  const byPlayer = answers.reduce(
    (acc, answer) => {
      acc[answer.playerId] = answer;
      return acc;
    },
    {} as Record<string, { answerId: string }>,
  );

  return gameStore.players.map((player) => {
    const playerAnswer = byPlayer[player.id];
    const answerLabel = playerAnswer?.answerId ?? '-';
    const isCorrect = playerAnswer?.answerId === correct;
    return {
      player,
      answerLabel,
      isCorrect,
      points: pointsByPlayer[player.id] ?? 0,
    };
  });
});

const questionPodium = computed(() => {
  const pointsByPlayer = gameStore.currentQuestionResult?.pointsByPlayer ?? {};

  return gameStore.players
    .map((player) => ({
      player,
      points: pointsByPlayer[player.id] ?? 0,
      total: gameStore.sortedScoreboard.find((entry) => entry.player.id === player.id)?.score ?? 0,
    }))
    .sort((a, b) => b.points - a.points || b.total - a.total)
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));
});

const finalScoreboard = computed(() => {
  return gameStore.sortedScoreboard.map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
});

watch(
  () => libraryStore.selectedQuiz,
  () => {
    syncEditingFromStore();
  },
  { immediate: true },
);

onBeforeMount(() => {
  libraryStore.load();
  syncEditingFromStore();
  buzzer.on('press', onBuzzerPress);
});

onUnmounted(() => {
  buzzer.removeListener('press', onBuzzerPress);
});

function addQuestion() {
  editingQuiz.value.questions.push({
    id: crypto.randomUUID(),
    question: '',
    answers: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ],
    correctAnswer: 'A',
  });
}

function removeQuestion(index: number) {
  editingQuiz.value.questions.splice(index, 1);
}

function onQuizSelect(quizId: string) {
  if (!quizId) {
    return;
  }

  libraryStore.selectQuiz(quizId);
  syncEditingFromStore();
}

function saveQuizLocally(): boolean {
  if (editingQuiz.value.name.trim().length === 0) {
    quasar.notify({
      color: 'negative',
      message: 'Le quiz doit avoir un nom.',
    });
    return false;
  }

  if (editingQuiz.value.questions.length === 0) {
    quasar.notify({
      color: 'negative',
      message: 'Ajoute au moins une question.',
    });
    return false;
  }

  libraryStore.saveSelectedQuiz(editingQuiz.value);
  syncEditingFromStore();
  quasar.notify({
    color: 'positive',
    message: 'Quiz sauvegarde en local.',
  });
  return true;
}

function startQuiz() {
  const saved = saveQuizLocally();
  if (!saved) {
    return;
  }
  gameStore.setQuestions(cloneQuestions(editingQuiz.value.questions));

  const players =
    controllers.value.length > 0
      ? controllers.value.map((controller) => ({
          id: controller.id,
          name: controller.name,
        }))
      : Array.from({ length: mockPlayerCount.value }, (_, index) => ({
          id: `mock-player-${index + 1}`,
          name: `Mock Player ${index + 1}`,
        }));

  gameStore.start(players);
}

function onBuzzerPress(event: ButtonEvent) {
  const answerId = answerMap[event.button];
  if (answerId === undefined) {
    return;
  }

  gameStore.registerAnswer(event.controller.id, answerId);
}

function alreadyAnswered(playerId: string): boolean {
  return gameStore.currentAnswers[playerId] !== undefined;
}

function syncEditingFromStore() {
  const quiz = libraryStore.selectedQuiz;
  editingQuiz.value = cloneQuizDefinition(quiz);
}

function cloneQuestions(questions: unknown) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  return safeQuestions.map((question, index) => {
    const q = (question ?? {}) as Record<string, unknown>;
    const rawAnswers = Array.isArray(q.answers) ? q.answers : [];
    const answers = rawAnswers.slice(0, 4).map((answer, answerIndex) => {
      const a = (answer ?? {}) as Record<string, unknown>;
      const fallbackId = String.fromCharCode('A'.charCodeAt(0) + answerIndex);
      return {
        id: typeof a.id === 'string' && a.id.length > 0 ? a.id : fallbackId,
        text: typeof a.text === 'string' ? a.text : '',
      };
    });

    while (answers.length < 4) {
      const nextId = String.fromCharCode('A'.charCodeAt(0) + answers.length);
      answers.push({
        id: nextId,
        text: '',
      });
    }

    return {
      id: typeof q.id === 'string' && q.id.length > 0 ? q.id : `q-${index + 1}`,
      question: typeof q.question === 'string' ? q.question : '',
      answers,
      correctAnswer:
        typeof q.correctAnswer === 'string' && q.correctAnswer.length > 0
          ? q.correctAnswer
          : 'A',
    };
  });
}

function cloneQuizDefinition(quiz: unknown): CustomQuizDefinition {
  const source = (quiz ?? {}) as Record<string, unknown>;
  return {
    id:
      typeof source.id === 'string' && source.id.length > 0
        ? source.id
        : crypto.randomUUID(),
    name: typeof source.name === 'string' ? source.name : '',
    questions: cloneQuestions(source.questions),
    updatedAtMs:
      typeof source.updatedAtMs === 'number' ? source.updatedAtMs : Date.now(),
  };
}
</script>
