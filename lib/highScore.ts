const HIGH_SCORE_KEY_PREFIX = "japanese-reading-quiz-high-score";

export const HIGH_SCORE_CHANGED_EVENT =
  "japanese-reading-quiz-high-score-changed";

function getHighScoreKey(quizSetId: string) {
  return `${HIGH_SCORE_KEY_PREFIX}:${quizSetId}`;
}

export function getStoredHighScore(quizSetId: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedHighScore = Number(
    window.localStorage.getItem(getHighScoreKey(quizSetId)),
  );

  return Number.isFinite(storedHighScore) ? storedHighScore : 0;
}

export function subscribeToHighScoreChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(HIGH_SCORE_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(HIGH_SCORE_CHANGED_EVENT, onStoreChange);
  };
}

export function saveHighScore(score: number, quizSetId: string) {
  const nextHighScore = Math.max(getStoredHighScore(quizSetId), score);
  window.localStorage.setItem(getHighScoreKey(quizSetId), String(nextHighScore));
  window.dispatchEvent(new Event(HIGH_SCORE_CHANGED_EVENT));
}
