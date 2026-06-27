import type { Question, QuizItem, QuizSet } from "@/types/quiz";

export function shuffle<T>(items: T[]) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

export function getQuizSet(quizSets: QuizSet[], quizSetId: string) {
  return quizSets.find((quizSet) => quizSet.id === quizSetId) ?? quizSets[0];
}

export function createQuestion(items: QuizItem[], promptItem?: QuizItem): Question {
  const prompt = promptItem ?? items[Math.floor(Math.random() * items.length)];
  const hasOptionLabels = items.some((item) => item.optionLabel);
  const usedOptionLabels = new Set([prompt.optionLabel ?? prompt.kana]);
  const distractors = shuffle(
    items.filter((item) => {
      if (item.id === prompt.id) {
        return false;
      }

      if (!hasOptionLabels) {
        return true;
      }

      const optionLabel = item.optionLabel ?? item.kana;

      if (usedOptionLabels.has(optionLabel)) {
        return false;
      }

      usedOptionLabels.add(optionLabel);
      return true;
    }),
  ).slice(0, Math.min(3, items.length - 1));

  return {
    prompt,
    options: shuffle([prompt, ...distractors]),
  };
}
