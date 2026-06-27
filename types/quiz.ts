export type QuizItem = {
  id: string;
  reading: string;
  kana: string;
  optionLabel?: string;
  reviewLabel?: string;
};

export type QuizSet = {
  id: string;
  label: string;
  description: string;
  reviewTitle: string;
  items: QuizItem[];
  reviewItems?: QuizItem[];
  quizType?: "reading" | "verbCollocation" | "phraseCollocation";
  group?: "jlpt" | "category";
  categoryGroup?:
    | "noun"
    | "noun-number"
    | "verb"
    | "adjective"
    | "adverb"
    | "loanword"
    | "connector"
    | "pronoun"
    | "counter"
    | "interjection"
    | "other";
};

export type Question = {
  prompt: QuizItem;
  options: QuizItem[];
};

export type GameStatus = "ready" | "playing" | "ended";
