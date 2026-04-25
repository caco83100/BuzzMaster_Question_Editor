<template>
  <q-page
    class="row justify-center custom-quiz-page"
    :class="{ 'custom-quiz-page--dark': isDark }"
    padding
  >
    <div class="col-12 col-xl-11 column q-gutter-md custom-shell">
      <div class="row items-center justify-between header-wrap">
        <div class="column">
          <div class="text-overline text-weight-bold header-kicker">BuzzMaster</div>
          <div class="text-h4 text-weight-bold">Custom Quiz</div>
        </div>
        <q-badge
          rounded
          color="primary"
          class="progress-badge"
          :label="`Question ${gameStore.questionProgressLabel}`"
        />
      </div>

      <q-separator />

      <div
        v-if="gameStore.phase !== 'SETUP' && gameStore.phase !== 'FINAL_SCOREBOARD'"
        class="row q-gutter-sm"
      >
        <q-btn
          v-if="gameStore.phase !== 'PAUSED'"
          outline
          rounded
          icon="pause"
          label="Pause"
          @click="gameStore.pause()"
        />
        <q-btn
          v-if="gameStore.phase === 'PAUSED'"
          color="primary"
          rounded
          icon="play_arrow"
          label="Resume"
          @click="gameStore.resume()"
        />
        <q-btn
          color="negative"
          outline
          rounded
          icon="stop"
          label="Stop quiz"
          @click="gameStore.stop()"
        />
      </div>

      <div
        v-if="gameStore.phase === 'SETUP'"
        class="row q-col-gutter-md"
      >
        <div class="col-12 col-lg-6">
          <q-card
            flat
            bordered
            class="fit panel-card"
          >
            <q-card-section class="row items-center q-gutter-sm">
              <div class="text-subtitle1 text-weight-bold">Quiz sauvegardes</div>
            </q-card-section>

            <q-separator />

            <q-card-section>
              <q-list separator>
                <q-item
                  v-for="quiz in libraryStore.quizzes"
                  :key="quiz.id"
                  class="quiz-list-item"
                  clickable
                  :active="quiz.id === libraryStore.selectedQuizId"
                  active-class="quiz-list-item-active"
                  @click="onQuizSelect(quiz.id)"
                >
                  <q-item-section>
                    <q-item-label>{{ quiz.name }}</q-item-label>
                    <q-item-label caption>
                      {{ quiz.questions.length }} question(s)
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      dense
                      round
                      flat
                      icon="play_arrow"
                      color="positive"
                      @click.stop="startQuizFromList(quiz.id)"
                    >
                      <q-tooltip>Start quiz</q-tooltip>
                    </q-btn>
                    <q-btn
                      dense
                      round
                      flat
                      icon="edit"
                      color="negative"
                      @click.stop="openEditorForQuiz(quiz.id)"
                    >
                      <q-tooltip>Edit quiz</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>

                <q-item
                  class="quiz-list-item quiz-list-item-add"
                  clickable
                  @click="createQuizFromList"
                >
                  <q-item-section avatar>
                    <q-icon
                      name="add_circle"
                      color="primary"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">Ajouter un quiz</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>

            <q-card-actions align="between">
              <q-btn
                outline
                rounded
                color="negative"
                icon="delete"
                label="Supprimer"
                :disable="!libraryStore.selectedQuiz"
                @click="libraryStore.deleteSelectedQuiz()"
              />
              <q-btn
                outline
                rounded
                icon="edit"
                label="Editer selection"
                :disable="!libraryStore.selectedQuiz"
                @click="openEditorForSelectedQuiz"
              />
            </q-card-actions>
          </q-card>
        </div>

        <div class="col-12 col-lg-6 column q-gutter-md">
          <q-card
            flat
            bordered
            class="panel-card"
          >
            <q-card-section>
              <div class="text-subtitle1 text-weight-bold q-mb-sm">Joueurs</div>
              <div class="text-body2 q-mb-sm">
                Controllers detectes: <b>{{ controllers.length }}</b>
              </div>
              <div class="text-body2 q-mb-sm">
                Mock players (si aucun controller): <b>{{ mockPlayerCount }}</b>
              </div>
              <q-slider
                v-model="mockPlayerCount"
                :min="1"
                :max="8"
                :step="1"
                snap
                label
              />

              <div class="text-body2 q-mt-md">
                Quiz selectionne:
                <b>{{ libraryStore.selectedQuiz?.name ?? 'Aucun' }}</b>
              </div>
              <div class="text-body2">
                Questions: <b>{{ editingQuiz.questions.length }}</b>
              </div>
            </q-card-section>

            <q-card-actions>
              <q-btn
                color="primary"
                rounded
                label="Start quiz"
                :disable="!canStartQuiz"
                @click="startQuiz"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <q-dialog
        v-model="showEditorDialog"
        maximized
      >
        <q-card class="column">
          <q-card-section class="row items-center">
            <div class="text-h6">Edition quiz</div>
            <q-space />
            <q-btn
              flat
              round
              icon="close"
              @click="showEditorDialog = false"
            />
          </q-card-section>
          <q-separator />

          <q-card-section class="col scroll column q-gutter-md">
            <q-input
              v-model="editingQuiz.name"
              label="Nom du quiz"
              outlined
              rounded
            />

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

                <q-select
                  :model-value="question.answerCount"
                  :options="answerCountOptions"
                  emit-value
                  map-options
                  outlined
                  rounded
                  label="Nombre de reponses"
                  @update:model-value="updateAnswerCount(question, $event)"
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
                      :label="`Reponse ${colorMeta[answer.id].label}`"
                    >
                      <template #prepend>
                        <q-icon
                          name="circle"
                          :color="colorMeta[answer.id].uiColor"
                        />
                      </template>
                    </q-input>
                  </div>
                </div>

                <q-select
                  v-model="question.correctAnswer"
                  :options="correctAnswerOptions(question)"
                  label="Bonne reponse"
                  outlined
                  rounded
                  emit-value
                  map-options
                />
              </q-item>
            </q-list>

            <div class="row q-gutter-sm">
              <q-btn
                outline
                rounded
                icon="add"
                label="Ajouter une question"
                @click="addQuestion"
              />
            </div>
          </q-card-section>

          <q-separator />
          <q-card-actions align="between">
            <q-btn
              outline
              rounded
              label="Fermer"
              @click="showEditorDialog = false"
            />
            <q-btn
              color="primary"
              rounded
              icon="save"
              label="Sauvegarder"
              :disable="!canSaveQuiz"
              @click="saveAndCloseEditor"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <div
        v-if="gameStore.phase === 'PAUSED'"
        class="column q-gutter-md"
      >
        <q-card
          flat
          bordered
          class="panel-card"
        >
          <q-card-section class="text-h6 text-weight-bold">Quiz en pause</q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              rounded
              icon="play_arrow"
              label="Resume"
              @click="gameStore.resume()"
            />
            <q-btn
              color="negative"
              outline
              rounded
              icon="stop"
              label="Stop quiz"
              @click="gameStore.stop()"
            />
          </q-card-actions>
        </q-card>
      </div>

      <div
        v-if="gameStore.phase === 'QUESTION' || gameStore.phase === 'ANSWERS_OPEN'"
        class="column q-gutter-md"
      >
        <q-card
          flat
          bordered
          class="panel-card question-card"
        >
          <q-card-section>
            <div class="text-overline">Question en cours</div>
            <div class="text-h5 text-weight-bold">
              {{ gameStore.currentQuestion?.question }}
            </div>
          </q-card-section>
        </q-card>

        <div class="answers-grid">
          <q-card
            v-for="answer in gameStore.currentQuestion?.answers ?? []"
            :key="answer.id"
            flat
            bordered
            class="answer-tile"
            :class="`answer-tile--${answer.id.toLowerCase()}`"
          >
            <q-card-section class="row items-center q-gutter-sm">
              <q-avatar
                size="md"
                :style="{
                  background: colorMeta[answer.id].hex,
                  color: answer.id === 'YELLOW' ? '#111827' : '#ffffff',
                }"
              >
                <q-icon name="circle" />
              </q-avatar>
              <div class="column">
                <div class="text-subtitle2 text-weight-bold">
                  {{ colorMeta[answer.id].label }}
                </div>
                <div class="text-body1">{{ answer.text }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <q-card
          flat
          bordered
          class="panel-card"
        >
          <q-card-section>
            <div class="text-subtitle2">Boutons buzzer utilises comme reponses</div>
            <div class="text-body2">
              Bleu, Orange, Vert, Jaune, Rouge selon les choix de la question.
            </div>
          </q-card-section>
        </q-card>

        <div class="row q-gutter-sm">
          <q-btn
            v-if="gameStore.phase === 'QUESTION'"
            color="primary"
            rounded
            label="Ouvrir les reponses"
            @click="gameStore.openAnswers()"
          />
          <q-btn
            v-if="gameStore.phase === 'ANSWERS_OPEN'"
            color="primary"
            rounded
            label="Forcer correction"
            @click="gameStore.closeAnswersAndScore()"
          />
        </div>

        <q-banner
          v-if="gameStore.phase === 'ANSWERS_OPEN'"
          rounded
          class="bg-primary text-white"
        >
          Avance automatique active: des que tous les joueurs ont repondu, on
          passe directement a la correction.
        </q-banner>

        <q-card
          v-if="gameStore.phase === 'ANSWERS_OPEN'"
          flat
          bordered
          class="panel-card"
        >
          <q-card-section>
            <div class="text-subtitle1 q-mb-sm">Entrees mock UI</div>
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
                  :color="colorMeta[answer.id].uiColor"
                  :label="colorMeta[answer.id].label"
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
          class="panel-card"
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
                <q-item-section side>
                  <q-badge
                    :color="colorMeta[item.answerId].uiColor"
                    :text-color="badgeTextColor(item.answerId)"
                    :label="colorMeta[item.answerId].label"
                  />
                </q-item-section>
                <q-item-section side>{{ item.answeredAtMs }} ms</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div
        v-if="gameStore.phase === 'CORRECTION'"
        class="column q-gutter-md"
      >
        <q-card
          flat
          bordered
          class="panel-card"
        >
          <q-card-section class="row items-center q-gutter-sm">
            <div class="text-h6 text-weight-bold">Correction</div>
            <q-badge
              v-if="gameStore.currentQuestion"
              :color="colorMeta[gameStore.currentQuestion.correctAnswer].uiColor"
              :text-color="badgeTextColor(gameStore.currentQuestion.correctAnswer)"
              class="text-weight-bold"
              :label="colorMeta[gameStore.currentQuestion.correctAnswer].label"
            />
          </q-card-section>
        </q-card>

        <q-list
          bordered
          separator
          class="panel-card"
        >
          <q-item
            v-for="row in correctionRows"
            :key="row.player.id"
          >
            <q-item-section>{{ row.player.name }}</q-item-section>
            <q-item-section side>
              <q-badge
                v-if="row.answerId"
                :color="colorMeta[row.answerId].uiColor"
                :text-color="badgeTextColor(row.answerId)"
                :label="colorMeta[row.answerId].label"
              />
              <q-badge
                v-else
                color="grey"
                label="-"
              />
            </q-item-section>
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
          label="Voir podium question"
          class="self-start"
          @click="gameStore.toQuestionPodium()"
        />
      </div>

      <div
        v-if="gameStore.phase === 'QUESTION_PODIUM'"
        class="column q-gutter-md"
      >
        <q-card
          flat
          bordered
          class="panel-card"
        >
          <q-card-section class="text-h6 text-weight-bold">
            Podium de la question
          </q-card-section>
        </q-card>

        <q-list
          bordered
          separator
          class="panel-card"
        >
          <q-item
            v-for="entry in questionPodium"
            :key="entry.player.id"
          >
            <q-item-section avatar>
              <q-avatar
                :color="podiumMeta(entry.position).color"
                text-color="white"
                size="sm"
              >
                <q-icon :name="podiumMeta(entry.position).icon" />
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
          :label="gameStore.isLastQuestion ? 'Finir le quiz' : 'Question suivante'"
          class="self-start"
          @click="gameStore.nextQuestionOrFinish()"
        />
      </div>

      <div
        v-if="gameStore.phase === 'FINAL_SCOREBOARD'"
        class="column q-gutter-md"
      >
        <q-card
          flat
          bordered
          class="panel-card"
        >
          <q-card-section class="text-h6 text-weight-bold">
            Score final
          </q-card-section>
        </q-card>

        <q-list
          bordered
          separator
          class="panel-card"
        >
          <q-item
            v-for="entry in finalScoreboard"
            :key="entry.player.id"
          >
            <q-item-section avatar>
              <q-avatar
                :color="podiumMeta(entry.position).color"
                text-color="white"
                size="sm"
              >
                <q-icon :name="podiumMeta(entry.position).icon" />
              </q-avatar>
            </q-item-section>
            <q-item-section>{{ entry.player.name }}</q-item-section>
            <q-item-section side>{{ entry.score }} pts</q-item-section>
          </q-item>
        </q-list>
        <q-btn
          color="primary"
          rounded
          label="Retour setup"
          class="self-start"
          @click="gameStore.stop()"
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
import type {
  CustomQuizDefinition,
  CustomQuizQuestion,
  QuizColorId,
} from 'src/types/customQuiz';
import { QUIZ_COLOR_ORDER } from 'src/types/customQuiz';

const quasar = useQuasar();
const gameStore = useCustomQuizStore();
const libraryStore = useCustomQuizLibraryStore();
const { controllers, buzzer } = useBuzzer();

const colorMeta: Record<
  QuizColorId,
  { label: string; uiColor: string; hex: string }
> = {
  BLUE: { label: 'Bleu', uiColor: 'blue', hex: '#1E6BFF' },
  ORANGE: { label: 'Orange', uiColor: 'orange', hex: '#FF7A00' },
  GREEN: { label: 'Vert', uiColor: 'green', hex: '#1DB954' },
  YELLOW: { label: 'Jaune', uiColor: 'yellow-8', hex: '#F4C20D' },
  RED: { label: 'Rouge', uiColor: 'red', hex: '#E53935' },
};

const answerCountOptions = [
  { label: '2 reponses', value: 2 },
  { label: '3 reponses', value: 3 },
  { label: '4 reponses', value: 4 },
  { label: '5 reponses', value: 5 },
];

const editingQuiz = ref<CustomQuizDefinition>({
  id: '',
  name: '',
  questions: [],
  updatedAtMs: Date.now(),
});
const showEditorDialog = ref(false);
const mockPlayerCount = ref(4);
const isDark = computed(() => quasar.dark.isActive);

const buttonToColor: Record<BuzzerButton, QuizColorId> = {
  [BuzzerButton.RED]: 'RED',
  [BuzzerButton.BLUE]: 'BLUE',
  [BuzzerButton.ORANGE]: 'ORANGE',
  [BuzzerButton.GREEN]: 'GREEN',
  [BuzzerButton.YELLOW]: 'YELLOW',
};

const canStartQuiz = computed(() => {
  return (
    editingQuiz.value.name.trim().length > 0 &&
    editingQuiz.value.questions.length > 0 &&
    editingQuiz.value.questions.every(
      (question) =>
        question.question.trim().length > 0 &&
        question.answers.length >= 2 &&
        question.answers.every((answer) => answer.text.trim().length > 0),
    )
  );
});

const canSaveQuiz = computed(() => {
  return (
    editingQuiz.value.name.trim().length > 0 &&
    editingQuiz.value.questions.length > 0
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
      player: playersById[answer.playerId] ?? {
        id: answer.playerId,
        name: answer.playerId,
      },
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
    {} as Record<string, { answerId: QuizColorId }>,
  );

  return gameStore.players.map((player) => {
    const playerAnswer = byPlayer[player.id];
    const answerId = playerAnswer?.answerId;
    const isCorrect = answerId === correct;
    return {
      player,
      answerId,
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
      total:
        gameStore.sortedScoreboard.find((entry) => entry.player.id === player.id)
          ?.score ?? 0,
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

function podiumMeta(position: number): { color: string; icon: string } {
  switch (position) {
    case 1:
      return { color: 'amber-8', icon: 'emoji_events' };
    case 2:
      return { color: 'blue-grey-5', icon: 'military_tech' };
    case 3:
      return { color: 'deep-orange-5', icon: 'workspace_premium' };
    default:
      return { color: 'primary', icon: 'looks' };
  }
}

function badgeTextColor(answerId: QuizColorId): string {
  return answerId === 'YELLOW' ? 'dark' : 'white';
}

function createQuiz() {
  libraryStore.createQuiz();
  syncEditingFromStore();
}

function createQuizFromList() {
  createQuiz();
  showEditorDialog.value = true;
}

function onQuizSelect(quizId: string) {
  libraryStore.selectQuiz(quizId);
  syncEditingFromStore();
}

function openEditorForQuiz(quizId: string) {
  onQuizSelect(quizId);
  showEditorDialog.value = true;
}

function openEditorForSelectedQuiz() {
  const selected = libraryStore.selectedQuiz;
  if (!selected) {
    return;
  }
  openEditorForQuiz(selected.id);
}

function addQuestion() {
  const answerCount = 4;
  const answers = QUIZ_COLOR_ORDER.slice(0, answerCount).map((color) => ({
    id: color,
    text: '',
  }));

  editingQuiz.value.questions.push({
    id: crypto.randomUUID(),
    question: '',
    answerCount,
    answers,
    correctAnswer: answers[0]!.id,
  });
}

function removeQuestion(index: number) {
  editingQuiz.value.questions.splice(index, 1);
}

function updateAnswerCount(question: CustomQuizQuestion, nextCountRaw: number) {
  const count = Math.max(2, Math.min(5, Number(nextCountRaw)));
  question.answerCount = count;

  const existing = question.answers.reduce(
    (acc, answer) => {
      acc[answer.id] = answer.text;
      return acc;
    },
    {} as Partial<Record<QuizColorId, string>>,
  );

  question.answers = QUIZ_COLOR_ORDER.slice(0, count).map((color) => ({
    id: color,
    text: existing[color] ?? '',
  }));

  if (!question.answers.some((answer) => answer.id === question.correctAnswer)) {
    question.correctAnswer = question.answers[0]!.id;
  }
}

function correctAnswerOptions(question: CustomQuizQuestion) {
  return question.answers.map((answer) => ({
    label: colorMeta[answer.id].label,
    value: answer.id,
  }));
}

function saveQuizLocally(): boolean {
  if (!canSaveQuiz.value) {
    quasar.notify({
      color: 'negative',
      message: 'Pour sauvegarder: nom du quiz + au moins une question.',
    });
    return false;
  }

  const payload = cloneQuizDefinition(editingQuiz.value);
  libraryStore.saveSelectedQuiz(payload);
  syncEditingFromStore();
  quasar.notify({
    color: 'positive',
    message: 'Quiz sauvegarde en local.',
  });
  return true;
}

function saveAndCloseEditor() {
  const saved = saveQuizLocally();
  if (!saved) {
    return;
  }
  showEditorDialog.value = false;
}

function startQuiz() {
  if (!canStartQuiz.value) {
    quasar.notify({
      color: 'negative',
      message:
        'Quiz invalide pour demarrer: complete tous les textes de questions/reponses.',
    });
    return;
  }

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

function startQuizFromList(quizId: string) {
  onQuizSelect(quizId);
  startQuiz();
}

function onBuzzerPress(event: ButtonEvent) {
  const answerId = buttonToColor[event.button];
  gameStore.registerAnswer(event.controller.id, answerId);
}

function alreadyAnswered(playerId: string): boolean {
  return gameStore.currentAnswers[playerId] !== undefined;
}

function syncEditingFromStore() {
  const quiz = libraryStore.selectedQuiz;
  editingQuiz.value = cloneQuizDefinition(quiz);
}

function cloneQuestions(questions: unknown): CustomQuizQuestion[] {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  return safeQuestions.map((question, index) => {
    const q = (question ?? {}) as Record<string, unknown>;
    const rawCount = Number(q.answerCount ?? 4);
    const answerCount = Math.max(2, Math.min(5, rawCount));
    const rawAnswers = Array.isArray(q.answers) ? q.answers : [];
    const answers = QUIZ_COLOR_ORDER.slice(0, answerCount).map(
      (color, answerIndex) => {
        const fromRaw = rawAnswers.find((value) => {
          const item = (value ?? {}) as Record<string, unknown>;
          return item.id === color;
        });
        const fallback = rawAnswers[answerIndex] as
          | Record<string, unknown>
          | undefined;
        const text =
          typeof (fromRaw as Record<string, unknown> | undefined)?.text ===
          'string'
            ? (fromRaw as Record<string, unknown>).text
            : typeof fallback?.text === 'string'
              ? fallback.text
              : '';
        return {
          id: color,
          text,
        };
      },
    );

    const requestedCorrect = q.correctAnswer as QuizColorId | undefined;
    const correctAnswer = answers.some((answer) => answer.id === requestedCorrect)
      ? (requestedCorrect as QuizColorId)
      : answers[0]!.id;

    return {
      id:
        typeof q.id === 'string' && q.id.length > 0 ? q.id : `q-${index + 1}`,
      question: typeof q.question === 'string' ? q.question : '',
      answerCount,
      answers,
      correctAnswer,
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

<style scoped>
.custom-shell {
  max-width: 1500px;
  color: #0f172a;
}

.header-wrap {
  padding: 0.25rem 0;
}

.header-kicker {
  letter-spacing: 0.12em;
}

.progress-badge {
  font-size: 0.95rem;
  padding: 0.5rem 0.85rem;
}

.panel-card {
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 255, 0.92));
  color: #0f172a;
  box-shadow: 0 6px 22px rgba(17, 24, 39, 0.08);
}

.panel-card :deep(.q-item__label),
.panel-card :deep(.q-field__label),
.panel-card :deep(.q-field__native),
.panel-card :deep(.q-field__input),
.panel-card :deep(.q-placeholder) {
  color: #0f172a;
}

.custom-quiz-page--dark .custom-shell {
  color: #e5e7eb;
}

.custom-quiz-page--dark .panel-card {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(17, 24, 39, 0.92));
  color: #e5e7eb;
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.45);
}

.custom-quiz-page--dark .panel-card :deep(.q-item__label),
.custom-quiz-page--dark .panel-card :deep(.q-field__label),
.custom-quiz-page--dark .panel-card :deep(.q-field__native),
.custom-quiz-page--dark .panel-card :deep(.q-field__input),
.custom-quiz-page--dark .panel-card :deep(.q-placeholder) {
  color: #e5e7eb;
}

.custom-quiz-page--dark .quiz-list-item:hover {
  background: rgba(59, 130, 246, 0.2);
}

.quiz-list-item {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.quiz-list-item:hover {
  background: rgba(30, 107, 255, 0.08);
}

.quiz-list-item-active {
  background: linear-gradient(90deg, rgba(30, 107, 255, 0.9), rgba(30, 107, 255, 0.75));
  color: #fff;
}

.quiz-list-item-add {
  border: 1px dashed rgba(30, 107, 255, 0.4);
}

.question-card {
  border-left: 6px solid #1e6bff;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.85rem;
}

.answer-tile {
  border-radius: 14px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.answer-tile:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.answer-tile--blue {
  border-left: 6px solid #1e6bff;
}

.answer-tile--orange {
  border-left: 6px solid #ff7a00;
}

.answer-tile--green {
  border-left: 6px solid #1db954;
}

.answer-tile--yellow {
  border-left: 6px solid #f4c20d;
}

.answer-tile--red {
  border-left: 6px solid #e53935;
}
</style>
