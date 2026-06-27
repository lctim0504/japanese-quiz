"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  CATEGORY_MENU_GROUPS,
  JLPT_MENU_SETS,
  QUIZ_SETS,
} from "@/data/quizSets/index";
import {
  getStoredHighScore,
  saveHighScore,
  subscribeToHighScoreChanges,
} from "@/lib/highScore";
import { createQuestion, getQuizSet, shuffle } from "@/lib/quiz";
import type { GameStatus, QuizItem, QuizSet, Question } from "@/types/quiz";

const GAME_SECONDS = 30;
const POINTS_PER_CORRECT_ANSWER = 10;
const POINTS_PER_WRONG_ANSWER = 10;
const BASIC_ACTION_RANGE_OPTIONS = [
  { id: "verbs-basic-actions", label: "讀音練習" },
  { id: "verbs-basic-actions-collocations", label: "名詞搭配" },
  { id: "verbs-common-phrase-collocations", label: "延伸用法" },
];

type WrongAnswer = {
  id: string;
  reading: string;
  selectedKana: string;
  correctKana: string;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function getLearningTip(quizSet: QuizSet) {
  if (quizSet.group === "jlpt") {
    return `${quizSet.label} 包含 40 個常考詞，建議先掃過複習表再開始挑戰。`;
  }

  return `${quizSet.label} 適合練習日常讀法與特殊音變，可以切換分類反覆熟悉。`;
}

function getAnswerLabel(item: QuizItem) {
  return item.optionLabel ?? item.kana;
}

function getReviewPrimaryLabel(item: QuizItem, quizSet: QuizSet) {
  if (quizSet.quizType === "phraseCollocation") {
    return item.optionLabel ?? item.kana;
  }

  return item.reading;
}

function getReviewSecondaryLabel(item: QuizItem, quizSet: QuizSet) {
  if (quizSet.quizType === "phraseCollocation") {
    const meaning = item.reviewLabel ?? item.reading;

    return `${item.kana}（${meaning}）`;
  }

  return item.reviewLabel ?? getAnswerLabel(item);
}

function getDefaultFeedback(quizSet: QuizSet) {
  if (quizSet.categoryGroup === "counter") {
    return "請選出適合這個名詞的助數詞。";
  }

  if (quizSet.quizType === "verbCollocation") {
    return "請選出最適合搭配這個名詞的動詞。";
  }

  if (quizSet.quizType === "phraseCollocation") {
    return "請選出對應這個中文意思的日文說法。";
  }

  return "請選出正確的日文讀音。";
}

export function QuizGame() {
  const [selectedQuizSetId, setSelectedQuizSetId] = useState(QUIZ_SETS[0].id);
  const selectedQuizSet = getQuizSet(QUIZ_SETS, selectedQuizSetId);
  const reviewItems = selectedQuizSet.reviewItems ?? selectedQuizSet.items;
  const [question, setQuestion] = useState<Question>(() =>
    createQuestion(QUIZ_SETS[0].items),
  );
  const questionQueueRef = useRef<QuizItem[]>(shuffle(QUIZ_SETS[0].items));
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const highScore = useSyncExternalStore(
    subscribeToHighScoreChanges,
    () => getStoredHighScore(selectedQuizSetId),
    () => 0,
  );
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");
  const [feedback, setFeedback] = useState(() =>
    getDefaultFeedback(QUIZ_SETS[0]),
  );

  const isPlaying = gameStatus === "playing";
  const isGameOver = gameStatus === "ended";
  const canSwitchBasicActionRange = BASIC_ACTION_RANGE_OPTIONS.some(
    (option) => option.id === selectedQuizSetId,
  );
  const progress = useMemo(
    () => (timeLeft / GAME_SECONDS) * 100,
    [timeLeft],
  );

  function createNextQuestion(items: QuizItem[]) {
    if (questionQueueRef.current.length === 0) {
      questionQueueRef.current = shuffle(items);
    }

    const [nextPrompt, ...remainingItems] = questionQueueRef.current;
    questionQueueRef.current = remainingItems;

    return createQuestion(items, nextPrompt);
  }

  function resetQuestionQueue(items: QuizItem[]) {
    questionQueueRef.current = shuffle(items);
    return createNextQuestion(items);
  }

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          setGameStatus("ended");
          setFeedback("時間到！看看這次有沒有刷新最高分。");
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  function answerQuestion(option: QuizItem) {
    if (!isPlaying) {
      return;
    }

    if (option.id === question.prompt.id) {
      const nextScore = scoreRef.current + POINTS_PER_CORRECT_ANSWER;
      scoreRef.current = nextScore;
      setScore(nextScore);
      saveHighScore(nextScore, selectedQuizSetId);
      setCorrectCount((currentCount) => currentCount + 1);
      setFeedback(
        `答對了！${question.prompt.reading} 是 ${getAnswerLabel(option)}。`,
      );
    } else {
      const nextScore = scoreRef.current - POINTS_PER_WRONG_ANSWER;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setWrongCount((currentCount) => currentCount + 1);
      setWrongAnswers((currentWrongAnswers) => [
        ...currentWrongAnswers,
        {
          id: `${question.prompt.id}-${currentWrongAnswers.length}`,
          reading: question.prompt.reading,
          selectedKana: getAnswerLabel(option),
          correctKana: getAnswerLabel(question.prompt),
        },
      ]);
      setFeedback(
        `答錯了，扣 ${POINTS_PER_WRONG_ANSWER} 分。${question.prompt.reading} 的正確答案是 ${getAnswerLabel(question.prompt)}。`,
      );
    }

    setQuestion(createNextQuestion(selectedQuizSet.items));
  }

  function startGame() {
    setQuestion(resetQuestionQueue(selectedQuizSet.items));
    scoreRef.current = 0;
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongAnswers([]);
    setTimeLeft(GAME_SECONDS);
    setGameStatus("playing");
    setFeedback(getDefaultFeedback(selectedQuizSet));
  }

  function returnHome() {
    setQuestion(resetQuestionQueue(selectedQuizSet.items));
    scoreRef.current = 0;
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongAnswers([]);
    setTimeLeft(GAME_SECONDS);
    setGameStatus("ready");
    setFeedback(getDefaultFeedback(selectedQuizSet));
  }

  function changeQuizSet(quizSetId: string) {
    const nextQuizSet = getQuizSet(QUIZ_SETS, quizSetId);

    setSelectedQuizSetId(quizSetId);
    setQuestion(resetQuestionQueue(nextQuizSet.items));
    setFeedback(getDefaultFeedback(nextQuizSet));
  }

  function speakJapanese(text: string) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-screen bg-[#f6efe7] px-6 py-8 text-stone-950 sm:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col justify-center">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-rose-500">
            Japanese Reading Quiz
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            日文讀音快問快答
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            30 秒內無限答題。看到日文漢字後，從 A、B、C、D 選出正確讀音；
            答對一題加 10 分。
          </p>
        </div>

        {gameStatus === "ready" ? (
          <div className="grid items-start gap-6 rounded-4xl border border-stone-200 bg-white/90 p-5 shadow-2xl shadow-stone-300/40 backdrop-blur sm:p-6 lg:grid-cols-[18rem_1fr]">
            <aside className="flex h-full flex-col rounded-3xl bg-stone-950 p-4 text-white sm:p-5 lg:sticky lg:top-6 lg:min-h-[calc(100vh-12rem)]">
              <p className="px-3 text-sm font-bold text-rose-300">
                題目範圍 Menu
              </p>

              <details className="mt-4 rounded-2xl bg-white/5 p-3" open>
                <summary className="cursor-pointer text-sm font-black text-stone-200">
                  單字分類
                </summary>
                <div className="mt-3 grid gap-2">
                  {CATEGORY_MENU_GROUPS.map((categoryGroup) => (
                    <details
                      key={categoryGroup.id}
                      className="rounded-2xl bg-white/5 p-2"
                    >
                      <summary className="cursor-pointer px-1 text-sm font-black text-stone-200">
                        {categoryGroup.label}
                      </summary>
                      <div className="mt-2 grid gap-2">
                        {categoryGroup.quizSets.map((quizSet) => (
                          <button
                            key={quizSet.id}
                            type="button"
                            onClick={() => changeQuizSet(quizSet.id)}
                            className={`rounded-2xl px-3 py-2 text-left text-sm font-bold transition ${
                              selectedQuizSetId === quizSet.id
                                ? "bg-amber-200 text-stone-950"
                                : "bg-white/5 text-stone-200 hover:bg-white/10"
                            }`}
                          >
                            {quizSet.label}
                          </button>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>

              <div className="mt-4 grid gap-2">
                {JLPT_MENU_SETS.map((quizSet) => (
                  <button
                    key={quizSet.id}
                    type="button"
                    onClick={() => changeQuizSet(quizSet.id)}
                    className={`rounded-2xl px-4 py-3 text-left font-black transition ${
                      selectedQuizSetId === quizSet.id
                        ? "bg-rose-400 text-stone-950"
                        : "bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {quizSet.label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex w-full flex-col gap-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr] lg:items-start">
                <div className="rounded-3xl bg-stone-950 p-6 text-white sm:p-8">
                  <p className="text-sm font-bold text-rose-300">準備開始</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                    挑戰 30 秒，
                    <br />
                    記熟日文常用讀音。
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-stone-300 sm:text-lg sm:leading-8">
                    每題會顯示一個日文漢字，例如「二日」。請從四個假名選項中選出正確讀音，
                    答對一題加 10 分。
                  </p>
                  <button
                    type="button"
                    onClick={startGame}
                    className="mt-6 rounded-full bg-rose-400 px-8 py-3 text-lg font-black text-stone-950 transition hover:bg-rose-300"
                  >
                    開始測驗
                  </button>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-rose-50 p-4">
                      <p className="text-sm font-bold text-rose-500">測驗時間</p>
                      <p className="mt-1 text-3xl font-black">00:30</p>
                    </div>
                    <div className="rounded-3xl bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-600">最高分</p>
                      <p className="mt-1 text-3xl font-black">{highScore}</p>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-stone-100 p-4">
                    <p className="text-sm font-bold text-stone-600">
                      目前範圍
                    </p>
                    <p className="mt-1 text-xl font-black sm:text-2xl">
                      {selectedQuizSet.label}
                    </p>
                    {canSwitchBasicActionRange && (
                      <label className="mt-4 block text-sm font-bold text-stone-600">
                        測驗方式
                        <select
                          value={selectedQuizSetId}
                          onChange={(event) => changeQuizSet(event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 font-black text-stone-950 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                        >
                          {BASIC_ACTION_RANGE_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      {selectedQuizSet.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-4xl border border-stone-200 bg-white/90 p-6 shadow-xl shadow-stone-300/30 sm:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-rose-500">
                      開始前複習
                    </p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      {selectedQuizSet.reviewTitle}
                    </h2>
                  </div>
                  <p className="text-sm text-stone-500">
                    看完後再按上方的開始測驗。
                  </p>
                </div>

                <div
                  className={`mt-4 grid gap-3 ${
                    selectedQuizSet.categoryGroup === "counter"
                      ? "grid-cols-1"
                      : "sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {reviewItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3"
                    >
                      <span className="font-black text-stone-900">
                        {getReviewPrimaryLabel(item, selectedQuizSet)}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-rose-500">
                          {getReviewSecondaryLabel(item, selectedQuizSet)}
                        </span>
                        {selectedQuizSet.categoryGroup !== "counter" && (
                          <button
                            type="button"
                            onClick={() => speakJapanese(item.kana)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-950 text-white transition hover:bg-rose-500"
                            aria-label={`${item.reading} 的發音`}
                          >
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M4 9.5V14.5H8L13 19V5L8 9.5H4Z"
                                fill="currentColor"
                              />
                              <path
                                d="M16 8.5C17.1 9.4 17.75 10.65 17.75 12C17.75 13.35 17.1 14.6 16 15.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M18.5 5.75C20.4 7.35 21.5 9.55 21.5 12C21.5 14.45 20.4 16.65 18.5 18.25"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 rounded-4xl border border-stone-200 bg-white/90 p-5 shadow-2xl shadow-stone-300/40 backdrop-blur sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl bg-stone-950 p-6 text-white sm:p-8">
              <div className="mb-6 flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={startGame}
                  className="rounded-full bg-rose-400 px-5 py-2 text-sm font-bold text-stone-950 transition hover:bg-rose-300"
                >
                  重新開始
                </button>
                <button
                  type="button"
                  onClick={returnHome}
                  className="rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-stone-950"
                >
                  返回首頁
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm font-bold text-stone-300">
                <span>剩餘時間</span>
                <span className="font-mono text-2xl text-white">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-10">
                <p className="text-sm font-bold text-rose-300">題目</p>
                <h2 className="mt-3 text-7xl font-black tracking-tight sm:text-8xl">
                  {question.prompt.reading}
                </h2>
                {selectedQuizSet.categoryGroup === "counter" && (
                  <p className="mt-4 text-lg font-bold text-rose-200">
                    選出這個名詞常用的助數詞
                  </p>
                )}
                {selectedQuizSet.quizType === "verbCollocation" && (
                  <p className="mt-4 text-lg font-bold text-rose-200">
                    選出最自然的動詞搭配
                  </p>
                )}
                {selectedQuizSet.quizType === "phraseCollocation" && (
                  <p className="mt-4 text-lg font-bold text-rose-200">
                    選出對應的日文延伸用法
                  </p>
                )}
                <p className="mt-5 min-h-7 text-lg text-stone-300">
                  {feedback}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-rose-50 p-5">
                  <p className="text-sm font-bold text-rose-500">目前分數</p>
                  <p className="mt-2 text-4xl font-black">{score}</p>
                </div>
                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="text-sm font-bold text-amber-600">最高分</p>
                  <p className="mt-2 text-4xl font-black">{highScore}</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="text-sm font-bold text-emerald-600">
                    答對數量
                  </p>
                  <p className="mt-2 text-4xl font-black">{correctCount}</p>
                </div>
                <div className="rounded-3xl bg-red-50 p-5">
                  <p className="text-sm font-bold text-red-500">答錯數量</p>
                  <p className="mt-2 text-4xl font-black">{wrongCount}</p>
                </div>
              </div>

              <div className="grid flex-1 gap-3">
                {question.options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!isPlaying}
                    onClick={() => answerQuestion(option)}
                    className="group flex items-center rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-lg font-black text-stone-700 group-hover:bg-rose-100 group-hover:text-rose-600">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-2xl font-black">
                        {getAnswerLabel(option)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {isGameOver && (
                <div className="rounded-3xl bg-stone-100 p-5">
                  <div className="text-center">
                    <p className="text-lg font-bold">遊戲結束</p>
                    <p className="mt-1 text-stone-600">
                    本次分數 {score} 分，答對 {correctCount} 題，答錯{" "}
                    {wrongCount} 題，最高分 {highScore} 分。
                    </p>
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={startGame}
                        className="rounded-full bg-stone-950 px-6 py-3 font-bold text-white transition hover:bg-rose-500"
                      >
                        再玩一次
                      </button>
                    </div>
                  </div>

                  {wrongAnswers.length > 0 && (
                    <div className="mt-5 rounded-2xl bg-white p-4 text-left">
                      <p className="font-bold text-stone-900">錯題解答</p>
                      <div className="mt-3 grid gap-2">
                        {wrongAnswers.map((wrongAnswer) => (
                          <div
                            key={wrongAnswer.id}
                            className="rounded-2xl bg-red-50 px-4 py-3"
                          >
                            <p className="font-black text-stone-900">
                              {wrongAnswer.reading}
                            </p>
                            <p className="mt-1 text-sm text-stone-600">
                              你的答案：{wrongAnswer.selectedKana} / 正確答案：
                              <span className="font-bold text-red-500">
                                {wrongAnswer.correctKana}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-3xl bg-white/70 p-5 text-sm leading-6 text-stone-600">
          <p className="font-bold text-stone-900">小提醒</p>
          <p>{getLearningTip(selectedQuizSet)}</p>
        </div>
      </section>
    </main>
  );
}
