import type { QuizSet } from "@/types/quiz";

const counterGroups = [
  {
    counter: "本",
    answer: "一本",
    kana: "いっぽん",
    nouns: ["傘", "鉛筆", "鍵", "ネクタイ", "橋", "道", "映画", "電話", "瓶", "木"],
  },
  {
    counter: "枚",
    answer: "一枚",
    kana: "いちまい",
    nouns: ["紙", "写真", "切符", "皿", "シャツ", "ハンカチ", "カード", "布団", "ドア", "窓"],
  },
  {
    counter: "冊",
    answer: "一冊",
    kana: "いっさつ",
    nouns: ["本", "雑誌", "ノート", "辞書", "漫画", "教科書", "手帳", "アルバム", "パンフレット", "カタログ"],
  },
  {
    counter: "台",
    answer: "一台",
    kana: "いちだい",
    nouns: ["車", "自転車", "パソコン", "テレビ", "冷蔵庫", "洗濯機", "エアコン", "コピー機", "カメラ", "ピアノ"],
  },
  {
    counter: "個",
    answer: "一個",
    kana: "いっこ",
    nouns: ["りんご", "卵", "箱", "石", "ボタン", "椅子", "時計", "かばん", "プレゼント", "問題"],
  },
  {
    counter: "杯",
    answer: "一杯",
    kana: "いっぱい",
    nouns: ["コーヒー", "お茶", "水", "ビール", "ジュース", "スープ", "ご飯", "味噌汁", "紅茶", "牛乳"],
  },
] as const;

const counterItems = counterGroups.flatMap((group) =>
  group.nouns.map((noun, index) => ({
    id: `counter-${group.counter}-${index + 1}`,
    reading: `一（　）${noun}`,
    kana: group.kana,
    optionLabel: group.answer,
  })),
);

const counterReviewItems = counterGroups.map((group) => ({
  id: `counter-review-${group.counter}`,
  reading: group.counter,
  kana: group.kana,
  optionLabel: group.answer,
  reviewLabel: group.nouns.join("、"),
}));

export const COUNTER_QUIZ_SETS: QuizSet[] = [
  {
    id: "counters-basic",
    label: "助數詞",
    description: "練習「一（　）名詞」應該搭配哪一個助數詞。",
    reviewTitle: "助數詞與常見名詞對應答案",
    group: "category",
    categoryGroup: "counter",
    items: counterItems,
    reviewItems: counterReviewItems,
  },
];
